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
.mnPts{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);z-index:3;padding:6px 16px;border-radius:999px;font-weight:900;color:#ffe08a;background:rgba(5,10,8,.62);border:1.5px solid rgba(255,224,138,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);pointer-events:none;letter-spacing:.04em;transition:transform .2s}
.mnPts.up{transform:translateX(-50%) scale(1.25)}
.mnMissionB{background:linear-gradient(145deg,#2fb7a8,#146b63)}
.mnShopB{background:linear-gradient(145deg,#f2c230,#b97f00);color:#241800}
.mnShopPanel{position:absolute;inset:0;z-index:7;display:none;flex-direction:column;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 20px) 16px 24px;box-sizing:border-box;background:rgba(5,10,8,.94);color:#fff;overflow-y:auto}
.mnShopTop{display:flex;justify-content:space-between;align-items:center}
.mnShopTop h3{margin:0;font-weight:800}
.mnShopRow{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14)}
.mnShopE{font-size:2rem;line-height:1}
.mnShopI{flex:1;text-align:left}
.mnShopN{font-weight:800}
.mnShopD{font-size:.85rem;opacity:.75}
.mnShopBuy{padding:10px 14px;border-radius:14px;border:0;font-weight:900;background:#ffd45c;color:#241800;white-space:nowrap}
.mnShopBuy:disabled{opacity:.35}
.mnAlerte{position:absolute;top:calc(env(safe-area-inset-top,0px) + 52px);left:50%;transform:translateX(-50%);z-index:3;padding:6px 16px;border-radius:999px;font-weight:900;color:#fff;background:rgba(190,20,40,.82);border:1.5px solid rgba(255,140,150,.6);pointer-events:none;display:none;animation:mnPulse 1s infinite;white-space:nowrap}
.mnCapaB{background:linear-gradient(145deg,#8a5cf6,#4a2bb0)}
.mnPick{z-index:9}
`;
document.head.appendChild(st);

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
/* Case dessinée : les vitres (V) ont un rendu verre */
function tuile(cx,c,px,py,s){
  if(c!=="V"){cx.fillStyle=C.cases[c];cx.fillRect(px,py,s,s);return}
  cx.fillStyle=C.cases["."]||"#22352c";cx.fillRect(px,py,s,s);
  cx.fillStyle="rgba(120,215,235,.34)";cx.fillRect(px,py,s,s);
  cx.strokeStyle="rgba(215,248,255,.55)";cx.lineWidth=Math.max(1,s*.07);
  cx.strokeRect(px+s*.06,py+s*.06,s-s*.12,s-s*.12);
  cx.strokeStyle="rgba(255,255,255,.45)";cx.lineWidth=Math.max(1,s*.04);
  cx.beginPath();
  cx.moveTo(px+s*.22,py+s*.78);cx.lineTo(px+s*.5,py+s*.22);
  cx.moveTo(px+s*.42,py+s*.86);cx.lineTo(px+s*.72,py+s*.32);
  cx.stroke();
}
/* Avatars : photos des joueurs, gardées en mémoire (une image par joueur) */
var AV={};
function avSrc(a){return typeof a==="string"&&(a.indexOf("data:image/")===0||/^[\w.\-]+\.(png|jpe?g|webp)$/i.test(a))?a:""}
function avCharger(id,a){var s=avSrc(a);if(!s)return;var im=new Image();im.src=s;AV[id]=im}
/* Dessine un joueur : anneau de sa couleur + sa photo (ou son initiale s'il n'en a pas) */
function pion(cx,x,y,r,couleur,id,nom,vert){
  cx.fillStyle=couleur;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
  var im=AV[id],ri=r*.8;
  cx.save();cx.beginPath();cx.arc(x,y,ri,0,7);cx.clip();
  if(im&&im.complete&&im.naturalWidth)cx.drawImage(im,x-ri,y-ri,ri*2,ri*2);
  else{cx.fillStyle="#fff";cx.fillRect(x-ri,y-ri,ri*2,ri*2);
    cx.fillStyle=couleur;cx.font="800 "+Math.round(ri*1.2)+'px "Baloo 2",system-ui,sans-serif';
    cx.textAlign="center";cx.textBaseline="middle";cx.fillText((nom||"?").charAt(0).toUpperCase(),x,y)}
  cx.restore();
  if(vert){
    cx.save();cx.globalAlpha=.55;cx.fillStyle="#58ff3a";
    cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();cx.restore();
    cx.strokeStyle="#7dff4a";cx.lineWidth=Math.max(2,r*.14);
    cx.beginPath();cx.arc(x,y,r*1.05,0,7);cx.stroke();
  }}
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
  if(cfg.options && cfg.options.reveler !== undefined) C.revelerCamp = !!cfg.options.reveler;
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
    mo.prendreNotifs().forEach(function(n){O.envoyer(n.id,{t:"mn:action",ok:true,message:n.message})});
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

    if(m.t==="mn:mission"){
    var mi=m.action==="debut"?mo.missionDebut(id,+m.id):mo.missionFin(id,+m.id);
    O.envoyer(id,{t:"mn:action",ok:mi.ok,message:mi.message});
    return;
  }

  if(m.t==="mn:acheter"){
    var ac=mo.acheter(id,String(m.pouvoir),m.cible);
    O.envoyer(id,{t:"mn:action",ok:ac.ok,message:ac.message});
    return;
  }

  if(m.t==="mn:capa"){
    var ca=mo.capa(id,m.cible);
    O.envoyer(id,{t:"mn:action",ok:ca.ok,message:ca.message});
    return;
  }

  if(m.t==="mn:tirer"){
    var ti=mo.tirer(id,m.cible);
    O.envoyer(id,{t:"mn:action",ok:ti.ok,message:ti.message});
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
    tuile(cx,c,ox+x*cs,oy+y*cs,cs+1);
  }
  Object.keys(mo.cadavres).forEach(function(id){
    var k=mo.cadavres[id];
    if(dedansZ(z,k.x,k.y))
      dessinerCadavre(cx,ox+(k.x-z.x)*cs,oy+(k.y-z.y)*cs,cs*.4,k.couleur,k.id,k.pseudo);
  });
  Object.keys(mo.joueurs).forEach(function(id){
    var j=mo.joueurs[id];
    if(j.mort||j.tunnel||j.invis>0||!dedansZ(z,j.x,j.y)||Moteur.typeCase(j.x,j.y)==="~")return;
    var ap=(j.deguise&&mo.joueurs[j.deguise.id])||j;
    var X=ox+(j.x-z.x)*cs,Y=oy+(j.y-z.y)*cs;
    pion(cx,X,Y,cs*.4,ap.couleur,ap.id,ap.pseudo,j.poison>0&&!j.poisonFurtif);
    cx.font="700 "+Math.round(cs*.4)+"px system-ui";
    cx.textAlign="center";cx.textBaseline="alphabetic";
    cx.fillStyle="#fff";cx.fillText(ap.pseudo,X,Y-cs*.5);
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
    tuile(cx,M.grille[y][x],ox+x*cs,oy+y*cs,cs)}
  dessinerMissionsH(cx,ox,oy,cs);
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

  var rev=mo.reveles();
  Object.keys(mo.joueurs).forEach(function(id){
    var j=mo.joueurs[id];
    if(j.mort)return;
    var montreRole=voir,revele=rev.indexOf(id)>=0;
    if(!montreRole&&!revele)return;
    pion(cx,ox+j.x*cs,oy+j.y*cs,cs*.4,j.couleur,id,j.pseudo,j.poison>0&&!j.poisonFurtif);
    if(revele&&!montreRole){
      cx.strokeStyle="#ffd45c";cx.lineWidth=Math.max(2,cs*.12);
      cx.beginPath();cx.arc(ox+j.x*cs,oy+j.y*cs,cs*.6,0,7);cx.stroke();
    }
    cx.font="700 "+Math.round(cs*.5)+"px system-ui";cx.textAlign="center";cx.textBaseline="alphabetic";
    cx.fillStyle="#fff";
    cx.fillText(montreRole?((MM_ROLES.filter(function(r){return r.id===j.role})[0]||{}).emoji||""):j.pseudo,ox+j.x*cs,oy+j.y*cs-cs*.6);
  });
  dessinerAlerteH(cx,ox,oy,cs,w);

  /* les 2 flux caméras à droite */
  if(avec){
    var m=Math.round(w*.012),px=wCarte+m,pw=w-wCarte-2*m,ph=Math.floor((hh-3*m)/2);
    cams.slice(0,2).forEach(function(z,i){
      dessinerFlux(cx,z,px,m+i*(ph+m),pw,ph,"CAM "+(i+1)+(z.nom?" : "+z.nom:""));
    });
  }
}

/* Alerte lancée par un imposteur mort : grand cercle rouge + compte à rebours */
function dessinerAlerteH(cx,ox,oy,cs,w){
  var a=mo.alerte;if(!a)return;
  var m=M.missions[a.mi],X=ox+(m[0]+.5)*cs,Y=oy+(m[1]+.5)*cs,
      t=performance.now()/1000,p=.5+.5*Math.sin(t*6);
  cx.save();
  cx.strokeStyle="#ff2d3d";cx.lineWidth=Math.max(3,cs*.18);
  cx.globalAlpha=.5+.5*p;
  cx.beginPath();cx.arc(X,Y,cs*(1.6+.5*p),0,7);cx.stroke();
  cx.globalAlpha=1;
  cx.fillStyle="rgba(190,20,40,.9)";cx.beginPath();cx.arc(X,Y,cs*.9,0,7);cx.fill();
  cx.fillStyle="#fff";cx.font="800 "+Math.round(cs*1.1)+"px system-ui";
  cx.textAlign="center";cx.textBaseline="middle";cx.fillText("🚨",X,Y);
  var txt="ALERTE  "+Math.ceil(a.reste)+" s  ·  "+a.faits.size+"/"+a.requis,
      fs=Math.round(cs*1.3);
  cx.font="900 "+fs+"px system-ui";
  var tw=cx.measureText(txt).width+fs;
  cx.fillStyle="rgba(190,20,40,.88)";
  cx.fillRect(w/2-tw/2,oy+cs*.3,tw,fs*1.5);
  cx.fillStyle="#fff";cx.textBaseline="middle";
  cx.fillText(txt,w/2,oy+cs*.3+fs*.75);
  cx.restore();
}

/* Chaque mission = pastille à l'avatar du joueur concerné (couleur + pseudo + ★).
   Aucun emoji : on ne révèle pas qui a une tâche d'imposteur. */
function dessinerMissionsH(cx,ox,oy,cs){
  var t=performance.now()/1000,items=[],tot={},vu={};
  cx.fillStyle="rgba(255,255,255,.12)";
  M.missions.forEach(function(m){cx.beginPath();cx.arc(ox+(m[0]+.5)*cs,oy+(m[1]+.5)*cs,cs*.14,0,7);cx.fill()});
  Object.keys(mo.joueurs).forEach(function(id){
    var j=mo.joueurs[id];
    j.missions.forEach(function(m){items.push({j:j,m:m});tot[m.id]=(tot[m.id]||0)+1});
  });
  items.forEach(function(it,k){
    var m=it.m,j=it.j,n=vu[m.id]=(vu[m.id]==null?0:vu[m.id]+1),
        X=ox+m.x*cs+(n-(tot[m.id]-1)/2)*cs*1.5,Y=oy+m.y*cs,
        p=.5+.5*Math.sin(t*3+k),r=cs*.6;
    cx.save();
    cx.globalAlpha=(j.mort?.25:.5)*(1-p*.6);
    cx.strokeStyle=j.couleur;cx.lineWidth=Math.max(2,cs*.1);
    cx.beginPath();cx.arc(X,Y,r*(1.25+.35*p),0,7);cx.stroke();
    cx.restore();
    cx.save();
    if(j.mort)cx.globalAlpha=.55;
    cx.fillStyle="rgba(5,10,8,.88)";cx.beginPath();cx.arc(X,Y,r*1.12,0,7);cx.fill();
    if(j.mort)cx.setLineDash([cs*.15,cs*.12]);
    cx.strokeStyle=j.couleur;cx.lineWidth=Math.max(2,cs*.1);
    cx.beginPath();cx.arc(X,Y,r*1.12,0,7);cx.stroke();
    cx.setLineDash([]);
    pion(cx,X,Y,r*.95,j.couleur,j.id,j.pseudo);
    cx.fillStyle="#ffd45c";cx.font="800 "+Math.round(cs*.55)+"px system-ui";
    cx.textAlign="center";cx.textBaseline="middle";
    cx.fillText("★",X+r*.95,Y-r*.95);
    cx.font="700 "+Math.round(cs*.38)+"px system-ui";cx.textBaseline="top";
    cx.lineJoin="round";cx.lineWidth=Math.max(2,cs*.1);cx.strokeStyle="rgba(0,0,0,.8)";
    cx.strokeText(j.pseudo,X,Y+r*1.25);
    cx.fillStyle="#fff";cx.fillText(j.pseudo,X,Y+r*1.25);
    cx.restore();
  });
}

function boucleH(){
  if(!actifH)return;
  dessinerH();rafH=requestAnimationFrame(boucleH)}

/* ======================= TÉLÉPHONE ======================= */
var TO={}, T=null, cvT=null, cxT=null, hudT=null, tickT=0, rafT=0;

/* Joystick tactile, ou flèches / ZQSD pour tester sur ordinateur */
function lireDir(){
  if(T.mi)return{x:0,y:0};
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
    flashMort:0,
    points:0, missions:[], rayon:null, rA:null,
    cibleMission:null, mi:null, shopOuvert:false, cleShop:""
    ,liste:null,alerte:null,traces:null,capaCd:0,capaActif:0,chasse:null,chasseTire:false,
    pieges:null,zonesTout:null,pick:null
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
  T.btnMission=h("button","mnAction mnMissionB","MISSION");
  T.btnShop=h("button","mnAction mnShopB","★ 0");
  [T.btnMission,T.btnShop].forEach(function(b){b.style.display="none";T.actions.appendChild(b)});
  T.btnMission.onclick=function(){
    var m=T.cibleMission;
    if(!m||T.mi)return;
    T.stick=null;
    TO.envoyer({t:"mn:mission",action:"debut",id:m.id});
    T.mi=ManoirMissions.ouvrir(r,m,
      function(){TO.envoyer({t:"mn:mission",action:"fin",id:m.id})},
      function(){if(T)T.mi=null});
  };
  T.btnShop.onclick=function(){T.shopOuvert=!T.shopOuvert;T.stick=null;T.cleShop=""};
  T.shopPanel=h("div","mnShopPanel");
  r.appendChild(T.shopPanel);
  T.pts=h("div","mnPts","★ 0");
  r.appendChild(T.pts);
  T.alertEl=h("div","mnAlerte");
  r.appendChild(T.alertEl);

    T.camPanel=h("div","mnCamPanel");
  r.appendChild(T.camPanel);
  T.btnCapa=h("button","mnAction mnCapaB","CAPACITÉ");
  T.btnCapa.style.display="none";
  T.actions.appendChild(T.btnCapa);
  T.btnCapa.onclick=function(){
    var role=T.role&&T.role.role;
    if(role==="detective"){TO.envoyer({t:"mn:capa"});return}
    var opts=(T.liste||[]).map(function(o){return [o[0],o[1]]});
    ouvrirChoix(role==="garde"?"🛡️ Qui protéger ?":"🎭 Quelle apparence ?",opts,function(v){TO.envoyer({t:"mn:capa",cible:v})});
  };
  T.pickPanel=h("div","mnShopPanel mnPick");
  r.appendChild(T.pickPanel);
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
  if(T && T.mi) T.mi.fermer();
  T=null}
function majPanneauCam(){
  if(!T||!T.camPanel)return;
  var estVeilleur=T.phase==="jeu"&&!T.mort&&T.role&&T.role.role==="veilleur";
  if(!estVeilleur||!T.camOuvert){
    T.camOuvert=false;
    T.camPanel.style.display="none";
    T.cleCam="";
    return;
  }
  T.camPanel.style.display="flex";
  var cd=Math.ceil(T.veilleurCd||0);
  var camZ=T.camZ||[0,1];
  var cle=cd+"|"+camZ.join(",");
  if(T.cleCam===cle)return;
  T.cleCam=cle;

  var p=T.camPanel;
  p.innerHTML="";
  var top=h("div","");
  top.style.display="flex";
  top.style.justifyContent="space-between";
  top.style.alignItems="center";
  top.appendChild(h("h3","",cd>0?"Caméras (recharge "+cd+" s)":"Contrôle des caméras"));
  var fermer=h("button","mnb glass","Fermer");
  fermer.onclick=function(){T.camOuvert=false;T.cleCam=""};
  top.appendChild(fermer);
  p.appendChild(top);

  var zones=Moteur.zones||[];
  [0,1].forEach(function(slot){
    p.appendChild(h("h3","","CAM "+(slot+1)));
    var grid=h("div","mnCamGrid");
    zones.forEach(function(z,idx){
      var actif=camZ[slot]===idx;
      var b=h("button","mnCamZ"+(actif?" on":""),z.nom||("Zone "+(idx+1)));
      b.disabled=cd>0||actif;
      b.onclick=function(){
        TO.envoyer({t:"mn:cam",slot:slot,zone:idx});
      };
      grid.appendChild(b);
    });
    p.appendChild(grid);
  });
}

/* Choisir un joueur / une pièce dans une liste (capacités, boutique, tir du chasseur) */
function ouvrirChoix(titre,opts,cb,fermable,chasse){
  fermerChoix();
  var p=T.pickPanel;p.innerHTML="";p.style.display="flex";
  var top=h("div","mnShopTop");top.appendChild(h("h3","",titre));
  if(fermable!==false){var f=h("button","mnb glass","Annuler");f.onclick=fermerChoix;top.appendChild(f)}
  p.appendChild(top);
  if(!opts.length)p.appendChild(h("div","mnShopD","Personne à cibler."));
  opts.forEach(function(o){
    var b=h("button","mnShopBuy",o[1]);
    b.style.width="100%";b.style.padding="14px";
    b.onclick=function(){fermerChoix();cb(o[0])};
    p.appendChild(b);
  });
  T.pick={chasse:!!chasse};
}
function fermerChoix(){
  if(!T||!T.pickPanel)return;
  T.pickPanel.style.display="none";T.pickPanel.innerHTML="";T.pick=null;
}
function majChoix(){
  if(!T||!T.pickPanel)return;
  if(!T.chasse)T.chasseTire=false;
  if(T.chasse&&!T.pick&&!T.chasseTire){
    ouvrirChoix("🎯 Éliminé… emmène quelqu'un avec toi",T.chasse.candidats.map(function(o){return [o[0],o[1]]}),
      function(v){T.chasseTire=true;TO.envoyer({t:"mn:tirer",cible:v})},false,true);
  }else if(!T.chasse&&T.pick&&T.pick.chasse)fermerChoix();
  else if(T.pick&&!T.pick.chasse&&T.phase!=="jeu")fermerChoix();
}

function majBoutique(){
  if(!T||!T.shopPanel)return;
  var ok=T.phase==="jeu"&&T.role&&!T.tunnel;
  if(!ok||!T.shopOuvert){T.shopOuvert=false;T.shopPanel.style.display="none";T.cleShop="";return}
  T.shopPanel.style.display="flex";
  var cle=T.points+"|"+T.mort+"|"+T.role.role;
  if(T.cleShop===cle)return;T.cleShop=cle;
  var p=T.shopPanel;p.innerHTML="";
  var top=h("div","mnShopTop");
  top.appendChild(h("h3","","★ "+T.points+" · "+(T.mort?"Boutique des esprits":"Boutique")));
  var f=h("button","mnb glass","Fermer");
  f.onclick=function(){T.shopOuvert=false;T.cleShop=""};
  top.appendChild(f);p.appendChild(top);
  ManoirMissions.pouvoirs(T.role.role,T.role.camp,T.mort).forEach(function(po){
    var row=h("div","mnShopRow");
    row.appendChild(h("div","mnShopE",po.emoji));
    var i=h("div","mnShopI");
    i.appendChild(h("div","mnShopN",po.nom));
    i.appendChild(h("div","mnShopD",po.desc));
    row.appendChild(i);
    var b=h("button","mnShopBuy","★ "+po.cout);
    b.disabled=T.points<po.cout;
    b.onclick=function(){
      if(!po.cible){TO.envoyer({t:"mn:acheter",pouvoir:po.id});return}
      var opts=po.cible==="piece"
        ?(M.pieces||[]).map(function(p,i){return [i,p[2]]})
        :(T.liste||[]).map(function(o){return [o[0],o[1]]});
      ouvrirChoix(po.nom+" : choisis",opts,function(v){TO.envoyer({t:"mn:acheter",pouvoir:po.id,cible:v})});
    };
    row.appendChild(b);p.appendChild(row);
  });
}

/* Détection des actions disponibles */
function majActionsT(){
  if(!T||!T.actions)return;
  majPanneauCam();majBoutique();majChoix();

  var B=[T.btnAttaque,T.btnReport,T.btnTrappe,T.btnSortir,T.btnRetour,T.btnSonner,T.btnCam,T.btnMission,T.btnShop,T.btnCapa];
  function montrer(b,v){b.style.display=v?"block":"none"}

  if(T.phase!=="jeu"){
    B.forEach(function(b){montrer(b,false)});
    if(T.mi)T.mi.fermer();
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
    if(T.mi)T.mi.fermer();
    return;
  }

  T.cibleMission=null;
  var bm=1.3;
  (T.missions||[]).forEach(function(m){
    var d=Math.hypot(m.x-T.x,m.y-T.y);
    if(d<bm){bm=d;T.cibleMission=m}
  });
  if(T.mi&&!(T.missions||[]).some(function(m){return m.id===T.mi.id}))T.mi.fermer();

  var pretCloche=false;

  if(!T.mort){
    if(peutAttaquer){
      var meilleure=1.2;
      T.autres.forEach(function(o){
        var d=Math.hypot(o[1]-T.x,o[2]-T.y);
        if(d<meilleure&&Moteur.voit(T.x,T.y,o[1],o[2],true)){
          meilleure=d;
          T.cibleAttaque=o[0];
        }
      });
    }

    var meilleureMort=1.5;
    T.cadavres.forEach(function(c){
      if(c[5])return;
      var d=Math.hypot(c[1]-T.x,c[2]-T.y);
      if(d<meilleureMort&&Moteur.voit(T.x,T.y,c[1],c[2],true)){
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
  var aCapa=!T.mort&&(role==="detective"||role==="metamorphe"||role==="garde");
  montrer(T.btnCapa,aCapa);
  if(aCapa){
    var cdc=Math.ceil(T.capaCd||0),
        nomCapa=role==="detective"?"👣 EMPREINTES":role==="metamorphe"?"🎭 MÉTAMORPHOSE":"🛡️ PROTÉGER";
    T.btnCapa.disabled=cdc>0;
    T.btnCapa.textContent=nomCapa+(cdc>0?" ("+cdc+" s)":"");
  }
  montrer(T.btnMission,!!T.cibleMission&&!T.mi);
  if(T.cibleMission)T.btnMission.textContent=T.cibleMission.emoji+" MISSION";
  montrer(T.btnShop,true);
  T.btnShop.textContent="★ "+T.points;
}

/* Vue locale avec brouillard de guerre */

/* Vue locale avec vision claire + décor assombri autour */
/* Vue locale avec vision claire + décor assombri autour */
function dessinerT(){

  if(!T)return;

  var K=ajuster(cvT),w=cvT.width,hh=cvT.height;
  if(!w)return;

  var cx=cxT,Rb=C.rayonVision;
  T.rA=(T.rA==null?(T.rayon||Rb):T.rA+((T.rayon||Rb)-T.rA)*.12);
  var R=T.rA;
  var cs=Math.floor(Math.min(w,hh)/(2*Rb+1));
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
        tuile(cx,M.grille[y][x],ox+x*cs,oy+y*cs,cs+1);
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
          !Moteur.opaque(
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

          tuile(cx,c,ox+x*cs,oy+y*cs,cs+1);
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

    // Zones des caméras (veilleur), pièges (chasseur), empreintes (détective)
    if(T.zonesTout){
      cx.save();cx.setLineDash([cs*.3,cs*.2]);cx.strokeStyle="#ff3b47";cx.lineWidth=2*K;
      T.zonesTout.forEach(function(z){cx.strokeRect(ox+z[0]*cs,oy+z[1]*cs,z[2]*cs,z[3]*cs)});
      cx.restore();
    }
    if(T.pieges){
      cx.font=Math.round(cs*.6)+"px system-ui";cx.textAlign="center";cx.textBaseline="middle";
      T.pieges.forEach(function(p){cx.fillText("🪤",ox+p[0]*cs,oy+p[1]*cs)});
    }
    if(T.traces){
      T.traces.forEach(function(t){
        var X=ox+t[0]*cs,Y=oy+t[1]*cs;
        cx.globalAlpha=Math.max(.12,1-t[2])*.85;
        cx.fillStyle=t[3]||"#e8f1ff";
        cx.beginPath();cx.ellipse(X-cs*.09,Y,cs*.07,cs*.12,0,0,7);cx.fill();
        cx.beginPath();cx.ellipse(X+cs*.09,Y+cs*.06,cs*.07,cs*.12,0,0,7);cx.fill();
      });
      cx.globalAlpha=1;
    }

    // Missions du joueur (pastilles lumineuses, flèches sur les bords si hors écran)
    var tt=performance.now()/1000;
    T.missions.forEach(function(m,k){
      var X=ox+m.x*cs,Y=oy+m.y*cs,p=.5+.5*Math.sin(tt*3+k*1.7),
          col=m.alerte?"#ff3b47":m.cat==="imposteur"?"#ff6b78":m.cat==="mort"?"#8cecff":"#5ff2c8";
      if(X<0||X>w||Y<0||Y>hh){
        var mg=34*K,ex=Math.max(mg,Math.min(w-mg,X)),ey=Math.max(mg,Math.min(hh-mg,Y)),
            an2=Math.atan2(Y-ey,X-ex);
        cx.fillStyle="rgba(5,10,8,.8)";cx.strokeStyle=col;cx.lineWidth=2.5*K;
        cx.beginPath();cx.arc(ex,ey,17*K,0,7);cx.fill();cx.stroke();
        cx.font=Math.round(17*K)+"px system-ui";cx.textAlign="center";cx.textBaseline="middle";
        cx.fillStyle="#fff";cx.fillText(m.emoji,ex,ey+1);
        cx.fillStyle=col;cx.beginPath();
        cx.moveTo(ex+Math.cos(an2)*27*K,ey+Math.sin(an2)*27*K);
        cx.lineTo(ex+Math.cos(an2+2.5)*20*K,ey+Math.sin(an2+2.5)*20*K);
        cx.lineTo(ex+Math.cos(an2-2.5)*20*K,ey+Math.sin(an2-2.5)*20*K);
        cx.fill();
        return;
      }
      var g2=cx.createRadialGradient(X,Y,0,X,Y,cs*(1+.25*p));
      g2.addColorStop(0,col+"88");g2.addColorStop(1,col+"00");
      cx.fillStyle=g2;cx.beginPath();cx.arc(X,Y,cs*(1+.25*p),0,7);cx.fill();
      cx.save();cx.translate(X,Y);cx.rotate(Math.PI/4);
      cx.fillStyle="rgba(5,10,8,.85)";cx.strokeStyle=col;cx.lineWidth=2.5*K;
      cx.beginPath();cx.rect(-cs*.28,-cs*.28,cs*.56,cs*.56);cx.fill();cx.stroke();
      cx.restore();
      cx.font=Math.round(cs*.4)+"px system-ui";cx.textAlign="center";cx.textBaseline="middle";
      cx.fillStyle="#fff";cx.fillText(m.emoji,X,Y+1);
    });
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

    // Autres joueurs visibles
    for(i=0;i<T.autres.length;i++){
      var o=T.autres[i];
      if(!T.mort&&!o[6]){                         // o[6] : vu par les caméras du veilleur
        if(Math.hypot(o[1]-T.x,o[2]-T.y)>R)continue;
        if(!Moteur.voit(T.x,T.y,o[1],o[2]))continue;
      }
      cx.save();
      if(o[7])cx.globalAlpha=.4;                  // o[7] : fantôme
      pion(cx,ox+o[1]*cs,oy+o[2]*cs,cs*.4,o[3],o[8]||o[0],o[4],!!o[5]);   // o[5] : empoisonné → vert
      cx.restore();
      cx.textAlign="center";
      cx.textBaseline="alphabetic";
      cx.font='700 '+Math.round(cs*.4)+'px "Baloo 2",system-ui,sans-serif';
      cx.fillStyle="#fff";
      cx.fillText(o[4],ox+o[1]*cs,oy+o[2]*cs-cs*.5);
    }

    // Personnage du joueur
    if(T.mort){

      // Fantôme translucide avec contour lumineux
      cx.save();
      cx.globalAlpha=.4;

      pion(
        cx,w/2,hh/2,cs*.4,
        "#8cecff",T.id,T.pseudo
      );

      cx.globalAlpha=.8;
      cx.strokeStyle="#a4f1ff";
      cx.lineWidth=2*K;
      cx.beginPath();
      cx.arc(w/2,hh/2,cs*.48,0,Math.PI*2);
      cx.stroke();

      cx.restore();

    }else{

      if(T.tunnel)cx.globalAlpha=.45;
      pion(
        cx,w/2,hh/2,cs*.4,
        T.couleur,T.id,T.pseudo
      );
      cx.globalAlpha=1;
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
    var ancienPts=T.points;
    T.points=m.points||0;
    T.rayon=m.rayon||null;
    T.missions=(m.missions||[]).concat(m.alerte&&m.alerte.mission?[m.alerte.mission]:[]);
    T.alerte=m.alerte||null;
    T.liste=m.liste||null;
    T.traces=m.traces||null;
    T.capaCd=m.capaCd||0;
    T.capaActif=m.capaActif||0;
    T.chasse=m.chasse||null;
    T.pieges=m.pieges||null;
    T.zonesTout=m.zonesTout||null;
    if(m.alerte&&m.phase==="jeu"){
      T.alertEl.style.display="block";
      T.alertEl.textContent="🚨 ALERTE · "+m.alerte.reste+" s · "+m.alerte.faits+"/"+m.alerte.requis;
    }else T.alertEl.style.display="none";
    T.pts.textContent="★ "+T.points;
    if(T.points>ancienPts){
      T.pts.classList.add("up");
      setTimeout(function(){if(T&&T.pts)T.pts.classList.remove("up")},250);
    }
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
      },Math.max(2200,String(m.message).length*55));
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
