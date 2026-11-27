/* spity-cameleon-missions.js
   Missions (données, choix, mini-jeux) et boutique de pouvoirs.
   À charger APRÈS la carte (MANOIR_MAP) et AVANT le moteur.

   - Chaque mission de la carte est rattachée au lieu le plus proche (M.pieces).
   - Chaque lieu a des tâches différentes pour : civil / imposteur / mort.
   - Les missions ne font PAS gagner : 1 mission = 1 point, les points
     s'échangent contre des pouvoirs (voir POUVOIRS plus bas).
*/
const ManoirMissions = (() => {
  const M = MANOIR_MAP;
  const NB = 2;                     // missions visibles en même temps par joueur

  const T = (emoji, nom, type, p, desc) => ({ emoji, nom, type, p, desc });

  /* Types de mini-jeux : hold (maintenir), tap (taper), seq (mémoriser),
     ordre (toucher 1→n), curseur (arrêter dans la zone). p = difficulté.
     IMPORTANT : une entrée par lieu, dans le MÊME ORDRE que MANOIR_MAP.pieces.
     Chaque catégorie a 2 variantes, alternées selon la mission du lieu. */
  const TACHES = [
    /* 0 · Le Repaire des Tapirs */ {
      civil: [T("🥣", "Remplir l’auge", "hold", 3, "Verse la pitance jusqu’à ras bord."),
              T("🧹", "Nettoyer l’enclos", "tap", 18, "Balaie la paille souillée.")],
      imposteur: [T("🕳️", "Creuser un terrier", "tap", 20, "Gratte la terre pour y cacher une preuve."),
                  T("🐾", "Brouiller les traces", "seq", 4, "Efface les empreintes une à une.")],
      mort: [T("🌾", "Froisser la paille", "tap", 15, "Fais bruisser la paille comme un souffle."),
             T("🌙", "Hanter l’enclos", "curseur", 3, "Glisse-toi dans le rêve des tapirs.")]
    },
    /* 1 · Le Temple du Jaguar */ {
      civil: [T("🗿", "Aligner les glyphes", "ordre", 6, "Touche les glyphes dans l’ordre sacré."),
              T("🔥", "Raviver le brasero", "hold", 3, "Maintiens la flamme sacrée.")],
      imposteur: [T("🩸", "Graver un signe interdit", "seq", 5, "Reproduis le rituel du culte."),
                  T("🗝️", "Forcer l’autel", "curseur", 3, "Crochète la serrure au bon moment.")],
      mort: [T("🕯️", "Souffler les bougies", "tap", 16, "Fais vaciller les flammes du temple."),
             T("👁️", "Réveiller l’idole", "seq", 4, "Murmure la séquence oubliée.")]
    },
    /* 2 · Le Sentier des Lianes */ {
      civil: [T("🌿", "Tresser les lianes", "seq", 4, "Rejoue le nœud des explorateurs."),
              T("🪢", "Renforcer la rampe", "tap", 20, "Serre les cordages.")],
      imposteur: [T("✂️", "Couper une liane piège", "curseur", 3, "Tranche net, sans bruit."),
                  T("🪤", "Poser un collet", "ordre", 6, "Arme le piège dans l’ordre.")],
      mort: [T("🍃", "Faire frémir le feuillage", "tap", 18, "Agite les feuilles."),
             T("🌫️", "Épaissir la brume", "hold", 3, "Souffle une brume glacée.")]
    },
    /* 3 · Le Camp de l’Explorateur */ {
      civil: [T("🧭", "Calibrer la boussole", "curseur", 3, "Stoppe l’aiguille sur le nord."),
              T("⛺", "Replier la tente", "ordre", 7, "Plie les pans dans l’ordre.")],
      imposteur: [T("🗺️", "Falsifier la carte", "ordre", 7, "Modifie les repères sans te faire voir."),
                  T("🔪", "Aiguiser la machette", "hold", 4, "Affûte la lame en douce.")],
      mort: [T("📜", "Feuilleter le journal", "hold", 3, "Tourne les pages d’une main spectrale."),
             T("🔦", "Faire clignoter la lampe", "seq", 4, "Envoie un signal depuis l’au-delà.")]
    },
    /* 4 · La Serre aux Orchidées */ {
      civil: [T("🌺", "Arroser les orchidées", "hold", 4, "Verse l’eau avec patience."),
              T("🌱", "Rempoter un plant", "tap", 18, "Tasse la terre fraîche.")],
      imposteur: [T("☠️", "Empoisonner le nectar", "seq", 5, "Dose le venin dans le bon ordre."),
                  T("🥀", "Faner une fleur rare", "curseur", 4, "Flétris-la au bon moment.")],
      mort: [T("🥀", "Faire éclore une fleur fantôme", "curseur", 3, "Rythme la floraison."),
             T("🌸", "Disperser le pollen", "tap", 20, "Souffle les spores dans l’air.")]
    },
    /* 5 · La Grotte aux Chauves-souris */
    {
      civil: [T("🔥", "Torches dans le noir", "torches", 4, "Éclaire la grotte avec ta lampe et rallume chaque torche."),
              T("🔊", "Écho de cristaux", "sonar", 3, "Envoie des échos pour trouver les cristaux cachés.")],
      imposteur: [T("🪨", "Condamner le passage", "pierres", 6, "Empile les pierres pour bloquer la galerie."),
                  T("🌬️", "Éteindre les torches", "eteindre", 6, "Souffle toutes les torches avant qu’elles ne se rallument.")],
      mort: [T("🦇", "Mener les chauves-souris", "nuee", 5, "Guide la nuée jusqu’à la sortie sans toucher les stalactites."),
             T("🌑", "Aspirer la lumière", "trou", 15, "Avale les lucioles avant la fin du temps.")]
    },
    /* 6 · La Cascade Cachée */ {
      {
      civil: [T("🔧", "Détourner le courant", "tuyaux", 2, "Fais pivoter les tuyaux pour relier la source au bassin."),
              T("🫙", "Remplir les gourdes", "rampes", 20, "Trace des rampes pour guider l’eau jusqu’aux gourdes.")],
      imposteur: [T("☠️", "Poison indétectable", "poison", 2, "Reproduis la couleur de l’eau pour que personne ne remarque rien."),
                  T("🗝️", "Crocheter la vanne", "crochet", 3, "Trouve le bon réglage de chaque goupille.")],
      mort: [T("🪨", "Ricochets fantômes", "ricochet", 6, "Fais rebondir la pierre en touchant à chaque impact."),
             T("🌊", "Chute dans la cascade", "chute", 8, "Évite les rochers et attrape les gouttes lumineuses.")]
    },
    /* 7 · Le Nid des Perroquets */
    {
      civil: [T("🦜", "Répéter le mot du perroquet", "parole", 3, "Écoute-le bien, puis répète-le syllabe par syllabe."),
              T("🪽", "Faire voler le perroquet", "vol", 7, "Touche pour battre des ailes et passe entre les troncs.")],
      imposteur: [T("🪶", "Plumes discrètes", "plumes", 6, "Pince les plumes sans réveiller le perroquet."),
                  T("🥚", "Échanger l’œuf", "gobelets", 3, "Suis l’œuf piégé sans te tromper de nid.")],
      mort: [T("🎸", "Concert fantôme", "guitar", 12, "Joue la mélodie des cris sur la bonne piste."),
             T("🌪️", "Faire s’envoler le nid", "tourbillon", 8, "Fais des cercles pour lever un vent d’outre-tombe.")]
    },
    /* 8 · La Mare aux Crocodiles */ {
      civil: [T("🥚", "Protéger les œufs", "oeufs", 15, "Écrase les serpents qui rôdent autour du nid."),
              T("🐊", "Nourrir les crocodiles", "nourrir", 4, "Donne à chacun la nourriture qu’il réclame.")],
      imposteur: [T("🔨", "Casser les œufs", "casser", 15, "Écrase les œufs avant qu’ils n’éclosent."),
                  T("🍽️", "Servir les crocodiles", "avatars", 10, "Jette des joueurs dans la gueule des crocodiles.")],
      mort: [T("🧺", "Sauver les œufs", "panier", 15, "Rattrape les œufs qui tombent du ciel."),
             T("🛟", "Sauver le joueur", "sauver", 15, "Repousse les crocodiles avant qu’ils ne l’attrapent.")]
    },
    /* 9 · Le Pont des Singes */
    {
      civil: [T("🪢", "Retendre les cordes", "cordes", 7, "Garde les deux cordes tendues, ni trop ni trop peu."),
              T("🍌", "Trier les bananes", "bananes", 12, "Mûres à droite, pourries à gauche, vertes en haut.")],
      imposteur: [T("🪚", "Scier la planche", "scie", 6, "Scie à rythme régulier sans réveiller les singes."),
                  T("🛢️", "Huiler les planches", "huile", 90, "Étale l’huile partout, mais cache-toi du garde.")],
      mort: [T("🌉", "Balancer le pont", "balancier", 36, "Pousse le pont au bon moment pour le faire osciller."),
             T("🏹", "Fronde fantôme", "fronde", 5, "Lance des bananes sur les singes moqueurs.")]
    },
    /* 10 · La Grande Clairière */ {
      civil: [T("🔥", "Allumer le feu de camp", "hold", 3, "Souffle sur les braises."),
              T("🪵", "Empiler le bois", "tap", 18, "Range les bûches.")],
      imposteur: [T("🪓", "Fendre du bois noir", "tap", 20, "Frappe fort et en silence."),
                  T("🌀", "Tracer un cercle rituel", "ordre", 7, "Dessine les points du cercle.")],
      mort: [T("✨", "Danser avec les lucioles", "seq", 4, "Suis leur ballet."),
             T("🌙", "Veiller sous la lune", "hold", 3, "Reste immobile et lumineux.")]
    }
  ];

  /* Tâches de secours si la carte a plus de lieux que ce tableau */
  const GENERIQUE = {
    civil: [T("📦", "Trier le matériel", "ordre", 6, "Range tout dans l’ordre.")],
    imposteur: [T("🧪", "Préparer un mauvais coup", "seq", 4, "Prépare ton prochain geste.")],
    mort: [T("👻", "Hanter les lieux", "tap", 16, "Fais frissonner les environs.")]
  };

  const PIECES = M.pieces || [];

  /* Lieu le plus proche de chaque mission + rang de la mission dans ce lieu */
  const LIEU = M.missions.map(m => {
    let b = 0, bd = 1e9;
    PIECES.forEach((p, i) => {
      const d = Math.hypot(p[0] - m[0], p[1] - m[1]);
      if (d < bd) { bd = d; b = i; }
    });
    return b;
  });
  const RANG = (() => {
    const c = {};
    return LIEU.map(l => (c[l] = c[l] == null ? 0 : c[l] + 1));
  })();

  /* Durée minimale réaliste (secondes) : anti-triche côté hôte */
  const dureeMin = (t, p) =>
    t === "oeufs" || t === "casser" || t === "panier" || t === "sauver" ? p * .9 :
    t === "nourrir" ? p * 2.2 :
    t === "avatars" ? p * .9 :
    t === "parole" ? p * 3.5 :
    t === "vol" ? p * .9 :
    t === "plumes" ? p * 1.0 :
    t === "gobelets" ? p * 5 :
    t === "guitar" ? p * .5 :
    t === "tourbillon" ? p * .5 :
    t === "cordes" ? p * .9 :
    t === "bananes" ? p * .9 :
    t === "scie" ? p * .9 :
    t === "huile" ? p * .07 :
    t === "balancier" ? p * .17 :
    t === "fronde" ? p * 1.4 :
    t === "torches" ? p * 1.5 :
    t === "sonar" ? p * 1.6 :
    t === "pierres" ? p * 1.2 :
    t === "eteindre" ? p * .3 :
    t === "nuee" ? p * .5 :
    t === "trou" ? p * .4 :
    t === "tuyaux" ? p * 3 :
    t === "rampes" ? p * .35 :
    t === "poison" ? p * 3 :
    t === "crochet" ? p * 1.5 :
    t === "ricochet" ? p * .8 :
    t === "chute" ? p * .8 :
    t === "hold" ? p * .85 :
    t === "tap" ? p * .12 :
    t === "seq" ? p * .6 + 1.2 :
    t === "ordre" ? p * .35 : p * .5;

  const categorie = j => j.mort ? "mort" : j.camp === "cultiste" ? "imposteur" : "civil";

  function creer(i, cat) {
    const l = LIEU[i], liste = (TACHES[l] || GENERIQUE)[cat], t = liste[RANG[i] % liste.length];
    return {
      id: i, cat,
      x: M.missions[i][0] + .5, y: M.missions[i][1] + .5,
      lieu: (PIECES[l] || [])[2] || "",
      emoji: t.emoji, nom: t.nom, type: t.type, p: t.p, desc: t.desc,
      min: +dureeMin(t.type, t.p).toFixed(1)
    };
  }

  /* Choisit une nouvelle mission pour j : jamais celles qu'il a déjà, ni les
     4 dernières finies, et en priorité les emplacements les moins "chargés". */
  function choisir(joueurs, j) {
    const cat = categorie(j), ids = M.missions.map((_, i) => i);
    const pris = new Set(j.missions.map(m => m.id));
    const noms = new Set(j.missions.map(m => m.nom));
    const recent = j.recent || [];
    const charge = ids.map(() => 0);
    Object.values(joueurs).forEach(o => o.missions.forEach(m => charge[m.id]++));

    let cand = ids.filter(i => !pris.has(i) && !recent.includes(i) && !noms.has(creer(i, cat).nom));
    if (!cand.length) cand = ids.filter(i => !pris.has(i));
    if (!cand.length) return null;
    const mini = Math.min(...cand.map(i => charge[i]));
    cand = cand.filter(i => charge[i] === mini);
    return creer(cand[Math.floor(Math.random() * cand.length)], cat);
  }

  /* ───────────────────────── BOUTIQUE DE POUVOIRS ─────────────────────────
     Clé = id du rôle, sinon "invite" / "cultiste". Morts : mort_invite / mort_cultiste.
     P(id, emoji, nom, coût, description, effet, valeur, durée en s, cible)
     cible = "joueur" ou "piece" : le téléphone demande de choisir avant d'acheter. */
  const P = (id, emoji, nom, cout, desc, effet, val, duree, cible) =>
    ({ id, emoji, nom, cout, desc, effet, val: val || 0, duree: duree || 0, cible: cible || null });

  const sprint = P("sprint", "👟", "Sprint", 3, "+40 % de vitesse pendant 8 s", "vitesse", 1.4, 8);
  const sprint2 = P("sprint2", "💨", "Sprint x2", 4, "Vitesse x2 pendant 8 s", "vitesse", 2, 8);
  const lanterne = P("lanterne", "🏮", "Lanterne", 3, "Vision +1,5 case pendant 20 s", "vision", 1.5, 20);
  const talisman = P("talisman", "🛡️", "Talisman", 5, "Annule la prochaine attaque ou le prochain poison", "bouclier");
  const lame = P("lame", "🗡️", "Lame affûtée", 3, "Ton attaque est rechargée instantanément", "cooldown");
  const court = P("court", "⚡", "Court-circuit", 4, "Coupe les caméras pendant 15 s", "camCoupe", 1, 15);
  const ombre = (n, d, c) => P("ombre", "🌑", n, c, "Invisible (joueurs et caméras) pendant " + d + " s", "invisible", 1, d);

  const POUVOIRS = {
    /* ── Camp des cultistes ── */
    cultiste: [court, sprint2, lame],
    empoisonneur: [
      P("furtif", "🫥", "Poison furtif", 4, "Tes victimes ne verdissent pas pendant 30 s", "furtif", 1, 30),
      P("entrave", "🕸️", "Entrave", 5, "Ralentit tous les joueurs hors imposteurs pendant 15 s", "ralentirTous", .6, 15),
      P("fiole", "🧪", "Fiole fraîche", 3, "Ton poison est rechargé instantanément", "cooldown")],
    metamorphe: [
      ombre("Voile d’ombre", 8, 5), lame,
      P("eblouir", "🌟", "Éblouissement", 5, "Réduit la vision de tous les civils pendant 10 s", "aveuglerTous", -3.5, 10)],

    /* ── Camp des invités ── */
    invite: [sprint, lanterne, talisman],
    innocent: [sprint, P("lanterne2", "🏮", "Longue-vue", 3, "Vision +2 cases pendant 15 s", "vision", 2, 15), ombre("Disparition", 5, 4)],
    veilleur: [
      P("toutes", "📺", "Toutes les caméras", 5, "Voit les joueurs filmés par TOUTES les caméras pendant 12 s", "camTout", 1, 12),
      P("lynx2", "🦉", "Vision x2", 3, "Vision doublée pendant 15 s", "visionX", 2, 15),
      P("lynx", "🔄", "Recharge caméras", 2, "Tu peux changer de caméra tout de suite", "camReset")],
    detective: [
      P("recharge", "🔁", "Recharge", 2, "Tes empreintes sont de nouveau disponibles", "capaReset"),
      P("pisteur", "🐾", "Pisteur", 4, "Voit les empreintes d’un seul joueur pendant 30 s", "traceCible", 1, 30, "joueur"),
      P("trappes", "🕳️", "Détecteur de trappes", 3, "Voit les joueurs cachés dans les trappes pendant 20 s", "trappeVoir", 1, 20)],
    medium: [
      P("lieu", "📍", "Lieu du drame", 3, "Révèle la pièce où est mort le dernier joueur", "lieuMort"),
      P("esprits", "👻", "Voir les esprits", 7, "Voit les fantômes proches pendant 20 s", "fantomes", 1, 20),
      P("buissons", "🌿", "Œil des buissons", 3, "Voit dans les buissons de loin pendant 20 s", "buissons", 1, 20)],
    cartographe: [
      P("carte", "🗺️", "Carte étendue", 4, "Dévoile tout le monde sur la carte de l’hôte pendant 15 s", "carte", 15, 15),
      P("relance", "🔁", "Recharge", 3, "Relance ta révélation immédiatement", "capaReset"),
      P("passage", "🧭", "Dernier passage", 3, "Choisis une pièce : qui y est passé en dernier ?", "dernierPassage", 1, 0, "piece")],
    chasseur: [
      P("riposte", "🎯", "Contre-attaque", 5, "Si les imposteurs te tuent dans les 40 s, ils meurent avec toi", "riposte", 1, 40),
      P("piege", "🪤", "Piège invisible", 4, "Fige 5 s le premier qui marche dessus", "piege", 1, 5),
      sprint],
    garde: [
      P("offert", "🛡️", "Bouclier offert", 4, "Donne un talisman à la personne de ton choix", "bouclierCible", 1, 0, "joueur"),
      P("immunite", "🗳️", "Immunité au vote", 5, "Protège la personne choisie du prochain vote", "protegeVote", 1, 0, "joueur"),
      P("double", "✌️", "Vote double", 4, "Ton prochain vote compte double", "voteDouble")],
    martyr: [
      sprint,
      P("egide", "🔰", "Égide", 4, "Te protège des imposteurs pendant 15 s", "gardeSoi", 1, 15),
      P("balise", "📡", "Balise", 3, "Révèle ta position sur la carte de l’hôte pendant 10 s", "reveler", 1, 10)],

    /* ── Esprits ── */
    mort_invite: [
      P("camsur", "📹", "Œil fantôme", 3, "Une caméra filme la pièce où tu te trouves", "camSur"),
      P("souffle", "🍃", "Souffle d’élan", 3, "Le joueur proche gagne +80 % de vitesse pendant 10 s", "vitesseProche", 1.8, 10),
      P("eclaireur", "🔆", "Éclaireur", 2, "Le joueur proche voit +3 cases pendant 20 s", "visionProche", 3, 20)],
    mort_cultiste: [
      P("polter", "👹", "Poltergeist", 3, "Ralentit le joueur vivant le plus proche pendant 15 s", "ralentirProche", .6, 15),
      P("obscur", "🌘", "Obscurité", 4, "Réduit la vision du joueur le plus proche pendant 10 s", "aveuglerProche", -3.5, 10),
      P("alerte", "🚨", "Alerte", 6, "2 invités ou esprits doivent accomplir une mission urgente en 30 s, sinon les imposteurs gagnent", "alerte", 1, 30)]
  };

  const pouvoirs = (role, camp, mort) => {
    const c = camp === "cultiste" ? "cultiste" : "invite";
    return mort ? POUVOIRS["mort_" + c] : (POUVOIRS[role] || POUVOIRS[c]);
  };

  /* ───────────────────────── MINI-JEUX (téléphone) ───────────────────────── */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  let cssOk = false;
  function css() {
    if (cssOk) return; cssOk = true;
    const s = document.createElement("style");
    s.textContent = `
.mnMi{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(3,8,6,.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;animation:mnMiIn .25s ease;touch-action:manipulation}
.mnMiCard{--c:#4cd9b0;width:min(420px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:22px 20px 16px;border-radius:26px;text-align:center;background:linear-gradient(160deg,rgba(255,255,255,.13),rgba(255,255,255,.04));border:1.5px solid rgba(255,255,255,.18);box-shadow:0 20px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.15)}
.mnMiCard.imp{--c:#ff5468}
.mnMiCard.mort{--c:#8cecff}
.mnMiL{font-size:.8rem;font-weight:800;letter-spacing:.12em;color:var(--c)}
.mnMiE{font-size:3.2rem;line-height:1.15;margin-top:4px}
.mnMiT{font-size:1.35rem;font-weight:800;margin-top:2px}
.mnMiD{font-size:.95rem;opacity:.75;margin:4px 0 14px}
.mnMiBar{height:8px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:16px}
.mnMiBar i{display:block;height:100%;width:0;border-radius:99px;background:var(--c);transition:width .15s}
.mnMiG{min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.mnMiHint{font-weight:700;opacity:.7;font-size:.95rem}
.mnMiX{margin-top:10px;background:none;border:0;color:rgba(255,255,255,.55);font-weight:700;padding:8px 14px}
.mnMiHold,.mnMiTap{width:170px;height:170px;border-radius:50%;border:0;position:relative;display:flex;align-items:center;justify-content:center;font-size:3.4rem;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.mnMiHold{background:conic-gradient(var(--c) 0deg,rgba(255,255,255,.12) 0deg)}
.mnMiHold::before{content:"";position:absolute;inset:12px;border-radius:50%;background:#0b1511}
.mnMiHold span{position:relative;transition:transform .15s}
.mnMiHold.on span{transform:scale(1.2)}
.mnMiTap{border:3px solid var(--c);background:radial-gradient(circle,rgba(255,255,255,.16),rgba(255,255,255,.03));box-shadow:0 0 28px rgba(255,255,255,.12)}
.mnMiTap.pop{animation:mnPop .15s}
.mnMiPad{display:grid;grid-template-columns:repeat(2,96px);gap:12px}
.mnMiPadB{height:96px;border:0;border-radius:22px;font-size:2rem;color:rgba(0,0,0,.45);opacity:.5;transition:opacity .1s,transform .1s,filter .1s;touch-action:manipulation}
.mnMiPadB.on{opacity:1;filter:brightness(1.5);transform:scale(1.07)}
.mnMiPad.bad{animation:mnShake .35s}
.mnMiGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%}
.mnMiGrid.bad{animation:mnShake .3s}
.mnMiN{padding:20px 0;font-size:1.5rem;font-weight:800;border-radius:16px;border:2px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;touch-action:manipulation}
.mnMiN.ok{opacity:.25;border-color:var(--c)}
.mnMiRail{position:relative;width:100%;height:46px;border-radius:23px;background:rgba(255,255,255,.1);overflow:hidden}
.mnMiRail.bad{animation:mnShake .3s}
.mnMiZone{position:absolute;top:0;bottom:0;background:rgba(255,255,255,.25);border:2px solid var(--c);box-sizing:border-box;border-radius:12px}
.mnMiCur{position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#fff;border-radius:3px;box-shadow:0 0 12px #fff}
.mnMiGo{padding:14px 40px;border-radius:18px;border:0;font-weight:900;font-size:1rem;background:var(--c);color:#04110d;touch-action:manipulation}
.mnMiGo:active{transform:scale(.94)}
.mnMiOk{font-size:5rem;color:var(--c);animation:mnPop .4s}
@keyframes mnMiIn{from{opacity:0;transform:scale(.96)}}
@keyframes mnPop{50%{transform:scale(1.15)}}
@keyframes mnShake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
`;
    document.head.appendChild(s);
  }

  const JEUX = {
    hold(z, m, prog, ok) {
      const b = el("button", "mnMiHold"); b.appendChild(el("span", "", m.emoji)); z.appendChild(b);
      z.appendChild(el("div", "mnMiHint", "Maintiens appuyé"));
      let v = 0, bas = false, t0 = performance.now(), raf = 0, vivant = true;
      const ev = on => e => { e.preventDefault(); bas = on; b.classList.toggle("on", on); };
      b.addEventListener("pointerdown", ev(true));
      ["pointerup", "pointerleave", "pointercancel"].forEach(n => b.addEventListener(n, ev(false)));
      b.addEventListener("contextmenu", e => e.preventDefault());
      (function boucle(t) {
        if (!vivant) return;
        const dt = Math.min(.1, (t - t0) / 1000); t0 = t;
        v = Math.max(0, Math.min(1, v + (bas ? dt / m.p : -dt / m.p * 1.5)));
        b.style.background = "conic-gradient(var(--c) " + v * 360 + "deg,rgba(255,255,255,.12) 0deg)";
        prog(v);
        if (v >= 1) { vivant = false; ok(); return; }
        raf = requestAnimationFrame(boucle);
      })(performance.now());
      return () => { vivant = false; cancelAnimationFrame(raf); };
    },

    tap(z, m, prog, ok) {
      const b = el("button", "mnMiTap", m.emoji); z.appendChild(b);
      z.appendChild(el("div", "mnMiHint", "Tape vite !"));
      let n = 0;
      b.addEventListener("pointerdown", e => {
        e.preventDefault(); n++; prog(n / m.p);
        b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
        if (n >= m.p) ok();
      });
      return null;
    },

    seq(z, m, prog, ok) {
      const COL = ["#ff5468", "#ffc43d", "#4cd964", "#4aa3ff"], SYM = ["▲", "●", "■", "◆"];
      const pad = el("div", "mnMiPad"), info = el("div", "mnMiHint", "Observe…");
      const btns = COL.map((c, i) => { const b = el("button", "mnMiPadB", SYM[i]); b.style.background = c; pad.appendChild(b); return b; });
      z.appendChild(pad); z.appendChild(info);
      let suite = [], pos = 0, acc = false; const tm = [];
      const later = (f, d) => { tm.push(setTimeout(f, d)); };
      const flash = (i, d) => { btns[i].classList.add("on"); later(() => btns[i].classList.remove("on"), d || 320); };
      function lancer() {
        acc = false; pos = 0; prog(0); info.textContent = "Observe…";
        suite = Array.from({ length: m.p }, () => Math.floor(Math.random() * 4));
        suite.forEach((s, k) => later(() => flash(s), 700 + k * 620));
        later(() => { acc = true; info.textContent = "À toi !"; }, 700 + suite.length * 620);
      }
      btns.forEach((b, i) => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (!acc) return; flash(i, 180);
        if (i === suite[pos]) { pos++; prog(pos / suite.length); if (pos >= suite.length) { acc = false; ok(); } }
        else {
          acc = false; info.textContent = "Raté ! On recommence…"; pad.classList.add("bad");
          later(() => { pad.classList.remove("bad"); lancer(); }, 900);
        }
      }));
      lancer();
      return () => tm.forEach(clearTimeout);
    },

    ordre(z, m, prog, ok) {
      const n = m.p, nums = Array.from({ length: n }, (_, i) => i + 1).sort(() => Math.random() - .5);
      const g = el("div", "mnMiGrid"); let nx = 1;
      const bs = nums.map(v => {
        const b = el("button", "mnMiN", String(v));
        b.addEventListener("pointerdown", e => {
          e.preventDefault();
          if (v === nx) { b.classList.add("ok"); b.disabled = true; nx++; prog((nx - 1) / n); if (nx > n) ok(); }
          else {
            g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 300);
            nx = 1; prog(0); bs.forEach(x => { x.classList.remove("ok"); x.disabled = false; });
          }
        });
        g.appendChild(b); return b;
      });
      z.appendChild(g); z.appendChild(el("div", "mnMiHint", "Touche de 1 à " + n + " dans l’ordre"));
      return null;
    },

    curseur(z, m, prog, ok) {
      const rail = el("div", "mnMiRail"), zn = el("div", "mnMiZone"), cur = el("div", "mnMiCur");
      rail.appendChild(zn); rail.appendChild(cur); z.appendChild(rail);
      const info = el("div", "mnMiHint", "Arrête le curseur dans la zone"), go = el("button", "mnMiGo", "STOP");
      z.appendChild(go); z.appendChild(info);
      let n = 0, ph = 0, vit = 1.6, t0 = performance.now(), raf = 0, vivant = true, larg = .26, deb = .4;
      const pos = () => .5 + .5 * Math.sin(ph * 2.2);
      function tirer() {
        larg = Math.max(.14, .26 - n * .03); deb = .06 + Math.random() * (.88 - larg);
        zn.style.left = deb * 100 + "%"; zn.style.width = larg * 100 + "%";
      }
      tirer();
      (function boucle(t) {
        if (!vivant) return;
        ph += (t - t0) / 1000 * vit; t0 = t;
        cur.style.left = pos() * 100 + "%";
        raf = requestAnimationFrame(boucle);
      })(performance.now());
      go.addEventListener("pointerdown", e => {
        e.preventDefault(); const x = pos();
        if (x >= deb && x <= deb + larg) {
          n++; prog(n / m.p);
          if (n >= m.p) { vivant = false; ok(); return; }
          vit += .25; tirer(); info.textContent = "Bien ! " + n + "/" + m.p;
        } else {
          rail.classList.add("bad"); setTimeout(() => rail.classList.remove("bad"), 300);
          info.textContent = "Raté, réessaie !";
        }
      });
      return () => { vivant = false; cancelAnimationFrame(raf); };
    }
  };

 /* Croco epreuves · JS */
