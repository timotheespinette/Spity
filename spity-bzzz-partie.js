/* ===== spity-bzzz-partie.js : moteur commun de Bzzz (écran hôte + téléphones) =====
   Les 3 modes (spity-bzzz-tour.js, spity-bzzz-buzzer.js, spity-bzzz-qcm.js)
   s'enregistrent avec BzzzPartie.mode("id", {...}). Ce fichier doit être chargé AVANT eux. */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Choix multiples : secondes pour répondre */
var BP_DUREE_QCM = 20;
/* Secondes d'affichage du classement temporaire (choix multiples) */
var BP_DUREE_CLASSEMENT = 7;
/* Chance qu'une question soit « ×2 » (Buzzer et Choix multiples) : 0.15 = 15 % */
var BP_PROBA_X2 = 0.15;
/* Buzzer : points pour une bonne réponse / une mauvaise réponse */
var BP_BUZZER_OK = 2;
var BP_BUZZER_RATE = -1;

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var MODES = {}, O = {}, G = null, TO = {}, T = {};

var st = document.createElement("style");
st.textContent = `
#bzHote,#bzTel{padding:0;overflow-y:auto}
.bpw{position:relative;box-sizing:border-box;min-height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.2vh,22px);padding:72px clamp(14px,4vw,44px) 28px;text-align:center}
.bpquit{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;padding:8px 18px;font-weight:800;color:#fff;border-radius:999px}
.bpt2{margin:0;font-weight:800;font-size:clamp(2rem,6vw,3.6rem);line-height:1.05;text-shadow:0 4px 18px rgba(0,40,90,.5)}
.bpq{font-weight:800;font-size:clamp(1.6rem,4.6vw,3.2rem);line-height:1.1;max-width:1000px;text-shadow:0 3px 14px rgba(0,40,90,.5)}
.bps{font-weight:600;font-size:clamp(1rem,2.4vw,1.5rem);text-shadow:0 2px 10px rgba(0,40,90,.5)}
.bpans{font-weight:800;font-size:clamp(1.3rem,3.4vw,2.2rem);padding:8px 22px;border-radius:18px;background:rgba(255,255,255,.18)}
.bptop{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap}
.bpnum{font-weight:800;font-size:1.2rem;padding:4px 16px;border-radius:999px;background:var(--glass);border:1.5px solid var(--line)}
.bpx2{font-weight:800;font-size:1.4rem;padding:4px 18px;border-radius:999px;background:#ffc23d;color:#4a2a00;box-shadow:0 4px 0 #c27f00;animation:bpp .8s cubic-bezier(.3,1.6,.5,1)}
@keyframes bpp{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.bpbtns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.bpu{display:flex;flex-direction:column;align-items:center;gap:4px}
.bpub{background:none;padding:8px;border-radius:18px;border:2px solid transparent}
.bpub:hover,.bpub:focus-visible{border-color:#ffc23d;background:rgba(255,194,61,.2);outline:0}
.bpgrid{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;max-width:1100px}
.bph .av{width:clamp(56px,11vh,110px)}
.bph .bprow .av{width:52px;border-width:3px}
.bpeq{width:clamp(56px,11vh,110px);aspect-ratio:1;box-sizing:border-box;border-radius:50%;border:5px solid #fff;background:#bfeaf7;display:grid;place-items:center;font-size:2.2rem;line-height:1;overflow:hidden;box-shadow:0 8px 20px rgba(0,40,90,.35)}
.bpeq img{width:100%;height:100%;object-fit:contain}
.bph .bprow .bpeq{width:52px;border-width:3px;font-size:1.5rem}
.bprank{display:flex;flex-direction:column;gap:8px;width:min(100%,640px)}
.bprow{display:flex;align-items:center;gap:12px;padding:8px 14px;text-align:left}
.bprow.top{border-color:#ffc23d;box-shadow:0 0 0 3px rgba(255,194,61,.5)}
.bprg{width:30px;font-weight:800;font-size:1.5rem;text-align:center}
.bprn{flex:1;min-width:0;font-weight:800;font-size:1.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bppt{font-weight:800;font-size:1.3rem}
.bpg{font-weight:800;padding:2px 10px;border-radius:999px;background:#34d9bc;color:#082a24}
.bpg.neg{background:#ff7a59;color:#3a0d00}
.bpvic{font-weight:800;font-size:clamp(3rem,13vw,8rem);line-height:.95;letter-spacing:.04em;color:#ffd96e;text-shadow:0 6px 0 #c27f00,0 12px 30px rgba(0,40,90,.5);animation:bpp .8s cubic-bezier(.3,1.6,.5,1)}
.bptimer{font-weight:800;font-size:clamp(1.6rem,4vw,2.6rem)}
.bplc{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.bpch{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;width:min(100%,1000px)}
.bpc{padding:16px 14px;border-radius:20px;font-weight:800;font-size:clamp(1.1rem,2.6vw,1.8rem);border:3px solid rgba(255,255,255,.55);color:#fff;text-align:left}
.bpc.ok{outline:5px solid #34d9bc;box-shadow:0 0 24px #34d9bc}
.bpc.ko{opacity:.45}
.c0{background:#e8503a}.c1{background:#2f7be8}.c2{background:#e8a82a;color:#3a2600}.c3{background:#2fb86a}.c4{background:#9a55e8}.c5{background:#e85ea0}
.bpp{width:48px;height:48px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:1.7rem;line-height:1}
.bpp:disabled{opacity:.3}
.bph select.in{appearance:auto;-webkit-appearance:menulist;max-width:520px}
.bpt{box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 20px;text-align:center}
.bptt{margin:0;font-weight:800;font-size:clamp(1.6rem,7vw,2.6rem);line-height:1.1;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.bpts{font-weight:600;font-size:1.1rem;max-width:460px;text-shadow:0 2px 8px rgba(0,40,90,.5)}
.bptv{font-weight:800;font-size:clamp(2.6rem,14vw,5rem);line-height:1}
.bptv.win{color:#ffd96e;text-shadow:0 5px 0 #c27f00}
.bptv.lose{color:#cfe3ff;text-shadow:0 5px 0 #3f5a8a}
.bpcg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;width:100%;max-width:440px}
.bpcb{width:100%;aspect-ratio:1;min-height:100px;padding:0;border-radius:18px;border:3px solid rgba(255,255,255,.5);cursor:pointer;font-weight:800;font-size:1.2rem;color:#fff}
.bpcb.c2{color:#3a2600}
.bpcb.on{outline:5px solid #fff;transform:scale(1.03)}
.bpbuzz{width:min(70vw,300px);aspect-ratio:1;border-radius:50%;font-weight:800;font-size:3rem;color:#fff;background:radial-gradient(circle at 35% 30%,#ff9a7a,#e8503a);box-shadow:0 10px 0 #8f2412,0 18px 30px rgba(0,40,90,.4)}
.bpbuzz:active{transform:translateY(10px);box-shadow:0 0 0 transparent}
.bpbuzz:disabled{filter:grayscale(.8) brightness(.7);box-shadow:none}
.bpconfetti{
  position:fixed;
  top:-15px;
  width:10px;
  height:16px;
  z-index:9999;
  pointer-events:none;
  animation:bpconfettiFall 3s linear forwards;
}
@keyframes bpconfettiFall{
  to{
    transform:translateY(110vh) rotate(900deg);
    opacity:0;
  }
}
`;
document.head.appendChild(st);

