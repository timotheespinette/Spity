/* ===== spity-bzzz-mots.js : les questions de Bzzz (bibliothèques, ajouter, générer avec l'IA, tout voir) =====
   Deux types de questions :
   - "qr"  (Buzzer et Chacun son tour) : une question + une réponse
   - "qcm" (Choix multiples)           : une question + 2 à 6 propositions, une ou plusieurs bonnes réponses */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Les 3 images (PNG, dossier "jeux" sur GitHub), en haut des 3 cartes :
   ajouter / générer / voir. Laisse "" pour ne rien afficher. */
var BZM_IMG = ["jeux/abeille.png", "jeux/ecureil.png", "jeux/ours.png"];

/* Clé Gemini : la même que celle des mots d'UnderSea (Mots.cle("ta clé")).
   Tu peux aussi la coller ici en attendant (mais ne la publie pas sur GitHub). */
var BZM_CLE_GEMINI = "";

/* Nom du modèle Gemini : à vérifier dans la doc de Google si la génération échoue. */
var BZM_MODELE = "gemini-3.6-flash";

/* Suggestions de thèmes pour la génération */
var BZM_THEMES = ["Animaux","Cinéma","Géographie","Histoire","Sport","Musique","Nature","Cuisine"];

/* Nombre de propositions en choix multiples */
var BZM_PROP_MIN = 2;
var BZM_PROP_MAX = 6;
var BZM_PROP_DEFAUT = 4;

/* Bibliothèque de base « Buzzer / Tour » : [question, réponse] */
var BZM_BASE_QR = [
  ["Quelle est la capitale de l’Australie ?","Canberra"],
  ["Quel est le plus grand océan du monde ?","L’océan Pacifique"],
  ["Qui a peint la Joconde ?","Léonard de Vinci"],
  ["Quel est le symbole chimique de l’or ?","Au"],
  ["Dans quel pays se trouve le Machu Picchu ?","Le Pérou"],
  ["Quelle est la planète la plus proche du Soleil ?","Mercure"],
  ["Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?","11"],
  ["Quel est le plus long fleuve de France ?","La Loire"],
  ["Qui a écrit « Les Misérables » ?","Victor Hugo"],
  ["En quelle année l’homme a-t-il marché sur la Lune pour la première fois ?","1969"],
  ["Quelle est la capitale de la Belgique ?","Bruxelles"],
  ["Quel est le plus haut sommet du monde ?","L’Everest"],
  ["Combien de côtés a un hexagone ?","6"],
  ["Quel gaz les plantes absorbent-elles pour faire la photosynthèse ?","Le dioxyde de carbone"],
  ["Quelle est la monnaie du Japon ?","Le yen"],
  ["Quel roi de France était surnommé « le Roi-Soleil » ?","Louis XIV"],
  ["Quel est l’os le plus long du corps humain ?","Le fémur"],
  ["Dans quel pays se trouve la tour de Pise ?","L’Italie"],
  ["Quelle langue parle-t-on au Brésil ?","Le portugais"],
  ["Quel est le plus grand mammifère terrestre ?","L’éléphant"]
];