/* ═══════════════════════════════════════════════════════════════════════
   ÉPREUVES DE LA MARE AUX CROCODILES  (lieu 8)
   Ce bloc utilise `el` (déjà défini plus haut dans ton fichier).
   Types ajoutés : oeufs, nourrir, casser, avatars, panier, sauver
   ═══════════════════════════════════════════════════════════════════════ */
 
const CROCO_CSS = `
.crScene{position:relative;width:100%;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,#3aa58a 0,#1f7463 48%,#0e3b38 100%);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 50px rgba(0,0,0,.55);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.crScene::before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 25% 75%,rgba(255,255,255,.07) 0 5px,transparent 5px 24px),repeating-radial-gradient(circle at 80% 30%,rgba(255,255,255,.05) 0 4px,transparent 4px 20px);pointer-events:none}
.crScene.crHit{animation:mnShake .28s}
.crDeco{position:absolute;pointer-events:none;opacity:.9;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}
.crLayer{position:absolute;inset:0}
.crHud{position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;z-index:5;pointer-events:none;text-shadow:0 1px 3px #000}
.crT{position:absolute;width:62px;height:62px;margin:-31px 0 0 -31px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;touch-action:none;cursor:pointer;filter:drop-shadow(0 4px 5px rgba(0,0,0,.5));z-index:2}
.crT>span{display:block}
.crSp{animation:crSpawn .25s ease-out}
.crWig{animation:crWig .45s ease-in-out infinite alternate}
.crPoof{pointer-events:none;animation:crPoof .32s forwards}
.crNest{position:absolute;left:50%;top:54%;width:100px;height:58px;margin:-29px 0 0 -50px;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#b0854a 0,#6b4a24 72%);box-shadow:0 6px 12px rgba(0,0,0,.55),inset 0 -6px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:1.7rem;z-index:1}
.crNest span{transition:opacity .3s,transform .3s}
.crHero{position:absolute;left:50%;top:54%;width:74px;height:74px;margin:-37px 0 0 -37px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.6rem;background:radial-gradient(circle,rgba(255,255,255,.35),rgba(255,255,255,.05));box-shadow:0 0 0 3px rgba(140,236,255,.6),0 0 26px rgba(140,236,255,.6);z-index:1}
.crPanier{position:absolute;bottom:4px;width:70px;margin-left:-35px;text-align:center;font-size:3.1rem;z-index:4;pointer-events:none;filter:drop-shadow(0 4px 5px rgba(0,0,0,.5))}
.crCrocBox{position:absolute;left:50%;width:200px;margin-left:-100px;z-index:1;transition:transform .2s;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5))}
.crCrocBox svg{display:block;width:100%;height:auto;overflow:visible}
.crCrocBox .bas{transform:translateY(18px)}
.crCrocBox.mange{animation:crBond .45s}
.crCrocBox.mange .bas{animation:crMord .45s}
.crCrocBox.non{animation:mnShake .35s}
.crBulle{position:absolute;right:12px;top:30px;z-index:6;padding:8px 12px;border-radius:16px 16px 4px 16px;background:#fff;color:#12261f;font-weight:800;font-size:1rem;box-shadow:0 6px 14px rgba(0,0,0,.4)}
.crBulle b{font-size:1.6rem;vertical-align:middle;margin-left:4px}
.crPlateau{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:16px;z-index:6}
.crSlot{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.3rem;background:radial-gradient(circle at 35% 30%,#f9e9c4,#c79a52);box-shadow:0 6px 12px rgba(0,0,0,.45);touch-action:none;cursor:grab}
.crSlot.crTaken{opacity:.35}
.crGhost{position:absolute;z-index:30;font-size:3rem;margin:-30px 0 0 -30px;pointer-events:none;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5));transform:scale(1.15)}
.crBelt{position:absolute;left:0;right:0;top:34px;height:78px;background:repeating-linear-gradient(90deg,#3a2e22 0 18px,#241b12 18px 20px);box-shadow:0 5px 10px rgba(0,0,0,.5),inset 0 0 14px rgba(0,0,0,.6);animation:crBg .8s linear infinite;z-index:1}
.crAv{position:absolute;top:8px;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:radial-gradient(circle at 35% 30%,#fff,#bfe3d6);box-shadow:0 4px 8px rgba(0,0,0,.5);touch-action:none;cursor:grab;animation:crAvMove 5.6s linear forwards}
@keyframes crSpawn{from{transform:scale(.2);opacity:0}}
@keyframes crWig{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
@keyframes crPoof{to{transform:scale(1.8);opacity:0}}
@keyframes crMord{0%{transform:translateY(18px)}40%{transform:translateY(0)}100%{transform:translateY(18px)}}
@keyframes crBond{50%{transform:scale(1.08)}}
@keyframes crBg{to{background-position:-20px 0}}
@keyframes crAvMove{from{left:100%}to{left:-70px}}
`;
 
let crCssOk = false;
function crCss() {
  if (crCssOk) return; crCssOk = true;
  const s = document.createElement("style");
  s.textContent = CROCO_CSS;
  document.head.appendChild(s);
}
 
const rnd = (a, b) => a + Math.random() * (b - a);
 
/* Tête de crocodile (SVG), bouche ouverte par défaut */
const crocSVG = () => '<svg viewBox="0 0 210 135"><rect x="14" y="52" width="182" height="60" rx="16" fill="#8f1d33"/>' +
  '<g class="bas"><path d="M10 64H198V82Q198 112 150 112H62Q10 112 10 82Z" fill="#2f7d3b"/>' +
  '<path d="M34 64l9-14l9 14ZM70 64l9-14l9 14ZM106 64l9-14l9 14ZM142 64l9-14l9 14Z" fill="#fff"/></g>' +
  '<path d="M8 56Q8 14 62 14H152Q202 14 202 46V58H8Z" fill="#3f9d4d"/>' +
  '<path d="M32 58l9 14l9-14ZM68 58l9 14l9-14ZM104 58l9 14l9-14ZM140 58l9 14l9-14ZM176 58l9 14l9-14Z" fill="#fff"/>' +
  '<ellipse cx="62" cy="20" rx="17" ry="14" fill="#56b95f"/><circle cx="66" cy="20" r="7" fill="#fff"/><circle cx="68" cy="21" r="3.5" fill="#111"/>' +
  '<circle cx="170" cy="28" r="3" fill="#2a6f35"/><circle cx="184" cy="28" r="3" fill="#2a6f35"/></svg>';
 
/* Décor de mare */
function scene(z, h) {
  const s = el("div", "crScene"); s.style.height = h + "px";
  [["🪷", 6, 78, 2], ["🪷", 84, 66, 1.6], ["🌿", 2, 40, 1.8], ["🌾", 90, 30, 2], ["🍃", 70, 88, 1.4], ["🪷", 28, 90, 1.5]]
    .forEach(([e, x, y, sz]) => {
      const d = el("div", "crDeco", e);
      d.style.left = x + "%"; d.style.top = y + "%"; d.style.fontSize = sz + "rem";
      s.appendChild(d);
    });
  z.appendChild(s);
  return s;
}
 
/* Fait glisser un élément de x0,y0 vers x1,y1 (en %) en d secondes */
function venir(e, x0, y0, x1, y1, d) {
  e.style.left = x0 + "%"; e.style.top = y0 + "%";
  void e.offsetWidth;
  e.style.transition = "left " + d + "s linear,top " + d + "s linear";
  e.style.left = x1 + "%"; e.style.top = y1 + "%";
}
 
function cible(layer, emoji, wig) {
  const d = el("div", "crT");
  d.appendChild(el("span", wig ? "crWig" : "crSp", emoji));
  layer.appendChild(d);
  return d;
}
 
function poof(c, s) {
  c.el.classList.add("crPoof");
  const sp = c.el.firstChild;
  if (sp && s) sp.textContent = s;
  setTimeout(() => c.el.remove(), 330);
}
 
/* Glisser-déposer : src → onDrop(clientX, clientY) */
function glisser(sc, src, emoji, onDrop) {
  src.addEventListener("pointerdown", e => {
    e.preventDefault();
    const g = el("div", "crGhost", emoji); sc.appendChild(g);
    const r = sc.getBoundingClientRect();
    const mv = ev => { g.style.left = (ev.clientX - r.left) + "px"; g.style.top = (ev.clientY - r.top) + "px"; };
    mv(e);
    const avant = src.style.visibility;
    src.style.visibility = "hidden";
    const up = ev => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      g.remove(); src.style.visibility = avant;
      onDrop(ev.clientX, ev.clientY, src);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });
}
 
const dans = (e, x, y, m) => {
  const b = e.getBoundingClientRect(); m = m || 0;
  return x >= b.left - m && x <= b.right + m && y >= b.top - m && y <= b.bottom + m;
};
 
/* Moteur « manche » : des cibles apparaissent pendant m.p secondes.
   Une cible touchée disparaît ; une cible qui expire fait perdre une vie.
   0 vie = on recommence ; tenir m.p secondes = réussi. */
function manche(z, m, prog, ok, o) {
  crCss();
  const sc = scene(z, o.h || 300), layer = el("div", "crLayer"), hud = el("div", "crHud");
  const vies = el("span"), tm = el("span");
  hud.appendChild(vies); hud.appendChild(tm); sc.appendChild(layer); sc.appendChild(hud);
  if (o.init) o.init(sc, layer);
  const hint = el("div", "mnMiHint", o.hint); z.appendChild(hint);
  const dur = m.p, cibles = new Set();
  let vie = o.vies, t = 0, cd = .5, pause = 0, last = performance.now(), raf = 0, vivant = true;
  const maj = () => {
    const v = Math.max(0, vie);
    vies.textContent = o.vieOn.repeat(v) + o.vieOff.repeat(o.vies - v);
    tm.textContent = Math.max(0, Math.ceil(dur - t)) + " s";
  };
  function perdre() {
    vie--; maj();
    sc.classList.remove("crHit"); void sc.offsetWidth; sc.classList.add("crHit");
    if (o.perte) o.perte(vie);
    if (vie <= 0) {
      cibles.forEach(c => c.el.remove()); cibles.clear();
      hint.textContent = "Raté ! On recommence…";
      pause = 1.3; vie = o.vies; t = 0; cd = .5; prog(0);
      if (o.reset) o.reset();
    }
  }
  function ajouter() {
    const c = o.creer(layer, sc, t / dur);
    if (!c) return;
    c.age = 0; cibles.add(c);
    if (!c.notap) c.el.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (!cibles.has(c)) return;
      cibles.delete(c); poof(c, o.poof);
    });
  }
  maj();
  (function tick(now) {
    if (!vivant) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) hint.textContent = o.hint;
    } else {
      t += dt; prog(t / dur);
      cd -= dt;
      if (cd <= 0) { cd = o.cadence(t / dur); ajouter(); }
      [...cibles].forEach(c => {
        if (!cibles.has(c)) return;
        c.age += dt;
        if (o.attrape && o.attrape(c)) { cibles.delete(c); c.el.remove(); return; }
        if (c.age >= c.dur) { cibles.delete(c); if (o.rate) o.rate(c); else c.el.remove(); perdre(); }
      });
      maj();
      if (t >= dur) { vivant = false; prog(1); ok(); return; }
    }
    raf = requestAnimationFrame(tick);
  })(performance.now());
  return () => { vivant = false; cancelAnimationFrame(raf); };
}
 
const JEUX_CROCO = {
 
  /* 1 · CIVIL — Protéger les œufs : écrase les serpents (m.p = durée en s) */
  oeufs(z, m, prog, ok) {
    let oeufs = [];
    return manche(z, m, prog, ok, {
      h: 310, vies: 3, vieOn: "🥚", vieOff: "💔", poof: "💥",
      hint: "Écrase tous les serpents avant qu’ils n’atteignent le nid !",
      init(sc) {
        const nid = el("div", "crNest");
        oeufs = [0, 1, 2].map(() => { const s = el("span", "", "🥚"); nid.appendChild(s); return s; });
        sc.appendChild(nid);
      },
      perte(v) { if (oeufs[v]) { oeufs[v].style.opacity = ".12"; oeufs[v].style.transform = "scale(.5)"; } },
      reset() { oeufs.forEach(e => { e.style.opacity = "1"; e.style.transform = ""; }); },
      cadence: p => 1.05 - .45 * p,
      creer(layer, sc, p) {
        const s = Math.floor(Math.random() * 4); let x, y;
        if (s === 0) { x = rnd(10, 90); y = -8; } else if (s === 1) { x = rnd(10, 90); y = 108; }
        else if (s === 2) { x = -8; y = rnd(14, 90); } else { x = 108; y = rnd(14, 90); }
        const d = 2.4 - .8 * p, e = cible(layer, "🐍", true);
        venir(e, x, y, 50 + rnd(-4, 4), 54 + rnd(-3, 3), d);
        return { el: e, dur: d };
      },
      rate(c) { poof(c, "💢"); }
    });
  },
 
  /* 2 · CIVIL — Nourrir les crocodiles : glisse la bonne nourriture (m.p = nb de crocos) */
  nourrir(z, m, prog, ok) {
    crCss();
    const FOODS = [["🐟", "poisson"], ["🌾", "graines"], ["🍖", "viande"]];
    const sc = scene(z, 330), croc = el("div", "crCrocBox"), bulle = el("div", "crBulle"), plateau = el("div", "crPlateau");
    croc.style.top = "56px"; croc.innerHTML = crocSVG();
    sc.appendChild(croc); sc.appendChild(bulle); sc.appendChild(plateau);
    const hint = el("div", "mnMiHint"); z.appendChild(hint);
    const tm = []; let n = 0, want = -1, busy = false;
    const slots = FOODS.map(([e], i) => {
      const s = el("div", "crSlot", e);
      glisser(sc, s, e, (x, y) => {
        if (busy) return;
        if (!dans(croc, x, y, 14)) return;
        if (i === want) {
          busy = true; croc.classList.add("mange"); n++; prog(n / m.p);
          tm.push(setTimeout(() => {
            croc.classList.remove("mange");
            if (n >= m.p) { ok(); return; }
            busy = false; suivant();
          }, 650));
        } else {
          croc.classList.remove("non"); void croc.offsetWidth; croc.classList.add("non");
          bulle.innerHTML = "Non ! 🙅";
          tm.push(setTimeout(() => { if (!busy) afficher(); }, 700));
        }
      });
      plateau.appendChild(s); return s;
    });
    const afficher = () => { bulle.innerHTML = "Je veux <b>" + FOODS[want][0] + "</b>"; };
    function suivant() {
      let w; do { w = Math.floor(Math.random() * 3); } while (w === want);
      want = w; afficher();
      croc.style.filter = "drop-shadow(0 8px 8px rgba(0,0,0,.5)) hue-rotate(" + [0, 45, -40][n % 3] + "deg)";
      slots.sort(() => Math.random() - .5).forEach(s => plateau.appendChild(s));
      hint.textContent = "Crocodile " + (n + 1) + "/" + m.p + " · donne-lui ce qu’il demande";
    }
    suivant();
    return () => tm.forEach(clearTimeout);
  },
 
  /* 1 · IMPOSTEUR — Casser les œufs (m.p = durée en s) */
  casser(z, m, prog, ok) {
    return manche(z, m, prog, ok, {
      h: 310, vies: 4, vieOn: "🔴", vieOff: "⚫", poof: "💥",
      hint: "Écrase les œufs avant qu’ils n’éclosent !",
      cadence: p => .95 - .35 * p,
      creer(layer, sc, p) {
        const e = cible(layer, "🥚", false), d = 1.7 - .5 * p;
        e.style.left = rnd(12, 88) + "%"; e.style.top = rnd(24, 86) + "%";
        e.firstChild.style.animation = "crSpawn .25s, crWig .14s ease-in-out " + (d * .6) + "s infinite alternate";
        return { el: e, dur: d };
      },
      rate(c) { poof(c, "🐣"); }
    });
  },
 
  /* 2 · IMPOSTEUR — Servir les joueurs aux crocodiles (m.p = nb d’avatars)
     Pour mettre les VRAIS avatars des joueurs : passer m.avatars = ["🦊","🐼",...] */
  avatars(z, m, prog, ok) {
    crCss();
    const AV = ["🧑‍🚀", "🦸", "🧙", "🧑‍🍳", "👩‍🔬", "🧑‍🎤", "👨‍🚒", "🥷", "🧑‍🌾", "🦹", "🧛", "🧑‍🎨"];
    const liste = (m.avatars && m.avatars.length) ? m.avatars : AV;
    const sc = scene(z, 340), belt = el("div", "crBelt"), croc = el("div", "crCrocBox");
    croc.style.bottom = "16px"; croc.innerHTML = crocSVG();
    sc.appendChild(belt); sc.appendChild(croc);
    const hint = el("div", "mnMiHint", "Glisse les joueurs dans la gueule · 0/" + m.p); z.appendChild(hint);
    let n = 0, k = 0, vivant = true;
    function nouvel() {
      if (!vivant) return;
      const e = liste[k++ % liste.length], a = el("div", "crAv", e);
      glisser(sc, a, e, (x, y, src) => {
        if (!vivant || !dans(croc, x, y, 10)) return;
        src.remove(); n++; prog(n / m.p);
        hint.textContent = "Glisse les joueurs dans la gueule · " + n + "/" + m.p;
        croc.classList.remove("mange"); void croc.offsetWidth; croc.classList.add("mange");
        if (n >= m.p) { vivant = false; clearInterval(iv); ok(); }
      });
      a.addEventListener("animationend", () => a.remove());
      belt.appendChild(a);
    }
    nouvel();
    const iv = setInterval(nouvel, 1000);
    return () => { vivant = false; clearInterval(iv); };
  },
 
  /* 1 · MORT — Sauver les œufs : rattrape-les avec le panier (m.p = durée en s) */
  panier(z, m, prog, ok) {
    let bx = 50, pan = null;
    return manche(z, m, prog, ok, {
      h: 320, vies: 3, vieOn: "💙", vieOff: "🤍",
      hint: "Glisse le doigt pour déplacer le panier",
      init(sc) {
        pan = el("div", "crPanier", "🧺"); pan.style.left = "50%"; sc.appendChild(pan);
        const bouge = e => {
          const r = sc.getBoundingClientRect();
          bx = Math.max(8, Math.min(92, (e.clientX - r.left) / r.width * 100));
          pan.style.left = bx + "%";
        };
        sc.addEventListener("pointerdown", bouge);
        sc.addEventListener("pointermove", e => { if (e.buttons) bouge(e); });
      },
      cadence: p => .85 - .3 * p,
      creer(layer, sc, p) {
        const e = cible(layer, "🥚", false), x = rnd(10, 90), d = 1.9 - .5 * p;
        venir(e, x, -6, x, 106, d);
        return { el: e, dur: d, x, notap: true };
      },
      attrape(c) {
        const y = -6 + 112 * c.age / c.dur;
        return y >= 80 && Math.abs(c.x - bx) <= 16;
      },
      rate(c) { poof(c, "🍳"); }
    });
  },
 
  /* 2 · MORT — Sauver le joueur : écrase les crocodiles (m.p = durée en s) */
  sauver(z, m, prog, ok) {
    return manche(z, m, prog, ok, {
      h: 310, vies: 3, vieOn: "💙", vieOff: "🤍", poof: "💥",
      hint: "Écrase les crocodiles avant qu’ils ne l’atteignent !",
      init(sc) { sc.appendChild(el("div", "crHero", "🧑")); },
      cadence: p => 1.1 - .4 * p,
      creer(layer, sc, p) {
        const gauche = Math.random() < .5, d = 2.6 - .9 * p, e = cible(layer, "🐊", true);
        venir(e, gauche ? -8 : 108, rnd(24, 82), gauche ? 40 : 60, 54, d);
        return { el: e, dur: d };
      },
      rate(c) { poof(c, "🦷"); }
    });
  }
};
 
/* Enregistre les nouveaux jeux dans JEUX */
Object.keys(JEUX_CROCO).forEach(k => { JEUX[k] = JEUX_CROCO[k]; });

const PERRO_CSS = `
.pqScene{position:relative;width:100%;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at 50% 0,#2c9a73 0,#1a6a50 50%,#0d3a2c 100%);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 50px rgba(0,0,0,.5);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.pqScene::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(100deg,rgba(255,255,255,.05) 0 10px,transparent 10px 38px);pointer-events:none}
.pqDeco{position:absolute;pointer-events:none;opacity:.85;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}
.pqPips{position:absolute;top:10px;left:14px;font-weight:900;letter-spacing:.2em;font-size:1rem;text-shadow:0 1px 3px #000;z-index:3}
.pqPerro{position:absolute;left:50%;top:34px;margin-left:-78px;font-size:5.6rem;line-height:1;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5));z-index:2}
.pqPerro.parle{animation:pqTalk .32s ease-in-out}
.pqPerro.non{animation:mnShake .4s}
.pqBulle{position:absolute;left:50%;top:26px;margin-left:30px;min-width:72px;padding:8px 14px;border-radius:18px 18px 18px 4px;background:#fff;color:#555;font-weight:900;font-size:1.9rem;text-align:center;box-shadow:0 6px 14px rgba(0,0,0,.4);z-index:3;transition:color .1s}
.pqBranche{position:absolute;left:-6px;right:-6px;bottom:16px;height:18px;border-radius:9px;background:linear-gradient(#8a5a2b,#5a3a1a);box-shadow:0 4px 8px rgba(0,0,0,.5);z-index:1}
.pqRow{position:absolute;left:14px;right:14px;bottom:30px;display:flex;gap:10px;z-index:2}
.pqNote{flex:1;height:92px;border:0;border-radius:22px 22px 12px 12px;font-weight:900;font-size:1.35rem;color:rgba(0,0,0,.62);box-shadow:0 7px 0 rgba(0,0,0,.35);opacity:.78;transition:opacity .1s,transform .1s,filter .1s,box-shadow .1s;touch-action:manipulation}
.pqNote.on{opacity:1;filter:brightness(1.45);transform:translateY(5px) scale(1.05);box-shadow:0 2px 0 rgba(0,0,0,.35)}
.pqCv{display:block;width:100%;max-width:340px;height:auto;border-radius:20px;border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 40px rgba(0,0,0,.4);touch-action:none;user-select:none;-webkit-user-select:none}
@keyframes pqTalk{30%{transform:translateY(-10px) rotate(-7deg) scale(1.08)}70%{transform:translateY(0) rotate(5deg)}}
`;

