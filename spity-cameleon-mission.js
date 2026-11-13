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
    /* 7 · Le Nid des Perroquets */ {
      civil: [T("🦜", "Apprendre un mot au perroquet", "seq", 5, "Répète la mélodie."),
              T("🌰", "Garnir la mangeoire", "hold", 3, "Verse les graines.")],
      imposteur: [T("🪶", "Voler des plumes", "tap", 18, "Chipe-les vite."),
                  T("🥚", "Échanger un œuf", "ordre", 6, "Substitue l’œuf discrètement.")],
      mort: [T("🎶", "Répéter les cris", "ordre", 6, "Redonne la chanson dans l’ordre."),
             T("💨", "Faire s’envoler le nid", "hold", 3, "Souffle fort.")]
    },
    /* 8 · La Mare aux Crocodiles */ {
      civil: [T("🐊", "Nourrir le crocodile", "curseur", 3, "Lance la viande au bon moment."),
              T("🪵", "Réparer la passerelle", "tap", 20, "Cloue les planches.")],
      imposteur: [T("🥩", "Appâter les crocodiles", "hold", 3, "Étale l’appât sur la berge."),
                  T("🪝", "Tendre un piège", "seq", 5, "Arme le piège dans l’ordre.")],
      mort: [T("🫧", "Faire des bulles", "tap", 20, "Fais bouillonner la mare."),
             T("🌿", "Troubler les nénuphars", "curseur", 3, "Fais onduler la surface.")]
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
     P(id, emoji, nom, coût, description, effet, valeur, durée en s)            */
  const P = (id, emoji, nom, cout, desc, effet, val, duree) =>
    ({ id, emoji, nom, cout, desc, effet, val: val || 0, duree: duree || 0 });

  const sprint = P("sprint", "👟", "Sprint", 3, "+40 % de vitesse pendant 8 s", "vitesse", 1.4, 8);
  const lanterne = P("lanterne", "🏮", "Lanterne", 3, "Vision +1,5 case pendant 20 s", "vision", 1.5, 20);
  const talisman = P("talisman", "🛡️", "Talisman", 5, "Annule la prochaine attaque ou le prochain poison", "bouclier");
  const lame = P("lame", "🗡️", "Lame affûtée", 3, "Ton attaque est rechargée instantanément", "cooldown");
  const court = P("court", "⚡", "Court-circuit", 4, "Coupe les caméras pendant 15 s", "camCoupe", 1, 15);

  const POUVOIRS = {
    invite: [sprint, lanterne, talisman],
    innocent: [sprint, P("antidote", "🧪", "Antidote", 2, "Soigne un empoisonnement en cours", "antidote"), talisman],
    veilleur: [P("lynx", "🦉", "Œil de lynx", 2, "Recharge instantanée des caméras", "camReset"), lanterne, talisman],
    medium: [P("vue", "🔮", "Seconde vue", 4, "Vision +3 cases pendant 10 s", "vision", 3, 10), sprint, talisman],

    cultiste: [P("ombre", "🌑", "Voile d’ombre", 5, "Invisible (joueurs et caméras) pendant 8 s", "invisible", 1, 8), lame, court],
    empoisonneur: [P("fiole", "🧪", "Fiole fraîche", 3, "Ton poison est rechargé instantanément", "cooldown"),
                   P("brume", "🌫️", "Brume toxique", 5, "Invisible (joueurs et caméras) pendant 6 s", "invisible", 1, 6), court],
    metamorphe: [P("visage", "🎭", "Second visage", 5, "Invisible (joueurs et caméras) pendant 8 s", "invisible", 1, 8), lame, sprint],

    mort_invite: [
      P("lueur", "🕊️", "Lueur protectrice", 4, "Un invité vivant proche reçoit un talisman", "bouclierProche"),
      P("eclaireur", "🔆", "Éclaireur", 2, "Un invité vivant proche voit +1,5 case pendant 15 s", "visionProche", 1.5, 15),
      P("souffle", "🍃", "Souffle d’élan", 3, "Un invité vivant proche gagne +30 % de vitesse pendant 8 s", "vitesseProche", 1.3, 8)],
    mort_cultiste: [
      P("polter", "👹", "Poltergeist", 3, "Ralentit l’invité vivant le plus proche pendant 6 s", "ralentirProche", .6, 6),
      P("obscur", "🌘", "Obscurité", 4, "Réduit la vision de l’invité le plus proche pendant 8 s", "aveuglerProche", -1.5, 8),
      P("court", "⚡", "Court-circuit", 5, "Coupe les caméras pendant 15 s", "camCoupe", 1, 15)]
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