/* Bibliothèque de base « Choix multiples » : [question, [propositions], [numéros des bonnes réponses, à partir de 0]] */
var BZM_BASE_QCM = [
  ["Quelles planètes sont des géantes gazeuses ?",["Jupiter","Mars","Saturne","Vénus"],[0,2]],
  ["Quels pays ont une frontière avec la France ?",["Espagne","Portugal","Italie","Suisse"],[0,2,3]],
  ["Quelle est la capitale du Canada ?",["Toronto","Ottawa","Montréal","Vancouver"],[1]],
  ["Quels animaux sont des mammifères ?",["Dauphin","Requin","Chauve-souris","Pingouin"],[0,2]],
  ["Quelles couleurs trouve-t-on dans le drapeau français ?",["Bleu","Vert","Blanc","Rouge"],[0,2,3]],
  ["Qui a peint « La Nuit étoilée » ?",["Van Gogh","Monet","Picasso","Dalí"],[0]],
  ["Quels éléments sont des gaz à température ambiante ?",["Oxygène","Fer","Hélium","Mercure"],[0,2]],
  ["Combien font 7 × 8 ?",["54","56","58","64"],[1]],
  ["Quels pays se trouvent en Afrique ?",["Kenya","Pérou","Maroc","Vietnam"],[0,2]],
  ["Quels instruments ont des cordes ?",["Violon","Trompette","Harpe","Flûte"],[0,2]],
  ["Quelle est la plus grande planète du système solaire ?",["Saturne","Jupiter","Neptune","Terre"],[1]],
  ["Quels sports se jouent avec une raquette ?",["Tennis","Badminton","Rugby","Squash"],[0,1,3]],
  ["En quelle année a commencé la Révolution française ?",["1789","1799","1815","1769"],[0]],
  ["Quels animaux pondent des œufs ?",["Poule","Chat","Crocodile","Chien"],[0,2]],
  ["Quel est le plus petit nombre premier ?",["0","1","2","3"],[2]]
];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var LS_BIB = "spity-bzzz-biblios", LS_CHOIX = "spity-bzzz-choix";
var root, opts = {}, type = "qr", ouvert = false, occupe = false;
var nGen = 5, genProp = BZM_PROP_DEFAUT, genMulti = true, form;

var BASE = [
  {id:"base-qr",  nom:"Culture générale", type:"qr",  base:true,
   items:BZM_BASE_QR.map(function(p){return{q:p[0],r:p[1]}})},
  {id:"base-qcm", nom:"Culture générale", type:"qcm", base:true,
   items:BZM_BASE_QCM.map(function(p){return{q:p[0],choix:p[1],bonnes:p[2]}})}
];
var biblios = lireLS(LS_BIB, []).filter(function(b){
  return b && b.id && b.nom && (b.type==="qr"||b.type==="qcm") && Array.isArray(b.items)});
var choix = lireLS(LS_CHOIX, {});

/* ----- Outils ----- */
function lireLS(k,def){
  try{
    var v=JSON.parse(localStorage.getItem(k));
    var ok=Array.isArray(def)?Array.isArray(v):(v&&typeof v==="object"&&!Array.isArray(v));
    return ok?v:def
  }catch(e){return def}}
function ecrireLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function sauver(){ecrireLS(LS_BIB,biblios)}
function sauverChoix(){ecrireLS(LS_CHOIX,choix)}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function q(i){return root.querySelector("#"+i)}
function bouton(txt,cls,fn){var b=h("button","btn "+(cls||""),txt);b.type="button";b.onclick=fn;return b}
function say(n,t,bad){var m=q("bmM"+n);m.textContent=t||"";m.classList.toggle("bad",!!bad)}
function copie(o){return JSON.parse(JSON.stringify(o))}
function idUnique(){return "u"+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36)}

function cle(){
  if(BZM_CLE_GEMINI)return BZM_CLE_GEMINI;
  if(window.Mots&&Mots.cle){var k=Mots.cle();if(k)return k}
  try{return localStorage.getItem("spity-gemini-cle")||""}catch(e){return""}}

function razForm(n){
  n=n||BZM_PROP_DEFAUT;
  var c=[],b=[];
  for(var i=0;i<n;i++){c.push("");b.push(false)}
  return{q:"",r:"",choix:c,bonnes:b,edit:-1}}
form = razForm();

/* ----- Bibliothèques ----- */
function tous(){return BASE.concat(biblios)}
function deType(t){return tous().filter(function(b){return b.type===t})}
function courantePour(t){
  var l=deType(t),id=choix[t];
  for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];
  return l[0]}
function courante(){return courantePour(type)}
function nomLibre(nom,t,sauf){
  return deType(t).every(function(b){return b.id===sauf||norm(b.nom)!==norm(nom)})}

function creer(nom,items,t){
  var b={id:idUnique(),nom:nom,type:t,items:items};
  biblios.push(b);choix[t]=b.id;sauver();sauverChoix();return b}

