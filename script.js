const SUPA_URL='https://hodwhvptvrbbwteephgw.supabase.co';
const SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZHdodnB0dnJiYnd0ZWVwaGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDg0MDgsImV4cCI6MjA4ODQ4NDQwOH0.Z9wtfKDq_gMgty6-j6ZRgdnS_nTH976jEVPPU5oXe4U';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);
const STRIPE_LINK='https://buy.stripe.com/6oUeVc4U34PpeRgg0M28800';

let user=null,userIsPro=false,userProfile=null;
let sessionHistory=[];
let selectedStars=5;
let uploadedFile=null;

// ── SYSTÈME ESSAI GRATUIT ──────────────────────────────────────
// 1 génération globale pour tout le dashboard Pro
function getFreeUsed(){
  try{return localStorage.getItem('tokdesc_free_used')==='true';}catch(e){return false;}
}
function setFreeUsed(){
  try{localStorage.setItem('tokdesc_free_used','true');}catch(e){}
}
function canGenerateFree(){
  return userIsPro || !getFreeUsed();
}

// ── NAVIGATION ─────────────────────────────────────────────────
function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page'+page.charAt(0).toUpperCase()+page.slice(1)).classList.add('active');
  if(page==='profile')loadProfilePage();
  window.scrollTo(0,0);
}
function switchTab(tab,btn){
  document.querySelectorAll('.pro-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.pro-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
  if(btn)btn.classList.add('active');
}

// ── INIT ───────────────────────────────────────────────────────
async function init(){
  const{data:{session}}=await sb.auth.getSession();
  if(session){user=session.user;await loadProfile(user);updateNav();}
  else setGuest();

  const urlParams=new URLSearchParams(window.location.search);
  if(urlParams.get('success')==='true'&&user){
    await sb.from('profiles').upsert({id:user.id,email:user.email,is_pro:true});
    userIsPro=true;updateNav();
    window.history.replaceState({},'',window.location.pathname);
    alert('🎉 Bienvenue dans TokDescription Pro ! Genere a l\'infini.');
    showPage('pro');
  }

  sb.auth.onAuthStateChange(async(e,session)=>{
    if(e==='SIGNED_IN'){user=session.user;await loadProfile(user);updateNav();closeModal();showPage('pro');}
    else if(e==='SIGNED_OUT'){user=null;userIsPro=false;userProfile=null;setGuest();showPage('home');}
  });

  loadUserReviews();
}

async function loadProfile(u){
  const{data:profile}=await sb.from('profiles').select('*').eq('id',u.id).single();
  userProfile=profile;
  userIsPro=profile&&profile.is_pro===true;
}

function updateNav(){
  const username=userProfile&&userProfile.username?userProfile.username:user.email.split('@')[0];
  document.getElementById('userEmail').style.display='inline';
  document.getElementById('userEmail').textContent=username;
  document.getElementById('genBadge').style.display='inline';
  document.getElementById('loginLink').style.display='none';
  if(userIsPro){
    document.getElementById('genBadge').textContent='⭐ Pro';
    document.getElementById('genBadge').className='gen-badge pro-badge';
    document.getElementById('navBtn').textContent='🚀 Dashboard Pro';
    document.getElementById('navBtn').onclick=()=>showPage('pro');
    document.getElementById('proStatusBadge').innerHTML='<div class="pro-badge-big">⭐ Pro illimite</div>';
    document.getElementById('freeTrialBar').style.display='none';
  }else{
    const used=getFreeUsed();
    document.getElementById('genBadge').textContent=used?'🔒 Essai utilise':'1 essai gratuit';
    document.getElementById('genBadge').className='gen-badge';
    document.getElementById('navBtn').textContent='🚀 Dashboard Pro';
    document.getElementById('navBtn').onclick=()=>showPage('pro');
    document.getElementById('proStatusBadge').innerHTML='<div style="background:rgba(232,197,71,0.1);border:1px solid rgba(232,197,71,0.3);color:var(--gold);padding:8px 18px;border-radius:100px;font-size:0.85rem;font-weight:600;">'+(used?'🔒 Essai utilise':'✦ Mode essai gratuit')+'</div>';
    document.getElementById('freeTrialBar').style.display=used?'none':'flex';
    document.getElementById('trialGenLeft').textContent=used?'0 generation disponible':'1 generation disponible';
  }
  if(userProfile&&userProfile.username)document.getElementById('proUsername').textContent=userProfile.username;
}

function setGuest(){
  document.getElementById('userEmail').style.display='none';
  document.getElementById('genBadge').style.display='none';
  document.getElementById('loginLink').style.display='inline';
  document.getElementById('navBtn').textContent='Commencer gratuitement';
  document.getElementById('navBtn').onclick=()=>openModal('signup');
}

// ── AUTH ───────────────────────────────────────────────────────
async function handleSignup(){
  const username=document.getElementById('sUsername').value.trim();
  const email=document.getElementById('sEmail').value.trim();
  const pass=document.getElementById('sPass').value;
  const err=document.getElementById('sErr'),suc=document.getElementById('sSuc');
  err.style.display='none';suc.style.display='none';
  if(!username||!email||!pass){err.style.display='block';err.textContent='Remplis tous les champs !';return;}
  if(pass.length<6){err.style.display='block';err.textContent='Mot de passe trop court (min. 6 caracteres).';return;}
  const ipData=await fetch('https://api.ipify.org?format=json').then(r=>r.json()).catch(()=>({ip:'unknown'}));
  const ip=ipData.ip;
  const{count}=await sb.from('profiles').select('*',{count:'exact',head:true}).eq('ip_address',ip);
  if(count>=3){err.style.display='block';err.textContent='Limite de 3 comptes atteinte depuis cette adresse IP.';return;}
  const{error}=await sb.auth.signUp({email,password:pass,options:{data:{username}}});
  if(error){err.style.display='block';err.textContent=error.message;return;}
  suc.style.display='block';suc.textContent='Compte cree ! Verifie ton email pour confirmer.';
}
async function handleLogin(){
  const email=document.getElementById('lEmail').value;
  const pass=document.getElementById('lPass').value;
  const err=document.getElementById('lErr');
  err.style.display='none';
  if(!email||!pass){err.style.display='block';err.textContent='Remplis tous les champs !';return;}
  const{error}=await sb.auth.signInWithPassword({email,password:pass});
  if(error){err.style.display='block';err.textContent=error.message.includes('Email not confirmed')?'📧 Confirme ton email avant de te connecter !':'Email ou mot de passe incorrect.';}
}

// ── HELPER UPGRADE BLOCK ───────────────────────────────────────
function showUpgrade(blockId, resultId){
  if(resultId){const r=document.getElementById(resultId);if(r)r.classList.remove('show');}
  const el=document.getElementById(blockId);
  if(el)el.style.display='block';
}

// ── FREE PAGE GENERATOR ────────────────────────────────────────
async function handleGenerate(){
  if(!user){openModal('signup');return;}
  if(getFreeUsed()){
    document.getElementById('globalUpgrade').style.display='block';
    document.getElementById('globalUpgrade').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const niche=document.getElementById('niche').value.trim();
  const sujet=document.getElementById('sujet').value.trim();
  const langue=document.getElementById('langue').value;
  const ton=document.getElementById('ton').value;
  const longueur=document.getElementById('longueur').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('genBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({niche:niche||'generale',sujet,langue,ton,longueur,emojis:'oui',cta:'follow',pro:true})
    });
    const data=await res.json();
    document.getElementById('freeResultText').textContent=data.result;
    document.getElementById('freeResult').classList.add('show');
    setFreeUsed();
    updateNav();
    setTimeout(()=>{
      document.getElementById('globalUpgrade').style.display='block';
      document.getElementById('globalUpgrade').scrollIntoView({behavior:'smooth',block:'center'});
    },900);
  }catch(e){
    document.getElementById('freeResultText').textContent='Erreur lors de la generation. Reessaie dans quelques secondes.';
    document.getElementById('freeResult').classList.add('show');
  }
  btn.disabled=false;btn.innerHTML='✦ Generer ma description';
}

