/* ===== manoir-partie.js : la partie de Manoir (écran hôte + téléphones) =====
   Remplace manoir-hote.js, manoir-joueur.js et manoir-net.js :
   la connexion (code, QR, pseudos, avatars) est faite par le salon.
   Tous les messages de ce jeu commencent par "mn:". */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Nombre de joueurs pour lancer une partie.
   Le cahier des règles dit 4 à 15. Pour tester seul, mets 1 en minimum (et remets 4 ensuite). */
var MN_MIN_JOUEURS = 4;
var MN_MAX_JOUEURS = 15;

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var M = MANOIR_MAP, C = MANOIR_CFG;

var st = document.createElement("style");
st.textContent = `
#mnHote,#mnTel{padding:0;overflow:hidden;background:#050a08}
.mncv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none}
.mnbar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;right:16px;z-index:3;display:flex;justify-content:space-between;gap:10px;pointer-events:none}
.mnbar>*{pointer-events:auto}
.mnb{padding:8px 18px;border-radius:999px;font-weight:800;color:#fff}
.mnb:active{transform:scale(.95)}
.mnhud{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;padding:6px 16px;border-radius:999px;font-weight:800;pointer-events:none}
`;
document.head.appendChild(st);

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

/* Adapte la taille du canvas à l'écran (net sur les écrans Retina) et renvoie le facteur utilisé */
function ajuster(cv){
  var k=Math.min(2,window.devicePixelRatio||1),
      w=Math.round(cv.clientWidth*k),hh=Math.round(cv.clientHeight*k);
  if(w&&hh&&(cv.width!==w||cv.height!==hh)){cv.width=w;cv.height=hh}
  return k}

/* ======================= ÉCRAN DE L'HÔTE (TV) ======================= */
var O={}, mo=null, cvH=null, cxH=null, tickH=0, rafH=0, actifH=false, voir=false;
var cfgPartie=null;

function lancer(cfg){
  var l=O.joueurs();
  if(l.length<MN_MIN_JOUEURS)return O.toast("Il faut au moins "+MN_MIN_JOUEURS+" joueurs.");
  if(l.length>MN_MAX_JOUEURS)return O.toast("Maximum "+MN_MAX_JOUEURS+" joueurs.");
  cfg=cfg||{};var pr=cfg.params||{};cfgPartie=cfg;
  if(pr.vitesse)C.vitesse=pr.vitesse;
  if(pr.rayonVision)C.rayonVision=pr.rayonVision;
  stopHote();
  mo=Moteur.nouveau();voir=false;
  l.forEach(function(p){
    var j=mo.ajouter(p.id,p.name);
    O.envoyer(p.id,{t:"mn:start",couleur:j.couleur,rayon:C.rayonVision})});

  var r=O.root;r.innerHTML="";
  cvH=h("canvas","mncv");cxH=cvH.getContext("2d");r.appendChild(cvH);
  var bar=h("div","mnbar"),q=h("button","mnb glass","Arrêter"),v=h("button","mnb glass","Voir les joueurs (test)");
  q.onclick=function(){if(confirm("Arrêter la partie ?"))quitter(O.menu||O.jeux)};
  v.onclick=function(){voir=!voir};
  bar.appendChild(q);bar.appendChild(v);r.appendChild(bar);
  O.afficher("mnHote");

  var t0=performance.now();actifH=true;
  tickH=setInterval(function(){
    if(!mo)return;
    var t=performance.now(),dt=Math.min(.1,(t-t0)/1000);t0=t;
    mo.maj(dt);
    for(var id in mo.joueurs){
      var vue=mo.vue(id);
      if(vue){vue.t="mn:vue";O.envoyer(id,vue)}}
  },C.tick);
  boucleH()}

function stopHote(){
  actifH=false;clearInterval(tickH);cancelAnimationFrame(rafH);mo=null}

function quitter(dest){
  O.tous({t:"mn:fin"});stopHote();
  dest&&dest()}

function recevoir(id,m){
  if(!mo||!m)return;
  if(m.t==="mn:dir")mo.dir(id,+m.dx||0,+m.dy||0)}

function retirer(id){mo&&mo.retirer(id)}