function actionNouvelle(){
  var n=prompt("Nom de la nouvelle bibliothèque ?");
  if(n==null)return;
  n=n.trim().slice(0,30);
  if(!n)return say(0,"Donne un nom à la bibliothèque.",true);
  if(!nomLibre(n,type))return say(0,"Une bibliothèque porte déjà ce nom.",true);
  creer(n,[],type);form=razForm(form.choix.length);say(0,"Bibliothèque « "+n+" » créée ✓");maj()}

function actionRenommer(){
  var b=courante();if(b.base)return;
  var n=prompt("Nouveau nom ?",b.nom);
  if(n==null)return;
  n=n.trim().slice(0,30);
  if(!n)return say(0,"Donne un nom à la bibliothèque.",true);
  if(!nomLibre(n,type,b.id))return say(0,"Une bibliothèque porte déjà ce nom.",true);
  b.nom=n;sauver();say(0,"Renommée ✓");maj()}

function actionDupliquer(){
  var b=courante();
  var n=prompt("Nom de la copie ?",(b.nom+" (copie)").slice(0,30));
  if(n==null)return;
  n=n.trim().slice(0,30);
  if(!n)return say(0,"Donne un nom à la bibliothèque.",true);
  if(!nomLibre(n,type))return say(0,"Une bibliothèque porte déjà ce nom.",true);
  creer(n,copie(b.items),type);form=razForm(form.choix.length);say(0,"Copie « "+n+" » créée ✓");maj()}

function actionSupprimer(){
  var b=courante();if(b.base)return;
  if(!confirm("Supprimer la bibliothèque « "+b.nom+" » et ses "+b.items.length+" questions ?"))return;
  biblios=biblios.filter(function(x){return x!==b});
  delete choix[type];sauver();sauverChoix();
  form=razForm(form.choix.length);say(0,"Bibliothèque supprimée.");maj()}

/* ----- Formulaire d'ajout / de modification ----- */
function champ(lab,val,max,fn){
  var l=h("label","bmlab",lab),i=h("input","in");
  i.maxLength=max;i.value=val;i.autocomplete="off";
  i.oninput=function(){fn(i.value)};
  i.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();soumettre()}};
  l.appendChild(i);return l}

function compteur(val,min,max,fn,suffixe){
  var d=h("div","bmgen"),m=h("button","bmp","−"),p=h("button","bmp","+");
  m.type=p.type="button";
  m.setAttribute("aria-label","Moins");p.setAttribute("aria-label","Plus");
  m.disabled=val<=min;p.disabled=val>=max;
  m.onclick=function(){fn(val-1)};p.onclick=function(){fn(val+1)};
  d.appendChild(m);d.appendChild(h("span","bmn",val));d.appendChild(p);
  if(suffixe)d.appendChild(h("span","bmsuf",suffixe));
  return d}

function setN(n){
  n=Math.max(BZM_PROP_MIN,Math.min(BZM_PROP_MAX,n));
  while(form.choix.length<n){form.choix.push("");form.bonnes.push(false)}
  while(form.choix.length>n){form.choix.pop();form.bonnes.pop()}
  dessinerForm()}

function dessinerForm(){
  var f=q("bmForm"),b=courante();f.innerHTML="";
  if(b.base){
    f.appendChild(h("div","bmnote","Cette bibliothèque est en lecture seule. Duplique-la pour pouvoir ajouter ou modifier des questions."));
    f.appendChild(bouton("Dupliquer","sun",actionDupliquer));
    return}
  f.appendChild(champ("Question",form.q,140,function(v){form.q=v}));
  if(b.type==="qr")f.appendChild(champ("Réponse",form.r,60,function(v){form.r=v}));
  else{
    f.appendChild(h("div","bmlab","Propositions (touche ✓ pour les bonnes réponses)"));
    f.appendChild(compteur(form.choix.length,BZM_PROP_MIN,BZM_PROP_MAX,setN,"propositions"));
    form.choix.forEach(function(c,k){
      var row=h("div","bmprop"),inp=h("input","in");
      inp.maxLength=40;inp.value=c;inp.autocomplete="off";
      inp.placeholder="Proposition "+(k+1);inp.setAttribute("aria-label","Proposition "+(k+1));
      inp.oninput=function(){form.choix[k]=inp.value};
      inp.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();soumettre()}};
      var ok=h("button","bmok"+(form.bonnes[k]?" on":""),"✓");
      ok.type="button";ok.setAttribute("aria-label","Bonne réponse : proposition "+(k+1));
      ok.setAttribute("aria-pressed",form.bonnes[k]);
      ok.onclick=function(){
        form.bonnes[k]=!form.bonnes[k];
        ok.classList.toggle("on",form.bonnes[k]);ok.setAttribute("aria-pressed",form.bonnes[k])};
      row.appendChild(inp);row.appendChild(ok);f.appendChild(row)})}
  var bt=h("div","bmbt");
  bt.appendChild(bouton(form.edit>=0?"Enregistrer":"Ajouter","sun",soumettre));
  if(form.edit>=0)bt.appendChild(bouton("Annuler","",function(){
    form=razForm(form.choix.length);say(1,"");dessinerForm()}));
  f.appendChild(bt)}

