/* ===== spity-bzzz-qcm.js : mode « Choix multiples » (en ligne uniquement, 100 % automatique) =====
   Question → BP_DUREE_QCM secondes (ou tout le monde a répondu) → classement temporaire
   pendant BP_DUREE_CLASSEMENT secondes → question suivante → … → classement final.
   Points : 1 par question réussie. S'il y a plusieurs bonnes réponses : (bonnes trouvées − mauvaises cochées) / nombre de bonnes, jamais sous 0.
   Question « ×2 » : tout est doublé. En équipes : moyenne des points des membres. */
(function(){
var LET="ABCDEF";

function finir(G,E){
  if(G.phase!=="q")return;
  var mult=G.bonus?2:1,nb=G.q.bonnes.length;
  G.m.score={};
  G.ps.forEach(function(p){
    var s=G.m.rep[p.id]||[],ok=0,ko=0;
    s.forEach(function(k){G.q.bonnes.indexOf(k)>=0?ok++:ko++});
    var pointsTemps = Math.max(0, (G.fin-Date.now()) / 1000); // 20 sec = 20 pts, descend de 1 par sec
    G.m.score[p.id] = Math.max(0, (ok-ko)/nb) * pointsTemps * mult;});
  G.units.forEach(function(u){
     var tot=0;
     u.membres.forEach(function(id){
        tot+=G.m.score[id]||0;
     });
     E.pts(u, tot / Math.max(1, u.membres.length));
  });
  E.finQ()}

BzzzPartie.mode("qcm",{
  type:"qcm",
  auto:true,

  debut:function(G,E){
    G.m={rep:{}};
    E.timer(BP_DUREE_QCM,function(){finir(G,E)});
    return{duree:BP_DUREE_QCM}},

  hote:function(w,G,E){
    w.appendChild(E.h("div","bpq",G.q.q));
    if(G.q.bonnes.length>1)w.appendChild(E.h("div","bps","Plusieurs bonnes réponses possibles"));
    var g=E.h("div","bpcg");
    G.q.choix.forEach(function(c,k){g.appendChild(E.h("div","bpc c"+(k%6),LET[k]+" · "+c))});
    w.appendChild(g);
    var pr=E.presents(),n=pr.filter(function(p){return G.m.rep[p.id]}).length;
    w.appendChild(E.h("div","bps",n+" / "+pr.length+" ont répondu"));
    w.appendChild(E.cd())},

  recevoir:function(id,m,G,E){
    if(m.t!=="bz:rep"||G.phase!=="q"||G.m.rep[id])return;
    var n=G.q.choix.length,
        c=(Array.isArray(m.c)?m.c:[]).map(Number).filter(function(k,i,a){return !isNaN(k)&&k>=0&&k<n&&a.indexOf(k)===i});
    if(!c.length)return;
    if(G.q.bonnes.length===1)c=[c[0]];
    G.m.rep[id]=c;
    if(E.presents().every(function(p){return G.m.rep[p.id]}))finir(G,E);else E.dessiner()},

  res:function(id,G){return{score:G.m.score[id]||0,rep:!!G.m.rep[id],max:G.bonus?2:1}},

  tel:function(w,T,X){
    var q=T.q,val;
    var cd=X.h("div","bptimer");w.appendChild(cd);X.compte(cd);
    if(T.fait){w.appendChild(X.h("div","bpts","Réponse envoyée ✓ On attend les autres…"));return}
    if(q.multi)w.appendChild(X.h("div","bpts","Plusieurs bonnes réponses : sélectionne-les, puis valide."));
    var g=X.h("div","bpcg");

    for(var k=0;k<q.nbChoix;k++){
      var b=X.h("button",
        "bpcb c"+(k%6)+(T.sel.indexOf(k)>=0?" on":""),
        ""
      );
      b.type="button";

      b.onclick=function(index,btn){
        return function(){
          if(!q.multi){
            X.envoyer({t:"bz:rep",c:[index]});
            T.fait=true;
            X.redessiner();
            return;
          }

          var i=T.sel.indexOf(index);
          if(i>=0)T.sel.splice(i,1);
          else T.sel.push(index);

          btn.classList.toggle("on",i<0);
          val.disabled=!T.sel.length;
        };
      }(k,b);

      g.appendChild(b);
    }

    w.appendChild(g);

    if(q.multi){
      val=X.bouton("Valider","sun",function(){
        if(!T.sel.length)return;
        X.envoyer({t:"bz:rep",c:T.sel.slice()});
        T.fait=true;
        X.redessiner();
      });

      val.disabled=!T.sel.length;
      w.appendChild(val);
    }
  }
});
})();
