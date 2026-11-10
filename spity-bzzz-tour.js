/* ===== spity-bzzz-tour.js : mode « Chacun son tour » =====
   Un joueur (ou une équipe) par question, à tour de rôle. L'animateur voit la réponse et valide.
   Bonne réponse = 1 point. */
BzzzPartie.mode("tour",{
  type:"qr",

  debut:function(G,E){
    var u=G.units[G.i%G.units.length];
    G.m={actif:u.id};
    return{actif:u.id,nomActif:u.nom}},

  hote:function(w,G,E){
    var u=E.unit(G.m.actif);
    w.appendChild(E.h("div","bpq",G.q.q));
    w.appendChild(E.h("div","bps","C’est le tour de"));
    w.appendChild(E.chip(u));
    w.appendChild(E.h("div","bpans","Réponse attendue : "+G.q.r));
    var b=E.h("div","bpbtns");
    b.appendChild(E.bouton("✓ Bonne réponse","sun",function(){E.pts(u,1);E.finQ()}));
    b.appendChild(E.bouton("✗ Raté","",function(){E.finQ()}));
    w.appendChild(b)},

  recevoir:function(){},

  tel:function(w,T,X){
    var moi=T.q.actif===T.unite;
    w.appendChild(X.h("h2","bptt",moi?"C’est ton tour !":"Tour de "+T.q.nomActif));
    if(moi){
      w.appendChild(X.h("div","bpts",T.q.q));
      w.appendChild(X.h("div","bpts","Réponds à voix haute : l’animateur valide."))}
    else w.appendChild(X.h("div","bpts","Écoute bien, ce sera peut-être à toi ensuite."))}
});