function soumettre(){
  var b=courante();if(b.base)return;
  var it,k,qq=form.q.trim().slice(0,140);
  if(!qq)return say(1,"Écris la question.",true);
  if(b.type==="qr"){
    var rr=form.r.trim().slice(0,60);
    if(!rr)return say(1,"Écris la réponse.",true);
    it={q:qq,r:rr}}
  else{
    var cs=form.choix.map(function(x){return x.trim().slice(0,40)}),bo=[],vus={};
    for(k=0;k<cs.length;k++){
      if(!cs[k])return say(1,"Remplis les "+cs.length+" propositions.",true);
      if(vus[norm(cs[k])])return say(1,"Deux propositions sont identiques.",true);
      vus[norm(cs[k])]=1;
      if(form.bonnes[k])bo.push(k)}
    if(!bo.length)return say(1,"Coche au moins une bonne réponse (✓).",true);
    if(bo.length===cs.length)return say(1,"Il faut au moins une mauvaise proposition.",true);
    it={q:qq,choix:cs,bonnes:bo}}
  var nq=norm(qq);
  for(k=0;k<b.items.length;k++)
    if(k!==form.edit&&norm(b.items[k].q)===nq)return say(1,"Cette question existe déjà.",true);
  var modif=form.edit>=0;
  if(modif)b.items[form.edit]=it;else b.items.push(it);
  sauver();form=razForm(form.choix.length);
  say(1,modif?"Question modifiée ✓":"Question ajoutée ✓");
  maj()}

/* ----- Génération avec Gemini ----- */
function nettoyer(x,t,nProp,multi){
  if(!x||typeof x!=="object")return null;
  var qq=String(x.q||"").trim().slice(0,140);
  if(!norm(qq))return null;
  if(t==="qr"){
    var rr=String(x.r||"").trim().slice(0,60);
    return norm(rr)?{q:qq,r:rr}:null}
  if(!Array.isArray(x.choix)||x.choix.length!==nProp||!Array.isArray(x.bonnes))return null;
  var cs=x.choix.map(function(c){return String(c).trim().slice(0,40)}),vus={},bo=[],i;
  for(i=0;i<cs.length;i++){
    if(!norm(cs[i])||vus[norm(cs[i])])return null;
    vus[norm(cs[i])]=1}
  x.bonnes.forEach(function(k){
    k=Number(k);
    if(k>=0&&k<cs.length&&k%1===0&&bo.indexOf(k)<0)bo.push(k)});
  if(!bo.length||bo.length>=cs.length)return null;
  if(!multi&&bo.length!==1)return null;
  bo.sort(function(a,b){return a-b});
  return{q:qq,choix:cs,bonnes:bo}}

