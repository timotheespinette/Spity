/* ===== spity-mots.js : les mots d’UnderSea (ajouter, générer avec l’IA, tout voir) ===== */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Les 3 images de poissons (PNG, dossier "jeux" sur GitHub).
   Chaque image se place en haut d’une des 3 cartes (ajouter / générer / voir tout).
   Laisse "" pour ne rien afficher. */
var MOTS_IMG = [
  "jeux/pieuvre.png",   /* carte 1 « Ajouter des mots »   ex. "jeux/poisson1.png" */
  "jeux/poisson-clown.png",   /* carte 2 « Générer des mots »    ex. "jeux/poisson2.png" */
  "jeux/requin.png"    /* carte 3 « Voir tous les mots »  ex. "jeux/poisson3.png" */
];

/* Clé Gemini : plus tard, tu la mettras depuis les paramètres avec  Mots.cle("ta clé").
   Tu peux aussi la coller ici en attendant (mais ne la publie pas sur GitHub). */
var MOTS_CLE_GEMINI = "";

/* Nom du modèle Gemini : à vérifier dans la doc de Google si la génération échoue. */
var MOTS_MODELE = "gemini-3.6-flash";

/* Les 50 paires de base : [mot normal, mot undercover] */
var MOTS_BASE = [
  ["Chat","Chien"],["Pomme","Poire"],["Café","Thé"],["Plage","Piscine"],["Vélo","Moto"],
  ["Pizza","Quiche"],["Football","Rugby"],["Lune","Soleil"],["Train","Tramway"],["Beurre","Margarine"],
  ["Lion","Tigre"],["Guitare","Violon"],["Pantalon","Short"],["Crayon","Stylo"],["Mer","Océan"],
  ["Fromage","Yaourt"],["Médecin","Infirmier"],["Livre","Magazine"],["Avion","Hélicoptère"],["Montagne","Colline"],
  ["Chocolat","Caramel"],["Pluie","Neige"],["Hôtel","Auberge"],["Cinéma","Théâtre"],["Fraise","Framboise"],
  ["Canapé","Fauteuil"],["Rivière","Ruisseau"],["Pirate","Corsaire"],["Roi","Empereur"],["Voiture","Camion"],
  ["Biscuit","Gâteau"],["Poisson","Dauphin"],["Orange","Mandarine"],["Cuillère","Fourchette"],["Chapeau","Casquette"],
  ["Tente","Cabane"],["Piano","Orgue"],["Pull","Gilet"],["Savon","Shampoing"],["Escalier","Ascenseur"],
  ["Miel","Confiture"],["Lac","Étang"],["Boulanger","Pâtissier"],["Requin","Baleine"],["Château","Palais"],
  ["Bougie","Lampe"],["Sac à dos","Valise"],["Vampire","Zombie"],["Facteur","Livreur"],["Montre","Réveil"]
];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var LS_PERSO="spity-mots-perso", LS_CLE="spity-gemini-cle";
var root, opts={}, perso=lireLS(LS_PERSO), deja=[], nGen=5, ouvert=false, occupe=false;

