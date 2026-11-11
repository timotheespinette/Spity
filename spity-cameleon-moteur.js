
/* spity-cameleon-moteur.js
   Moteur de Caméléon : déplacements, morts, fantômes et signalements.
*/
const Moteur = (() => {
  const M = MANOIR_MAP, C = MANOIR_CFG;

  const mur = (x,y) => {
    x=Math.floor(x); y=Math.floor(y);
    return x<0 || y<0 || x>=M.largeur || y>=M.hauteur ||
      M.grille[y][x]==='#';
  };

  const typeCase = (x,y) => M.grille[Math.floor(y)][Math.floor(x)];

  const libre = (x,y,r) =>
    !(mur(x-r,y-r)||mur(x+r,y-r)||mur(x-r,y+r)||mur(x+r,y+r));

  function voit(ax,ay,bx,by){
    const n=Math.ceil(Math.hypot(bx-ax,by-ay)/.2);
    for(let i=1;i<n;i++){
      const t=i/n;
      if(mur(ax+(bx-ax)*t,ay+(by-ay)*t))return false;
    }
    return true;
  }

  function limites(n){
    const c=n<=6?1:n<=11?2:3;
    const i=n<=6?1:n<=10?2:3;
    return{
      cult:Math.max(1,Math.min(c,Math.floor(n/2))),
      info:i
    };
  }

  const melange=a=>{
    for(let i=a.length-1;i>0;i--){
      const k=Math.floor(Math.random()*(i+1));
      [a[i],a[k]]=[a[k],a[i]];
    }
    return a;
  };

  function nouveau(){
    const e={
      joueurs:{},
      n:0,
      phase:'jeu',
      tPhase:0,
      cadavres:{},
      mortsEnAttente:[]
    };

    e.ajouter=(id,pseudo)=>{
      const i=e.n++,s=M.apparitions[i%M.apparitions.length];

      return e.joueurs[id]={
        id,pseudo,
        x:s[0]+.5,y:s[1]+.5,
        dx:0,dy:0,
        couleur:C.couleurs[i%C.couleurs.length],
        mort:false,
        cooldown:0,
        poison:0
      };
    };

    e.distribuer=actifs=>{
      const ids=melange(Object.keys(e.joueurs));
      const n=ids.length,L=limites(n);

      const ok=r=>!r.fixe&&(!actifs||actifs.includes(r.id));

      const cult=melange(
        MM_ROLES.filter(r=>r.camp==='cultiste'&&ok(r)).map(r=>r.id)
      ).slice(0,L.cult);

      while(cult.length<L.cult)cult.push('cultiste');

      const places=n-L.cult,inv=[];
      let info=0;

      for(const r of melange(MM_ROLES.filter(r=>r.camp==='invite'&&ok(r)))){
        if(inv.length>=places)break;
        if(r.info){
          if(info>=L.info)continue;
          info++;
        }
        inv.push(r.id);
      }

      while(inv.length<places)inv.push('innocent');

      const roles=cult.concat(inv);

      ids.forEach((id,i)=>{
        const j=e.joueurs[id];
        const r=MM_ROLES.find(x=>x.id===roles[i]);
        j.role=r.id;
        j.camp=r.camp;
      });

      e.phase='role';
      e.tPhase=C.dureeRole;
    };

    e.retirer=id=>{
      delete e.joueurs[id];
    };

    e.dir=(id,dx,dy)=>{
      const j=e.joueurs[id];
      if(!j)return;

      const l=Math.hypot(dx,dy);
      if(l>1){dx/=l;dy/=l}

      j.dx=dx;
      j.dy=dy;
    };

    /* Élimination d'un joueur */
    function mourir(j){
      if(!j||j.mort)return false;

      j.mort=true;
      j.dx=0;
      j.dy=0;
      j.poison=0;

      // Le corps reste définitivement à sa position de mort
      e.cadavres[j.id]={
        id:j.id,
        x:j.x,
        y:j.y,
        couleur:j.couleur,
        pseudo:j.pseudo,
        signale:false
      };

      e.mortsEnAttente.push(j.id);
      return true;
    }

    /* Attaque au contact */
    e.attaquer=(attaquantId,cibleId)=>{
      const a=e.joueurs[attaquantId];
      const c=e.joueurs[cibleId];

      if(!a||!c||a.mort||c.mort)
        return{ok:false,message:"Action impossible"};

      if(a.role!=='cultiste'&&a.role!=='empoisonneur')
        return{ok:false,message:"Tu ne possèdes pas cette capacité"};

      if(a.cooldown>0)
        return{ok:false,message:"Attends encore "+Math.ceil(a.cooldown)+" s"};

      const distance=Math.hypot(a.x-c.x,a.y-c.y);

      if(distance>1.2||!voit(a.x,a.y,c.x,c.y))
        return{ok:false,message:"Joueur trop éloigné"};

      a.cooldown=C.cooldownKill||25;

      if(a.role==='empoisonneur'){
        c.poison=15;
        return{ok:true,message:"Joueur empoisonné"};
      }

      mourir(c);
      return{ok:true,message:"Joueur éliminé"};
    };

    /* Signalement d'un cadavre */
    e.signaler=(joueurId,cadavreId)=>{
      const j=e.joueurs[joueurId];
      const corps=e.cadavres[cadavreId];

      if(!j||j.mort||!corps||corps.signale)
        return{ok:false,message:"Signalement impossible"};

      const distance=Math.hypot(j.x-corps.x,j.y-corps.y);

      if(distance>1.5||!voit(j.x,j.y,corps.x,corps.y))
        return{ok:false,message:"Cadavre trop éloigné"};

      corps.signale=true;

      return{ok:true,message:"Cadavre signalé"};
    };

    e.prendreMorts=()=>{
      const a=e.mortsEnAttente.slice();
      e.mortsEnAttente.length=0;
      return a;
    };

    e.maj=dt=>{

      // Recharge des attaques et poison
      for(const j of Object.values(e.joueurs)){
        if(j.cooldown>0)j.cooldown=Math.max(0,j.cooldown-dt);

        if(j.poison>0){
          j.poison-=dt;
          if(j.poison<=0)mourir(j);
        }
      }

      if(e.phase!=='jeu'){
        e.tPhase-=dt;

        if(e.tPhase<=0){
          if(e.phase==='role'){
            e.phase='compte';
            e.tPhase=C.dureeCompte;
          }else{
            e.phase='jeu';
          }
        }
        return;
      }

      for(const j of Object.values(e.joueurs)){
        const vx=j.dx*C.vitesse*dt;
        const vy=j.dy*C.vitesse*dt;

        if(j.mort){
          // Les fantômes traversent absolument tous les murs
          j.x+=vx;
          j.y+=vy;
        }else{
          const r=C.rayonJoueur;
          if(libre(j.x+vx,j.y,r))j.x+=vx;
          if(libre(j.x,j.y+vy,r))j.y+=vy;
        }
      }
    };

    /* Vue personnalisée de chaque téléphone */
    e.vue=id=>{
      const j=e.joueurs[id];
      if(!j)return null;

      const autres=[],cadavres=[];

      // Les joueurs vivants ne voient que les autres vivants
      if(!j.mort){
        for(const o of Object.values(e.joueurs)){
          if(o===j||o.mort)continue;

          const lim=typeCase(o.x,o.y)==='~'
            ?C.rayonBuisson:C.rayonVision;

          if(
            Math.hypot(o.x-j.x,o.y-j.y)<=lim &&
            voit(j.x,j.y,o.x,o.y)
          ){
            autres.push([
              o.id,+o.x.toFixed(2),+o.y.toFixed(2),
              o.couleur,o.pseudo
            ]);
          }
        }
      }

      // Les cadavres sont visibles dans le rayon normal
      for(const corps of Object.values(e.cadavres)){
        if(
          Math.hypot(corps.x-j.x,corps.y-j.y)<=C.rayonVision &&
          voit(j.x,j.y,corps.x,corps.y)
        ){
          cadavres.push([
            corps.id,
            +corps.x.toFixed(2),
            +corps.y.toFixed(2),
            corps.couleur,
            corps.pseudo,
            corps.signale
          ]);
        }
      }

      return{
        t:'vue',
        x:+j.x.toFixed(2),
        y:+j.y.toFixed(2),
        autres,
        cadavres,
        mort:j.mort,
        cooldown:+j.cooldown.toFixed(1),
        poison:+j.poison.toFixed(1),
        phase:e.phase,
        reste:Math.max(0,Math.ceil(e.tPhase))
      };
    };

    return e;
  }

  return{nouveau,mur,voit,typeCase};
})();
