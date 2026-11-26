/* spity-cameleon-vote.js
   Interfaces de vote : écran hôte (avec carte des zones) et téléphones.
*/
var ManoirVote = (function () {
  var style = document.createElement("style");

  style.textContent = `
  .mnvPanel{
    position:absolute;inset:0;z-index:12;
    display:none;align-items:center;justify-content:center;
    padding:20px;box-sizing:border-box;
    background:rgba(5,10,8,.94);color:white;
    font-family:system-ui,sans-serif;text-align:center;
    overflow-y:auto
  }
  .mnvBox{width:min(760px,100%);margin:auto}
  .mnvSplit{
    display:flex;gap:20px;width:100%;height:100%;
    align-items:stretch;box-sizing:border-box
  }
  .mnvMapCol{
    flex:1.45;min-width:0;display:flex;flex-direction:column;
    background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.14);
    border-radius:20px;overflow:hidden;position:relative
  }
  .mnvMapCv{width:100%;height:100%;display:block}
  .mnvSideCol{
    flex:1;min-width:300px;max-width:480px;
    display:flex;flex-direction:column;justify-content:center;
    overflow-y:auto;padding:8px 4px
  }
  .mnvTitle{font-size:clamp(24px,3.6vw,38px);font-weight:950;margin-bottom:8px}
  .mnvTimer{font-size:22px;font-weight:900;color:#ffc45c;margin:10px 0}
  .mnvCandidates{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:16px}
  .mnvChoice{
    padding:15px;border-radius:16px;border:2px solid rgba(255,255,255,.2);
    background:rgba(255,255,255,.09);color:white;font-weight:850;font-size:16px
  }
  .mnvChoice:active{transform:scale(.96)}
  .mnvChoice:disabled{opacity:.45}
  .mnvAbstain{background:#56466f;border-color:#a58acb}
  .mnvPlayers{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
    gap:8px;margin-top:14px;text-align:left
  }
  .mnvPlayer{
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;border-radius:12px;
    background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);
    font-weight:800;font-size:15px
  }
  .mnvPlayer.dead{opacity:.42;text-decoration:line-through}
  .mnvDot{width:14px;height:14px;border-radius:50%;flex-shrink:0;border:2px solid rgba(255,255,255,.5)}
  .mnvResults{display:grid;gap:8px;margin:14px auto;width:100%}
  .mnvResult{
    display:flex;justify-content:space-between;align-items:center;
    padding:10px 14px;border-radius:12px;
    background:rgba(255,255,255,.1);font-weight:850
  }
  .mnvCount{font-size:20px;color:#ffc45c}
  .mnvDetails{
    margin:14px auto 0;width:100%;box-sizing:border-box;text-align:left;
    padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.07);
    max-height:220px;overflow-y:auto
  }
  .mnvDetails h3{margin:0 0 8px;font-size:15px}
  .mnvDetail{padding:4px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:14px}
  .mnvReveal{animation:mnvAppear .7s cubic-bezier(.2,.8,.2,1) both}
  .mnvRevealName{font-size:clamp(34px,8vw,70px);font-weight:1000;color:#ff6471}
  .mnvRevealRole{font-size:clamp(18px,2.5vw,26px);font-weight:850;margin-top:8px}
  .mnvRevealSub{opacity:.75;font-size:15px;margin-top:10px}
  @keyframes mnvAppear{
    0%{opacity:0;transform:scale(.35) rotate(-8deg)}
    65%{opacity:1;transform:scale(1.12) rotate(2deg)}
    100%{opacity:1;transform:scale(1) rotate(0)}
  }`;

  document.head.appendChild(style);

  /* Préchargement de l'image de la carte */
  var mapImg = null;
  if (typeof MANOIR_MAP !== "undefined" && MANOIR_MAP.image) {
    mapImg = new Image();
    mapImg.src = MANOIR_MAP.image;
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function creerPanel(root) {
    var panel = el("div", "mnvPanel");
    panel.appendChild(el("div", "mnvBox"));
    root.appendChild(panel);
    return panel;
  }

  /* Dessine uniquement la carte et le nom des zones (sans missions, trappes ni joueurs) */
  function dessinerCarteZones(cv) {
    if (!cv || typeof MANOIR_MAP === "undefined") return;
    var M = MANOIR_MAP;
    var k = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(cv.clientWidth * k);
    var h = Math.round(cv.clientHeight * k);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }

    var cx = cv.getContext("2d");
    var cs = Math.min(w / M.largeur, h / M.hauteur);
    var ox = (w - cs * M.largeur) / 2;
    var oy = (h - cs * M.hauteur) / 2;

    cx.fillStyle = "#0b1511";
    cx.fillRect(0, 0, w, h);

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      cx.drawImage(mapImg, ox, oy, M.largeur * cs, M.hauteur * cs);
    } else if (M.grille) {
      var cases = (typeof MANOIR_CFG !== "undefined" && MANOIR_CFG.cases) || {};
      for (var y = 0; y < M.hauteur; y++) {
        for (var x = 0; x < M.largeur; x++) {
          var c = M.grille[y][x];
          cx.fillStyle = cases[c] || (c === "#" ? "#12211b" : "#22352c");
          cx.fillRect(ox + x * cs, oy + y * cs, cs + 1, cs + 1);
        }
      }
    }

    /* Affichage du nom de chaque pièce */
    var fs = Math.max(11 * k, Math.round(cs * 1.15));
    cx.font = "800 " + fs + "px system-ui, sans-serif";
    cx.textAlign = "center";
    cx.textBaseline = "middle";

    (M.pieces || []).forEach(function (p) {
      var px = ox + (p[0] + 0.5) * cs;
      var py = oy + (p[1] + 0.5) * cs;
      var nom = p[2] || "";
      var tw = cx.measureText(nom).width;
      var padX = 10 * k;
      var boxW = tw + padX * 2;
      var boxH = fs * 1.65;

      /* Évite que le texte ne dépasse hors de la carte sur les bords */
      var lx = Math.max(ox + boxW / 2 + 4 * k, Math.min(ox + M.largeur * cs - boxW / 2 - 4 * k, px));
      var ly = Math.max(oy + boxH / 2 + 4 * k, Math.min(oy + M.hauteur * cs - boxH / 2 - 4 * k, py));

      /* Petit repère sur la position exacte de la pièce */
      cx.fillStyle = "#ffd45c";
      cx.beginPath();
      cx.arc(px, py, Math.max(3 * k, cs * 0.25), 0, Math.PI * 2);
      cx.fill();

      /* Cartouche lisible */
      cx.fillStyle = "rgba(5, 10, 8, 0.84)";
      cx.strokeStyle = "rgba(255, 224, 138, 0.65)";
      cx.lineWidth = Math.max(1.5, 1.5 * k);
      cx.beginPath();
      if (cx.roundRect) {
        cx.roundRect(lx - boxW / 2, ly - boxH / 2, boxW, boxH, 8 * k);
      } else {
        cx.rect(lx - boxW / 2, ly - boxH / 2, boxW, boxH);
      }
      cx.fill();
      cx.stroke();

      cx.fillStyle = "#ffffff";
      cx.fillText(nom, lx, ly + 1);
    });
  }

  /* Liste des joueurs (vivants et éliminés) affichée sur l'écran hôte */
  function construireListeJoueurs(state) {
    var v = state.vote || {};
    var liste = (state.joueurs && state.joueurs.length)
      ? state.joueurs
      : (v.candidats || []);

    if (!liste.length) return null;

    var wrap = el("div", "mnvPlayers");
    liste.forEach(function (j) {
      var item = el("div", "mnvPlayer" + (j.mort ? " dead" : ""));
      if (j.couleur) {
        var dot = el("span", "mnvDot");
        dot.style.background = j.couleur;
        item.appendChild(dot);
      }
      item.appendChild(el("span", "", j.pseudo + (j.mort ? " ☠" : "")));
      wrap.appendChild(item);
    });
    return wrap;
  }

  function afficherRevelation(box, elimine) {
    box.innerHTML = "";

    var contenu = el("div", "mnvReveal");

    if (elimine) {
      contenu.appendChild(el("div", "mnvTitle", "ÉLIMINATION"));
      contenu.appendChild(el("div", "mnvRevealName", elimine.pseudo + " est mort"));
      if (elimine.reveler) {
        var texteCamp = elimine.camp === "cultiste"
          ? "C'était un Cultiste !"
          : "C'était un Invité.";
        contenu.appendChild(el("div", "mnvRevealRole", texteCamp));
      } else {
        contenu.appendChild(el("div", "mnvRevealRole", "Son identité reste secrète…"));
      }
    } else {
      contenu.appendChild(el("div", "mnvTitle", "FIN DU VOTE"));
      contenu.appendChild(el("div", "mnvRevealName", "Personne n'est mort"));
      contenu.appendChild(el("div", "mnvRevealRole", "Égalité ou aucun vote décisif"));
    }

    contenu.appendChild(el("div", "mnvRevealSub", "La prochaine manche va commencer…"));
    box.appendChild(contenu);
  }

  function afficherDiscussion(box, state) {
    box.innerHTML = "";
    var v = state.vote || {};
    if (v.corps) {
      box.appendChild(el("div", "mnvTitle", "CADAVRE SIGNALÉ !"));
      box.appendChild(el("div", "mnvRevealRole",
        (v.reporter || "Quelqu'un") + " a trouvé le corps de " + v.corps));
    } else {
      box.appendChild(el("div", "mnvTitle", "RÉUNION D'URGENCE !"));
      box.appendChild(el("div", "mnvRevealRole",
        (v.reporter || "Quelqu'un") + " a sonné la cloche"));
    }
    box.appendChild(el("div", "mnvTimer", Math.ceil(state.reste || 0) + " s"));
    box.appendChild(el("div", "mnvRevealSub",
      "Discutez ! Le vote commencera ensuite sur les téléphones."));

    var liste = construireListeJoueurs(state);
    if (liste) box.appendChild(liste);
  }

  function afficherFin(box, fin, quitter) {
    box.innerHTML = "";
    var cult = fin && fin.gagnant === "cultiste";
    var c = el("div", "mnvReveal");
    c.appendChild(el("div", "mnvTitle", "FIN DE LA PARTIE"));
    c.appendChild(el("div", "mnvRevealName",
      cult ? "Les Cultistes gagnent" : "Les Invités gagnent"));
    box.appendChild(c);

    var d = el("div", "mnvDetails");
    d.appendChild(el("h3", "", "Les rôles"));
    ((fin && fin.roles) || []).forEach(function (r) {
      d.appendChild(el("div", "mnvDetail",
        (r.emoji || "") + " " + r.pseudo + " : " + r.role +
        (r.camp === "cultiste" ? " (Cultiste)" : "") + (r.mort ? " ☠" : "")));
    });
    box.appendChild(d);

    if (quitter) {
      var b = el("button", "mnvChoice", "RETOUR AU MENU");
      b.type = "button";
      b.style.marginTop = "20px";
      b.onclick = quitter;
      box.appendChild(b);
    }
  }

  function creerHote(root) {
    return creerPanel(root);
  }

  function afficherHote(panel, state) {
    if (!panel || !state) return;

    var phase = state.phase;

    if (phase !== "vote" && phase !== "resultats" && phase !== "revelation" &&
      phase !== "discussion" && phase !== "fin") {
      panel.style.display = "none";
      panel.dataset.key = "";
      return;
    }

    panel.style.display = "flex";

    var avecCarte = (phase === "discussion" || phase === "vote" || phase === "resultats");
    var key = phase + "|" + JSON.stringify(state.vote || {}) + "|" +
      JSON.stringify((state.joueurs || []).map(function (j) { return j.id + ":" + j.mort; }));

    if (panel.dataset.key === key) {
      var timer = panel.querySelector(".mnvTimer");
      if (timer && phase !== "resultats") timer.textContent = Math.ceil(state.reste || 0) + " s";
      if (avecCarte) dessinerCarteZones(panel.querySelector(".mnvMapCv"));
      return;
    }

    panel.dataset.key = key;
    panel.innerHTML = "";

    /* Phases centrées sans carte (révélation et fin de partie) */
    if (!avecCarte) {
      var box = el("div", "mnvBox");
      panel.appendChild(box);
      if (phase === "revelation") {
        afficherRevelation(box, state.vote && state.vote.elimine);
      } else if (phase === "fin") {
        afficherFin(box, state.fin, panel._quitter);
      }
      return;
    }

    /* Layout 2 colonnes : carte des zones à gauche + joueurs/votes à droite */
    var split = el("div", "mnvSplit");
    var mapCol = el("div", "mnvMapCol");
    var cv = el("canvas", "mnvMapCv");
    mapCol.appendChild(cv);

    var side = el("div", "mnvSideCol");
    split.appendChild(mapCol);
    split.appendChild(side);
    panel.appendChild(split);

    if (phase === "discussion") {
      afficherDiscussion(side, state);
      dessinerCarteZones(cv);
      return;
    }

    if (phase === "vote") {
      side.appendChild(el("div", "mnvTitle", "VOTE EN COURS"));
      side.appendChild(el("div", "mnvTimer", Math.ceil(state.reste || 0) + " s"));

      var v = state.vote || {};
      side.appendChild(el("div", "", (v.votesRecus || 0) + " / " + (v.total || 0) + " joueurs ont voté"));
      side.appendChild(el("div", "mnvRevealSub", "Les joueurs votent depuis leur téléphone."));

      var liste = construireListeJoueurs(state);
      if (liste) side.appendChild(liste);

      dessinerCarteZones(cv);
      return;
    }

    /* Phase "resultats" */
    side.appendChild(el("div", "mnvTitle", "RÉSULTATS DU VOTE"));
    side.appendChild(el("div", "mnvTimer", "Élimination dans 4 secondes"));

    var vote = state.vote || {};
    var results = el("div", "mnvResults");

    (vote.candidats || []).forEach(function (c) {
      var row = el("div", "mnvResult");
      row.appendChild(el("span", "", c.pseudo));
      row.appendChild(el("span", "mnvCount", String(c.voix || 0)));
      results.appendChild(row);
    });

    side.appendChild(results);

    var details = el("div", "mnvDetails");
    details.appendChild(el("h3", "", "Détail des votes"));

    (vote.details || []).forEach(function (d) {
      details.appendChild(el(
        "div",
        "mnvDetail",
        d.votant + " → " + d.cible + (d.aleatoire ? " (aléatoire)" : "")
      ));
    });

    side.appendChild(details);
    dessinerCarteZones(cv);
  }

  function creerTelephone(root, envoyer) {
    var panel = creerPanel(root);
    panel._envoyer = envoyer;
    return panel;
  }

  function afficherTelephone(panel, state) {
    if (!panel || !state) return;

    var phase = state.phase;

    if (phase !== "vote" && phase !== "resultats" && phase !== "revelation" &&
      phase !== "discussion" && phase !== "fin") {
      panel.style.display = "none";
      panel.dataset.key = "";
      return;
    }

    panel.style.display = "flex";

    var vote = state.vote || {};
    var key = phase + "|" + JSON.stringify(vote.candidats || []) + "|" +
      !!vote.aVote + "|" + JSON.stringify(vote.elimine || null);

    if (panel.dataset.key === key) {
      var timer = panel.querySelector(".mnvTimer");
      if (timer) timer.textContent = Math.ceil(state.reste || 0) + " s";
      return;
    }

    panel.dataset.key = key;
    var box = panel.firstChild;
    box.innerHTML = "";

    if (phase === "revelation") {
      afficherRevelation(box, vote.elimine);
      return;
    }

    if (phase === "fin") { afficherFin(box, state.fin, null); return; }
    if (phase === "discussion") { afficherDiscussion(box, { reste: state.reste, vote: vote }); return; }

    if (phase === "resultats") {
      box.appendChild(el("div", "mnvTitle", "VOTE TERMINÉ"));
      box.appendChild(el("div", "mnvRevealSub",
        "Les résultats sont affichés sur l'écran principal."));
      return;
    }

    box.appendChild(el("div", "mnvTitle", "QUI SOUPÇONNES-TU ?"));
    box.appendChild(el("div", "mnvTimer", Math.ceil(state.reste || 0) + " s"));

    if (vote.aVote) {
      box.appendChild(el("div", "mnvRevealRole", "Ton vote a été enregistré."));
      box.appendChild(el("div", "mnvRevealSub", "En attente des autres joueurs…"));
      return;
    }

    var choices = el("div", "mnvCandidates");

    (vote.candidats || []).forEach(function (c) {
      var b = el("button", "mnvChoice", c.pseudo);
      b.type = "button";
      b.onclick = function () {
        panel._envoyer(c.id);
      };
      choices.appendChild(b);
    });

    var abstain = el("button", "mnvChoice mnvAbstain", "NE VOTER PERSONNE");
    abstain.type = "button";
    abstain.onclick = function () {
      panel._envoyer(null);
    };
    choices.appendChild(abstain);

    box.appendChild(choices);
  }

  return {
    creerHote: creerHote,
    afficherHote: afficherHote,
    creerTelephone: creerTelephone,
    afficherTelephone: afficherTelephone
  };
})();
