/* ===== spity-undersea.js : menu du jeu UnderSea (avant la partie) =====
   Même écran en ligne (salon) et en local : seul l'appelant change. */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Nom de l'image du bandeau (dossier "jeux" sur GitHub).
   Format conseillé : 2,5 fois plus large que haute (ex. 1500 x 600 px).
   Laisse "" tant que l'image n'existe pas : un dégradé bleu s'affiche. */
var US_IMAGE = "jeux/undersea.png";

/* true = le titre « UNDERSEA » est écrit par-dessus l'image.
   false = ton image contient déjà le titre. */
var US_TITRE_SUR_IMAGE = true;

/* Réglages de départ des rôles spéciaux */
var US_UNDERCOVER_DEPART = 1;
var US_MRWHITE_DEPART    = 0;

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var root, opts = {}, nb = 0;                       /* nb = nombre de joueurs connectés */
var cfg = {undercover: US_UNDERCOVER_DEPART, mrwhite: US_MRWHITE_DEPART};
var ROLES = [
  {k:"undercover", label:"Undercover", min:1},
  {k:"mrwhite",    label:"Mr White",   min:0}
];

var st = document.createElement("style");
st.textContent =
".usw{position:relative;box-sizing:border-box;width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(14px,3vh,30px);padding:76px clamp(14px,4vw,44px) 28px}"+
".ustop{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border:1.5px solid var(--line,rgba(255,255,255,.22));border-radius:50%;display:grid;place-items:center;background:var(--glass,rgba(255,255,255,.12));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer}"+
".ustop:active{transform:scale(.94)}"+
".ustop svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"+
".usban{position:relative;flex:none;aspect-ratio:5/2;width:min(100%,900px,calc((100vh - 300px)*2.5));min-width:260px;border-radius:26px;overflow:hidden;border:4px solid rgba(255,255,255,.55);box-shadow:0 12px 30px rgba(0,40,90,.4);background-size:cover;background-position:center;display:grid;place-items:center}"+
".usban::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,20,60,.45),transparent 60%);pointer-events:none}"+
".ustit{position:relative;z-index:1;color:#fff;font-weight:800;font-size:clamp(2rem,9vw,5.4rem);line-height:1;letter-spacing:.04em;text-shadow:0 4px 16px rgba(0,30,80,.75)}"+
".usrow{width:min(100%,1000px);display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:clamp(10px,2vw,26px);align-items:stretch}"+
".usb{display:flex;align-items:center;justify-content:center;padding:18px 10px 20px;border:0;border-radius:24px;font:inherit;font-weight:800;font-size:clamp(1.3rem,3vw,2rem);line-height:1.1;cursor:pointer;transition:transform .1s,box-shadow .1s}"+
".usb:active{transform:translateY(7px);box-shadow:0 0 0 transparent!important}"+
".usb:focus-visible,.usp:focus-visible,.ustop:focus-visible{outline:3px solid #fff;outline-offset:3px}"+
".usb-v{background:linear-gradient(180deg,#9170ff,#7a57f5);color:#fff;box-shadow:0 7px 0 #3f26a8}"+
".usb-m{background:linear-gradient(180deg,#5bf0d3,#34d9bc);color:#082a24;box-shadow:0 7px 0 #14917c}"+
".usb:disabled{filter:grayscale(.7) brightness(.8);cursor:not-allowed}"+
".usst{display:flex;flex-direction:column;gap:10px;justify-content:center}"+
".usr{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 14px;border-radius:18px;background:var(--glass,rgba(255,255,255,.12));border:1.5px solid var(--line,rgba(255,255,255,.22));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff}"+
".usn{font-weight:800;font-size:1.3rem;min-width:2.3em}"+
".usl{flex:1;font-weight:700;font-size:clamp(.9rem,2.2vw,1.2rem);text-align:left}"+
".usp{width:44px;height:44px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font:inherit;font-weight:800;font-size:1.6rem;line-height:1;cursor:pointer}"+
".usp:active{transform:scale(.92)}"+
".usp:disabled{opacity:.3;cursor:not-allowed}"+
".ustoast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);transform:translate(-50%,10px);opacity:0;pointer-events:none;z-index:30;max-width:90vw;background:#fff;color:#150b36;padding:10px 18px;border-radius:14px;font-weight:600;text-align:center;transition:opacity .25s,transform .25s}"+
".ustoast.on{opacity:1;transform:translate(-50%,0)}"+
"@media (max-width:700px){.usrow{grid-template-columns:1fr 1fr}.usst{grid-column:1/-1;order:-1}}";
document.head.appendChild(st);

