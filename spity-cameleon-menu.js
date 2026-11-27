
/* ==========================================================
   MANOIR-MENU.JS — SPITY
   Refonte jungle : Rôles / Paramètres / Règles
   Compatible avec l'API ManoirMenu existante.
   ========================================================== */

/* ===================== CONFIGURATION ===================== */

var MM_TITRE = "Caméléon";

var MM_ROLES = [
  {
    id:"cultiste", nom:"Le Cultiste", camp:"cultiste", fixe:true,
    desc:"Attaque au contact. Tous les cultistes peuvent utiliser les trappes.",
    detail:"Le Cultiste est un membre du camp adverse. Il peut éliminer les autres joueurs au contact et emprunter les trappes pour se déplacer discrètement."
  },
  {
    id:"empoisonneur", nom:"L'Empoisonneur", camp:"cultiste",
    desc:"Sa cible meurt 15 secondes plus tard, sans être prévenue.",
    detail:"L'Empoisonneur utilise un poison qui agit avec un délai. Sa victime ne reçoit aucune indication avant son élimination."
  },
  {
    id:"metamorphe", nom:"Le Métamorphe", camp:"cultiste",
    desc:"Copie la couleur et le pseudo d'un joueur proche pendant 10 secondes.",
    detail:"Le Métamorphe peut prendre temporairement l'apparence d'un autre joueur. Il peut ainsi semer la confusion parmi les innocents."
  },
  {
    id:"innocent", nom:"L'Innocent", camp:"invite", fixe:true,
    desc:"Fait ses missions, surveille les autres et signale les cadavres.",
    detail:"L'Innocent doit accomplir ses missions et rester attentif à ce qui se passe autour de lui. Il peut signaler les cadavres découverts."
  },
  {
    id:"detective", nom:"Le Détective", camp:"invite", info:true,
    desc:"Vision infrarouge : voit les empreintes de pas récentes.",
    detail:"Le Détective possède une capacité de vision infrarouge lui permettant de repérer les empreintes de pas récentes."
  },
  {
    id:"medium", nom:"Le Médium", camp:"invite", info:true,
    desc:"Reçoit un flash rouge à l'instant exact de chaque mort.",
    detail:"Le Médium reçoit un signal visuel au moment précis où un joueur est éliminé."
  },
  {
    id:"garde", nom:"Le Garde du corps", camp:"invite",
    desc:"Protège un joueur avec un bouclier de 20 secondes.",
    detail:"Le Garde du corps peut protéger un joueur grâce à un bouclier temporaire de 20 secondes."
  },
  {
    id:"veilleur", nom:"Le Veilleur", camp:"invite", info:true,
    desc:"Il peut changer le point de vue des caméras sur l'écran de l'hôte.",
    detail:"Le Veilleur peut modifier le point de vue des caméras affichées sur l'écran principal de l'hôte."
  },
  {
    id:"chasseur", nom:"Le Chasseur", camp:"invite",
    desc:"S'il est éliminé au vote, il peut tuer un joueur en 5 secondes.",
    detail:"Si le Chasseur est éliminé à l'issue d'un vote, il dispose de 5 secondes pour éliminer un autre joueur."
  },
  {
    id:"cartographe", nom:"Le Cartographe", camp:"invite", info:true,
    desc:"Révèle la position de tous les joueurs pendant 5 secondes.",
    detail:"Le Cartographe peut révéler temporairement la position de tous les joueurs pendant 5 secondes."
  },
  {
    id:"martyr", nom:"Le Martyr", camp:"invite",
    desc:"S'il est assassiné, il déclenche l'alarme et une réunion.",
    detail:"La mort du Martyr provoque automatiquement le déclenchement de l'alarme et une réunion."
  }
];

var MM_PARAMS = [
  {k:"vitesse", nom:"Vitesse de déplacement", min:2, max:8, pas:.5, def:4, unite:"cases/s", icon:"V"},
  {k:"rayonVision", nom:"Rayon de vision", min:3, max:8, pas:1, def:5, unite:"cases", icon:"V"},
  {k:"cooldownKill", nom:"Délai entre deux attaques", min:10, max:60, pas:5, def:25, unite:"secondes", icon:"A"},
  {k:"discussion", nom:"Durée de discussion", min:15, max:120, pas:15, def:45, unite:"secondes", icon:"D"},
  {k:"vote", nom:"Durée du vote", min:10, max:60, pas:5, def:20, unite:"secondes", icon:"V"},
  {k:"cloche", nom:"Cloches d'urgence par joueur", min:0, max:3, pas:1, def:1, unite:"", icon:"C"}
];

