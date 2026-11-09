/* ===== spity-local.js : mode Local, on crée les joueurs sur un seul appareil ===== */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Nombre minimum / maximum de joueurs */
var LOCAL_MIN = 3;
var LOCAL_MAX = 20;

/* Couleurs de contour données aux joueurs, dans l'ordre (elles se répètent si besoin) */
var LOCAL_COULEURS = ["#ff7a59","#7a57f5","#34d9bc","#ffc23d","#ff6fa8","#4fc3f7","#9ccc65"];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var root, opts = {}, joueurs = [], compteur = 0, photo = "", dernier = "";

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function q(i){return root.querySelector("#"+i)}
function msg(t){opts.toast && opts.toast(t)}
function couleur(){return LOCAL_COULEURS[joueurs.length % LOCAL_COULEURS.length]}

var st = document.createElement("style");
st.textContent =
"#local{padding:0;overflow-y:auto}"+
".lw{box-sizing:border-box;min-height:100%;width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;padding:76px clamp(14px,4vw,44px) 28px}"+
".lform{width:min(100%,1000px);box-sizing:border-box;padding:22px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:20px clamp(18px,4vw,50px);align-items:center}"+
".lleft{display:flex;flex-direction:column;align-items:center;gap:12px}"+
".lright{display:flex;flex-direction:column;gap:16px}"+
"#lPv .av{width:clamp(120px,24vh,220px);border-width:8px}"+
".lbtns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}"+
".lbtns .btn{padding:8px 18px 10px;font-size:1.05rem}"+
"#lName{font-size:clamp(1.4rem,3.4vw,2.2rem)}"+
"#lPick{display:flex;flex-direction:column;gap:10px}"+
"#lPick .two .btn{padding:12px 8px 14px;font-size:1.1rem}"+
".lros{width:min(100%,1000px);box-sizing:border-box;padding:16px 18px 20px;display:flex;flex-direction:column;align-items:center;gap:12px}"+
".lros h3{margin:0;font-weight:800;font-size:1.3rem}"+
".llist{display:flex;flex-wrap:wrap;gap:14px 18px;justify-content:center}"+
".llist .av{width:clamp(52px,9vh,80px);border-width:3px}"+
".lvide{font-weight:600;opacity:.85}"+
"@media (max-width:760px){.lform{grid-template-columns:1fr}}";
document.head.appendChild(st);

/* Aperçu de l'avatar en cours de création */
function pv(){
  var b=q("lPv");b.innerHTML="";
  b.appendChild(Avatar.make({avatar:photo,ring:couleur(),contour:Avatar.mine.contour,acc:Avatar.mine.acc}))}

/* Choix du contour / accessoire (reconstruit à chaque nouveau joueur) */
function picker(){
  var p=q("lPick");p.innerHTML="";
  Avatar.picker(p,pv)}

/* Liste des joueurs déjà ajoutés */
function dessiner(){
  var l=q("lList");l.innerHTML="";
  q("lCount").textContent="Joueurs ("+joueurs.length+"/"+LOCAL_MAX+")";
  if(!joueurs.length)l.appendChild(h("div","lvide","Personne pour l’instant : ajoute le premier joueur !"));
  joueurs.forEach(function(p){
    var d=h("div","pl"+(p.id===dernier?"":" old"));
    d.appendChild(Avatar.make(p));d.appendChild(h("div","nm",p.name));
    var k=h("button","kick","✕");k.setAttribute("aria-label","Retirer "+p.name);
    k.onclick=function(){
      joueurs=joueurs.filter(function(x){return x.id!==p.id});
      dernier="";dessiner();pv()};
    d.appendChild(k);l.appendChild(d)});
  dernier=""}

function ajouter(){
  var nom=q("lName").value.trim();
  if(!nom)return msg("Choisis un pseudo.");
  if(joueurs.length>=LOCAL_MAX)return msg("Maximum "+LOCAL_MAX+" joueurs.");
  if(joueurs.some(function(p){return p.name.toLowerCase()===nom.toLowerCase()}))return msg("Ce pseudo est déjà pris.");
  var p={id:"l"+(++compteur),name:nom.slice(0,14),avatar:photo,ring:couleur(),contour:Avatar.mine.contour,acc:Avatar.mine.acc};
  joueurs.push(p);dernier=p.id;
  /* on remet tout à zéro pour le joueur suivant */
  photo="";Avatar.mine.contour="";Avatar.mine.acc="";
  q("lName").value="";q("lFile").value="";q("lFileCam").value="";
  picker();pv();dessiner();q("lName").focus()}

/* Photo / selfie : même traitement que dans le salon (carré 192 px) */
function lirePhoto(){
  var f=this.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    var im=new Image();
    im.onload=function(){
      var s=Math.min(im.width,im.height),c=document.createElement("canvas");
      c.width=c.height=192;
      c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,192,192);
      photo=c.toDataURL("image/jpeg",.8);pv()};
    im.src=r.result};
  r.readAsDataURL(f)}

function init(r,o){
  root=r;opts=o||{};
  root.innerHTML=
    '<div class="lw">'+
      '<button class="back glass" id="lBack">← Accueil</button>'+
      '<div class="lform glass">'+
        '<div class="lleft">'+
          '<div id="lPv"></div>'+
          '<div class="lbtns"><button class="btn" id="lPhoto">Photo</button><button class="btn" id="lSelfie">Selfie</button><button class="btn" id="lRm">Supprimer</button></div>'+
          '<input type="file" id="lFile" accept="image/*" hidden>'+
          '<input type="file" id="lFileCam" accept="image/*" capture="user" hidden>'+
        '</div>'+
        '<div class="lright">'+
          '<input class="in" id="lName" maxlength="14" placeholder="Pseudo" autocomplete="off" aria-label="Pseudo du joueur">'+
          '<div id="lPick"></div>'+
          '<button class="btn sun" id="lAdd">Ajouter ce joueur</button>'+
        '</div>'+
      '</div>'+
      '<div class="lros glass"><h3 id="lCount"></h3><div class="llist" id="lList"></div></div>'+
      '<button class="btn sun" id="lGo">Continuer</button>'+
    '</div>';
  q("lBack").onclick=function(){opts.retour && opts.retour()};
  q("lPhoto").onclick=function(){q("lFile").click()};
  q("lSelfie").onclick=function(){q("lFileCam").click()};
  q("lRm").onclick=function(){photo="";q("lFile").value="";q("lFileCam").value="";pv()};
  q("lFile").onchange=lirePhoto;
  q("lFileCam").onchange=lirePhoto;
  q("lAdd").onclick=ajouter;
  q("lName").onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();ajouter()}};
  q("lGo").onclick=function(){
    if(joueurs.length<LOCAL_MIN)return msg("Il faut au moins "+LOCAL_MIN+" joueurs.");
    opts.valider && opts.valider(joueurs.slice())};
  Avatar.mine.contour="";Avatar.mine.acc="";
  picker();pv();dessiner()}

window.Local={init:init,joueurs:function(){return joueurs.slice()}};
})();
