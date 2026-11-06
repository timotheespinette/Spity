// Photos de joueurs partagées par tous les jeux Spity.
(function(){
const K="spity_avatars",key=n=>String(n).trim().toLowerCase();
const load=()=>{try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return{}}};
const save=o=>{try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.head.insertAdjacentHTML('beforeend','<style>.av{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#7352A6,#B99BEA);color:#21182D;font-weight:800;vertical-align:middle;flex:none}.avm{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:20px}.avm div{background:#2d2140;border:1px solid #B99BEA;border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:12px;width:min(320px,100%)}.avm button{min-height:56px;border:1px solid #B99BEA;background:rgba(185,155,234,.15);color:#fff;border-radius:16px;font:700 18px system-ui;padding:0 16px}</style>');
// Ouvre un sélecteur de fichier, avec ou sans appareil photo direct, puis renvoie une miniature carrée.
function choose(cam,cb){
  const i=document.createElement('input');
  i.type='file';
  i.accept='image/*';
  if(cam)i.capture='user';
  i.onchange=()=>{
    const f=i.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        const S=160,c=document.createElement('canvas');
        c.width=c.height=S;
        const m=Math.min(im.width,im.height);
        c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S);
        cb(c.toDataURL('image/jpeg',.8));
      };
      im.src=r.result;
    };
    r.readAsDataURL(f);
  };
  i.click();
}
window.SpityAvatar={
  get:n=>load()[key(n)]||null,
  set(n,u){const o=load();o[key(n)]=u;save(o)},
  remove(n){const o=load();delete o[key(n)];save(o)},
  html(n,s=44){
    const u=this.get(n),st=`width:${s}px;height:${s}px;font-size:${Math.round(s*.5)}px`;
    return u
      ?`<img class="av" src="${u}" style="${st}" alt="">`
      :`<span class="av" style="${st}">${esc((String(n).trim()[0]||'?').toUpperCase())}</span>`;
  },
  // Petit menu : appareil photo ou galerie. Chaque bouton est un vrai clic, donc accepté par tous les navigateurs.
  pick(cb){
    const m=document.createElement('div');
    m.className='avm';
    m.innerHTML='<div><button data-k="cam">📷 Prendre une photo</button><button data-k="gal">🖼 Galerie</button><button data-k="x">Annuler</button></div>';
    m.onclick=e=>{
      const k=e.target.dataset&&e.target.dataset.k;
      if(e.target!==m&&!k)return;
      m.remove();
      if(k==='cam')choose(true,cb);
      else if(k==='gal')choose(false,cb);
    };
    document.body.appendChild(m);
  }
};
})();
