const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const INSTRUCTIONS =
  'אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה.';

// Pull the joke text from a Responses API payload
function extractText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data.output ?? []) {
    if (item.type !== 'message') continue;
    for (const c of item.content ?? []) if (c.type === 'output_text') parts.push(c.text);
  }
  return parts.join('').trim();
}

// Map an OpenAI error to a short Hebrew message for the page
function hebrewError(status, err) {
  const code = err?.code ?? '';
  const type = err?.type ?? '';
  if (status === 401) return 'המפתח לא תקין';
  if (code === 'credit_balance_exhausted' || type === 'insufficient_quota' || code === 'insufficient_quota')
    return 'נגמר הקרדיט בחשבון OpenAI';
  if (code.endsWith('spend_limit_exceeded') || code === 'billing_hard_limit_reached')
    return 'הגענו למגבלת ההוצאה החודשית';
  if (status === 429) return 'יותר מדי בקשות. נסו שוב בעוד רגע.';
  if (status === 404) return 'המודל לא נמצא. כדאי לבדוק את OPENAI_MODEL';
  return 'משהו השתבש. נסו שוב.';
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'אפשר לבקש בדיחה רק בשליחת POST.' }, 405);
    }

    // A broken body counts as "no topic"
    let topic = '';
    try {
      const body = await request.json();
      if (typeof body?.topic === 'string') topic = body.topic.trim().slice(0, 100);
    } catch {}

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return json({ error: 'חסר מפתח בשרת' }, 500);
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5';
    console.log(`joke request: topic="${topic}" model=${model}`);

    let res;
    try {
      res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          instructions: INSTRUCTIONS,
          input: topic ? `נושא הבדיחה: ${topic}` : 'אין נושא. ספר בדיחה כללית על החיים.',
          reasoning: { effort: 'low' },
          max_output_tokens: 3000, // includes hidden reasoning tokens
        }),
      });
    } catch (e) {
      console.error('OpenAI network error:', e.message);
      return json({ error: 'אין חיבור ל-OpenAI כרגע. נסו שוב.' }, 502);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`OpenAI error: status=${res.status} code=${data.error?.code} type=${data.error?.type}`);
      return json({ error: hebrewError(res.status, data.error) }, 502);
    }

    const joke = extractText(data);
    if (!joke) {
      console.error(`OpenAI returned no text: status=${data.status} reason=${data.incomplete_details?.reason}`);
      return json({ error: 'משהו השתבש. נסו שוב.' }, 502);
    }

    return json({ joke });
  },
};
