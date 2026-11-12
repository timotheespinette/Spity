/* ===== manoir-partie.js : la partie de Manoir (écran hôte + téléphones) =====
   Remplace manoir-hote.js, manoir-joueur.js et manoir-net.js :
   la connexion (code, QR, pseudos, avatars) est faite par le salon.
   Tous les messages de ce jeu commencent par "mn:". */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Nombre de joueurs pour lancer une partie.
   Le cahier des règles dit 4 à 15. Pour tester seul, mets 1 en minimum (et remets 4 ensuite). */
var MN_MIN_JOUEURS = 4;
var MN_MAX_JOUEURS = 15;
/* true = la partie s'arrête quand un camp gagne. Mets false pour tester seul. */
var MN_VICTOIRE = true;
/* true = bouton « Voir les joueurs (test) » sur l'écran hôte. Mets false pour jouer pour de vrai. */
var MN_DEBUG = true;

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var M = MANOIR_MAP, C = MANOIR_CFG;
var TRAP = [];
var tmpTrappes = {};
(M.trappes||[]).forEach(function(t){
  if(!tmpTrappes[t[2]]) tmpTrappes[t[2]] = [];
  tmpTrappes[t[2]].push([t[0], t[1]]);
});
Object.keys(tmpTrappes).forEach(function(k){
  if(tmpTrappes[k].length === 2) TRAP.push(tmpTrappes[k]);
});
var TCOL=['#e84a5f','#4aa3ff','#4cd964','#ffb020','#b46bff','#20d0c0'];

var st = document.createElement("style");
st.textContent = `
#mnHote,#mnTel{padding:0;overflow:hidden;background:#050a08}
.mncv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none}
.mnbar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;right:16px;z-index:3;display:flex;justify-content:space-between;gap:10px;pointer-events:none}
.mnbar>*{pointer-events:auto}
.mnb{padding:8px 18px;border-radius:999px;font-weight:800;color:#fff}
.mnb:active{transform:scale(.95)}
.mnov{position:absolute;inset:0;z-index:4;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;color:#fff}
.mnov0{font-size:5.5rem;line-height:1;font-weight:800}
.mnov1{font-size:2rem;font-weight:800}
.mnov2{font-size:1.1rem;font-weight:700;opacity:.85}
.mnov3{font-size:1.1rem;font-weight:600;max-width:28em}
.mnhud{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;padding:6px 16px;border-radius:999px;font-weight:800;pointer-events:none}
.mnActions{
  position:absolute;
  bottom:calc(env(safe-area-inset-bottom,0px) + 24px);
  left:0;
  right:0;
  z-index:5;
  display:flex;
  justify-content:center;
  align-items:center;
  gap:10px;
  pointer-events:none;
}
.mnAction{
  pointer-events:auto;
  min-width:110px;
  padding:14px 22px;
  border:2px solid rgba(255,255,255,.2);
  border-radius:18px;
  color:white;
  font-weight:900;
  font-size:15px;
  letter-spacing:.04em;
  box-shadow:0 6px 22px rgba(0,0,0,.35);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  transition:transform .15s,opacity .15s;
}
.mnAction:active{transform:scale(.94)}
.mnAction:disabled{opacity:.4}
.mnAttack{background:linear-gradient(145deg,#ed4553,#a91935)}
.mnReport{background:linear-gradient(145deg,#e5a52c,#b66a13)}
.mnFlash{
  position:absolute;
  inset:0;
  z-index:2;
  pointer-events:none;
  background:rgba(220,20,35,.35);
  opacity:0;
}
.mnTrap{background:linear-gradient(145deg,#7a57f5,#3f26a8)}
.mnCam{position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);right:16px;z-index:3;width:22px;height:22px;border-radius:50%;display:none;pointer-events:none}
.mnCam.o{display:block;background:#ff9f1c;box-shadow:0 0 12px #ff9f1c}
.mnCam.r{display:block;background:#ff2d3d;box-shadow:0 0 12px #ff2d3d;animation:mnPulse 1s infinite}
@keyframes mnPulse{50%{opacity:.35}}
.mnActions{flex-wrap:wrap}
.mnAction{min-width:96px;padding:12px 16px}
.mnSonner{background:linear-gradient(145deg,#f2c230,#c58a00)}
.mnCamBtn{background:linear-gradient(145deg,#2fb7a8,#146b63)}
.mnSortir{background:linear-gradient(145deg,#7a57f5,#3f26a8)}
.mnRetour{background:linear-gradient(145deg,#6b7280,#374151)}
.mnCamPanel{position:absolute;inset:0;z-index:7;display:none;flex-direction:column;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 20px) 16px 24px;box-sizing:border-box;background:rgba(5,10,8,.94);color:#fff;overflow-y:auto}
.mnCamPanel h3{margin:6px 0 0;font-weight:800}
.mnCamGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.mnCamZ{padding:12px 8px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);color:#fff;font-weight:800}
.mnCamZ.on{border-color:#ff3b47;background:rgba(255,59,71,.25)}
.mnCamZ:disabled{opacity:.4}
`;
document.head.appendChild(st);

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