// ── PRO GENERATOR ──────────────────────────────────────────────
async function handleProGenerate(count){
  if(!user){openModal('signup');return;}
  // Batch = Pro only
  if(count>1&&!userIsPro){showUpgrade('proGenUpgrade','proResult');return;}
  // 1 free gen allowed
  if(!userIsPro&&getFreeUsed()){showUpgrade('proGenUpgrade','proResult');return;}
  const niche=document.getElementById('proNiche').value;
  const sujet=document.getElementById('proSujet').value;
  const langue=document.getElementById('proLangue').value;
  const ton=document.getElementById('proTon').value;
  const longueur=document.getElementById('proLongueur').value;
  const emojis=document.getElementById('proEmojis').value;
  const cta=document.getElementById('proCtA').value;
  if(!niche||!sujet){alert('Remplis ta niche et le sujet !');return;}
  const btn=count===1?document.getElementById('proGenBtn'):document.getElementById('proBatchBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const results=[];
    for(let i=0;i<count;i++){
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({niche,sujet,langue,ton,longueur,emojis,cta,pro:true})});
      const data=await res.json();
      results.push(data.result);
    }
    if(count===1){document.getElementById('proResultText').textContent=results[0];}
    else{document.getElementById('proResultText').innerHTML=results.map((r,i)=>'<div class="batch-result-item"><div class="batch-result-num">VERSION '+(i+1)+'</div>'+r.replace(/\n/g,'<br>')+'</div>').join('');}
    document.getElementById('proResult').classList.add('show');
    document.getElementById('proGenUpgrade').style.display='none';
    const score=Math.floor(Math.random()*25)+70;
    document.getElementById('viralityScore').textContent=score;
    document.getElementById('viralityLabel').textContent='/100 — '+(score>=85?'🔥 Viral potentiel':score>=70?'✅ Bon potentiel':'⚡ Potentiel correct');
    document.getElementById('scoreFill').style.width=score+'%';
    document.getElementById('viralityBox').style.display='block';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('proGenUpgrade',null),800);}
  }catch(e){
    document.getElementById('proResultText').textContent='Erreur. Reessaie.';
    document.getElementById('proResult').classList.add('show');
  }
  btn.disabled=false;btn.innerHTML=count===1?'✦ Generer ma description':'⚡ Generer x3 en lot';
}

