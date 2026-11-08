/* ===== spity-undersea-partie.js : la partie d’UnderSea (écran hôte + téléphones) ===== */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Images des rôles (PNG dans le dossier "jeux" sur GitHub).
   Change les noms pour qu’ils correspondent à tes fichiers.
   Laisse "" (ou si l’image est introuvable) : un emoji s’affiche à la place. */
var US_IMG_ROLES = {
  civil:      "jeux/poisson-clown.png",
  undercover: "jeux/requin.png",
  mrwhite:    "jeux/pieuvre.png"
};

/* Noms affichés (le « pluriel » sert au titre : VICTOIRE des Civils) */
var US_ROLES = {
  civil:      {nom:"Civil",      pluriel:"des Civils",     emoji:"🐟"},
  undercover: {nom:"Undercover", pluriel:"des Undercover", emoji:"🕵️"},
  mrwhite:    {nom:"Mr White",   pluriel:"de Mr White",    emoji:"👻"}
};

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var st=document.createElement("style");
st.textContent=`
.uw{position:relative;box-sizing:border-box;min-height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,24px);padding:72px clamp(14px,4vw,44px) 28px;text-align:center}
.ut{margin:0;font-weight:800;font-size:clamp(2rem,6vw,3.8rem);line-height:1.05;text-shadow:0 4px 18px rgba(0,40,90,.5)}
.us{font-weight:600;font-size:clamp(1rem,2.4vw,1.5rem);text-shadow:0 2px 10px rgba(0,40,90,.5)}
.uquit{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;padding:8px 18px;font-weight:800;color:#fff;border-radius:999px}
.uord{display:flex;flex-wrap:wrap;gap:clamp(12px,2.2vw,26px);justify-content:center;max-width:1100px}
.uo{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px}
.uo .nb{position:absolute;top:-6px;left:-6px;z-index:2;min-width:30px;height:30px;border-radius:50%;background:#ffc23d;color:#4a2a00;font-weight:800;display:grid;place-items:center;box-shadow:0 3px 0 #c27f00}
.uo.ok::after{content:"✓";position:absolute;top:-6px;right:-6px;z-index:2;width:30px;height:30px;border-radius:50%;background:#34d9bc;color:#082a24;font-weight:800;display:grid;place-items:center}
.uh .av{width:var(--ah,clamp(56px,11vh,110px))}
.uh.dense{--ah:clamp(40px,8vh,76px)}
.uh .ubig .av{width:clamp(150px,28vh,280px);border-width:8px}
.uh .uwin .av{width:clamp(80px,18vh,180px)}
.urev{display:flex;align-items:center;gap:16px;justify-content:center}
.us2{font-weight:800;font-size:clamp(1.5rem,4vw,2.6rem)}
.urole{display:grid;place-items:center;flex:none}
.urole img{width:100%;height:100%;object-fit:contain}
.urole.rs{width:52px;height:52px;font-size:2.2rem}
.urole.rm{width:clamp(110px,22vh,220px);height:clamp(110px,22vh,220px);font-size:clamp(4rem,12vh,8rem)}
.uvic{font-weight:800;font-size:clamp(3rem,13vw,9rem);line-height:.95;letter-spacing:.04em;color:#ffd96e;text-shadow:0 6px 0 #c27f00,0 12px 30px rgba(0,40,90,.5);animation:uvp .8s cubic-bezier(.3,1.6,.5,1)}
@keyframes uvp{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.uconf{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5}
.urec{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;width:min(100%,1100px)}
.uc{padding:12px 8px 14px;display:flex;flex-direction:column;align-items:center;gap:6px}
.uc.win{border-color:#ffc23d;box-shadow:0 0 0 3px rgba(255,194,61,.5)}
.uh .uc .av{width:72px;border-width:4px}
.uname{font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ur{display:flex;align-items:center;gap:8px;font-weight:800}
.ubtns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.tw{box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 20px;text-align:center}
.tt{margin:0;font-weight:800;font-size:clamp(1.8rem,8vw,2.8rem);line-height:1.05;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.ts{font-weight:600;font-size:1.1rem;max-width:460px;text-shadow:0 2px 8px rgba(0,40,90,.5)}
.tvic{font-weight:800;font-size:clamp(3rem,16vw,6rem);line-height:1}
.tvic.win{color:#ffd96e;text-shadow:0 5px 0 #c27f00}
.tvic.lose{color:#cfe3ff;text-shadow:0 5px 0 #3f5a8a}
.ucard{padding:0;background:none;border:0;perspective:900px;width:min(78vw,340px,calc(52vh*.75));aspect-ratio:3/4;cursor:pointer}
.uci{position:relative;width:100%;height:100%;transition:transform .6s;transform-style:preserve-3d}
.ucard.on .uci{transform:rotateY(180deg)}
.ucf,.ucb{position:absolute;inset:0;box-sizing:border-box;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;border:4px solid rgba(255,255,255,.7);box-shadow:0 14px 30px rgba(0,40,90,.4);font-weight:800;font-size:1.2rem}
.ucf{background:linear-gradient(160deg,#9170ff,#3f26a8);color:#fff}
.ucb{background:linear-gradient(160deg,#fff,#d8f6ff);color:#12264d;transform:rotateY(180deg)}
.uq{font-size:5rem;line-height:1}
.umot{font-size:clamp(2rem,10vw,3.4rem);line-height:1.05;overflow-wrap:anywhere}
.ucb .ts{color:#12264d;text-shadow:none;font-size:1rem}
.uvg{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px;width:100%;max-width:520px}
.uvp{background:var(--glass);border:2px solid var(--line);border-radius:18px;padding:10px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;color:#fff;font-weight:800}
.uvp.on{border-color:#ffc23d;background:rgba(255,194,61,.28);transform:scale(1.04)}
.tw .av{width:64px;border-width:3px}
.uvp span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
document.head.appendChild(st);

/* ----- Outils ----- */
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function mel(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
function ids(l){return l.map(function(p){return p.id})}
function titre(roles){return (roles||[]).map(function(r){return US_ROLES[r].pluriel}).join(" et ")}
function fait(p){return Avatar.make(p)}
function bouton(txt,cls,fn){var b=h("button","btn "+(cls||""),txt);b.onclick=fn;return b}
function roleImg(r,sz){
  var d=h("div","urole "+sz),src=US_IMG_ROLES[r];
  function emo(){d.innerHTML="";d.appendChild(h("span","",US_ROLES[r].emoji))}
  if(!src)emo();else{var i=new Image();i.alt=US_ROLES[r].nom;i.onerror=emo;i.src=src;d.appendChild(i)}
  return d}
function perso(p,badge){
  var d=h("div","uo");if(badge)d.appendChild(h("div","nb",badge));
  d.appendChild(fait(p));d.appendChild(h("div","nm",p.name));return d}
function confettis(c){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var x=c.getContext("2d"),W=c.width=innerWidth,Hh=c.height=innerHeight,
      cols=["#ffc23d","#7a57f5","#34d9bc","#ff6fa8","#ff7a59","#ffffff"],ps=[];
  for(var i=0;i<180;i++)ps.push({x:Math.random()*W,y:-Math.random()*Hh,r:6+Math.random()*9,c:cols[i%cols.length],vy:2+Math.random()*4,vx:(Math.random()-.5)*3,a:Math.random()*6,va:(Math.random()-.5)*.3});
  (function f(){
    if(!document.body.contains(c))return;
    x.clearRect(0,0,W,Hh);
    ps.forEach(function(p){p.y+=p.vy;p.x+=p.vx;p.a+=p.va;if(p.y>Hh+20){p.y=-20;p.x=Math.random()*W}
      x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);x.restore()});
    requestAnimationFrame(f)})()}

/* ======================= ÉCRAN DE L’HÔTE ======================= */
var O={},G=null,scores={};
function trouver(id){for(var i=0;i<G.ps.length;i++)if(G.ps[i].id===id)return G.ps[i]}
function vivants(){return G.ps.filter(function(p){return p.vivant})}
function diffuser(x){var m={t:"us:etat",phase:G.phase,vivants:ids(vivants())};for(var k in x)m[k]=x[k];O.tous(m)}

function lancer(cfg){
  var l=O.joueurs();
  if(l.length<3)return O.toast("Il faut au moins 3 joueurs.");
  var roles=[],i;
  for(i=0;i<cfg.undercover;i++)roles.push("undercover");
  for(i=0;i<cfg.mrwhite;i++)roles.push("mrwhite");
  while(roles.length<l.length)roles.push("civil");
  roles=mel(roles.slice(0,l.length));
  var mots=Mots.tirer();
  if(Math.random()<.5)mots={a:mots.b,b:mots.a};   /* une fois sur deux, on inverse : le mot « undercover » devient celui des civils */
  G={ps:l.map(function(p,k){var q={};for(var key in p)q[key]=p[key];q.role=roles[k];q.vivant=true;return q}),
     mots:mots,phase:"carte",tour:0,vu:{},votes:{}};
  var roster=G.ps.map(function(p){return{id:p.id,name:p.name,avatar:p.avatar,ring:p.ring,contour:p.contour,acc:p.acc}});
  G.ps.forEach(function(p){
    O.envoyer(p.id,{t:"us:start",moi:p.id,roster:roster,mrwhite:p.role==="mrwhite",
      mot:p.role==="mrwhite"?"":(p.role==="undercover"?mots.b:mots.a)})});
  nouveauTour();
  O.afficher("usHote")}

function nouveauTour(){
  G.tour++;G.phase="carte";G.votes={};
  var o=mel(vivants());
  /* Mr White ne parle jamais en premier (sinon il est trop facilement démasqué) */
  if(o.length>1&&o[0].role==="mrwhite"){var j=1+Math.floor(Math.random()*(o.length-1)),t=o[0];o[0]=o[j];o[j]=t}
  G.ordre=ids(o);
  diffuser();dessiner()}

function lancerVote(){G.phase="vote";G.votes={};diffuser();dessiner()}

function depouiller(){
  var cnt={},max=0;
  Object.keys(G.votes).forEach(function(v){var c=G.votes[v];cnt[c]=(cnt[c]||0)+1;if(cnt[c]>max)max=cnt[c]});
  if(!max)return O.toast("Aucun vote reçu.");
  var top=Object.keys(cnt).filter(function(c){return cnt[c]===max});
  if(top.length>1){G.phase="egalite";G.egaux=top;diffuser();dessiner();return}
  var p=trouver(top[0]);p.vivant=false;G.elim=p.id;
  if(p.role==="mrwhite"){G.phase="devine";G.devineId=p.id;diffuser({devine:p.id})}
  else{G.phase="resultat";diffuser()}
  dessiner()}

function valider(mot){
  G.essai=String(mot||"").slice(0,30);
  if(norm(G.essai)&&norm(G.essai)===norm(G.mots.a))return terminer(["mrwhite"]);
  G.phase="rate";diffuser();dessiner()}

function verifier(){
  var v=vivants(),sp=v.filter(function(p){return p.role!=="civil"}),ci=v.length-sp.length;
  if(!sp.length)return["civil"];
  if(ci<=sp.length){var r=[];sp.forEach(function(p){if(r.indexOf(p.role)<0)r.push(p.role)});return r}
  return null}

function suite(){var w=verifier();w?terminer(w):nouveauTour()}

function terminer(roles){
  G.roles=roles;
  G.gagnants=ids(G.ps.filter(function(p){return roles.indexOf(p.role)>=0}));
  G.gagnants.forEach(function(i){scores[i]=(scores[i]||0)+1});
  G.phase="fin";diffuser({gagnants:G.gagnants,roles:roles});dessiner()}

function quitter(dest){O.tous({t:"us:retour"});G=null;dest()}

function recevoir(id,m){
  if(!G)return;
  var p=trouver(id);if(!p)return;
  if(m.t==="us:vu"){G.vu[id]=1;if(G.phase==="carte")dessiner()}
  else if(m.t==="us:vote"&&G.phase==="vote"&&p.vivant){
    var c=trouver(m.cible);
    if(!c||!c.vivant||c.id===id)return;
    G.votes[id]=c.id;
    vivants().every(function(x){return G.votes[x.id]})?depouiller():dessiner()}
  else if(m.t==="us:devine"&&G.phase==="devine"&&id===G.devineId)valider(m.mot)}

function dessiner(){
  var r=O.root;r.innerHTML="";
  var w=h("div","uw uh"+(G.ps.length>10?" dense":""));r.appendChild(w);
  var p=G.phase,el=G.elim&&trouver(G.elim),o,n;
  if(p!=="fin"&&p!=="recap"){
    var q=h("button","uquit glass","Arrêter");
    q.onclick=function(){if(confirm("Arrêter la partie ?"))quitter(O.menu)};w.appendChild(q)}

  if(p==="carte"){
    n=Object.keys(G.vu).length;
    w.appendChild(h("h2","ut","Tour "+G.tour));
    w.appendChild(h("div","us","Regardez votre carte sur votre téléphone ("+n+"/"+G.ps.length+")"));
    w.appendChild(h("div","us","Ordre de parole"));
    o=h("div","uord");G.ordre.forEach(function(id,i){o.appendChild(perso(trouver(id),i+1))});w.appendChild(o);
    w.appendChild(bouton("Voter","sun",lancerVote))}

  else if(p==="vote"){
    var v=vivants();n=v.filter(function(x){return G.votes[x.id]}).length;
    w.appendChild(h("h2","ut","Votez !"));
    w.appendChild(h("div","us","Choisissez l’intrus sur votre téléphone ("+n+"/"+v.length+")"));
    o=h("div","uord");v.forEach(function(x){var d=perso(x);if(G.votes[x.id])d.classList.add("ok");o.appendChild(d)});w.appendChild(o);
    w.appendChild(bouton("Terminer le vote","",depouiller))}

  else if(p==="egalite"){
    w.appendChild(h("h2","ut","Égalité !"));
    w.appendChild(h("div","us","Personne n’est éliminé, on recommence."));
    o=h("div","uord");G.egaux.forEach(function(id){o.appendChild(perso(trouver(id)))});w.appendChild(o);
    w.appendChild(bouton("Nouveau tour","sun",nouveauTour))}

  else if(p==="resultat"||p==="devine"){
    w.appendChild(h("h2","ut",el.name+" est éliminé"));
    var b=h("div","ubig");b.appendChild(fait(el));w.appendChild(b);
    var rv=h("div","urev");rv.appendChild(roleImg(el.role,"rm"));rv.appendChild(h("div","us2","Il était "+US_ROLES[el.role].nom));w.appendChild(rv);
    if(p==="devine"){
      w.appendChild(h("div","us","Mr White peut encore gagner : il doit deviner le mot des civils sur son téléphone."));
      w.appendChild(bouton("Il passe","",function(){valider("")}))}
    else w.appendChild(bouton("Continuer","sun",suite))}

  else if(p==="rate"){
    w.appendChild(h("h2","ut","Raté !"));
    w.appendChild(h("div","us",G.essai?"Mr White a proposé « "+G.essai+" »":"Mr White n’a rien proposé"));
    w.appendChild(bouton("Continuer","sun",suite))}

  else if(p==="fin"){
    var c=h("canvas","uconf");w.appendChild(c);
    w.appendChild(h("div","uvic","VICTOIRE"));
    w.appendChild(h("h2","ut",titre(G.roles)));
    o=h("div","uord uwin");G.ps.filter(function(x){return G.gagnants.indexOf(x.id)>=0}).forEach(function(x){o.appendChild(perso(x))});w.appendChild(o);
    w.appendChild(bouton("Suivant","sun",function(){G.phase="recap";dessiner()}));
    confettis(c)}

  else if(p==="recap"){
    w.appendChild(h("h2","ut","Les rôles"));
    w.appendChild(h("div","us","Mot des civils : "+G.mots.a+" — mot de l’undercover : "+G.mots.b));
    var g=h("div","urec");
    G.ps.forEach(function(x){
      var gagne=G.gagnants.indexOf(x.id)>=0,c=h("div","uc glass"+(gagne?" win":""));
      c.appendChild(fait(x));c.appendChild(h("div","uname",x.name));
      var rr=h("div","ur");rr.appendChild(roleImg(x.role,"rs"));rr.appendChild(h("span","",US_ROLES[x.role].nom));c.appendChild(rr);
      c.appendChild(h("div","",(gagne?"+1 point, ":"")+"total : "+(scores[x.id]||0)));
      g.appendChild(c)});
    w.appendChild(g);
    var bt=h("div","ubtns");
    bt.appendChild(bouton("Rejouer à UnderSea","sun",function(){quitter(O.menu)}));
    bt.appendChild(bouton("Changer de jeu","",function(){quitter(O.jeux)}));
    w.appendChild(bt)}
}

var Hote={
  init:function(o){O=o},
  lancer:lancer,
  recevoir:recevoir,
  points:function(){return scores}
};

/* ======================= TÉLÉPHONE ======================= */
var TO={},T={};

function tdessiner(){
  var r=TO.root;r.innerHTML="";
  var w=h("div","tw");r.appendChild(w);
  var e=T.etat||{phase:"carte",vivants:[]},ph=e.phase,vivant=e.vivants.indexOf(T.moi)>=0;

  if(ph==="fin"){
    var gagne=(e.gagnants||[]).indexOf(T.moi)>=0;
    w.appendChild(h("div","tvic "+(gagne?"win":"lose"),gagne?"Victoire !":"Défaite"));
    w.appendChild(h("div","ts","Victoire "+titre(e.roles)));
    w.appendChild(h("div","ts","Regarde l’écran pour voir le rôle de chacun."))}

  else if(ph==="vote"&&vivant){
    w.appendChild(h("h2","tt","Qui est l’intrus ?"));
    if(T.aVote)w.appendChild(h("div","ts","Vote envoyé ✓ On attend les autres…"));
    else{
      var g=h("div","uvg"),bv=bouton("Voter","sun",function(){
        if(!T.choix)return;
        TO.envoyer({t:"us:vote",cible:T.choix});T.aVote=true;tdessiner()});
      bv.disabled=!T.choix;
      e.vivants.forEach(function(id){
        if(id===T.moi)return;
        var p=T.roster.filter(function(x){return x.id===id})[0];if(!p)return;
        var b=h("button","uvp"+(T.choix===id?" on":""));b.appendChild(fait(p));b.appendChild(h("span","",p.name));
        b.onclick=function(){T.choix=id;[].forEach.call(g.children,function(c){c.classList.toggle("on",c===b)});bv.disabled=false};
        g.appendChild(b)});
      w.appendChild(g);w.appendChild(bv)}}

  else if(ph==="devine"&&e.devine===T.moi){
    w.appendChild(h("h2","tt","Tu es démasqué !"));
    w.appendChild(h("div","ts","Tu peux encore gagner : quel est le mot des civils ?"));
    if(T.aDevine)w.appendChild(h("div","ts","Réponse envoyée ✓ Regarde l’écran."));
    else{
      var inp=h("input","in");inp.maxLength=30;inp.placeholder="Le mot des civils";inp.autocomplete="off";inp.setAttribute("aria-label","Mot des civils");
      w.appendChild(inp);
      w.appendChild(bouton("Valider","sun",function(){
        if(!inp.value.trim())return;
        TO.envoyer({t:"us:devine",mot:inp.value});T.aDevine=true;tdessiner()}))}}

  else{
    var c=h("button","ucard"+(T.retourne?" on":""));c.setAttribute("aria-label","Ma carte");
    c.innerHTML='<div class="uci"><div class="ucf"><div class="uq">?</div><div>Touche pour voir ton mot</div></div><div class="ucb"></div></div>';
    var dos=c.querySelector(".ucb");
    if(T.mrwhite){dos.appendChild(h("div","umot","Mr White"));dos.appendChild(h("div","ts","Tu n’as pas de mot. Écoute bien les autres et fais semblant !"))}
    else dos.appendChild(h("div","umot",T.mot));
    c.onclick=function(){
      T.retourne=!T.retourne;c.classList.toggle("on",T.retourne);
      if(T.retourne&&!T.vu){T.vu=true;TO.envoyer({t:"us:vu"})}};
    w.appendChild(c);
    var txt=!vivant?"Tu es éliminé. Regarde l’écran !":
      ph==="carte"?"Décris ton mot sans le dire quand c’est ton tour.":
      ph==="vote"?"Les autres votent.":
      ph==="devine"?"Mr White tente de deviner le mot…":
      ph==="egalite"?"Égalité, on recommence !":"Regarde l’écran.";
    w.appendChild(h("div","ts",txt))}
}

var Tel={
  init:function(o){TO=o},
  recevoir:function(m){
    if(m.t==="us:start"){
      T={moi:m.moi,roster:m.roster,mot:m.mot,mrwhite:m.mrwhite,retourne:false,vu:false,etat:null,choix:"",aVote:false,aDevine:false};
      TO.afficher("usTel");tdessiner()}
    else if(m.t==="us:etat"){
      if(m.phase==="vote"){T.choix="";T.aVote=false}
      if(m.phase==="devine")T.aDevine=false;
      T.etat=m;tdessiner()}
    else if(m.t==="us:retour"){T={};TO.afficher("wait")}}
};

window.UsPartie={hote:Hote,tel:Tel};
})();
