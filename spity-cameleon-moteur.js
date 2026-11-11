// manoir-moteur.js — simulation côté hôte : déplacement, collisions, ce que chaque joueur a le droit de voir.
const Moteur = (() => {
  const M = MANOIR_MAP, C = MANOIR_CFG;
  const mur = (x, y) => { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= M.largeur || y >= M.hauteur || M.grille[y][x] === '#'; };
  const typeCase = (x, y) => M.grille[Math.floor(y)][Math.floor(x)];
  const libre = (x, y, r) => !(mur(x - r, y - r) || mur(x + r, y - r) || mur(x - r, y + r) || mur(x + r, y + r));
  function voit(ax, ay, bx, by) {            // ligne de vue : aucun mur entre A et B
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 0.2);
    for (let i = 1; i < n; i++) { const t = i / n; if (mur(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
    return true;
  }
  // Limites du cahier des règles (§2) selon le nombre de joueurs
  function limites(n) {
    const c = n <= 6 ? 1 : n <= 11 ? 2 : 3, i = n <= 6 ? 1 : n <= 10 ? 2 : 3;
    return { cult: Math.max(1, Math.min(c, Math.floor(n / 2))), info: i };
  }
  const melange = a => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
  function nouveau() {
    const e = { joueurs: {}, n: 0, phase: 'jeu', tPhase: 0 };
    e.ajouter = (id, pseudo) => {
      const i = e.n++, s = M.apparitions[i % M.apparitions.length];
      return (e.joueurs[id] = { id, pseudo, x: s[0] + .5, y: s[1] + .5, dx: 0, dy: 0, couleur: C.couleurs[i % C.couleurs.length] });
    };
    // Tire les rôles parmi ceux activés par l'hôte (actifs = liste d'ids, ou rien = tous)
    e.distribuer = actifs => {
      const ids = melange(Object.keys(e.joueurs)), n = ids.length, L = limites(n);
      const ok = r => !r.fixe && (!actifs || actifs.includes(r.id));
      const cult = melange(MM_ROLES.filter(r => r.camp === 'cultiste' && ok(r)).map(r => r.id)).slice(0, L.cult);
      while (cult.length < L.cult) cult.push('cultiste');
      const places = n - L.cult, inv = []; let info = 0;
      for (const r of melange(MM_ROLES.filter(r => r.camp === 'invite' && ok(r)))) {
        if (inv.length >= places) break;
        if (r.info) { if (info >= L.info) continue; info++; }
        inv.push(r.id);
      }
      while (inv.length < places) inv.push('innocent');
      const roles = cult.concat(inv);
      ids.forEach((id, i) => {
        const j = e.joueurs[id], r = MM_ROLES.find(x => x.id === roles[i]);
        j.role = r.id; j.camp = r.camp;
      });
      e.phase = 'role'; e.tPhase = C.dureeRole;
    };
    e.retirer = id => { delete e.joueurs[id]; };
    e.dir = (id, dx, dy) => {
      const j = e.joueurs[id]; if (!j) return;
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      j.dx = dx; j.dy = dy;
    };
    e.maj = dt => {
      if (e.phase !== 'jeu') {                // rôle (8 s) puis compte à rebours (10 s) : personne ne bouge
        e.tPhase -= dt;
        if (e.tPhase <= 0) { if (e.phase === 'role') { e.phase = 'compte'; e.tPhase = C.dureeCompte; } else e.phase = 'jeu'; }
        return;
      }
      for (const j of Object.values(e.joueurs)) {
        const vx = j.dx * C.vitesse * dt, vy = j.dy * C.vitesse * dt, r = C.rayonJoueur;
        if (libre(j.x + vx, j.y, r)) j.x += vx;
        if (libre(j.x, j.y + vy, r)) j.y += vy;
      }
    };
    e.vue = id => {                           // uniquement les joueurs que 'id' peut voir
      const j = e.joueurs[id]; if (!j) return null;
      const autres = [];
      for (const o of Object.values(e.joueurs)) {
        if (o === j) continue;
        const lim = typeCase(o.x, o.y) === '~' ? C.rayonBuisson : C.rayonVision;
        if (Math.hypot(o.x - j.x, o.y - j.y) <= lim && voit(j.x, j.y, o.x, o.y))
          autres.push([o.id, +o.x.toFixed(2), +o.y.toFixed(2), o.couleur, o.pseudo]);
      }
      return { t: 'vue', x: +j.x.toFixed(2), y: +j.y.toFixed(2), autres, phase: e.phase, reste: Math.max(0, Math.ceil(e.tPhase)) };
    };
    return e;
  }
  return { nouveau, mur, voit, typeCase };
})();
