export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { niche, sujet, langue, ton } = req.body;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu es un expert en croissance TikTok. Génère une description TikTok optimisée en ${langue} pour une vidéo de niche "${niche}" sur le sujet "${sujet}" avec un ton "${ton}".\n\nFormat exact :\n\n📝 DESCRIPTION :\n[2-3 phrases accrocheuses]\n\n#️⃣ HASHTAGS :\n[10-15 hashtags ciblés]\n\n⏰ HEURE DE POST IDÉALE :\n[heure + explication]\n\n💡 CONSEIL :\n[1 conseil actionnable]`
      }]
    })
  });

  const data = await response.json();
  res.status(200).json({ result: data.choices[0].message.content });
}
