const VERSION="1.0",G=window.SPITY_GAMES,$=s=>document.querySelector(s);
let S={light:false,sound:true,anim:true};
try{Object.assign(S,JSON.parse(localStorage.getItem("spity")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("spity",JSON.stringify(S))}catch(e){}};
function applySettings(){
  document.documentElement.classList.toggle("light",S.light);
  document.documentElement.classList.toggle("noanim",!S.anim);
  $("#s-light").checked=S.light;$("#s-sound").checked=S.sound;$("#s-anim").checked=S.anim;
}
function card(g){
  const b=document.createElement("button");b.className="card"+(g.ready?"":" soon");
  b.innerHTML=`<div class="art" style="background:linear-gradient(135deg,${g.color[0]},${g.color[1]})">${g.emoji}</div><div class="txt"><b>${g.name}</b><small>${g.desc}</small>${g.ready?"":'<span class="tag">Bientôt</span>'}</div>`;
  if(g.ready)b.onclick=()=>play(g.id);return b;
}
function render(){
  const q=$("#q").value.trim().toLowerCase(),home=$("#home");home.innerHTML="";
  const list=G.filter(g=>!q||(g.name+g.cat).toLowerCase().includes(q));
  const f=!q&&G.find(g=>g.featured&&g.ready);
  if(f){const h=document.createElement("div");h.className="hero";h.innerHTML=`<div><h1>Prêt à jouer ?</h1><p>${f.name} : ${f.desc}</p></div><div class="big">${f.emoji}</div>`;h.onclick=()=>play(f.id);home.append(h)}
  if(!list.length){home.innerHTML='<p class="muted" style="margin:20px">Aucun jeu ne correspond à cette recherche.</p>';return}
  const t=document.createElement("h2");t.className="row";t.textContent="Tous les jeux";
  const gr=document.createElement("div");gr.className="grid";list.forEach(g=>gr.append(card(g)));home.append(t,gr);
}
function play(id){
  $("#frame").src=`${G.find(g=>g.id===id).file}?sound=${S.sound?1:0}&anim=${S.anim?1:0}&theme=${S.light?"light":"dark"}`;
  $("#player").hidden=false;if(location.hash!=="#"+id)history.pushState({id},"","#"+id);
}
function close(){$("#player").hidden=true;$("#frame").src="about:blank"}
$("#back").onclick=()=>history.back();
addEventListener("popstate",()=>{location.hash?play(location.hash.slice(1)):close()});
$("#q").oninput=render;
$("#open-settings").onclick=()=>$("#settings").hidden=false;
$("#close-settings").onclick=()=>$("#settings").hidden=true;
[["light","#s-light"],["sound","#s-sound"],["anim","#s-anim"]].forEach(([k,s])=>$(s).onchange=e=>{S[k]=e.target.checked;save();applySettings()});
$("#ver").textContent=VERSION;applySettings();render();
if(location.hash&&G.some(g=>g.id===location.hash.slice(1)&&g.ready))play(location.hash.slice(1));
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