var MM_OPTIONS = [
  {k:"reveler", nom:"Révéler le camp d'un joueur éliminé", def:true}
];

/* ======================== MOTEUR ======================== */

(function(){

  var LS = "spity-manoir-cfg";
  var root, opts = {}, nb = 0;
  var onglet = "roles";
  var cfg;
  var selectedRole = "cultiste";

  function h(tag, cls, txt){
    var el = document.createElement(tag);
    if(cls) el.className = cls;
    if(txt !== undefined && txt !== null) el.textContent = txt;
    return el;
  }

  function copie(o){
    return JSON.parse(JSON.stringify(o));
  }

  function q(id){
    return root.querySelector("#"+id);
  }

  function defaut(){
    var c = {roles:{},params:{},options:{}};

    MM_ROLES.forEach(function(r){
      c.roles[r.id] = true;
    });

    MM_PARAMS.forEach(function(p){
      c.params[p.k] = p.def;
    });

    MM_OPTIONS.forEach(function(o){
      c.options[o.k] = o.def;
    });

    return c;
  }

  function charger(){
    var c = defaut();

    try{
      var v = JSON.parse(localStorage.getItem(LS));

      if(v && typeof v === "object"){
        MM_ROLES.forEach(function(r){
          if(v.roles && typeof v.roles[r.id] === "boolean"){
            c.roles[r.id] = v.roles[r.id];
          }
        });

        MM_PARAMS.forEach(function(p){
          var x = v.params && v.params[p.k];

          if(typeof x === "number" && x >= p.min && x <= p.max){
            c.params[p.k] = x;
          }
        });

        MM_OPTIONS.forEach(function(o){
          if(v.options && typeof v.options[o.k] === "boolean"){
            c.options[o.k] = v.options[o.k];
          }
        });
      }
    }catch(e){}

    return c;
  }

  function sauver(){
    try{
      localStorage.setItem(LS, JSON.stringify(cfg));
    }catch(e){}
  }

  function limites(n){
    var c = n <= 10 ? (n <= 6 ? 1 : 2) : (n === 11 ? 2 : 3);
    var i = n <= 6 ? 1 : (n <= 10 ? 2 : 3);

    return {
      cult:Math.min(c,Math.floor(n/2)),
      info:i
    };
  }

  function rolesActifs(){
    return MM_ROLES.filter(function(r){
      return r.fixe || cfg.roles[r.id];
    });
  }

  function nombreCultistes(){
    return rolesActifs().filter(function(r){
      return r.camp === "cultiste";
    }).length;
  }

  function nombreInfos(){
    return rolesActifs().filter(function(r){
      return r.info;
    }).length;
  }

  function aff(p,v){
    return String(v).replace(".",",") +
      (p.unite ? " "+p.unite : "");
  }

  function sortie(){
    return {
      roles:rolesActifs().map(function(r){return r.id;}),
      params:copie(cfg.params),
      options:copie(cfg.options)
    };
  }

  function toast(msg){
    var t = root.querySelector(".mm-toast");
    if(!t) return;

    t.textContent = msg;
    t.classList.add("visible");

    clearTimeout(toast.id);
    toast.id = setTimeout(function(){
      t.classList.remove("visible");
    },2500);
  }

  /* ========================= STYLE ========================= */

  function installerStyle(){

    if(document.getElementById("mm-jungle-style")) return;

    var st = document.createElement("style");
    st.id = "mm-jungle-style";

    st.textContent = `
    #mnMenu{
      padding:0;
      overflow-y:auto;
      background:#142c24;
    }

    .mmw{
      --wood:#754225;
      --wood-dark:#492819;
      --wood-light:#a66a3c;
      --leaf:#65a849;
      --leaf-dark:#34743d;
      --gold:#ffd36c;
      --purple:#9855d7;
      --ink:#38251b;

      position:relative;
      isolation:isolate;
      box-sizing:border-box;
      min-height:100%;
      width:100%;
      padding:25px clamp(12px,3vw,40px) 25px;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:18px;
      overflow:hidden;

      color:#fff9e9;
      font-family:inherit;

      background:
        radial-gradient(ellipse at 50% 0%,rgba(145,210,113,.25),transparent 50%),
        linear-gradient(135deg,#183c2b,#24583a 50%,#163629);
    }

    .mmw:before,.mmw:after{
      content:"";
      position:absolute;
      z-index:-1;
      pointer-events:none;
      width:240px;
      height:240px;
      border-radius:50%;
      filter:blur(55px);
      opacity:.22;
      background:#a7e66c;
    }

    .mmw:before{top:5%;left:-150px}
    .mmw:after{bottom:5%;right:-150px}

    .mm-back{
      position:absolute;
      top:20px;
      left:clamp(12px,3vw,35px);
      z-index:5;
      padding:11px 20px;
      border-radius:14px;
      border:2px solid #d59a56;
      color:#fff4dc;
      background:linear-gradient(#a86637,#704026);
      box-shadow:0 4px 0 #492817,0 7px 15px #0005;
      font-weight:800;
      cursor:pointer;
      transition:transform .2s,filter .2s;
    }

    .mm-back:hover{transform:translateY(-2px);filter:brightness(1.15)}
    .mm-back:active{transform:translateY(2px)}

    .mm-heading{
      width:min(100%,850px);
      text-align:center;
      padding-top:5px;
    }

    .mm-logo{
      display:inline-block;
      padding:10px 38px;
      border:4px solid #d49a53;
      border-radius:22px;
      background:linear-gradient(180deg,#a96737,#63371f);
      box-shadow:0 6px 0 #422517,0 12px 25px #0005;
      transform:rotate(-1deg);
    }

    .mm-title{
      margin:0;
      color:#ffdc81;
      font-size:clamp(2rem,5vw,3.8rem);
      line-height:1;
      font-weight:1000;
      letter-spacing:-.04em;
      text-shadow:0 3px 0 #79401e,0 6px 0 #422315,0 9px 15px #0008;
    }

    .mm-subtitle{
      margin:9px 0 0;
      color:#fff1d2;
      font-size:.95rem;
      font-weight:700;
    }

    .mm-tabs{
      display:flex;
      justify-content:center;
      gap:9px;
      width:min(100%,650px);
      flex-wrap:wrap;
    }

    .mm-tab{
      flex:1;
      min-width:125px;
      padding:13px 20px;
      border:2px solid #a76b43;
      border-radius:15px 15px 8px 8px;
      background:linear-gradient(#78462e,#502c20);
      box-shadow:0 4px 0 #321d16;
      color:#fff1df;
      font-size:1rem;
      font-weight:900;
      cursor:pointer;
      transition:.2s;
    }

    .mm-tab:hover{filter:brightness(1.2);transform:translateY(-2px)}

    .mm-tab.active{
      background:linear-gradient(#ffdf80,#f2a72c);
      color:#573216;
      border-color:#ffe8a6;
      box-shadow:0 4px 0 #a85e22,0 0 20px #ffc44d66;
    }

    .mm-panel{
      width:min(100%,1350px);
      box-sizing:border-box;
      padding:clamp(12px,2vw,25px);
      border:5px solid #a76b3e;
      border-radius:30px;
      background:
        linear-gradient(135deg,#754326ee,#4d2b1dee),
        #754326;
      box-shadow:
        inset 0 0 0 2px #d3975b,
        inset 0 0 35px #29180f88,
        0 9px 0 #321c12,
        0 15px 35px #0006;
    }

    .mm-section-title{
      margin:2px 0 14px;
      color:#ffe09a;
      font-size:1.35rem;
      font-weight:950;
      text-shadow:0 2px 4px #32190f;
    }

    .mm-hint{
      margin:-5px 0 16px;
      color:#f1d8b8;
      font-size:.9rem;
      line-height:1.5;
    }

    .mm-role-layout{
      display:grid;
      grid-template-columns:minmax(0,1fr) 265px;
      gap:18px;
      align-items:start;
    }

    .mm-role-groups{
      display:flex;
      flex-direction:column;
      gap:23px;
      min-width:0;
    }

    .mm-group-title{
      display:flex;
      align-items:center;
      gap:10px;
      margin:0 0 12px;
      color:#ffe0a2;
      font-size:1.1rem;
      font-weight:950;
    }

    .mm-group-title:after{
      content:"";
      height:2px;
      flex:1;
      background:linear-gradient(90deg,#d49a58aa,transparent);
    }

    .mm-role-grid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;
    }

    .mm-role{
      position:relative;
      min-width:0;
      min-height:190px;
      padding:0;
      overflow:hidden;
      border:3px solid #d4a36a;
      border-radius:18px;
      background:linear-gradient(150deg,#557f9d,#24455c);
      color:white;
      text-align:left;
      cursor:pointer;
      box-shadow:0 5px 0 #281c19,0 8px 15px #0003;
      transition:transform .2s,border-color .2s,filter .2s;
    }

    .mm-role.cultiste{
      background:linear-gradient(145deg,#b34b52,#612c39);
      border-color:#e48a79;
    }

    .mm-role.invite{
      background:linear-gradient(145deg,#488ba0,#254b6d);
      border-color:#76b9d1;
    }

    .mm-role:hover{
      transform:translateY(-4px);
      filter:brightness(1.12);
      z-index:2;
    }

    .mm-role.selected{
      border-color:#ffdb70;
      box-shadow:0 0 0 2px #ffc94a,0 0 20px #ffcf5c66,0 5px 0 #382215;
    }

    .mm-role.disabled{
      filter:grayscale(.55) brightness(.7);
      opacity:.75;
    }

    .mm-role-art{
      position:relative;
      display:flex;
      align-items:center;
      justify-content:center;
      height:100px;
      overflow:hidden;
      background:
        radial-gradient(ellipse at 50% 110%,#ffffff38,transparent 65%),
        linear-gradient(135deg,#ffffff22,transparent);
    }

    .mm-role-art:before{
      content:"";
      position:absolute;
      width:95px;
      height:95px;
      border-radius:50%;
      background:#ffffff19;
      box-shadow:0 0 35px #ffffff18;
    }

    .mm-role-symbol{
      position:relative;
      display:grid;
      place-items:center;
      width:65px;
      height:65px;
      border:3px solid #ffffff99;
      border-radius:50%;
      background:#211e2c77;
      color:#fff5d5;
      font-size:1.8rem;
      font-weight:1000;
      text-shadow:0 2px 5px #0008;
      box-shadow:0 4px 12px #0004;
    }

    .mm-check{
      position:absolute;
      top:8px;
      right:8px;
      display:grid;
      place-items:center;
      width:27px;
      height:27px;
      border-radius:50%;
      background:#ffffff35;
      border:2px solid #fff9;
      color:transparent;
      font-size:1rem;
      font-weight:1000;
      z-index:2;
    }

    .mm-role.selected .mm-check{
      background:#ffdc6b;
      border-color:#fff1a7;
      color:#573619;
    }

    .mm-role-content{
      padding:9px 10px 12px;
      background:#171b28aa;
      min-height:75px;
    }

    .mm-role-name{
      margin:0 0 5px;
      font-size:.98rem;
      font-weight:950;
      line-height:1.2;
    }

    .mm-role-desc{
      margin:0;
      font-size:.78rem;
      line-height:1.4;
      color:#fff4e8;
      font-weight:600;
    }

    .mm-role-fixed{
      display:inline-block;
      margin-top:7px;
      color:#ffe29a;
      font-size:.68rem;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.04em;
    }

    .mm-detail{
      position:sticky;
      top:15px;
      padding:17px;
      border:3px solid #e0b778;
      border-radius:20px;
      background:linear-gradient(155deg,#ffe4ad,#e8bd7e);
      color:#53351f;
      box-shadow:inset 0 0 0 2px #fff3cf,0 5px 0 #382016;
    }

    .mm-detail-label{
      display:inline-block;
      padding:5px 10px;
      border-radius:30px;
      background:#80512d;
      color:#fff0d3;
      font-size:.7rem;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.06em;
    }

    .mm-detail-symbol{
      display:grid;
      place-items:center;
      width:85px;
      height:85px;
      margin:14px auto;
      border:4px solid #fff4d2;
      border-radius:24px;
      background:linear-gradient(145deg,#bd7847,#744127);
      color:#fff0d1;
      font-size:2.5rem;
      font-weight:1000;
      box-shadow:0 4px 10px #68401f44;
    }

    .mm-detail h3{
      margin:0 0 10px;
      text-align:center;
      font-size:1.35rem;
      font-weight:1000;
    }

    .mm-detail p{
      font-size:.9rem;
      line-height:1.55;
      font-weight:650;
    }

    .mm-detail-status{
      margin-top:14px;
      padding:9px;
      border-radius:10px;
      background:#75492719;
      font-size:.8rem;
      font-weight:850;
      text-align:center;
    }

    .mm-summary{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      width:min(100%,1000px);
      box-sizing:border-box;
      padding:13px 18px;
      border:3px solid #d6a165;
      border-radius:19px;
      background:linear-gradient(120deg,#78452b,#48271e);
      box-shadow:0 5px 0 #321c13,0 8px 20px #0004;
    }

    .mm-summary-info{
      min-width:0;
    }

    .mm-summary-title{
      color:#ffdc8d;
      font-weight:950;
      font-size:1rem;
    }

    .mm-summary-text{
      margin-top:4px;
      color:#fff1dc;
      font-size:.83rem;
      line-height:1.45;
    }

    .mm-summary-numbers{
      color:#ffe19b;
      font-weight:900;
    }

    .mm-start{
      flex:none;
      padding:15px 30px;
      border:3px solid #d9a5ff;
      border-radius:18px;
      background:linear-gradient(180deg,#c078fa,#812dc4);
      color:white;
      font-size:1.1rem;
      font-weight:1000;
      cursor:pointer;
      box-shadow:0 5px 0 #51217e,0 8px 18px #0005;
      transition:.2s;
    }

    .mm-start:hover{
      transform:translateY(-3px);
      filter:brightness(1.13);
      box-shadow:0 8px 0 #51217e,0 12px 22px #0005;
    }

    .mm-start:active{transform:translateY(2px)}
    .mm-start:disabled{opacity:.45;filter:grayscale(1);cursor:not-allowed;transform:none}

    /* PARAMÈTRES */

    .mm-settings{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
    }

    .mm-setting{
      padding:17px;
      border:2px solid #bd8a58;
      border-radius:16px;
      background:#301f1c77;
    }

    .mm-setting-top{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      margin-bottom:13px;
    }

    .mm-setting-name{
      font-weight:900;
      font-size:.95rem;
    }

    .mm-setting-value{
      color:#ffdc87;
      font-weight:1000;
      white-space:nowrap;
    }

    .mm-range{
      width:100%;
      accent-color:#e7ad45;
      cursor:pointer;
    }

    .mm-range-labels{
      display:flex;
      justify-content:space-between;
      color:#e4c5a5;
      font-size:.7rem;
      margin-top:5px;
    }

    .mm-toggle-row{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      padding:17px;
      margin-top:13px;
      border:2px solid #bd8a58;
      border-radius:16px;
      background:#301f1c77;
    }

    .mm-toggle{
      position:relative;
      width:55px;
      height:30px;
      flex:none;
      border:0;
      border-radius:30px;
      background:#72584c;
      cursor:pointer;
      transition:.2s;
    }

    .mm-toggle:after{
      content:"";
      position:absolute;
      top:4px;
      left:4px;
      width:22px;
      height:22px;
      border-radius:50%;
      background:#fff3dc;
      transition:.2s;
    }

    .mm-toggle.on{background:#65ad66}
    .mm-toggle.on:after{left:29px}

    .mm-reset{
      display:block;
      margin:20px auto 0;
      padding:10px 18px;
      border:1px solid #d8aa7b;
      border-radius:12px;
      background:#ffffff12;
      color:#ffe8ca;
      font-weight:800;
      cursor:pointer;
    }

    .mm-reset:hover{background:#ffffff25}

    /* RÈGLES */

    .mm-rules{
      display:flex;
      flex-direction:column;
      gap:14px;
    }

    .mm-rule-card{
      padding:18px;
      border:2px solid #c18b56;
      border-radius:17px;
      background:linear-gradient(120deg,#573321aa,#321f1a99);
    }

    .mm-rule-card h3{
      margin:0 0 9px;
      color:#ffdc91;
      font-size:1.1rem;
    }

    .mm-rule-card p{
      margin:0;
      color:#fff0dd;
      font-size:.9rem;
      line-height:1.65;
    }

    .mm-rule-columns{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
    }

    .mm-rule-tag{
      display:inline-block;
      margin:3px 4px 3px 0;
      padding:5px 9px;
      border-radius:30px;
      background:#ffffff19;
      color:#ffe4ad;
      font-size:.76rem;
      font-weight:800;
    }

    .mm-toast{
      position:fixed;
      z-index:100;
      left:50%;
      bottom:25px;
      transform:translate(-50%,15px);
      opacity:0;
      pointer-events:none;
      padding:12px 20px;
      border:2px solid #e9bd7a;
      border-radius:14px;
      background:#40271c;
      color:#fff0d5;
      font-weight:850;
      box-shadow:0 5px 20px #0006;
      transition:.25s;
    }

    .mm-toast.visible{
      opacity:1;
      transform:translate(-50%,0);
    }

    .mmw button:focus-visible,
    .mmw input:focus-visible{
      outline:3px solid #fff0a5;
      outline-offset:3px;
    }

    @media(max-width:900px){
      .mm-role-layout{grid-template-columns:1fr}
      .mm-detail{position:relative;top:auto}
      .mm-detail-symbol{margin:10px auto}
    }

    @media(max-width:650px){
      .mmw{padding:75px 10px 20px;gap:14px}
      .mm-back{top:12px;left:10px;padding:8px 13px;font-size:.8rem}
      .mm-heading{padding-top:10px}
      .mm-logo{padding:9px 23px}
      .mm-subtitle{font-size:.8rem}
      .mm-tabs{gap:6px}
      .mm-tab{min-width:0;padding:11px 8px;font-size:.85rem}
      .mm-panel{padding:11px;border-width:3px;border-radius:20px}
      .mm-role-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .mm-role{min-height:180px}
      .mm-role-art{height:85px}
      .mm-role-content{padding:8px}
      .mm-role-name{font-size:.88rem}
      .mm-role-desc{font-size:.73rem}
      .mm-settings{grid-template-columns:1fr}
      .mm-rule-columns{grid-template-columns:1fr}
      .mm-summary{flex-direction:column;align-items:stretch}
      .mm-start{width:100%;padding:14px}
    }

    @media(prefers-reduced-motion:reduce){
      .mmw *{transition:none!important;animation:none!important}
    }
    `;

    document.head.appendChild(st);
  }

  /* ========================= EN-TÊTE ========================= */

  function dessinerEntete(){
    var heading = h("div","mm-heading");

    var logo = h("div","mm-logo");
    logo.appendChild(h("h1","mm-title",MM_TITRE));
    logo.appendChild(h("p","mm-subtitle","Préparez votre aventure dans la jungle !"));

    heading.appendChild(logo);
    return heading;
  }

  function dessinerOnglets(){
    var tabs = h("div","mm-tabs");

    [
      {id:"roles",nom:"Rôles"},
      {id:"params",nom:"Paramètres"},
      {id:"regles",nom:"Règles"}
    ].forEach(function(t){
      var b = h("button","mm-tab"+(onglet===t.id?" active":""),t.nom);
      b.type = "button";
      b.setAttribute("aria-pressed",onglet===t.id?"true":"false");

      b.onclick = function(){
        onglet = t.id;
        dessiner();
      };

      tabs.appendChild(b);
    });

    return tabs;
  }

  /* ===================== PANNEAU DES RÔLES ===================== */

  function carteRole(r){
    var on = r.fixe || cfg.roles[r.id];

    var b = h(
      "button",
      "mm-role "+r.camp+
      (on?" selected":" disabled")+
      (selectedRole===r.id?" focused":"")
    );

    b.type = "button";
    b.setAttribute("aria-pressed",on?"true":"false");

    var check = h("span","mm-check",on?"✓":"");
    b.appendChild(check);

    var art = h("div","mm-role-art");
    art.appendChild(h("div","mm-role-symbol",r.nom.charAt(4) || r.nom.charAt(0)));
    b.appendChild(art);

    var content = h("div","mm-role-content");
    content.appendChild(h("div","mm-role-name",r.nom));
    content.appendChild(h("p","mm-role-desc",r.desc));

    if(r.fixe){
      content.appendChild(h("span","mm-role-fixed","Toujours présent"));
    }else if(r.info){
      content.appendChild(h("span","mm-role-fixed","Rôle d'information"));
    }

    b.appendChild(content);

    b.onclick = function(){
      selectedRole = r.id;

      if(!r.fixe){
        cfg.roles[r.id] = !cfg.roles[r.id];
        sauver();
      }

      dessiner();
    };

    return b;
  }

  function groupeRoles(titre,camp){
    var group = h("section","mm-role-group");
    group.appendChild(h("h3","mm-group-title",titre));

    var grid = h("div","mm-role-grid");

    MM_ROLES.filter(function(r){
      return r.camp===camp;
    }).forEach(function(r){
      grid.appendChild(carteRole(r));
    });

    group.appendChild(grid);
    return group;
  }

  function panneauDetail(){
    var r = MM_ROLES.find(function(x){
      return x.id===selectedRole;
    }) || MM_ROLES[0];

    var box = h("aside","mm-detail");

    box.appendChild(h("span","mm-detail-label",
      r.camp==="cultiste"?"Camp cultiste":"Camp des invités"
    ));

    box.appendChild(h("div","mm-detail-symbol",r.nom.charAt(4) || r.nom.charAt(0)));
    box.appendChild(h("h3","",r.nom));
    box.appendChild(h("p","",r.detail || r.desc));

    var on = r.fixe || cfg.roles[r.id];

    box.appendChild(h(
      "div",
      "mm-detail-status",
      r.fixe ? "Rôle obligatoire" : (on?"Rôle activé":"Rôle désactivé")
    ));

    return box;
  }

  function panneauRoles(){
    var layout = h("div","mm-role-layout");
    var groups = h("div","mm-role-groups");

    groups.appendChild(h("h2","mm-section-title","Choisissez vos personnages"));
    groups.appendChild(h("p","mm-hint",
      "Sélectionnez les rôles qui pourront apparaître pendant la partie. Cliquez sur une carte pour l'activer ou la désactiver et consulter ses informations."
    ));

    groups.appendChild(groupeRoles("Camp des cultistes","cultiste"));
    groups.appendChild(groupeRoles("Camp des invités","invite"));

    layout.appendChild(groups);
    layout.appendChild(panneauDetail());

    return layout;
  }

  /* ====================== PARAMÈTRES ====================== */

  function panneauParams(){
    var box = h("div","");

    box.appendChild(h("h2","mm-section-title","Personnalisez votre partie"));
    box.appendChild(h("p","mm-hint",
      "Ajustez les règles de fonctionnement pour adapter la difficulté et le rythme de votre partie."
    ));

    var grid = h("div","mm-settings");

    MM_PARAMS.forEach(function(p){
      var v = cfg.params[p.k];
      var card = h("div","mm-setting");

      var top = h("div","mm-setting-top");
      top.appendChild(h("div","mm-setting-name",p.nom));

      var value = h("div","mm-setting-value",aff(p,v));
      top.appendChild(value);

      card.appendChild(top);

      var slider = h("input","mm-range");
      slider.type = "range";
      slider.min = p.min;
      slider.max = p.max;
      slider.step = p.pas;
      slider.value = v;
      slider.setAttribute("aria-label",p.nom);

      slider.oninput = function(){
        var x = Number(slider.value);
        cfg.params[p.k] = x;
        value.textContent = aff(p,x);
        sauver();
      };

      card.appendChild(slider);

      var labels = h("div","mm-range-labels");
      labels.appendChild(h("span","",aff(p,p.min)));
      labels.appendChild(h("span","",aff(p,p.max)));
      card.appendChild(labels);

      grid.appendChild(card);
    });

    box.appendChild(grid);

    MM_OPTIONS.forEach(function(o){
      var row = h("div","mm-toggle-row");
      row.appendChild(h("div","mm-setting-name",o.nom));

      var toggle = h("button","mm-toggle"+(cfg.options[o.k]?" on":""));
      toggle.type = "button";
      toggle.setAttribute("aria-label",o.nom);
      toggle.setAttribute("aria-pressed",cfg.options[o.k]?"true":"false");

      toggle.onclick = function(){
        cfg.options[o.k] = !cfg.options[o.k];
        sauver();
        dessiner();
      };

      row.appendChild(toggle);
      box.appendChild(row);
    });

    var reset = h("button","mm-reset","Réinitialiser les paramètres");
    reset.type = "button";

    reset.onclick = function(){
      var d = defaut();
      cfg.params = d.params;
      cfg.options = d.options;
      sauver();
      dessiner();
      toast("Paramètres réinitialisés");
    };

    box.appendChild(reset);

    return box;
  }

  /* ========================== RÈGLES ========================== */

  function regle(titre,texte){
    var card = h("article","mm-rule-card");
    card.appendChild(h("h3","",titre));
    card.appendChild(h("p","",texte));
    return card;
  }

  function panneauRegles(){
    var box = h("div","mm-rules");

    box.appendChild(h("h2","mm-section-title","Guide de l'aventurier"));
    box.appendChild(h("p","mm-hint",
      "Retrouvez ici les informations essentielles pour comprendre les mécaniques de Caméléon."
    ));

    box.appendChild(regle(
      "01 — Le principe du jeu",
      "Deux camps s'affrontent : les cultistes et les invités. Les invités accomplissent leurs missions, surveillent les autres joueurs et signalent les cadavres. Les cultistes cherchent à éliminer les autres joueurs tout en utilisant les possibilités de déplacement offertes par les trappes."
    ));

    var cols = h("div","mm-rule-columns");

    cols.appendChild(regle(
      "02 — Le camp des cultistes",
      "Les cultistes peuvent attaquer au contact et utiliser les trappes. Certains rôles possèdent des capacités supplémentaires : poison ou transformation."
    ));

    cols.appendChild(regle(
      "03 — Le camp des invités",
      "Les invités doivent rester vigilants. Certains rôles peuvent détecter des traces, protéger un joueur, surveiller les caméras ou révéler temporairement les positions."
    ));

    box.appendChild(cols);

    box.appendChild(regle(
      "04 — Les réunions et les votes",
      "Une réunion permet aux joueurs de discuter d'une situation et de voter. La durée de discussion et la durée du vote sont réglables dans l'onglet Paramètres. Le Martyr peut également déclencher une réunion lorsqu'il est assassiné."
    ));

    box.appendChild(regle(
      "05 — Les rôles spéciaux",
      "Chaque personnage dispose d'une capacité particulière lorsqu'elle est indiquée dans sa description. Consultez l'onglet Rôles pour connaître précisément les effets, les durées et les conditions propres à chaque personnage."
    ));

    box.appendChild(regle(
      "06 — Les paramètres de partie",
      "L'hôte peut personnaliser la vitesse de déplacement, le rayon de vision, le délai entre deux attaques, les durées de discussion et de vote, les cloches d'urgence ainsi que la révélation du camp d'un joueur éliminé."
    ));

    box.appendChild(regle(
      "À savoir",
      "Ce guide décrit les mécaniques présentes dans la configuration du jeu. Les conditions exactes de victoire, les détails des missions et les règles complémentaires doivent être définis dans les règles officielles de la partie."
    ));

    return box;
  }

  /* ====================== BARRE INFÉRIEURE ====================== */

  function panneauResume(){
    var box = h("div","mm-summary");
    var info = h("div","mm-summary-info");

    info.appendChild(h("div","mm-summary-title","Résumé de la configuration"));

    var txt;

    if(nb>0){
      var l = limites(nb);
      txt = nb+" joueurs dans le salon · "+
        nombreCultistes()+" cultiste(s) activé(s) · "+
        nombreInfos()+" rôle(s) d'information activé(s) · "+
        "maximum "+l.info+" rôle(s) d'information";
    }else{
      txt = "En attente des joueurs · Configurez votre partie avant de commencer.";
    }

    info.appendChild(h("div","mm-summary-text",txt));
    box.appendChild(info);

    var go = h("button","mm-start","Commencer la partie");
    go.id = "mmGo";
    go.type = "button";
    go.disabled = nb>0 && nb<(window.MN_MIN_JOUEURS||4);
    go.onclick = demarrer;

    box.appendChild(go);

    return box;
  }

  /* ======================= VALIDATION ======================= */

  function demarrer(){
    var min = window.MN_MIN_JOUEURS || 4;

    if(nb>0 && nb<min){
      return toast("Il faut au moins "+min+" joueurs pour commencer.");
    }

    if(nb>0){
      var l = limites(nb);

      if(nombreCultistes()>l.cult){
        return toast("Trop de cultistes pour ce nombre de joueurs.");
      }

      if(nombreInfos()>l.info){
        return toast("Trop de rôles d'information sélectionnés.");
      }
    }

    if(opts.demarrer){
      opts.demarrer(sortie());
    }else{
      toast("Le lancement sera disponible à l'étape suivante.");
    }
  }

  /* ========================= AFFICHAGE ========================= */

  function dessiner(){
    if(!root) return;

    var scroll = root.scrollTop;
    var content = q("mmContent");

    content.innerHTML = "";

    var panel = h("div","mm-panel");

    if(onglet==="roles"){
      panel.appendChild(panneauRoles());
    }else if(onglet==="params"){
      panel.appendChild(panneauParams());
    }else{
      panel.appendChild(panneauRegles());
    }

    content.appendChild(panel);

    var old = root.querySelector(".mm-summary");
    if(old) old.remove();

    root.appendChild(panneauResume());

    root.scrollTop = scroll;
  }

  /* ======================== INITIALISATION ======================== */

  function init(r,o){
    root = r;
    opts = o || {};
    cfg = charger();

    installerStyle();

    if(!MM_ROLES.some(function(x){return x.id===selectedRole;})){
      selectedRole = MM_ROLES[0].id;
    }

    root.innerHTML = "";

    var wrap = h("div","mmw");

    var back = h("button","mm-back","Retour");
    back.type = "button";
    back.onclick = function(){
      if(opts.retour) opts.retour();
    };

    wrap.appendChild(back);
    wrap.appendChild(dessinerEntete());
    wrap.appendChild(dessinerOnglets());

    var content = h("div","");
    content.id = "mmContent";
    wrap.appendChild(content);

    var toastBox = h("div","mm-toast");
    toastBox.className = "mm-toast";
    toastBox.setAttribute("role","status");
    toastBox.setAttribute("aria-live","polite");
    wrap.appendChild(toastBox);

    root.appendChild(wrap);

    dessiner();
  }

  /* ======================== SALON ======================== */

  function joueurs(l){
    nb = l ? l.length : 0;
    if(root) dessiner();
  }

  /* ======================== API PUBLIQUE ======================== */

  window.ManoirMenu = {
    init:init,
    joueurs:joueurs,
    config:function(){
      return sortie();
    }
  };

})();