let pqCssOk = false;
function pqCss() {
  if (pqCssOk) return; pqCssOk = true;
  const s = document.createElement("style");
  s.textContent = PERRO_CSS;
  document.head.appendChild(s);
}

const pqRnd = (a, b) => a + Math.random() * (b - a);

/* Petit son (WebAudio) : silencieux si le téléphone l’interdit */
let pqAc = null;
function pqSon(f) {
  try {
    pqAc = pqAc || new (window.AudioContext || window.webkitAudioContext)();
    if (pqAc.state === "suspended") pqAc.resume();
    const o = pqAc.createOscillator(), g = pqAc.createGain(), t = pqAc.currentTime;
    o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.25, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + .4);
    o.connect(g); g.connect(pqAc.destination);
    o.start(t); o.stop(t + .45);
  } catch (e) { /* pas de son */ }
}

const JEUX_PERRO = {

  /* CIVIL 1 — Répéter le mot du perroquet (m.p = nombre de manches, ex. 3)
     Le perroquet « dit » un mot en syllabes (couleur + son + bulle).
     Manche 1 = 3 syllabes, manche 2 = 4, manche 3 = 5… La suite se prolonge.
     Une erreur : il redit la même suite (on ne perd pas tout). */
  parole(z, m, prog, ok) {
    pqCss();
    const POOL = ["Ko", "Ra", "Pi", "Ti", "Zou", "Mba", "Lo", "Cri", "Ya", "Fou", "Jo", "Ké"];
    const COL = ["#ff5468", "#ffc43d", "#4cd964", "#4aa3ff"], FREQ = [392, 494, 587, 740];
    const syl = POOL.slice().sort(() => Math.random() - .5).slice(0, 4);
    const rounds = m.p, L0 = 3, full = [];
    for (let i = 0; i < L0 + rounds - 1; i++) {
      let v; do { v = Math.floor(Math.random() * 4); } while (i && v === full[i - 1]);
      full.push(v);
    }
    const sc = el("div", "pqScene"); sc.style.height = "320px";
    [["🌿", 4, 52, 2.2], ["🍃", 86, 62, 1.8], ["🌺", 90, 14, 1.6], ["🌴", 2, 8, 2.4]].forEach(([e, x, y, s]) => {
      const d = el("div", "pqDeco", e); d.style.left = x + "%"; d.style.top = y + "%"; d.style.fontSize = s + "rem"; sc.appendChild(d);
    });
    const pips = el("div", "pqPips"), perro = el("div", "pqPerro", "🦜"), bulle = el("div", "pqBulle", "…");
    const row = el("div", "pqRow"), info = el("div", "mnMiHint", "Écoute le perroquet…");
    sc.appendChild(pips); sc.appendChild(perro); sc.appendChild(bulle); sc.appendChild(el("div", "pqBranche")); sc.appendChild(row);
    const btns = syl.map((s, i) => { const b = el("button", "pqNote", s); b.style.background = COL[i]; row.appendChild(b); return b; });
    z.appendChild(sc); z.appendChild(info);

    let r = 0, pos = 0, acc = false, seq = [];
    const tm = [], later = (f, d) => { tm.push(setTimeout(f, d)); };
    const majPips = () => { pips.textContent = "●".repeat(r) + "◉" + "○".repeat(Math.max(0, rounds - r - 1)); };
    function dire(i, d) {
      btns[i].classList.add("on"); bulle.textContent = syl[i]; bulle.style.color = COL[i];
      perro.classList.remove("parle"); void perro.offsetWidth; perro.classList.add("parle");
      pqSon(FREQ[i]); later(() => btns[i].classList.remove("on"), d || 380);
    }
    function lancer() {
      acc = false; pos = 0; majPips();
      seq = full.slice(0, L0 + r);
      info.textContent = "Écoute le perroquet…"; bulle.textContent = "…"; bulle.style.color = "#555";
      seq.forEach((s, k) => later(() => dire(s), 800 + k * 650));
      later(() => { acc = true; bulle.textContent = "?"; info.textContent = "À toi ! Répète les " + seq.length + " syllabes"; }, 800 + seq.length * 650);
    }
    btns.forEach((b, i) => b.addEventListener("pointerdown", e => {
      e.preventDefault(); if (!acc) return;
      dire(i, 220);
      if (i === seq[pos]) {
        pos++; prog((r + pos / seq.length) / rounds);
        if (pos >= seq.length) {
          acc = false; r++;
          if (r >= rounds) { info.textContent = "Bravo, il a compris !"; later(ok, 600); }
          else { info.textContent = "Bien joué ! Il en rajoute une…"; later(lancer, 1000); }
        }
      } else {
        acc = false; info.textContent = "Squaaawk ! Il le redit…";
        perro.classList.remove("non"); void perro.offsetWidth; perro.classList.add("non");
        later(lancer, 1200);
      }
    }));
    lancer();
    return () => tm.forEach(clearTimeout);
  },

  /* CIVIL 2 — Faire voler le perroquet, style Flappy Bird (m.p = durée du parcours en s, ex. 10)
     Touche pour battre des ailes, passe entre les troncs. Crash = on repart du début. */
  vol(z, m, prog, ok) {
    pqCss();
    const W = 320, H = 280, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = el("canvas", "pqCv"); cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext("2d"); c.scale(dpr, dpr);
    z.appendChild(cv);
    const hint = el("div", "mnMiHint", "Touche pour battre des ailes"); z.appendChild(hint);

    const PX = 72, R = 12, G = 1350, FL = -400, V = 150, GAP = 122, PW = 48, SP = 165, dur = m.p;
    let st = "attente", y = H / 2, vy = 0, t = 0, dist = 0, spawnAt = 0, pipes = [], lastGap = H / 2;
    let pause = 0, flash = 0, last = performance.now(), raf = 0, vivant = true;

    function reset() {
      y = H / 2; vy = 0; t = 0; dist = 0; spawnAt = 0; pipes = []; lastGap = H / 2; st = "attente";
      prog(0); hint.textContent = "Touche pour battre des ailes";
    }

    function tronc(x, y0, h, haut) {
      if (h <= 0) return;
      const g = c.createLinearGradient(x, 0, x + PW, 0);
      g.addColorStop(0, "#5a3b1e"); g.addColorStop(.35, "#8a5f35"); g.addColorStop(1, "#4a2f17");
      c.fillStyle = g; c.fillRect(x, y0, PW, h);
      c.fillStyle = "rgba(0,0,0,.18)";
      for (let k = 10; k < h; k += 26) c.fillRect(x + 6, y0 + k, PW - 12, 3);
      c.fillStyle = "#3f2813"; c.fillRect(x - 4, haut ? y0 + h - 14 : y0, PW + 8, 14);
      c.fillStyle = "#2f9a52";
      const cy = haut ? y0 + h - 16 : y0 + 16;
      [0, 1, 2].forEach(i => { c.beginPath(); c.arc(x + 4 + i * 20, cy, 9, 0, 7); c.fill(); });
    }

    function dessiner(now) {
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#8ae6c6"); gr.addColorStop(.55, "#2f9c78"); gr.addColorStop(1, "#14513f");
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,244,190,.85)"; c.beginPath(); c.arc(W - 50, 46, 22, 0, 7); c.fill();
      /* arbres lointains (parallaxe) */
      [[.2, 90, "#1c7a5c", "#17604a", 118], [.45, 130, "#14604a", "#0f4a39", 90]].forEach(([k, sp, cf, ct, h]) => {
        const off = (dist * k) % sp;
        for (let x = -sp - off; x < W + sp; x += sp) {
          c.fillStyle = ct; c.fillRect(x + 90, H - h, 12, h);
          c.fillStyle = cf; c.beginPath(); c.arc(x + 96, H - h, 32, 0, 7); c.fill();
        }
      });
      pipes.forEach(p => { tronc(p.x, 0, p.g - GAP / 2, true); tronc(p.x, p.g + GAP / 2, H - 14 - (p.g + GAP / 2), false); });
      c.fillStyle = "#2d6a3a"; c.fillRect(0, H - 14, W, 14);
      c.fillStyle = "#3f8a4c"; c.fillRect(0, H - 14, W, 4);
      /* perroquet */
      const yy = st === "attente" ? H / 2 + Math.sin(now / 220) * 6 : y;
      c.save(); c.translate(PX, yy);
      c.rotate(Math.max(-.5, Math.min(.8, vy / 700)));
      c.scale(-1, 1);                 /* ← enlève cette ligne si ton 🦜 regarde vers la gauche à l'envers */
      c.font = "32px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("🦜", 0, 0); c.restore();
      /* HUD */
      c.fillStyle = "#fff"; c.font = "800 16px sans-serif"; c.textAlign = "right"; c.textBaseline = "alphabetic";
      c.shadowColor = "#000"; c.shadowBlur = 4;
      c.fillText(Math.max(0, Math.ceil(dur - t)) + " s", W - 12, 24);
      if (st === "attente") { c.textAlign = "center"; c.font = "900 24px sans-serif"; c.fillText("TOUCHE !", W / 2, H / 2 - 40); }
      c.shadowBlur = 0;
      if (flash > 0) { c.fillStyle = "rgba(255,60,80," + (flash * .45) + ")"; c.fillRect(0, 0, W, H); }
    }

    function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (flash > 0) flash = Math.max(0, flash - dt * 2.5);
      if (pause > 0) {
        if (st === "crash") { vy += G * dt; y = Math.min(H - 14, y + vy * dt); }
        pause -= dt; if (pause <= 0) reset();
      } else if (st === "vol") {
        t += dt; vy += G * dt; y += vy * dt; dist += V * dt;
        if (dist >= spawnAt && t < dur - 2.3) {
          const g = Math.max(GAP / 2 + 14, Math.min(H - 14 - GAP / 2 - 14, lastGap + pqRnd(-75, 75)));
          lastGap = g; pipes.push({ x: W + 10, g }); spawnAt += SP;
        }
        pipes.forEach(p => { p.x -= V * dt; });
        pipes = pipes.filter(p => p.x > -PW - 10);
        let mort = y > H - 14 - R;
        if (y < R) { y = R; vy = 0; }
        pipes.forEach(p => {
          if (PX + R - 3 > p.x && PX - R + 3 < p.x + PW && (y - R + 3 < p.g - GAP / 2 || y + R - 3 > p.g + GAP / 2)) mort = true;
        });
        prog(t / dur);
        if (mort) { st = "crash"; pause = 1; flash = 1; hint.textContent = "Aïe ! On recommence…"; vy = -150; }
        else if (t >= dur) { vivant = false; prog(1); dessiner(now); ok(); return; }
      }
      dessiner(now);
      raf = requestAnimationFrame(tick);
    }
    cv.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (st === "crash") return;
      if (st === "attente") { st = "vol"; hint.textContent = "Franchis les troncs !"; }
      vy = FL;
    });
    raf = requestAnimationFrame(tick);
    return () => { vivant = false; cancelAnimationFrame(raf); };
  }
};

Object.keys(JEUX_PERRO).forEach(k => { JEUX[k] = JEUX_PERRO[k]; });

const PERRO2_CSS = `
.ppNuit{background:radial-gradient(ellipse at 50% 0,#4b3a8f 0,#2a1f5c 55%,#120c33 100%)}
.ppPerro{position:absolute;left:50%;top:48%;width:120px;height:120px;margin:-60px 0 0 -60px;display:flex;align-items:center;justify-content:center;font-size:5.8rem;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5));z-index:1}
.pqScene[data-ph=dort]{border-color:#4cd964}
.pqScene[data-ph=alerte]{border-color:#ffc43d}
.pqScene[data-ph=eveille]{border-color:#ff3b55;box-shadow:inset 0 0 60px rgba(255,59,85,.45)}
.pqScene[data-ph=alerte] .ppPerro{animation:mnShake .3s infinite}
.pqScene[data-ph=dort] .ppPerro{transform:rotate(-8deg)}
.ppZz,.ppEyes,.ppAlerte{position:absolute;display:none;z-index:2;pointer-events:none}
.ppZz{left:calc(50% + 36px);top:22%;font-size:2rem;animation:ppFloat 1.6s ease-in-out infinite}
.ppEyes{left:50%;top:18%;transform:translateX(-50%);font-size:2.6rem}
.ppAlerte{left:50%;top:18%;transform:translateX(-50%);font-size:2.4rem;animation:mnPop .3s infinite}
.pqScene[data-ph=dort] .ppZz,.pqScene[data-ph=eveille] .ppEyes,.pqScene[data-ph=alerte] .ppAlerte{display:block}
.ppPl{position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.3rem;touch-action:none;cursor:pointer;background:conic-gradient(#ffc43d var(--p,0deg),rgba(255,255,255,.14) 0);animation:ppGlow 1s ease-in-out infinite alternate;z-index:3}
.ppPl::before{content:"";position:absolute;inset:6px;border-radius:50%;background:rgba(10,30,24,.85)}
.ppPl span{position:relative}
.ppNid{position:absolute;width:84px;height:74px;margin:-37px 0 0 -42px;transition:left var(--t,.5s) ease-in-out,top var(--t,.5s) ease-in-out;touch-action:manipulation;cursor:pointer}
.ppNid .oeuf{position:absolute;left:50%;bottom:6px;margin-left:-16px;font-size:2rem;line-height:1}
.ppNid .coque{position:absolute;inset:0;border-radius:44px 44px 12px 12px;background:repeating-linear-gradient(35deg,rgba(0,0,0,.14) 0 3px,transparent 3px 9px),radial-gradient(ellipse at 50% 20%,#c99a5b,#7a5428);box-shadow:0 8px 12px rgba(0,0,0,.5);transition:transform .3s}
.ppNid.haut .coque{transform:translateY(-50px) rotate(-8deg)}
.ppNid.vrai .oeuf{filter:drop-shadow(0 0 8px #ffd54a)}
.ppField{position:absolute;left:10px;right:10px;top:34px;height:236px;display:flex;gap:6px;z-index:1}
.ppLane{flex:1;position:relative;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.1));overflow:hidden}
.ppLane.hit{animation:ppFlash .22s}
.ppLine{position:absolute;left:8px;right:8px;top:204px;height:4px;border-radius:2px;background:rgba(255,255,255,.7);box-shadow:0 0 12px #fff;z-index:2;pointer-events:none}
.ppN{position:absolute;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:#fff;box-shadow:0 0 14px currentColor,inset 0 -4px 6px rgba(0,0,0,.25)}
.ppBtns{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;z-index:3}
.ppB{flex:1;height:58px;border:0;border-radius:16px;font-size:1.5rem;color:rgba(0,0,0,.5);box-shadow:0 5px 0 rgba(0,0,0,.4);opacity:.85;touch-action:manipulation;transition:transform .08s,filter .08s}
.ppB.on{transform:translateY(4px);filter:brightness(1.5);box-shadow:0 1px 0 rgba(0,0,0,.4);opacity:1}
.ppTxt{position:absolute;left:50%;top:150px;transform:translateX(-50%);font-weight:900;font-size:1.1rem;color:#fff;text-shadow:0 2px 6px #000;pointer-events:none;z-index:4;animation:ppUp .6s forwards}
.ppVent{position:absolute;left:50%;top:62%;width:240px;height:240px;margin:-120px 0 0 -120px;border-radius:50%;background:conic-gradient(rgba(255,255,255,0),rgba(255,255,255,.4),rgba(255,255,255,0) 40%,rgba(255,255,255,.35) 62%,rgba(255,255,255,0));opacity:0;pointer-events:none}
.ppGuide{position:absolute;left:50%;top:62%;width:170px;height:170px;margin:-85px 0 0 -85px;border-radius:50%;border:3px dashed rgba(255,255,255,.35);pointer-events:none}
.ppFinger{position:absolute;width:28px;height:28px;margin:-14px;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 0 18px #fff;pointer-events:none;display:none;z-index:6}
.ppObj{position:absolute;font-size:2rem;line-height:1;margin:-16px;pointer-events:none;filter:drop-shadow(0 4px 5px rgba(0,0,0,.5))}
.ppNest{position:absolute;width:104px;height:60px;margin:-30px 0 0 -52px;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#b0854a 0,#6b4a24 72%);box-shadow:0 6px 12px rgba(0,0,0,.55);pointer-events:none}
.ppJauge{position:absolute;top:12px;left:14px;right:14px;height:12px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;z-index:5;pointer-events:none}
.ppJauge i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8cecff,#fff);border-radius:99px}
@keyframes ppFloat{50%{transform:translateY(-10px)}}
@keyframes ppGlow{to{box-shadow:0 0 22px rgba(255,225,110,.9)}}
@keyframes ppFlash{50%{background:rgba(255,255,255,.35)}}
@keyframes ppUp{to{transform:translate(-50%,-26px);opacity:0}}
`;

let ppCssOk = false;
function ppCss() {
  pqCss();
  if (ppCssOk) return; ppCssOk = true;
  const s = document.createElement("style");
  s.textContent = PERRO2_CSS;
  document.head.appendChild(s);
}