/* Avatars : photos des joueurs, gardées en mémoire (une image par joueur) */
var AV={};
function avSrc(a){return typeof a==="string"&&(a.indexOf("data:image/")===0||/^[\w.\-]+\.(png|jpe?g|webp)$/i.test(a))?a:""}
function avCharger(id,a){var s=avSrc(a);if(!s)return;var im=new Image();im.src=s;AV[id]=im}
/* Dessine un joueur : anneau de sa couleur + sa photo (ou son initiale s'il n'en a pas) */
function pion(cx,x,y,r,couleur,id,nom){
  cx.fillStyle=couleur;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
  var im=AV[id],ri=r*.8;
  cx.save();cx.beginPath();cx.arc(x,y,ri,0,7);cx.clip();
  if(im&&im.complete&&im.naturalWidth)cx.drawImage(im,x-ri,y-ri,ri*2,ri*2);
  else{cx.fillStyle="#fff";cx.fillRect(x-ri,y-ri,ri*2,ri*2);
    cx.fillStyle=couleur;cx.font="800 "+Math.round(ri*1.2)+'px "Baloo 2",system-ui,sans-serif';
    cx.textAlign="center";cx.textBaseline="middle";cx.fillText((nom||"?").charAt(0).toUpperCase(),x,y)}
  cx.restore()}
function dessinerCadavre(cx,x,y,r,couleur,id,nom){
  cx.save();

  // Ombre sous le corps
  cx.fillStyle="rgba(0,0,0,.35)";
  cx.beginPath();
  cx.ellipse(x,y+r*.18,r*.9,r*.25,0,0,Math.PI*2);
  cx.fill();

  // Petit halo rouge
  cx.strokeStyle="rgba(210,45,55,.65)";
  cx.lineWidth=Math.max(2,r*.09);
  cx.beginPath();
  cx.arc(x,y,r*1.08,0,Math.PI*2);
  cx.stroke();

  // On ne conserve que la moitié supérieure du personnage
  cx.beginPath();
  cx.rect(x-r-2,y-r-2,r*2+4,r+2);
  cx.clip();

  // On réutilise exactement le personnage original
  pion(cx,x,y,r,couleur,id,nom);

  cx.restore();

  // Ligne de coupe discrète
  cx.strokeStyle="rgba(90,20,25,.9)";
  cx.lineWidth=Math.max(1,r*.06);
  cx.beginPath();
  cx.moveTo(x-r*.8,y);
  cx.lineTo(x+r*.8,y);
  cx.stroke();
}
/* Message « ton rôle » envoyé à un seul téléphone */
function roleMsg(j){
  var r=MM_ROLES.filter(function(x){return x.id===j.role})[0]||{},
      m={t:"mn:role",role:j.role,nom:r.nom,emoji:r.emoji,desc:r.desc,camp:j.camp};
  if(j.camp==="cultiste")m.complices=Object.keys(mo.joueurs).filter(function(i){return i!==j.id&&mo.joueurs[i].camp==="cultiste"}).map(function(i){return mo.joueurs[i].pseudo});
  return m}

/* Adapte la taille du canvas à l'écran (net sur les écrans Retina) et renvoie le facteur utilisé */
function ajuster(cv){
  var k=Math.min(2,window.devicePixelRatio||1),
      w=Math.round(cv.clientWidth*k),hh=Math.round(cv.clientHeight*k);
  if(w&&hh&&(cv.width!==w||cv.height!==hh)){cv.width=w;cv.height=hh}
  return k}

/* ======================= ÉCRAN DE L'HÔTE (TV) ======================= */
var O={}, mo=null, cvH=null, cxH=null, tickH=0, rafH=0, actifH=false, voir=false, finEnvoyee=false;
var cfgPartie=null;
var votePanelH=null;

