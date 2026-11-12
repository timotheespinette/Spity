
/* spity-cameleon-moteur.js
   Déplacements, morts, fantômes, signalements et votes.
*/
const Moteur = (() => {
  const M = MANOIR_MAP, C = MANOIR_CFG;

  const mur = (x,y) => {
    x=Math.floor(x); y=Math.floor(y);
    return x<0 || y<0 || x>=M.largeur || y>=M.hauteur ||
      M.grille[y][x]==='#';
  };

  const typeCase = (x,y) =>
    M.grille[Math.floor(y)]?.[Math.floor(x)] || '#';

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
    return {
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
      mortsEnAttente:[],
      vote:null
    };

    e.ajouter=(id,pseudo)=>{
      const i=e.n++,s=M.apparitions[i%M.apparitions.length];

      return e.joueurs[id]={
        id,pseudo,
        x:s[0]+.5,y:s[1]+.5,
        departX:s[0]+.5,departY:s[1]+.5,
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
      if(e.vote){
        delete e.vote.votes[id];
      }
    };

    e.dir=(id,dx,dy)=>{
      const j=e.joueurs[id];
      if(!j || e.phase!=='jeu')return;

      const l=Math.hypot(dx,dy);
      if(l>1){dx/=l;dy/=l;}

      j.dx=dx;
      j.dy=dy;
    };

      const l=Math.hypot(dx,dy);
      if(l>1){dx/=l;dy/=l;}

      j.dx=dx;
      j.dy=dy;
    };

    function mourir(j,creerCadavre){
      if(!j||j.mort)return false;

      j.mort=true;
      j.dx=0;
      j.dy=0;
      j.poison=0;

      if(creerCadavre){
        e.cadavres[j.id]={
          id:j.id,
          x:j.x,
          y:j.y,
          couleur:j.couleur,
          pseudo:j.pseudo,
          signale:false
        };
      }

      e.mortsEnAttente.push(j.id);
      return true;
    }

    e.attaquer=(attaquantId,cibleId)=>{
      const a=e.joueurs[attaquantId];
      const c=e.joueurs[cibleId];

      if(e.phase!=='jeu' || !a || !c || a.mort || c.mort)
        return {ok:false,message:"Action impossible"};

      if(
        a.role!=='cultiste' &&
        a.role!=='metamorphe' &&
        a.role!=='empoisonneur'
      ){
        return {ok:false,message:"Tu ne possèdes pas cette capacité"};
      }

      if(a.cooldown>0)
        return {ok:false,message:"Attends encore "+Math.ceil(a.cooldown)+" s"};

      const distance=Math.hypot(a.x-c.x,a.y-c.y);

      if(distance>1.2||!voit(a.x,a.y,c.x,c.y))
        return {ok:false,message:"Joueur trop éloigné"};

      a.cooldown=C.cooldownKill||25;

      if(a.role==='empoisonneur'){
        if(c.poison>0)return {ok:false,message:"Ce joueur est déjà empoisonné"};
        c.poison=15;
        return {ok:true,message:"Joueur empoisonné"};
      }

      mourir(c,true);
      return {ok:true,message:"Joueur éliminé"};
    };

    function terminerVote(){
      if(!e.vote || e.phase!=='vote')return;

      const v=e.vote;
      const vivants=Object.values(e.joueurs).filter(j=>!j.mort);

      // Les joueurs qui n'ont pas voté reçoivent un vote aléatoire.
      vivants.forEach(j=>{
        if(Object.prototype.hasOwnProperty.call(v.votes,j.id))return;

        let choix=vivants.filter(c=>c.id!==j.id);
        if(!choix.length)choix=vivants;

        const cible=choix.length
          ?choix[Math.floor(Math.random()*choix.length)].id
          :null;

        v.votes[j.id]=cible;
        v.aleatoires[j.id]=true;
      });

      const compte={};
      v.candidats.forEach(c=>compte[c.id]=0);

      Object.keys(v.votes).forEach(id=>{
        const cible=v.votes[id];
        if(cible!==null && compte[cible]!==undefined)compte[cible]++;
      });

      const max=Math.max(0,...Object.values(compte));
      const premiers=Object.keys(compte).filter(id=>compte[id]===max);

      let elimine=null;

      if(max>0 && premiers.length===1){
        const j=e.joueurs[premiers[0]];
        if(j){
          const r=MM_ROLES.find(x=>x.id===j.role)||{};
          elimine={
            id:j.id,
            pseudo:j.pseudo,
            role:r.nom||j.role
          };
        }
      }

      v.resultats=Object.keys(compte).map(id=>{
        const j=e.joueurs[id];
        return {
          id,
          pseudo:j?j.pseudo:"Joueur",
          voix:compte[id]
        };
      });

      v.details=Object.keys(v.votes).map(id=>{
        const votant=e.joueurs[id];
        const cible=v.votes[id];
        const joueurCible=cible===null?null:e.joueurs[cible];

        return {
          votant:votant?votant.pseudo:"Joueur",
          cible:joueurCible?joueurCible.pseudo:"Ne voter personne",
          aleatoire:!!v.aleatoires[id]
        };
      });

      v.elimine=elimine;
      e.phase='resultats';
      e.tPhase=4;
    }

    function revelerElimination(){
      if(!e.vote)return;

      const id=e.vote.elimine&&e.vote.elimine.id;
      if(id && e.joueurs[id]){
        mourir(e.joueurs[id],false);
      }

      // Les corps de la manche précédente disparaîtront à la reprise.
      e.phase='revelation';
      e.tPhase=3;
    }

    function nouvelleManche(){
      Object.values(e.joueurs).forEach(j=>{
        j.x=j.departX;
        j.y=j.departY;
        j.dx=0;
        j.dy=0;
        j.poison=0;
        j.cooldown=0;
      });

      e.cadavres={};
      e.vote=null;
      e.phase='jeu';
      e.tPhase=0;
    }

    e.signaler=(joueurId,cadavreId)=>{
      const j=e.joueurs[joueurId];
      const corps=e.cadavres[cadavreId];

      if(e.phase!=='jeu' || !j || j.mort || !corps || corps.signale)
        return {ok:false,message:"Signalement impossible"};

      const distance=Math.hypot(j.x-corps.x,j.y-corps.y);

      if(distance>1.5||!voit(j.x,j.y,corps.x,corps.y))
        return {ok:false,message:"Cadavre trop éloigné"};

      corps.signale=true;

      const candidats=Object.values(e.joueurs)
        .filter(p=>!p.mort)
        .map(p=>({id:p.id,pseudo:p.pseudo}));

      e.vote={
        reporter:joueurId,
        candidats:candidats,
        votes:{},
        aleatoires:{},
        resultats:[],
        details:[],
        elimine:null
      };

      Object.values(e.joueurs).forEach(p=>{
        p.dx=0;
        p.dy=0;
      });

      e.phase='vote';
      e.tPhase=C.dureeVote||20;

      return {ok:true,message:"Vote lancé"};
    };

    e.voter=(joueurId,cibleId)=>{
      if(e.phase!=='vote' || !e.vote)
        return {ok:false,message:"Le vote est terminé"};

      const j=e.joueurs[joueurId];
      if(!j || j.mort)
        return {ok:false,message:"Tu ne peux pas voter"};

      if(Object.prototype.hasOwnProperty.call(e.vote.votes,joueurId))
        return {ok:false,message:"Tu as déjà voté"};

      if(cibleId!==null && !e.vote.candidats.some(c=>c.id===cibleId))
        return {ok:false,message:"Vote invalide"};

      e.vote.votes[joueurId]=cibleId;

      const vivants=Object.values(e.joueurs).filter(p=>!p.mort);
      if(vivants.every(p=>Object.prototype.hasOwnProperty.call(e.vote.votes,p.id))){
        terminerVote();
      }

      return {ok:true,message:"Vote enregistré"};
    };

    e.prendreMorts=()=>{
      const a=e.mortsEnAttente.slice();
      e.mortsEnAttente.length=0;
      return a;
    };

    e.maj=dt=>{
      for(const j of Object.values(e.joueurs)){
        if(j.cooldown>0)j.cooldown=Math.max(0,j.cooldown-dt);
      }

      if(e.phase==='vote'){
        e.tPhase-=dt;
        if(e.tPhase<=0)terminerVote();
        return;
      }

      if(e.phase==='resultats'){
        e.tPhase-=dt;
        if(e.tPhase<=0)revelerElimination();
        return;
      }

      if(e.phase==='revelation'){
        e.tPhase-=dt;
        if(e.tPhase<=0)nouvelleManche();
        return;
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
        if(j.poison>0){
          j.poison-=dt;
          if(j.poison<=0)mourir(j,true);
        }

        const vx=j.dx*C.vitesse*dt;
        const vy=j.dy*C.vitesse*dt;

        if(j.mort){
          j.x=Math.max(.3,Math.min(M.largeur-.3,j.x+vx));
          j.y=Math.max(.3,Math.min(M.hauteur-.3,j.y+vy));
        }else{
          const r=C.rayonJoueur;
          if(libre(j.x+vx,j.y,r))j.x+=vx;
          if(libre(j.x,j.y+vy,r))j.y+=vy;
        }
      }
    };

    e.etatHote=()=>{
      return {
        phase:e.phase,
        reste:Math.max(0,Math.ceil(e.tPhase)),
        vote:e.vote?{
          total:Object.values(e.joueurs).filter(j=>!j.mort).length,
          votesRecus:Object.keys(e.vote.votes).length,
          candidats:e.phase==='resultats'||e.phase==='revelation'
            ?e.vote.resultats
            :e.vote.candidats,
          details:e.vote.details,
          elimine:e.vote.elimine
        }:null
      };
    };

    e.vue=id=>{
      const j=e.joueurs[id];
      if(!j)return null;

      const autres=[],cadavres=[];
      const rayon=j.mort?Infinity:C.rayonVision;

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

      for(const corps of Object.values(e.cadavres)){
        if(
          Math.hypot(corps.x-j.x,corps.y-j.y)<=rayon &&
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

      const voteTelephone=e.vote?{
        candidats:e.vote.candidats,
        aVote:Object.prototype.hasOwnProperty.call(e.vote.votes,id),
        elimine:e.phase==='revelation'?e.vote.elimine:null
      }:null;

      return {
        t:'vue',
        x:+j.x.toFixed(2),
        y:+j.y.toFixed(2),
        autres,
        cadavres,
        mort:j.mort,
        cooldown:+j.cooldown.toFixed(1),
        poison:+j.poison.toFixed(1),
        phase:e.phase,
        reste:Math.max(0,Math.ceil(e.tPhase)),
        vote:voteTelephone
      };
    };

    return e;
  }

  return {nouveau,mur,voit,typeCase};
})();