const JEUX_PERRO2 = {

  /* IMPOSTEUR 1 — Plumes discrètes (m.p = nb de plumes, ex. 6)
     Maintiens le doigt sur une plume pour la pincer. Quand le perroquet
     s'éveille (alerte orange 0,9 s), il faut LÂCHER l'écran, sinon on recommence. */
  plumes(z, m, prog, ok) {
    ppCss();
    const sc = el("div", "pqScene"); sc.style.height = "330px"; sc.dataset.ph = "dort";
    [["🌿", 4, 12, 2.2], ["🍃", 88, 80, 1.8], ["🌴", 90, 10, 2.4]].forEach(([e, x, y, s]) => {
      const d = el("div", "pqDeco", e); d.style.left = x + "%"; d.style.top = y + "%"; d.style.fontSize = s + "rem"; sc.appendChild(d);
    });
    const pips = el("div", "pqPips"); sc.appendChild(pips);
    sc.appendChild(el("div", "ppPerro", "🦜"));
    sc.appendChild(el("div", "ppZz", "💤"));
    sc.appendChild(el("div", "ppEyes", "👀"));
    sc.appendChild(el("div", "ppAlerte", "❗"));
    const info = el("div", "mnMiHint"); z.appendChild(sc); z.appendChild(info);

    const SPOTS = [[16, 28], [84, 28], [15, 62], [85, 62], [32, 86], [68, 86]];
    let n = 0, hold = null, ph = "dort", pt = 2.4, pause = 0, last = performance.now(), raf = 0, vivant = true;
    const feathers = [];
    const txt = { dort: "Chut… il dort · maintiens une plume pour la pincer", alerte: "Il se réveille ! LÂCHE TOUT !", eveille: "Il regarde… ne touche surtout pas l’écran !" };
    const majPips = () => { pips.textContent = "🪶 " + n + "/" + m.p; };

    function ajouter() {
      const libres = SPOTS.map((_, i) => i).filter(i => !feathers.some(f => f.i === i));
      if (!libres.length || feathers.length >= 3) return;
      const i = libres[Math.floor(Math.random() * libres.length)];
      const e = el("div", "ppPl"); e.appendChild(el("span", "", "🪶"));
      e.style.left = SPOTS[i][0] + "%"; e.style.top = SPOTS[i][1] + "%";
      const f = { el: e, i, p: 0 };
      e.addEventListener("pointerdown", ev => { ev.preventDefault(); hold = f; });
      sc.appendChild(e); feathers.push(f);
    }
    const relache = () => { hold = null; };
    window.addEventListener("pointerup", relache);
    window.addEventListener("pointercancel", relache);
    function phase(p, d) { ph = p; pt = d; sc.dataset.ph = p; info.textContent = txt[p]; }
    function reveille() {
      feathers.forEach(f => f.el.remove()); feathers.length = 0;
      n = 0; hold = null; prog(0); majPips();
      info.textContent = "Il t’a vu ! On recommence…"; pause = 1.4; sc.dataset.ph = "eveille";
      sc.classList.remove("crHit"); void sc.offsetWidth; sc.classList.add("crHit");
    }
    majPips(); phase("dort", 2.4); ajouter(); ajouter(); ajouter();

    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) { phase("dort", 2.2); ajouter(); ajouter(); ajouter(); }
      } else {
        pt -= dt;
        if (ph === "dort" && pt <= 0) phase("alerte", .9);
        else if (ph === "alerte" && pt <= 0) { phase("eveille", pqRnd(1.0, 1.6)); }
        else if (ph === "eveille" && pt <= 0) phase("dort", pqRnd(2.0, 3.2));
        if (ph === "eveille" && hold) { reveille(); }
        else {
          feathers.slice().forEach(f => {
            if (hold === f && ph !== "eveille") f.p = Math.min(1, f.p + dt / .75);
            else f.p = Math.max(0, f.p - dt * 2);
            f.el.style.setProperty("--p", (f.p * 360) + "deg");
            if (f.p >= 1) {
              f.el.remove(); feathers.splice(feathers.indexOf(f), 1);
              if (hold === f) hold = null;
              n++; prog(n / m.p); majPips();
              if (n >= m.p) { vivant = false; ok(); return; }
              ajouter();
            }
          });
        }
      }
      if (vivant) raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => {
      vivant = false; cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", relache);
      window.removeEventListener("pointercancel", relache);
    };
  },

  /* IMPOSTEUR 2 — Jeu des gobelets (m.p = nb de tours, ex. 3)
     L'œuf piégé est montré, les nids se mélangent (de plus en plus vite),
     retrouve-le. Raté = même tour rejoué. */
  gobelets(z, m, prog, ok) {
    ppCss();
    const sc = el("div", "pqScene"); sc.style.height = "300px";
    [["🌿", 4, 14, 2.2], ["🍃", 88, 84, 1.8], ["🌺", 90, 12, 1.8]].forEach(([e, x, y, s]) => {
      const d = el("div", "pqDeco", e); d.style.left = x + "%"; d.style.top = y + "%"; d.style.fontSize = s + "rem"; sc.appendChild(d);
    });
    const pips = el("div", "pqPips"); sc.appendChild(pips);
    const info = el("div", "mnMiHint", "Observe l’œuf piégé…");
    const X = [20, 50, 80], Y = 58, tm = [];
    const later = (f, d) => { tm.push(setTimeout(f, d)); };
    const nids = [0, 1, 2].map(i => {
      const n = el("div", "ppNid"); n.appendChild(el("div", "oeuf", "🥚")); n.appendChild(el("div", "coque"));
      n.style.left = X[i] + "%"; n.style.top = Y + "%"; sc.appendChild(n); return n;
    });
    z.appendChild(sc); z.appendChild(info);

    let r = 0, slot = [0, 1, 2], oeuf = 0, acc = false;
    const majPips = () => { pips.textContent = "Tour " + Math.min(r + 1, m.p) + "/" + m.p; };
    function place() { nids.forEach((n, i) => { n.style.left = X[slot[i]] + "%"; n.style.top = Y + "%"; }); }
    function manche() {
      acc = false; majPips();
      nids.forEach(n => { n.classList.remove("haut", "vrai"); n.querySelector(".oeuf").style.display = "none"; });
      oeuf = Math.floor(Math.random() * 3);
      nids[oeuf].querySelector(".oeuf").style.display = "block";
      info.textContent = "Observe l’œuf piégé…";
      later(() => nids[oeuf].classList.add("haut", "vrai"), 500);
      later(() => nids[oeuf].classList.remove("haut"), 1900);
      later(() => { info.textContent = "Suis-le bien !"; melanger(5 + 2 * r, Math.max(.3, .55 - .1 * r)); }, 2500);
    }
    function melanger(k, T) {
      if (k <= 0) { acc = true; info.textContent = "Où est l’œuf ? Touche un nid"; return; }
      let a = Math.floor(Math.random() * 3), b; do { b = Math.floor(Math.random() * 3); } while (b === a);
      nids.forEach(n => n.style.setProperty("--t", T + "s"));
      const sa = slot[a]; slot[a] = slot[b]; slot[b] = sa;
      nids[a].style.left = X[slot[a]] + "%"; nids[b].style.left = X[slot[b]] + "%";
      nids[a].style.top = (Y + 9) + "%"; nids[b].style.top = (Y - 9) + "%";
      later(() => { nids[a].style.top = Y + "%"; nids[b].style.top = Y + "%"; }, T * 500);
      later(() => melanger(k - 1, T), T * 1000 + 40);
    }
    nids.forEach((n, i) => n.addEventListener("pointerdown", e => {
      e.preventDefault(); if (!acc) return; acc = false;
      n.classList.add("haut"); n.querySelector(".oeuf").style.display = "block";
      if (i === oeuf) {
        r++; prog(r / m.p); info.textContent = "Bien vu ! L’œuf est échangé.";
        if (r >= m.p) later(ok, 700); else later(manche, 1300);
      } else {
        info.textContent = "Raté ! Regarde mieux…";
        sc.classList.remove("crHit"); void sc.offsetWidth; sc.classList.add("crHit");
        nids[oeuf].classList.add("haut", "vrai"); nids[oeuf].querySelector(".oeuf").style.display = "block";
        later(() => { nids.forEach(x => x.classList.remove("haut", "vrai")); slot = [0, 1, 2]; place(); later(manche, 400); }, 1500);
      }
    }));
    place(); manche();
    return () => tm.forEach(clearTimeout);
  },

  /* MORT 1 — Concert fantôme, type Guitar Hero (m.p = nb de notes, ex. 20)
     4 pistes, touche la piste quand la note passe sur la ligne. 5 vies :
     note ratée ou touche dans le vide = -1. 0 vie = on recommence. */
  guitar(z, m, prog, ok) {
    ppCss();
    const COL = ["#ff5468", "#ffc43d", "#4cd964", "#4aa3ff"], FREQ = [330, 392, 440, 523], SYM = ["▲", "●", "■", "◆"];
    const FH = 236, HIT = 206, FALL = 1.5, FEN = .22, NV = 5;
    const sc = el("div", "pqScene ppNuit"); sc.style.height = "340px";
    const pips = el("div", "pqPips"); sc.appendChild(pips);
    const field = el("div", "ppField"), btns = el("div", "ppBtns");
    const lanes = COL.map(() => { const l = el("div", "ppLane"); field.appendChild(l); return l; });
    field.appendChild(el("div", "ppLine"));
    sc.appendChild(field); sc.appendChild(btns);
    const info = el("div", "mnMiHint", "Touche la piste quand la note passe sur la ligne");
    z.appendChild(sc); z.appendChild(info);

    let notes = [], ct = 0, vies = NV, fait = 0, pause = 0, last = performance.now(), raf = 0, vivant = true;
    function composer() {
      const rythme = [.6, .6, .3, .3, .6, .45, .45, .6, .3, .3, .3, .6], res = [];
      let t = 1.0, prev = -1, pp = -1;
      for (let i = 0; i < m.p; i++) {
        let l; do { l = Math.floor(Math.random() * 4); } while (l === prev && l === pp);
        res.push({ l, t, el: null, ok: null });
        pp = prev; prev = l; t += rythme[i % rythme.length];
      }
      return res;
    }
    const majPips = () => { pips.textContent = "🎵".repeat(vies) + "🖤".repeat(NV - vies); };
    function texte(s, c) {
      const e = el("div", "ppTxt", s); e.style.color = c || "#fff"; sc.appendChild(e); setTimeout(() => e.remove(), 650);
    }
    function recommencer() {
      notes.forEach(n => n.el && n.el.remove());
      notes = composer(); ct = 0; vies = NV; fait = 0; prog(0); majPips();
    }
    function rate(n) {
      n.ok = false; fait++; vies--; majPips(); texte("Raté…", "#ff8a98");
      sc.classList.remove("crHit"); void sc.offsetWidth; sc.classList.add("crHit");
      if (n.el) n.el.remove();
      if (vies <= 0) { info.textContent = "Le concert s’effondre ! On recommence…"; pause = 1.4; }
    }
    function appui(i) {
      if (pause > 0) return;
      pqSon(FREQ[i]);
      lanes[i].classList.remove("hit"); void lanes[i].offsetWidth; lanes[i].classList.add("hit");
      let best = null, bd = 9;
      notes.forEach(n => { if (n.l === i && n.ok === null) { const d = Math.abs(ct - n.t); if (d < bd) { bd = d; best = n; } } });
      if (best && bd <= FEN) {
        best.ok = true; fait++; prog(fait / m.p);
        texte(bd < .09 ? "Parfait !" : "Bien", bd < .09 ? "#ffe27a" : "#fff");
        if (best.el) best.el.remove();
      } else {
        vies--; majPips(); texte("Faux !", "#ff8a98");
        sc.classList.remove("crHit"); void sc.offsetWidth; sc.classList.add("crHit");
        if (vies <= 0) { info.textContent = "Le concert s’effondre ! On recommence…"; pause = 1.4; }
      }
    }
    COL.forEach((c, i) => {
      const b = el("button", "ppB", SYM[i]); b.style.background = c;
      b.addEventListener("pointerdown", e => { e.preventDefault(); b.classList.add("on"); appui(i); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(n => b.addEventListener(n, () => b.classList.remove("on")));
      btns.appendChild(b);
    });
    notes = composer(); majPips();

    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) { recommencer(); info.textContent = "Touche la piste quand la note passe sur la ligne"; }
      } else {
        ct += dt;
        notes.forEach(n => {
          if (n.ok !== null) return;
          const y = HIT - (n.t - ct) / FALL * HIT;
          if (!n.el && y > -30) {
            n.el = el("div", "ppN", SYM[n.l]); n.el.style.background = COL[n.l]; n.el.style.color = COL[n.l];
            n.el.firstChild && (n.el.style.setProperty("color", COL[n.l]));
            n.el.style.textShadow = "none"; n.el.style.webkitTextFillColor = "#fff";
            lanes[n.l].appendChild(n.el);
          }
          if (n.el) n.el.style.top = y + "px";
          if (ct - n.t > FEN && pause <= 0) rate(n);
        });
        if (pause <= 0 && notes.every(n => n.ok !== null)) {
          if (vies > 0) { vivant = false; prog(1); ok(); return; }
        }
      }
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 2 — Tourbillon (m.p = nb de tours de doigt nécessaires, ex. 8)
     Fais des cercles autour du nid : le vent monte, soulève les plumes,
     puis le nid, puis les œufs. La jauge baisse dès que tu t'arrêtes. */
  tourbillon(z, m, prog, ok) {
    ppCss();
    const W = 320, H = 320, CX = W / 2, CY = H * .62;
    const sc = el("div", "pqScene ppNuit"); sc.style.height = H + "px";
    const vent = el("div", "ppVent"), guide = el("div", "ppGuide"), finger = el("div", "ppFinger");
    const jauge = el("div", "ppJauge"), fill = el("i"); jauge.appendChild(fill);
    sc.appendChild(vent); sc.appendChild(guide);
    const nest = el("div", "ppNest"); nest.style.left = "50%"; nest.style.top = "62%";
    const obj = [];
    const add = (emoji, ox, oy, th, base) => {
      const e = el("div", "ppObj", emoji); e.style.left = (CX + ox) + "px"; e.style.top = (CY + oy) + "px"; sc.appendChild(e);
      obj.push({ e, ox, oy, th, a: Math.random() * 6.28, big: base || 0 });
    };
    obj.push({ e: nest, ox: 0, oy: 0, th: .42, a: 0, nest: true });
    sc.appendChild(nest);
    for (let i = 0; i < 3; i++) add("🥚", -22 + i * 22, -6, .6 + i * .08);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; add("🪶", Math.cos(a) * 62, Math.sin(a) * 26 + 6, .04 + i * .07); }
    sc.appendChild(jauge); sc.appendChild(finger);
    const info = el("div", "mnMiHint", "Fais des cercles avec le doigt autour du nid !");
    z.appendChild(sc); z.appendChild(info);

    let g = 0, down = false, la = 0, spin = 0, time = 0, fin = 0, last = performance.now(), raf = 0, vivant = true;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const pos = e => { const r = sc.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    sc.addEventListener("pointerdown", e => {
      e.preventDefault(); down = true; const [x, y] = pos(e); la = Math.atan2(y - CY, x - CX);
      finger.style.display = "block"; finger.style.left = x + "px"; finger.style.top = y + "px";
    });
    const fin_ = () => { down = false; finger.style.display = "none"; };
    sc.addEventListener("pointerup", fin_); sc.addEventListener("pointercancel", fin_); sc.addEventListener("pointerleave", fin_);
    sc.addEventListener("pointermove", e => {
      if (!down || fin) return;
      const [x, y] = pos(e); finger.style.left = x + "px"; finger.style.top = y + "px";
      if (Math.hypot(x - CX, y - CY) < 24) return;
      const a = Math.atan2(y - CY, x - CX); let d = a - la;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      la = a;
      if (Math.abs(d) < 1.3) { g = Math.min(1, g + Math.abs(d) / (2 * Math.PI * m.p)); spin = Math.min(1, spin + Math.abs(d) * .4); }
    });

    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now; time += dt;
      if (!fin) {
        g = Math.max(0, g - .10 * dt); spin = Math.max(0, spin - dt * 2.2);
        if (g >= 1) { fin = .001; info.textContent = "Tout s’envole !"; }
      } else { fin += dt; }
      prog(g);
      fill.style.width = (g * 100) + "%";
      vent.style.opacity = clamp(g * 1.4 + spin * .3, 0, .9);
      vent.style.transform = "rotate(" + (time * (160 + 700 * g)) + "deg) scale(" + (.8 + g * .5) + ")";
      obj.forEach(o => {
        const l = clamp((g - o.th) / .2, 0, 1);
        const a = o.a + time * (2.5 + 5 * g);
        const r = 20 + 70 * l;
        let dx = Math.cos(a) * r * l, dy = -l * 150 + Math.sin(a) * r * .3 * l;
        if (fin) dy -= fin * fin * 420;
        if (o.nest) o.e.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + (l * Math.sin(time * 6) * 14) + "deg)";
        else o.e.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + (l * a * 40) + "deg)";
        o.e.style.opacity = fin ? clamp(1 - fin * .9, 0, 1) : 1;
      });
      if (fin > 1.2) { vivant = false; prog(1); ok(); return; }
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  }
};

Object.keys(JEUX_PERRO2).forEach(k => { JEUX[k] = JEUX_PERRO2[k]; });

const SINGE_CSS = `
.sgScene{position:relative;width:100%;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#a8e6b4 0,#3aa66f 45%,#1b6a4a 100%);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 50px rgba(0,0,0,.45);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sgNuit{background:radial-gradient(ellipse at 70% 0,#5b4aa8 0,#2a1f5c 55%,#120c33 100%)}
.sgScene.sgHit{animation:mnShake .28s}
.sgScene[data-ph=libre]{border-color:#4cd964}
.sgScene[data-ph=alerte]{border-color:#ffc43d}
.sgScene[data-ph=garde]{border-color:#ff3b55;box-shadow:inset 0 0 60px rgba(255,59,85,.4)}
.sgDeco{position:absolute;pointer-events:none;opacity:.9;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}
.sgHud{position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;text-shadow:0 1px 3px #000;z-index:6;pointer-events:none}
.sgCv{display:block;width:100%;max-width:340px;height:auto;border-radius:20px;border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 40px rgba(0,0,0,.4);touch-action:none;user-select:none;-webkit-user-select:none}
.sgPop{position:absolute;z-index:7;font-size:2rem;pointer-events:none;animation:sgUp .7s forwards}
.sgTube{position:absolute;top:40px;bottom:100px;width:34px;border-radius:17px;background:rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.3);overflow:hidden;z-index:2}
.sgTube.g{left:14px}.sgTube.d{right:14px}
.sgZone{position:absolute;left:0;right:0;bottom:30%;height:45%;background:rgba(76,217,100,.35);border-top:2px dashed #4cd964;border-bottom:2px dashed #4cd964}
.sgFill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#ffc43d,#fff3b8);height:50%;border-radius:0 0 15px 15px}
.sgFill.mal{background:linear-gradient(0deg,#ff3b55,#ff9aa6)}
.sgPont{position:absolute;left:18%;right:18%;top:44%;height:34px;display:flex;transition:none}
.sgPont::before{content:"";position:absolute;left:-8%;right:-8%;top:-26px;height:6px;border-radius:3px;background:#d9b66a;box-shadow:0 3px 4px rgba(0,0,0,.4)}
.sgPlanche{flex:1;margin:0 2px;border-radius:4px;background:linear-gradient(#b07a3f,#7a4f24);box-shadow:0 4px 5px rgba(0,0,0,.45)}
.sgSinge{position:absolute;left:50%;top:-46px;margin-left:-20px;font-size:2.4rem;line-height:1}
.sgPad{position:absolute;bottom:12px;width:calc(50% - 20px);height:72px;border:0;border-radius:22px;font-weight:900;font-size:1.1rem;background:linear-gradient(#f0cd8a,#b07a3f);color:#3b2410;box-shadow:0 6px 0 rgba(0,0,0,.4);touch-action:none;transition:transform .08s,filter .08s}
.sgPad.g{left:12px}.sgPad.d{right:12px}
.sgPad.on{transform:translateY(5px);filter:brightness(1.2);box-shadow:0 1px 0 rgba(0,0,0,.4)}
.sgZ{position:absolute;display:flex;flex-direction:column;align-items:center;font-size:2.6rem;line-height:1;font-weight:800;z-index:1;transition:transform .12s,filter .12s;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.6)}
.sgZ small{font-size:.7rem;letter-spacing:.06em;margin-top:2px}
.sgZ.on{transform:scale(1.28);filter:brightness(1.35) drop-shadow(0 0 10px #fff)}
.sgZ.d{right:12px;top:56%}.sgZ.g{left:12px;top:56%}.sgZ.h{left:50%;top:34px;margin-left:-30px;width:60px}
.sgBan{position:absolute;left:50%;top:62%;width:120px;height:120px;margin:-60px 0 0 -60px;display:flex;align-items:center;justify-content:center;font-size:5rem;touch-action:none;cursor:grab;z-index:3;transition:transform .2s}
.sgBan span{position:relative;display:block;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5))}
.sgBan .sgFly{position:absolute;right:-8px;top:-6px;font-size:1.6rem;animation:sgBuzz .3s infinite alternate}
.sgTime{position:absolute;left:50%;top:calc(62% + 70px);width:120px;margin-left:-60px;height:8px;border-radius:99px;background:rgba(255,255,255,.22);overflow:hidden;z-index:2}
.sgTime i{display:block;height:100%;width:100%;background:#ffc43d}
.sgPoutre{position:absolute;left:8%;right:8%;top:46%;height:48px;border-radius:8px;background:repeating-linear-gradient(90deg,rgba(0,0,0,.1) 0 2px,transparent 2px 24px),linear-gradient(#b47a42,#7a4f24);box-shadow:0 8px 12px rgba(0,0,0,.5)}
.sgPoutre .g1,.sgPoutre .g2{position:absolute;top:0;bottom:0;width:50%;background:inherit;transition:transform .6s ease-in}
.sgPoutre .g1{left:0;border-radius:8px 0 0 8px}.sgPoutre .g2{right:0;border-radius:0 8px 8px 0}
.sgPoutre.casse .g1{transform:translate(-14px,60px) rotate(-18deg)}.sgPoutre.casse .g2{transform:translate(14px,60px) rotate(18deg)}
.sgFente{position:absolute;left:50%;top:0;width:7px;margin-left:-3px;height:0;background:#1a0f06;z-index:2;clip-path:polygon(0 0,100% 0,60% 100%,40% 100%)}
.sgScie{position:absolute;top:calc(46% - 46px);left:50%;font-size:3.1rem;line-height:1;transform:translateX(-50%);z-index:3;filter:drop-shadow(0 6px 6px rgba(0,0,0,.5))}
.sgVit{position:absolute;left:12%;right:12%;top:74%;height:16px;border-radius:99px;background:linear-gradient(90deg,#4aa3ff 0 25%,#4cd964 25% 75%,#ff5468 75%);box-shadow:0 3px 6px rgba(0,0,0,.4)}
.sgVit i{position:absolute;top:-6px;width:8px;height:28px;margin-left:-4px;border-radius:4px;background:#fff;box-shadow:0 0 8px #000;left:0}
.sgVitT{position:absolute;left:0;right:0;top:calc(74% + 26px);text-align:center;font-weight:800;font-size:.9rem;text-shadow:0 1px 3px #000}
.sgSingeH{position:absolute;left:0;right:0;top:44px;text-align:center;font-size:2.2rem;letter-spacing:.3em}
.sgBruit{position:absolute;left:14px;right:14px;top:30px;height:10px;border-radius:99px;background:rgba(0,0,0,.35);overflow:hidden;z-index:5}
.sgBruit i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffc43d,#ff3b55)}
.sgPontH{position:absolute;left:10px;right:10px;top:46px;height:200px}
.sgPontH canvas{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:10px;touch-action:none}
.sgGarde{position:absolute;top:130px;font-size:3.2rem;line-height:1;transform:translateX(-50%);z-index:6;pointer-events:none;display:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.5))}
.sgPend{position:absolute;left:50%;top:26px;width:280px;height:230px;margin-left:-140px;transform-origin:50% 0;z-index:2}
.sgBarre{position:absolute;left:6%;right:6%;top:18px;height:12px;border-radius:6px;background:linear-gradient(#8a5a2b,#5a3a1a);box-shadow:0 4px 8px rgba(0,0,0,.5);z-index:3}
.sgCentre{position:absolute;left:50%;top:150px;width:60px;height:116px;margin-left:-30px;border-radius:14px;background:rgba(140,236,255,.1);border:2px dashed rgba(140,236,255,.5);transition:background .08s}
.sgCentre.ok{background:rgba(140,236,255,.5);border-style:solid}
.sgPush{position:absolute;bottom:10px;left:50%;width:170px;height:58px;margin-left:-85px;border:0;border-radius:30px;background:linear-gradient(#c8f6ff,#6fd0e8);font-weight:900;font-size:1.05rem;color:#0b3040;box-shadow:0 6px 0 rgba(0,0,0,.4);z-index:4;touch-action:none}
.sgJauge{position:absolute;top:30px;left:14px;right:14px;height:10px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;z-index:5;pointer-events:none}
.sgJauge i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8cecff,#fff);border-radius:99px}
@keyframes sgUp{to{transform:translateY(-34px);opacity:0}}
@keyframes sgBuzz{to{transform:translate(4px,-3px)}}
`;

let sgCssOk = false;
function sgCss() {
  if (sgCssOk) return; sgCssOk = true;
  const s = document.createElement("style");
  s.textContent = SINGE_CSS;
  document.head.appendChild(s);
}
const sgRnd = (a, b) => a + Math.random() * (b - a);
const sgClamp = (v, a, b) => Math.max(a, Math.min(b, v));

function sgScene(z, h, cls, deco) {
  sgCss();
  const s = el("div", "sgScene" + (cls ? " " + cls : "")); s.style.height = h + "px";
  (deco === false ? [] : [["🌴", 1, 10, 2.4], ["🌿", 91, 14, 2], ["🍃", 88, 88, 1.6]]).forEach(([e, x, y, sz]) => {
    const d = el("div", "sgDeco", e); d.style.left = x + "%"; d.style.top = y + "%"; d.style.fontSize = sz + "rem"; s.appendChild(d);
  });
  z.appendChild(s);
  return s;
}
function sgShake(sc) { sc.classList.remove("sgHit"); void sc.offsetWidth; sc.classList.add("sgHit"); }
function sgPop(sc, emoji, x, y) {
  const p = el("div", "sgPop", emoji); p.style.left = x + "%"; p.style.top = y + "%"; sc.appendChild(p);
  setTimeout(() => p.remove(), 720);
}