function lancer(cfg){
  var l=O.joueurs();
  if(l.length<MN_MIN_JOUEURS)return O.toast("Il faut au moins "+MN_MIN_JOUEURS+" joueurs.");
  if(l.length>MN_MAX_JOUEURS)return O.toast("Maximum "+MN_MAX_JOUEURS+" joueurs.");
  cfg=cfg||{};var pr=cfg.params||{};cfgPartie=cfg;
  if(pr.vitesse)C.vitesse=pr.vitesse;
  if(pr.rayonVision)C.rayonVision=pr.rayonVision;
  if(pr.cooldownKill)C.cooldownKill=pr.cooldownKill;
  if(pr.vote)C.dureeVote=pr.vote;
  if(pr.discussion)C.dureeDiscussion=pr.discussion;
  if(pr.cloche!==undefined)C.cloches=pr.cloche;
  stopHote();
  mo=Moteur.nouveau();voir=false;
  l.forEach(function(p){mo.ajouter(p.id,p.name);avCharger(p.id,p.avatar)});
  mo.distribuer(cfg.roles);
  l.forEach(function(p){
    var j=mo.joueurs[p.id];
    O.envoyer(p.id,{t:"mn:start",id:p.id,pseudo:p.name,couleur:j.couleur,rayon:C.rayonVision});
    O.envoyer(p.id,roleMsg(j))});
  l.forEach(function(p,i){                              /* les photos, une par une pour ne pas surcharger */
    var s=avSrc(p.avatar);if(s)setTimeout(function(){O.tous({t:"mn:av",id:p.id,img:s})},250+i*100)});

  var r=O.root;r.innerHTML="";
  cvH=h("canvas","mncv");cxH=cvH.getContext("2d");r.appendChild(cvH);
  var bar=h("div","mnbar"),q=h("button","mnb glass","Arrêter"),v=h("button","mnb glass","Voir les joueurs (test)");
  q.onclick=function(){if(confirm("Arrêter la partie ?"))quitter(O.menu||O.jeux)};
  v.onclick=function(){voir=!voir};
  bar.appendChild(q);if(MN_DEBUG)bar.appendChild(v);r.appendChild(bar);
  votePanelH=ManoirVote.creerHote(r);
  votePanelH._quitter=function(){quitter(O.menu||O.jeux)};
  finEnvoyee=false;
  O.afficher("mnHote");

  var t0=performance.now();actifH=true;
  tickH=setInterval(function(){
    if(!mo)return;
    var t=performance.now(),dt=Math.min(.1,(t-t0)/1000);t0=t;
    mo.maj(dt);
    if(votePanelH)ManoirVote.afficherHote(votePanelH,mo.etatHote());

    /* Flash rouge du Médium (vivant) à chaque mort */
    if(mo.prendreMorts().length){
      Object.keys(mo.joueurs).forEach(function(id){
        var j=mo.joueurs[id];
        if(j.role==="medium"&&!j.mort)O.envoyer(id,{t:"mn:death"});
      });
    }

    /* Fin de partie : une seule vue finale envoyée */
    if(mo.phase==="fin"){
      if(!finEnvoyee){
        finEnvoyee=true;
        if(votePanelH) ManoirVote.afficherHote(votePanelH, mo.etatHote());
        for(var id in mo.joueurs){
          var vue=mo.vue(id);
          if(vue){vue.t="mn:vue";O.envoyer(id,vue)}
        }
        clearInterval(tickH);
      }
      return;
    }

    for(var id in mo.joueurs){
      var vue=mo.vue(id);
      if(vue){vue.t="mn:vue";O.envoyer(id,vue)}
    }
  },C.tick);
  boucleH()}

function stopHote(){
  actifH=false;clearInterval(tickH);cancelAnimationFrame(rafH);mo=null;
  if(votePanelH && votePanelH.destroy) votePanelH.destroy(); // <-- Ligne à ajouter
  votePanelH=null; // <-- Ligne à ajouter
}

function quitter(dest){
  O.tous({t:"mn:fin"});stopHote();
  dest&&dest()}


function recevoir(id,m){
  if(!mo||!m)return;

  if(m.t==="mn:dir"){
    mo.dir(id,+m.dx||0,+m.dy||0);
    return;
  }

  if(m.t==="mn:kill"){
    var resultat=mo.attaquer(id,m.cible);
    O.envoyer(id,{
      t:"mn:action",
      ok:resultat.ok,
      message:resultat.message
    });
    return;
  }

  if(m.t==="mn:report"){
    var signalement=mo.signaler(id,m.cible);
    O.envoyer(id,{
      t:"mn:action",
      ok:signalement.ok,
      message:signalement.message
    });
    return;
  }

  if(m.t==="mn:trappe"){
    var tr=mo.trappe(id);
    O.envoyer(id,{t:"mn:action",ok:tr.ok,message:tr.message});
    return;
  } 

  if(m.t==="mn:sortir"){
    var so=mo.sortirTrappe(id,m.choix);
    O.envoyer(id,{t:"mn:action",ok:so.ok,message:so.message});
    return;
  }

  if(m.t==="mn:sonner"){
    var sn=mo.sonner(id);
    O.envoyer(id,{t:"mn:action",ok:sn.ok,message:sn.message});
    return;
  }

  if(m.t==="mn:cam"){
    var cm=mo.changerCamera(id,+m.slot,+m.zone);
    O.envoyer(id,{t:"mn:action",ok:cm.ok,message:cm.message});
    return;
  }

  if(m.t==="mn:vote"){
    var resultat=mo.voter(id,m.cible===undefined?null:m.cible);
    O.envoyer(id,{
      t:"mn:action",
      ok:resultat.ok,
      message:resultat.message
    });
  }
}


