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
  function nouveau() {
    const e = { joueurs: {}, n: 0 };
    e.ajouter = (id, pseudo) => {
      const i = e.n++, s = M.apparitions[i % M.apparitions.length];
      return (e.joueurs[id] = { id, pseudo, x: s[0] + .5, y: s[1] + .5, dx: 0, dy: 0, couleur: C.couleurs[i % C.couleurs.length] });
    };
    e.retirer = id => { delete e.joueurs[id]; };
    e.dir = (id, dx, dy) => {
      const j = e.joueurs[id]; if (!j) return;
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      j.dx = dx; j.dy = dy;
    };
    e.maj = dt => {
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
      return { t: 'vue', x: +j.x.toFixed(2), y: +j.y.toFixed(2), autres };
    };
    return e;
  }
  return { nouveau, mur, voit, typeCase };
})();