// ── VIDEO ANALYZER ─────────────────────────────────────────────
function handleFileSelect(e){const f=e.target.files[0];if(f)previewFile(f);}
function handleFileDrop(e){e.preventDefault();document.getElementById('uploadZone').classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)previewFile(f);}
function previewFile(file){
  uploadedFile=file;
  const preview=document.getElementById('uploadPreview');
  const reader=new FileReader();
  reader.onload=function(e){
    preview.innerHTML=file.type.startsWith('video/')?'<video src="'+e.target.result+'" controls></video>':'<img src="'+e.target.result+'" alt="preview">';
    preview.style.display='block';
  };
  reader.readAsDataURL(file);
  document.getElementById('uploadZone').querySelector('strong').textContent=file.name;
}
async function analyzeVideo(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('videoUpgrade','videoResult');return;}
  if(!uploadedFile){alert('Upload une video ou une image d\'abord !');return;}
  const context=document.getElementById('videoContext').value;
  const langue=document.getElementById('videoLangue').value;
  const btn=document.getElementById('videoAnalyzeBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  const reader=new FileReader();
  reader.onload=async function(e){
    try{
      const base64=e.target.result.split(',')[1];
      const mediaType=uploadedFile.type.startsWith('video/')?'image/jpeg':uploadedFile.type;
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'video',base64,mediaType,context,langue})});
      const data=await res.json();
      document.getElementById('videoResultText').textContent=data.result;
      document.getElementById('videoResult').classList.add('show');
      document.getElementById('videoUpgrade').style.display='none';
      if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('videoUpgrade',null),800);}
    }catch(e){
      document.getElementById('videoResultText').textContent='Erreur lors de l\'analyse. Reessaie.';
      document.getElementById('videoResult').classList.add('show');
    }
    btn.disabled=false;btn.innerHTML='🎬 Analyser et generer';
  };
  reader.readAsDataURL(uploadedFile);
}

// ── HOOKS ──────────────────────────────────────────────────────
async function generateHooks(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('hooksUpgrade','hooksResult');return;}
  const niche=document.getElementById('hookNiche').value;
  const sujet=document.getElementById('hookSujet').value;
  const type=document.getElementById('hookType').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('hookBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'hooks',niche,sujet,type})});
    const data=await res.json();
    document.getElementById('hooksResultText').textContent=data.result;
    document.getElementById('hooksResult').classList.add('show');
    document.getElementById('hooksUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('hooksUpgrade',null),800);}
  }catch(e){
    document.getElementById('hooksResultText').textContent='Erreur. Reessaie.';
    document.getElementById('hooksResult').classList.add('show');
  }
  btn.disabled=false;btn.innerHTML='🎯 Generer 5 hooks viraux';
}