function retirer(id){mo&&mo.retirer(id)}

/* Carte globale SANS les joueurs (sauf avec le bouton de test) */
function dedansZ(z,x,y){return x>=z.x&&x<z.x+z.l&&y>=z.y&&y<z.y+z.h}

function dessinerFlux(cx,z,px,py,pw,ph,titre){
  var barre=Math.round(ph*.1),gx,gy,x,y,c;
  cx.save();
  cx.beginPath();cx.rect(px,py,pw,ph);cx.clip();
  cx.fillStyle="#000";cx.fillRect(px,py,pw,ph);
  var cs=Math.floor(Math.min(pw/z.l,(ph-barre)/z.h)),
      ox=px+(pw-cs*z.l)/2,oy=py+barre+(ph-barre-cs*z.h)/2;
  for(y=0;y<z.h;y++)for(x=0;x<z.l;x++){
    gx=z.x+x;gy=z.y+y;
    c=(gy>=0&&gy<M.hauteur&&gx>=0&&gx<M.largeur)?M.grille[gy][gx]:"#";
    cx.fillStyle=C.cases[c];cx.fillRect(ox+x*cs,oy+y*cs,cs+1,cs+1);
  }
  Object.keys(mo.cadavres).forEach(function(id){
    var k=mo.cadavres[id];
    if(dedansZ(z,k.x,k.y))
      dessinerCadavre(cx,ox+(k.x-z.x)*cs,oy+(k.y-z.y)*cs,cs*.4,k.couleur,k.id,k.pseudo);
  });
  Object.keys(mo.joueurs).forEach(function(id){
    var j=mo.joueurs[id];
    if(j.mort||j.tunnel||!dedansZ(z,j.x,j.y)||Moteur.typeCase(j.x,j.y)==="~")return;
    var X=ox+(j.x-z.x)*cs,Y=oy+(j.y-z.y)*cs;
    pion(cx,X,Y,cs*.4,j.couleur,id,j.pseudo);
    cx.font="700 "+Math.round(cs*.4)+"px system-ui";
    cx.textAlign="center";cx.textBaseline="alphabetic";
    cx.fillStyle="#fff";cx.fillText(j.pseudo,X,Y-cs*.5);
  });
  cx.fillStyle="rgba(0,0,0,.65)";cx.fillRect(px,py,pw,barre);
  cx.fillStyle="#ff3b47";cx.beginPath();cx.arc(px+barre*.5,py+barre*.5,barre*.2,0,7);cx.fill();
  cx.fillStyle="#fff";cx.font="800 "+Math.round(barre*.55)+"px system-ui";
  cx.textAlign="left";cx.textBaseline="middle";
  cx.fillText(titre,px+barre*.95,py+barre*.52);
  cx.restore();
  cx.strokeStyle="#ff3b47";cx.lineWidth=3;cx.strokeRect(px,py,pw,ph);
}