const JEUX_SINGES = {

  /* CIVIL 1 — Retendre les cordes (m.p = secondes à tenir, ex. 10)
     Maintiens GAUCHE / DROITE pour retendre chaque corde. Elles se détendent
     toutes seules, à des rythmes différents (+ rafales de vent).
     Les 2 jauges doivent rester dans la zone verte ; le temps ne compte que
     quand les deux y sont. Corde à 0 ou à 100 % = elle craque, on recommence. */
  cordes(z, m, prog, ok) {
    const sc = sgScene(z, 330);
    const hud = el("div", "sgHud"), info = el("span"), alerte = el("span");
    hud.appendChild(info); hud.appendChild(alerte); sc.appendChild(hud);
    const fills = ["g", "d"].map(c => {
      const t = el("div", "sgTube " + c), f = el("div", "sgFill");
      t.appendChild(el("div", "sgZone")); t.appendChild(f); sc.appendChild(t); return f;
    });
    const pont = el("div", "sgPont");
    for (let i = 0; i < 7; i++) pont.appendChild(el("div", "sgPlanche"));
    pont.appendChild(el("div", "sgSinge", "🐒")); sc.appendChild(pont);
    const press = [false, false];
    ["g", "d"].forEach((c, i) => {
      const b = el("button", "sgPad " + c, i ? "Droite ✊" : "✊ Gauche");
      b.addEventListener("pointerdown", e => { e.preventDefault(); press[i] = true; b.classList.add("on"); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(n => b.addEventListener(n, () => { press[i] = false; b.classList.remove("on"); }));
      sc.appendChild(b);
    });
    const hint = el("div", "mnMiHint", "Garde les deux jauges dans le vert"); z.appendChild(hint);

    const Z0 = .3, Z1 = .75;
    let T = [.55, .55], time = 0, gagne = 0, danger = 0, pause = 0, gust = 3, last = performance.now(), raf = 0, vivant = true;
    function echec(msg) {
      hint.textContent = msg + " On recommence…"; pause = 1.3; sgShake(sc);
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) { T = [.55, .55]; gagne = 0; danger = 0; time = 0; gust = 3; prog(0); hint.textContent = "Garde les deux jauges dans le vert"; }
      } else {
        time += dt; gust -= dt;
        if (gust <= 0) {
          gust = sgRnd(3, 5); const s = Math.random() < .5 ? 0 : 1;
          T[s] = Math.max(.04, T[s] - .2); sgPop(sc, "💨", s ? 82 : 8, 40);
        }
        for (let s = 0; s < 2; s++) {
          const rate = Math.max(.03, .2 + .14 * Math.sin(time * .9 + s * 2.1) + .06 * Math.sin(time * 2.3 + s));
          T[s] += (press[s] ? .55 : -rate) * dt;
        }
        const hors = T.some(v => v < Z0 || v > Z1);
        if (T[0] <= 0 || T[1] <= 0) echec("Une corde s’est détendue !");
        else if (T[0] >= 1 || T[1] >= 1) echec("Une corde a craqué !");
        else if (hors) { danger += dt; if (danger > 2) echec("Le pont s’affaisse !"); }
        else { danger = Math.max(0, danger - dt * .5); gagne += dt; prog(gagne / m.p); }
        if (hors && danger <= 2 && pause <= 0) hint.textContent = "Attention aux cordes !";
        else if (pause <= 0) hint.textContent = "Garde les deux jauges dans le vert";
        if (gagne >= m.p) { vivant = false; prog(1); ok(); return; }
      }
      const tt = pause > 0 ? [.55, .55] : T;
      fills.forEach((f, i) => { f.style.height = (sgClamp(tt[i], 0, 1) * 100) + "%"; f.classList.toggle("mal", tt[i] < Z0 || tt[i] > Z1); });
      pont.style.transform = "translateY(" + ((.6 - (tt[0] + tt[1]) / 2) * 60) + "px) rotate(" + ((tt[0] - tt[1]) * 30) + "deg)";
      info.textContent = "⏱ " + Math.max(0, Math.ceil(m.p - gagne)) + " s";
      alerte.textContent = pause <= 0 && danger > .1 ? "⚠️" : "";
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* CIVIL 2 — Trier les bananes (m.p = nb de bananes, ex. 12)
     Glisse la banane : mûre → droite (panier), pourrie → gauche (poubelle),
     verte → en haut (retour à l'arbre). Temps limité par banane, 3 vies. */
  bananes(z, m, prog, ok) {
    const sc = sgScene(z, 340);
    const hud = el("div", "sgHud"), cpt = el("span"), vies = el("span");
    hud.appendChild(cpt); hud.appendChild(vies); sc.appendChild(hud);
    const zone = (e, t, c) => { const d = el("div", "sgZ " + c, e); d.appendChild(el("small", "", t)); sc.appendChild(d); return d; };
    const Z = { d: zone("🧺", "MÛRE", "d"), g: zone("🗑️", "POURRIE", "g"), h: zone("🌿", "VERTE", "h") };
    const ban = el("div", "sgBan"), emoji = el("span", "", "🍌"), tbar = el("div", "sgTime"), ti = el("i");
    ban.appendChild(emoji); tbar.appendChild(ti); sc.appendChild(ban); sc.appendChild(tbar);
    const hint = el("div", "mnMiHint", "Glisse chaque banane dans la bonne zone"); z.appendChild(hint);

    const ATT = { mure: "d", pourrie: "g", verte: "h" };
    const FILT = { mure: "", pourrie: "sepia(1) saturate(1.6) brightness(.45) hue-rotate(-18deg)", verte: "hue-rotate(78deg) saturate(1.5)" };
    const tm = [];
    let n = 0, vie = 3, type = "mure", T = 3.8, tl = 3.8, busy = true, drag = false, last = performance.now(), raf = 0, vivant = true;
    const maj = () => { cpt.textContent = "🍌 " + n + "/" + m.p; vies.textContent = "❤️".repeat(vie) + "🖤".repeat(3 - vie); };
    function nouvelle() {
      const r = Math.random();
      type = (n >= 3 && r < .22) ? "verte" : (r < .6 ? "mure" : "pourrie");
      T = Math.max(2.2, 3.8 - .12 * n); tl = T;
      emoji.style.filter = FILT[type];
      const f = ban.querySelector(".sgFly"); if (f) f.remove();
      if (type === "pourrie") ban.appendChild(el("div", "sgFly", "🪰"));
      ban.style.transition = "none"; ban.style.transform = "scale(.3)"; ban.style.opacity = "0";
      void ban.offsetWidth;
      ban.style.transition = "transform .2s,opacity .2s"; ban.style.transform = ""; ban.style.opacity = "1";
      busy = false; maj();
    }
    function perdre(msg) {
      vie--; sgShake(sc); hint.textContent = msg; maj();
      if (vie <= 0) {
        hint.textContent = "Les singes râlent ! On recommence…"; n = 0; vie = 3; prog(0);
        tm.push(setTimeout(() => { hint.textContent = "Glisse chaque banane dans la bonne zone"; maj(); nouvelle(); }, 1100));
      } else tm.push(setTimeout(nouvelle, 400));
    }
    function dirDe(dx, dy, s) {
      if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > s) return dx > 0 ? "d" : "g";
      if (dy < -s) return "h";
      return null;
    }
    function resoudre(dir, dx, dy) {
      busy = true; drag = false;
      Object.values(Z).forEach(e => e.classList.remove("on"));
      if (dir === ATT[type]) {
        n++; prog(n / m.p); maj(); hint.textContent = "Bien trié !";
        const fx = dir === "d" ? 220 : dir === "g" ? -220 : 0, fy = dir === "h" ? -220 : 0;
        ban.style.transition = "transform .25s,opacity .25s";
        ban.style.transform = "translate(" + fx + "px," + fy + "px) scale(.4)"; ban.style.opacity = "0";
        if (n >= m.p) tm.push(setTimeout(ok, 350)); else tm.push(setTimeout(nouvelle, 300));
      } else {
        ban.style.transition = "transform .25s,opacity .25s"; ban.style.opacity = "0";
        perdre(type === "verte" ? "Elle n’est pas mûre !" : type === "pourrie" ? "Beurk, c’est pourri !" : "Elle était bonne !");
      }
    }
    ban.addEventListener("pointerdown", e => {
      if (busy) return; e.preventDefault(); drag = true;
      const x0 = e.clientX, y0 = e.clientY; ban.style.transition = "none";
      const mv = ev => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        ban.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + (dx * .1) + "deg)";
        const d = dirDe(dx, dy, 30);
        Object.keys(Z).forEach(k => Z[k].classList.toggle("on", k === d));
      };
      const up = ev => {
        window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        if (busy) return;
        const dx = ev.clientX - x0, dy = ev.clientY - y0, d = dirDe(dx, dy, 55);
        if (d) resoudre(d, dx, dy);
        else { drag = false; ban.style.transition = "transform .2s"; ban.style.transform = ""; Object.values(Z).forEach(q => q.classList.remove("on")); }
      };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    });
    maj(); nouvelle();
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (!busy) {
        tl -= dt; ti.style.width = Math.max(0, tl / T * 100) + "%";
        ti.style.background = tl / T < .3 ? "#ff5468" : "#ffc43d";
        if (tl <= 0) { busy = true; drag = false; ban.style.transition = "opacity .25s"; ban.style.opacity = "0"; ban.style.transform = ""; Object.values(Z).forEach(q => q.classList.remove("on")); perdre("Trop lent !"); }
      }
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); tm.forEach(clearTimeout); };
  },

  /* IMPOSTEUR 1 — Scier la planche (m.p = secondes de sciage régulier, ex. 6)
     Fais des allers-retours avec le doigt. Vitesse dans la zone verte = la
     planche se fend. Trop vite = le bruit monte et les singes se réveillent. */
  scie(z, m, prog, ok) {
    const W = 320, CXs = W / 2;
    const sc = sgScene(z, 320);
    const hud = el("div", "sgHud"), info = el("span"), sing = el("span");
    hud.appendChild(info); hud.appendChild(sing); sc.appendChild(hud);
    const bruitB = el("div", "sgBruit"), bruitI = el("i"); bruitB.appendChild(bruitI); sc.appendChild(bruitB);
    const poutre = el("div", "sgPoutre"), g1 = el("div", "g1"), g2 = el("div", "g2"), fente = el("div", "sgFente");
    poutre.appendChild(g1); poutre.appendChild(g2); poutre.appendChild(fente); sc.appendChild(poutre);
    const scie = el("div", "sgScie", "🪚"); sc.appendChild(scie);
    const vit = el("div", "sgVit"), mk = el("i"); vit.appendChild(mk); sc.appendChild(vit);
    const vitT = el("div", "sgVitT"); sc.appendChild(vitT);
    const hint = el("div", "mnMiHint", "Fais des allers-retours avec le doigt, à rythme régulier"); z.appendChild(hint);

    const VMAX = 560, VLO = 140, VHI = 420;
    let down = false, lx = 0, moved = 0, v = 0, cut = 0, noise = 0, pause = 0, fin = 0, last = performance.now(), raf = 0, vivant = true;
    const px = e => { const r = sc.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
    sc.addEventListener("pointerdown", e => { e.preventDefault(); down = true; lx = px(e); });
    const lache = () => { down = false; };
    sc.addEventListener("pointerup", lache); sc.addEventListener("pointercancel", lache); sc.addEventListener("pointerleave", lache);
    sc.addEventListener("pointermove", e => {
      if (!down) return;
      const x = px(e); moved += Math.abs(x - lx); lx = x;
      scie.style.left = "calc(50% + " + sgClamp((x - CXs) * .35, -60, 60) + "px)";
    });
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) { cut = 0; noise = 0; v = 0; hint.textContent = "Fais des allers-retours avec le doigt, à rythme régulier"; }
      } else if (!fin) {
        const inst = moved / Math.max(dt, .001); moved = 0;
        v += (inst - v) * Math.min(1, dt * 10);
        if (!down) v *= .85;
        let etat = "lent";
        if (v > VHI) etat = "vite"; else if (v >= VLO) etat = "bien";
        if (etat === "bien") cut += dt;
        if (etat === "vite") noise += dt * .55; else noise = Math.max(0, noise - dt * .4);
        if (noise >= 1) { pause = 1.4; sgShake(sc); hint.textContent = "Les singes se réveillent ! On recommence…"; }
        else if (cut >= m.p) { fin = .001; poutre.classList.add("casse"); hint.textContent = "CRAAAC ! La planche est coupée."; }
        else if (down) hint.textContent = etat === "bien" ? "Bon rythme, continue !" : etat === "vite" ? "Trop vite, ils vont t’entendre !" : "Plus vite, la lame ne mord pas…";
        mk.style.left = sgClamp(v / VMAX, 0, 1) * 100 + "%";
        vitT.textContent = etat === "bien" ? "🪚 Rythme parfait" : etat === "vite" ? "🔊 Trop vite !" : "🐢 Trop lent";
      } else { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      prog(cut / m.p);
      fente.style.height = sgClamp(cut / m.p, 0, 1) * 100 + "%";
      bruitI.style.width = sgClamp(noise, 0, 1) * 100 + "%";
      sing.textContent = noise < .4 ? "🐒💤" : noise < .75 ? "🐒👀" : "🙊🚨";
      info.textContent = "🪚 " + Math.round(sgClamp(cut / m.p, 0, 1) * 100) + " %";
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* IMPOSTEUR 2 — Huiler les planches (m.p = % à couvrir, ex. 90)
     Frotte avec le doigt pour étaler l'huile. Quand un singe garde traverse
     le pont (alerte orange puis rouge), LÂCHE l'écran, sinon il nettoie tout. */
  huile(z, m, prog, ok) {
    const W = 320, H = 200, GX = 16, GY = 8, cw = W / GX, ch = H / GY, R = 20;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const sc = sgScene(z, 300); sc.dataset.ph = "libre";
    const hud = el("div", "sgHud"), pct = el("span"), etat = el("span");
    hud.appendChild(pct); hud.appendChild(etat); sc.appendChild(hud);
    const box = el("div", "sgPontH"); sc.appendChild(box);
    const mk = () => { const c = document.createElement("canvas"); c.width = W * dpr; c.height = H * dpr; box.appendChild(c); const x = c.getContext("2d"); x.scale(dpr, dpr); return [c, x]; };
    const [, bx] = mk(), [oc, ox] = mk();
    /* fond : planches + cordes */
    bx.fillStyle = "#2f2212"; bx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) {
      const g = bx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#b47a42"); g.addColorStop(1, "#7a4f24");
      bx.fillStyle = g; bx.fillRect(i * 40 + 2, 12, 36, H - 24);
      bx.strokeStyle = "rgba(0,0,0,.18)"; bx.lineWidth = 1;
      for (let k = 30; k < H - 20; k += 34) { bx.beginPath(); bx.moveTo(i * 40 + 6, k); bx.lineTo(i * 40 + 34, k + 4); bx.stroke(); }
    }
    bx.fillStyle = "#d9b66a"; bx.fillRect(0, 0, W, 12); bx.fillRect(0, H - 12, W, 12);
    const garde = el("div", "sgGarde", "🐒"); sc.appendChild(garde);
    const info = el("div", "mnMiHint"); z.appendChild(info);

    let grille = new Uint8Array(GX * GY), rempli = 0, down = false, lx = 0, ly = 0;
    let ph = "libre", pt = 3, dPh = 3, pause = 0, last = performance.now(), raf = 0, vivant = true;
    const txt = { libre: "Frotte les planches pour les huiler", alerte: "Le garde arrive ! LÂCHE L’ÉCRAN !", garde: "Il passe… ne touche à rien !" };
    const pos = e => { const r = oc.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    function marque(x, y) {
      for (let gx = Math.max(0, Math.floor((x - R) / cw)); gx <= Math.min(GX - 1, Math.floor((x + R) / cw)); gx++)
        for (let gy = Math.max(0, Math.floor((y - R) / ch)); gy <= Math.min(GY - 1, Math.floor((y + R) / ch)); gy++) {
          const i = gy * GX + gx;
          if (!grille[i] && Math.hypot((gx + .5) * cw - x, (gy + .5) * ch - y) <= R + 4) { grille[i] = 1; rempli++; }
        }
    }
    function trait(x0, y0, x1, y1) {
      ox.lineCap = "round"; ox.lineJoin = "round";
      ox.strokeStyle = "rgba(255,200,60,.55)"; ox.lineWidth = R * 2; ox.beginPath(); ox.moveTo(x0, y0); ox.lineTo(x1, y1); ox.stroke();
      ox.strokeStyle = "rgba(255,255,255,.28)"; ox.lineWidth = 7; ox.beginPath(); ox.moveTo(x0 - 4, y0 - 4); ox.lineTo(x1 - 4, y1 - 4); ox.stroke();
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 6));
      for (let i = 0; i <= n; i++) marque(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
    }
    oc.addEventListener("pointerdown", e => {
      e.preventDefault(); down = true; [lx, ly] = pos(e);
      if (pause <= 0) trait(lx, ly, lx, ly);
    });
    oc.addEventListener("pointermove", e => {
      if (!down || pause > 0) return;
      const [x, y] = pos(e); trait(lx, ly, x, y); lx = x; ly = y;
    });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(n => oc.addEventListener(n, lache));
    function phase(p, d) { ph = p; pt = d; dPh = d; sc.dataset.ph = p; info.textContent = txt[p]; garde.style.display = p === "libre" ? "none" : "block"; }
    function nettoye() {
      ox.clearRect(0, 0, W, H); grille = new Uint8Array(GX * GY); rempli = 0; prog(0);
      pause = 1.5; down = false; sgShake(sc); info.textContent = "Le garde a tout nettoyé ! On recommence…";
    }
    phase("libre", 3);

    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) phase("libre", sgRnd(3, 4.5));
      } else {
        pt -= dt;
        if (ph === "libre" && pt <= 0) phase("alerte", .9);
        else if (ph === "alerte" && pt <= 0) phase("garde", 1.4);
        else if (ph === "garde" && pt <= 0) phase("libre", sgRnd(3, 4.5));
        if (ph === "alerte") garde.style.left = (-10 + (1 - pt / dPh) * 30) + "%";
        if (ph === "garde") garde.style.left = (20 + (1 - pt / dPh) * 92) + "%";
        if (ph === "garde" && down) nettoye();
        const c = rempli / (GX * GY) * 100;
        prog(Math.min(1, c / m.p));
        if (c >= m.p) { vivant = false; prog(1); ok(); return; }
      }
      pct.textContent = "🛢️ " + Math.round(rempli / (GX * GY) * 100) + " % / " + m.p + " %";
      etat.textContent = ph === "alerte" ? "❗" : ph === "garde" ? "👀" : "";
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 1 — Balancer le pont (m.p = amplitude cible en degrés, ex. 36)
     Le pont oscille. Touche (n'importe où) quand il repasse par la zone du
     centre pour le pousser : +amplitude. Trop tôt / trop tard = il freine. */
  balancier(z, m, prog, ok) {
    const sc = sgScene(z, 320, "sgNuit", false);
    const hud = el("div", "sgHud"), info = el("span"), etat = el("span");
    hud.appendChild(info); hud.appendChild(etat); sc.appendChild(hud);
    const jb = el("div", "sgJauge"), ji = el("i"); jb.appendChild(ji); sc.appendChild(jb);
    sc.appendChild(el("div", "sgBarre"));
    const centre = el("div", "sgCentre"); sc.appendChild(centre);
    const pend = el("div", "sgPend");
    let planks = "";
    for (let i = 0; i < 8; i++) planks += '<rect x="' + (12 + i * 32) + '" y="168" width="28" height="16" rx="3" fill="#b07a3f" stroke="#5a3a1a"/>';
    pend.innerHTML = '<svg viewBox="0 0 280 230" width="280" height="230"><path d="M140 0L16 168M140 0L264 168" stroke="#d9b66a" stroke-width="4" fill="none"/>' + planks +
      '<text x="56" y="164" font-size="30">🐒</text><text x="124" y="164" font-size="30">🐵</text><text x="192" y="164" font-size="30">🙈</text></svg>';
    sc.appendChild(pend);
    const push = el("button", "sgPush", "👻 POUSSER"); sc.appendChild(push);
    const hint = el("div", "mnMiHint", "Touche quand le pont passe par le centre"); z.appendChild(hint);

    const OM = Math.PI * .95, MAXA = m.p;
    let A = 8, phi = 0, lock = 0, fin = 0, last = performance.now(), raf = 0, vivant = true;
    sc.addEventListener("pointerdown", e => {
      e.preventDefault(); if (fin || lock > 0) return;
      push.style.transform = "translateY(4px)"; setTimeout(() => { push.style.transform = ""; }, 120);
      lock = .5;
      sc.addEventListener("pointerdown", e => {
      e.preventDefault(); if (fin || lock > 0) return;
      push.style.transform = "translateY(4px)"; setTimeout(() => { push.style.transform = ""; }, 120);
      lock = .5;
      if (Math.abs(Math.sin(phi)) < .4) {
        A += 6; sgPop(sc, "✨", 46, 20);
        hint.textContent = "Bien poussé !";
      } else {
        A = Math.max(4, A - 5); sgShake(sc); hint.textContent = "Mal calé ! Il freine…";
      }
    });
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      lock = Math.max(0, lock - dt);
      if (!fin) {
        phi += OM * dt;
        if (A >= MAXA) {
          A = MAXA;
          fin = .001;
          hint.textContent = "Le pont se balance à toute vitesse !";
        } else {
          A = Math.max(4, A - 1.2 * dt);
        }
      } else { fin += dt; if (fin > 1.2) { vivant = false; prog(1); ok(); return; } }
      const th = A * Math.sin(phi);
      pend.style.transform = "rotate(" + th + "deg)";
      centre.classList.toggle("ok", Math.abs(Math.sin(phi)) < .4 && !fin);
      prog(A / MAXA); ji.style.width = (A / MAXA * 100) + "%";
      info.textContent = "Amplitude " + Math.round(A) + "° / " + MAXA + "°";
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 2 — Fronde fantôme (m.p = cibles à toucher, ex. 5 ; tirs = m.p + 3)
     Étire l'élastique en tirant vers l'arrière, relâche pour lancer la banane. */
  fronde(z, m, prog, ok) {
    sgCss();
    const W = 320, H = 280, AX = 56, AY = 212, MAXP = 70, K = 7, G = 600;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = el("canvas", "sgCv"); cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext("2d"); c.scale(dpr, dpr);
    z.appendChild(cv);
    const hint = el("div", "mnMiHint", "Tire en arrière puis relâche pour viser"); z.appendChild(hint);

    let shots = m.p + 3, hits = 0, pull = null, proj = null, pops = [], pause = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    let cibles = [];
    function placer(t, autres) {
      for (let k = 0; k < 20; k++) {
        const x = sgRnd(150, 288), y = sgRnd(50, 190);
        if (autres.every(o => !o.alive || Math.hypot(o.x - x, o.y0 - y) > 62)) { t.x = x; t.y0 = y; return; }
      }
      t.x = sgRnd(150, 288); t.y0 = sgRnd(50, 190);
    }
    function init() {
      shots = m.p + 3; hits = 0; proj = null; pull = null; pops = []; prog(0);
      cibles = [0, 1, 2].map(i => ({ x: 0, y0: 0, ph: i * 2, alive: true, re: 0, e: ["🐒", "🐵", "🙈"][i] }));
      cibles.forEach(t => placer(t, cibles.filter(o => o !== t)));
    }
    init();
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    function borne(x, y) {
      let dx = x - AX, dy = y - AY; const d = Math.hypot(dx, dy);
      if (d > MAXP) { dx = dx / d * MAXP; dy = dy / d * MAXP; }
      return { x: AX + dx, y: AY + dy };
    }
    cv.addEventListener("pointerdown", e => {
      e.preventDefault(); if (proj || pause > 0) return;
      const [x, y] = pos(e); pull = borne(x, y);
    });
    cv.addEventListener("pointermove", e => { if (!pull) return; const [x, y] = pos(e); pull = borne(x, y); });
    function relache() {
      if (!pull) return;
      const vx = (AX - pull.x) * K, vy = (AY - pull.y) * K;
      if (Math.hypot(AX - pull.x, AY - pull.y) < 14) { pull = null; return; }
      proj = { x: pull.x, y: pull.y, vx, vy }; shots--; pull = null;
    }
    cv.addEventListener("pointerup", relache); cv.addEventListener("pointercancel", () => { pull = null; });

    const ty = t => t.y0 + Math.sin(time * 1.4 + t.ph) * 12;
    function dessiner() {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#5b4aa8"); gr.addColorStop(.6, "#2a1f5c"); gr.addColorStop(1, "#120c33");
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,246,200,.9)"; c.beginPath(); c.arc(W - 56, 48, 24, 0, 7); c.fill();
      [[110, 150, 90], [196, 130, 110], [268, 160, 80]].forEach(([x, h, r]) => {
        c.fillStyle = "#1a1245"; c.fillRect(x, H - 30 - h, 12, h);
        c.fillStyle = "#231a5a"; c.beginPath(); c.arc(x + 6, H - 30 - h, r * .38, 0, 7); c.fill();
      });
      c.fillStyle = "#1c1550"; c.fillRect(0, H - 30, W, 30);
      c.fillStyle = "#2a2070"; c.fillRect(0, H - 30, W, 4);
      /* cibles */
      c.font = "34px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      cibles.forEach(t => { if (t.alive) { c.globalAlpha = .92; c.fillText(t.e, t.x, ty(t)); c.globalAlpha = 1; } });
      /* fronde */
      c.lineCap = "round";
      c.strokeStyle = "#7a4f24"; c.lineWidth = 8;
      c.beginPath(); c.moveTo(AX, H - 30); c.lineTo(AX, AY + 12); c.stroke();
      c.beginPath(); c.moveTo(AX - 14, AY - 10); c.lineTo(AX, AY + 12); c.lineTo(AX + 14, AY - 10); c.stroke();
      const bx = pull ? pull.x : AX, by = pull ? pull.y : AY;
      c.strokeStyle = "#e8c07a"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(AX - 14, AY - 10); c.lineTo(bx, by); c.lineTo(AX + 14, AY - 10); c.stroke();
      if (pull) {
        const vx = (AX - pull.x) * K, vy = (AY - pull.y) * K;
        for (let i = 1; i <= 9; i++) {
          const t = i * .075;
          c.fillStyle = "rgba(255,255,255," + (.7 - i * .06) + ")";
          c.beginPath(); c.arc(pull.x + vx * t, pull.y + vy * t + .5 * G * t * t, 3.5, 0, 7); c.fill();
        }
        c.fillText("🍌", pull.x, pull.y);
      } else if (!proj && shots > 0) c.fillText("🍌", AX, AY);
      if (proj) c.fillText("🍌", proj.x, proj.y);
      pops.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.a * 2); c.font = (30 + p.a * 40) + "px serif"; c.fillText("💥", p.x, p.y); c.globalAlpha = 1; });
      /* HUD */
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textBaseline = "alphabetic";
      c.textAlign = "left"; c.fillText("🍌 " + shots, 12, 22);
      c.textAlign = "right"; c.fillText("🎯 " + hits + "/" + m.p, W - 12, 22);
      c.shadowBlur = 0;
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      pops.forEach(p => { p.a += dt * 2.2; }); pops = pops.filter(p => p.a < .5);
      cibles.forEach(t => { if (!t.alive) { t.re -= dt; if (t.re <= 0) { placer(t, cibles); t.alive = true; } } });
      if (pause > 0) {
        pause -= dt; if (pause <= 0) { init(); hint.textContent = "Tire en arrière puis relâche pour viser"; }
      } else if (proj) {
        proj.vy += G * dt; proj.x += proj.vx * dt; proj.y += proj.vy * dt;
        let fini = false;
        for (const t of cibles) {
          if (t.alive && Math.hypot(proj.x - t.x, proj.y - ty(t)) < 28) {
            t.alive = false; t.re = .7; hits++; prog(hits / m.p); pops.push({ x: t.x, y: ty(t), a: 0 }); fini = true; break;
          }
        }
        if (!fini && (proj.x > W + 30 || proj.x < -30 || proj.y > H - 26)) fini = true;
        if (fini) {
          proj = null;
          if (hits >= m.p) { vivant = false; prog(1); dessiner(); ok(); return; }
          if (shots <= 0) { pause = 1.4; hint.textContent = "Plus de bananes ! On recommence…"; }
        }
      }
      dessiner();
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  }
};

Object.keys(JEUX_SINGES).forEach(k => { JEUX[k] = JEUX_SINGES[k]; });

const GROTTE_CSS = `
.grCv{display:block;width:100%;max-width:340px;height:auto;border-radius:20px;border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 40px rgba(0,0,0,.5);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.grScene{position:relative;width:100%;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at 50% 20%,#39425f 0,#1c2238 55%,#0a0d1c 100%);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 50px rgba(0,0,0,.6);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.grScene.grHit{animation:mnShake .28s}
.grScene::before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 20% 80%,rgba(255,255,255,.04) 0 4px,transparent 4px 22px);pointer-events:none}
.grHud{position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;text-shadow:0 1px 3px #000;z-index:8;pointer-events:none}
.grStal{position:absolute;top:0;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:44px solid #151a2e;pointer-events:none;opacity:.9}
.grBat{position:absolute;top:36px;font-size:1.7rem;pointer-events:none;animation:grFly 5.5s linear infinite;z-index:6}
.grTorche{position:absolute;width:70px;height:96px;margin:-48px 0 0 -35px;z-index:5;touch-action:none}
.grBaton{position:absolute;left:50%;bottom:0;width:12px;height:46px;margin-left:-6px;border-radius:4px;background:linear-gradient(90deg,#5a3a1a,#8a5a2b,#4a2f17)}
.grVasque{position:absolute;left:50%;bottom:38px;width:30px;height:14px;margin-left:-15px;border-radius:4px 4px 14px 14px;background:linear-gradient(#6b6b78,#3b3b46)}
.grFlamme{position:absolute;left:50%;bottom:44px;margin-left:-20px;width:40px;text-align:center;font-size:2.4rem;line-height:1;animation:grLueur .35s ease-in-out infinite alternate;transform-origin:50% 100%}
.grGlow{position:absolute;left:50%;bottom:36px;width:130px;height:130px;margin-left:-65px;border-radius:50%;background:radial-gradient(circle,rgba(255,190,90,.55),rgba(255,150,50,0) 65%);pointer-events:none}
.grTorche.off .grFlamme,.grTorche.off .grGlow{display:none}
.grFumee{position:absolute;left:50%;bottom:48px;margin-left:-14px;font-size:1.6rem;display:none;animation:grFum 1s ease-out infinite}
.grTorche.off .grFumee{display:block}
.grBarre{position:absolute;left:50%;bottom:-6px;width:44px;height:6px;margin-left:-22px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden;display:none}
.grBarre i{display:block;height:100%;width:100%;background:#ffc43d}
.grTorche.off .grBarre{display:block}
.grNoir{position:absolute;inset:0;background:#02030a;opacity:0;pointer-events:none;z-index:4;transition:opacity .3s}
.grPop{position:absolute;z-index:9;font-size:1.8rem;pointer-events:none;animation:grUp .7s forwards}
@keyframes grFly{from{left:-12%;transform:translateY(0)}50%{transform:translateY(26px)}to{left:112%;transform:translateY(0)}}
@keyframes grLueur{from{transform:scale(1) rotate(-3deg)}to{transform:scale(1.12) rotate(3deg)}}
@keyframes grFum{from{transform:translateY(0);opacity:.9}to{transform:translateY(-34px);opacity:0}}
@keyframes grUp{to{transform:translateY(-34px);opacity:0}}
`;

let grCssOk = false;
function grCss() {
  if (grCssOk) return; grCssOk = true;
  const s = document.createElement("style");
  s.textContent = GROTTE_CSS;
  document.head.appendChild(s);
}
const grRnd = (a, b) => a + Math.random() * (b - a);
const grClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const grDpr = () => Math.min(2, window.devicePixelRatio || 1);

