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

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' });

    const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (caller?.role !== 'teacher') return json({ error: 'Chỉ giáo viên mới được dùng chức năng này' });

    const body = await req.json().catch(() => ({}));
    const { action, name, schoolId } = body;

    if (action === 'list') {
      const { data, error } = await admin.from('schools').select('id, name').order('name');
      if (error) return json({ error: error.message });
      return json({ schools: data });
    }

    if (action === 'create') {
      if (!name?.trim()) return json({ error: 'Tên trường không được để trống' });
      const { error } = await admin.from('schools').insert({ name: name.trim() });
      if (error) return json({ error: error.code === '23505' ? 'Tên trường đã tồn tại' : error.message });
      return json({ success: true });
    }

    if (action === 'update') {
      if (!schoolId) return json({ error: 'Thiếu schoolId' });
      if (!name?.trim()) return json({ error: 'Tên trường không được để trống' });

      // profiles.school stores the school NAME as free text (no FK) — read the
      // old name first so the rename can cascade into every profile row.
      const { data: oldSchool } = await admin.from('schools').select('name').eq('id', schoolId).single();

      const { error } = await admin.from('schools').update({ name: name.trim() }).eq('id', schoolId);
      if (error) return json({ error: error.code === '23505' ? 'Tên trường đã tồn tại' : error.message });

      if (oldSchool?.name && oldSchool.name !== name.trim()) {
        await admin.from('profiles').update({ school: name.trim() }).eq('school', oldSchool.name);
      }

      return json({ success: true });
    }

    if (action === 'delete') {
      if (!schoolId) return json({ error: 'Thiếu schoolId' });
      // profiles.school stores the school NAME as free text (no FK) — must
      // clear by name, not schoolId, or orphaned rows never get cleaned up.
      const { data: school } = await admin.from('schools').select('name').eq('id', schoolId).single();
      if (school?.name) {
        await admin.from('profiles').update({ school: null }).eq('school', school.name);
      }
      const { error } = await admin.from('schools').delete().eq('id', schoolId);
      if (error) return json({ error: error.message });
      return json({ success: true });
    }

    return json({ error: 'Action không hợp lệ' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: 'Lỗi server: ' + msg });
  }
});
