// manoir-config.js — constantes du jeu (valeurs de départ, à ajuster aux tests)
const MANOIR_CFG = {
  vitesse: 3,          // cases par seconde
  tick: 50,            // ms entre deux mises à jour (20 par seconde)
  rayonVision: 5,      // cases
  rayonBuisson: 1.5,   // distance max à laquelle on voit quelqu'un caché dans un buisson
  dureeRole: 8,        // s : écran secret du rôle
  dureeCompte: 10,     // s : compte à rebours avant le départ
  dureeVote: 60,
  rayonJoueur: 0.3,    // taille de collision
  cooldownKill: 25,    // secondes entre deux attaques
  couleurs: ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe','#008080','#e6beff','#9a6324','#fffac8','#800000'],
  cases: { '#': '#34463a', '.': '#ece4cc', '~': '#7fae5a' }
};