/* Renvoie une promesse : la liste des nouvelles questions (sans doublons) */
function generer(theme,n,b,t,nProp,multi){
  var vus={},neufs=[],essais=0;
  b.items.forEach(function(it){vus[norm(it.q)]=1});
  function tour(){
    var reste=n-neufs.length;
    if(reste<=0||essais>=3)return Promise.resolve(neufs);
    essais++;
    var deja=b.items.concat(neufs).slice(-60).map(function(it){return it.q}).join(" | ");
    var prompt="Tu crées des questions de quiz en français sur le thème « "+theme+" ». Donne exactement "+reste+" questions, accessibles à tout le monde, de difficulté variée. ";
    if(t==="qr")
      prompt+="Chaque question a UNE réponse courte et sans ambiguïté (un à trois mots au maximum). "+
        "N’utilise aucune de ces questions : "+deja+". "+
        "Réponds uniquement par un tableau JSON, par exemple [{\"q\":\"Quelle est la capitale de la Belgique ?\",\"r\":\"Bruxelles\"}].";
    else
      prompt+="Chaque question propose exactement "+nProp+" propositions courtes (quelques mots), "+
        (multi?"avec une ou plusieurs bonnes réponses (jamais toutes les propositions). ":"avec exactement UNE bonne réponse. ")+
        "Varie la position des bonnes réponses. N’utilise aucune de ces questions : "+deja+". "+
        "Réponds uniquement par un tableau JSON, par exemple (pour 4 propositions) "+
        "[{\"q\":\"Quels animaux sont des mammifères ?\",\"choix\":[\"Dauphin\",\"Requin\",\"Chauve-souris\",\"Pingouin\"],\"bonnes\":[0,2]}] "+
        "où bonnes contient les numéros (à partir de 0) des bonnes propositions.";
    var url="https://generativelanguage.googleapis.com/v1beta/models/"+BZM_MODELE+":generateContent?key="+encodeURIComponent(cle());
    return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:1}})})
      .then(function(r){if(!r.ok)throw new Error("erreur "+r.status);return r.json()})
      .then(function(d){
        var txt=d.candidates[0].content.parts[0].text.replace(/```json|```/g,"").trim(),arr=JSON.parse(txt);
        if(!Array.isArray(arr))throw new Error("réponse inattendue");
        arr.forEach(function(x){
          if(neufs.length>=n)return;
          var it=nettoyer(x,t,nProp,multi);
          if(!it||vus[norm(it.q)])return;
          vus[norm(it.q)]=1;neufs.push(it)});
        return tour()})}
  return tour()}

function lancerGeneration(){
  if(occupe)return;
  var theme=q("bmTheme").value.trim().slice(0,60);
  if(!theme)return say(2,"Choisis un thème.",true);
  if(!cle())return say(2,"Ajoute d’abord ta clé Gemini dans les paramètres.",true);
  var btn=q("bmGenGo"),b=courante(),t=type,nProp=genProp,multi=genMulti;
  occupe=true;btn.disabled=true;btn.textContent="Génération…";say(2,"");
  generer(theme,nGen,b,t,nProp,multi)
    .then(function(neufs){
      if(!neufs.length)return say(2,"Aucune nouvelle question trouvée, réessaie.",true);
      var cible=b;
      if(b.base){                       /* bibliothèque de base : on crée une nouvelle bibliothèque */
        var nom=(theme.charAt(0).toUpperCase()+theme.slice(1)).slice(0,26),n0=nom,k=2;
        while(!nomLibre(nom,t)){nom=n0+" ("+k+")";k++}
        cible=creer(nom,[],t)}
      neufs.forEach(function(it){cible.items.push(it)});
      sauver();
      say(2,neufs.length+(neufs.length>1?" questions ajoutées":" question ajoutée")+" à « "+cible.nom+" » ✓");
      maj()})
    .catch(function(e){say(2,"La génération a échoué ("+(e&&e.message||"erreur")+"). Vérifie la clé et la connexion.",true)})
    .then(function(){occupe=false;btn.disabled=false;btn.textContent="Générer"})}