/* Carte globale SANS les joueurs (sauf avec le bouton de test) */
function dessinerH(){
  var w,hh;ajuster(cvH);w=cvH.width;hh=cvH.height;
  if(!w||!mo)return;
  var cx=cxH,cs=Math.floor(Math.min(w/M.largeur,hh/M.hauteur)),
      ox=(w-cs*M.largeur)/2,oy=(hh-cs*M.hauteur)/2,x,y;
  cx.fillStyle="#0b1511";cx.fillRect(0,0,w,hh);
  for(y=0;y<M.hauteur;y++)for(x=0;x<M.largeur;x++){
    cx.fillStyle=C.cases[M.grille[y][x]];
    cx.fillRect(ox+x*cs,oy+y*cs,cs,cs)}
  cx.fillStyle="#d1432f";
  M.missions.forEach(function(m){cx.fillRect(ox+m[0]*cs+cs*.2,oy+m[1]*cs+cs*.2,cs*.6,cs*.6)});
  cx.fillStyle="#e0a800";cx.beginPath();
  cx.arc(ox+(M.cloche[0]+.5)*cs,oy+(M.cloche[1]+.5)*cs,cs*.4,0,7);cx.fill();
  if(voir)Object.keys(mo.joueurs).forEach(function(id){
    var j=mo.joueurs[id];
    cx.fillStyle=j.couleur;cx.beginPath();
    cx.arc(ox+j.x*cs,oy+j.y*cs,cs*.35,0,7);cx.fill()})}

function boucleH(){
  if(!actifH)return;
  dessinerH();rafH=requestAnimationFrame(boucleH)}

/* ======================= TÉLÉPHONE ======================= */
var TO={}, T=null, cvT=null, cxT=null, hudT=null, tickT=0, rafT=0;

/* Joystick tactile, ou flèches / ZQSD pour tester sur ordinateur */
function lireDir(){
  var s=T.stick,t=T.touches;
  if(s){
    var dx=s.x-s.ox,dy=s.y-s.oy,l=Math.hypot(dx,dy),k=Math.min(1,l/50);
    return l<8?{x:0,y:0}:{x:dx/l*k,y:dy/l*k}}
  var x=(t.arrowright||t.d?1:0)-(t.arrowleft||t.q||t.a?1:0),
      y=(t.arrowdown||t.s?1:0)-(t.arrowup||t.z||t.w?1:0);
  return{x:x,y:y}}
function kd(e){if(T)T.touches[e.key.toLowerCase()]=1}
function ku(e){if(T)T.touches[e.key.toLowerCase()]=0}

function envoyerDir(){
  if(!T)return;
  var d=lireDir(),t=performance.now(),l=T.dernier;
  if(Math.abs(d.x-l.x)>.02||Math.abs(d.y-l.y)>.02||t-l.t>300){
    TO.envoyer({t:"mn:dir",dx:+d.x.toFixed(2),dy:+d.y.toFixed(2)});
    T.dernier={x:d.x,y:d.y,t:t}}}

function telStart(m){
  telStop();
  if(m.rayon)C.rayonVision=m.rayon;
  T={x:0,y:0,vx:0,vy:0,couleur:m.couleur||"#fff",init:false,autres:[],stick:null,touches:{},dernier:{x:9,y:9,t:0}};
  var r=TO.root;r.innerHTML="";
  cvT=h("canvas","mncv");cxT=cvT.getContext("2d");r.appendChild(cvT);
  hudT=h("div","mnhud glass","Connexion…");r.appendChild(hudT);

  function pos(e){var b=cvT.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}}
  cvT.addEventListener("pointerdown",function(e){
    cvT.setPointerCapture(e.pointerId);
    var p=pos(e);T.stick={id:e.pointerId,ox:p.x,oy:p.y,x:p.x,y:p.y}});
  cvT.addEventListener("pointermove",function(e){
    if(T&&T.stick&&e.pointerId===T.stick.id){var p=pos(e);T.stick.x=p.x;T.stick.y=p.y}});
  function fin(e){if(T&&T.stick&&e.pointerId===T.stick.id)T.stick=null}
  cvT.addEventListener("pointerup",fin);cvT.addEventListener("pointercancel",fin);
  addEventListener("keydown",kd);addEventListener("keyup",ku);

  tickT=setInterval(envoyerDir,C.tick);
  TO.afficher("mnTel");
  boucleT()}

