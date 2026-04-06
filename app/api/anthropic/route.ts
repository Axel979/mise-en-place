export async function POST(request: Request) {
  const body = await request.json();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data);
}