function dessinerGen(){
  var b=courante(),o=q("bmGenOpt");o.innerHTML="";
  if(type==="qcm"){
    o.appendChild(compteur(genProp,BZM_PROP_MIN,BZM_PROP_MAX,function(v){genProp=v;dessinerGen()},"propositions"));
    var mu=bouton("Plusieurs bonnes réponses : "+(genMulti?"oui":"non"),genMulti?"sun":"",function(){genMulti=!genMulti;dessinerGen()});
    mu.classList.add("bmsm");o.appendChild(mu)}
  q("bmGenInfo").textContent=b.base?
    "Une nouvelle bibliothèque sera créée à partir du thème.":
    "Les questions seront ajoutées à « "+b.nom+" ».";
  q("bmN").textContent=nGen;
  q("bmMoins").disabled=nGen<=1;
  q("bmPlus").disabled=nGen>=20}

/* ----- Liste de toutes les questions ----- */
function liste(){
  var b=courante(),l=q("bmList");l.innerHTML="";
  q("bmTogT").textContent=(ouvert?"Masquer les questions":"Voir toutes les questions")+" ("+b.items.length+")";
  l.hidden=!ouvert;
  if(!b.items.length)l.appendChild(h("div","bmvide","Cette bibliothèque est vide."));
  b.items.forEach(function(it,i){
    var r=h("div","bmli");
    r.appendChild(h("div","bmlq",it.q));
    if(b.type==="qr")r.appendChild(h("div","bmlr","→ "+it.r));
    else{
      var c=h("div","bmlc");
      it.choix.forEach(function(x,k){
        var bon=it.bonnes.indexOf(k)>=0;
        c.appendChild(h("span","bmch"+(bon?" ok":""),(bon?"✓ ":"")+x))});
      r.appendChild(c)}
    if(!b.base){
      var act=h("div","bmla"),e=h("button","bmx","✎"),x=h("button","bmx","✕");
      e.type=x.type="button";
      e.setAttribute("aria-label","Modifier cette question");x.setAttribute("aria-label","Supprimer cette question");
      e.onclick=function(){
        form=b.type==="qr"?
          {q:it.q,r:it.r,choix:razForm().choix,bonnes:razForm().bonnes,edit:i}:
          {q:it.q,r:"",choix:it.choix.slice(),bonnes:it.choix.map(function(_,k){return it.bonnes.indexOf(k)>=0}),edit:i};
        say(1,"");dessinerForm();
        q("bmAdd").scrollIntoView({behavior:"smooth",block:"center"})};
      x.onclick=function(){
        b.items.splice(i,1);sauver();
        if(form.edit>=0)form=razForm(form.choix.length);
        maj()};
      act.appendChild(e);act.appendChild(x);r.appendChild(act)}
    l.appendChild(r)})}

/* ----- Mise à jour de tout l'écran ----- */
function maj(){
  var b=courante(),l=deType(type),s=q("bmSel");
  q("bmTabs").hidden=!!opts.local;
  [].forEach.call(root.querySelectorAll("#bmTabs .btn"),function(x){x.classList.toggle("sun",x.dataset.t===type)});
  s.innerHTML="";
  l.forEach(function(x){
    var o=document.createElement("option");
    o.value=x.id;o.textContent=x.nom+" ("+x.items.length+")"+(x.base?" · de base":"");
    if(x.id===b.id)o.selected=true;
    s.appendChild(o)});
  q("bmRen").disabled=!!b.base;
  q("bmDel").disabled=!!b.base;
  q("bmInfo").textContent="Utilisée pour la partie · "+(b.base?"lecture seule : duplique-la pour la modifier":"modifiable");
  dessinerForm();dessinerGen();liste()}

function changerType(t){
  if(t===type)return;
  type=t;form=razForm();say(0,"");say(1,"");say(2,"");maj()}

/* Appelé par le salon quand on arrive sur l'écran : mode "tour", "buzzer" ou "qcm" */
function ouvrir(mode){
  type=(mode==="qcm"&&!opts.local)?"qcm":"qr";
  form=razForm();say(0,"");say(1,"");say(2,"");maj()}