function dessinerH(){
  var w,hh;ajuster(cvH);w=cvH.width;hh=cvH.height;
  if(!w||!mo)return;
  var cx=cxH,cams=mo.camsActives(),avec=cams.length>0,
      wCarte=avec?Math.floor(w*.62):w,
      cs=Math.floor(Math.min(wCarte/M.largeur,hh/M.hauteur)),
      ox=(wCarte-cs*M.largeur)/2,oy=(hh-cs*M.hauteur)/2,x,y;
  cx.fillStyle="#0b1511";cx.fillRect(0,0,w,hh);
  for(y=0;y<M.hauteur;y++)for(x=0;x<M.largeur;x++){
    cx.fillStyle=C.cases[M.grille[y][x]];
    cx.fillRect(ox+x*cs,oy+y*cs,cs,cs)}
  cx.fillStyle="#d1432f";
  M.missions.forEach(function(m){cx.fillRect(ox+m[0]*cs+cs*.2,oy+m[1]*cs+cs*.2,cs*.6,cs*.6)});
  cx.fillStyle="#e0a800";cx.beginPath();
  cx.arc(ox+(M.cloche[0]+.5)*cs,oy+(M.cloche[1]+.5)*cs,cs*.4,0,7);cx.fill();

  /* zones filmées en ce moment */
  cams.forEach(function(z,i){
    cx.save();
    cx.strokeStyle="#ff3b47";cx.lineWidth=Math.max(2,cs*.12);
    cx.setLineDash([cs*.4,cs*.25]);
    cx.strokeRect(ox+z.x*cs,oy+z.y*cs,z.l*cs,z.h*cs);
    cx.restore();
    cx.fillStyle="#ff3b47";cx.font="800 "+Math.round(cs*.9)+"px system-ui";
    cx.textAlign="left";cx.textBaseline="top";
    cx.fillText("CAM "+(i+1),ox+z.x*cs+cs*.2,oy+z.y*cs+cs*.1);
  });

  if(voir)Object.keys(mo.joueurs).forEach(function(id){
    if(mo.joueurs[id].mort)return;
    var j=mo.joueurs[id];
    pion(cx,ox+j.x*cs,oy+j.y*cs,cs*.4,j.couleur,id,j.pseudo);
    cx.font="700 "+Math.round(cs*.5)+"px system-ui";cx.textAlign="center";cx.textBaseline="alphabetic";
    cx.fillStyle="#fff";cx.fillText((MM_ROLES.filter(function(r){return r.id===j.role})[0]||{}).emoji||"",ox+j.x*cs,oy+j.y*cs-cs*.5)});

  /* les 2 flux caméras à droite */
  if(avec){
    var m=Math.round(w*.012),px=wCarte+m,pw=w-wCarte-2*m,ph=Math.floor((hh-3*m)/2);
    cams.slice(0,2).forEach(function(z,i){
      dessinerFlux(cx,z,px,m+i*(ph+m),pw,ph,"CAM "+(i+1)+(z.nom?" : "+z.nom:""));
    });
  }
}

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
  T={
    id:m.id,
    pseudo:m.pseudo,
    role:null,
    cle:"",
    x:0,
    y:0,
    vx:0,
    vy:0,
    couleur:m.couleur||"#fff",
    init:false,
    autres:[],
    stick:null,
    touches:{},
    dernier:{x:9,y:9,t:0},
    cadavres:[],
    mort:false,
    cooldown:0,
    poison:0,
    cibleAttaque:null,
    cibleCadavre:null,
    flashMort:0
  };
  var r=TO.root;r.innerHTML="";
  cvT=h("canvas","mncv");cxT=cvT.getContext("2d");r.appendChild(cvT);
  
  hudT=h("div","mnhud glass","Connexion…");
  r.appendChild(hudT);
  T.camDot=h("div","mnCam");
  r.appendChild(T.camDot);

  T.actions=h("div","mnActions");
  T.btnAttaque=h("button","mnAction mnAttack","ATTAQUER");
  T.btnReport=h("button","mnAction mnReport","SIGNALER");

  T.btnAttaque.style.display="none";
  T.btnReport.style.display="none";
  T.btnTrappe=h("button","mnAction mnTrap","TRAPPE");
  T.btnTrappe.style.display="none";
  T.btnTrappe.onclick=function(){
     if(T&&T.pretTrappe)TO.envoyer({t:"mn:trappe"});
  };

  T.btnAttaque.onclick=function(){
    if(T&&T.cibleAttaque){
      TO.envoyer({
        t:"mn:kill",
        cible:T.cibleAttaque
      });
    }
  };

  T.btnReport.onclick=function(){
    if(T&&T.cibleCadavre){
      TO.envoyer({
        t:"mn:report",
        cible:T.cibleCadavre
      });
    }
  };

  T.actions.appendChild(T.btnAttaque);
  T.actions.appendChild(T.btnReport);
  T.actions.appendChild(T.btnTrappe);
  T.btnSortir=h("button","mnAction mnSortir","SORTIR ICI");
  T.btnRetour=h("button","mnAction mnRetour","REVENIR");
  T.btnSonner=h("button","mnAction mnSonner","SONNER");
  T.btnCam=h("button","mnAction mnCamBtn","CAMÉRAS");
  [T.btnSortir,T.btnRetour,T.btnSonner,T.btnCam].forEach(function(b){
    b.style.display="none";
    T.actions.appendChild(b);
  });
  T.btnSortir.onclick=function(){TO.envoyer({t:"mn:sortir",choix:"ici"})};
  T.btnRetour.onclick=function(){TO.envoyer({t:"mn:sortir",choix:"retour"})};
  T.btnSonner.onclick=function(){TO.envoyer({t:"mn:sonner"})};
  T.btnCam.onclick=function(){T.camOuvert=!T.camOuvert;T.stick=null;T.cleCam=""};
  T.camOuvert=false;
  T.camPanel=h("div","mnCamPanel");
  r.appendChild(T.camPanel);
  r.appendChild(T.actions);

  T.flash=h("div","mnFlash");
  r.appendChild(T.flash);

  T.ov=h("div","mnov");
  r.appendChild(T.ov);
  T.voteUI=ManoirVote.creerTelephone(r,function(cible){
    TO.envoyer({t:"mn:vote",cible:cible});
  });

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
  if(T && T.voteUI && T.voteUI.destroy) T.voteUI.destroy();
  T=null}