function grCanvas(z, W, H) {
  grCss();
  const dpr = grDpr(), cv = el("canvas", "grCv");
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr);
  z.appendChild(cv);
  return [cv, c];
}
function grOff(W, H) {
  const dpr = grDpr(), o = document.createElement("canvas");
  o.width = W * dpr; o.height = H * dpr;
  const c = o.getContext("2d"); c.scale(dpr, dpr);
  return [o, c];
}
const grPos = (cv, e, W, H) => {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
};
function grTri(c, x1, y1, x2, y2, x3, y3) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); }

/* Décor de grotte (dessiné une seule fois) : teinte 0 = gris-bleu, 1 = bleu profond, 2 = violet */
function grFond(W, H, teinte) {
  const [o, c] = grOff(W, H);
  const T = [["#2f3956", "#1c2238", "#10142a"], ["#1d3a5c", "#122640", "#0a1428"], ["#3a2a6a", "#241a4a", "#120c2a"]][teinte || 0];
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, T[0]); g.addColorStop(.5, T[1]); g.addColorStop(1, T[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    c.fillStyle = "rgba(255,255,255," + grRnd(.02, .07) + ")";
    c.beginPath(); c.arc(grRnd(0, W), grRnd(0, H), grRnd(1, 3), 0, 7); c.fill();
  }
  for (let x = -10; x < W + 20; x += grRnd(22, 40)) {
    const w = grRnd(16, 32), h = grRnd(18, 58);
    c.fillStyle = "#121730"; grTri(c, x - w / 2, 0, x + w / 2, 0, x, h);
    c.fillStyle = "rgba(255,255,255,.06)"; grTri(c, x - w / 2, 0, x - w / 6, 0, x - w / 8, h * .8);
  }
  for (let x = -10; x < W + 20; x += grRnd(26, 46)) {
    const w = grRnd(16, 34), h = grRnd(14, 44);
    c.fillStyle = "#0e1226"; grTri(c, x - w / 2, H, x + w / 2, H, x, H - h);
  }
  return o;
}

function grPopTxt(sc, txt, x, y) {
  const p = el("div", "grPop", txt); p.style.left = x + "%"; p.style.top = y + "%"; sc.appendChild(p);
  setTimeout(() => p.remove(), 720);
}

const JEUX_GROTTE = {

  /* CIVIL 1 — Torches dans le noir (m.p = nb de torches, ex. 4)
     L'écran est noir : ton doigt est la lampe. Trouve les torches cachées et
     maintiens le doigt dessus pour les allumer. Chaque torche allumée éclaire
     un peu plus la grotte. Les chauves-souris font vaciller ta lampe. */
  torches(z, m, prog, ok) {
    const W = 320, H = 300, [cv, c] = grCanvas(z, W, H);
    const fond = grFond(W, H, 0), [dk, d] = grOff(W, H);
    const hint = el("div", "mnMiHint", "Éclaire avec ton doigt · maintiens sur une torche pour l’allumer"); z.appendChild(hint);
    const T = [];
    for (let k = 0; k < m.p; k++) {
      let x, y, t = 0;
      do { x = grRnd(36, W - 36); y = grRnd(60, H - 50); t++; } while (t < 60 && T.some(o => Math.hypot(o.x - x, o.y - y) < 90));
      T.push({ x, y, lit: false, h: 0 });
    }
    const bats = [0, 1, 2].map(() => ({ x: grRnd(0, W), y: grRnd(30, H - 30), a: grRnd(0, 6.28), s: grRnd(45, 75) }));
    let fx = W / 2, fy = H - 30, down = false, flick = 0, n = 0, fin = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    const flares = [];
    cv.addEventListener("pointerdown", e => { e.preventDefault(); down = true; [fx, fy] = grPos(cv, e, W, H); });
    cv.addEventListener("pointermove", e => { if (down) [fx, fy] = grPos(cv, e, W, H); });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => cv.addEventListener(k, lache));
    const lumiere = (x, y, r, a) => {
      const g = d.createRadialGradient(x, y, r * .12, x, y, r);
      g.addColorStop(0, "rgba(0,0,0," + a + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
      d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, 7); d.fill();
    };
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.06, (now - last) / 1000); last = now; time += dt;
      flick = Math.max(0, flick - dt);
      bats.forEach((b, i) => {
        b.a += Math.sin(time * 2 + i * 2) * dt * 3.2; b.x += Math.cos(b.a) * b.s * dt; b.y += Math.sin(b.a) * b.s * dt;
        if (b.x < -20) b.x = W + 20; if (b.x > W + 20) b.x = -20; b.y = grClamp(b.y, 20, H - 20);
        if (down && flick <= 0 && Math.hypot(b.x - fx, b.y - fy) < 48) flick = .9;
      });
      if (!fin) {
        T.forEach(t => {
          if (t.lit) return;
          if (down && Math.hypot(t.x - fx, t.y - fy) < 28) t.h += dt / .6; else t.h = Math.max(0, t.h - dt * 2);
          if (t.h >= 1) {
            t.lit = true; n++; prog(n / m.p); flares.push({ x: t.x, y: t.y, a: 0 });
            if (n >= m.p) { fin = .001; hint.textContent = "La grotte est éclairée !"; }
          }
        });
      } else { fin += dt; if (fin > 1.1) { vivant = false; prog(1); ok(); return; } }
      flares.forEach(f => { f.a += dt * 1.6; });
      /* scène */
      c.drawImage(fond, 0, 0, W, H);
      T.forEach(t => {
        c.fillStyle = "#6b4a2a"; c.fillRect(t.x - 4, t.y, 8, 26);
        c.fillStyle = "#4a4a58"; c.fillRect(t.x - 10, t.y - 4, 20, 8);
        if (t.lit) { c.font = "30px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🔥", t.x, t.y - 14 + Math.sin(time * 14 + t.x) * 1.5); }
      });
      c.font = "26px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      bats.forEach(b => c.fillText("🦇", b.x, b.y + Math.sin(time * 12 + b.a) * 3));
      /* obscurité */
      d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, W, H);
      const ambiant = Math.max(.35, .955 - .07 * n) * (fin ? Math.max(0, 1 - fin * .9) : 1);
      d.fillStyle = "rgba(2,4,12," + ambiant + ")"; d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = "destination-out";
      T.forEach(t => { if (t.lit) lumiere(t.x, t.y - 10, 84 + Math.sin(time * 9 + t.x) * 3, 1); });
      const R = down ? (flick > 0 ? 36 + Math.sin(time * 40) * 6 : 76) : 26;
      lumiere(fx, fy, R, down ? 1 : .75);
      c.drawImage(dk, 0, 0, W, H);
      /* anneaux de maintien + halo de lampe */
      T.forEach(t => {
        if (t.lit || t.h <= 0) return;
        c.strokeStyle = "#ffc43d"; c.lineWidth = 4; c.beginPath(); c.arc(t.x, t.y - 8, 22, -1.57, -1.57 + t.h * 6.28); c.stroke();
      });
      flares.forEach(f => { c.strokeStyle = "rgba(255,200,100," + Math.max(0, 1 - f.a) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y - 10, 10 + f.a * 60, 0, 7); c.stroke(); });
      c.fillStyle = "rgba(255,230,160,.12)"; c.beginPath(); c.arc(fx, fy, R * .5, 0, 7); c.fill();
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textAlign = "left"; c.textBaseline = "alphabetic";
      c.fillText("🔥 " + n + "/" + m.p, 12, 22); c.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* CIVIL 2 — Écho de cristaux (m.p = nb de cristaux, ex. 3 ; échos = m.p + 5)
     Touche pour envoyer un écho : l'onde s'étend, et chaque cristal qu'elle
     traverse brille un instant. Touche-le vite pour le ramasser. */
  sonar(z, m, prog, ok) {
    const W = 320, H = 300, [cv, c] = grCanvas(z, W, H);
    const fond = grFond(W, H, 1);
    const hint = el("div", "mnMiHint", "Touche pour envoyer un écho · touche le cristal qui brille"); z.appendChild(hint);
    let cr = [], rings = [], pings = 0, got = 0, pops = [], pause = 0, fin = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    function init() {
      got = 0; pings = m.p + 5; rings = []; cr = []; pops = []; prog(0);
      for (let k = 0; k < m.p; k++) {
        let x, y, t = 0;
        do { x = grRnd(34, W - 34); y = grRnd(50, H - 40); t++; } while (t < 60 && cr.some(o => Math.hypot(o.x - x, o.y - y) < 100));
        cr.push({ x, y, vis: 0, got: false, echo: -1 });
      }
    }
    init();
    cv.addEventListener("pointerdown", e => {
      e.preventDefault(); if (pause > 0 || fin) return;
      const [x, y] = grPos(cv, e, W, H);
      const cible = cr.find(k => !k.got && k.vis > 0 && Math.hypot(k.x - x, k.y - y) < 36);
      if (cible) {
        cible.got = true; got++; prog(got / m.p); pops.push({ x: cible.x, y: cible.y, a: 0, t: "✨" });
        if (got >= m.p) { fin = .001; hint.textContent = "Tous les cristaux sont trouvés !"; }
        return;
      }
      if (pings > 0) { pings--; rings.push({ x, y, r: 0, hit: new Set() }); }
    });
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.06, (now - last) / 1000); last = now; time += dt;
      if (fin) { fin += dt; if (fin > 1) { vivant = false; prog(1); ok(); return; } }
      rings.forEach(r => {
        r.r += 200 * dt;
        cr.forEach(k => { if (!k.got && !r.hit.has(k) && r.r >= Math.hypot(k.x - r.x, k.y - r.y)) { r.hit.add(k); k.vis = 1.7; k.echo = 0; } });
      });
      rings = rings.filter(r => r.r < 360);
      cr.forEach(k => { k.vis = Math.max(0, k.vis - dt); if (k.echo >= 0) { k.echo += dt * 120; if (k.echo > 60) k.echo = -1; } });
      pops.forEach(p => { p.a += dt * 1.5; }); pops = pops.filter(p => p.a < 1);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Touche pour envoyer un écho · touche le cristal qui brille"; } }
      else if (!fin && pings <= 0 && !rings.length && cr.every(k => k.got || k.vis <= 0)) { pause = 1.4; hint.textContent = "Plus d’échos ! La grotte se réorganise…"; }
      /* dessin */
      c.drawImage(fond, 0, 0, W, H);
      c.fillStyle = "rgba(2,8,24,.62)"; c.fillRect(0, 0, W, H);
      rings.forEach(r => {
        const a = Math.max(0, 1 - r.r / 360);
        c.strokeStyle = "rgba(120,225,255," + a + ")"; c.lineWidth = 3; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke();
        c.strokeStyle = "rgba(120,225,255," + a * .4 + ")"; c.lineWidth = 8; c.beginPath(); c.arc(r.x, r.y, Math.max(0, r.r - 10), 0, 7); c.stroke();
        c.fillStyle = "rgba(160,235,255," + a + ")"; c.beginPath(); c.arc(r.x, r.y, 4, 0, 7); c.fill();
      });
      cr.forEach(k => {
        if (k.got) return;
        if (k.echo >= 0) { c.strokeStyle = "rgba(190,150,255," + Math.max(0, 1 - k.echo / 60) + ")"; c.lineWidth = 2; c.beginPath(); c.arc(k.x, k.y, k.echo, 0, 7); c.stroke(); }
        if (k.vis > 0) {
          const a = Math.min(1, k.vis);
          const g = c.createRadialGradient(k.x, k.y, 2, k.x, k.y, 44);
          g.addColorStop(0, "rgba(190,150,255," + a * .8 + ")"); g.addColorStop(1, "rgba(190,150,255,0)");
          c.fillStyle = g; c.beginPath(); c.arc(k.x, k.y, 44, 0, 7); c.fill();
          c.globalAlpha = a; c.font = "34px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("💎", k.x, k.y); c.globalAlpha = 1;
        }
      });
      pops.forEach(p => { c.globalAlpha = 1 - p.a; c.font = (28 + p.a * 30) + "px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(p.t, p.x, p.y - p.a * 20); c.globalAlpha = 1; });
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textBaseline = "alphabetic";
      c.textAlign = "left"; c.fillText("🔊 " + pings, 12, 22);
      c.textAlign = "right"; c.fillText("💎 " + got + "/" + m.p, W - 12, 22); c.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* IMPOSTEUR 1 — Condamner le passage (m.p = nb de pierres, ex. 6)
     Une pierre oscille en haut : touche pour la lâcher. Ce qui dépasse de la
     pierre du dessous tombe. Aucun contact = éboulement, on recommence. */
  pierres(z, m, prog, ok) {
    const W = 320, H = 340, BH = 26, BASEY = H - 34, Y0 = 44, [cv, c] = grCanvas(z, W, H);
    const fond = grFond(W, H, 0);
    const hint = el("div", "mnMiHint", "Touche pour lâcher la pierre pile au-dessus de l’autre"); z.appendChild(hint);
    let niv, blk, etat, t, vy, deb, pops, pause = 0, fin = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    const cibleY = () => BASEY - (niv.length + 1) * BH;
    function init() {
      niv = [{ x: (W - 150) / 2, w: 150, s: Math.random() }];
      blk = { x: 0, w: 150, y: Y0, s: Math.random() }; etat = "move"; t = 0; vy = 0; deb = []; pops = []; prog(0);
    }
    function pierre(x, y, w, s, a) {
      const g = c.createLinearGradient(0, y, 0, y + BH);
      g.addColorStop(0, "#9a917f"); g.addColorStop(1, "#5c5446");
      c.globalAlpha = a == null ? 1 : a;
      c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, BH - 2, 6) : c.rect(x, y, w, BH - 2); c.fill();
      c.strokeStyle = "rgba(0,0,0,.28)"; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const cx = x + ((s * 97 + i * 53) % 100) / 100 * w; c.beginPath(); c.moveTo(cx, y + 3); c.lineTo(cx + 6, y + 12); c.lineTo(cx - 3, y + BH - 5); c.stroke(); }
      c.fillStyle = "rgba(255,255,255,.14)"; c.fillRect(x + 4, y + 3, w - 8, 3);
      c.globalAlpha = 1;
    }
    init();
    cv.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (etat !== "move" || pause > 0 || fin) return;
      etat = "drop"; vy = 120;
    });
    function atterrir() {
      const prev = niv[niv.length - 1], ox = Math.max(blk.x, prev.x), ex = Math.min(blk.x + blk.w, prev.x + prev.w), ov = ex - ox;
      if (ov <= 3) {
        deb.push({ x: blk.x, y: blk.y, w: blk.w, vy: 0, s: blk.s });
        pause = 1.4; etat = "chute"; hint.textContent = "Éboulement ! On recommence…"; return;
      }
      if (Math.abs(blk.x - prev.x) < 6) {
        blk.x = prev.x; blk.w = prev.w; pops.push({ x: W / 2, y: blk.y - 8, a: 0, t: "✨ Parfait !" });
      } else {
        if (blk.x < ox) deb.push({ x: blk.x, y: blk.y, w: ox - blk.x, vy: 0, s: blk.s });
        if (blk.x + blk.w > ex) deb.push({ x: ex, y: blk.y, w: blk.x + blk.w - ex, vy: 0, s: blk.s });
        blk.x = ox; blk.w = ov;
      }
      niv.push({ x: blk.x, w: blk.w, s: blk.s }); prog((niv.length - 1) / m.p);
      if (niv.length - 1 >= m.p) { fin = .001; etat = "fin"; hint.textContent = "Le passage est condamné !"; return; }
      blk = { x: 0, w: blk.w, y: Y0, s: Math.random() }; etat = "move"; t = 0;
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      if (etat === "move") { t += dt; const k = niv.length - 1; blk.x = (W - blk.w) / 2 + ((W - blk.w) / 2 - 8) * Math.sin(t * (2 + .3 * k)); }
      else if (etat === "drop") { vy += 1500 * dt; blk.y += vy * dt; if (blk.y >= cibleY()) { blk.y = cibleY(); atterrir(); } }
      else if (etat === "chute") { vy += 1500 * dt; blk.y += vy * dt; }
      deb.forEach(p => { p.vy += 1100 * dt; p.y += p.vy * dt; }); deb = deb.filter(p => p.y < H + 40);
      pops.forEach(p => { p.a += dt * 1.6; }); pops = pops.filter(p => p.a < 1);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Touche pour lâcher la pierre pile au-dessus de l’autre"; } }
      if (fin) { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      c.drawImage(fond, 0, 0, W, H);
      const lg = c.createLinearGradient(0, 40, 0, BASEY); lg.addColorStop(0, "rgba(255,190,110,.0)"); lg.addColorStop(1, "rgba(255,190,110,.12)");
      c.fillStyle = lg; c.fillRect(34, 40, W - 68, BASEY - 40);
      c.font = "28px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("🔥", 18, 150 + Math.sin(time * 12) * 1.5); c.fillText("🔥", W - 18, 150 + Math.sin(time * 12 + 2) * 1.5);
      const gy = BASEY - (m.p + 1) * BH;
      c.strokeStyle = "rgba(255,90,90,.7)"; c.setLineDash([8, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(34, gy + BH); c.lineTo(W - 34, gy + BH); c.stroke(); c.setLineDash([]);
      c.font = "700 12px sans-serif"; c.fillStyle = "rgba(255,150,150,.95)"; c.textAlign = "right"; c.textBaseline = "alphabetic"; c.fillText("🚧 bloquer ici", W - 38, gy + BH - 5);
      c.fillStyle = "#14182c"; c.fillRect(0, BASEY, W, H - BASEY);
      niv.forEach((l, i) => pierre(l.x, BASEY - (i + 1) * BH, l.w, l.s));
      deb.forEach(p => pierre(p.x, p.y, p.w, p.s, .9));
      if (etat !== "fin") pierre(blk.x, blk.y, blk.w, blk.s);
      pops.forEach(p => { c.globalAlpha = 1 - p.a; c.font = "800 16px sans-serif"; c.fillStyle = "#ffe27a"; c.textAlign = "center"; c.fillText(p.t, p.x, p.y - p.a * 26); c.globalAlpha = 1; });
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textAlign = "left";
      c.fillText("🪨 " + (niv.length - 1) + "/" + m.p, 12, 22); c.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* IMPOSTEUR 2 — Éteindre les torches (m.p = nb de torches, ex. 6)
     Glisse le doigt sur les flammes pour les souffler. Elles se rallument
     toutes seules au bout de ~2,3 s : il faut qu'elles soient TOUTES
     éteintes en même temps. */
  eteindre(z, m, prog, ok) {
    grCss();
    const W = 320, H = 300, RELUIT = 2.3;
    const sc = el("div", "grScene"); sc.style.height = H + "px"; z.appendChild(sc);
    for (let i = 0; i < 9; i++) { const s = el("div", "grStal"); s.style.left = (i * 12.5 - 3) + "%"; s.style.borderTopWidth = (24 + (i * 37) % 36) + "px"; sc.appendChild(s); }
    sc.appendChild(el("div", "grBat", "🦇")); const b2 = el("div", "grBat", "🦇"); b2.style.animationDelay = "-2.7s"; b2.style.top = "70px"; sc.appendChild(b2);
    const noir = el("div", "grNoir"); sc.appendChild(noir);
    const hud = el("div", "grHud"), info = el("span"); hud.appendChild(info); sc.appendChild(hud);
    const hint = el("div", "mnMiHint", "Glisse le doigt sur les flammes pour toutes les souffler"); z.appendChild(hint);
    const POS = [[17, 36], [50, 28], [83, 38], [24, 72], [54, 76], [80, 68]];
    const T = POS.slice(0, m.p).map(([x, y]) => {
      const e = el("div", "grTorche");
      e.style.left = x + "%"; e.style.top = y + "%";
      const glow = el("div", "grGlow"), fl = el("div", "grFlamme", "🔥"), fu = el("div", "grFumee", "💨");
      const bar = el("div", "grBarre"), bi = el("i"); bar.appendChild(bi);
      [glow, el("div", "grBaton"), el("div", "grVasque"), fl, fu, bar].forEach(n => e.appendChild(n));
      sc.appendChild(e);
      return { e, x, y, off: false, t: 0, bi };
    });
    const tm = [];
    let down = false, fin = 0, last = performance.now(), raf = 0, vivant = true;
    const pos = e => { const r = sc.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    function souffler(x, y) {
      T.forEach(t => {
        if (t.off) return;
        if (Math.hypot(t.x / 100 * W - x, t.y / 100 * H - 12 - y) < 40) { t.off = true; t.t = RELUIT; t.e.classList.add("off"); }
      });
    }
    sc.addEventListener("pointerdown", e => { e.preventDefault(); down = true; const [x, y] = pos(e); souffler(x, y); });
    sc.addEventListener("pointermove", e => { if (!down) return; const [x, y] = pos(e); souffler(x, y); });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => sc.addEventListener(k, lache));
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      let out = 0;
      T.forEach(t => {
        if (t.off) {
          t.t -= dt; t.bi.style.width = Math.max(0, t.t / RELUIT * 100) + "%";
          if (t.t <= 0 && !fin) { t.off = false; t.e.classList.remove("off"); grPopTxt(sc, "🔥", t.x, t.y - 8); }
        }
        if (t.off) out++;
      });
      noir.style.opacity = (.12 + .8 * out / m.p).toFixed(2);
      prog(out / m.p); info.textContent = "🌬️ " + out + "/" + m.p + " éteintes";
      if (!fin && out >= m.p) { fin = .001; hint.textContent = "Noir complet… personne ne verra rien !"; }
      if (fin) { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); tm.forEach(clearTimeout); };
  },

  /* MORT 1 — Mener les chauves-souris (m.p = nb à sauver sur 7, ex. 5)
     Ton doigt est une lanterne fantôme : la nuée la suit. Guide-la à droite
     (la sortie) sans toucher les stalactites / stalagmites. */
  nuee(z, m, prog, ok) {
    const W = 320, H = 290, N = 7, [cv, c] = grCanvas(z, W, H);
    const fond = grFond(W, H, 2);
    const hint = el("div", "mnMiHint", "Guide la nuée avec ton doigt jusqu’à la sortie, à droite"); z.appendChild(hint);
    let bats, sp, tx, ty, down = false, sauves = 0, pops = [], pause = 0, fin = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    function init() {
      sauves = 0; pops = []; prog(0); tx = 40; ty = H / 2;
      bats = Array.from({ length: N }, (_, i) => ({
        x: 20 + grRnd(0, 18), y: H / 2 + (i - 3) * 14, vx: 0, vy: 0, k: grRnd(2.2, 3.8),
        ox: grRnd(-14, 14), oy: grRnd(-14, 14), ph: grRnd(0, 6.28), alive: true, safe: false
      }));
      sp = [];
      [96, 166, 236].forEach(x => sp.push({ x: x + grRnd(-8, 8), l: grRnd(62, 100), top: true }));
      [131, 201, 271].forEach(x => sp.push({ x: x + grRnd(-8, 8), l: grRnd(56, 96), top: false }));
    }
    init();
    cv.addEventListener("pointerdown", e => { e.preventDefault(); down = true; [tx, ty] = grPos(cv, e, W, H); });
    cv.addEventListener("pointermove", e => { if (down) [tx, ty] = grPos(cv, e, W, H); });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => cv.addEventListener(k, lache));
    const dansPointe = (s, bx, by) => {
      const yy = s.top ? by : H - by;
      if (yy < -6 || yy > s.l + 8) return false;
      const half = 17 * (1 - Math.min(Math.max(yy, 0), s.l) / s.l) + 7;
      return Math.abs(bx - s.x) <= half;
    };
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      pops.forEach(p => { p.a += dt * 1.8; }); pops = pops.filter(p => p.a < 1);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Guide la nuée avec ton doigt jusqu’à la sortie, à droite"; } }
      else if (!fin) {
        bats.forEach(b => {
          if (!b.alive || b.safe) return;
          b.vx += (tx + b.ox - b.x) * b.k * dt * 4; b.vy += (ty + b.oy - b.y) * b.k * dt * 4;
          b.vx *= 1 - Math.min(.95, dt * 4); b.vy *= 1 - Math.min(.95, dt * 4);
          const v = Math.hypot(b.vx, b.vy); if (v > 230) { b.vx *= 230 / v; b.vy *= 230 / v; }
          b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(time * 8 + b.ph) * 8 * dt;
          b.x = Math.max(8, b.x); b.y = grClamp(b.y, 12, H - 12);
          if (sp.some(s => dansPointe(s, b.x, b.y))) { b.alive = false; pops.push({ x: b.x, y: b.y, a: 0, t: "💥" }); }
          else if (b.x >= W - 18) { b.safe = true; sauves++; prog(sauves / m.p); pops.push({ x: W - 20, y: b.y, a: 0, t: "✨" }); }
        });
        const vivantes = bats.filter(b => b.alive && !b.safe).length;
        if (sauves >= m.p) { fin = .001; hint.textContent = "La nuée a retrouvé la sortie !"; }
        else if (sauves + vivantes < m.p) { pause = 1.4; hint.textContent = "La nuée est décimée ! On recommence…"; }
      } else { fin += dt; if (fin > .8) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      c.drawImage(fond, 0, 0, W, H);
      const ex = c.createLinearGradient(W - 40, 0, W, 0); ex.addColorStop(0, "rgba(140,236,255,0)"); ex.addColorStop(1, "rgba(200,250,255,.75)");
      c.fillStyle = ex; c.fillRect(W - 40, 0, 40, H);
      c.font = "700 12px sans-serif"; c.fillStyle = "rgba(210,250,255,.9)"; c.textAlign = "center"; c.fillText("SORTIE", W - 20, H / 2 + 4);
      sp.forEach(s => {
        c.fillStyle = "#1a1f3a";
        if (s.top) grTri(c, s.x - 17, 0, s.x + 17, 0, s.x, s.l); else grTri(c, s.x - 17, H, s.x + 17, H, s.x, H - s.l);
        c.fillStyle = "rgba(255,255,255,.12)";
        if (s.top) grTri(c, s.x - 17, 0, s.x - 5, 0, s.x - 2, s.l * .8); else grTri(c, s.x - 17, H, s.x - 5, H, s.x - 2, H - s.l * .8);
      });
      const g = c.createRadialGradient(tx, ty, 2, tx, ty, 46); g.addColorStop(0, down ? "rgba(160,240,255,.75)" : "rgba(160,240,255,.3)"); g.addColorStop(1, "rgba(160,240,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(tx, ty, 46, 0, 7); c.fill();
      c.font = "26px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      bats.forEach(b => { if (b.alive && !b.safe) { c.save(); c.translate(b.x, b.y); c.scale(1, .8 + .25 * Math.sin(time * 18 + b.ph)); c.fillText("🦇", 0, 0); c.restore(); } });
      pops.forEach(p => { c.globalAlpha = 1 - p.a; c.font = (24 + p.a * 24) + "px serif"; c.fillText(p.t, p.x, p.y - p.a * 16); c.globalAlpha = 1; });
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textAlign = "left"; c.textBaseline = "alphabetic";
      c.fillText("🦇 " + sauves + "/" + m.p, 12, 22);
      c.textAlign = "right"; c.fillText("en vol : " + bats.filter(b => b.alive && !b.safe).length, W - 50, 22); c.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 2 — Aspirer la lumière (m.p = lucioles à avaler, ex. 15 ; temps = 22 s)
     Ton doigt est un trou noir qui grossit à chaque luciole avalée. Certaines
     fuient (bleues), d'autres sont rapides (orange). */
  trou(z, m, prog, ok) {
    const W = 320, H = 300, TMAX = 22, [cv, c] = grCanvas(z, W, H);
    const fond = grFond(W, H, 2);
    const hint = el("div", "mnMiHint", "Promène ton ombre pour avaler les lucioles avant la fin du temps"); z.appendChild(hint);
    let ox = W / 2, oy = H / 2, tx = ox, ty = oy, down = false, n = 0, tps = 0, L = [], parts = [], pause = 0, fin = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    const rayon = () => 18 + n * 1.4;
    function nouvelle() {
      const r = Math.random(), type = r < .3 ? "f" : r < .55 ? "r" : "n";
      let x, y, t = 0;
      do { x = grRnd(14, W - 14); y = grRnd(40, H - 14); t++; } while (t < 20 && Math.hypot(x - ox, y - oy) < 110);
      const a = grRnd(0, 6.28), s = type === "r" ? 85 : 28;
      return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, type, s, ph: grRnd(0, 6.28) };
    }
    function init() { n = 0; tps = 0; prog(0); parts = []; L = Array.from({ length: 8 }, nouvelle); }
    init();
    cv.addEventListener("pointerdown", e => { e.preventDefault(); down = true; [tx, ty] = grPos(cv, e, W, H); });
    cv.addEventListener("pointermove", e => { if (down) [tx, ty] = grPos(cv, e, W, H); });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => cv.addEventListener(k, lache));
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 2.4; }); parts = parts.filter(p => p.a < 1);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Promène ton ombre pour avaler les lucioles avant la fin du temps"; } }
      else if (!fin) {
        tps += dt;
        ox += (tx - ox) * Math.min(1, dt * 9); oy += (ty - oy) * Math.min(1, dt * 9);
        const R = rayon();
        L.forEach((l, i) => {
          const d = Math.hypot(ox - l.x, oy - l.y);
          l.vx += Math.cos(time * 1.3 + l.ph) * 30 * dt; l.vy += Math.sin(time * 1.1 + l.ph * 2) * 30 * dt;
          if (l.type === "f" && d < 120) { l.vx -= (ox - l.x) / (d || 1) * 220 * dt; l.vy -= (oy - l.y) / (d || 1) * 220 * dt; }
          if (d < R * 2.4) { const f = (1 - d / (R * 2.4)) * 340; l.vx += (ox - l.x) / (d || 1) * f * dt; l.vy += (oy - l.y) / (d || 1) * f * dt; }
          const v = Math.hypot(l.vx, l.vy), vm = l.type === "r" ? 120 : 70;
          if (v > vm && d >= R * 2.4) { l.vx *= vm / v; l.vy *= vm / v; }
          l.x += l.vx * dt; l.y += l.vy * dt;
          if (l.x < 8) { l.x = 8; l.vx = Math.abs(l.vx); } if (l.x > W - 8) { l.x = W - 8; l.vx = -Math.abs(l.vx); }
          if (l.y < 34) { l.y = 34; l.vy = Math.abs(l.vy); } if (l.y > H - 8) { l.y = H - 8; l.vy = -Math.abs(l.vy); }
          if (d < R * .85) {
            n++; prog(n / m.p);
            for (let k = 0; k < 6; k++) { const a = grRnd(0, 6.28); parts.push({ x: l.x, y: l.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, a: 0 }); }
            L[i] = nouvelle();
          }
        });
        if (n >= m.p) { fin = .001; hint.textContent = "Plus une seule lueur dans la grotte…"; }
        else if (tps >= TMAX) { pause = 1.4; hint.textContent = "Temps écoulé ! Les lucioles se dispersent…"; }
      } else { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      c.drawImage(fond, 0, 0, W, H);
      L.forEach(l => {
        const col = l.type === "f" ? "120,210,255" : l.type === "r" ? "255,170,70" : "255,235,120";
        const g = c.createRadialGradient(l.x, l.y, 1, l.x, l.y, 20 + Math.sin(time * 5 + l.ph) * 3);
        g.addColorStop(0, "rgba(" + col + ",1)"); g.addColorStop(.35, "rgba(" + col + ",.45)"); g.addColorStop(1, "rgba(" + col + ",0)");
        c.fillStyle = g; c.beginPath(); c.arc(l.x, l.y, 24, 0, 7); c.fill();
      });
      parts.forEach(p => { c.fillStyle = "rgba(255,235,150," + (1 - p.a) + ")"; c.beginPath(); c.arc(p.x, p.y, 2.5, 0, 7); c.fill(); });
      const R = rayon() * (fin ? 1 + fin * 2.5 : 1);
      const og = c.createRadialGradient(ox, oy, R * .2, ox, oy, R * 1.5);
      og.addColorStop(0, "rgba(0,0,0,1)"); og.addColorStop(.6, "rgba(10,0,30,.95)"); og.addColorStop(.8, "rgba(130,70,230,.55)"); og.addColorStop(1, "rgba(130,70,230,0)");
      c.fillStyle = og; c.beginPath(); c.arc(ox, oy, R * 1.5, 0, 7); c.fill();
      c.strokeStyle = "rgba(190,140,255,.7)"; c.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) { const a0 = time * 3 + k * 2.1; c.beginPath(); c.arc(ox, oy, R * 1.05, a0, a0 + 1.1); c.stroke(); }
      c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textBaseline = "alphabetic";
      c.textAlign = "left"; c.fillText("✨ " + n + "/" + m.p, 12, 22);
      c.textAlign = "right"; c.fillText("⏱ " + Math.max(0, Math.ceil(TMAX - tps)) + " s", W - 12, 22); c.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  }
};

