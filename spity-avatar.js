
// Photos de joueurs partagées par tous les jeux Spity.
(function(){
const K="spity_avatars",key=n=>String(n).trim().toLowerCase();
const load=()=>{try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return{}}};
const save=o=>{try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.head.insertAdjacentHTML('beforeend','<style>.av{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#7352A6,#B99BEA);color:#21182D;font-weight:800;vertical-align:middle;flex:none}</style>');
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
  pick(cb){
    const i=document.createElement('input');
    i.type='file';
    i.accept='image/*';
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
          c.getContext('2d').drawImage(
            im,
            (im.width-m)/2,
            (im.height-m)/2,
            m,m,0,0,S,S
          );
          cb(c.toDataURL('image/jpeg',.8));
        };
        im.src=r.result;
      };
      r.readAsDataURL(f);
    };
    i.click();
  }
};
})();
