export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  // Action: fetch a URL and extract recipe via JSON-LD (free, no AI)
  if (action === 'import') {
    const { url } = body;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      const html = await res.text();
      if (!html || html.length < 200) {
        return Response.json({ error: 'blocked' });
      }

      // Extract all JSON-LD blocks from the page
      const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let recipe = null;

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(match[1].trim());
          // Handle both single objects and arrays
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            // Handle @graph arrays (used by some sites)
            if (item['@graph']) {
              const found = item['@graph'].find((g: any) => 
                g['@type'] === 'Recipe' || 
                (Array.isArray(g['@type']) && g['@type'].includes('Recipe'))
              );
              if (found) { recipe = found; break; }
            }
            if (item['@type'] === 'Recipe' || 
               (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
              recipe = item;
              break;
            }
          }
          if (recipe) break;
        } catch {}
      }

      if (!recipe) {
        return Response.json({ error: 'no_recipe' });
      }

      // Extract ingredients
      const ingredients = (recipe.recipeIngredient || [])
        .map((i: any) => String(i).trim())
        .filter(Boolean);

      // Extract steps
      const rawSteps = recipe.recipeInstructions || [];
      const steps = rawSteps
        .map((s: any, i: number) => {
          if (typeof s === 'string') return { title: `Step ${i + 1}`, body: s.trim(), timer: 0 };
          const body = (s.text || s.description || '').trim();
          return { title: s.name || `Step ${i + 1}`, body, timer: 0 };
        })
        .filter((s: any) => s.body.length > 0);

      if (ingredients.length === 0 || steps.length === 0) {
        return Response.json({ error: 'no_recipe' });
      }

      // Parse time
      const rawTime = recipe.totalTime || recipe.cookTime || recipe.prepTime || '';
      let timeStr = '30 min';
      if (rawTime) {
        const hours = rawTime.match(/(\d+)H/i);
        const mins = rawTime.match(/(\d+)M/i);
        if (hours && mins) timeStr = `${hours[1]} hr ${mins[1]} min`;
        else if (hours) timeStr = `${hours[1]} hr`;
        else if (mins) timeStr = `${mins[1]} min`;
      }

      // Determine difficulty from ingredient count and step count
      const difficulty = ingredients.length <= 6 && steps.length <= 4 ? 'Easy'
        : ingredients.length >= 12 || steps.length >= 8 ? 'Hard'
        : 'Medium';

      return Response.json({
        name: recipe.name || 'Imported Recipe',
        time: timeStr,
        difficulty,
        category: 'Comfort',
        ingredients,
        steps,
        tip: recipe.description ? recipe.description.slice(0, 200) : null,
        image: typeof recipe.image === 'string' ? recipe.image 
             : Array.isArray(recipe.image) ? recipe.image[0]
             : recipe.image?.url || null,
      });

    } catch (e: any) {
      return Response.json({ error: e.message || 'fetch_failed' });
    }
  }

  // Keep parse action for potential future use
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
        messages: [{ role: 'user', content: `Extract recipe from this text as JSON only. If not a recipe: {"error":"not_a_recipe"}. If recipe: {"name":"","time":"","difficulty":"Easy","category":"Comfort","ingredients":[],"steps":[{"title":"","body":"","timer":0}],"tip":""}.\n\n${stripped}` }]
      }),
    });
    const data = await response.json();
    return Response.json(data);
  }

  return Response.json({ error: 'unknown_action' }, { status: 400 });
}