Object.keys(JEUX_GROTTE).forEach(k => { JEUX[k] = JEUX_GROTTE[k]; });


const CASCADE_CSS = `
.caCv{display:block;width:100%;max-width:340px;height:auto;border-radius:20px;border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 40px rgba(0,0,0,.45);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.caScene{position:relative;width:100%;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#1d6f7a 0,#14505e 50%,#0b2f3d 100%);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 0 50px rgba(0,0,0,.5);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.caScene.caHit{animation:mnShake .3s}
.caHud{position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-weight:800;font-size:.95rem;text-shadow:0 1px 3px #000;pointer-events:none}
.caFioles{position:absolute;left:0;right:0;top:40px;display:flex;justify-content:space-around;align-items:flex-end}
.caFWrap{display:flex;flex-direction:column;align-items:center;gap:6px;font-weight:800;font-size:.85rem;text-shadow:0 1px 3px #000}
.caFiole{position:relative;width:96px;height:128px}
.caCol{position:absolute;left:50%;top:0;width:34px;height:34px;margin-left:-17px;border:3px solid rgba(255,255,255,.55);border-bottom:0;border-radius:8px 8px 0 0;background:rgba(255,255,255,.06)}
.caCorps{position:absolute;left:0;bottom:0;width:96px;height:98px;border-radius:50%;border:3px solid rgba(255,255,255,.6);overflow:hidden;background:rgba(255,255,255,.08);box-shadow:0 8px 14px rgba(0,0,0,.4)}
.caLiq{position:absolute;left:0;right:0;bottom:0;height:70%;background:var(--c,#b2e2f0);transition:background .25s}
.caCorps::after{content:"";position:absolute;left:14px;top:14px;width:12px;height:32px;border-radius:50%;background:rgba(255,255,255,.4);transform:rotate(20deg)}
.caBar{position:absolute;left:14px;right:14px;top:196px;height:14px;border-radius:99px;background:rgba(0,0,0,.35);overflow:hidden;border:1px solid rgba(255,255,255,.25)}
.caBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff5468,#ffc43d,#4cd964);transition:width .2s}
.caSeuil{position:absolute;top:-3px;bottom:-3px;width:3px;background:#fff;box-shadow:0 0 6px #fff}
.caChips{position:absolute;left:0;right:0;top:214px;display:flex;justify-content:center;gap:8px;font-weight:800;font-size:.8rem}
.caChip{padding:3px 9px;border-radius:99px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25)}
.caPig{position:absolute;left:0;right:0;top:244px;display:flex;justify-content:center;gap:12px}
.caPigB{width:58px;height:58px;border-radius:50%;border:3px solid rgba(255,255,255,.7);box-shadow:0 5px 0 rgba(0,0,0,.4);font-size:1.5rem;touch-action:manipulation;transition:transform .08s}
.caPigB:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.4)}
.caAct{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:10px}
.caBtn{padding:10px 18px;border:0;border-radius:16px;font-weight:900;font-size:.95rem;background:#ffe9b0;color:#3b2410;box-shadow:0 4px 0 rgba(0,0,0,.4);touch-action:manipulation}
.caBtn.vert{background:#7ee7a0;color:#0b3a1c}
.caBtn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.4)}
`;

let caCssOk = false;
function caCss() {
  if (caCssOk) return; caCssOk = true;
  const s = document.createElement("style");
  s.textContent = CASCADE_CSS;
  document.head.appendChild(s);
}
const caRnd = (a, b) => a + Math.random() * (b - a);
const caClamp = (v, a, b) => Math.max(a, Math.min(b, v));

function caCanvas(z, W, H) {
  caCss();
  const dpr = Math.min(2, window.devicePixelRatio || 1), cv = el("canvas", "caCv");
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr);
  z.appendChild(cv);
  return [cv, c];
}
const caPos = (cv, e, W, H) => {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
};
function caHud(c, gauche, droite) {
  c.font = "800 15px sans-serif"; c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.textBaseline = "alphabetic";
  c.textAlign = "left"; c.fillText(gauche, 12, 22);
  c.textAlign = "right"; c.fillText(droite, 308, 22); c.shadowBlur = 0;
}
function caFondEau(c, W, H, time, sombre) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sombre ? "#143c52" : "#2b8e96"); g.addColorStop(.6, sombre ? "#0d2a3e" : "#17606c"); g.addColorStop(1, sombre ? "#07182a" : "#0b3342");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.05)";
  for (let i = 0; i < 6; i++) { const x = ((i * 61 + time * 8) % (W + 40)) - 20; c.fillRect(x, 0, 14, H); }
}