/* ----- Interface ----- */
var st=document.createElement("style");
st.textContent=`
#bzzzMots{padding:0;overflow-y:auto}
.bmw{box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;align-items:center;gap:clamp(48px,8vh,72px);padding:96px clamp(14px,4vw,44px) 44px}
.bmw [hidden]{display:none!important}
.bmback{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.bmback:active{transform:scale(.94)}
.bmback svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.bmbox{position:relative;width:min(100%,760px);box-sizing:border-box;padding:24px 22px 26px;display:flex;flex-direction:column;align-items:center;gap:14px}
.bmt{margin:0;font-weight:800;font-size:clamp(1.5rem,4.2vw,2.3rem);line-height:1.1;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.bmfish{position:absolute;top:calc(clamp(60px,12vw,110px)*-.62);width:clamp(60px,12vw,110px);height:auto;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(0,40,90,.35))}
.bmfish.d{right:16px}.bmfish.g{left:16px}
.bmtabs{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.bmtabs .btn{padding:10px 20px 12px;font-size:1.15rem}
.bmlib{width:100%}
.bmlib select.in{appearance:auto;-webkit-appearance:menulist;cursor:pointer}
.bmact{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.bmact .btn,.bmsm{padding:8px 16px 10px;font-size:1rem}
.bmw .btn:disabled{filter:grayscale(.7) brightness(.8);cursor:not-allowed}
.bmmsg{min-height:1.3em;font-weight:600;text-align:center}
.bmmsg.bad{color:#ffd0d0}
.bmlab{display:flex;flex-direction:column;gap:6px;width:100%;font-weight:800;font-size:1rem;text-align:center}
.bmnote{font-weight:600;text-align:center;line-height:1.35}
#bmForm,.bmgenbox{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.bmprop{display:grid;grid-template-columns:minmax(0,1fr) 46px;gap:10px;width:100%;align-items:center}
.bmok{width:46px;height:46px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid var(--line);font-weight:800;font-size:1.3rem;line-height:1}
.bmok.on{background:#34d9bc;color:#082a24;border-color:#fff}
.bmgen{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.bmp{width:48px;height:48px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:1.7rem;line-height:1}
.bmp:active{transform:scale(.92)}
.bmp:disabled{opacity:.3;cursor:not-allowed}
.bmn{min-width:2.2em;font-weight:800;font-size:2rem;text-align:center}
.bmsuf{font-weight:700}
.bmbt{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.bmchips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.bmchip{padding:5px 14px;border-radius:999px;background:var(--glass);border:1.5px solid var(--line);font-weight:700}
.bmtog{background:none;width:100%;padding:0;display:flex;align-items:center;justify-content:center;gap:10px}
.bmtog .ar{display:inline-block;transition:transform .25s;font-size:1.4rem}
.bmtog.on .ar{transform:rotate(180deg)}
.bmlist{display:flex;flex-direction:column;gap:8px;width:100%;max-height:50vh;overflow-y:auto;margin-top:6px}
.bmli{position:relative;padding:8px 52px 8px 12px;border-radius:14px;background:rgba(255,255,255,.12);text-align:left;min-height:44px}
.bmlq{font-weight:800}
.bmlr{font-weight:600;opacity:.9}
.bmlc{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.bmch{padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:600;font-size:.9rem}
.bmch.ok{background:#34d9bc;color:#082a24;font-weight:800}
.bmla{position:absolute;top:6px;right:6px;display:flex;flex-direction:column;gap:6px}
.bmx{width:32px;height:32px;padding:0;border-radius:50%;background:var(--glass);border:1.5px solid var(--line);font-weight:800}
.bmvide{font-weight:600;opacity:.85;text-align:center;padding:8px}
.bmback:focus-visible,.bmp:focus-visible,.bmok:focus-visible,.bmx:focus-visible,.bmchip:focus-visible,.bmtog:focus-visible{outline:3px solid #fff;outline-offset:3px}
`;
document.head.appendChild(st);

function fish(i,cls){return BZM_IMG[i]?'<img class="bmfish '+cls+'" src="'+BZM_IMG[i]+'" alt="">':""}