function lireLS(k){try{var v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch(e){return[]}}
function ecrireLS(k,v){try{localStorage.setItem(k,typeof v==="string"?v:JSON.stringify(v))}catch(e){}}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

/* Clé Gemini : Mots.cle() lit, Mots.cle("abc") enregistre */
function cle(k){
  if(typeof k==="string")ecrireLS(LS_CLE,k.trim());
  if(MOTS_CLE_GEMINI)return MOTS_CLE_GEMINI;
  try{return localStorage.getItem(LS_CLE)||""}catch(e){return""}}

function tous(){
  return MOTS_BASE.map(function(p){return{a:p[0],b:p[1],perso:false}})
    .concat(perso.map(function(p,i){return{a:p[0],b:p[1],perso:true,i:i}}))}

function existants(){var o={};tous().forEach(function(p){o[norm(p.a)]=1;o[norm(p.b)]=1});return o}

/* Tire une paire au hasard, sans répéter tant qu’il en reste de jamais jouées */
function tirer(){
  var t=tous(),l=t.filter(function(p){return deja.indexOf(p.a+"|"+p.b)<0});
  if(!l.length){deja=[];l=t}
  var p=l[Math.floor(Math.random()*l.length)];deja.push(p.a+"|"+p.b);
  return{a:p.a,b:p.b}}

function ajouter(a,b){
  a=String(a||"").trim().slice(0,30);b=String(b||"").trim().slice(0,30);
  if(!norm(a)||!norm(b))return{ok:false,msg:"Remplis les deux mots."};
  if(norm(a)===norm(b))return{ok:false,msg:"Les deux mots doivent être différents."};
  var ex=existants();
  if(ex[norm(a)])return{ok:false,msg:"« "+a+" » existe déjà."};
  if(ex[norm(b)])return{ok:false,msg:"« "+b+" » existe déjà."};
  perso.push([a,b]);ecrireLS(LS_PERSO,perso);return{ok:true}}

/* Génération avec Gemini : renvoie une promesse (nombre de paires ajoutées) */
function generer(n){
  var ex=existants(),ajoutees=0,essais=0;
  function tour(){
    var reste=n-ajoutees;
    if(reste<=0||essais>=3)return Promise.resolve(ajoutees);
    essais++;
    var vus=tous().slice(-300).map(function(p){return p.a+" / "+p.b}).join(", ");
    var prompt="Tu crées des paires de mots pour le jeu Undercover, en français. Donne exactement "+reste+" paires. "+
      "Chaque paire = deux mots proches mais différents (exemple : Chat / Chien), simples et connus de tous, un seul mot chacun (deux au maximum). "+
      "Le premier est le mot normal, le second est le mot undercover. "+
      "N’utilise AUCUN mot de cette liste, ni en premier ni en second : "+vus+". "+
      "Réponds uniquement par un tableau JSON, par exemple [[\"Chat\",\"Chien\"],[\"Pomme\",\"Poire\"]].";
    var url="https://generativelanguage.googleapis.com/v1beta/models/"+MOTS_MODELE+":generateContent?key="+encodeURIComponent(cle());
    return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:1}})})
      .then(function(r){if(!r.ok)throw new Error("erreur "+r.status);return r.json()})
      .then(function(d){
        var t=d.candidates[0].content.parts[0].text.replace(/```json|```/g,"").trim(),arr=JSON.parse(t);
        arr.forEach(function(p){
          if(ajoutees>=n||!Array.isArray(p)||p.length<2)return;
          var a=String(p[0]).trim().slice(0,30),b=String(p[1]).trim().slice(0,30),na=norm(a),nb=norm(b);
          if(!na||!nb||na===nb||ex[na]||ex[nb])return;      /* mot déjà présent : on ignore */
          ex[na]=1;ex[nb]=1;perso.push([a,b]);ajoutees++});
        ecrireLS(LS_PERSO,perso);
        return tour()})}
  return tour()}

/* ----- Interface ----- */
var st=document.createElement("style");
st.textContent=`
.mw{box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;align-items:center;gap:clamp(48px,8vh,72px);padding:96px clamp(14px,4vw,44px) 44px}
.mback{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.mback:active{transform:scale(.94)}
.mback svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mbox{position:relative;width:min(100%,760px);box-sizing:border-box;padding:24px 22px 26px;display:flex;flex-direction:column;align-items:center;gap:14px}
.mbox .mt{margin:0;font-weight:800;font-size:clamp(1.5rem,4.2vw,2.3rem);line-height:1.1;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.mfish{position:absolute;right:16px;top:calc(clamp(60px,12vw,110px)*-.62);width:clamp(60px,12vw,110px);height:auto;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(0,40,90,.35))}
.mbox:nth-of-type(2) .mfish{right:auto;left:16px}
.mduo{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}
.mlab{display:flex;flex-direction:column;gap:6px;font-weight:800;font-size:1rem;text-align:center}
.mgen{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.mp{width:48px;height:48px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:1.7rem;line-height:1}
.mp:active{transform:scale(.92)}
.mp:disabled{opacity:.3;cursor:not-allowed}
.mn{min-width:2.2em;font-weight:800;font-size:2rem;text-align:center}
.mmsg{min-height:1.3em;font-weight:600;text-align:center}
.mmsg.bad{color:#ffd0d0}
.mtog{background:none;width:100%;padding:0;display:flex;align-items:center;justify-content:center;gap:10px}
.mtog .ar{display:inline-block;transition:transform .25s;font-size:1.4rem}
.mtog.on .ar{transform:rotate(180deg)}
.mlist{display:grid;grid-template-columns:1fr 1fr 36px;gap:6px 10px;width:100%;max-height:50vh;overflow-y:auto;margin-top:6px;align-items:center}
.mlist[hidden]{display:none}
.mrow{display:contents}
.mrow span{padding:6px 10px;border-radius:12px;background:rgba(255,255,255,.12);font-weight:700;text-align:center;overflow-wrap:anywhere}
.mrow .mh{background:none;opacity:.85}
.mx{width:32px;height:32px;padding:0;border-radius:50%;background:var(--glass);border:1.5px solid var(--line);font-weight:800}
@media (max-width:520px){.mduo{grid-template-columns:1fr}}
`;
document.head.appendChild(st);