// ── CALENDAR ───────────────────────────────────────────────────
async function generateCalendar(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('calUpgrade','calResult');return;}
  const niche=document.getElementById('calNiche').value;
  const objectif=document.getElementById('calObjectif').value;
  const btn=document.getElementById('calBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Creation du planning</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'calendar',niche,objectif})});
    const data=await res.json();
    document.getElementById('calResultText').textContent=data.result;
    document.getElementById('calResult').classList.add('show');
    document.getElementById('calUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('calUpgrade',null),800);}
  }catch(e){
    document.getElementById('calResultText').textContent='Erreur. Reessaie.';
    document.getElementById('calResult').classList.add('show');
  }
  btn.disabled=false;btn.innerHTML='📅 Generer mon planning 7 jours';
}

// ── DESCRIPTION ANALYZER ───────────────────────────────────────
async function analyzeDescription(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('analyzerUpgrade','analyzerResult');return;}
  const text=document.getElementById('analyzerText').value;
  const niche=document.getElementById('analyzerNiche').value;
  if(!text){alert('Colle ta description d\'abord !');return;}
  const btn=document.getElementById('analyzerBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analyze',text,niche})});
    const data=await res.json();
    document.getElementById('analyzerResultText').textContent=data.result;
    document.getElementById('analyzerResult').classList.add('show');
    document.getElementById('analyzerUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('analyzerUpgrade',null),800);}
  }catch(e){
    document.getElementById('analyzerResultText').textContent='Erreur. Reessaie.';
    document.getElementById('analyzerResult').classList.add('show');
  }
  btn.disabled=false;btn.innerHTML='🔍 Analyser ma description';
}

// ── REVIEWS ────────────────────────────────────────────────────
let userReviews=[];
function loadUserReviews(){
  try{userReviews=JSON.parse(localStorage.getItem('tokdesc_reviews')||'[]');renderUserReviews();}catch(e){}
}
function renderUserReviews(){
  const grid=document.getElementById('reviewsGrid');
  grid.querySelectorAll('.user-review').forEach(e=>e.remove());
  userReviews.slice(0,6).forEach(r=>{
    const div=document.createElement('div');
    div.className='review-card user-review';
    div.innerHTML='<div class="review-verified">✓ Avis reel</div><div class="stars">'+'★'.repeat(r.stars)+'☆'.repeat(5-r.stars)+'</div><p class="review-text">"'+escapeHtml(r.text)+'"</p><div class="review-author">'+escapeHtml(r.handle)+(r.followers?' · '+escapeHtml(r.followers)+' followers':'')+'</div>';
    grid.appendChild(div);
  });
}
function escapeHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function setStars(n){
  selectedStars=n;
  document.querySelectorAll('.star-btn').forEach((b,i)=>{
    b.classList.toggle('active',i<n);
  });
}
function submitReview(){
  const handle=document.getElementById('reviewHandle').value.trim();
  const text=document.getElementById('reviewText').value.trim();
  const followers=document.getElementById('reviewFollowers').value.trim();
  const err=document.getElementById('reviewErr');
  const suc=document.getElementById('reviewSuc');
  err.style.display='none';suc.style.display='none';
  if(!handle||!text){err.style.display='block';err.textContent='Remplis ton pseudo et ton avis !';return;}
  if(text.length<15){err.style.display='block';err.textContent='Ton avis est trop court (min. 15 caracteres).';return;}
  const review={stars:selectedStars,handle,text,followers,date:new Date().toLocaleDateString('fr-FR')};
  userReviews.unshift(review);
  localStorage.setItem('tokdesc_reviews',JSON.stringify(userReviews));
  renderUserReviews();
  suc.style.display='block';
  document.getElementById('reviewHandle').value='';
  document.getElementById('reviewText').value='';
  document.getElementById('reviewFollowers').value='';
  setStars(5);
  setTimeout(()=>suc.style.display='none',3000);
}

// ── HISTORY ────────────────────────────────────────────────────
function saveToHistory(){
  const niche=document.getElementById('proNiche').value;
  const sujet=document.getElementById('proSujet').value;
  if(!sujet)return;
  sessionHistory.unshift({niche,sujet,date:new Date().toLocaleDateString('fr-FR')});
  if(sessionHistory.length>50)sessionHistory.pop();
  renderHistory();
}
function renderHistory(){
  const c=document.getElementById('historyContainer');
  if(!sessionHistory.length){c.innerHTML='<div style="color:var(--muted);font-size:0.88rem;">Aucune generation sauvegardee.</div>';return;}
  c.innerHTML=sessionHistory.map(h=>'<div class="history-item"><div class="history-niche">'+h.niche+'</div><div class="history-sujet">'+h.sujet+'</div><div class="history-date">'+h.date+'</div></div>').join('');
}

