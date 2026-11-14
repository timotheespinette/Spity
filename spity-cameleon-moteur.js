/* spity-cameleon-moteur.js
   Déplacements, morts, fantômes, signalements, votes, vitres, missions,
   points, pouvoirs et capacités de TOUS les rôles.
   Dépend de ManoirMissions (spity-cameleon-missions.js).

   Ids de rôles attendus dans MM_ROLES :
   cultiste, empoisonneur, metamorphe, innocent, veilleur, detective,
   medium, cartographe, chasseur, garde, martyr
*/
const Moteur = (() => {
  const M = MANOIR_MAP, C = MANOIR_CFG;
  const PIECES = M.pieces || [];

  const hors = (x,y) => x<0 || y<0 || x>=M.largeur || y>=M.hauteur;

  /* Obstacle pour les DÉPLACEMENTS : murs + vitres */
  const mur = (x,y) => {
    x=Math.floor(x); y=Math.floor(y);
    return hors(x,y) || M.grille[y][x]==='#' || M.grille[y][x]==='V';
  };

  /* Obstacle pour la VUE : seulement les murs (on voit à travers les vitres) */
  const opaque = (x,y) => {
    x=Math.floor(x); y=Math.floor(y);
    return hors(x,y) || M.grille[y][x]==='#';
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

  /* Pièce (lieu nommé) la plus proche, -1 si aucune à moins de 7 cases */
  function pieceProche(x,y){
    let b=-1,bd=7;
    PIECES.forEach((p,i)=>{
      const d=Math.hypot(p[0]-x,p[1]-y);
      if(d<bd){bd=d;b=i;}
    });
    return b;
  }

  /* strict=true : les vitres bloquent aussi (attaque, signalement…)
     strict=false : on voit à travers les vitres */
  function voit(ax,ay,bx,by,strict){
    const bloque=strict?mur:opaque;
    const n=Math.ceil(Math.hypot(bx-ax,by-ay)/.2);
    for(let i=1;i<n;i++){
      const t=i/n;
      if(bloque(ax+(bx-ax)*t,ay+(by-ay)*t))return false;
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

  /* Effets temporaires (secondes restantes) remis à zéro à la mort */
  const TIM=['furtif','fige','riposte','gardeReste','empreintes','cibleTraceReste',
             'fantomes','buis','camTout','revele'];

  function nouveau(){
    const e={
      joueurs:{},
      n:0,
      t:0,                       // horloge de la partie (secondes de jeu)
      phase:'jeu',
      tPhase:0,
      cadavres:{},
      mortsEnAttente:[],
      notifs:[],                 // messages à envoyer à des téléphones précis
      camCoupe:0,                // caméras sabotées (secondes restantes)
      camSlot:0,
      traces:[],                 // empreintes de pas
      derniers:{},               // dernier joueur entré dans chaque pièce
      pieges:[],                 // pièges du chasseur
      alerte:null,               // alerte lancée par un imposteur mort
      chasse:null,               // tir du chasseur éliminé
      dernierMort:null,
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
        poisonFurtif:false,
        trappeCd:0,
        tunnel:null,
        veilleurCd:0,
        cloches:typeof C.cloches==='number'?C.cloches:1,
        /* missions & pouvoirs */
        points:0,
        missions:[],
        recent:[],
        enCours:null,
        bouclier:0,
        vitMult:1,vitReste:0,
        visBonus:0,visReste:0,
        invis:0,
        /* capacités de rôle */
        capaCd:0,
        deguise:null,
        cibleTrace:null,
        protegeVote:false,
        voteDouble:false,
        cartoCd:25,cartoReste:0,
        furtif:0,fige:0,riposte:0,gardeReste:0,empreintes:0,
        cibleTraceReste:0,fantomes:0,buis:0,camTout:0,revele:0,
        piece:-1,
        lastTr:null
      };
    };

    /* Complète les missions d'un joueur jusqu'à NB (selon son état : civil / imposteur / mort) */
    function remplir(j){
      while(j.missions.length<ManoirMissions.NB){
        const m=ManoirMissions.choisir(e.joueurs,j);
        if(!m)break;
        j.missions.push(m);
      }
    }

    e.notifier=(id,message)=>{e.notifs.push({id,message});};
    e.prendreNotifs=()=>{
      const a=e.notifs.slice();
      e.notifs.length=0;
      return a;
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

      /* Premières missions (une fois les camps connus) */
      Object.values(e.joueurs).forEach(j=>{j.missions=[];remplir(j);});

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
      j.poisonFurtif=false;
      j.tunnel=null;

      /* La mort remet tout à zéro : points, effets, capacités, mission en cours.
         Le fantôme reçoit ses propres missions. */
      j.points=0;
      j.bouclier=0;
      j.vitMult=1;j.vitReste=0;
      j.visBonus=0;j.visReste=0;
      j.invis=0;
      j.enCours=null;
      TIM.forEach(k=>{j[k]=0;});
      j.deguise=null;
      j.protegeVote=false;
      j.voteDouble=false;
      j.cartoReste=0;
      j.piece=-1;
      j.missions=[];
      remplir(j);

      if(creerCadavre){
        e.cadavres[j.id]={
          id:j.id,
          x:j.x,
          y:j.y,
          couleur:j.couleur,
          pseudo:j.pseudo,
          signale:false
        };
        const pi=pieceProche(j.x,j.y);
        e.dernierMort={lieu:pi>=0?PIECES[pi][2]:"un couloir",pseudo:j.pseudo,t:e.t};
      }

      e.mortsEnAttente.push(j.id);
      if(e.phase === 'jeu') verifierVictoire();

      /* Martyr assassiné : alarme immédiate */
      if(creerCadavre && j.role==='martyr' && e.phase==='jeu' && !e.fin){
        lancerReunion({id:j.id,pseudo:j.pseudo+" (Martyr)"},null);
      }
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

      /* strict : impossible d'attaquer à travers une vitre */
      if(distance>1.2||!voit(a.x,a.y,c.x,c.y,true))
        return {ok:false,message:"Joueur trop éloigné"};

      /* Protection temporaire (garde du corps, égide du martyr) : non consommée */
      if(c.gardeReste>0){
        a.cooldown=C.cooldownKill||25;
        e.notifier(c.id,"🛡️ Une protection t'a sauvé !");
        return {ok:true,message:"Ta cible était protégée…"};
      }

      /* Talisman : annule une attaque */
      if(c.bouclier>0){
        c.bouclier=0;
        a.cooldown=C.cooldownKill||25;
        e.notifier(c.id,"🛡️ Ton talisman s'est brisé : tu es sauvé !");
        return {ok:true,message:"Ta cible était protégée…"};
      }

      if(a.role==='empoisonneur'&&c.poison>0)
        return {ok:false,message:"Ce joueur est déjà empoisonné"};

      const furtif=a.furtif>0;
      a.cooldown=C.cooldownKill||25;

      /* Contre-attaque du chasseur : l'agresseur meurt aussi */
      let rip=false;
      if(c.riposte>0){
        c.riposte=0;
        rip=true;
        e.notifier(c.id,"🎯 Ta contre-attaque a frappé !");
        mourir(a,true);
      }

      if(a.role==='empoisonneur'){
        c.poison=15;
        c.poisonFurtif=furtif;
        return {ok:true,message:rip?"Piégé ! Le chasseur riposte…":"Joueur empoisonné"};
      }

      mourir(c,true);
      return {ok:true,message:rip?"Piégé ! Le chasseur riposte…":"Joueur éliminé"};
    };

    function terminer(gagnant){
      if(e.fin)return;
      if(typeof MN_VICTOIRE!=='undefined'&&!MN_VICTOIRE)return;

      e.fin={
        gagnant,
        roles:Object.values(e.joueurs).map(j=>{
          const r=MM_ROLES.find(x=>x.id===j.role)||{};
          return {pseudo:j.pseudo,role:r.nom||j.role,emoji:r.emoji||'',camp:j.camp,mort:j.mort};
        })
      };
      e.phase='fin';
      e.tPhase=0;
      e.alerte=null;
      Object.values(e.joueurs).forEach(j=>{j.dx=0;j.dy=0;});
    }

    function verifierVictoire(){
      if(e.fin)return;

      const vivants=Object.values(e.joueurs).filter(j=>!j.mort);
      const cult=vivants.filter(j=>j.camp==='cultiste').length;
      const inv=vivants.length-cult;

      let gagnant=null;
      if(cult===0)gagnant='invite';
      else if(cult>=inv)gagnant='cultiste';
      if(gagnant)terminer(gagnant);
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

      /* Vote double du garde du corps */
      Object.keys(v.votes).forEach(id=>{
        const cible=v.votes[id];
        if(cible!==null && compte[cible]!==undefined){
          const votant=e.joueurs[id];
          compte[cible]+=(votant&&votant.voteDouble)?2:1;
        }
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

      /* Immunité au vote (garde du corps) */
      if(elimine){
        const cj=e.joueurs[elimine.id];
        if(cj&&cj.protegeVote){
          e.notifier(cj.id,"🗳️ Ton immunité t'a sauvé du vote !");
          elimine=null;
        }
      }
      Object.values(e.joueurs).forEach(p=>{p.protegeVote=false;p.voteDouble=false;});

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
        const j=e.joueurs[id];
        mourir(j,false);

        /* Chasseur éliminé au vote : il peut emmener quelqu'un avec lui */
        if(j.role==='chasseur'){
          const vivants=Object.values(e.joueurs).filter(p=>!p.mort);
          if(vivants.length>1){
            e.chasse={id:j.id};
            e.phase='chasseur';
            e.tPhase=15;
            return;
          }
        }
      }

      // Les corps de la manche précédente disparaîtront à la reprise.
      e.phase='revelation';
      e.tPhase=3;
    }

    e.tirer=(id,cibleId)=>{
      if(e.phase!=='chasseur'||!e.chasse||e.chasse.id!==id)
        return {ok:false,message:"Action impossible"};
      const c=e.joueurs[cibleId];
      if(!c||c.mort||c.id===id)
        return {ok:false,message:"Cible invalide"};
      mourir(c,false);
      Object.keys(e.joueurs).forEach(k=>e.notifier(k,"🎯 Le chasseur a abattu "+c.pseudo+" !"));
      e.chasse=null;
      e.phase='revelation';
      e.tPhase=3;
      return {ok:true,message:"Tu as tiré sur "+c.pseudo};
    };

    function nouvelleManche(){
      verifierVictoire();
      if(e.fin)return;

      Object.values(e.joueurs).forEach(j=>{
        j.x=j.departX;
        j.y=j.departY;
        j.dx=0;
        j.dy=0;
        j.poison=0;
        j.poisonFurtif=false;
        j.cooldown=10;
        j.tunnel=null;
        j.enCours=null;
        j.lastTr=null;
        j.piece=-1;
      });

      e.cadavres={};
      e.traces=[];
      e.alerte=null;
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
        p.enCours=null;
      });

      e.alerte=null;                 // une réunion annule l'alerte
      e.phase='discussion';
      e.tPhase=C.dureeDiscussion||45;
    }

    e.signaler=(joueurId,cadavreId)=>{
      const j=e.joueurs[joueurId];
      const corps=e.cadavres[cadavreId];

      if(e.phase!=='jeu' || !j || j.mort || j.tunnel || !corps || corps.signale)
        return {ok:false,message:"Signalement impossible"};
      const distance=Math.hypot(j.x-corps.x,j.y-corps.y);
      if(distance>1.5||!voit(j.x,j.y,corps.x,corps.y,true))
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

    /* ───────────── MISSIONS ───────────── */

    /* Mission d'alerte (id -1) proposée aux invités vivants et aux esprits d'invités */
    function alerteMission(j){
      if(!e.alerte||j.camp==='cultiste'||e.alerte.faits.has(j.id))return null;
      const m=ManoirMissions.creer(e.alerte.mi,j.mort?'mort':'civil');
      m.id=-1;
      m.alerte=true;
      m.nom="🚨 "+m.nom;
      return m;
    }

    const trouverMission=(j,mid)=>mid===-1?alerteMission(j):j.missions.find(x=>x.id===mid);

    /* Le joueur ouvre le mini-jeu : il doit être sur place */
    e.missionDebut=(id,mid)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.tunnel)
        return {ok:false,message:"Action impossible"};
      const m=trouverMission(j,mid);
      if(!m)return {ok:false,message:"Ce n'est pas ta mission"};
      if(Math.hypot(j.x-m.x,j.y-m.y)>1.4)
        return {ok:false,message:"Trop loin de la mission"};
      j.enCours={id:mid,t:e.t};
      return {ok:true,message:m.nom};
    };

    /* Mission réussie : +1 point, puis une nouvelle mission différente */
    e.missionFin=(id,mid)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.tunnel)
        return {ok:false,message:"Action impossible"};
      const m=trouverMission(j,mid);
      if(!m||!j.enCours||j.enCours.id!==mid)
        return {ok:false,message:"Mission non commencée"};
      if(e.t-j.enCours.t<m.min){
        j.enCours=null;
        return {ok:false,message:"Trop rapide… recommence !"};
      }
      if(Math.hypot(j.x-m.x,j.y-m.y)>1.8){
        j.enCours=null;
        return {ok:false,message:"Tu t'es trop éloigné"};
      }

      j.enCours=null;
      j.points++;

      if(mid===-1){
        e.alerte.faits.add(j.id);
        if(e.alerte.faits.size>=e.alerte.requis){
          e.alerte=null;
          Object.keys(e.joueurs).forEach(k=>e.notifier(k,"✅ Alerte désamorcée !"));
        }
        return {ok:true,message:"Alerte relevée  +1 ★"};
      }

      j.missions=j.missions.filter(x=>x!==m);
      j.recent=(j.recent||[]).concat(m.id).slice(-4);
      remplir(j);
      return {ok:true,message:"Mission accomplie  +1 ★"};
    };

    /* ───────────── POUVOIRS ───────────── */

    function procheInvite(j){
      let best=null,d=5;
      Object.values(e.joueurs).forEach(o=>{
        if(o===j||o.mort||o.tunnel||o.camp==='cultiste')return;
        const k=Math.hypot(o.x-j.x,o.y-j.y);
        if(k<d){d=k;best=o;}
      });
      return best;
    }

    function vivantCible(j,cible,soi){
      const c=e.joueurs[cible];
      if(!c||c.mort||(c===j&&!soi))return null;
      return c;
    }

    function appliquer(j,p,cible){
      switch(p.effet){
        case 'vitesse':   j.vitMult=p.val;j.vitReste=p.duree;return {ok:true};
        case 'vision':    j.visBonus=p.val;j.visReste=p.duree;return {ok:true};
        case 'visionX':   j.visBonus=C.rayonVision*(p.val-1);j.visReste=p.duree;return {ok:true};
        case 'bouclier':
          if(j.bouclier>0)return {ok:false,message:"Tu as déjà un talisman"};
          j.bouclier=1;return {ok:true};
        case 'antidote':
          if(!(j.poison>0))return {ok:false,message:"Tu n'es pas empoisonné"};
          j.poison=0;j.poisonFurtif=false;return {ok:true};
        case 'camReset':  j.veilleurCd=0;return {ok:true};
        case 'cooldown':
          if(j.cooldown<=0)return {ok:false,message:"Ton attaque est déjà prête"};
          j.cooldown=0;return {ok:true};
        case 'invisible': j.invis=p.duree;return {ok:true};
        case 'camCoupe':  e.camCoupe=p.duree;return {ok:true};
        case 'camTout':   j.camTout=p.duree;return {ok:true};
        case 'furtif':    j.furtif=p.duree;return {ok:true};

        case 'ralentirTous':
          Object.values(e.joueurs).forEach(o=>{
            if(o.mort||o.camp==='cultiste')return;
            o.vitMult=p.val;o.vitReste=p.duree;
            e.notifier(o.id,"🕸️ Une force invisible te ralentit…");
          });
          return {ok:true};
        case 'aveuglerTous':
          Object.values(e.joueurs).forEach(o=>{
            if(o.mort||o.camp==='cultiste')return;
            o.visBonus=p.val;o.visReste=p.duree;
            e.notifier(o.id,"🌟 Un éclat t'aveugle…");
          });
          return {ok:true};

        case 'capaReset':
          if(!(j.capaCd>0))return {ok:false,message:"Ta capacité est déjà prête"};
          j.capaCd=0;return {ok:true};
        case 'traceCible':{
          const c=vivantCible(j,cible,false);
          if(!c)return {ok:false,message:"Choisis un joueur"};
          j.cibleTrace=c.id;j.cibleTraceReste=p.duree;
          return {ok:true};
        }
        case 'trappeVoir':{
          const n=Object.values(e.joueurs).filter(o=>o.tunnel).length;
          return {ok:true,message:n?"🕳️ Quelqu'un est dans les trappes !":"🕳️ Personne dans les trappes."};
        }
        case 'lieuMort':
          if(!e.dernierMort)return {ok:false,message:"Personne n'est mort pour l'instant"};
          return {ok:true,message:"📍 Le dernier mort est tombé : "+e.dernierMort.lieu};
        case 'fantomes':  j.fantomes=p.duree;return {ok:true};
        case 'buissons':  j.buis=p.duree;return {ok:true};

        case 'carte':     j.cartoReste=Math.max(j.cartoReste,p.duree);return {ok:true};
        case 'cartoReset':j.cartoCd=0;return {ok:true};
        case 'dernierPassage':{
          if(!Number.isInteger(cible)||!PIECES[cible])return {ok:false,message:"Choisis une pièce"};
          const d=e.derniers[cible];
          return {ok:true,message:d
            ?"🧭 "+PIECES[cible][2]+" : "+d.pseudo+" (il y a "+Math.round(e.t-d.t)+" s)"
            :"🧭 Personne n'est passé à "+PIECES[cible][2]};
        }

        case 'riposte':   j.riposte=p.duree;return {ok:true};
        case 'piege':
          if(e.pieges.filter(x=>x.id===j.id).length>=2)return {ok:false,message:"2 pièges maximum"};
          e.pieges.push({x:j.x,y:j.y,id:j.id});
          return {ok:true,message:"🪤 Piège posé"};

        case 'bouclierCible':{
          const c=vivantCible(j,cible,true);
          if(!c)return {ok:false,message:"Choisis un joueur"};
          if(c.bouclier>0)return {ok:false,message:"Cette personne est déjà protégée"};
          c.bouclier=1;
          if(c!==j)e.notifier(c.id,"🛡️ Un talisman t'a été offert.");
          return {ok:true};
        }
        case 'protegeVote':{
          const c=vivantCible(j,cible,true);
          if(!c)return {ok:false,message:"Choisis un joueur"};
          c.protegeVote=true;
          if(c!==j)e.notifier(c.id,"🗳️ Tu es protégé(e) lors du prochain vote.");
          return {ok:true};
        }
        case 'voteDouble': j.voteDouble=true;return {ok:true};
        case 'gardeSoi':   j.gardeReste=p.duree;return {ok:true};
        case 'reveler':    j.revele=p.duree;return {ok:true};

        case 'camSur':{
          const zi=ZONES.findIndex(z=>dedans(z,j.x,j.y));
          if(zi<0)return {ok:false,message:"Aucune caméra ne couvre cet endroit"};
          e.camSlot=1-e.camSlot;
          const slot=e.camSlot,autre=1-slot;
          if(e.camZ[autre]===zi)e.camZ[autre]=e.camZ[slot];
          e.camZ[slot]=zi;
          e.camT=C.dureeCamera||20;
          return {ok:true,message:"📹 CAM "+(slot+1)+" : "+ZONES[zi].nom};
        }

        case 'alerte':{
          if(e.alerte)return {ok:false,message:"Une alerte est déjà en cours"};
          const elig=Object.values(e.joueurs).filter(o=>o.camp!=='cultiste');
          if(elig.length<2)return {ok:false,message:"Pas assez d'invités ou d'esprits"};
          const mi=Math.floor(Math.random()*M.missions.length);
          e.alerte={mi,reste:p.duree,requis:2,faits:new Set()};
          const lieu=ManoirMissions.creer(mi,'civil').lieu||"un endroit précis";
          elig.forEach(o=>e.notifier(o.id,"🚨 ALERTE ! Mission urgente : "+lieu+" (30 s)"));
          return {ok:true};
        }
      }

      /* Pouvoirs des fantômes : ciblent l'invité vivant le plus proche */
      const c=procheInvite(j);
      if(!c)return {ok:false,message:"Aucun joueur à portée"};

      switch(p.effet){
        case 'visionProche':
          c.visBonus=p.val;c.visReste=p.duree;
          e.notifier(c.id,"🔆 Ta vue s'éclaircit mystérieusement…");
          return {ok:true};
        case 'vitesseProche':
          c.vitMult=p.val;c.vitReste=p.duree;
          e.notifier(c.id,"🍃 Un souffle te pousse en avant…");
          return {ok:true};
        case 'ralentirProche':
          c.vitMult=p.val;c.vitReste=p.duree;
          e.notifier(c.id,"👹 Une présence glaciale te ralentit…");
          return {ok:true};
        case 'aveuglerProche':
          c.visBonus=p.val;c.visReste=p.duree;
          e.notifier(c.id,"🌘 Les ténèbres se referment sur toi…");
          return {ok:true};
      }
      return {ok:false,message:"Pouvoir inconnu"};
    }

    e.acheter=(id,pid,cible)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j)
        return {ok:false,message:"Action impossible"};
      const p=ManoirMissions.pouvoirs(j.role,j.camp,j.mort).find(x=>x.id===pid);
      if(!p)return {ok:false,message:"Pouvoir indisponible"};
      if(j.points<p.cout)
        return {ok:false,message:"Il te manque "+(p.cout-j.points)+" ★"};
      const r=appliquer(j,p,cible);
      if(!r.ok)return r;
      j.points-=p.cout;
      return {ok:true,message:r.message||(p.emoji+" "+p.nom+" activé !")};
    };

    /* ───────────── CAPACITÉS DE RÔLE (bouton de base) ───────────── */

    e.capa=(id,cible)=>{
      const j=e.joueurs[id];
      if(e.phase!=='jeu'||!j||j.mort||j.tunnel)
        return {ok:false,message:"Action impossible"};
      if(j.capaCd>0)
        return {ok:false,message:"Attends encore "+Math.ceil(j.capaCd)+" s"};

      if(j.role==='detective'){
        j.empreintes=5;
        j.capaCd=15;
        return {ok:true,message:"👣 Empreintes révélées"};
      }

      if(j.role==='metamorphe'){
        const c=vivantCible(j,cible,false);
        if(!c)return {ok:false,message:"Choisis un joueur"};
        j.deguise={id:c.id,reste:15};
        j.capaCd=C.cooldownMeta||35;
        return {ok:true,message:"🎭 Tu as l'apparence de "+c.pseudo};
      }

      if(j.role==='garde'){
        const c=vivantCible(j,cible,true);
        if(!c)return {ok:false,message:"Choisis un joueur"};
        c.gardeReste=15;
        j.capaCd=C.cooldownGarde||40;
        if(c!==j)e.notifier(c.id,"🛡️ Un garde du corps veille sur toi (15 s)");
        return {ok:true,message:"🛡️ "+c.pseudo+" est protégé(e) 15 s"};
      }

      return {ok:false,message:"Tu n'as pas de capacité active"};
    };

    /* ───────────── BOUCLE ───────────── */

    e.maj=dt=>{
      e.t+=dt;

      for(const j of Object.values(e.joueurs)){
        if(j.cooldown>0)j.cooldown=Math.max(0,j.cooldown-dt);
        if(j.trappeCd>0)j.trappeCd=Math.max(0,j.trappeCd-dt);
        if(j.veilleurCd>0)j.veilleurCd=Math.max(0,j.veilleurCd-dt);
        if(j.capaCd>0)j.capaCd=Math.max(0,j.capaCd-dt);
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

      if(e.phase==='chasseur'){
        e.tPhase-=dt;
        if(e.tPhase<=0){
          e.chasse=null;
          e.phase='revelation';
          e.tPhase=3;
        }
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

      if(e.camCoupe>0)e.camCoupe=Math.max(0,e.camCoupe-dt);

      /* Alerte des imposteurs morts : si le temps est écoulé, ils gagnent */
      if(e.alerte){
        e.alerte.reste-=dt;
        if(e.alerte.reste<=0){
          e.alerte=null;
          terminer('cultiste');
          if(e.fin)return;
        }
      }

      if(ZONES.length>1){
        e.camT-=dt;
        if(e.camT<=0){
          e.camZ=e.camZ.map(i=>(i+2)%ZONES.length);
          e.camT=C.dureeCamera||20;
        }
      }

      for(const j of Object.values(e.joueurs)){
        /* effets temporaires */
        if(j.vitReste>0){j.vitReste-=dt;if(j.vitReste<=0){j.vitReste=0;j.vitMult=1;}}
        if(j.visReste>0){j.visReste-=dt;if(j.visReste<=0){j.visReste=0;j.visBonus=0;}}
        if(j.invis>0)j.invis=Math.max(0,j.invis-dt);
        for(const k of TIM)if(j[k]>0)j[k]=Math.max(0,j[k]-dt);

        if(j.deguise){
          j.deguise.reste-=dt;
          if(j.deguise.reste<=0||!e.joueurs[j.deguise.id])j.deguise=null;
        }

        /* Cartographe : révélation automatique de 5 s toutes les 25 s */
        if(j.role==='cartographe'&&!j.mort){
          if(j.cartoReste>0)j.cartoReste=Math.max(0,j.cartoReste-dt);
          j.cartoCd-=dt;
          if(j.cartoCd<=0){
            j.cartoCd=25;
            j.cartoReste=Math.max(j.cartoReste,5);
          }
        }

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

        const vm=j.fige>0?0:(j.vitReste>0?j.vitMult:1);
        const vx=j.dx*C.vitesse*vm*dt;
        const vy=j.dy*C.vitesse*vm*dt;

        if(j.mort){
          j.x=Math.max(.3,Math.min(M.largeur-.3,j.x+vx));
          j.y=Math.max(.3,Math.min(M.hauteur-.3,j.y+vy));
        }else{
          const r=C.rayonJoueur;
          if(libre(j.x+vx,j.y,r))j.x+=vx;
          if(libre(j.x,j.y+vy,r))j.y+=vy;

          /* Empreintes (un pas tous les 0,6 case) */
          if(j.dx||j.dy){
            const l=j.lastTr;
            if(!l||Math.hypot(j.x-l[0],j.y-l[1])>=.6){
              e.traces.push({x:j.x,y:j.y,t:e.t,id:j.id});
              j.lastTr=[j.x,j.y];
            }
          }

          /* Dernier passage dans chaque pièce */
          const idx=pieceProche(j.x,j.y);
          if(idx>=0&&idx!==j.piece)e.derniers[idx]={id:j.id,pseudo:j.pseudo,t:e.t};
          j.piece=idx;

          /* Pièges du chasseur (invisibles) */
          for(let k=e.pieges.length-1;k>=0;k--){
            const pg=e.pieges[k];
            if(pg.id!==j.id&&Math.hypot(pg.x-j.x,pg.y-j.y)<.8){
              e.pieges.splice(k,1);
              j.fige=5;
              e.notifier(j.id,"🪤 Tu es pris dans un piège !");
              e.notifier(pg.id,"🪤 Ton piège a capturé "+j.pseudo);
              break;
            }
          }
        }
      }

      while(e.traces.length&&e.t-e.traces[0].t>30)e.traces.shift();
    };

    e.camsActives=()=>{
      if(e.camCoupe>0)return [];
      const l=[];
      e.camZ.forEach(i=>{
        const z=ZONES[i];
        if(z&&!l.includes(z))l.push(z);
      });
      return l;
    };

    /* Ids des joueurs dévoilés sur la carte de l'hôte (cartographe, balise du martyr) */
    e.reveles=()=>{
      const tous=Object.values(e.joueurs);
      const vivants=tous.filter(p=>!p.mort&&!p.tunnel&&!(p.invis>0));
      if(tous.some(p=>!p.mort&&p.role==='cartographe'&&p.cartoReste>0))
        return vivants.map(p=>p.id);
      return vivants.filter(p=>p.revele>0).map(p=>p.id);
    };

    /* 0 = rien, 1 = point orange (filmé dans < 5 s), 2 = point rouge (filmé) */
    function etatCamera(j){
      if(e.camCoupe>0||j.invis>0)return 0;
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
      j.enCours=null;
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

    /* Phase vue par les écrans : « chasseur » s'affiche comme la révélation */
    const phaseVue=()=>e.phase==='chasseur'?'revelation':e.phase;

    e.etatHote=()=>{
      const ph=phaseVue();
      return {
        phase:ph,
        reste:Math.max(0,Math.ceil(e.tPhase)),
        fin:e.fin||null,
        vote:e.vote?{
          total:Object.values(e.joueurs).filter(j=>!j.mort).length,
          votesRecus:Object.keys(e.vote.votes).length,
          candidats:ph==='resultats'||ph==='revelation'
            ?e.vote.resultats
            :e.vote.candidats,
          details:e.vote.details,
          elimine:e.vote.elimine,
          reporter:e.vote.signalePar,
          corps:e.vote.corps
        }:null
      };
    };

    e.vue=id=>{
      const j=e.joueurs[id];
      if(!j)return null;

      const ph=phaseVue();
      const autres=[],cadavres=[];

      /* Rayon de vision : base + bonus/malus temporaire (minimum 2 cases) */
      const rv=Math.max(2,C.rayonVision+(j.visReste>0?j.visBonus:0));
      const enZone=o=>ZONES.some(z=>dedans(z,o.x,o.y));

      /* Joueur : [idRéel, x, y, couleur, pseudo, empoisonné, vuParCaméra, fantôme, idAvatar] */
      for(const o of Object.values(e.joueurs)){
        if(o===j)continue;

        if(o.mort){
          /* Médium : voir les fantômes proches */
          if(!j.mort&&j.fantomes>0&&Math.hypot(o.x-j.x,o.y-j.y)<=rv&&voit(j.x,j.y,o.x,o.y))
            autres.push([o.id,+o.x.toFixed(2),+o.y.toFixed(2),"#8cecff",o.pseudo,0,0,1,o.id]);
          continue;
        }

        if(o.tunnel&&!j.mort)continue;
        if(o.invis>0&&!j.mort)continue;              // invisibilité

        const lim=typeCase(o.x,o.y)==='~'?(j.buis>0?rv:C.rayonBuisson):rv;
        /* voit() non strict : on voit à travers les vitres */
        const vu=j.mort || (Math.hypot(o.x-j.x,o.y-j.y)<=lim && voit(j.x,j.y,o.x,o.y));
        /* Veilleur : toutes les caméras */
        const force=!vu&&!j.mort&&j.camTout>0&&enZone(o);

        if(vu||force){
          const ap=(o.deguise&&e.joueurs[o.deguise.id])||o;   // métamorphe
          autres.push([o.id,+o.x.toFixed(2),+o.y.toFixed(2),ap.couleur,ap.pseudo,
            (o.poison>0&&!o.poisonFurtif)?1:0,force?1:0,0,ap.id]);
        }
      }

      for(const corps of Object.values(e.cadavres)){
        if(j.mort || (Math.hypot(corps.x-j.x,corps.y-j.y)<=rv && voit(j.x,j.y,corps.x,corps.y))){
          cadavres.push([corps.id,+corps.x.toFixed(2),+corps.y.toFixed(2),
            corps.couleur,corps.pseudo,corps.signale]);
        }
      }

      /* Détective : empreintes */
      let traces=null;
      if(!j.mort&&(j.empreintes>0||j.cibleTraceReste>0)){
        const cible=j.cibleTraceReste>0?j.cibleTrace:null;
        const dureeMax=cible?30:20;
        traces=[];
        for(let k=e.traces.length-1;k>=0&&traces.length<150;k--){
          const t=e.traces[k];
          if(t.id===j.id)continue;
          const age=e.t-t.t;
          if(cible){
            if(t.id!==cible)continue;
          }else if(age>dureeMax||Math.hypot(t.x-j.x,t.y-j.y)>7)continue;
          traces.push([+t.x.toFixed(1),+t.y.toFixed(1),+(age/dureeMax).toFixed(2),
            cible?((e.joueurs[cible]||{}).couleur||null):null]);
        }
      }

      /* Liste des joueurs vivants pour les capacités à cible */
      const veutListe=!j.mort&&(j.role==='metamorphe'||j.role==='detective'||j.role==='garde');
      const liste=veutListe
        ?Object.values(e.joueurs).filter(o=>!o.mort&&(o!==j||j.role==='garde')).map(o=>[o.id,o.pseudo])
        :null;

      const alerte=e.alerte?{
        reste:Math.ceil(e.alerte.reste),
        faits:e.alerte.faits.size,
        requis:e.alerte.requis,
        mission:alerteMission(j)
      }:null;

      const chasse=(e.phase==='chasseur'&&e.chasse&&e.chasse.id===id)
        ?{candidats:Object.values(e.joueurs).filter(o=>!o.mort).map(o=>[o.id,o.pseudo])}
        :null;

      const voteTelephone=e.vote?{
        candidats:e.vote.candidats,
        aVote:Object.prototype.hasOwnProperty.call(e.vote.votes,id),
        elimine:ph==='revelation'?e.vote.elimine:null,
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
        phase:ph,
        reste:Math.max(0,Math.ceil(e.tPhase)),
        vote:voteTelephone,
        fin:e.fin||null,
        cam:etatCamera(j),
        trappeCd:+(j.trappeCd||0).toFixed(1),
        tunnel:j.tunnel?{reste:Math.ceil(j.tunnel.reste)}:null,
        cloches:j.cloches||0,
        camZ:j.role==='veilleur'?e.camZ.slice():null,
        veilleurCd:+(j.veilleurCd||0).toFixed(1),
        /* missions & pouvoirs */
        rayon:+rv.toFixed(1),
        points:j.points,
        bouclier:j.bouclier,
        missions:j.missions,
        alerte,
        /* capacités de rôle */
        capaCd:+(j.role==='cartographe'?j.cartoCd:j.capaCd).toFixed(1),
        capaActif:+(j.role==='detective'?j.empreintes
          :j.role==='metamorphe'?(j.deguise?j.deguise.reste:0)
          :j.role==='cartographe'?j.cartoReste:0).toFixed(1),
        liste,
        traces,
        chasse,
        pieges:j.role==='chasseur'?e.pieges.filter(p=>p.id===j.id).map(p=>[p.x,p.y]):null,
        zonesTout:j.camTout>0?ZONES.map(z=>[z.x,z.y,z.l,z.h]):null
      };
    };

    return e;
  }

  return {nouveau,mur,opaque,voit,typeCase,zones:ZONES};
})();
