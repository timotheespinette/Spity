
/* spity-cameleon-vote.js
   Interfaces de vote : écran hôte et téléphones.
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
  .mnvTitle{font-size:clamp(25px,5vw,42px);font-weight:950;margin-bottom:10px}
  .mnvTimer{font-size:22px;font-weight:900;color:#ffc45c;margin:12px}
  .mnvCandidates{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:20px}
  .mnvChoice{
    padding:15px;border-radius:16px;border:2px solid rgba(255,255,255,.2);
    background:rgba(255,255,255,.09);color:white;font-weight:850;font-size:16px
  }
  .mnvChoice:active{transform:scale(.96)}
  .mnvChoice:disabled{opacity:.45}
  .mnvAbstain{background:#56466f;border-color:#a58acb}
  .mnvResults{display:grid;gap:8px;margin:18px auto;max-width:520px}
  .mnvResult{
    display:flex;justify-content:space-between;align-items:center;
    padding:12px 16px;border-radius:12px;
    background:rgba(255,255,255,.1);font-weight:850
  }
  .mnvCount{font-size:22px;color:#ffc45c}
  .mnvDetails{
    margin:20px auto 0;max-width:600px;text-align:left;
    padding:14px;border-radius:14px;background:rgba(255,255,255,.07)
  }
  .mnvDetails h3{margin:0 0 10px}
  .mnvDetail{padding:5px 0;border-bottom:1px solid rgba(255,255,255,.1)}
  .mnvReveal{animation:mnvAppear .7s cubic-bezier(.2,.8,.2,1) both}
  .mnvRevealName{font-size:clamp(34px,8vw,70px);font-weight:1000;color:#ff6471}
  .mnvRevealRole{font-size:clamp(20px,4vw,32px);font-weight:850;margin-top:14px}
  .mnvRevealSub{opacity:.75;font-size:15px;margin-top:12px}
  @keyframes mnvAppear{
    0%{opacity:0;transform:scale(.35) rotate(-8deg)}
    65%{opacity:1;transform:scale(1.12) rotate(2deg)}
    100%{opacity:1;transform:scale(1) rotate(0)}
  }`;

  document.head.appendChild(style);

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
        panel.dataset.phase = "";
      return;
    }

    panel.style.display = "flex";

    var box = panel.firstChild;
    var key = phase + "|" + JSON.stringify(state.vote || {});

    if (panel.dataset.key === key) {
      var timer = panel.querySelector(".mnvTimer");
      if (timer) timer.textContent = Math.ceil(state.reste || 0) + " s";
      return;
    }

    panel.dataset.key = key;
    box.innerHTML = "";

    if (phase === "revelation") {
      afficherRevelation(box, state.vote && state.vote.elimine);
      return;
    }
    if (phase === "fin") { afficherFin(box, state.fin, panel._quitter); return; }
    if (phase === "discussion") { afficherDiscussion(box, state); return; }

    if (phase === "vote") {
      box.appendChild(el("div", "mnvTitle", "VOTE EN COURS"));
      box.appendChild(el("div", "mnvTimer", Math.ceil(state.reste || 0) + " s"));

      var v = state.vote || {};
      box.appendChild(el("div", "", (v.votesRecus || 0) + " / " + (v.total || 0) + " joueurs ont voté"));
      box.appendChild(el("div", "mnvRevealSub", "Les joueurs votent depuis leur téléphone."));
      return;
    }

    box.appendChild(el("div", "mnvTitle", "RÉSULTATS DU VOTE"));
    box.appendChild(el("div", "mnvTimer", "Élimination dans 4 secondes"));

    var vote = state.vote || {};
    var results = el("div", "mnvResults");

    (vote.candidats || []).forEach(function (c) {
      var row = el("div", "mnvResult");
      row.appendChild(el("span", "", c.pseudo));
      row.appendChild(el("span", "mnvCount", String(c.voix || 0)));
      results.appendChild(row);
    });

    box.appendChild(results);

    var details = el("div", "mnvDetails");
    details.appendChild(el("h3", "", "Détail des votes"));

    (vote.details || []).forEach(function (d) {
      details.appendChild(el(
        "div",
        "mnvDetail",
        d.votant + " → " + d.cible + (d.aleatoire ? " (aléatoire)" : "")
      ));
    });

    box.appendChild(details);
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