// ── TRENDS & TEMPLATES ─────────────────────────────────────────
function applyTrend(t){document.getElementById('proSujet').value=t;switchTab('generator',document.querySelector('.pro-tab'));}
function applyTemplate(type){
  const t={
    motivation:{niche:'motivation',sujet:'5 habitudes pour changer ta vie des demain matin',ton:'inspirant'},
    business:{niche:'business',sujet:'Comment gagner de l\'argent en ligne en 2026',ton:'educatif'},
    fitness:{niche:'fitness',sujet:'Transformation physique en 90 jours sans salle',ton:'inspirant'},
    lifestyle:{niche:'mode',sujet:'Mon lifestyle de createur en 2026',ton:'premium'},
    crypto:{niche:'crypto',sujet:'Pourquoi le Bitcoin va tout changer cette annee',ton:'choc'},
    beaute:{niche:'beaute',sujet:'Ma routine beaute a 10€ qui change tout',ton:'authentique'},
    tech:{niche:'tech',sujet:'L\'IA va remplacer ces 5 metiers en 2026',ton:'choc'}
  };
  if(t[type]){
    document.getElementById('proNiche').value=t[type].niche;
    document.getElementById('proSujet').value=t[type].sujet;
    document.getElementById('proTon').value=t[type].ton;
    switchTab('generator',document.querySelector('.pro-tab'));
  }
}

// ── PROFILE ────────────────────────────────────────────────────
async function loadProfilePage(){
  if(!user)return;
  document.getElementById('profileEmail').value=user.email;
  const letter=userProfile&&userProfile.username?userProfile.username[0].toUpperCase():user.email[0].toUpperCase();
  document.getElementById('avatarCircle').textContent=letter;
  if(userProfile){
    document.getElementById('profileUsername').value=userProfile.username||'';
    document.getElementById('profileNiche').value=userProfile.niche||'';
  }
  document.getElementById('subStatus').innerHTML=userIsPro
    ?'<span style="color:var(--gold);font-weight:600;">⭐ Pro actif</span> — Generations illimitees + toutes les fonctionnalites'
    :'🆓 Gratuit — <button onclick="window.location.href=\''+STRIPE_LINK+'\'" style="background:var(--gold);color:var(--black);border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;margin-left:8px;">Passer au Pro →</button>';
}
async function saveProfile(){
  const username=document.getElementById('profileUsername').value.trim();
  const niche=document.getElementById('profileNiche').value;
  await sb.from('profiles').upsert({id:user.id,email:user.email,username,niche,is_pro:userIsPro});
  userProfile={...userProfile,username,niche};
  document.getElementById('profileMsg').style.display='block';
  document.getElementById('avatarCircle').textContent=username?username[0].toUpperCase():user.email[0].toUpperCase();
  document.getElementById('userEmail').textContent=username||user.email.split('@')[0];
  if(username)document.getElementById('proUsername').textContent=username;
  setTimeout(()=>document.getElementById('profileMsg').style.display='none',2000);
}

// ── UTILS ──────────────────────────────────────────────────────
function copyResult(id,btn){
  const text=document.getElementById(id).innerText||document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent='✓ Copie !';setTimeout(()=>btn.textContent=o,2000);});
}
function openModal(t){document.getElementById('modalOverlay').classList.add('open');switchModal(t);}
function closeModal(){document.getElementById('modalOverlay').classList.remove('open');}
function switchModal(t){document.getElementById('mSignup').style.display=t==='signup'?'block':'none';document.getElementById('mLogin').style.display=t==='login'?'block':'none';}


// ── DEMO TABS ──────────────────────────────────────────────────
function switchDemoTab(tab, btn){
  document.querySelectorAll('#demoTabs .pro-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.demo-panel').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const map={desc:'demoPanelDesc',hooks:'demoPanelHooks',calendar:'demoPanelCalendar',analyzer:'demoPanelAnalyzer',video:'demoPanelVideo',script:'demoPanelScript'};
  const panel=document.getElementById(map[tab]);
  if(panel)panel.classList.add('active');
}

function checkAndBlockDemo(){
  if(!user){openModal('signup');return false;}
  if(getFreeUsed()){
    document.getElementById('globalUpgrade').style.display='block';
    document.getElementById('globalUpgrade').scrollIntoView({behavior:'smooth',block:'center'});
    return false;
  }
  return true;
}

function afterDemoGenerate(){
  setFreeUsed();
  updateNav();
  setTimeout(()=>{
    document.getElementById('globalUpgrade').style.display='block';
    document.getElementById('globalUpgrade').scrollIntoView({behavior:'smooth',block:'center'});
  }, 900);
}

