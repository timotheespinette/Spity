/* ===== spity-bzzz-buzzer.js : mode « Buzzer » =====
   En ligne : chacun buzze sur son téléphone. En local : l'animateur touche le nom du premier qui a levé la main.
   Bonne réponse = +BP_BUZZER_OK (2), mauvaise = BP_BUZZER_RATE (-1) ; ×2 sur une question « ×2 ».
   Après une erreur, l'unité est bloquée et les autres peuvent reprendre la main. */
(function(){
function envoyerEtat(G,E){
  var u=G.m.par?E.unit(G.m.par):null;
  E.etat({par:G.m.par||"",nom:u?u.nom:"",bloque:Object.keys(G.m.bloque)})}

BzzzPartie.mode("buzzer",{
  type:"qr",

  debut:function(G,E){G.m={par:null,bloque:{}};return{}},

  hote:function(w,G,E){
    var m=G.m,mult=G.bonus?2:1;
    w.appendChild(E.h("div","bpq",G.q.q));
    if(!m.par){
      if(E.local()){
        w.appendChild(E.h("div","bps","Qui a levé la main en premier ?"));
        var g=E.h("div","bpgrid");
        G.units.forEach(function(u){
          if(m.bloque[u.id])return;
          g.appendChild(E.chip(u,function(){m.par=u.id;E.dessiner()}))});
        w.appendChild(g)}
      else w.appendChild(E.h("div","bps","Buzzez sur vos téléphones !"));
      w.appendChild(E.bouton("Passer la question","",function(){E.finQ()}))}
    else{
      var u=E.unit(m.par);
      w.appendChild(E.h("div","bps","A buzzé"));
      w.appendChild(E.chip(u));
      var rep=E.h("button","bpans","Afficher la réponse");
      rep.type="button";
      rep.onclick=function(){
         rep.textContent="Réponse : "+G.q.r;
         rep.disabled=true;
      };
      w.appendChild(rep);
      var b=E.h("div","bpbtns");
      b.appendChild(E.bouton("✓ Bonne réponse (+"+(BP_BUZZER_OK*mult)+")","sun",function(){
        E.pts(u,BP_BUZZER_OK*mult);E.finQ()}));
      b.appendChild(E.bouton("✗ Faux ("+(BP_BUZZER_RATE*mult)+")","",function(){
        E.pts(u,BP_BUZZER_RATE*mult);
        m.bloque[u.id]=1;m.par=null;
        if(G.units.every(function(x){return m.bloque[x.id]}))return E.finQ();
        envoyerEtat(G,E);E.dessiner()}));
      w.appendChild(b)}},

  recevoir:function(id,m,G,E,u){
    if(m.t!=="bz:buzz"||G.phase!=="q"||G.m.par||G.m.bloque[u.id])return;
    G.m.par=u.id;envoyerEtat(G,E);E.dessiner()},

  tel:function(w,T,X){
    var e=T.etat||{},bloque=(e.bloque||[]).indexOf(T.unite)>=0,par=e.par||"";
    w.appendChild(X.h("div","bpts",T.q.q));
    if(par===T.unite)
      w.appendChild(X.h("h2","bptt","À toi de répondre !"));
    else if(par)
      w.appendChild(X.h("h2","bptt",e.nom+" a buzzé"));
    else if(bloque)
      w.appendChild(X.h("h2","bptt","Raté ! Tu ne peux plus buzzer."));
    else{
      var b=X.h("button","bpbuzz","BZZZ");b.type="button";b.disabled=!!T.fait;
      b.onclick=function(){T.fait=true;X.envoyer({t:"bz:buzz"});X.redessiner()};
      w.appendChild(b)}}
});
})();
