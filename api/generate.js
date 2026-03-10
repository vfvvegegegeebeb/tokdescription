module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mode, niche, sujet, langue, ton, longueur, emojis, cta, pro, base64, mediaType, context, type, text, objectif } = req.body;

  let prompt = '';

  // ============================================================
  // MODE: VIDEO ANALYZER
  // ============================================================
  if (mode === 'video') {
    prompt = `Tu es le meilleur expert en croissance TikTok au monde, spécialisé dans le marché francophone. Tu as aidé des centaines de créateurs à passer de 0 à 100k abonnés.

Analyse cette image/vidéo TikTok et génère une description qui va exploser les vues.
${context ? `Contexte du créateur : "${context}"` : ''}
Langue de réponse : ${langue || 'français'}

Sois ULTRA PRÉCIS, ULTRA CONCRET. Pas de blabla générique.

Réponds dans ce format exact :

🎬 CE QUE JE VOIS :
[Analyse précise du contenu visuel — ambiance, sujet, style, émotion]

📝 DESCRIPTION OPTIMISÉE :
[Description qui crée une émotion forte, donne envie de commenter, avec les bons mots-clés TikTok]

#️⃣ HASHTAGS (du plus viral au plus niche) :
[20 hashtags classés : 5 mega-viraux + 8 ciblés niche + 7 micro-niche]

⏰ HEURE DE POST IDÉALE :
[Heure précise + raison psychologique basée sur le comportement de l'audience cible]

🎯 HOOK — LES 3 PREMIÈRES SECONDES :
[Phrase exacte à dire ou afficher pour stopper le scroll. Doit créer un choc ou une curiosité irrésistible]

📊 SCORE DE POTENTIEL VIRAL : [X/100]
[Explication détaillée : ce qui va marcher, ce qui pourrait freiner]

💡 3 ACTIONS CONCRÈTES POUR MAXIMISER LES VUES :
1. [Action ultra-spécifique]
2. [Action ultra-spécifique]
3. [Action ultra-spécifique]`;

  // ============================================================
  // MODE: HOOKS
  // ============================================================
  } else if (mode === 'hooks') {
    prompt = `Tu es le copywriter numéro 1 de TikTok FR. Tu connais exactement ce qui arrête le scroll et ce qui fait exploser le temps de visionnage.

Génère 5 hooks DÉVASTATEURS pour une vidéo TikTok sur "${sujet}" dans la niche "${niche}".
Type de hook : "${type}"

RÈGLES D'OR :
- Chaque hook doit être dit en moins de 4 secondes
- Doit créer une ÉMOTION IMMÉDIATE (curiosité, choc, peur de rater quelque chose, identification)
- Interdit : commencer par "Je", "Bonjour", "Dans cette vidéo"
- Autorisé : chiffres chocs, questions provocatrices, affirmations controversées, mises en scène

Format :

🎯 HOOK 1 — [TYPE]
"[Le hook exact, mot pour mot]"
→ Pourquoi ça marche : [explication courte]

🎯 HOOK 2 — [TYPE]
"[Le hook exact]"
→ Pourquoi ça marche : [explication courte]

🎯 HOOK 3 — [TYPE]
"[Le hook exact]"
→ Pourquoi ça marche : [explication courte]

🎯 HOOK 4 — [TYPE]
"[Le hook exact]"
→ Pourquoi ça marche : [explication courte]

🎯 HOOK 5 — [TYPE]
"[Le hook exact]"
→ Pourquoi ça marche : [explication courte]

⚡ LE MEILLEUR POUR TOI : Hook [numéro] — [raison]`;

  // ============================================================
  // MODE: CALENDAR
  // ============================================================
  } else if (mode === 'calendar') {
    prompt = `Tu es un stratège de contenu TikTok d'élite. Tu crées des plannings qui génèrent des millions de vues.

Crée un planning de contenu TikTok sur 7 jours pour la niche "${niche}" avec l'objectif : "${objectif}".

Chaque jour doit avoir un thème différent qui s'enchaîne logiquement pour créer une audience fidèle.

Format pour chaque jour :

━━━━━━━━━━━━━━━━━━━━━━
📅 [JOUR] — [THÈME DU JOUR]
━━━━━━━━━━━━━━━━━━━━━━
🎬 Titre : [Titre accrocheur de la vidéo]
🎯 Hook : "[Phrase d'accroche exacte pour les 3 premières secondes]"
📝 Description : [2-3 phrases optimisées + appel à l'action]
#️⃣ Top 5 hashtags : [les 5 hashtags les plus importants]
⏰ Heure optimale : [heure précise]
📊 Potentiel : [Faible/Moyen/Fort/Viral] — [raison en 1 phrase]

[Répète pour les 7 jours]

━━━━━━━━━━━━━━━━━━━━━━
🚀 STRATÉGIE GLOBALE DE LA SEMAINE :
[Conseil clé pour maximiser la cohérence et la croissance]
━━━━━━━━━━━━━━━━━━━━━━`;

  // ============================================================
  // MODE: ANALYZE DESCRIPTION
  // ============================================================
  } else if (mode === 'analyze') {
    prompt = `Tu es un auditeur expert en optimisation TikTok. Tu analyses des descriptions avec une précision chirurgicale.

Analyse cette description TikTok pour la niche "${niche}" :

"${text}"

Sois honnête, direct, et ultra-concret. Pas de compliments inutiles.

📊 SCORE GLOBAL : [X/100]

━━━ ANALYSE DÉTAILLÉE ━━━

✅ CE QUI EST BON :
[Points positifs avec explication du pourquoi]

❌ CE QUI COULE TA VIDÉO :
[Problèmes précis qui réduisent les vues — sois brutal et honnête]

🔍 ANALYSE DES HASHTAGS :
- Trop génériques : [liste]
- Bien ciblés : [liste]
- Manquants et importants : [liste]

📈 ANALYSE DE L'ALGORITHME :
[Comment l'algorithme TikTok va traiter cette description — mots-clés détectés, score SEO]

✨ VERSION AMÉLIORÉE :
[Réécriture complète, optimisée à 100%]

💡 LES 3 CHANGEMENTS QUI FERONT LA DIFFÉRENCE :
1. [Changement précis + impact estimé]
2. [Changement précis + impact estimé]
3. [Changement précis + impact estimé]`;

  // ============================================================
  // MODE: PRO GENERATOR
  // ============================================================
  } else if (pro) {
    const longueurInstruction = longueur === 'courte'
      ? 'UNE SEULE phrase ultra-percutante de maximum 15 mots — chaque mot doit compter'
      : longueur === 'longue'
      ? '4 à 5 phrases qui racontent une mini-histoire et créent de l\'émotion'
      : '2 à 3 phrases équilibrées — accroche + valeur + action';

    const emojiInstruction = emojis === 'non'
      ? 'ZÉRO emoji — style épuré et professionnel'
      : emojis === 'beaucoup'
      ? 'emojis PARTOUT — au moins 2 par phrase, style énergie maximale'
      : '1-2 emojis stratégiques — placés pour amplifier l\'émotion';

    const ctaMap = {
      follow: 'Termine par un appel à s\'abonner IRRÉSISTIBLE — pas juste "abonne-toi", crée une raison.',
      comment: 'Termine par une QUESTION qui divise l\'opinion ou crée un débat — le but est de déclencher des commentaires.',
      partage: 'Termine par un appel au partage ÉMOTIONNEL — "envoie ça à quelqu\'un qui en a besoin".',
      lien: 'Mentionne le lien en bio de façon naturelle et intrigante.',
      aucun: 'Pas d\'appel à l\'action — laisse le contenu parler.'
    };

    prompt = `Tu es le ghostwriter TikTok numéro 1 en ${langue}. Tes descriptions génèrent en moyenne 500k vues. Tu connais l'algorithme TikTok mieux que personne.

Crée une description TikTok DÉVASTATRICE en ${langue} pour :
- Niche : "${niche}"
- Sujet : "${sujet}"
- Ton : "${ton}"
- Longueur : ${longueurInstruction}
- Emojis : ${emojiInstruction}
- CTA : ${ctaMap[cta] || 'Pas d\'appel à l\'action.'}

RÈGLES ABSOLUES :
1. Chaque mot doit servir un but précis
2. Le premier mot doit être un choc ou une question
3. Les hashtags doivent être triés du plus viral au plus ciblé
4. Le hook vidéo doit stopper le scroll en 0.5 secondes
5. Le conseil doit être ACTIONNABLE aujourd'hui, pas demain

Format EXACT :

📝 DESCRIPTION :
[La description selon les contraintes — elle doit donner des frissons]

#️⃣ HASHTAGS (viral → niche → micro) :
[20 hashtags ultra-ciblés et triés par puissance]

⏰ HEURE DE POST IDÉALE :
[Heure précise + psychologie de l'audience à cette heure]

🎯 HOOK — LES 3 PREMIÈRES SECONDES :
[Phrase exacte, mot pour mot, qui stoppe le scroll]

💡 CONSEIL PRO DU JOUR :
[1 conseil hyper-spécifique et actionnable pour maximiser les vues de CETTE vidéo]

📊 MOTS-CLÉS SEO À PLACER EN COMMENTAIRE :
[8 mots-clés à coller en premier commentaire pour booster le SEO TikTok]`;

  // ============================================================
  // MODE: SCRIPT GENERATOR
  // ============================================================
  } else if (mode === 'script') {
    const dureeLabel = duree === '30' ? '30 secondes (environ 75 mots a l oral)' : duree === '60' ? '1 minute (environ 150 mots)' : duree === '180' ? '3 minutes (environ 450 mots)' : '5 minutes (environ 750 mots)';
    prompt = `Tu es le meilleur scénariste de contenu TikTok au monde. Tu as écrit des scripts pour des créateurs avec des millions d'abonnés.

Génère un script TikTok COMPLET et PRÊT À TOURNER en ${langue || 'français'} pour :
- Niche : "${niche || 'générale'}"
- Sujet : "${sujet}"
- Durée : ${dureeLabel}
- Style : ${style || 'éducatif'}
- Ton : ${ton || 'naturel'}

RÈGLES ABSOLUES :
- Le script doit être dit EXACTEMENT tel quel, mot pour mot
- Chaque section doit avoir sa durée estimée
- Les transitions doivent être claires et naturelles
- Le hook doit stopper le scroll en moins de 3 secondes
- Pas de blabla inutile — chaque mot doit servir un but

Format EXACT :

🎬 HOOK — [0 à 3 secondes]
"[Phrase d'accroche exacte — provoc, chiffre choc ou question irrésistible]"
[Indication visuelle : ce qui doit apparaître à l'écran]

⚡ TRANSITION
[Comment enchaîner vers le développement]

📖 DÉVELOPPEMENT — [durée estimée]
[Le corps du script structuré en points clés, avec les transitions entre chaque]

🎯 CONCLUSION + CALL TO ACTION — [dernières secondes]
"[Phrase de conclusion percutante + appel à l'action naturel]"

📋 NOTES DE TOURNAGE :
- Décor suggéré : [suggestion]
- Énergie : [niveau d'énergie recommandé]
- Sous-titres : [conseils pour les sous-titres]
- Musique : [type de musique de fond suggéré]

#️⃣ HASHTAGS POUR CETTE VIDÉO :
[15 hashtags ultra-ciblés]`;

  // ============================================================
  // MODE: FREE GENERATOR (version premium pour la première impression)
  // ============================================================
  } else {
    prompt = `Tu es le meilleur expert TikTok francophone. Cette personne teste ton outil pour la première fois — tu dois les ÉPATER. Donne le meilleur de toi-même.

Crée une description TikTok EXCEPTIONNELLE en ${langue} pour :
- Niche : "${niche}"
- Sujet : "${sujet}"
- Ton : "${ton}"

OBJECTIF : que l'utilisateur se dise "WOW, c'est exactement ce qu'il me faut !"

Sois ultra-spécifique, ultra-percutant, ultra-pro.

Format :

📝 DESCRIPTION :
[Description qui crée une émotion forte — pas générique, hyper-spécifique au sujet]

#️⃣ HASHTAGS (triés du plus viral au plus ciblé) :
[15 hashtags puissants et bien choisis]

⏰ HEURE DE POST IDÉALE :
[Heure précise + raison psychologique basée sur l'audience de cette niche]

🎯 HOOK — LES 3 PREMIÈRES SECONDES :
[La phrase exacte à dire ou afficher pour stopper le scroll immédiatement]

💡 CONSEIL EXPERT :
[1 conseil ultra-spécifique et actionnable pour que CETTE vidéo explose]`;
  }

  try {
    if (mode === 'video' && base64) {
      // Claude API for vision
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
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: base64 } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      const data = await response.json();
      return res.status(200).json({ result: data.content[0].text });
    } else {
      // Groq for text
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: mode === 'calendar' ? 2500 : mode === 'analyze' || mode === 'hooks' ? 1500 : 1200,
          temperature: 0.85,
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert TikTok d\'élite. Tu réponds toujours en français sauf si une autre langue est demandée. Tes réponses sont précises, concrètes, et actionnables. Tu ne donnes jamais de conseils génériques.'
            },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await response.json();
      return res.status(200).json({ result: data.choices[0].message.content });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur', result: 'Erreur lors de la génération. Réessaie.' });
  }
}
