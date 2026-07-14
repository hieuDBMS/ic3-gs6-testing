import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * sepay-webhook
 * Receives webhook from SePay when a bank transfer is detected.
 * Matches by stripping all non-alphanumeric chars from both content and transaction code.
 * This handles MB Bank removing underscores/spaces from transfer content.
 */

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Avoids leaking SEPAY_WEBHOOK_SECRET one byte at a time via response-time
// side channel — a naive `!==` short-circuits on the first mismatched byte.
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sepay-signature',
      },
    });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const WEBHOOK_SECRET = Deno.env.get('SEPAY_WEBHOOK_SECRET') || '';

    // Fail closed: this endpoint marks purchases as PAID with no other auth
    // check (verify_jwt is off so anyone can call it). Without a configured
    // secret there is nothing stopping a self-registered student from POSTing
    // a fake "transferType: in" payload containing their own transaction_code
    // to unlock a paid exam for free — so refuse to run at all rather than
    // silently skip verification like the previous version did.
    if (!WEBHOOK_SECRET) {
      console.error('[sepay-webhook] SEPAY_WEBHOOK_SECRET is not configured — refusing all requests');
      return json({ error: 'Webhook not configured' }, 500);
    }

    // SePay sends the configured API key as `Authorization: Apikey <key>`
    // (some setups use `Bearer <key>` instead) — strip either prefix.
    const rawAuth = req.headers.get('x-sepay-signature') || req.headers.get('authorization') || '';
    const providedSecret = rawAuth.replace(/^(Bearer|Apikey)\s+/i, '').trim();
    if (!timingSafeEqual(providedSecret, WEBHOOK_SECRET)) {
      console.warn('[sepay-webhook] Invalid signature');
      return json({ error: 'Unauthorized' }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    console.log('[sepay-webhook] received:', JSON.stringify(body));

    // Only process incoming transfers
    if (body.transferType !== 'in') {
      return json({ success: true, message: 'Skipped: outgoing transfer' });
    }

    const content: string = (body.content || body.description || body.transferDescription || '').toString();
    const amount: number = Number(body.transferAmount) || 0;

    console.log('[sepay-webhook] content:', content, 'amount:', amount);

    if (!content || amount <= 0) {
      return json({ success: true, message: 'Skipped: no content or zero amount' });
    }

    // Normalize content: uppercase, remove ALL non-alphanumeric chars
    // This handles: underscore removal, spaces, slashes, dots, etc by MB Bank and others
    const normalizedContent = content.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    console.log('[sepay-webhook] normalizedContent:', normalizedContent);

    // Quick check: must contain 'IC3' to be our transaction
    if (!normalizedContent.includes('IC3')) {
      console.log('[sepay-webhook] No IC3 keyword found, skipping');
      return json({ success: true, message: 'No IC3 keyword in content' });
    }

    // Fetch all pending/partial purchases (small table, safe to scan)
    const { data: candidates, error: fetchErr } = await admin
      .from('purchases')
      .select('*, exams(required_amount, title)')
      .in('status', ['PENDING', 'PARTIAL']);

    if (fetchErr) {
      console.error('[sepay-webhook] Fetch error:', fetchErr.message);
      return json({ error: fetchErr.message }, 500);
    }

    if (!candidates || candidates.length === 0) {
      console.log('[sepay-webhook] No pending purchases found');
      return json({ success: true, message: 'No pending purchases' });
    }

    // Find matching purchase by normalizing BOTH sides
    let matchedPurchase: Record<string, unknown> | null = null;
    for (const p of candidates) {
      const normalizedCode = (p.transaction_code as string || '')
        .replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (normalizedContent.includes(normalizedCode)) {
        matchedPurchase = p;
        console.log('[sepay-webhook] Matched purchase:', p.id, 'code:', p.transaction_code);
        break;
      }
    }

    if (!matchedPurchase) {
      console.log('[sepay-webhook] No matching purchase for content:', normalizedContent);
      return json({ success: true, message: 'No matching purchase found' });
    }

    if (matchedPurchase.status === 'SUCCESS') {
      console.log('[sepay-webhook] Purchase already SUCCESS:', matchedPurchase.id);
      return json({ success: true, message: 'Already unlocked' });
    }

    // Idempotency guard: SePay (or a network retry on our end) can redeliver
    // the same transfer notification more than once. Without this, a PARTIAL
    // purchase would have `amount` re-added on every redelivery, eventually
    // crossing required_amount and unlocking an exam that was only paid once.
    // referenceCode is the bank's own transfer id — stable across redeliveries
    // of the same real-world transfer — recorded in payment_history.note below.
    const refCode = String(body.referenceCode || body.id || '').trim();
    if (refCode.length >= 4) {
      const escapedRef = refCode.replace(/[%_\\]/g, (c) => `\\${c}`);
      const { data: dup } = await admin
        .from('payment_history')
        .select('id')
        .eq('purchase_id', matchedPurchase.id)
        .ilike('note', `%${escapedRef}%`)
        .limit(1)
        .maybeSingle();
      if (dup) {
        console.log('[sepay-webhook] Duplicate delivery, already recorded:', refCode);
        return json({ success: true, message: 'Duplicate webhook delivery (already recorded)' });
      }
    }

    const note = `[AUTO] SePay - ${body.gateway || 'Bank'} - ${body.transactionDate || new Date().toISOString()} - ${body.referenceCode || ''}`;

    // record_purchase_payment locks the purchases row (SELECT ... FOR
    // UPDATE) and re-adds paid_amount atomically, re-reading the live
    // exams.required_amount itself — a plain read-then-write here could
    // race with a teacher's manual "Confirm" on the same purchase at the
    // same moment and silently lose one of the two payments.
    const { data: result, error: payErr } = await admin.rpc('record_purchase_payment', {
      p_purchase_id: matchedPurchase.id, p_amount: amount, p_note: note, p_recorded_by: null,
    });

    if (payErr) {
      console.error('[sepay-webhook] record_purchase_payment error:', payErr.message);
      return json({ error: payErr.message }, 500);
    }

    const { newStatus, newPaid, remaining } = result as { newStatus: string; newPaid: number; remaining: number };
    console.log(`[sepay-webhook] Updated ${matchedPurchase.id}: paid=${newPaid}, status=${newStatus}`);

    return json({
      success: true,
      purchaseId: matchedPurchase.id,
      transactionCode: matchedPurchase.transaction_code,
      newStatus,
      newPaid,
      remaining,
      unlocked: newStatus === 'SUCCESS',
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sepay-webhook] Error:', msg);
    return json({ error: msg }, 500);
  }
});
