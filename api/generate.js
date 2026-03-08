export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { niche, sujet, langue, ton } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu es un expert en croissance TikTok. Génère une description TikTok optimisée en ${langue} pour une vidéo de niche "${niche}" sur le sujet "${sujet}" avec un ton "${ton}".\n\nFormat exact :\n\n📝 DESCRIPTION :\n[2-3 phrases accrocheuses]\n\n#️⃣ HASHTAGS :\n[10-15 hashtags ciblés]\n\n⏰ HEURE DE POST IDÉALE :\n[heure + explication]\n\n💡 CONSEIL :\n[1 conseil actionnable]`
      }]
    })
  });

  const data = await response.json();
  res.status(200).json({ result: data.content[0].text });
}
