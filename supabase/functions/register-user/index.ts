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

// Verifies a Turnstile token with Cloudflare's siteverify endpoint.
// Only enforced when TURNSTILE_SECRET_KEY is configured, so local/dev
// deployments without a Cloudflare site keep working unchanged.
async function verifyTurnstile(token: string | undefined, remoteIp: string | null): Promise<string | null> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return null;
  if (!token) return 'Vui long hoan thanh xac minh CAPTCHA';

  const form = new URLSearchParams();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const outcome = await res.json();
  if (!outcome.success) return 'Xac minh CAPTCHA khong hop le, vui long thu lai';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { username, password, fullName, turnstileToken } = body;

    if (!username || !password || !fullName) {
      return json({ error: 'Can dien du: ten dang nhap, mat khau, ho va ten' });
    }
    if (username.length < 4) {
      return json({ error: 'Ten dang nhap phai co it nhat 4 ky tu' });
    }
    if (password.length < 6) {
      return json({ error: 'Mat khau phai co it nhat 6 ky tu' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return json({ error: 'Ten dang nhap chi duoc chua chu cai, so va dau gach duoi' });
    }

    // Rate limit by IP (5 registrations/hour by default) — independent of
    // CAPTCHA, which is a no-op whenever TURNSTILE_SECRET_KEY isn't set (see
    // verifyTurnstile above). admin.auth.admin.createUser below deliberately
    // bypasses Supabase Auth's own signup rate-limit, so without this a
    // script can mass-create accounts with nothing else in the way.
    const remoteIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const { data: allowed, error: rlErr } = await admin.rpc('check_and_record_registration_attempt', { p_ip: remoteIp });
    if (rlErr) {
      console.error('[register-user] rate limit check failed:', rlErr.message);
    } else if (!allowed) {
      return json({ error: 'Ban da dang ky qua nhieu lan. Vui long thu lai sau 1 gio.' });
    }

    const captchaError = await verifyTurnstile(turnstileToken, req.headers.get('cf-connecting-ip'));
    if (captchaError) {
      return json({ error: captchaError });
    }

    const email = `${username.toLowerCase()}@ic3fighter.local`;

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return json({ error: 'Ten dang nhap da ton tai. Vui long chon ten khac.' });
    }

    const { data: authData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    });

    if (createErr || !authData?.user) {
      return json({ error: createErr?.message ?? 'Khong tao duoc tai khoan' });
    }

    const { error: insertErr } = await admin.from('profiles').insert({
      id:             authData.user.id,
      email,
      full_name:      fullName,
      role:           'student',
      account_source: 'SELF',
      is_active:      true,
    });

    if (insertErr) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return json({ error: insertErr.message });
    }

    return json({ success: true });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[register-user]', msg);
    return json({ error: 'Loi server: ' + msg });
  }
});