function init(r,o){
  root=r;opts=o||{};
  if(opts.local)type="qr";
  root.innerHTML=
  '<div class="bmw">'+
    '<button class="bmback" id="bmBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+

    '<div class="bmbox glass">'+
      '<h2 class="bmt">Questions de Bzzz</h2>'+
      '<div class="bmtabs" id="bmTabs">'+
        '<button class="btn" data-t="qr">Buzzer / Tour</button>'+
        '<button class="btn" data-t="qcm">Choix multiples</button>'+
      '</div>'+
      '<div class="bmlib"><select class="in" id="bmSel" aria-label="Bibliothèque de questions"></select></div>'+
      '<div class="bmmsg" id="bmInfo"></div>'+
      '<div class="bmact">'+
        '<button class="btn" id="bmNew">+ Nouvelle</button>'+
        '<button class="btn" id="bmRen">Renommer</button>'+
        '<button class="btn" id="bmDup">Dupliquer</button>'+
        '<button class="btn" id="bmDel">Supprimer</button>'+
      '</div>'+
      '<div class="bmmsg" id="bmM0" role="status"></div>'+
    '</div>'+

    '<div class="bmbox glass" id="bmAdd">'+fish(0,"d")+
      '<h2 class="bmt">Ajouter une question</h2>'+
      '<div id="bmForm"></div>'+
      '<div class="bmmsg" id="bmM1" role="status"></div>'+
    '</div>'+

    '<div class="bmbox glass">'+fish(1,"g")+
      '<h2 class="bmt">Générer des questions</h2>'+
      '<div class="bmgenbox">'+
        '<label class="bmlab">Thème<input class="in" id="bmTheme" maxlength="60" autocomplete="off" placeholder="Ex. : Animaux, Cinéma…"></label>'+
        '<div class="bmchips" id="bmChips"></div>'+
        '<div id="bmGenOpt" class="bmgenbox"></div>'+
        '<div class="bmgen"><button class="bmp" id="bmMoins" aria-label="Moins">−</button><span class="bmn" id="bmN"></span><button class="bmp" id="bmPlus" aria-label="Plus">+</button>'+
        '<button class="btn" id="bmGenGo">Générer</button></div>'+
        '<div class="bmmsg" id="bmGenInfo"></div>'+
      '</div>'+
      '<div class="bmmsg" id="bmM2" role="status"></div>'+
    '</div>'+

    '<div class="bmbox glass">'+fish(2,"d")+
      '<button class="bmtog" id="bmTog" aria-expanded="false"><h2 class="bmt" id="bmTogT"></h2><span class="ar" aria-hidden="true">▾</span></button>'+
      '<div class="bmlist" id="bmList" hidden></div>'+
    '</div>'+
  '</div>';

  BZM_THEMES.forEach(function(t){
    var c=h("button","bmchip",t);c.type="button";
    c.onclick=function(){q("bmTheme").value=t};
    q("bmChips").appendChild(c)});

  q("bmBack").onclick=function(){opts.retour&&opts.retour()};
  [].forEach.call(root.querySelectorAll("#bmTabs .btn"),function(b){b.onclick=function(){changerType(b.dataset.t)}});
  q("bmSel").onchange=function(){
    choix[type]=this.value;sauverChoix();
    form=razForm(form.choix.length);say(0,"");say(1,"");maj()};
  q("bmNew").onclick=actionNouvelle;
  q("bmRen").onclick=actionRenommer;
  q("bmDup").onclick=actionDupliquer;
  q("bmDel").onclick=actionSupprimer;
  q("bmMoins").onclick=function(){nGen=Math.max(1,nGen-1);dessinerGen()};
  q("bmPlus").onclick=function(){nGen=Math.min(20,nGen+1);dessinerGen()};
  q("bmGenGo").onclick=lancerGeneration;
  q("bmTog").onclick=function(){
    ouvert=!ouvert;q("bmTog").classList.toggle("on",ouvert);q("bmTog").setAttribute("aria-expanded",ouvert);liste()};
  maj()}

/* Pour la partie : les questions de la bibliothèque choisie ("qr" ou "qcm") */
function questions(t){return copie(courantePour(t==="qcm"?"qcm":"qr").items)}
function choisie(t){var b=courantePour(t==="qcm"?"qcm":"qr");return{id:b.id,nom:b.nom,items:copie(b.items)}}

window.BzzzMots={init:init,ouvrir:ouvrir,questions:questions,choisie:choisie};
})();
