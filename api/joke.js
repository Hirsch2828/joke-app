const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

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

    // Report only yes/no, never the key itself
    const keyStatus = process.env.OPENAI_API_KEY ? 'נמצא' : 'חסר';
    console.log(`joke request: topic="${topic}" key=${keyStatus}`);

    return json({
      joke: `בדיחה זמנית מהשרת: ${topic || 'בלי נושא'}. המפתח: ${keyStatus}`,
    });
  },
};
