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
    if (providedSecret !== WEBHOOK_SECRET) {
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

    // Use live exam required_amount
    const liveRequired: number =
      (matchedPurchase.exams as { required_amount?: number } | null)?.required_amount
      ?? (matchedPurchase.required_amount as number)
      ?? 100000;

    const newPaid   = ((matchedPurchase.paid_amount as number) || 0) + amount;
    const newStatus = newPaid >= liveRequired ? 'SUCCESS' : 'PARTIAL';
    const remaining = Math.max(0, liveRequired - newPaid);

    // Update purchase status
    const { error: updateErr } = await admin.from('purchases').update({
      paid_amount: newPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', matchedPurchase.id);

    if (updateErr) {
      console.error('[sepay-webhook] Update error:', updateErr.message);
      return json({ error: updateErr.message }, 500);
    }

    // Log to payment_history
    await admin.from('payment_history').insert({
      purchase_id: matchedPurchase.id,
      amount,
      note: `[AUTO] SePay - ${body.gateway || 'Bank'} - ${body.transactionDate || new Date().toISOString()} - ${body.referenceCode || ''}`,
      recorded_by: null,
      payment_time: new Date().toISOString(),
    });

    console.log(`[sepay-webhook] Updated ${matchedPurchase.id}: paid=${newPaid}, status=${newStatus}, required=${liveRequired}`);

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
