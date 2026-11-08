/* ===== spity-scores.js : points des joueurs + classement en podium =====
   Le bouton podium se place en haut à droite de l’écran des jeux, juste à gauche de la carte. */
(function(){
var data={}, seq=0, root, opts={}, modal;

/* ----- Les points ----- */

/* Ajoute des points à un joueur, ou à plusieurs d’un coup (tableau d’identifiants).
   Les joueurs qui gagnent dans la même partie atteignent leur score « en même temps ». */
function ajouter(id, n){
  var l=Array.isArray(id)?id:[id];
  seq++;
  l.forEach(function(i){
    var d=data[i]||(data[i]={pts:0,seq:Infinity});
    d.pts+=n; d.seq=seq});}

function points(id){return data[id]?data[id].pts:0}

/* Classement : plus de points d’abord ; à égalité, celui qui a atteint ce score le premier ;
   sinon, l’ordre d’arrivée dans le salon. */
function classement(joueurs){
  return (joueurs||[]).map(function(p,i){
      var d=data[p.id]||{pts:0,seq:Infinity};
      return{p:p,pts:d.pts,seq:d.seq,i:i}})
    .sort(function(a,b){return b.pts-a.pts||a.seq-b.seq||a.i-b.i})}

/* ----- L’écran du classement ----- */
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function pts(n){return n+(n>1?" pts":" pt")}

var st=document.createElement("style");
st.textContent=`
#gPod{right:78px}
.spm{display:none;position:fixed;inset:0;z-index:25;background:rgba(0,20,60,.65);place-items:center;padding:16px;box-sizing:border-box}
.spm.on{display:grid}
.spb{width:min(96vw,640px);max-height:94vh;box-sizing:border-box;padding:18px 20px 22px;display:flex;flex-direction:column;align-items:center;gap:12px;overflow:hidden}
.spt{font-weight:800;font-size:clamp(1.8rem,5vw,2.6rem);line-height:1;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.spz{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:end;gap:8px;width:100%}
.spc{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0}
.spc .av{width:min(18vw,84px);border-width:4px;flex:none}
.spn{font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px}
.spp{font-weight:700;font-size:.9rem;opacity:.9;margin-bottom:6px}
.spk{width:100%;border-radius:14px 14px 0 0;display:grid;place-items:center;font-weight:800;font-size:2rem;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.3)}
.r1 .spk{height:clamp(90px,16vh,150px);background:linear-gradient(180deg,#ffd96e,#ffc23d);color:#4a2a00;text-shadow:none}
.r2 .spk{height:clamp(64px,11vh,105px);background:linear-gradient(180deg,#e8eef7,#aebbd0);color:#2b3a52;text-shadow:none}
.r3 .spk{height:clamp(44px,7.5vh,75px);background:linear-gradient(180deg,#e8b27a,#b9743a)}
.spl{display:flex;flex-direction:column;gap:6px;width:100%;max-height:26vh;overflow-y:auto}
.spr{display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.12);font-weight:800}
.spr .rg{min-width:1.6em;opacity:.8;text-align:center}
.spr .av{width:36px;border-width:2px;flex:none}
.spr .nm2{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.spv{font-weight:600;opacity:.9;text-align:center}
`;
document.head.appendChild(st);

function fermer(){modal&&modal.classList.remove("on")}

function ouvrir(){
  var c=classement(opts.joueurs?opts.joueurs():[]),b=modal.querySelector(".spb");
  b.innerHTML="";
  b.appendChild(h("div","spt","Classement"));
  if(!c.length)b.appendChild(h("div","spv","Aucun joueur dans le salon."));
  else if(!c[0].pts)b.appendChild(h("div","spv","Personne n’a encore de point."));
  /* Podium : 2e à gauche, 1er au milieu, 3e à droite */
  var z=h("div","spz");
  [1,0,2].forEach(function(k){
    var e=c[k],col=h("div","spc r"+(k+1));
    if(e){col.appendChild(Avatar.make(e.p));col.appendChild(h("div","spn",e.p.name));
      col.appendChild(h("div","spp",pts(e.pts)));col.appendChild(h("div","spk",String(k+1)))}
    z.appendChild(col)});
  if(c.length)b.appendChild(z);
  /* Les autres, du plus haut au plus bas */
  if(c.length>3){
    var l=h("div","spl");
    c.slice(3).forEach(function(e,j){
      var r=h("div","spr");r.appendChild(h("span","rg",String(j+4)));r.appendChild(Avatar.make(e.p));
      r.appendChild(h("span","nm2",e.p.name));r.appendChild(h("span","",pts(e.pts)));l.appendChild(r)});
    b.appendChild(l)}
  var x=h("button","btn","Fermer");x.onclick=fermer;b.appendChild(x);
  modal.classList.add("on")}

/* À appeler APRÈS Jeux.init : ajoute le bouton podium dans l’écran des jeux */
function init(r,o){
  root=r;opts=o||{};
  var old=root.querySelector("#gPod");if(old)old.remove();
  var old2=root.querySelector(".spm");if(old2)old2.remove();
  var b=h("button","gtop");b.id="gPod";b.setAttribute("aria-label","Classement");
  b.innerHTML='<svg viewBox="0 0 24 24"><path d="M2 21V12h6V5h8v10h6v6zM8 12v9M16 15v6"/></svg>';
  b.onclick=ouvrir;root.appendChild(b);
  modal=h("div","spm");modal.onclick=function(e){if(e.target===modal)fermer()};
  modal.appendChild(h("div","spb glass"));root.appendChild(modal);
  if(!init.k){init.k=1;document.addEventListener("keydown",function(e){if(e.key==="Escape")fermer()})}}

window.Scores={init:init,ajouter:ajouter,points:points,classement:classement,ouvrir:ouvrir,fermer:fermer};
})();