function telStop(){
  clearInterval(tickT);cancelAnimationFrame(rafT);
  removeEventListener("keydown",kd);removeEventListener("keyup",ku);
  T=null}

/* Vue locale avec brouillard de guerre */
function dessinerT(){
  if(!T)return;
  var K=ajuster(cvT),w=cvT.width,hh=cvT.height;
  if(!w)return;
  var cx=cxT,R=C.rayonVision,cs=Math.floor(Math.min(w,hh)/(2*R+1)),x,y,a,i;
  T.vx+=(T.x-T.vx)*.35;T.vy+=(T.y-T.vy)*.35;
  var ox=w/2-T.vx*cs,oy=hh/2-T.vy*cs;
  cx.fillStyle="#050a08";cx.fillRect(0,0,w,hh);

  if(T.init){
    cx.save();cx.beginPath();                          /* zone éclairée = ce que les murs laissent voir */
    for(a=0;a<360;a+=3){
      var r=a*Math.PI/180,d=0;
      while(d<R+.5&&!Moteur.mur(T.vx+Math.cos(r)*d,T.vy+Math.sin(r)*d))d+=.1;
      d=Math.min(d+.45,R+.5);
      var px=ox+(T.vx+Math.cos(r)*d)*cs,py=oy+(T.vy+Math.sin(r)*d)*cs;
      a?cx.lineTo(px,py):cx.moveTo(px,py)}
    cx.closePath();cx.clip();

    for(y=Math.floor(T.vy-R-1);y<=T.vy+R+1;y++)for(x=Math.floor(T.vx-R-1);x<=T.vx+R+1;x++){
      var c=(y>=0&&y<M.hauteur&&x>=0&&x<M.largeur)?M.grille[y][x]:"#";
      cx.fillStyle=C.cases[c];cx.fillRect(ox+x*cs,oy+y*cs,cs+1,cs+1)}

    cx.textAlign="center";cx.font='700 '+Math.round(cs*.4)+'px "Baloo 2",system-ui,sans-serif';
    for(i=0;i<T.autres.length;i++){
      var o=T.autres[i];
      cx.fillStyle=o[3];cx.beginPath();cx.arc(ox+o[1]*cs,oy+o[2]*cs,cs*.35,0,7);cx.fill();
      cx.fillStyle="#fff";cx.fillText(o[4],ox+o[1]*cs,oy+o[2]*cs-cs*.45)}

    cx.fillStyle=T.couleur;cx.beginPath();cx.arc(w/2,hh/2,cs*.35,0,7);cx.fill();
    cx.strokeStyle="#fff";cx.lineWidth=2*K;cx.stroke();

    var g=cx.createRadialGradient(w/2,hh/2,cs*R*.5,w/2,hh/2,cs*(R+.5));
    g.addColorStop(0,"rgba(5,10,8,0)");g.addColorStop(1,"rgba(5,10,8,.85)");
    cx.fillStyle=g;cx.fillRect(0,0,w,hh);cx.restore()}

  var s=T.stick;
  if(s){
    cx.strokeStyle="rgba(255,255,255,.5)";cx.lineWidth=3*K;
    cx.beginPath();cx.arc(s.ox*K,s.oy*K,50*K,0,7);cx.stroke();
    var dx=s.x-s.ox,dy=s.y-s.oy,l=Math.min(50,Math.hypot(dx,dy)),an=Math.atan2(dy,dx);
    cx.fillStyle="rgba(255,255,255,.6)";cx.beginPath();
    cx.arc((s.ox+Math.cos(an)*l)*K,(s.oy+Math.sin(an)*l)*K,22*K,0,7);cx.fill()}}

function boucleT(){
  if(!T)return;
  dessinerT();rafT=requestAnimationFrame(boucleT)}

function telRecevoir(m){
  if(m.t==="mn:start")telStart(m);
  else if(m.t==="mn:vue"){
    if(!T)return;
    T.x=m.x;T.y=m.y;
    if(!T.init){T.vx=m.x;T.vy=m.y;T.init=true;hudT.style.display="none"}
    T.autres=m.autres||[]}
  else if(m.t==="mn:fin"){telStop();TO.afficher("wait")}}

window.ManoirPartie={
  hote:{init:function(o){O=o},lancer:lancer,recevoir:recevoir,retirer:retirer},
  tel:{init:function(o){TO=o},recevoir:telRecevoir}
};
})();
