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
    /* 5 · La Grotte aux Chauves-souris */ {
      civil: [T("🦇", "Ramasser le guano", "tap", 22, "Remplis le seau… beurk."),
              T("🔦", "Allumer les torches", "ordre", 6, "Rallume-les dans l’ordre.")],
      imposteur: [T("🕯️", "Éteindre les torches", "ordre", 6, "Plonge la grotte dans le noir."),
                  T("🪨", "Condamner un passage", "tap", 24, "Empile les pierres en silence.")],
      mort: [T("👻", "Hurler avec les chauves-souris", "seq", 4, "Mène leur chœur."),
             T("🌑", "Aspirer la lumière", "hold", 3, "Étouffe la dernière lueur.")]
    },
    /* 6 · La Cascade Cachée */ {
      civil: [T("💧", "Détourner le courant", "curseur", 3, "Ouvre la vanne au bon moment."),
              T("🪣", "Remplir les gourdes", "hold", 3, "Puise l’eau claire.")],
      imposteur: [T("🪨", "Faire tomber un rocher", "tap", 25, "Ébranle le rocher."),
                  T("🌊", "Troubler la source", "curseur", 4, "Souille l’eau au bon moment.")],
      mort: [T("🌊", "Écouter l’écho de l’eau", "curseur", 3, "Calque ton souffle sur la chute."),
             T("💦", "Éclabousser le vide", "tap", 16, "Fais jaillir des gouttes.")]
    },
    // 7 · Le Nid des Perroquets
    {
      civil: [T("🦜", "Répéter le mot du perroquet", "parole", 3, "Écoute-le bien, puis répète-le syllabe par syllabe."),
              T("🪽", "Faire voler le perroquet", "vol", 10, "Touche pour battre des ailes et passe entre les troncs.")],
      imposteur: [T("🪶", "Plumes discrètes", "plumes", 6, "Pince les plumes sans réveiller le perroquet."),
                  T("🥚", "Échanger l’œuf", "gobelets", 3, "Suis l’œuf piégé sans te tromper de nid.")],
      mort: [T("🎸", "Concert fantôme", "guitar", 20, "Joue la mélodie des cris sur la bonne piste."),
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
    /* 9 · Le Pont des Singes */ {
      civil: [T("🐒", "Retendre les cordes", "tap", 20, "Serre les haubans."),
              T("🍌", "Ranger les bananes", "ordre", 6, "Classe les régimes.")],
      imposteur: [T("🪢", "Desserrer les cordes", "curseur", 4, "Relâche-les sans bruit."),
                  T("🪚", "Scier une planche", "hold", 4, "Entame le bois à la discrète.")],
      mort: [T("🍌", "Faire tomber les bananes", "ordre", 6, "Fais rouler les fruits."),
             T("🌬️", "Balancer le pont", "curseur", 3, "Souffle en rythme.")]
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
