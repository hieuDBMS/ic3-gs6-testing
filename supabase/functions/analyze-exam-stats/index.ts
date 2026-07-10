import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildVietnamesePrompt(filters: unknown, distribution: unknown, breakdown: unknown) {
  return `Bạn là trợ lý phân tích giáo dục cho một nền tảng luyện thi IC3. Dựa trên dữ liệu đã lọc: ${JSON.stringify(filters)}, phân bố điểm (theo khoảng 10 điểm): ${JSON.stringify(distribution)}, và phân tích theo nhóm (lớp/trường/level): ${JSON.stringify(breakdown)} — hãy viết một đoạn nhận xét ngắn gọn (3-5 câu) bằng tiếng Việt, nêu bật xu hướng đáng chú ý (ví dụ nhóm nào yếu hơn, tỉ lệ đạt thế nào) và đề xuất hành động cụ thể cho giáo viên. Không dùng markdown, không liệt kê lại số liệu thô, chỉ viết văn xuôi tự nhiên.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) return json({ error: 'unauthorized' }, 401);

    const { data: profile } = await callerClient
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'teacher') return json({ error: 'forbidden' }, 403);

    const { filters, distribution, breakdown } = await req.json();
    const prompt = buildVietnamesePrompt(filters, distribution, breakdown);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) return json({ error: 'AI chưa được cấu hình (thiếu GEMINI_API_KEY)' }, 500);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return json({ error: 'Không thể gọi dịch vụ AI lúc này' }, 502);
    }

    const geminiJson = await geminiRes.json();
    const insight = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    return json({ insight });
  } catch (e) {
    console.error('analyze-exam-stats error:', e);
    return json({ error: 'Đã có lỗi xảy ra' }, 500);
  }
});