const JEUX_CASCADE = {

  /* CIVIL 1 — Détourner le courant (m.p = nb de grilles, ex. 2)
     Touche les tuiles pour les faire pivoter et relier la source (en haut à
     gauche) au bassin (en bas à droite). L'eau coule en direct dans les
     tuyaux bien reliés. La 2e grille est plus grande. */
  tuyaux(z, m, prog, ok) {
    const W = 320, H = 300, [cv, c] = caCanvas(z, W, H);
    const hint = el("div", "mnMiHint", "Touche les tuiles pour relier la source au bassin"); z.appendChild(hint);
    const GR = [{ n: 4, cs: 56 }, { n: 5, cs: 48 }];
    let g = 0, n = 4, cs = 56, ox = 0, oy = 34, tl = [], wet = [], win = 0, time = 0, last = performance.now(), raf = 0, vivant = true;
    const conns = t => {
      const r = t.rot % 4;
      if (t.type === "X") return [0, 1, 2, 3];
      if (t.type === "I") return [r, (r + 2) % 4];
      if (t.type === "L") return [r, (r + 1) % 4];
      return [r, (r + 1) % 4, (r + 3) % 4];
    };
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    function calcul() {
      wet = Array.from({ length: n }, () => Array(n).fill(false));
      if (!conns(tl[0][0]).includes(0)) return false;
      const q = [[0, 0]]; wet[0][0] = true;
      while (q.length) {
        const [x, y] = q.shift();
        conns(tl[y][x]).forEach(d => {
          const nx = x + DX[d], ny = y + DY[d];
          if (nx < 0 || ny < 0 || nx >= n || ny >= n || wet[ny][nx]) return;
          if (conns(tl[ny][nx]).includes((d + 2) % 4)) { wet[ny][nx] = true; q.push([nx, ny]); }
        });
      }
      return wet[n - 1][n - 1] && conns(tl[n - 1][n - 1]).includes(2);
    }
    function genere() {
      const cfg = GR[Math.min(g, GR.length - 1)]; n = cfg.n; cs = cfg.cs; ox = (W - n * cs) / 2;
      do {
        tl = Array.from({ length: n }, () => Array.from({ length: n }, () => {
          const r = Math.random(), type = r < .35 ? "I" : r < .75 ? "L" : r < .93 ? "T" : "X";
          return { type, rot: Math.floor(Math.random() * 4), ang: 0 };
        }));
        let x = 0, y = 0, prev = 0; const path = [];
        const dirs = [];
        while (x < n - 1 || y < n - 1) {
          let d; if (x === n - 1) d = 2; else if (y === n - 1) d = 1; else d = Math.random() < .5 ? 1 : 2;
          dirs.push(d); path.push([x, y]); if (d === 1) x++; else y++;
        }
        path.push([x, y]); dirs.push(2);
        path.forEach(([px, py], i) => {
          const a = i === 0 ? 0 : (dirs[i - 1] + 2) % 4, b = dirs[i];
          const t = { type: ((b - a + 4) % 4 === 2) ? "I" : "L", rot: Math.floor(Math.random() * 4), ang: 0 };
          tl[py][px] = t;
        });
        tl.forEach(row => row.forEach(t => { t.ang = t.rot * Math.PI / 2; }));
      } while (calcul());
      win = 0; prog(g / m.p);
    }
    genere(); calcul();
    cv.addEventListener("pointerdown", e => {
      e.preventDefault(); if (win) return;
      const [x, y] = caPos(cv, e, W, H), cx = Math.floor((x - ox) / cs), cy = Math.floor((y - oy) / cs);
      if (cx < 0 || cy < 0 || cx >= n || cy >= n) return;
      tl[cy][cx].rot++;
      if (calcul()) { win = .001; hint.textContent = "L’eau coule jusqu’au bassin !"; }
    });
    function trace(type, h) {
      c.beginPath();
      if (type === "I") { c.moveTo(0, -h); c.lineTo(0, h); }
      else if (type === "L") { c.moveTo(0, -h); c.lineTo(0, 0); c.lineTo(h, 0); }
      else if (type === "T") { c.moveTo(0, -h); c.lineTo(0, 0); c.lineTo(h, 0); c.moveTo(-h, 0); c.lineTo(0, 0); }
      else { c.moveTo(0, -h); c.lineTo(0, h); c.moveTo(-h, 0); c.lineTo(h, 0); }
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      if (win) { win += dt; if (win > .95) { g++; if (g >= m.p) { vivant = false; prog(1); ok(); return; } genere(); calcul(); hint.textContent = "Nouvelle grille : relie à nouveau la source au bassin"; } }
      caFondEau(c, W, H, time, true);
      /* source et bassin */
      c.strokeStyle = "#8b94a6"; c.lineWidth = cs * .34; c.lineCap = "round";
      c.beginPath(); c.moveTo(ox + cs / 2, 12); c.lineTo(ox + cs / 2, oy); c.stroke();
      c.strokeStyle = "#5ad0ff"; c.lineWidth = cs * .2; c.beginPath(); c.moveTo(ox + cs / 2, 12); c.lineTo(ox + cs / 2, oy); c.stroke();
      c.font = "22px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("💧", ox + cs / 2, 12);
      const bx = ox + (n - 1) * cs + cs / 2, by = oy + n * cs;
      c.fillStyle = win ? "#5ad0ff" : "#1b2d44"; c.beginPath(); c.ellipse(bx, by + 14, 30, 11, 0, 0, 7); c.fill();
      c.strokeStyle = "#8b94a6"; c.lineWidth = 3; c.stroke();
      c.fillText(win ? "💦" : "🏞️", bx + 40, by + 12);
      /* tuiles */
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const t = tl[y][x], px = ox + x * cs, py = oy + y * cs, tg = t.rot * Math.PI / 2;
        t.ang += (tg - t.ang) * Math.min(1, dt * 14);
        c.fillStyle = "#162235"; c.fillRect(px + 2, py + 2, cs - 4, cs - 4);
        c.strokeStyle = "rgba(255,255,255,.1)"; c.lineWidth = 1; c.strokeRect(px + 2, py + 2, cs - 4, cs - 4);
        c.save(); c.translate(px + cs / 2, py + cs / 2); c.rotate(t.ang); c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = "#8b94a6"; c.lineWidth = cs * .3; trace(t.type, cs / 2 - 1); c.stroke();
        c.strokeStyle = wet[y][x] ? "#4cc2f5" : "#1b2433"; c.lineWidth = cs * .18; trace(t.type, cs / 2 - 1); c.stroke();
        if (wet[y][x]) {
          c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = cs * .06; c.setLineDash([5, 9]); c.lineDashOffset = -time * 40;
          trace(t.type, cs / 2 - 1); c.stroke(); c.setLineDash([]);
        }
        c.restore();
      }
      caHud(c, "💧 Grille " + Math.min(g + 1, m.p) + "/" + m.p, "touche = pivoter");
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* CIVIL 2 — Remplir les gourdes (m.p = gouttes à recueillir, ex. 20)
     Trace des rampes avec le doigt : les gouttes glissent dessus. L'eau
     ronge les rampes (elles disparaissent après ~6 s). La source bouge.
     Réserve limitée : 3 × m.p gouttes. */
  rampes(z, m, prog, ok) {
    const W = 320, H = 330, GY = H - 62, TOT = m.p * 3, [cv, c] = caCanvas(z, W, H);
    const hint = el("div", "mnMiHint", "Trace des rampes pour guider l’eau jusqu’aux gourdes"); z.appendChild(hint);
    let drops, lines, cur = null, gourdes, rocks, collecte, restant, spawn, time = 0, pause = 0, fin = 0, last = performance.now(), raf = 0, vivant = true;
    function init() {
      collecte = 0; restant = TOT; drops = []; lines = []; spawn = 0; prog(0);
      gourdes = [{ x: 40, n: 0 }, { x: W / 2, n: 0 }, { x: W - 40, n: 0 }];
      rocks = [{ x: caRnd(70, 140), y: caRnd(120, 165), r: 20 }, { x: caRnd(180, 250), y: caRnd(175, 215), r: 20 }];
    }
    init();
    cv.addEventListener("pointerdown", e => {
      e.preventDefault(); const [x, y] = caPos(cv, e, W, H);
      cur = { pts: [[x, y]], age: 0 }; lines.push(cur);
    });
    cv.addEventListener("pointermove", e => {
      if (!cur) return; const [x, y] = caPos(cv, e, W, H), l = cur.pts[cur.pts.length - 1];
      if (Math.hypot(x - l[0], y - l[1]) >= 7) cur.pts.push([x, y]);
    });
    const fini = () => { cur = null; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => cv.addEventListener(k, fini));
    function collide(d, ax, ay, bx, by, ep) {
      const abx = bx - ax, aby = by - ay, l2 = abx * abx + aby * aby || 1;
      const t = caClamp(((d.x - ax) * abx + (d.y - ay) * aby) / l2, 0, 1), qx = ax + abx * t, qy = ay + aby * t;
      let dx = d.x - qx, dy = d.y - qy, dist = Math.hypot(dx, dy);
      if (dist < 4 + ep) {
        if (dist < .001) { dx = 0; dy = -1; dist = 1; }
        const nx = dx / dist, ny = dy / dist;
        d.x = qx + nx * (4 + ep); d.y = qy + ny * (4 + ep);
        const vn = d.vx * nx + d.vy * ny;
        if (vn < 0) { d.vx -= 1.15 * vn * nx; d.vy -= 1.15 * vn * ny; }
      }
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.04, (now - last) / 1000); last = now; time += dt;
      lines.forEach(l => { l.age += dt; }); lines = lines.filter(l => l.age < 6 || l === cur);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Trace des rampes pour guider l’eau jusqu’aux gourdes"; } }
      else if (!fin) {
        spawn -= dt;
        if (spawn <= 0 && restant > 0) { spawn = .16; restant--; drops.push({ x: W / 2 + Math.sin(time * .8) * 110, y: 16, vx: caRnd(-16, 16), vy: 0 }); }
        drops.forEach(d => {
          d.vy = Math.min(430, d.vy + 520 * dt); d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.x < 6) { d.x = 6; d.vx = Math.abs(d.vx); } if (d.x > W - 6) { d.x = W - 6; d.vx = -Math.abs(d.vx); }
          lines.forEach(l => { for (let i = 1; i < l.pts.length; i++) collide(d, l.pts[i - 1][0], l.pts[i - 1][1], l.pts[i][0], l.pts[i][1], 3); });
          rocks.forEach(r => {
            const dx = d.x - r.x, dy = d.y - r.y, dist = Math.hypot(dx, dy);
            if (dist < r.r + 4) { const nx = dx / dist, ny = dy / dist; d.x = r.x + nx * (r.r + 4); d.y = r.y + ny * (r.r + 4); const vn = d.vx * nx + d.vy * ny; if (vn < 0) { d.vx -= 1.3 * vn * nx; d.vy -= 1.3 * vn * ny; } }
          });
          if (d.y > GY) {
            d.dead = true;
            const gg = gourdes.find(q => Math.abs(q.x - d.x) < 20);
            if (gg) { gg.n++; collecte++; prog(collecte / m.p); }
          }
        });
        drops = drops.filter(d => !d.dead && d.y < H + 10);
        if (collecte >= m.p) { fin = .001; hint.textContent = "Les gourdes sont pleines !"; }
        else if (collecte + restant + drops.length < m.p) { pause = 1.5; hint.textContent = "Plus assez d’eau ! On recommence…"; }
      } else { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      caFondEau(c, W, H, time, false);
      c.fillStyle = "#12404a"; c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H);
      const sx = W / 2 + Math.sin(time * .8) * 110;
      c.fillStyle = "#3a4a52"; c.beginPath(); c.roundRect ? c.roundRect(sx - 22, 0, 44, 12, 6) : c.rect(sx - 22, 0, 44, 12); c.fill();
      rocks.forEach(r => { const g = c.createRadialGradient(r.x - 6, r.y - 6, 3, r.x, r.y, r.r); g.addColorStop(0, "#8a948f"); g.addColorStop(1, "#4a524e"); c.fillStyle = g; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.fill(); });
      lines.forEach(l => {
        const a = l.age < 4.5 ? 1 : Math.max(0, 1 - (l.age - 4.5) / 1.5);
        c.globalAlpha = a; c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = "#7a5028"; c.lineWidth = 9; c.beginPath(); l.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        c.strokeStyle = "#c79a5b"; c.lineWidth = 4; c.beginPath(); l.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1] - 1.5) : c.moveTo(p[0], p[1] - 1.5)); c.stroke();
        c.globalAlpha = 1;
      });
      c.fillStyle = "rgba(150,225,255,.95)"; drops.forEach(d => { c.beginPath(); c.arc(d.x, d.y, 4, 0, 7); c.fill(); });
      c.fillStyle = "rgba(255,255,255,.7)"; drops.forEach(d => { c.beginPath(); c.arc(d.x - 1, d.y - 1.5, 1.4, 0, 7); c.fill(); });
      c.fillStyle = "#0a2230"; c.fillRect(0, GY + 12, W, H - GY);
      gourdes.forEach(q => {
        const niv = Math.min(1, q.n / Math.max(1, m.p / 2.2));
        c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.roundRect ? c.roundRect(q.x - 22, GY + 6, 44, 56, [8, 8, 14, 14]) : c.rect(q.x - 22, GY + 6, 44, 56); c.fill();
        c.fillStyle = "rgba(90,200,255,.85)"; c.fillRect(q.x - 20, GY + 60 - niv * 50, 40, niv * 50);
        c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 2.5; c.beginPath(); c.roundRect ? c.roundRect(q.x - 22, GY + 6, 44, 56, [8, 8, 14, 14]) : c.rect(q.x - 22, GY + 6, 44, 56); c.stroke();
        c.fillStyle = "#8b5a2b"; c.fillRect(q.x - 10, GY - 2, 20, 8);
      });
      caHud(c, "💧 " + collecte + "/" + m.p, "réserve : " + restant);
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* IMPOSTEUR 1 — Poison indétectable (m.p = nb de flacons, ex. 2)
     Reproduis la couleur de l'eau de la source avec des gouttes de pigment
     (le mélange est visible en direct) puis verse. Écart trop grand = ça se verrait. */
  poison(z, m, prog, ok) {
    caCss();
    const sc = el("div", "caScene"); sc.style.height = "340px"; z.appendChild(sc);
    const hud = el("div", "caHud"), gau = el("span"), dro = el("span"); hud.appendChild(gau); hud.appendChild(dro); sc.appendChild(hud);
    const fioles = el("div", "caFioles"); sc.appendChild(fioles);
    const mk = (titre) => {
      const w = el("div", "caFWrap"), f = el("div", "caFiole"), liq = el("div", "caLiq");
      const corps = el("div", "caCorps"); corps.appendChild(liq); f.appendChild(el("div", "caCol")); f.appendChild(corps);
      w.appendChild(f); w.appendChild(el("div", "", titre)); fioles.appendChild(w); return liq;
    };
    const liqT = mk("💧 Eau de la source"), liqM = mk("☠️ Ton flacon");
    const bar = el("div", "caBar"), bi = el("i"), seuil = el("div", "caSeuil"); bar.appendChild(bi); bar.appendChild(seuil); sc.appendChild(bar);
    const chips = el("div", "caChips"); sc.appendChild(chips);
    const cR = el("span", "caChip"), cV = el("span", "caChip"), cB = el("span", "caChip"); [cR, cV, cB].forEach(x => chips.appendChild(x));
    const pig = el("div", "caPig"); sc.appendChild(pig);
    const EAU = [178, 226, 240], PIG = { r: [225, 60, 70], v: [70, 190, 95], b: [55, 105, 225], e: EAU }, A = .2, TOL = 24, DMAX = 160;
    [["r", "🔴"], ["v", "🟢"], ["b", "🔵"], ["e", "💧"]].forEach(([k, e]) => {
      const b = el("button", "caPigB", e); b.style.background = "rgb(" + PIG[k].join(",") + ")";
      b.addEventListener("pointerdown", ev => { ev.preventDefault(); ajoute(k); }); pig.appendChild(b);
    });
    const act = el("div", "caAct"); sc.appendChild(act);
    const bV = el("button", "caBtn", "Vider"), bP = el("button", "caBtn vert", "☠️ Verser"); act.appendChild(bV); act.appendChild(bP);
    const hint = el("div", "mnMiHint", "Reproduis la couleur de l’eau avec les pigments"); z.appendChild(hint);

    let flacon = 0, cible = EAU.slice(), mix = EAU.slice(), nb = 0, max = 9, bloque = false;
    const rgb = a => "rgb(" + a.map(Math.round).join(",") + ")";
    const dist = () => Math.hypot(cible[0] - mix[0], cible[1] - mix[1], cible[2] - mix[2]);
    function ajoute(k) {
      if (bloque) return;
      for (let i = 0; i < 3; i++) mix[i] = mix[i] * (1 - A) + PIG[k][i] * A;
      nb++;
      if (nb > max) { hint.textContent = "Trop de pigment, on vide le flacon !"; vide(); return; }
      maj();
    }
    function vide() { mix = EAU.slice(); nb = 0; maj(); }
    function nouveau() {
      const k = Math.floor(caRnd(4, 7)); cible = EAU.slice();
      for (let i = 0; i < k; i++) { const p = PIG["rvb"[Math.floor(Math.random() * 3)]]; for (let j = 0; j < 3; j++) cible[j] = cible[j] * (1 - A) + p[j] * A; }
      max = k + 5; mix = EAU.slice(); nb = 0; maj();
    }
    function maj() {
      liqT.style.setProperty("--c", rgb(cible)); liqM.style.setProperty("--c", rgb(mix));
      const d = dist(), pc = caClamp(1 - d / DMAX, 0, 1);
      bi.style.width = (pc * 100) + "%"; seuil.style.left = ((1 - TOL / DMAX) * 100) + "%";
      const ch = (nom, i, col) => { const df = cible[i] - mix[i]; return nom + (df > 12 ? " ▲" : df < -12 ? " ▼" : " ✓"); };
      cR.textContent = ch("Rouge", 0); cV.textContent = ch("Vert", 1); cB.textContent = ch("Bleu", 2);
      cR.style.color = "#ff8a98"; cV.style.color = "#8aff9c"; cB.style.color = "#8ac4ff";
      gau.textContent = "☠️ Flacon " + Math.min(flacon + 1, m.p) + "/" + m.p; dro.textContent = "gouttes " + nb + "/" + max;
    }
    bV.addEventListener("pointerdown", e => { e.preventDefault(); if (!bloque) vide(); });
    bP.addEventListener("pointerdown", e => {
      e.preventDefault(); if (bloque) return;
      if (dist() < TOL) {
        flacon++; prog(flacon / m.p); bloque = true; hint.textContent = "Indétectable ! Le poison est versé.";
        setTimeout(() => { if (flacon >= m.p) ok(); else { bloque = false; nouveau(); hint.textContent = "Nouveau flacon : même exercice"; } }, 900);
      } else {
        hint.textContent = "Ça se verrait… la couleur est trop différente !";
        sc.classList.remove("caHit"); void sc.offsetWidth; sc.classList.add("caHit");
      }
    });
    nouveau();
    return () => { bloque = true; };
  },

  /* IMPOSTEUR 2 — Crocheter la vanne (m.p = nb de goupilles, ex. 3 ; 32 s)
     Glisse le doigt sur le rail : la jauge de tension et les tremblements
     indiquent « chaud / froid ». Reste dans la fenêtre 0,6 s pour bloquer la
     goupille. */
  crochet(z, m, prog, ok) {
    const W = 320, H = 300, TMAX = 32, RX = 34, RW = 252, [cv, c] = caCanvas(z, W, H);
    const hint = el("div", "mnMiHint", "Glisse le doigt sur le rail : plus c’est chaud, plus tu es près"); z.appendChild(hint);
    let cibles, pin, pos = .5, hold = 0, tps = 0, pops = [], pause = 0, fin = 0, time = 0, down = false, last = performance.now(), raf = 0, vivant = true;
    const fen = i => Math.max(.028, .046 - .006 * i);
    function init() {
      cibles = []; let p = -1;
      for (let i = 0; i < m.p; i++) { let v, t = 0; do { v = caRnd(.1, .9); t++; } while (t < 30 && Math.abs(v - p) < .25); cibles.push(v); p = v; }
      pin = 0; hold = 0; tps = 0; pos = .5; prog(0);
    }
    init();
    const place = e => { const [x] = caPos(cv, e, W, H); pos = caClamp((x - RX) / RW, 0, 1); };
    cv.addEventListener("pointerdown", e => { e.preventDefault(); down = true; place(e); });
    cv.addEventListener("pointermove", e => { if (down) place(e); });
    const lache = () => { down = false; };
    ["pointerup", "pointercancel", "pointerleave"].forEach(k => cv.addEventListener(k, lache));
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.06, (now - last) / 1000); last = now; time += dt;
      pops.forEach(p => { p.a += dt * 1.6; }); pops = pops.filter(p => p.a < 1);
      let heat = 0;
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Glisse le doigt sur le rail : plus c’est chaud, plus tu es près"; } }
      else if (!fin) {
        tps += dt;
        const d = Math.abs(pos - cibles[pin]); heat = Math.pow(caClamp(1 - d / .4, 0, 1), 1.6);
        if (d < fen(pin)) hold += dt / .6; else hold = Math.max(0, hold - dt * 2);
        if (hold >= 1) {
          pin++; hold = 0; prog(pin / m.p); pops.push({ a: 0, t: "CLIC !", x: RX + cibles[pin - 1] * RW });
          if (pin >= m.p) { fin = .001; hint.textContent = "La vanne est débloquée !"; }
        }
        if (!fin && tps >= TMAX) { pause = 1.4; hint.textContent = "Trop long ! Le mécanisme se réinitialise…"; }
      } else { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#26414a"); g.addColorStop(1, "#0f232b");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const tr = heat * 3.2, sx = (Math.random() - .5) * tr, sy = (Math.random() - .5) * tr;
      /* volant de vanne */
      c.save(); c.translate(W / 2 + sx, 90 + sy); c.rotate(pin * .5 + (fin ? fin * 3 : 0));
      c.strokeStyle = "#b6772e"; c.lineWidth = 12; c.beginPath(); c.arc(0, 0, 54, 0, 7); c.stroke();
      c.strokeStyle = "#e0a850"; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 54, 0, 7); c.stroke();
      c.strokeStyle = "#b6772e"; c.lineWidth = 9;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * 1.5708) * 54, Math.sin(i * 1.5708) * 54); c.stroke(); }
      c.fillStyle = "#e0a850"; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
      c.restore();
      /* goupilles */
      for (let i = 0; i < m.p; i++) {
        const px = W / 2 + (i - (m.p - 1) / 2) * 70, set = i < pin, cur = i === pin;
        const up = set ? 24 : 0;
        c.fillStyle = "#1a2c33"; c.fillRect(px - 15, 168, 30, 46);
        c.fillStyle = set ? "#f2c14e" : cur ? "#9fb6c0" : "#5b6f78";
        c.fillRect(px - 11, 176 - up + (cur && !set ? sy : 0), 22, 36);
        c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(px - 8, 178 - up, 4, 32);
        if (cur && !fin) { c.fillStyle = "#fff"; c.font = "16px sans-serif"; c.textAlign = "center"; c.fillText("▼", px, 164); }
      }
      /* rail */
      c.strokeStyle = "#101b20"; c.lineWidth = 14; c.lineCap = "round"; c.beginPath(); c.moveTo(RX, 262); c.lineTo(RX + RW, 262); c.stroke();
      c.strokeStyle = "#3e5560"; c.lineWidth = 8; c.beginPath(); c.moveTo(RX, 262); c.lineTo(RX + RW, 262); c.stroke();
      const mx = RX + pos * RW;
      if (hold > 0) { c.strokeStyle = "#ffe27a"; c.lineWidth = 4; c.beginPath(); c.arc(mx, 262, 20, -1.57, -1.57 + hold * 6.28); c.stroke(); }
      c.font = "28px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🔧", mx, 258);
      /* tension */
      c.textBaseline = "alphabetic";
      c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(20, 32, W - 40, 12);
      const hg = c.createLinearGradient(20, 0, W - 20, 0); hg.addColorStop(0, "#4aa3ff"); hg.addColorStop(.6, "#ffc43d"); hg.addColorStop(1, "#ff3b55");
      c.fillStyle = hg; c.fillRect(20, 32, (W - 40) * heat, 12);
      c.font = "700 11px sans-serif"; c.fillStyle = "#cfe"; c.textAlign = "left"; c.fillText("froid", 20, 58); c.textAlign = "right"; c.fillText("chaud", W - 20, 58);
      pops.forEach(p => { c.globalAlpha = 1 - p.a; c.font = "900 18px sans-serif"; c.fillStyle = "#ffe27a"; c.textAlign = "center"; c.fillText(p.t, p.x, 240 - p.a * 24); c.globalAlpha = 1; });
      caHud(c, "🔧 " + pin + "/" + m.p, "⏱ " + Math.max(0, Math.ceil(TMAX - tps)) + " s");
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 1 — Ricochets fantômes (m.p = nb de ricochets, ex. 6)
     Tire vers la gauche pour doser la puissance (plus fort = plus rapide),
     relâche pour lancer. À chaque impact, touche quand le cercle se referme. */
  ricochet(z, m, prog, ok) {
    const W = 320, H = 280, WY = 190, SX = 100, [cv, c] = caCanvas(z, W, H);
    const hint = el("div", "mnMiHint", "Tire vers la gauche pour la puissance, relâche pour lancer"); z.appendChild(hint);
    let etat = "pret", k = 0, t = 0, tau0 = 1, sm = 1, tapped = false, pw = .5, x0 = 0, drag = false, ripples = [], sink = 0, fin = 0, time = 0, off = 0, last = performance.now(), raf = 0, vivant = true;
    const tauK = () => tau0 * Math.pow(.94, k), hK = () => 76 * Math.pow(.85, k);
    function echec(msg) { etat = "plouf"; sink = 0; hint.textContent = msg; }
    cv.addEventListener("pointerdown", e => {
      e.preventDefault(); const [x] = caPos(cv, e, W, H);
      if (etat === "pret") { drag = true; x0 = x; pw = .3; return; }
      if (etat === "vol") {
        const dl = tauK() - t;
        if (Math.abs(dl) <= .14) { if (!tapped) { tapped = true; } }
        else if (dl > .14) echec("Trop tôt ! La pierre coule…");
      }
    });
    cv.addEventListener("pointermove", e => { if (drag) { const [x] = caPos(cv, e, W, H); pw = caClamp((x0 - x) / 100, .2, 1); } });
    const lance = () => {
      if (!drag) return; drag = false;
      sm = .85 + .45 * pw; tau0 = .85 / sm; k = 0; t = 0; tapped = false; ripples = []; etat = "vol";
      hint.textContent = "Touche quand le cercle se referme sur l’eau !";
    };
    cv.addEventListener("pointerup", lance); cv.addEventListener("pointercancel", () => { drag = false; });
    const yStone = () => {
      if (etat === "pret") return WY - 30;
      if (etat === "plouf") return WY + sink * 40;
      const s = caClamp(t / tauK(), 0, 1); return WY - hK() * 4 * s * (1 - s) - 4;
    };
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      const vw = (etat === "vol" || etat === "fin") ? 170 * sm : 28; off += vw * dt;
      ripples.forEach(r => { r.x -= vw * dt; r.a += dt * 1.4; }); ripples = ripples.filter(r => r.a < 1 && r.x > -60);
      if (etat === "vol") {
        t += dt;
        if (t >= tauK() + .14 && !tapped) echec("Trop tard ! La pierre coule…");
        else if (t >= tauK() && tapped) {
          ripples.push({ x: SX, a: 0 }); k++; prog(k / m.p); t = 0; tapped = false;
          if (k >= m.p) { etat = "fin"; fin = .001; hint.textContent = "Quel lancer ! La pierre file jusqu’à l’autre rive."; }
        }
      } else if (etat === "plouf") { sink += dt * 1.6; if (sink > 1.2) { etat = "pret"; k = 0; prog(0); hint.textContent = "Tire vers la gauche pour la puissance, relâche pour lancer"; } }
      else if (etat === "fin") { fin += dt; if (fin > 1.1) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      const sky = c.createLinearGradient(0, 0, 0, WY); sky.addColorStop(0, "#4b3f8f"); sky.addColorStop(1, "#9a7fd0");
      c.fillStyle = sky; c.fillRect(0, 0, W, WY);
      c.fillStyle = "rgba(255,246,210,.9)"; c.beginPath(); c.arc(250, 50, 22, 0, 7); c.fill();
      c.fillStyle = "#2b2260"; c.beginPath(); c.moveTo(0, WY - 40);
      for (let x = 0; x <= W; x += 20) c.lineTo(x, WY - 40 - 18 * Math.abs(Math.sin((x + off * .1) * .03)) - 10);
      c.lineTo(W, WY); c.lineTo(0, WY); c.fill();
      const wg = c.createLinearGradient(0, WY, 0, H); wg.addColorStop(0, "#2a7e9a"); wg.addColorStop(1, "#0a2a40");
      c.fillStyle = wg; c.fillRect(0, WY, W, H - WY);
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const y = WY + 10 + i * 12, x = ((i * 47 - off * (.6 + i * .08)) % (W + 60) + W + 60) % (W + 60) - 30; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 36, y); c.stroke(); }
      ripples.forEach(r => { c.strokeStyle = "rgba(220,245,255," + (1 - r.a) + ")"; c.lineWidth = 2.5; c.beginPath(); c.ellipse(r.x, WY, 8 + r.a * 40, 3 + r.a * 10, 0, 0, 7); c.stroke(); });
      if (etat === "vol") {
        const s = t / tauK();
        if (s > .5) {
          const rr = 12 + 34 * (1 - caClamp((s - .5) / .5, 0, 1)), ok2 = Math.abs(tauK() - t) <= .14;
          c.strokeStyle = ok2 ? "#7affb0" : "rgba(255,255,255,.85)"; c.lineWidth = ok2 ? 5 : 3;
          c.beginPath(); c.ellipse(SX, WY, rr, rr * .32, 0, 0, 7); c.stroke();
        }
      }
      if (etat === "pret" && drag) {
        c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(SX - 20, 250); c.lineTo(SX - 20 - pw * 80, 250); c.stroke();
        c.font = "700 12px sans-serif"; c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("puissance " + Math.round(pw * 100) + " %", SX - 20, 268);
      }
      const ys = yStone();
      c.save(); c.globalAlpha = etat === "plouf" ? Math.max(0, 1 - sink) : .95;
      c.shadowColor = "#bfe6ff"; c.shadowBlur = 14; c.font = "30px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🪨", SX, ys); c.restore();
      if (etat === "plouf") { c.font = "24px serif"; c.textAlign = "center"; c.fillText("💦", SX, WY - 10); }
      caHud(c, "🪨 " + k + "/" + m.p, etat === "vol" ? "au bon moment !" : "");
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  },

  /* MORT 2 — Chute libre dans la cascade (m.p = gouttes lumineuses, ex. 8)
     Tu tombes, vue de haut en bas : glisse le doigt à gauche / droite pour
     éviter rochers et troncs et attraper les gouttes. 3 vies. */
  chute(z, m, prog, ok) {
    const W = 320, H = 340, PY = 96, PR = 13, [cv, c] = caCanvas(z, W, H);
    const hint = el("div", "mnMiHint", "Glisse le doigt pour éviter les obstacles et attraper les gouttes"); z.appendChild(hint);
    let px = W / 2, tx = px, obs, gouttes, vie, n, dist, inv, pause = 0, fin = 0, time = 0, pops = [], last = performance.now(), raf = 0, vivant = true;
    function init() { px = W / 2; tx = px; obs = []; gouttes = []; vie = 3; n = 0; dist = 0; inv = 0; pops = []; prog(0); }
    init();
    const place = e => { const [x] = caPos(cv, e, W, H); tx = caClamp(x, 24, W - 24); };
    cv.addEventListener("pointerdown", e => { e.preventDefault(); place(e); });
    cv.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") place(e); });
    function ligne(y) {
      const r = Math.random();
      if (r < .4) { const g = caRnd(50, W - 50); obs.push({ t: "r", x: g - 78 - 10, y, r: 24 }, { t: "r", x: g + 78 + 10, y, r: 24 }); if (Math.random() < .55) gouttes.push({ x: g, y }); }
      else if (r < .75) { const dr = Math.random() < .5, w = caRnd(170, 200); obs.push({ t: "l", x: dr ? 12 : W - 12 - w, y, w, h: 16 }); const gx = dr ? caRnd(w + 40, W - 30) : caRnd(30, W - w - 40); if (Math.random() < .55) gouttes.push({ x: gx, y }); }
      else { const a = caRnd(60, W - 60); obs.push({ t: "r", x: a, y, r: 26 }); if (Math.random() < .5) gouttes.push({ x: a + (a < W / 2 ? 80 : -80), y }); }
    }
    (function tick(now) {
      if (!vivant) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      pops.forEach(p => { p.a += dt * 1.7; }); pops = pops.filter(p => p.a < 1);
      if (pause > 0) { pause -= dt; if (pause <= 0) { init(); hint.textContent = "Glisse le doigt pour éviter les obstacles et attraper les gouttes"; } }
      else if (!fin) {
        const v = 150 + 10 * n; dist += v * dt; inv = Math.max(0, inv - dt);
        px += (tx - px) * Math.min(1, dt * 12);
        while (dist >= 105) { dist -= 105; ligne(H + 30 - dist); }
        obs.forEach(o => { o.y -= v * dt; }); gouttes.forEach(g => { g.y -= v * dt; });
        obs = obs.filter(o => o.y > -50); gouttes = gouttes.filter(g => g.y > -30 && !g.pris);
        gouttes.forEach(g => { if (Math.hypot(g.x - px, g.y - PY) < PR + 12) { g.pris = true; n++; prog(n / m.p); pops.push({ x: g.x, y: g.y, a: 0, t: "💧" }); } });
        if (inv <= 0) obs.forEach(o => {
          let touche = false;
          if (o.t === "r") touche = Math.hypot(o.x - px, o.y - PY) < o.r + PR - 3;
          else { const cx = caClamp(px, o.x, o.x + o.w), cy = caClamp(PY, o.y - o.h / 2, o.y + o.h / 2); touche = Math.hypot(cx - px, cy - PY) < PR - 2; }
          if (touche && inv <= 0) { vie--; inv = 1.2; pops.push({ x: px, y: PY, a: 0, t: "💥" }); }
        });
        if (n >= m.p) { fin = .001; hint.textContent = "Tu as atteint le bassin !"; }
        else if (vie <= 0) { pause = 1.4; hint.textContent = "Tu t’écrases sur les rochers ! On recommence…"; }
      } else { fin += dt; if (fin > .9) { vivant = false; prog(1); ok(); return; } }
      /* dessin */
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#6fd0e8"); bg.addColorStop(1, "#1d7f9a");
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,255,255,.28)";
      for (let i = 0; i < 14; i++) { const x = (i * 47 + 13) % W, y = (((i * 83 - time * 360 * (.8 + (i % 3) * .2)) % (H + 60)) + H + 60) % (H + 60) - 30; c.fillRect(x, y, 3, 34 + (i % 4) * 8); }
      c.fillStyle = "#1c4a3a"; c.fillRect(0, 0, 10, H); c.fillRect(W - 10, 0, 10, H);
      c.fillStyle = "#2f7a54"; for (let i = 0; i < 9; i++) { const y = (((i * 70 - time * 150) % (H + 70)) + H + 70) % (H + 70) - 30; c.beginPath(); c.arc(7, y, 9, 0, 7); c.arc(W - 7, y + 30, 9, 0, 7); c.fill(); }
      obs.forEach(o => {
        if (o.t === "r") { const g = c.createRadialGradient(o.x - 7, o.y - 7, 4, o.x, o.y, o.r); g.addColorStop(0, "#9aa39d"); g.addColorStop(1, "#4a524e"); c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.ellipse(o.x, o.y + o.r + 4, o.r * .8, 4, 0, 0, 7); c.fill(); }
        else { c.fillStyle = "#6b4423"; c.beginPath(); c.roundRect ? c.roundRect(o.x, o.y - o.h / 2, o.w, o.h, 8) : c.rect(o.x, o.y - o.h / 2, o.w, o.h); c.fill(); c.fillStyle = "#9b6b3a"; c.fillRect(o.x + 6, o.y - o.h / 2 + 3, o.w - 12, 3); }
      });
      gouttes.forEach(g => { const rr = 18 + Math.sin(time * 6 + g.x) * 2; const gr = c.createRadialGradient(g.x, g.y, 2, g.x, g.y, rr); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.4, "rgba(255,240,150,.8)"); gr.addColorStop(1, "rgba(255,240,150,0)"); c.fillStyle = gr; c.beginPath(); c.arc(g.x, g.y, rr, 0, 7); c.fill(); c.font = "18px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("💧", g.x, g.y); });
      if (inv <= 0 || Math.floor(time * 14) % 2) { c.font = "30px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.save(); c.translate(px, PY); c.rotate((tx - px) * .004); c.fillText("👻", 0, 0); c.restore(); }
      pops.forEach(p => { c.globalAlpha = 1 - p.a; c.font = (24 + p.a * 22) + "px serif"; c.textAlign = "center"; c.fillText(p.t, p.x, p.y - p.a * 20); c.globalAlpha = 1; });
      caHud(c, "💧 " + n + "/" + m.p, "❤️".repeat(Math.max(0, vie)) + "🖤".repeat(3 - Math.max(0, vie)));
      raf = requestAnimationFrame(tick);
    })(performance.now());
    return () => { vivant = false; cancelAnimationFrame(raf); };
  }
};

Object.keys(JEUX_CASCADE).forEach(k => { JEUX[k] = JEUX_CASCADE[k]; });

  /* Ouvre le mini-jeu par-dessus la vue du téléphone.
     onFin() : mission réussie ; onFerme() : overlay fermé (toujours appelé). */
  function ouvrir(root, m, onFin, onFerme) {
    css();
    const ov = el("div", "mnMi"), card = el("div", "mnMiCard" + (m.cat === "imposteur" ? " imp" : m.cat === "mort" ? " mort" : ""));
    const bar = el("div", "mnMiBar"), fill = el("i"), zone = el("div", "mnMiG");
    bar.appendChild(fill);
    card.appendChild(el("div", "mnMiL", (m.lieu || "").toUpperCase()));
    card.appendChild(el("div", "mnMiE", m.emoji));
    card.appendChild(el("div", "mnMiT", m.nom));
    card.appendChild(el("div", "mnMiD", m.desc));
    card.appendChild(bar); card.appendChild(zone);
    const x = el("button", "mnMiX", "Abandonner"); card.appendChild(x);
    ov.appendChild(card); root.appendChild(ov);

    let stop = null, fini = false, ferme = false;
    const prog = v => { fill.style.width = Math.round(Math.max(0, Math.min(1, v)) * 100) + "%"; };
    function fermer() {
      if (ferme) return; ferme = true;
      if (stop) stop();
      ov.remove();
      if (onFerme) onFerme();
    }
    function reussi() {
      if (fini) return; fini = true;
      if (stop) stop();
      zone.innerHTML = ""; zone.appendChild(el("div", "mnMiOk", "✔")); prog(1); x.style.display = "none";
      setTimeout(() => { if (ferme) return; if (onFin) onFin(); fermer(); }, 700);
    }
    x.onclick = fermer;
    stop = (JEUX[m.type] || JEUX.tap)(zone, m, prog, reussi);
    return { id: m.id, fermer };
  }

  return { NB, choisir, creer, categorie, pouvoirs, ouvrir, POUVOIRS };
})();
