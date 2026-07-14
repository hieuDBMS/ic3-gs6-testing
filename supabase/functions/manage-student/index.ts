import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller JWT
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' });

    // Verify caller is teacher
    const { data: caller } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (caller?.role !== 'teacher')
      return json({ error: 'Chi giao vien moi duoc dung chuc nang nay' });

    const body = await req.json().catch(() => ({}));
    const { action, email, password, fullName, studentId, school, className, attemptId } = body;

    // ── CREATE ────────────────────────────────────────────
    if (action === 'create') {
      if (!email || !password || !fullName)
        return json({ error: 'Can dien du: ho ten, email, mat khau' });
      if (password.length < 6)
        return json({ error: 'Mat khau phai co it nhat 6 ky tu' });

      const { data: authData, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !authData?.user)
        return json({ error: createErr?.message ?? 'Khong tao duoc tai khoan' });

      const { error: insertErr } = await admin.from('profiles').insert({
        id:             authData.user.id,
        email,
        full_name:      fullName,
        role:           'student',
        account_source: 'ADMIN',   // admin-created: full access
        created_by:     user.id,
        is_active:      true,
        school:         school || null,
        class_name:     className || null,
      });

      if (insertErr) {
        await admin.auth.admin.deleteUser(authData.user.id);
        return json({ error: insertErr.message });
      }

      return json({ success: true });
    }

    // ── UPDATE (school / class_name / fullName) ─────────────────
    if (action === 'update') {
      if (!studentId) return json({ error: 'Thieu studentId' });

      const { data: target } = await admin
        .from('profiles')
        .select('role')
        .eq('id', studentId)
        .single();
      if (target?.role === 'teacher')
        return json({ error: 'Khong the sua tai khoan giao vien' });

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fullName  !== undefined) updates.full_name  = fullName;
      if (school    !== undefined) updates.school     = school    || null;
      if (className !== undefined) updates.class_name = className || null;

      const { error: updateErr } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', studentId);
      if (updateErr) return json({ error: updateErr.message });

      return json({ success: true });
    }

    // ── TOGGLE ACTIVE ───────────────────────────────────────
    if (action === 'toggle-active') {
      if (!studentId) return json({ error: 'Thieu studentId' });
      const { data: target } = await admin
        .from('profiles').select('role, is_active').eq('id', studentId).single();
      if (target?.role === 'teacher') return json({ error: 'Khong the khoa tai khoan giao vien' });
      const { error: togErr } = await admin.from('profiles')
        .update({ is_active: !target?.is_active, updated_at: new Date().toISOString() })
        .eq('id', studentId);
      if (togErr) return json({ error: togErr.message });
      return json({ success: true, is_active: !target?.is_active });
    }

    // ── DELETE (cascade) ────────────────────────────────────────
    if (action === 'delete') {
      if (!studentId) return json({ error: 'Thieu studentId' });

      const { data: target } = await admin
        .from('profiles')
        .select('role')
        .eq('id', studentId)
        .single();
      if (target?.role === 'teacher')
        return json({ error: 'Khong the xoa tai khoan giao vien' });

      const { data: attempts } = await admin
        .from('exam_attempts')
        .select('id')
        .eq('user_id', studentId);

      if (attempts && attempts.length > 0) {
        const ids = attempts.map((a: { id: string }) => a.id);
        await admin.from('attempt_answers').delete().in('attempt_id', ids);
      }

      await admin.from('exam_attempts').delete().eq('user_id', studentId);
      await admin.from('payment_history').delete().in(
        'purchase_id',
        (await admin.from('purchases').select('id').eq('user_id', studentId)).data?.map((p: {id: string}) => p.id) ?? []
      );
      await admin.from('purchases').delete().eq('user_id', studentId);
      await admin.from('profiles').delete().eq('id', studentId);
      await admin.auth.admin.deleteUser(studentId);

      return json({ success: true });
    }

    // ── CLEAR ATTEMPT HISTORY (1 user, student hoac teacher) ────
    // Loai tru status='in_progress': khong xoa mat session dang thi dang dien
    // ra cua chinh hoc sinh nay (xoa "lich su" khong nen huy ca bai dang lam).
    if (action === 'clear-attempts') {
      if (!studentId) return json({ error: 'Thieu studentId' });

      const { count, error: countErr } = await admin
        .from('exam_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .neq('status', 'in_progress');
      if (countErr) return json({ error: countErr.message });

      // attempt_answers + exam_cheat_events cascade tu dong (ON DELETE CASCADE)
      const { error: delErr } = await admin.from('exam_attempts')
        .delete()
        .eq('user_id', studentId)
        .neq('status', 'in_progress');
      if (delErr) return json({ error: delErr.message });

      return json({ success: true, deletedCount: count ?? 0 });
    }

    // ── DELETE 1 ATTEMPT (mot dong lich su duy nhat) ────────────
    if (action === 'delete-attempt') {
      if (!attemptId) return json({ error: 'Thieu attemptId' });

      // attempt_answers + exam_cheat_events cascade tu dong (ON DELETE CASCADE)
      const { error: delErr, count } = await admin
        .from('exam_attempts')
        .delete({ count: 'exact' })
        .eq('id', attemptId);
      if (delErr) return json({ error: delErr.message });
      if (!count) return json({ error: 'Khong tim thay lich su lam bai nay' });

      return json({ success: true });
    }

    // ── CLEAR ALL ATTEMPT HISTORY (toan he thong) ───────────────
    // Loai tru status='in_progress': khong xoa cac session dang thi dang
    // dien ra cua BAT KY hoc sinh nao ngay luc bam nut nay (co the co hang
    // chuc em dang lam bai cung luc).
    if (action === 'clear-all-attempts') {
      const { count, error: countErr } = await admin
        .from('exam_attempts')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'in_progress');
      if (countErr) return json({ error: countErr.message });

      const { error: delErr } = await admin
        .from('exam_attempts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .neq('status', 'in_progress');
      if (delErr) return json({ error: delErr.message });

      return json({ success: true, deletedCount: count ?? 0 });
    }

    // ── RESET PASSWORD ────────────────────────────────────────
    if (action === 'reset-password') {
      if (!studentId || !password) return json({ error: 'Thieu studentId hoac mat khau' });
      if (password.length < 6) return json({ error: 'Mat khau phai co it nhat 6 ky tu' });
      const { data: target } = await admin
        .from('profiles').select('role').eq('id', studentId).single();
      if (target?.role === 'teacher') return json({ error: 'Khong the doi mat khau giao vien' });
      const { error: resetErr } = await admin.auth.admin.updateUserById(studentId, { password });
      if (resetErr) return json({ error: resetErr.message });
      return json({ success: true });
    }

    return json({ error: 'Action khong hop le' });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[manage-student]', msg);
    return json({ error: 'Loi server: ' + msg });
  }
});
