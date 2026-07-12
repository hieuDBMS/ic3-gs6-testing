import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, account_source')
      .eq('id', user.id)
      .single();

    const isTeacher = callerProfile?.role === 'teacher';

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── CREATE PURCHASE INTENT ──────────────────────────────────────
    if (action === 'create') {
      const { examId } = body;
      if (!examId) return json({ error: 'Thieu examId' });

      if (callerProfile?.account_source !== 'SELF') {
        return json({ error: 'Tai khoan nay khong can thanh toan' });
      }

      // Fetch live required_amount
      const { data: examRow } = await admin
        .from('exams').select('required_amount').eq('id', examId).single();
      const liveRequired = examRow?.required_amount ?? 100000;

      // Always check for existing purchase first (using service role so no RLS issue)
      const { data: existing } = await admin
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .maybeSingle();

      if (existing?.status === 'SUCCESS') {
        return json({ error: 'Ban da mua bai thi nay roi', alreadyPurchased: true });
      }

      const shortUser = user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
      const shortExam = examId.replace(/-/g, '').substring(0, 8).toUpperCase();
      const ts = Date.now().toString(36).toUpperCase();
      const transactionCode = `PAY_IC3_${shortUser}_${shortExam}_${ts}`;

      if (existing) {
        // Update existing: refresh transaction code + live price (keep paid_amount & status)
        const { data: updated, error: updErr } = await admin
          .from('purchases')
          .update({
            transaction_code: transactionCode,
            required_amount: liveRequired,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select().single();
        if (updErr) return json({ error: updErr.message });
        return json({ success: true, purchase: updated });
      }

      // Attempt INSERT — handle potential race condition
      const { data: purchase, error: insErr } = await admin
        .from('purchases')
        .insert({
          user_id: user.id,
          exam_id: examId,
          required_amount: liveRequired,
          paid_amount: 0,
          status: 'PENDING',
          transaction_code: transactionCode,
        })
        .select().single();

      if (insErr) {
        // Handle duplicate key race condition: another concurrent request already inserted
        if (insErr.code === '23505') {
          const { data: fallback } = await admin
            .from('purchases')
            .select('*')
            .eq('user_id', user.id)
            .eq('exam_id', examId)
            .single();
          if (fallback) return json({ success: true, purchase: fallback });
        }
        return json({ error: insErr.message });
      }

      return json({ success: true, purchase });
    }

    // ── CANCEL PURCHASE ─────────────────────────────────────────────
    if (action === 'cancel') {
      const { purchaseId } = body;
      if (!purchaseId) return json({ error: 'Thieu purchaseId' });

      const { data: purchase } = await admin
        .from('purchases').select('*').eq('id', purchaseId).single();
      if (!purchase) return json({ error: 'Khong tim thay giao dich' });

      if (!isTeacher && purchase.user_id !== user.id)
        return json({ error: 'Khong co quyen huy giao dich nay' }, 403);

      if (purchase.status === 'SUCCESS')
        return json({ error: 'Khong the huy giao dich da thanh cong' });

      await admin.from('payment_history').delete().eq('purchase_id', purchaseId);
      const { error: delErr } = await admin.from('purchases').delete().eq('id', purchaseId);
      if (delErr) return json({ error: delErr.message });

      return json({ success: true });
    }

    // ── TEACHER CREATE ──────────────────────────────────────────────
    if (action === 'teacher-create') {
      if (!isTeacher) return json({ error: 'Chi giao vien' }, 403);

      const { userId, examId, amount, note } = body;
      if (!userId || !examId || !amount) return json({ error: 'Thieu userId, examId hoac amount' });

      const { data: examRow } = await admin
        .from('exams').select('required_amount').eq('id', examId).single();
      const liveRequired = examRow?.required_amount ?? 100000;

      const { data: existing } = await admin
        .from('purchases').select('id, status, paid_amount, required_amount')
        .eq('user_id', userId).eq('exam_id', examId).maybeSingle();

      let purchaseId: string;

      if (existing?.status === 'SUCCESS') {
        purchaseId = existing.id;
      } else if (existing) {
        purchaseId = existing.id;
      } else {
        const shortUser = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
        const shortExam = examId.replace(/-/g, '').substring(0, 8).toUpperCase();
        const ts = Date.now().toString(36).toUpperCase();
        const transactionCode = `PAY_IC3_${shortUser}_${shortExam}_${ts}`;

        const { data: newPurchase, error: insErr } = await admin
          .from('purchases')
          .insert({
            user_id: userId, exam_id: examId,
            required_amount: liveRequired, paid_amount: 0,
            status: 'PENDING', transaction_code: transactionCode,
          })
          .select().single();
        if (insErr) return json({ error: insErr.message });
        purchaseId = newPurchase.id;
      }

      const { data: p } = await admin.from('purchases').select('*').eq('id', purchaseId).single();
      if (!p) return json({ error: 'Khong tim thay purchase' });

      const newPaid   = p.paid_amount + amount;
      const newStatus = newPaid >= liveRequired ? 'SUCCESS' : 'PARTIAL';

      await admin.from('purchases').update({
        paid_amount: newPaid, status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', purchaseId);

      await admin.from('payment_history').insert({
        purchase_id: purchaseId, amount,
        note: note || null, recorded_by: user.id,
        payment_time: new Date().toISOString(),
      });

      return json({ success: true, newStatus, newPaid, remaining: Math.max(0, liveRequired - newPaid), unlocked: newStatus === 'SUCCESS' });
    }

    // ── LIST OWN (student) ──────────────────────────────────────────
    if (action === 'list-mine') {
      const { data: purchases, error } = await admin
        .from('purchases').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return json({ error: error.message });

      const examIds = [...new Set((purchases || []).map((p: { exam_id: string }) => p.exam_id))];
      let examsMap: Record<string, unknown> = {};
      if (examIds.length > 0) {
        const { data: exams } = await admin.from('exams').select('id, title, exam_type, exam_number, required_amount').in('id', examIds);
        for (const e of (exams || [])) examsMap[(e as { id: string }).id] = e;
      }

      const enriched = (purchases || []).map((p: Record<string, unknown>) => ({
        ...p, exams: examsMap[p.exam_id as string] || null,
      }));

      return json({ success: true, purchases: enriched });
    }

    // ── LIST ALL (teacher only) ─────────────────────────────────────
    if (action === 'list-all') {
      if (!isTeacher) return json({ error: 'Chi giao vien moi duoc xem' }, 403);

      const { data: purchases, error } = await admin
        .from('purchases').select('*').order('created_at', { ascending: false });
      if (error) return json({ error: error.message });
      if (!purchases || purchases.length === 0) return json({ success: true, purchases: [] });

      const userIds = [...new Set(purchases.map((p: { user_id: string }) => p.user_id))];
      const examIds = [...new Set(purchases.map((p: { exam_id: string }) => p.exam_id))];

      const [profilesRes, examsRes] = await Promise.all([
        admin.from('profiles').select('id, full_name, email, account_source, role').in('id', userIds),
        admin.from('exams').select('id, title, exam_type, exam_number, required_amount').in('id', examIds),
      ]);

      const profilesMap: Record<string, unknown> = {};
      for (const p of (profilesRes.data || [])) profilesMap[(p as { id: string }).id] = p;

      const examsMap: Record<string, unknown> = {};
      for (const e of (examsRes.data || [])) examsMap[(e as { id: string }).id] = e;

      const enriched = purchases.map((p: Record<string, unknown>) => ({
        ...p,
        profiles: profilesMap[p.user_id as string] || null,
        exams:    examsMap[p.exam_id as string]    || null,
      }));

      return json({ success: true, purchases: enriched });
    }

    // ── CONFIRM PAYMENT (teacher) ────────────────────────────────────
    if (action === 'confirm') {
      if (!isTeacher) return json({ error: 'Chi giao vien moi duoc xac nhan thanh toan' }, 403);

      const { purchaseId, amount, note } = body;
      if (!purchaseId || !amount || amount <= 0)
        return json({ error: 'Thieu purchaseId hoac so tien khong hop le' });

      const { data: purchase } = await admin
        .from('purchases')
        .select('*, exams(required_amount)')
        .eq('id', purchaseId)
        .single();
      if (!purchase) return json({ error: 'Khong tim thay giao dich' });
      if (purchase.status === 'SUCCESS') return json({ error: 'Giao dich nay da thanh cong roi' });

      const liveRequired = (purchase.exams as { required_amount?: number } | null)?.required_amount
        ?? purchase.required_amount;

      const newPaid   = purchase.paid_amount + amount;
      const newStatus = newPaid >= liveRequired ? 'SUCCESS' : 'PARTIAL';
      const remaining = Math.max(0, liveRequired - newPaid);

      await admin.from('purchases').update({
        paid_amount: newPaid, status: newStatus, updated_at: new Date().toISOString(),
      }).eq('id', purchaseId);

      await admin.from('payment_history').insert({
        purchase_id: purchaseId, amount, note: note || null,
        recorded_by: user.id, payment_time: new Date().toISOString(),
      });

      return json({ success: true, newStatus, newPaid, remaining, unlocked: newStatus === 'SUCCESS' });
    }

    // ── STATUS (student) ─────────────────────────────────────────────
    if (action === 'status') {
      const { examId } = body;
      if (!examId) return json({ error: 'Thieu examId' });
      const { data } = await admin.from('purchases').select('*')
        .eq('user_id', user.id).eq('exam_id', examId).maybeSingle();
      return json({ success: true, purchase: data || null });
    }

    // ── HISTORY ──────────────────────────────────────────────────────
    if (action === 'history') {
      const { purchaseId } = body;
      if (!purchaseId) return json({ error: 'Thieu purchaseId' });
      const { data, error } = await admin.from('payment_history').select('*')
        .eq('purchase_id', purchaseId).order('payment_time', { ascending: true });
      if (error) return json({ error: error.message });
      return json({ success: true, history: data });
    }

    return json({ error: 'Action khong hop le' });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[manage-purchase]', msg);
    return json({ error: 'Loi server: ' + msg });
  }
});