/* Détection des actions disponibles */
function majActionsT(){
  if(!T||!T.actions)return;
  majPanneauCam();

  var B=[T.btnAttaque,T.btnReport,T.btnTrappe,T.btnSortir,T.btnRetour,T.btnSonner,T.btnCam];
  function montrer(b,v){b.style.display=v?"block":"none"}

  if(T.phase!=="jeu"){
    B.forEach(function(b){montrer(b,false)});
    return;
  }

  var role=T.role&&T.role.role,camp=T.role&&T.role.camp;
  var peutAttaquer=role==="cultiste"||role==="empoisonneur"||role==="metamorphe";
  var peutTrappe=role==="cultiste"||(C.trappesTous&&camp==="cultiste");

  T.cibleAttaque=null;
  T.cibleCadavre=null;
  T.pretTrappe=false;

  /* Dans les trappes : seulement deux choix */
  if(T.tunnel&&!T.mort){
    B.forEach(function(b){montrer(b,false)});
    montrer(T.btnSortir,true);
    montrer(T.btnRetour,true);
    T.btnSortir.textContent="SORTIR ICI ("+T.tunnel.reste+" s)";
    return;
  }

  var pretCloche=false;

  if(!T.mort){
    if(peutAttaquer){
      var meilleure=1.2;
      T.autres.forEach(function(o){
        var d=Math.hypot(o[1]-T.x,o[2]-T.y);
        if(d<meilleure&&Moteur.voit(T.x,T.y,o[1],o[2])){
          meilleure=d;
          T.cibleAttaque=o[0];
        }
      });
    }

    var meilleureMort=1.5;
    T.cadavres.forEach(function(c){
      if(c[5])return;
      var d=Math.hypot(c[1]-T.x,c[2]-T.y);
      if(d<meilleureMort&&Moteur.voit(T.x,T.y,c[1],c[2])){
        meilleureMort=d;
        T.cibleCadavre=c[0];
      }
    });

    if(peutTrappe){
      TRAP.forEach(function(p){
        for(var k=0;k<2;k++){
          if(Math.hypot(p[k][0]+.5-T.x,p[k][1]+.5-T.y)<1.1)T.pretTrappe=true;
        }
      });
    }

    if((T.cloches||0)>0&&M.cloche&&
       Math.hypot(M.cloche[0]+.5-T.x,M.cloche[1]+.5-T.y)<1.6)pretCloche=true;
  }

  montrer(T.btnSortir,false);
  montrer(T.btnRetour,false);

  montrer(T.btnAttaque,!!T.cibleAttaque);
  if(T.cibleAttaque){
    if(T.cooldown>0){
      T.btnAttaque.textContent="RECHARGE "+Math.ceil(T.cooldown)+" s";
      T.btnAttaque.disabled=true;
    }else{
      T.btnAttaque.textContent=role==="empoisonneur"?"EMPOISONNER":"ATTAQUER";
      T.btnAttaque.disabled=false;
    }
  }

  montrer(T.btnReport,!!T.cibleCadavre);

  montrer(T.btnTrappe,T.pretTrappe);
  if(T.pretTrappe){
    var cd=T.trappeCd||0;
    T.btnTrappe.disabled=cd>0;
    T.btnTrappe.textContent=cd>0?"TRAPPE "+Math.ceil(cd)+" s":"TRAPPE";
  }

  montrer(T.btnSonner,pretCloche);
  if(pretCloche)T.btnSonner.textContent="SONNER ("+T.cloches+")";

  montrer(T.btnCam,role==="veilleur"&&!T.mort);
}
/* Vue locale avec brouillard de guerre */

