export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  // Action: fetch a URL server-side (bypasses CORS)
  if (action === 'fetch') {
    const { url } = body;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      
      const html = await res.text();
      
      // If we got a very short response it's probably a block page
      if (html.length < 500) {
        return Response.json({ error: 'blocked', html: '' }, { status: 200 });
      }
      
      return Response.json({ html, ok: true });
    } catch (e: any) {
      return Response.json({ error: e.message || 'fetch_failed' }, { status: 200 });
    }
  }

  // Action: parse recipe from HTML using Claude
  if (action === 'parse') {
    const { html } = body;
    
    const stripped = (html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Extract the recipe from this webpage text and return ONLY valid JSON, nothing else, no markdown.

If no recipe found: {"error":"not_a_recipe"}

If recipe found:
{"name":"recipe name","time":"30 min","difficulty":"Easy","category":"Italian","ingredients":["200g pasta","1 onion"],"steps":[{"title":"Cook","body":"rewrite step in your own words","timer":0}],"tip":"one helpful tip in your own words"}

Text: ${stripped}`
        }]
      }),
    });

    const data = await response.json();
    return Response.json(data);
  }

  return Response.json({ error: 'unknown_action' }, { status: 400 });
}