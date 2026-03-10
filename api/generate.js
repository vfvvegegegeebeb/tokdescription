export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mode, niche, sujet, langue, ton, longueur, emojis, cta, pro, base64, mediaType, context, type, text, objectif } = req.body;

  let prompt = '';
  let useVision = false;
  let imageData = null;

  // MODE: VIDEO ANALYZER
  if (mode === 'video') {
    useVision = true;
    imageData = base64;
    prompt = `Tu es un expert TikTok. Analyse cette image/vidéo et génère une description TikTok optimisée en ${langue || 'français'}.
${context ? 'Contexte fourni par le créateur : ' + context : ''}

Génère dans ce format exact :

🎬 ANALYSE DU CONTENU :
[Ce que tu vois dans la vidéo / ce que le créateur veut transmettre]

📝 DESCRIPTION OPTIMISÉE :
[Description parfaite adaptée au contenu]

#️⃣ HASHTAGS :
[15-20 hashtags ultra-ciblés]

⏰ HEURE DE POST IDÉALE :
[Heure + explication]

🎯 HOOK SUGGÉRÉ :
[Phrase d'accroche pour les 3 premières secondes]

📊 POTENTIEL VIRAL :
[Score /100 + explication détaillée basée sur le contenu]

💡 3 CONSEILS POUR MAXIMISER LES VUES :
[3 conseils spécifiques au contenu analysé]`;

  // MODE: HOOKS
  } else if (mode === 'hooks') {
    prompt = `Tu es un expert en copywriting viral TikTok. Génère 5 hooks irrésistibles pour une vidéo TikTok sur "${sujet}" dans la niche "${niche}".
Type de hook demandé : "${type}".

Les hooks doivent :
- Durer 3-5 secondes à l'oral
- Créer une curiosité immédiate ou un choc émotionnel
- Donner envie de continuer à regarder

Format : numérote chaque hook de 1 à 5, avec une ligne vide entre chaque.`;

  // MODE: CALENDAR
  } else if (mode === 'calendar') {
    prompt = `Tu es un stratège de contenu TikTok expert. Génère un planning de contenu pour 7 jours pour un créateur dans la niche "${niche}" avec l'objectif : "${objectif}".

Format pour chaque jour :

📅 LUNDI — [TITRE DE LA VIDÉO]
Sujet : [description courte]
Hook : [accroche 3 secondes]
Description : [2 phrases + 5 hashtags clés]
⏰ Heure de post : [heure optimale]

[Même format pour Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche]

💡 STRATÉGIE DE LA SEMAINE :
[1 conseil clé pour atteindre l'objectif]`;

  // MODE: ANALYZE DESCRIPTION
  } else if (mode === 'analyze') {
    prompt = `Tu es un expert en optimisation de contenu TikTok. Analyse cette description TikTok pour la niche "${niche}" et donne un feedback détaillé.

Description à analyser :
"${text}"

Format de réponse :

📊 SCORE GLOBAL : [X/100]

✅ CE QUI EST BON :
[Points positifs]

❌ CE QUI MANQUE :
[Points à améliorer]

🎯 HASHTAGS MANQUANTS :
[Hashtags importants non utilisés]

✨ VERSION AMÉLIORÉE :
[Réécriture optimisée de la description]

💡 CONSEIL PRINCIPAL :
[Le conseil le plus important pour améliorer les performances]`;

  // MODE: PRO GENERATOR
  } else if (pro) {
    const longueurInstruction = longueur === 'courte' ? '1 phrase courte et percutante' : longueur === 'longue' ? '4 à 5 phrases développées' : '2 à 3 phrases équilibrées';
    const emojiInstruction = emojis === 'non' ? 'sans aucun emoji' : emojis === 'beaucoup' ? 'avec énormément d\'emojis (au moins 1 par phrase)' : 'avec quelques emojis bien placés';
    const ctaMap = { follow: 'Termine par un appel à s\'abonner.', comment: 'Termine par une question engageante pour faire commenter.', partage: 'Termine par un appel au partage.', lien: 'Mentionne un lien en bio.', aucun: '' };
    const ctaInstruction = ctaMap[cta] || '';

    prompt = `Tu es un expert en croissance TikTok et en copywriting viral. Génère une description TikTok ultra-optimisée en ${langue} pour une vidéo de niche "${niche}" sur le sujet "${sujet}" avec un ton "${ton}".

CONTRAINTES :
- Description : ${longueurInstruction}
- Emojis : ${emojiInstruction}
- ${ctaInstruction}

Format EXACT :

📝 DESCRIPTION :
[La description]

#️⃣ HASHTAGS :
[15-20 hashtags ultra-ciblés]

⏰ HEURE DE POST IDÉALE :
[Heure précise + explication]

🎯 HOOK VIDÉO SUGGÉRÉ :
[1 phrase d'accroche pour les 3 premières secondes]

💡 CONSEIL PRO :
[1 conseil actionnable et spécifique]

📊 MOTS-CLÉS SEO TIKTOK :
[5-8 mots-clés à placer dans les commentaires]`;

  // MODE: FREE GENERATOR
  } else {
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
    let requestBody;

    if (useVision && imageData) {
      // Use Claude API for vision
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageData } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      const data = await response.json();
      return res.status(200).json({ result: data.content[0].text });
    } else {
      // Use Groq for text
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: mode === 'calendar' ? 2000 : 1200,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      return res.status(200).json({ result: data.choices[0].message.content });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur', result: 'Erreur lors de la génération. Réessaie.' });
  }
}