/* Vue locale avec vision claire + décor assombri autour */
/* Vue locale avec vision claire + décor assombri autour */
function dessinerT(){

  if(!T)return;

  var K=ajuster(cvT),w=cvT.width,hh=cvT.height;
  if(!w)return;

  var cx=cxT,R=C.rayonVision;
  var cs=Math.floor(Math.min(w,hh)/(2*R+1));
  var x,y,a,i;

  T.vx+=(T.x-T.vx)*.35;
  T.vy+=(T.y-T.vy)*.35;

  var ox=w/2-T.vx*cs;
  var oy=hh/2-T.vy*cs;

  // Fond
  cx.fillStyle="#050a08";
  cx.fillRect(0,0,w,hh);

  if(T.init){

    // Toute la carte est dessinée
    var x0=Math.max(0,Math.floor(-ox/cs)),x1=Math.min(M.largeur-1,Math.ceil((w-ox)/cs));
    var y0=Math.max(0,Math.floor(-oy/cs)),y1=Math.min(M.hauteur-1,Math.ceil((hh-oy)/cs));
    for(y=y0;y<=y1;y++){
      for(x=x0;x<=x1;x++){
        cx.fillStyle=C.cases[M.grille[y][x]];
        cx.fillRect(ox+x*cs,oy+y*cs,cs+1,cs+1);
      }
    }

    // Le voile noir et la restriction de vision s'appliquent uniquement si le joueur est vivant
    if(!T.mort){
      // Assombrissement extérieur
      cx.fillStyle="rgba(0,0,0,.68)";
      cx.fillRect(0,0,w,hh);

      // Calcul de la vision
      cx.save();
      cx.beginPath();

      for(a=0;a<360;a+=2){
        var rad=a*Math.PI/180,d=0;

        while(
          d<R+.5 &&
          !Moteur.mur(
            T.vx+Math.cos(rad)*d,
            T.vy+Math.sin(rad)*d
          )
        ){
          d+=.1;
        }

        d=Math.min(d+.45,R+.5);

        var px=ox+(T.vx+Math.cos(rad)*d)*cs;
        var py=oy+(T.vy+Math.sin(rad)*d)*cs;

        if(a===0)cx.moveTo(px,py);
        else cx.lineTo(px,py);
      }

      cx.closePath();
      cx.clip();

      // Décor éclairé normalement dans le cône de vision
      for(y=Math.floor(T.vy-R-1);y<=T.vy+R+1;y++){
        for(x=Math.floor(T.vx-R-1);x<=T.vx+R+1;x++){

          var c=(y>=0&&y<M.hauteur&&x>=0&&x<M.largeur)
            ?M.grille[y][x]:"#";

          cx.fillStyle=C.cases[c];
          cx.fillRect(ox+x*cs,oy+y*cs,cs+1,cs+1);
        }
      }

      cx.restore();
    }

    if(!T.mort&&T.role&&(T.role.role==="cultiste"||(C.trappesTous&&T.role.camp==="cultiste"))){
      TRAP.forEach(function(p,k){
        p.forEach(function(q){
          if(Math.hypot(q[0]+.5-T.x,q[1]+.5-T.y)>R+.5)return;
          var tx=ox+q[0]*cs+cs*.15,ty=oy+q[1]*cs+cs*.15;
          cx.fillStyle=TCOL[k%TCOL.length];
          cx.fillRect(tx,ty,cs*.7,cs*.7);
          cx.strokeStyle="#fff";cx.lineWidth=2*K;
          cx.strokeRect(tx,ty,cs*.7,cs*.7);
        });
      });
    }
    if(M.cloche&&Math.hypot(M.cloche[0]+.5-T.x,M.cloche[1]+.5-T.y)<=R+.5){
      cx.fillStyle="#e0a800";
      cx.beginPath();
      cx.arc(ox+(M.cloche[0]+.5)*cs,oy+(M.cloche[1]+.5)*cs,cs*.4,0,7);
      cx.fill();
    }
    // Cadavres visibles
    for(i=0;i<T.cadavres.length;i++){

      var corps=T.cadavres[i];

      dessinerCadavre(
        cx,
        ox+corps[1]*cs,
        oy+corps[2]*cs,
        cs*.4,
        corps[3],
        corps[0],
        corps[4]
      );
    }

    // Autres joueurs vivants visibles
    for(i=0;i<T.autres.length;i++){

      var o=T.autres[i];

      if(!T.mort){
        if(Math.hypot(o[1]-T.x,o[2]-T.y)>R)continue;
        if(!Moteur.voit(T.x,T.y,o[1],o[2]))continue;
      }

      pion(
        cx,
        ox+o[1]*cs,
        oy+o[2]*cs,
        cs*.4,
        o[3],
        o[0],
        o[4]
      );

      cx.textAlign="center";
      cx.textBaseline="alphabetic";
      cx.font='700 '+Math.round(cs*.4)+'px "Baloo 2",system-ui,sans-serif';
      cx.fillStyle="#fff";

      cx.fillText(
        o[4],
        ox+o[1]*cs,
        oy+o[2]*cs-cs*.5
      );
    }

    // Personnage du joueur
    if(T.mort){

      // Fantôme translucide avec contour lumineux
      cx.save();
      cx.globalAlpha=.4;

      if(T.tunnel)cx.globalAlpha=.45;
      pion(
        cx,w/2,hh/2,cs*.4,
        T.couleur,T.id,T.pseudo
      );
      cx.globalAlpha=1;

      cx.globalAlpha=.8;
      cx.strokeStyle="#a4f1ff";
      cx.lineWidth=2*K;
      cx.beginPath();
      cx.arc(w/2,hh/2,cs*.48,0,Math.PI*2);
      cx.stroke();

      cx.restore();

    }else{

      pion(
        cx,w/2,hh/2,cs*.4,
        T.couleur,T.id,T.pseudo
      );
    }

    // Dégradé de bord
    var g=cx.createRadialGradient(
      w/2,hh/2,cs*R*.72,
      w/2,hh/2,cs*(R+.5)
    );

    g.addColorStop(0,"rgba(5,10,8,0)");
    g.addColorStop(1,"rgba(5,10,8,.35)");

    cx.fillStyle=g;
    cx.fillRect(0,0,w,hh);
  }

  // Bordure toxique si empoisonné
  if(T.poison > 0) {
    cx.strokeStyle = "rgba(120, 255, 50, 0.4)";
    cx.lineWidth = 15 * K;
    cx.strokeRect(0, 0, w, hh);
  }

  // Flash rouge reçu par le Médium
  if(T.flashMort>performance.now()){
    T.flash.style.opacity=".35";
  }else{
    T.flash.style.opacity="0";
  }

  if(T.tunnel){
      cx.fillStyle="rgba(60,20,120,.28)";
      cx.fillRect(0,0,w,hh);
    }
  // Joystick
  var s=T.stick;

  if(s){
    cx.strokeStyle="rgba(255,255,255,.5)";
    cx.lineWidth=3*K;
    cx.beginPath();
    cx.arc(s.ox*K,s.oy*K,50*K,0,7);
    cx.stroke();

    var dx=s.x-s.ox,dy=s.y-s.oy;
    var l=Math.min(50,Math.hypot(dx,dy));
    var an=Math.atan2(dy,dx);

    cx.fillStyle="rgba(255,255,255,.6)";
    cx.beginPath();
    cx.arc(
      (s.ox+Math.cos(an)*l)*K,
      (s.oy+Math.sin(an)*l)*K,
      22*K,0,7
    );
    cx.fill();
  }

  majActionsT();
}