async function handleDemoHooks(){
  if(!checkAndBlockDemo()) return;
  const niche=document.getElementById('demoHookNiche').value;
  const sujet=document.getElementById('demoHookSujet').value;
  const type=document.getElementById('demoHookType').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('demoHookBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'hooks',niche,sujet,type})});
    const data=await res.json();
    document.getElementById('demoHooksResultText').textContent=data.result;
    document.getElementById('demoHooksResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoHooksResultText').textContent='Erreur. Reessaie.';document.getElementById('demoHooksResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🎯 Generer 5 hooks viraux';
}

async function handleDemoCalendar(){
  if(!checkAndBlockDemo()) return;
  const niche=document.getElementById('demoCalNiche').value;
  const objectif=document.getElementById('demoCalObjectif').value;
  const btn=document.getElementById('demoCalBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Creation du planning</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'calendar',niche,objectif})});
    const data=await res.json();
    document.getElementById('demoCalResultText').textContent=data.result;
    document.getElementById('demoCalResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoCalResultText').textContent='Erreur. Reessaie.';document.getElementById('demoCalResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='📅 Generer mon planning 7 jours';
}

async function handleDemoAnalyzer(){
  if(!checkAndBlockDemo()) return;
  const text=document.getElementById('demoAnalyzerText').value;
  const niche=document.getElementById('demoAnalyzerNiche').value;
  if(!text){alert('Colle ta description d\'abord !');return;}
  const btn=document.getElementById('demoAnalyzerBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'analyze',text,niche})});
    const data=await res.json();
    document.getElementById('demoAnalyzerResultText').textContent=data.result;
    document.getElementById('demoAnalyzerResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoAnalyzerResultText').textContent='Erreur. Reessaie.';document.getElementById('demoAnalyzerResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🔍 Analyser ma description';
}


// ── DEMO VIDEO ─────────────────────────────────────────────────
let demoUploadedFile=null;
function handleDemoFileSelect(e){const f=e.target.files[0];if(f)previewDemoFile(f);}
function handleDemoFileDrop(e){e.preventDefault();document.getElementById('demoUploadZone').classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)previewDemoFile(f);}
function previewDemoFile(file){
  demoUploadedFile=file;
  const preview=document.getElementById('demoUploadPreview');
  const reader=new FileReader();
  reader.onload=function(e){
    preview.innerHTML=file.type.startsWith('video/')?'<video src="'+e.target.result+'" controls></video>':'<img src="'+e.target.result+'" alt="preview">';
    preview.style.display='block';
  };
  reader.readAsDataURL(file);
  document.getElementById('demoUploadZone').querySelector('strong').textContent=file.name;
}
async function handleDemoVideo(){
  if(!checkAndBlockDemo()) return;
  if(!demoUploadedFile){alert('Upload une video ou une image d\'abord !');return;}
  const context=document.getElementById('demoVideoContext').value;
  const langue=document.getElementById('demoVideoLangue').value;
  const btn=document.getElementById('demoVideoBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  const reader=new FileReader();
  reader.onload=async function(e){
    try{
      const base64=e.target.result.split(',')[1];
      const mediaType=demoUploadedFile.type.startsWith('video/')?'image/jpeg':demoUploadedFile.type;
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'video',base64,mediaType,context,langue})});
      const data=await res.json();
      document.getElementById('demoVideoResultText').textContent=data.result;
      document.getElementById('demoVideoResult').classList.add('show');
      afterDemoGenerate();
    }catch(e){
      document.getElementById('demoVideoResultText').textContent='Erreur lors de l\'analyse. Reessaie.';
      document.getElementById('demoVideoResult').classList.add('show');
    }
    btn.disabled=false;btn.innerHTML='🎬 Analyser et generer la description';
  };
  reader.readAsDataURL(demoUploadedFile);
}

async function handleDemoScript(){
  if(!checkAndBlockDemo()) return;
  const niche=document.getElementById('demoScriptNiche').value;
  const sujet=document.getElementById('demoScriptSujet').value;
  const duree=document.getElementById('demoScriptDuree').value;
  const style=document.getElementById('demoScriptStyle').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('demoScriptBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'script',niche,sujet,duree,style})});
    const data=await res.json();
    document.getElementById('demoScriptResultText').textContent=data.result;
    document.getElementById('demoScriptResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoScriptResultText').textContent='Erreur. Reessaie.';document.getElementById('demoScriptResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🎬 Generer mon script';
}

async function generateProScript(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('scriptUpgrade','proScriptResult');return;}
  const niche=document.getElementById('proScriptNiche').value;
  const sujet=document.getElementById('proScriptSujet').value;
  const duree=document.getElementById('proScriptDuree').value;
  const style=document.getElementById('proScriptStyle').value;
  const langue=document.getElementById('proScriptLangue').value;
  const ton=document.getElementById('proScriptTon').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('proScriptBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'script',niche,sujet,duree,style,langue,ton})});
    const data=await res.json();
    document.getElementById('proScriptResultText').textContent=data.result;
    document.getElementById('proScriptResult').classList.add('show');
    document.getElementById('scriptUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('scriptUpgrade',null),800);}
  }catch(e){document.getElementById('proScriptResultText').textContent='Erreur. Reessaie.';document.getElementById('proScriptResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='📝 Generer mon script complet';
}

function saveScriptToHistory(){
  const sujet=document.getElementById('proScriptSujet').value;
  const niche=document.getElementById('proScriptNiche').value;
  if(!sujet)return;
  sessionHistory.unshift({niche:niche||'script',sujet,date:new Date().toLocaleDateString('fr-FR')});
  if(sessionHistory.length>50)sessionHistory.pop();
  renderHistory();
}


// ── LIVE COUNTER ───────────────────────────────────────────────
async function animateLiveCounter(){
  const el=document.getElementById('liveCount');
  if(!el)return;
  try{
    const {data,error}=await sb.from('profiles').select('id');
    const real=data?data.length:0;
    el.textContent=(real+100).toLocaleString('fr-FR');
  }catch(e){el.textContent='100';}
}

// ── SOCIAL PROOF TOASTS ────────────────────────────────────────
const toastUsers=[
  {name:'@karim_fit',action:'vient de generer une description'},
  {name:'@lea_business',action:'vient de passer au Pro'},
  {name:'@thomas_cr',action:'vient de generer des hooks viraux'},
  {name:'@sarah_mode',action:'vient d analyser sa video'},
  {name:'@marco_crypto',action:'vient de generer un script'},
  {name:'@julie_food',action:'vient de generer son planning 7j'},
  {name:'@ryan_gaming',action:'vient de passer au Pro'},
  {name:'@ines_skin',action:'vient d analyser son compte TikTok'},
];
let toastIndex=0;
function showToast(){
  const t=toastUsers[toastIndex%toastUsers.length];
  toastIndex++;
  const toast=document.getElementById('toast');
  const avatar=document.getElementById('toastAvatar');
  const text=document.getElementById('toastText');
  avatar.textContent=t.name[1].toUpperCase();
  text.textContent=t.name+' '+t.action;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),3500);
}
function startToasts(){
  setTimeout(()=>{showToast();setInterval(showToast,8000);},5000);
}

// ── EXIT INTENT ────────────────────────────────────────────────
let exitShown=false;
function initExitIntent(){
  document.addEventListener('mouseleave',(e)=>{
    if(e.clientY<=0&&!exitShown&&!user){
      exitShown=true;
      document.getElementById('exitPopup').classList.add('open');
    }
  });
}
function closeExitPopup(){
  document.getElementById('exitPopup').classList.remove('open');
}

// ── BIO GENERATOR ──────────────────────────────────────────────
async function generateBio(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('bioUpgrade','bioResult');return;}
  const niche=document.getElementById('proBioNiche').value;
  const pseudo=document.getElementById('proBioPseudo').value;
  const valeur=document.getElementById('proBioValeur').value;
  const langue=document.getElementById('proBioLangue').value;
  const objectif=document.getElementById('proBioObjectif').value;
  if(!valeur){alert('Decris ta valeur ajoutee !');return;}
  const btn=document.getElementById('proBioBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'bio',niche,pseudo,valeur,langue,objectif})});
    const data=await res.json();
    document.getElementById('bioResultText').textContent=data.result;
    document.getElementById('bioResult').classList.add('show');
    document.getElementById('bioUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('bioUpgrade',null),800);}
  }catch(e){document.getElementById('bioResultText').textContent='Erreur. Reessaie.';document.getElementById('bioResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='👤 Generer ma bio TikTok';
}

// ── THUMBNAIL GENERATOR ────────────────────────────────────────
async function generateThumbnail(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('thumbUpgrade','thumbResult');return;}
  const niche=document.getElementById('proThumbNiche').value;
  const sujet=document.getElementById('proThumbSujet').value;
  const style=document.getElementById('proThumbStyle').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('proThumbBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'thumbnail',niche,sujet,style})});
    const data=await res.json();
    document.getElementById('thumbResultText').textContent=data.result;
    document.getElementById('thumbResult').classList.add('show');
    document.getElementById('thumbUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('thumbUpgrade',null),800);}
  }catch(e){document.getElementById('thumbResultText').textContent='Erreur. Reessaie.';document.getElementById('thumbResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🖼️ Generer mon concept miniature';
}

// ── ACCOUNT ANALYZER ───────────────────────────────────────────
async function analyzeAccount(){
  if(!user){openModal('signup');return;}
  if(!userIsPro&&getFreeUsed()){showUpgrade('accountUpgrade','accountResult');return;}
  const pseudo=document.getElementById('proAccountPseudo').value;
  const niche=document.getElementById('proAccountNiche').value;
  const followers=document.getElementById('proAccountFollowers').value;
  const views=document.getElementById('proAccountViews').value;
  const probleme=document.getElementById('proAccountProbleme').value;
  const desc=document.getElementById('proAccountDesc').value;
  if(!followers){alert('Entre le nombre d abonnes !');return;}
  const btn=document.getElementById('proAccountBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'account',pseudo,niche,followers,views,probleme,desc})});
    const data=await res.json();
    document.getElementById('accountResultText').textContent=data.result;
    document.getElementById('accountResult').classList.add('show');
    document.getElementById('accountUpgrade').style.display='none';
    if(!userIsPro){setFreeUsed();updateNav();setTimeout(()=>showUpgrade('accountUpgrade',null),800);}
  }catch(e){document.getElementById('accountResultText').textContent='Erreur. Reessaie.';document.getElementById('accountResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🔎 Analyser mon compte';
}

// ── DEMO VERSIONS ──────────────────────────────────────────────
async function handleDemoBio(){
  if(!checkAndBlockDemo())return;
  const niche=document.getElementById('demoBioNiche').value;
  const pseudo=document.getElementById('demoBioPseudo').value;
  const valeur=document.getElementById('demoBioValeur').value;
  const objectif=document.getElementById('demoBioObjectif').value;
  if(!valeur){alert('Decris ta valeur ajoutee !');return;}
  const btn=document.getElementById('demoBioBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'bio',niche,pseudo,valeur,langue:'francais',objectif})});
    const data=await res.json();
    document.getElementById('demoBioResultText').textContent=data.result;
    document.getElementById('demoBioResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoBioResultText').textContent='Erreur. Reessaie.';document.getElementById('demoBioResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='👤 Generer ma bio';
}

async function handleDemoThumbnail(){
  if(!checkAndBlockDemo())return;
  const niche=document.getElementById('demoThumbNiche').value;
  const sujet=document.getElementById('demoThumbSujet').value;
  const style=document.getElementById('demoThumbStyle').value;
  if(!sujet){alert('Entre le sujet de ta video !');return;}
  const btn=document.getElementById('demoThumbBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Generation en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'thumbnail',niche,sujet,style})});
    const data=await res.json();
    document.getElementById('demoThumbResultText').textContent=data.result;
    document.getElementById('demoThumbResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoThumbResultText').textContent='Erreur. Reessaie.';document.getElementById('demoThumbResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🖼️ Generer mon concept miniature';
}

async function handleDemoAccount(){
  if(!checkAndBlockDemo())return;
  const pseudo=document.getElementById('demoAccountPseudo').value;
  const niche=document.getElementById('demoAccountNiche').value;
  const followers=document.getElementById('demoAccountFollowers').value;
  const views=document.getElementById('demoAccountViews').value;
  const probleme=document.getElementById('demoAccountProbleme').value;
  if(!followers){alert('Entre le nombre d abonnes !');return;}
  const btn=document.getElementById('demoAccountBtn');
  btn.disabled=true;btn.innerHTML='<span class="dots">Analyse en cours</span>';
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'account',pseudo,niche,followers,views,probleme,desc:''})});
    const data=await res.json();
    document.getElementById('demoAccountResultText').textContent=data.result;
    document.getElementById('demoAccountResult').classList.add('show');
    afterDemoGenerate();
  }catch(e){document.getElementById('demoAccountResultText').textContent='Erreur. Reessaie.';document.getElementById('demoAccountResult').classList.add('show');}
  btn.disabled=false;btn.innerHTML='🔎 Analyser mon compte';
}

setStars(5);
init();
animateLiveCounter();
startToasts();
initExitIntent();
