export async function POST(request: Request) {
  const { url, action } = await request.json();

  // Action: fetch a URL server-side (bypasses CORS)
  if (action === 'fetch') {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      return Response.json({ html, ok: res.ok });
    } catch (e) {
      return Response.json({ error: 'fetch_failed' }, { status: 400 });
    }
  }

  // Action: call Anthropic API
  if (action === 'parse') {
    const { html } = await request.json().catch(() => ({ html: '' }));
    
    // Strip HTML to text
    const stripped = (html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
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
          content: `Extract the recipe from this webpage text and return ONLY a JSON object with no other text, no markdown, no backticks.

If this is not a recipe page, return: {"error":"not_a_recipe"}

If it is a recipe, return:
{
  "name": "recipe name",
  "time": "total time e.g. 30 min or 1 hr",
  "difficulty": "Easy or Medium or Hard",
  "category": "one of: Italian, Asian, Japanese, Indian, Mexican, Mediterranean, Healthy, Baking, Breakfast, Comfort, Quick",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "steps": [{"title": "short title", "body": "rewrite this step clearly in your own words", "timer": 0}],
  "tip": "one helpful cooking tip in your own words"
}

Webpage text:
${stripped}`
        }]
      }),
    });

    const data = await response.json();
    return Response.json(data);
  }

  return Response.json({ error: 'unknown_action' }, { status: 400 });
}