function boucleT(){
  if(!T)return;
  dessinerT();rafT=requestAnimationFrame(boucleT)}

/* Écran secret (rôle) puis compte à rebours, par-dessus la vue */
function majOv(ph,reste){
  if(!T)return;
  var o=T.ov,k=ph+"|"+(ph==="jeu"?"":reste)+"|"+(T.role?1:0);
  if(T.cle===k)return;T.cle=k;
  if(ph!=="role"&&ph!=="compte"){o.style.display="none";return}
  o.style.display="flex";o.innerHTML="";
  var ro=T.role;
  if(ph==="role"){
    if(!ro){o.style.background="#050a08";o.appendChild(h("div","mnov1","Distribution des rôles…"));return}
    o.style.background=ro.camp==="cultiste"?"#4a0f14":"#0d3d36";
    o.appendChild(h("div","mnov0",ro.emoji||""));
    o.appendChild(h("div","mnov1",ro.nom||ro.role));
    o.appendChild(h("div","mnov2",ro.camp==="cultiste"?"Camp des Cultistes":"Camp des Invités"));
    o.appendChild(h("div","mnov3",ro.desc||""));
    if(ro.complices&&ro.complices.length)o.appendChild(h("div","mnov3","Tes complices : "+ro.complices.join(", ")));
    o.appendChild(h("div","mnov2","Cache ton écran ! ("+reste+" s)"))}
  else{
    o.style.background="#050a08";
    o.appendChild(h("div","mnov2","La partie commence dans"));
    o.appendChild(h("div","mnov0",String(reste)))}}

function telRecevoir(m){
  if(m.t==="mn:av"){avCharger(m.id,m.img);return}
  if(m.t==="mn:role"){if(T){T.role=m;T.cle=""}return}
  if(m.t==="mn:start")telStart(m);
  else if(m.t==="mn:vue"){
    if(!T)return;
    if(T.init&&Math.hypot(m.x-T.x,m.y-T.y)>3){T.vx=m.x;T.vy=m.y;}

    T.x=m.x;
    T.y=m.y;

    if(!T.init){
      T.vx=m.x;
      T.vy=m.y;
      T.init=true;
      hudT.style.display="none";
    }

    T.mort=!!m.mort;
    T.autres=m.autres||[];
    T.cadavres=m.cadavres||[];
    T.cooldown=m.cooldown||0;
    T.poison=m.poison||0;
    T.phase=m.phase;
    T.trappeCd=m.trappeCd||0;
    T.tunnel=m.tunnel||null;
    T.cloches=m.cloches||0;
    T.camZ=m.camZ||null;
    T.veilleurCd=m.veilleurCd||0;
    T.camDot.className="mnCam"+(m.phase==="jeu"&&m.cam===2?" r":(m.phase==="jeu"&&m.cam===1?" o":""));
    if(T.voteUI){
      ManoirVote.afficherTelephone(T.voteUI,{
        phase:m.phase,
        reste:m.reste,
        vote:m.vote,
        fin:m.fin,
        mort: T.mort
      });
    }

    majOv(m.phase,m.reste);
  }
  else if(m.t==="mn:death"){
    if(T){
      T.flashMort=performance.now()+1200;
    }
  }
  else if(m.t==="mn:action"){
    if(T){
      hudT.textContent=m.message;
      hudT.style.display="block";

      clearTimeout(T.messageTimer);

      T.messageTimer=setTimeout(function(){
        if(T&&hudT)hudT.style.display="none";
      },2200);
    }
  }
  else if(m.t==="mn:fin"){
    telStop();
    TO.afficher("wait");
  }
}

window.ManoirPartie={
  hote:{init:function(o){O=o},lancer:lancer,recevoir:recevoir,retirer:retirer},
  tel:{init:function(o){TO=o},recevoir:telRecevoir}
};
})();