/* Nombre maximum de rôles spéciaux : les civils doivent rester majoritaires */
function cap(){ return nb >= 3 ? Math.floor((nb - 1) / 2) : 20 }
function total(){ return cfg.undercover + cfg.mrwhite }

function toast(msg){
  var t = root.querySelector(".ustoast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.id); toast.id = setTimeout(function(){ t.classList.remove("on") }, 2200)}

/* Si le nombre de joueurs baisse, on réduit les rôles pour rester valide */
function ajuster(){
  while(total() > cap() && cfg.mrwhite > 0) cfg.mrwhite--;
  while(total() > cap() && cfg.undercover > 1) cfg.undercover--}

function maj(){
  ajuster();
  ROLES.forEach(function(r){
    root.querySelector("#usN_" + r.k).textContent = cfg[r.k] + "x";
    root.querySelector("#usM_" + r.k).disabled = cfg[r.k] <= r.min;
    root.querySelector("#usP_" + r.k).disabled = total() >= cap()});
  var go = root.querySelector("#usGo");
  go.disabled = nb > 0 && nb < 3}

function pas(k, d){
  cfg[k] += d; maj()}

function demarrer(){
  if(nb > 0 && nb < 3) return toast("Il faut au moins 3 joueurs.");
  opts.demarrer ? opts.demarrer({undercover: cfg.undercover, mrwhite: cfg.mrwhite}) : toast("Bientôt : la partie sera ajoutée à l’étape suivante.")}

function mot(){
  opts.mot ? opts.mot() : toast("Bientôt : le choix du mot sera ajouté à l’étape suivante.")}

/* Appelé par le salon quand la liste des joueurs change (en local : ne pas l'appeler) */
function joueurs(l){
  nb = l ? l.length : 0;
  if(root) maj()}

function init(r, o){
  root = r; opts = o || {};
  var g = "linear-gradient(135deg,#1fb6e8,#0a5ea8)";
  root.innerHTML =
    '<div class="usw">'+
      '<button class="ustop" id="usBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
      '<div class="usban" id="usBan" role="img" aria-label="UnderSea">'+(US_TITRE_SUR_IMAGE ? '<div class="ustit">UNDERSEA</div>' : '')+'</div>'+
      '<div class="usrow">'+
        '<button class="usb usb-v" id="usMot">Mot</button>'+
        '<button class="usb usb-m" id="usGo">Démarrer</button>'+
        '<div class="usst">'+
          ROLES.map(function(x){
            return '<div class="usr"><span class="usn" id="usN_'+x.k+'"></span><span class="usl">'+x.label+'</span>'+
              '<button class="usp" id="usP_'+x.k+'" aria-label="Ajouter : '+x.label+'">+</button>'+
              '<button class="usp" id="usM_'+x.k+'" aria-label="Retirer : '+x.label+'">−</button></div>'}).join("")+
        '</div>'+
      '</div>'+
      '<div class="ustoast" role="status" aria-live="polite"></div>'+
    '</div>';
  root.querySelector("#usBan").style.backgroundImage = (US_IMAGE ? 'url("' + US_IMAGE + '"),' : "") + g;
  root.querySelector("#usBack").onclick = function(){ opts.retour && opts.retour() };
  root.querySelector("#usMot").onclick = mot;
  root.querySelector("#usGo").onclick = demarrer;
  ROLES.forEach(function(x){
    root.querySelector("#usP_" + x.k).onclick = function(){ pas(x.k, 1) };
    root.querySelector("#usM_" + x.k).onclick = function(){ pas(x.k, -1) }});
  maj()}

window.UnderSea = {init: init, joueurs: joueurs};
})();
