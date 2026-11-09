/* ===== spity-local-undersea.js : UnderSea en local, on se passe le téléphone =====
   Remplace les téléphones des joueurs : carte secrète, vote et devinette de Mr White
   se font à tour de rôle sur le même appareil.
   (Réutilise les styles .tw .tt .ts .ucard .uvg .uvp définis dans spity-undersea-partie.js) */

(function(){
var root;

var st = document.createElement("style");
st.textContent =
"#usLocal{padding:0;overflow-y:auto}"+
".tw .lubig .av{width:clamp(110px,24vh,220px);border-width:7px}"+
".tw .btn:disabled{filter:grayscale(.7) brightness(.8);cursor:not-allowed}";
document.head.appendChild(st);

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function fait(p){return Avatar.make(p)}
function bouton(txt,cls,fn){var b=h("button","btn "+(cls||""),txt);b.onclick=fn;return b}
function page(){root.innerHTML="";var w=h("div","tw");root.appendChild(w);return w}

/* Écran d'attente : « Passe le téléphone à X » (personne ne voit rien de secret) */
function passe(p,texte,fn){
  var w=page();
  w.appendChild(h("div","ts","Passe le téléphone à"));
  var b=h("div","lubig");b.appendChild(fait(p));w.appendChild(b);
  w.appendChild(h("h2","tt",p.name));
  w.appendChild(bouton(texte,"sun",fn))}

/* ----- 1) Les cartes : liste = [{p, mot, mrwhite}] ----- */
function cartes(liste,fini){
  var i=0;
  (function suivant(){
    if(i>=liste.length)return fini();
    var x=liste[i++];
    passe(x.p,"C’est moi, voir mon mot",function(){carte(x,suivant)})
  })()}

function carte(x,suivant){
  var w=page(),vu=false,on=false;
  var c=h("button","ucard");c.setAttribute("aria-label","Ma carte");
  c.innerHTML='<div class="uci"><div class="ucf"><div class="uq">?</div><div>Touche pour voir ton mot</div></div><div class="ucb"></div></div>';
  var dos=c.querySelector(".ucb");
  if(x.mrwhite){
    dos.appendChild(h("div","umot","Mr White"));
    dos.appendChild(h("div","ts","Tu n’as pas de mot. Écoute bien les autres et fais semblant !"))}
  else dos.appendChild(h("div","umot",x.mot));
  var ok=bouton("Caché, suivant","sun",suivant);ok.disabled=true;
  c.onclick=function(){
    on=!on;c.classList.toggle("on",on);
    if(on)vu=true;
    ok.disabled=!(vu&&!on)};            /* on ne peut passer qu'une fois la carte recachée */
  w.appendChild(c);
  w.appendChild(h("div","ts","Touche la carte pour voir ton mot, retouche-la pour la cacher, puis passe le téléphone."));
  w.appendChild(ok)}

/* ----- 2) Le vote : chaque joueur vivant vote en privé ----- */
function votes(vivants,fini){
  var i=0,res={};
  (function suivant(){
    if(i>=vivants.length)return fini(res);
    var v=vivants[i++];
    passe(v,"C’est moi, voter",function(){
      vote(v,vivants,function(cible){res[v.id]=cible;suivant()})})
  })()}

function vote(v,vivants,fin){
  var w=page(),choix="";
  w.appendChild(h("h2","tt","Qui est l’intrus ?"));
  var g=h("div","uvg"),bv=bouton("Voter","sun",function(){if(choix)fin(choix)});
  bv.disabled=true;
  vivants.forEach(function(p){
    if(p.id===v.id)return;
    var b=h("button","uvp");b.appendChild(fait(p));b.appendChild(h("span","",p.name));
    b.onclick=function(){
      choix=p.id;
      [].forEach.call(g.children,function(c){c.classList.toggle("on",c===b)});
      bv.disabled=false};
    g.appendChild(b)});
  w.appendChild(g);w.appendChild(bv)}

/* ----- 3) Mr White démasqué : il tape le mot des civils ----- */
function devine(p,fini){
  passe(p,"C’est moi, deviner",function(){
    var w=page();
    w.appendChild(h("h2","tt","Tu es démasqué !"));
    w.appendChild(h("div","ts","Tu peux encore gagner : quel est le mot des civils ?"));
    var inp=h("input","in");inp.maxLength=30;inp.placeholder="Le mot des civils";inp.autocomplete="off";
    inp.setAttribute("aria-label","Mot des civils");
    w.appendChild(inp);
    w.appendChild(bouton("Valider","sun",function(){
      if(!inp.value.trim())return;
      fini(inp.value)}))})}

window.LocalUnderSea={
  init:function(r){root=r},
  cartes:cartes,
  votes:votes,
  devine:devine
};
})();
