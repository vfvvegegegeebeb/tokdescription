export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { niche, sujet, langue, ton, longueur, emojis, cta, pro } = req.body;

  let prompt;

  if (pro) {
    // Build richer prompt based on Pro options
    const longueurInstruction = longueur === 'courte'
      ? '1 phrase courte et percutante'
      : longueur === 'longue'
      ? '4 à 5 phrases développées'
      : '2 à 3 phrases équilibrées';

    const emojiInstruction = emojis === 'non'
      ? 'sans aucun emoji'
      : emojis === 'beaucoup'
      ? 'avec énormément d\'emojis (au moins 1 par phrase)'
      : 'avec quelques emojis bien placés';

    const ctaMap = {
      follow: 'Termine par un appel à s\'abonner.',
      comment: 'Termine par une question engageante pour faire commenter.',
      partage: 'Termine par un appel au partage.',
      lien: 'Mentionne un lien en bio.',
      aucun: ''
    };
    const ctaInstruction = ctaMap[cta] || '';

    prompt = `Tu es un expert en croissance TikTok et en copywriting viral. Génère une description TikTok ultra-optimisée en ${langue} pour une vidéo de niche "${niche}" sur le sujet "${sujet}" avec un ton "${ton}".

CONTRAINTES IMPÉRATIVES :
- Description : ${longueurInstruction}
- Emojis : ${emojiInstruction}
- ${ctaInstruction}

Format de réponse EXACT (respecte chaque section) :

📝 DESCRIPTION :
[La description selon les contraintes ci-dessus]

#️⃣ HASHTAGS :
[15-20 hashtags ultra-ciblés : mix populaires + niche + trending]

⏰ HEURE DE POST IDÉALE :
[Heure précise + explication courte basée sur le comportement TikTok]

🎯 HOOK VIDÉO SUGGÉRÉ :
[1 phrase d'accroche pour les 3 premières secondes de la vidéo]

💡 CONSEIL PRO :
[1 conseil actionnable et spécifique pour maximiser les vues sur ce sujet]

📊 MOTS-CLÉS SEO TIKTOK :
[5-8 mots-clés à placer naturellement dans les commentaires]`;

  } else {
    // Standard free prompt
    prompt = `Tu es un expert en croissance TikTok. Génère une description TikTok optimisée en ${langue} pour une vidéo de niche "${niche}" sur le sujet "${sujet}" avec un ton "${ton}".

Format exact :

📝 DESCRIPTION :
[2-3 phrases accrocheuses]

#️⃣ HASHTAGS :
[10-15 hashtags ciblés]

⏰ HEURE DE POST IDÉALE :
[heure + explication]

💡 CONSEIL :
[1 conseil actionnable]`;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: pro ? 1200 : 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    res.status(200).json({ result: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', result: 'Erreur lors de la génération. Réessaie.' });
  }
}
