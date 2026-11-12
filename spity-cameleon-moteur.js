
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

  const ZONES=(M.zonesCamera||M.cameras||[]).map((z,i)=>
    Array.isArray(z)
      ?{x:z[0],y:z[1],l:z[2]-z[0],h:z[3]-z[1],nom:"Zone "+(i+1)}
      :Object.assign({nom:"Zone "+(i+1)},z));

  const TRAPPES = [];
  const tmpTrappes = {};
  (M.trappes||[]).forEach(t => {
    if(!tmpTrappes[t[2]]) tmpTrappes[t[2]] = [];
    tmpTrappes[t[2]].push([t[0], t[1]]);
  });
  Object.values(tmpTrappes).forEach(paire => {
    if(paire.length === 2) TRAPPES.push(paire);
  });

  const dedans=(z,x,y)=>x>=z.x&&x<z.x+z.l&&y>=z.y&&y<z.y+z.h;

  /* 2 zones consécutives de la liste, à partir de l'indice i */

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
      vote:null,
      camZ:ZONES.length>1?[0,1]:[0,0],
      camT:C.dureeCamera||20
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
        poison:0,
        trappeCd:0,
        tunnel:null,
        veilleurCd:0,
        cloches:typeof C.cloches==='number'?C.cloches:1
      };
    };

    e.distribuer=actifs=>{
      const ids=melange(Object.keys(e.joueurs));
      const n=ids.length,L=limites(n);

      const ok=r=>!r.fixe&&(!actifs||actifs.includes(r.id));

      const cult=['cultiste'].concat(
        melange(MM_ROLES.filter(r=>r.camp==='cultiste'&&ok(r)).map(r=>r.id))
          .slice(0,L.cult-1)
      );

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
        if(e.phase==='vote'){
          const vivants=Object.values(e.joueurs).filter(p=>!p.mort);
          if(vivants.every(p=>Object.prototype.hasOwnProperty.call(e.vote.votes,p.id)))terminerVote();
        }
      }
      if(e.phase==='jeu')verifierVictoire();
    };

    e.dir=(id,dx,dy)=>{
      const j=e.joueurs[id];
      if(!j || e.phase!=='jeu')return;
      if(j.tunnel)return;

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
      j.tunnel=null;

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
      if(e.phase === 'jeu') verifierVictoire();
      return true;
    }

    e.attaquer=(attaquantId,cibleId)=>{
      const a=e.joueurs[attaquantId];
      const c=e.joueurs[cibleId];

      if(e.phase!=='jeu' || !a || !c || a.mort || c.mort || a.tunnel || c.tunnel)
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

      if(a.role==='empoisonneur'){
        if(c.poison>0)return {ok:false,message:"Ce joueur est déjà empoisonné"};
        a.cooldown=C.cooldownKill||25;
        c.poison=15;
        return {ok:true,message:"Joueur empoisonné"};
      }

      a.cooldown=C.cooldownKill||25;
      mourir(c,true);
      return {ok:true,message:"Joueur éliminé"};
    };

     function verifierVictoire(){
      if(e.fin)return;
      if(typeof MN_VICTOIRE!=='undefined'&&!MN_VICTOIRE)return;

      const vivants=Object.values(e.joueurs).filter(j=>!j.mort);
      const cult=vivants.filter(j=>j.camp==='cultiste').length;
      const inv=vivants.length-cult;

      let gagnant=null;
      if(cult===0)gagnant='invite';
      else if(cult>=inv)gagnant='cultiste';
      if(!gagnant)return;

      e.fin={
        gagnant,
        roles:Object.values(e.joueurs).map(j=>{
          const r=MM_ROLES.find(x=>x.id===j.role)||{};
          return {pseudo:j.pseudo,role:r.nom||j.role,emoji:r.emoji||'',camp:j.camp,mort:j.mort};
        })
      };
      e.phase='fin';
      e.tPhase=0;
      Object.values(e.joueurs).forEach(j=>{j.dx=0;j.dy=0;});
    }

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
      verifierVictoire();
      if(e.fin)return;

      Object.values(e.joueurs).forEach(j=>{
        j.x=j.departX;
        j.y=j.departY;
        j.dx=0;
        j.dy=0;
        j.poison=0;
        j.cooldown=10;
        j.tunnel=null;
      });

      e.cadavres={};
      e.vote=null;
      e.phase='jeu';
      e.tPhase=0;
    }

    function lancerReunion(j,corps){
      const candidats=Object.values(e.joueurs)
        .filter(p=>!p.mort)
        .map(p=>({id:p.id,pseudo:p.pseudo}));

      e.vote={
        reporter:j.id,
        signalePar:j.pseudo,
        corps:corps?corps.pseudo:null,
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
        p.tunnel=null;
      });

      e.phase='discussion';
      e.tPhase=C.dureeDiscussion||45;
    }

    e.signaler=(joueurId,cadavreId)=>{
      const j=e.joueurs[joueurId];
      const corps=e.cadavres[cadavreId];

      if(e.phase!=='jeu' || !j || j.mort || j.tunnel || !corps || corps.signale)
        return {ok:false,message:"Signalement impossible"};
      const distance=Math.hypot(j.x-corps.x,j.y-corps.y);
      if(distance>1.5||!voit(j.x,j.y,corps.x,corps.y))
        return {ok:false,message:"Cadavre trop éloigné"};

      corps.signale=true;
      lancerReunion(j,corps);
      return {ok:true,message:"Vote lancé"};
    };

    e.sonner=joueurId=>{
      const j=e.joueurs[joueurId];
      if(e.phase!=='jeu'||!j||j.mort||j.tunnel)
        return {ok:false,message:"Action impossible"};
      if(!M.cloche)
        return {ok:false,message:"Pas de cloche sur la carte"};
      if((j.cloches||0)<=0)
        return {ok:false,message:"Tu n'as plus de cloche d'urgence"};
      if(Math.hypot(j.x-(M.cloche[0]+.5),j.y-(M.cloche[1]+.5))>1.6)
        return {ok:false,message:"Trop loin de la cloche"};

      j.cloches--;
      lancerReunion(j,null);
      return {ok:true,message:"Réunion d'urgence !"};
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
        if(j.trappeCd>0)j.trappeCd=Math.max(0,j.trappeCd-dt);
        if(j.veilleurCd>0)j.veilleurCd=Math.max(0,j.veilleurCd-dt);
      }

      if(e.phase==='fin')return;

      if(e.phase==='discussion'){
        e.tPhase-=dt;
        if(e.tPhase<=0){
          e.phase='vote';
          e.tPhase=C.dureeVote||20;
        }
        return;
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
            Object.values(e.joueurs).forEach(j=>{j.cooldown=10;});
          }
        }
        return;
      }

      if(ZONES.length>1){
        e.camT-=dt;
        if(e.camT<=0){
          e.camZ=e.camZ.map(i=>(i+2)%ZONES.length);
          e.camT=C.dureeCamera||20;
        }
      }

      for(const j of Object.values(e.joueurs)){
        if(j.poison>0){
          j.poison-=dt;
          if(j.poison<=0)mourir(j,true);
        }

        if(j.tunnel){
          j.tunnel.reste-=dt;
          if(j.tunnel.reste<=0){
            j.tunnel=null;
            j.trappeCd=C.cooldownTrappe||3;
          }
          continue;
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

    e.camsActives=()=>{
      const l=[];
      e.camZ.forEach(i=>{
        const z=ZONES[i];
        if(z&&!l.includes(z))l.push(z);
      });
      return l;
    };

    /* 0 = rien, 1 = point orange (filmé dans < 5 s), 2 = point rouge (filmé) */
    function etatCamera(j){
      if(j.mort||j.tunnel||!ZONES.length)return 0;
      if(e.camZ.some(i=>ZONES[i]&&dedans(ZONES[i],j.x,j.y)))return 2;
      if(e.camT<=5&&ZONES.length>1&&e.camZ.some(i=>{
        const z=ZONES[(i+2)%ZONES.length];
        return z&&dedans(z,j.x,j.y);
      }))return 1;
      return 0;
    }

    /* Entrer dans les trappes */
    e.trappe=id=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.mort||j.tunnel)
        return {ok:false,message:"Action impossible"};
      if(!(j.role==='cultiste'||(C.trappesTous&&j.camp==='cultiste')))
        return {ok:false,message:"Tu ne peux pas utiliser les trappes"};
      if((j.trappeCd||0)>0)
        return {ok:false,message:"Trappe indisponible ("+Math.ceil(j.trappeCd)+" s)"};

      let arrivee=null,dist=1.1;
      TRAPPES.forEach(p=>{
        for(let k=0;k<2;k++){
          const d=Math.hypot(j.x-(p[k][0]+.5),j.y-(p[k][1]+.5));
          if(d<dist){dist=d;arrivee=p[1-k];}
        }
      });
      if(!arrivee)return {ok:false,message:"Aucune trappe à proximité"};

      j.tunnel={depart:[j.x,j.y],reste:C.dureeTunnel||15};
      j.x=arrivee[0]+.5;
      j.y=arrivee[1]+.5;
      j.dx=0;
      j.dy=0;
      return {ok:true,message:"Tu es dans les trappes"};
    };

    /* Sortir des trappes : choix = "ici" (arrivée) ou "retour" (départ) */
    e.sortirTrappe=(id,choix)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.mort||!j.tunnel)
        return {ok:false,message:"Tu n'es pas dans les trappes"};

      if(choix==='retour'){
        j.x=j.tunnel.depart[0];
        j.y=j.tunnel.depart[1];
      }
      j.tunnel=null;
      j.trappeCd=C.cooldownTrappe||3;
      return {ok:true,message:"Tu sors des trappes"};
    };

    /* Veilleur : choisir la zone filmée par la caméra 1 (slot 0) ou 2 (slot 1) */
    e.changerCamera=(id,slot,zone)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.mort||j.role!=='veilleur')
        return {ok:false,message:"Action impossible"};
      if((j.veilleurCd||0)>0)
        return {ok:false,message:"Attends encore "+Math.ceil(j.veilleurCd)+" s"};
      if(!(slot===0||slot===1)||!Number.isInteger(zone)||!ZONES[zone])
        return {ok:false,message:"Caméra invalide"};
      if(e.camZ[slot]===zone)
        return {ok:false,message:"Cette caméra filme déjà cette zone"};

      const autre=1-slot;
      if(e.camZ[autre]===zone)e.camZ[autre]=e.camZ[slot];
      e.camZ[slot]=zone;
      e.camT=C.dureeCamera||20;
      j.veilleurCd=C.cooldownVeilleur||10;
      return {ok:true,message:"CAM "+(slot+1)+" : "+ZONES[zone].nom};
    };

    e.etatHote=()=>({
      phase:e.phase,
      reste:Math.max(0,Math.ceil(e.tPhase)),
      fin:e.fin||null,
      vote:e.vote?{
        total:Object.values(e.joueurs).filter(j=>!j.mort).length,
        votesRecus:Object.keys(e.vote.votes).length,
        candidats:e.phase==='resultats'||e.phase==='revelation'
          ?e.vote.resultats
          :e.vote.candidats,
        details:e.vote.details,
        elimine:e.vote.elimine,
        reporter:e.vote.signalePar,
        corps:e.vote.corps
      }:null
    });

    e.vue=id=>{
      const j=e.joueurs[id];
      if(!j)return null;

      const autres=[],cadavres=[];

      for(const o of Object.values(e.joueurs)){
        if(o===j||o.mort)continue;
        if(o.tunnel&&!j.mort)continue;
        const lim=typeCase(o.x,o.y)==='~'?C.rayonBuisson:C.rayonVision;
        if(j.mort || (Math.hypot(o.x-j.x,o.y-j.y)<=lim && voit(j.x,j.y,o.x,o.y))){
          autres.push([o.id,+o.x.toFixed(2),+o.y.toFixed(2),o.couleur,o.pseudo]);
        }
      }

      for(const corps of Object.values(e.cadavres)){
        if(j.mort || (Math.hypot(corps.x-j.x,corps.y-j.y)<=C.rayonVision && voit(j.x,j.y,corps.x,corps.y))){
          cadavres.push([corps.id,+corps.x.toFixed(2),+corps.y.toFixed(2),
            corps.couleur,corps.pseudo,corps.signale]);
        }
      }

      const voteTelephone=e.vote?{
        candidats:e.vote.candidats,
        aVote:Object.prototype.hasOwnProperty.call(e.vote.votes,id),
        elimine:e.phase==='revelation'?e.vote.elimine:null,
        reporter:e.vote.signalePar,
        corps:e.vote.corps
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
        vote:voteTelephone,
        fin:e.fin||null,
        cam:etatCamera(j),
        trappeCd:+(j.trappeCd||0).toFixed(1),
        tunnel:j.tunnel?{reste:Math.ceil(j.tunnel.reste)}:null,
        cloches:j.cloches||0,
        camZ:j.role==='veilleur'?e.camZ.slice():null,
        veilleurCd:+(j.veilleurCd||0).toFixed(1)
      };
    };

    return e;
  }

  return {nouveau,mur,voit,typeCase,zones:ZONES};
})();