function say(n,t,bad){var m=root.querySelector("#mM"+n);m.textContent=t||"";m.classList.toggle("bad",!!bad)}

function liste(){
  var l=root.querySelector("#mList"),t=tous();l.innerHTML="";
  var hd=h("div","mrow");hd.appendChild(h("span","mh","Mot normal"));hd.appendChild(h("span","mh","Mot undercover"));hd.appendChild(h("span","mh",""));l.appendChild(hd);
  t.forEach(function(p){
    var r=h("div","mrow");r.appendChild(h("span","",p.a));r.appendChild(h("span","",p.b));
    if(p.perso){var x=h("button","mx","✕");x.setAttribute("aria-label","Supprimer "+p.a+" / "+p.b);
      x.onclick=function(){perso.splice(p.i,1);ecrireLS(LS_PERSO,perso);maj()};r.appendChild(x)}
    else r.appendChild(h("span","",""));
    l.appendChild(r)});
  root.querySelector("#mTogT").textContent=(ouvert?"Masquer les mots":"Voir tous les mots")+" ("+t.length+")"}

function maj(){
  root.querySelector("#mN").textContent=nGen;
  root.querySelector("#mMoins").disabled=nGen<=1;
  root.querySelector("#mPlus").disabled=nGen>=20;
  liste()}

function fish(i){return MOTS_IMG[i]?'<img class="mfish" src="'+MOTS_IMG[i]+'" alt="">':""}

function init(r,o){
  root=r;opts=o||{};
  root.innerHTML=
  '<div class="mw">'+
    '<button class="mback" id="mBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
    '<div class="mbox glass">'+fish(0)+'<h2 class="mt">Ajouter des mots</h2>'+
      '<div class="mduo">'+
        '<label class="mlab">Mot normal<input class="in" id="mA" maxlength="30" autocomplete="off"></label>'+
        '<label class="mlab">Mot undercover<input class="in" id="mB" maxlength="30" autocomplete="off"></label>'+
      '</div>'+
      '<button class="btn sun" id="mAdd">Ajouter</button><div class="mmsg" id="mM1" role="status"></div>'+
    '</div>'+
    '<div class="mbox glass">'+fish(1)+'<h2 class="mt">Générer des mots</h2>'+
      '<div class="mgen"><button class="mp" id="mMoins" aria-label="Moins">−</button><span class="mn" id="mN"></span><button class="mp" id="mPlus" aria-label="Plus">+</button>'+
      '<button class="btn" id="mGen">Générer</button></div><div class="mmsg" id="mM2" role="status"></div>'+
    '</div>'+
    '<div class="mbox glass">'+fish(2)+
      '<button class="mtog" id="mTog" aria-expanded="false"><h2 class="mt" id="mTogT"></h2><span class="ar" aria-hidden="true">▾</span></button>'+
      '<div class="mlist" id="mList" hidden></div>'+
    '</div>'+
  '</div>';
  var q=function(i){return root.querySelector("#"+i)};
  q("mBack").onclick=function(){opts.retour&&opts.retour()};
  q("mAdd").onclick=function(){
    var res=ajouter(q("mA").value,q("mB").value);
    if(res.ok){q("mA").value="";q("mB").value="";say(1,"Paire ajoutée ✓");maj();q("mA").focus()}
    else say(1,res.msg,true)};
  q("mMoins").onclick=function(){nGen=Math.max(1,nGen-1);maj()};
  q("mPlus").onclick=function(){nGen=Math.min(20,nGen+1);maj()};
  q("mGen").onclick=function(){
    if(occupe)return;
    if(!cle())return say(2,"Ajoute d’abord ta clé Gemini dans les paramètres.",true);
    var b=q("mGen");occupe=true;b.disabled=true;b.textContent="Génération…";say(2,"");
    generer(nGen).then(function(k){
        say(2,k?k+(k>1?" paires ajoutées":" paire ajoutée")+" ✓":"Aucune nouvelle paire trouvée, réessaie.",!k);maj()})
      .catch(function(e){say(2,"La génération a échoué ("+(e&&e.message||"erreur")+"). Vérifie la clé et la connexion.",true)})
      .then(function(){occupe=false;b.disabled=false;b.textContent="Générer"})};
  q("mTog").onclick=function(){
    ouvert=!ouvert;q("mList").hidden=!ouvert;q("mTog").classList.toggle("on",ouvert);q("mTog").setAttribute("aria-expanded",ouvert);maj()};
  maj()}

window.Mots={init:init,tirer:tirer,tous:tous,ajouter:ajouter,cle:cle};
})();