/* ----- Outils ----- */
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function mel(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function bouton(txt,cls,fn){var b=h("button","btn "+(cls||""),txt);b.type="button";b.onclick=fn;return b}
function lancerConfettis(){
  var couleurs=["#ffc23d","#9170ff","#34d9bc","#ff7a59","#ffffff","#ff6fa8"];

  for(var i=0;i<120;i++){
    var c=document.createElement("div");
    c.className="bpconfetti";
    c.style.left=Math.random()*100+"vw";
    c.style.background=couleurs[Math.floor(Math.random()*couleurs.length)];
    c.style.animationDelay=Math.random()*1.5+"s";
    c.style.animationDuration=(2.5+Math.random()*2)+"s";
    document.body.appendChild(c);
    c.addEventListener("animationend",function(){this.remove()});
  }
}
function fmt(n){return String(Math.round(n*100)/100).replace(".",",")}
function pt(n){return fmt(n)+(Math.abs(n)>1?" pts":" pt")}
function present(){var l=O.joueurs().map(function(p){return p.id});return G.ps.filter(function(p){return l.indexOf(p.id)>=0})}
function unitDe(pid){for(var i=0;i<G.units.length;i++)if(G.units[i].membres.indexOf(pid)>=0)return G.units[i];return null}
function unit(id){for(var i=0;i<G.units.length;i++)if(G.units[i].id===id)return G.units[i]}

function faceEq(t){
  var d=h("div","bpeq");d.style.borderColor=t.couleur;
  function emo(){d.innerHTML="";d.appendChild(h("span","",t.emoji))}
  if(!t.img)emo();else{var i=new Image();i.alt="";i.onerror=emo;i.src=t.img;d.appendChild(i)}
  return d}
function face(u){return u.p?Avatar.make(u.p):faceEq(u.team)}
function chip(u,fn){
  var d=h(fn?"button":"div","bpu"+(fn?" bpub":""));
  if(fn){d.type="button";d.onclick=fn}
  d.appendChild(face(u));d.appendChild(h("div","nm",u.nom));return d}

function creerUnites(cfg,ps){
  var eq=cfg.equipes&&window.Equipes&&Equipes.resultat(),ids=ps.map(function(p){return p.id});
  if(eq&&eq.length)return eq.map(function(e){
    return{id:e.id,nom:e.nom,team:e,membres:e.joueurs.filter(function(id){return ids.indexOf(id)>=0}),pts:0}});
  return ps.map(function(p){return{id:p.id,nom:p.name,p:p,membres:[p.id],pts:0}})}

/* Ajoute (ou retire) des points à un joueur / une équipe */
function pts(u,d){
  d=Math.round(d*100)/100;
  u.pts=Math.round((u.pts+d)*100)/100;
  G.gain[u.id]=Math.round(((G.gain[u.id]||0)+d)*100)/100}

function classe(){
  var l=G.units.slice().sort(function(a,b){return b.pts-a.pts}),r=[];
  l.forEach(function(u,i){r.push({u:u,rang:(i>0&&u.pts===l[i-1].pts)?r[i-1].rang:i+1})});
  return r}

/* ----- Minuteur ----- */
function stop(){if(!G)return;clearTimeout(G.t);clearInterval(G.tick)}
function tick(){
  if(!G)return;
  var e=O.root.querySelector(".bpcd");
  if(e)e.textContent=Math.max(0,Math.ceil((G.fin-Date.now())/1000))}
function timer(sec,fn){
  stop();G.fin=Date.now()+sec*1000;
  G.t=setTimeout(fn,sec*1000);G.tick=setInterval(tick,250)}
function cd(){
  var d=h("div","bptimer");
  d.appendChild(h("span","bpcd",Math.max(0,Math.ceil((G.fin-Date.now())/1000))));
  d.appendChild(document.createTextNode(" s"));return d}

/* ----- Déroulement ----- */
function diffuser(m){O.tous(m)}
function etat(extra){var m={t:"bz:etat"};for(var k in extra)m[k]=extra[k];O.tous(m)}

function suivante(){
  if(!G)return;
  stop();G.i++;
  if(G.i>=G.qs.length)return fin();
  var M=MODES[G.mode];
  G.q=G.qs[G.i];G.gain={};G.phase="q";
  G.bonus=G.mode!=="tour"&&Math.random()<BP_PROBA_X2;
  var x=M.debut(G,E)||{},m={t:"bz:q",i:G.i,n:G.qs.length,bonus:G.bonus};
  if(G.q.choix){
     m.nbChoix=G.q.choix.length;
     m.multi=G.q.bonnes.length>1;
  }
  for(var k in x)m[k]=x[k];
  diffuser(m);dessiner()}

/* Fin de la question : on affiche réponse + classement temporaire */
function finQ(){
  if(!G||G.phase!=="q")return;
  stop();G.phase="cl";
  var M=MODES[G.mode],cl=classe();
  G.ps.forEach(function(p){
    var u=unitDe(p.id);if(!u)return;
    var x=cl.filter(function(c){return c.u===u})[0],
        m={t:"bz:cl",rang:x.rang,pts:u.pts,gain:G.gain[u.id]||0,n:G.units.length};
    var e=M.res&&M.res(p.id,G);if(e)for(var k in e)m[k]=e[k];
    O.envoyer(p.id,m)});
  if(M.auto)timer(BP_DUREE_CLASSEMENT,suivante);
  dessiner()}

function fin(){
  stop();G.phase="fin";G.gain={};
  var cl=classe(),max=cl[0].u.pts,
      win=max>0?cl.filter(function(x){return x.rang===1}).map(function(x){return x.u}):[],ids=[];
  G.gagnants=win;
  win.forEach(function(u){u.membres.forEach(function(id){ids.push(id)})});
  /* Un seul point dans le classement général pour le gagnant (ou chaque membre de l'équipe gagnante) */
  if(ids.length&&window.Scores&&typeof Scores.ajouter==="function")Scores.ajouter(ids,1);
  G.ps.forEach(function(p){
    var u=unitDe(p.id);if(!u)return;
    var x=cl.filter(function(c){return c.u===u})[0];
    O.envoyer(p.id,{t:"bz:fin",rang:x.rang,pts:u.pts,gagne:win.indexOf(u)>=0,n:G.units.length})});
  dessiner()}

function quitter(dest){stop();O.tous({t:"bz:retour"});G=null;dest()}

/* ----- Écran de configuration : choix de la bibliothèque ----- */
function config(cfg){
  var t=cfg.mode==="qcm"?"qcm":"qr",sel=BzzzMots.choisie(t).id,n=0;
  function d(){
    var libs=BzzzMots.liste(t),cur=libs.filter(function(l){return l.id===sel})[0]||libs[0];
    sel=cur.id;if(!n||n>cur.n)n=cur.n;
    var r=O.root;r.innerHTML="";
    var w=h("div","bpw bph");r.appendChild(w);
    var b=h("button","bpquit glass","← Retour");b.onclick=function(){O.menu()};w.appendChild(b);
    w.appendChild(h("h2","bpt2","Quelle bibliothèque ?"));
    var s=h("select","in");s.setAttribute("aria-label","Bibliothèque de questions");
    libs.forEach(function(l){
      var o=document.createElement("option");o.value=l.id;o.textContent=l.nom+" ("+l.n+")";o.selected=l.id===sel;s.appendChild(o)});
    s.onchange=function(){sel=s.value;n=0;d()};
    w.appendChild(s);
    w.appendChild(h("div","bps","Nombre de questions"));
    var c=h("div","bpbtns"),m=h("button","bpp","−"),p=h("button","bpp","+");
    m.type=p.type="button";m.disabled=n<=1;p.disabled=n>=cur.n;
    m.onclick=function(){n--;d()};p.onclick=function(){n++;d()};
    c.appendChild(m);c.appendChild(h("span","bptimer",n));c.appendChild(p);w.appendChild(c);
    w.appendChild(bouton("Lancer la partie","sun",function(){
      if(!cur.n)return O.toast("Cette bibliothèque est vide.");
      BzzzMots.selectionner(t,sel);
      commencer(cfg,BzzzMots.choisie(t).items,n)}))}
  d()}

function commencer(cfg,items,n){
  var l=O.joueurs(),M=MODES[cfg.mode];
  if(!M)return O.toast("Ce mode n’est pas encore disponible.");
  if(cfg.mode==="qcm"&&O.local)return O.toast("Choix multiples : en ligne uniquement.");
  if(!l.length)return O.toast("Aucun joueur.");
  G={cfg:cfg,mode:cfg.mode,i:-1,phase:"",gain:{},qs:mel(items).slice(0,n),
     ps:l.map(function(p){return{id:p.id,name:p.name,avatar:p.avatar,ring:p.ring,contour:p.contour,acc:p.acc}})};
  G.units=creerUnites(cfg,G.ps);
  G.ps.forEach(function(p){
    var u=unitDe(p.id);
    O.envoyer(p.id,{t:"bz:start",moi:p.id,mode:cfg.mode,unite:u?u.id:""})});
  suivante()}

/* ----- Affichage de l'hôte ----- */
function rangs(w,final){
  var g=h("div","bprank");
  classe().forEach(function(x){
    var r=h("div","bprow glass"+(x.rang===1?" top":""));
    r.appendChild(h("div","bprg",x.rang));r.appendChild(face(x.u));r.appendChild(h("div","bprn",x.u.nom));
    var d=G.gain[x.u.id];
    if(!final&&d)r.appendChild(h("div","bpg"+(d<0?" neg":""),(d>0?"+":"")+fmt(d)));
    r.appendChild(h("div","bppt",pt(x.u.pts)));
    g.appendChild(r)});
  w.appendChild(g)}

function dessiner(){
  var r=O.root;r.innerHTML="";
  var w=h("div","bpw bph");r.appendChild(w);
  var p=G.phase,M=MODES[G.mode],dernier=G.i>=G.qs.length-1;
  if(p!=="fin"){
    var q=h("button","bpquit glass","Arrêter");
    q.onclick=function(){if(confirm("Arrêter la partie ?"))quitter(O.menu)};w.appendChild(q)}

  if(p==="q"){
    var top=h("div","bptop");
    top.appendChild(h("div","bpnum","Question "+(G.i+1)+" / "+G.qs.length));
    if(G.bonus)top.appendChild(h("div","bpx2","×2 points !"));
    w.appendChild(top);
    M.hote(w,G,E)}

  else if(p==="cl"){
    w.appendChild(h("h2","bpt2","Classement"));
    if(G.q.choix){
      var lc=h("div","bplc");
      G.q.choix.forEach(function(c,k){lc.appendChild(h("div","bpc c"+(k%6)+(G.q.bonnes.indexOf(k)>=0?" ok":" ko"),c))});
      w.appendChild(lc)}
    else w.appendChild(h("div","bpans","Réponse : "+G.q.r));
    rangs(w,false);
    if(M.auto){
      var s=h("div","bps");
      s.appendChild(document.createTextNode((dernier?"Classement final":"Question suivante")+" dans "));
      s.appendChild(h("span","bpcd",Math.max(0,Math.ceil((G.fin-Date.now())/1000))));
      s.appendChild(document.createTextNode(" s"));w.appendChild(s)}
    else w.appendChild(bouton(dernier?"Classement final":"Question suivante","sun",suivante))}

  else if(p==="fin"){
    if(!G.confettisLances){
       G.confettisLances=true;
       lancerConfettis();
    }
    if(G.gagnants.length){
      w.appendChild(h("div","bpvic","VICTOIRE"));
      var g=h("div","bpgrid");G.gagnants.forEach(function(u){g.appendChild(chip(u))});w.appendChild(g)}
    else w.appendChild(h("h2","bpt2","Partie terminée"));
    rangs(w,true);
    var bt=h("div","bpbtns");
    bt.appendChild(bouton("Rejouer à Bzzz","sun",function(){quitter(O.menu)}));
    bt.appendChild(bouton("Changer de jeu","",function(){quitter(O.jeux)}));
    w.appendChild(bt)}
}

/* Ce que les modes peuvent utiliser */
var E={h:h,bouton:bouton,chip:chip,unit:unit,unitDe:unitDe,pts:pts,finQ:finQ,dessiner:dessiner,
  etat:etat,timer:timer,cd:cd,presents:present,fmt:fmt,
  local:function(){return !!O.local}};

var Hote={
  init:function(o){O=o},
  lancer:function(cfg){O.afficher("bzHote");config(cfg)},
  recevoir:function(id,m){
    if(!G||!G.q)return;
    var u=unitDe(id);if(!u)return;
    MODES[G.mode].recevoir(id,m,G,E,u)}
};

/* ======================= TÉLÉPHONE ======================= */
var X={h:h,bouton:bouton,
  envoyer:function(m){TO.envoyer(m)},
  redessiner:function(){tdessiner()},
  compte:function(el){
    clearInterval(T.iv);
    function f(){var s=Math.max(0,Math.ceil((T.fin-Date.now())/1000));el.textContent=s;if(!s)clearInterval(T.iv)}
    f();T.iv=setInterval(f,250)}};

function tdessiner(){
  clearInterval(T.iv);
  var r=TO.root;r.innerHTML="";
  var w=h("div","bpt");r.appendChild(w);
  if(T.phase==="fin"){
    var f=T.fin_;
    w.appendChild(h("div","bptv "+(f.gagne?"win":"lose"),f.gagne?"Victoire !":(f.rang+"e")));
    w.appendChild(h("div","bpts","Classement final : "+f.rang+"/"+f.n+" · "+pt(f.pts)));
    w.appendChild(h("div","bpts","Regarde l’écran."))}
  else if(T.phase==="cl"){
    var c=T.cl;
    if(c.score!==undefined)
      w.appendChild(h("h2","bptt",!c.rep?"Pas de réponse":c.score>=c.max?"Bonne réponse !":c.score>0?"Presque !":"Raté"));
    if(c.gain)w.appendChild(h("div","bptv "+(c.gain>0?"win":"lose"),(c.gain>0?"+":"")+fmt(c.gain)));
    w.appendChild(h("div","bpts","Classement : "+c.rang+"/"+c.n+" · "+pt(c.pts)));
    w.appendChild(h("div","bpts","Regarde l’écran."))}
  else if(T.phase==="q"&&T.q)MODES[T.mode].tel(w,T,X);
  else w.appendChild(h("h2","bptt","La partie va commencer…"))
}

var Tel={
  init:function(o){TO=o},
  recevoir:function(m){
    if(m.t==="bz:start"){
      T={moi:m.moi,mode:m.mode,unite:m.unite,phase:"",q:null,etat:null,fait:false,sel:[]};
      TO.afficher("bzTel");tdessiner()}
    else if(m.t==="bz:q"){
      T.q=m;T.phase="q";T.etat=null;T.fait=false;T.sel=[];T.fin=Date.now()+(m.duree||0)*1000;tdessiner()}
    else if(m.t==="bz:etat"){T.etat=m;T.fait=false;tdessiner()}
    else if(m.t==="bz:cl"){T.cl=m;T.phase="cl";tdessiner()}
    else if(m.t==="bz:fin"){T.fin_=m;T.phase="fin";tdessiner()}
    else if(m.t==="bz:retour"){clearInterval(T.iv);T={};TO.afficher("wait")}}
};

window.BzzzPartie={hote:Hote,tel:Tel,mode:function(id,def){MODES[id]=def}};
})();
