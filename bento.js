/* Celya — bento shared JS (accueil + pages métiers, FR/NL/EN)
   GTM (GTM-KF9QCKB2) ne se charge QU'APRÈS le consentement (localStorage
   'celya-consent') — jamais d'iframe noscript. GA4 est configuré DANS GTM. */

(function(){
  var LANG=(document.documentElement.lang||'fr').slice(0,2);
  var BLOG=/\/blog\//.test(location.pathname); /* blog/ est un niveau sous la racine, comme nl/ et en/ */
  var PRE=(LANG==='nl'||LANG==='en'||BLOG)?'../':''; /* nl/, en/ et blog/ sont un niveau sous les assets */
  var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- année du footer ---- */
  document.querySelectorAll('.yr').forEach(function(e){e.textContent=new Date().getFullYear();});

  /* ---- menu mobile : burger + panneau, les liens métiers du menu déroulant y sont dépliés ---- */
  (function(){
    var nav=document.querySelector('.nav-links'),head=document.querySelector('.nav-in');
    if(!nav||!head)return;
    var btn=document.createElement('button');
    btn.className='burger';btn.type='button';
    btn.setAttribute('aria-label','Menu');btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<i></i><i></i>';
    head.appendChild(btn);
    var pan=document.createElement('nav');pan.className='mnav';
    var inner=document.createElement('div');inner.className='mnav-in';pan.appendChild(inner);
    [].slice.call(nav.children).forEach(function(el){
      if(el.classList&&el.classList.contains('nav-drop')){
        var lab=el.querySelector('a');
        var h=document.createElement('b');h.className='mnav-h';h.textContent=lab?lab.textContent.trim():'';
        inner.appendChild(h);
        var dp=el.querySelector('.drop-panel');
        if(dp){var g=document.createElement('div');g.className='mnav-grid';
          [].slice.call(dp.querySelectorAll('a')).forEach(function(a){g.appendChild(a.cloneNode(true));});
          inner.appendChild(g);}
      }else if(el.tagName==='A'){
        var c=el.cloneNode(true);c.className='mnav-l';inner.appendChild(c);
      }
    });
    document.body.appendChild(pan);
    function set(open){
      document.body.classList.toggle('mnav-open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
    }
    btn.addEventListener('click',function(){set(!document.body.classList.contains('mnav-open'));});
    pan.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('a'))set(false);});
    addEventListener('resize',function(){if(innerWidth>900)set(false);});
  })();

  /* ---- apparition au scroll (déterministe : jamais de tuile qui reste invisible) ---- */
  (function(){
    var els=[].slice.call(document.querySelectorAll('.reveal'));
    if(!els.length)return;
    if(REDUCE){els.forEach(function(el){el.classList.add('in');});return;}
    var pending=false;
    function check(){
      pending=false;
      var vh=window.innerHeight,batch=0;
      els=els.filter(function(el){
        var r=el.getBoundingClientRect();
        if(r.top<vh-40&&r.bottom>0||r.top<0){
          /* cascade : les tuiles d'un même lot apparaissent l'une après l'autre */
          var d=Math.min(batch*85,340);batch++;
          el.style.transitionDelay=d+'ms';el.classList.add('in');
          setTimeout(function(){el.style.transitionDelay='';el.classList.add('done');},d+1000);
          return false;
        }
        return true;
      });
      if(!els.length){removeEventListener('scroll',onS);removeEventListener('resize',onS);}
    }
    function onS(){if(!pending){pending=true;setTimeout(check,60);}}
    addEventListener('scroll',onS,{passive:true});
    addEventListener('resize',onS);
    check();
  })();

  /* ---- fond aurore : canvas basse résolution, ~15 img/s, pause hors onglet ---- */
  (function(){
    var c=document.createElement('canvas');c.id='aurora';c.setAttribute('aria-hidden','true');
    document.body.prepend(c);
    var x=c.getContext('2d');if(!x)return;
    var W,H,running=!document.hidden,last=0;
    var SCALE=.14; /* le blur CSS lisse le rendu — inutile de dessiner en pleine résolution */
    function size(){W=Math.max(2,Math.round(innerWidth*SCALE));H=Math.max(2,Math.round(innerHeight*SCALE));c.width=W;c.height=H;}
    /* cycle principal ~25 s (w1) + harmonique ~9 s (w2) : les nappes se recomposent sans jamais s'arrêter */
    var W1=2*Math.PI/25000, W2=2*Math.PI/9000;
    var blobs=[
      {c:'34,211,238', r:.62,ax:.26,ay:.18,sx:.20,sy:.24,s2:.07,ph:0,  ph2:1.3,pr:2.2},
      {c:'79,123,255', r:.70,ax:.76,ay:.30,sx:.23,sy:.19,s2:.08,ph:2.1,ph2:4.0,pr:0.7},
      {c:'168,85,247', r:.60,ax:.44,ay:.88,sx:.21,sy:.22,s2:.06,ph:4.2,ph2:2.2,pr:3.9},
      {c:'79,123,255', r:.48,ax:.08,ay:.62,sx:.17,sy:.20,s2:.07,ph:5.4,ph2:0.5,pr:5.1},
      {c:'34,211,238', r:.44,ax:.92,ay:.78,sx:.15,sy:.17,s2:.06,ph:1.1,ph2:3.1,pr:1.6}
    ];
    function draw(t){
      x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
      for(var i=0;i<blobs.length;i++){var b=blobs[i];
        var bx=(b.ax+Math.sin(t*W1+b.ph)*b.sx+Math.sin(t*W2+b.ph2)*b.s2)*W;
        var by=(b.ay+Math.cos(t*W1*.8+b.ph)*b.sy+Math.cos(t*W2+b.ph2)*b.s2)*H;
        var r=b.r*(1+.14*Math.sin(t*W2*.6+b.pr))*Math.max(W,H);
        var g=x.createRadialGradient(bx,by,0,bx,by,r);
        g.addColorStop(0,'rgba('+b.c+',.55)');g.addColorStop(1,'rgba('+b.c+',0)');
        x.fillStyle=g;x.beginPath();x.arc(bx,by,r,0,6.3);x.fill();}
      x.globalCompositeOperation='source-over';
    }
    function loop(now){if(!running)return;if(now-last>33){last=now;draw(now);}requestAnimationFrame(loop);}
    size();draw(0);
    addEventListener('resize',function(){size();draw(last);});
    if(!REDUCE){
      requestAnimationFrame(loop);
      document.addEventListener('visibilitychange',function(){var was=running;running=!document.hidden;if(running&&!was)requestAnimationFrame(loop);});
    }
  })();

  /* ---- appel en direct : sonnerie → décroché → minuteur + conversation → fiche remplie → boucle ---- */
  document.querySelectorAll('.phone[data-demo]').forEach(function(ph){
    var chat=ph.querySelector('.chat');if(!chat)return;
    var inc=ph.querySelector('.ph-incoming');
    var card=ph.querySelector('.ph-card');
    var tile=ph.closest('.t-demo')||ph;
    var wave=tile.querySelector('.wave');
    var clock=tile.querySelector('.timer');
    var items=[].slice.call(chat.children);
    var rows=card?[].slice.call(card.querySelectorAll('.pcrow')):[];
    if(REDUCE||!('IntersectionObserver' in window)||!items.length){
      if(inc)inc.remove();
      return; /* tout est visible statiquement, fiche comprise */
    }
    chat.classList.add('anim');
    if(card)card.classList.add('anim');
    var idx=0,timer=null,started=false,typing=null,sec=0,tick=null;
    function fmt(n){return ('0'+Math.floor(n/60)).slice(-2)+':'+('0'+n%60).slice(-2);}
    function startClock(){sec=0;if(clock)clock.textContent='00:00';
      tick=setInterval(function(){sec++;if(clock)clock.textContent=fmt(sec);},1000);}
    function stopClock(){clearInterval(tick);}
    function setWave(on){if(wave)wave.classList.toggle('on',!!on);}
    function clearTyping(){if(typing){typing.remove();typing=null;}}
    function showIncoming(){if(inc){inc.classList.add('onstage');chat.style.visibility='hidden';}}
    function hideIncoming(){if(inc){inc.classList.remove('onstage');chat.style.visibility='';}}
    function hideCard(){if(card){card.classList.remove('onstage');rows.forEach(function(r){r.classList.remove('on');});}}
    function reset(){clearTimeout(timer);clearTyping();stopClock();setWave(false);hideCard();
      items.forEach(function(m){m.classList.remove('on');m._typed=false;});idx=0;}
    function fillCard(i){
      if(i<rows.length){rows[i].classList.add('on');timer=setTimeout(function(){fillCard(i+1);},430);}
      else{timer=setTimeout(function(){ /* fin de cycle : nouvel appel */
        reset();showIncoming();
        timer=setTimeout(function(){hideIncoming();startClock();step();},2100);
      },3400);}
    }
    function step(){
      if(idx<items.length){
        var el=items[idx],isJ=el.classList.contains('j');
        if(isJ&&!el._typed){ /* points de frappe avant chaque réplique de Janet */
          el._typed=true;
          typing=document.createElement('div');typing.className='typing';
          typing.innerHTML='<i></i><i></i><i></i>';
          chat.insertBefore(typing,el);setWave(true);
          timer=setTimeout(step,700);return;
        }
        clearTyping();el.classList.add('on');setWave(isJ);idx++;
        timer=setTimeout(step,1450);
      }else{ /* appel terminé : la fiche se remplit */
        setWave(false);stopClock();
        if(card){card.classList.add('onstage');timer=setTimeout(function(){fillCard(0);},350);}
        else{timer=setTimeout(function(){reset();showIncoming();
          timer=setTimeout(function(){hideIncoming();startClock();step();},2100);},3400);}
      }
    }
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!started){started=true;showIncoming();
        timer=setTimeout(function(){hideIncoming();startClock();step();},1600);}
      else if(!e.isIntersecting&&started){reset();hideIncoming();started=false;}
    });},{threshold:.3});
    io2.observe(tile);
  });

  /* ---- simulateur : ce que coûtent les appels manqués ---- */
  (function(){
    var roi=document.querySelector('.t-roi');if(!roi)return;
    var miss=roi.querySelector('#roi-miss'),missOut=roi.querySelector('#roi-miss-n'),
        out=roi.querySelector('#roi-num'),pills=roi.querySelectorAll('.pills button');
    if(!miss||!out)return;
    var FMT={
      fr:function(n){return n.toLocaleString('fr-BE')+' €';},
      nl:function(n){return '€ '+n.toLocaleString('nl-BE');},
      en:function(n){return '€'+n.toLocaleString('en-GB');}
    };var fmt=FMT[LANG]||FMT.fr;
    var val=300,cur=0,anim=null;
    /* ~30 % des appelants non répondus achètent ailleurs ; 4,33 semaines par mois */
    function target(){return Math.round(miss.value*4.33*0.30*val);}
    function render(n){out.textContent=fmt(n);}
    function update(){
      if(missOut)missOut.textContent=miss.value;
      var to=target();
      if(REDUCE){cur=to;render(to);return;}
      out.classList.remove('pop');void out.offsetWidth;out.classList.add('pop');
      if(anim)cancelAnimationFrame(anim);
      var from=cur,t0=null;
      function tick(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/500),e=1-Math.pow(1-p,3);
        cur=Math.round(from+(to-from)*e);render(cur);if(p<1)anim=requestAnimationFrame(tick);}
      anim=requestAnimationFrame(tick);
    }
    pills.forEach(function(b){b.addEventListener('click',function(){
      pills.forEach(function(x){x.classList.remove('on');});b.classList.add('on');
      val=+b.getAttribute('data-v')||300;update();
    });});
    miss.addEventListener('input',update);
    cur=target();render(cur);if(missOut)missOut.textContent=miss.value;
  })();

  /* ---- schéma : l'étape active s'allume en boucle ---- */
  (function(){
    var wrap=document.querySelector('#marche .steps');if(!wrap||REDUCE||!('IntersectionObserver' in window))return;
    var steps=[].slice.call(wrap.querySelectorAll('.step'));if(!steps.length)return;
    var i=-1,timer=null;
    var io3=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!timer){timer=setInterval(function(){i=(i+1)%steps.length;
        steps.forEach(function(s,k){s.classList.toggle('cur',k===i);});},1900);}
      else if(!e.isIntersecting&&timer){clearInterval(timer);timer=null;i=-1;
        steps.forEach(function(s){s.classList.remove('cur');});}
    });},{threshold:.3});
    io3.observe(wrap);
  })();

  /* ---- entonnoir de tri (page garages) : chaque branche s'illumine à tour de rôle ---- */
  (function(){
    var fn=document.querySelector('.funnel');if(!fn)return;
    var cards=[].slice.call(fn.querySelectorAll('.fcard'));
    var paths=[].slice.call(fn.querySelectorAll('.fun-fork path'));
    if(!cards.length)return;
    if(REDUCE||!('IntersectionObserver' in window)){fn.classList.add('static');return;}
    var i=-1,t=null,vis=false;
    function clear(){cards.forEach(function(c){c.classList.remove('on');});
      paths.forEach(function(p){p.classList.remove('on');});}
    function step(){
      i=(i+1)%cards.length;
      cards.forEach(function(c,k){c.classList.toggle('on',k===i);});
      paths.forEach(function(p,k){p.classList.toggle('on',k===i);});
      /* l'urgence — la dernière branche — reste allumée un peu plus longtemps */
      t=setTimeout(step,i===cards.length-1?4600:3400);
    }
    var iof=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;t=setTimeout(step,700);}
      else if(!e.isIntersecting&&vis){vis=false;clearTimeout(t);i=-1;clear();}
    });},{threshold:.3});
    iof.observe(fn);
  })();

  /* ---- article de blog : le sommaire suit la lecture ---- */
  (function(){
    var toc=document.querySelector('.art-side .toc');if(!toc)return;
    var links=[].slice.call(toc.querySelectorAll('a'));
    var heads=links.map(function(a){var id=(a.getAttribute('href')||'').slice(1);
      return document.getElementById(id);});
    if(!links.length)return;
    var cur=-1,queued=false;
    function pick(){
      queued=false;
      var sel=0;
      for(var k=0;k<heads.length;k++){
        if(heads[k]&&heads[k].getBoundingClientRect().top<=120)sel=k;
      }
      if(sel!==cur){cur=sel;links.forEach(function(a,k){a.classList.toggle('on',k===sel);});}
    }
    addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(pick);}},{passive:true});
    pick();
  })();

  /* ---- consentement cookies + Google Tag Manager (inchangé : chargé après accord) ---- */
  (function(){
    var GTM_ID='GTM-KF9QCKB2',KEY='celya-consent';
    function grant(){if(window.gtag)gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}
    function loadGTM(){
      if(!GTM_ID||window._celyaGTM)return;window._celyaGTM=true; /* une seule fois, après consentement */
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',GTM_ID);
    }
    var T={
      fr:{msg:'Nous utilisons des cookies pour mesurer l’audience (Google Analytics). À vous de choisir.',ok:'Accepter',no:'Refuser',more:'En savoir plus'},
      nl:{msg:'We gebruiken cookies om bezoekers te meten (Google Analytics). U beslist.',ok:'Accepteren',no:'Weigeren',more:'Meer info'},
      en:{msg:'We use cookies to measure visits (Google Analytics). You choose.',ok:'Accept',no:'Decline',more:'More info'}
    };var t=T[LANG]||T.fr;
    var saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
    if(saved==='granted'){grant();loadGTM();return;}
    if(saved==='denied')return;
    function build(){
      var b=document.createElement('div');b.className='cbanner';
      b.innerHTML='<span class="cmsg">'+t.msg+' <a href="'+(BLOG?'../':'')+'cookies.html">'+t.more+'</a></span>'+
        '<span class="cbtns"><button class="cdecline">'+t.no+'</button><button class="caccept">'+t.ok+'</button></span>';
      document.body.appendChild(b);
      b.querySelector('.caccept').addEventListener('click',function(){try{localStorage.setItem(KEY,'granted');}catch(e){}grant();loadGTM();b.remove();});
      b.querySelector('.cdecline').addEventListener('click',function(){try{localStorage.setItem(KEY,'denied');}catch(e){}b.remove();});
    }
    if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
  })();

  /* ---- spotlight : la lueur des tuiles suit le curseur ---- */
  if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches){
    (function(){
      var tile=null,px=0,py=0,queued=false;
      document.addEventListener('mousemove',function(e){
        tile=e.target&&e.target.closest?e.target.closest('.tile'):null;
        px=e.clientX;py=e.clientY;
        if(!queued){queued=true;requestAnimationFrame(function(){
          queued=false;
          if(tile){var r=tile.getBoundingClientRect();
            tile.style.setProperty('--mx',(px-r.left).toFixed(0)+'px');
            tile.style.setProperty('--my',(py-r.top).toFixed(0)+'px');}
        });}
      },{passive:true});
    })();

    /* ---- boutons magnétiques : attirance légère + retour élastique ---- */
    if(!REDUCE)(function(){
      var mags=[].slice.call(document.querySelectorAll('.btn-grad'));
      if(!mags.length)return;
      var mx=0,my=0,queued=false;
      function tick(){
        queued=false;
        for(var i=0;i<mags.length;i++){var b=mags[i];
          var r=b.getBoundingClientRect();if(!r.width)continue;
          var dx=mx-(r.left+r.width/2),dy=my-(r.top+r.height/2);
          var reach=Math.max(r.width*.75,80)+44,d=Math.hypot(dx,dy);
          if(d<reach){
            var f=1-d/reach;
            var tx=Math.max(-10,Math.min(10,dx*f*.18)),ty=Math.max(-8,Math.min(8,dy*f*.18));
            b.style.transition='transform .16s ease-out';
            b.style.transform='translate('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px)';
            b._mag=true;
          }else if(b._mag){
            b._mag=false;
            b.style.transition='transform .6s cubic-bezier(.2,1.9,.35,1)'; /* retour à ressort */
            b.style.transform='';
          }
        }
      }
      document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;
        if(!queued){queued=true;requestAnimationFrame(tick);}},{passive:true});
    })();
  }

  /* ---- parallaxe subtile : les tuiles dérivent à des vitesses différentes ---- */
  if(!REDUCE&&innerWidth>900)(function(){
    var F=[0,.022,-.018,.028,0,-.024,.02];
    var tiles=[].slice.call(document.querySelectorAll('.tile')).map(function(el,i){
      return {el:el,f:F[i%F.length]};
    }).filter(function(t){return t.f;});
    if(!tiles.length)return;
    var queued=false;
    function tick(){
      queued=false;
      var vc=innerHeight/2;
      for(var i=0;i<tiles.length;i++){var t=tiles[i];
        var r=t.el.getBoundingClientRect();
        if(r.bottom<-120||r.top>innerHeight+120)continue; /* hors écran : on ne touche pas */
        var off=(r.top+r.height/2-vc)*t.f;
        off=Math.max(-16,Math.min(16,off));
        t.el.style.setProperty('--py',off.toFixed(1)+'px');
      }
    }
    addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(tick);}},{passive:true});
    addEventListener('resize',function(){if(!queued){queued=true;requestAnimationFrame(tick);}});
    tick();
  })();

  /* ---- tableau de planning : onglets métiers, réservations en boucle, ligne « maintenant » ---- */
  (function(){
    var agf=document.querySelector('.agf');if(!agf)return;
    var tabs=[].slice.call(agf.querySelectorAll('.agf-tabs button'));
    var boards=[].slice.call(agf.querySelectorAll('.agf-board'));
    if(!boards.length)return;
    var states=boards.map(function(b){
      var cs=[];try{cs=JSON.parse(b.getAttribute('data-states')||'[]');}catch(e){}
      return {el:b,ups:[].slice.call(b.querySelectorAll('.blk.up')),
              freez:[].slice.call(b.querySelectorAll('.freez')),
              cnt:b.querySelector('.agf-cnt b'),cs:cs,
              tag:b.querySelector('.ag-tag'),now:b.querySelector('.agf-now'),
              ov:b.querySelector('.agf-ov'),idx:0,nowY:0,timer:null};
    });
    var cur=0,visible=false;
    function setCnt(s,i){if(!s.cnt||!s.cs.length)return;
      s.cnt.innerHTML=s.cs[Math.min(i,s.cs.length-1)];
      s.cnt.classList.remove('pop');void s.cnt.offsetWidth;s.cnt.classList.add('pop');}
    function resetBoard(s){clearTimeout(s.timer);s.idx=0;
      s.ups.forEach(function(u){u.classList.remove('on');});
      s.freez.forEach(function(f){f.classList.remove('off');});
      if(s.tag)s.tag.classList.remove('on');
      if(s.cnt&&s.cs.length)s.cnt.innerHTML=s.cs[0];}
    function loop(s){
      if(!visible||states[cur]!==s)return;
      if(s.now&&s.ov){ /* la ligne « maintenant » descend lentement */
        s.nowY+=s.ov.offsetHeight/14;
        if(s.nowY>s.ov.offsetHeight-6)s.nowY=2;
        s.now.style.transform='translateY('+s.nowY.toFixed(0)+'px)';
      }
      if(s.idx>=s.ups.length){ /* journée pleine : on repart de zéro */
        s.timer=setTimeout(function(){resetBoard(s);
          s.timer=setTimeout(function(){loop(s);},1500);},3800);
        return;
      }
      var u=s.ups[s.idx],f=s.freez[s.idx];
      u.classList.add('on');if(f)f.classList.add('off');
      if(s.tag&&s.ov){
        s.tag.textContent=u.getAttribute('data-label')||'';
        var ur=u.getBoundingClientRect(),gr=s.ov.getBoundingClientRect();
        var top=ur.top-gr.top-10;
        s.tag.style.top=Math.max(0,Math.min(gr.height-30,top))+'px';
        s.tag.classList.add('on');
        (function(t){setTimeout(function(){t.classList.remove('on');},2700);})(s.tag);
      }
      s.idx++;setCnt(s,s.idx);
      s.timer=setTimeout(function(){loop(s);},5000);
    }
    function staticShow(s){s.ups.forEach(function(u){u.classList.add('on');});
      s.freez.forEach(function(f){f.classList.add('off');});
      if(s.cnt&&s.cs.length)s.cnt.innerHTML=s.cs[s.cs.length-1];}
    function activate(i){
      resetBoard(states[cur]);
      boards[cur].classList.remove('on');tabs[cur].classList.remove('on');
      cur=i;boards[i].classList.add('on');tabs[i].classList.add('on');
      if(REDUCE){staticShow(states[i]);}
      else if(visible){states[i].timer=setTimeout(function(){loop(states[i]);},1500);}
    }
    tabs.forEach(function(t,i){t.addEventListener('click',function(){if(i!==cur)activate(i);});});
    if(REDUCE){staticShow(states[0]);return;}
    var ioG=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!visible){visible=true;
        states[cur].timer=setTimeout(function(){loop(states[cur]);},1300);}
      else if(!e.isIntersecting&&visible){visible=false;clearTimeout(states[cur].timer);}
    });},{threshold:.2});
    ioG.observe(agf);
  })();

  /* ---- bande des langues : le grand mot tourne, le nuage s'éclaire ---- */
  (function(){
    var band=document.querySelector('.lang-free');if(!band)return;
    var bw=band.querySelector('.bigword');if(!bw)return;
    var words=[];try{words=JSON.parse(bw.getAttribute('data-words')||'[]');}catch(e){}
    var cloud=[].slice.call(band.querySelectorAll('.langcloud span'));
    if(REDUCE||words.length<2||!('IntersectionObserver' in window))return;
    var i=0,wt=null,ct=null,cur=bw.querySelector('span');
    function next(){
      i=(i+1)%words.length;
      var nx=document.createElement('span');
      nx.className='gradtxt inq';nx.dir='auto';nx.textContent=words[i];
      bw.appendChild(nx);void nx.offsetWidth;
      cur.classList.add('out');nx.classList.remove('inq');
      var old=cur;cur=nx;
      setTimeout(function(){if(old.parentNode)old.remove();},750);
    }
    function light(){
      var sp=cloud[Math.floor(Math.random()*cloud.length)];
      if(!sp||sp.classList.contains('lit'))return;
      sp.classList.add('lit');
      setTimeout(function(){sp.classList.remove('lit');},1500);
    }
    var iol=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){if(!wt){wt=setInterval(next,2100);ct=setInterval(light,700);}}
      else if(wt){clearInterval(wt);clearInterval(ct);wt=ct=null;}
    });},{threshold:.3});
    iol.observe(band);
  })();

  /* ---- fil de progression de lecture ---- */
  (function(){
    var bar=document.createElement('div');bar.id='sprog';document.body.appendChild(bar);
    function up(){
      var max=document.documentElement.scrollHeight-innerHeight;
      bar.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';
    }
    addEventListener('scroll',up,{passive:true});addEventListener('resize',up);up();
  })();

  /* ---- duel serveur vocal / Celya (page cabinets) : deux chronos qui partent ensemble ----
     Sans JS ou en mouvement réduit, le HTML/CSS affiche l'état final figé. */
  (function(){
    var duel=document.querySelector('[data-duel]');if(!duel)return;
    var tL=duel.querySelector('[data-dt-l]'),tR=duel.querySelector('[data-dt-r]');
    var ivr=duel.querySelector('.dcol-ivr');
    if(REDUCE||!('IntersectionObserver' in window))return;
    duel.classList.add('anim');
    var evs=[];
    function reg(sel,ts){[].slice.call(duel.querySelectorAll(sel)).forEach(function(el,i){
      if(ts[i]!=null)evs.push({t:ts[i],el:el});});}
    reg('.dcol-ivr .dstep',[300,1600,2900,7200,12400]);
    reg('.dcol-ivr .dfail',[14600]);
    reg('.dcol-cel .dm',[500,1500,2500,3300]);
    reg('.dcol-cel .ddone',[3900]);
    reg('.dcol-cel .dcard',[4700]);
    /* chronos accélérés : 02:30 affichés côté serveur vocal quand l'appel est
       abandonné (14,6 s réelles), 00:38 côté Celya quand le rendez-vous est posé */
    var CYCLE=15000,HOLD=2200,raf=null,t0=null,run=false;
    function fmt(s){return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+(s%60)).slice(-2);}
    function reset(){
      evs.forEach(function(e){e.el.classList.remove('on');});
      ivr.classList.remove('lost');
      if(tL)tL.textContent='00:00';if(tR)tR.textContent='00:00';
      t0=null;
    }
    function frame(now){
      if(!run)return;
      if(t0===null)t0=now;
      var t=now-t0;
      if(t>=CYCLE+HOLD){reset();t0=now;t=0;}
      if(tL)tL.textContent=fmt(Math.min(Math.floor(t*0.010274),150));
      if(tR)tR.textContent=fmt(Math.min(Math.floor(t*0.009744),38));
      for(var i=0;i<evs.length;i++){var e=evs[i];
        if(t>=e.t&&!e.el.classList.contains('on')){
          e.el.classList.add('on');
          if(e.el.classList.contains('dfail'))ivr.classList.add('lost');
        }
      }
      raf=requestAnimationFrame(frame);
    }
    var iod=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!run){run=true;reset();raf=requestAnimationFrame(frame);}
      else if(!e.isIntersecting&&run){run=false;cancelAnimationFrame(raf);reset();}
    });},{threshold:.25});
    iod.observe(duel);
  })();

  /* ---- tri des appels (page cabinets) : points lumineux, pause hors écran ---- */
  (function(){
    var tf=document.querySelector('[data-triflow]');if(!tf)return;
    var zone=tf.querySelector('.tf-zone');
    /* les points suivent les branches : décalage horizontal recalculé sur la largeur réelle */
    function size(){if(zone)tf.style.setProperty('--bx',Math.round(zone.offsetWidth*0.267)+'px');}
    size();addEventListener('resize',size);
    if(REDUCE||!('IntersectionObserver' in window))return;
    var iot=new IntersectionObserver(function(es){es.forEach(function(e){
      tf.classList.toggle('run',e.isIntersecting);});},{threshold:.25});
    iot.observe(tf);
  })();

  /* ---- fiche mémoire patient (page cabinets) : la fiche se remplit, en boucle ---- */
  (function(){
    var mc=document.querySelector('[data-mem]');if(!mc)return;
    var rows=[].slice.call(mc.querySelectorAll('.mem-row'));if(!rows.length)return;
    if(REDUCE||!('IntersectionObserver' in window))return;
    mc.classList.add('anim');
    var D=[950,750,700,700,950,0]; /* attente APRÈS chaque ligne affichée */
    var idx=0,timer=null,vis=false;
    function clear(){clearTimeout(timer);rows.forEach(function(r){r.classList.remove('on');});idx=0;}
    function step(){
      if(idx<rows.length){
        rows[idx].classList.add('on');
        var d=D[idx]||800;idx++;
        timer=setTimeout(step,d);
      }else{
        timer=setTimeout(function(){clear();timer=setTimeout(step,700);},3600);
      }
    }
    var iom=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;timer=setTimeout(step,500);}
      else if(!e.isIntersecting&&vis){vis=false;clear();}
    });},{threshold:.3});
    iom.observe(mc);
  })();

  /* ---- installation (page cabinets) : la ligne des étapes se dessine au scroll ---- */
  (function(){
    var st=document.querySelector('.setup');if(!st)return;
    var line=st.querySelector('.set-line i');
    var steps=[].slice.call(st.querySelectorAll('.sstep'));
    if(REDUCE||!line)return;
    st.classList.add('anim');
    var queued=false;
    function up(){
      queued=false;
      var r=st.getBoundingClientRect();
      var p=(innerHeight*.82-r.top)/r.height;p=Math.max(0,Math.min(1,p));
      line.style.transform='scaleY('+p.toFixed(4)+')';
      var reach=r.top+10+p*(r.height-20);
      for(var i=0;i<steps.length;i++){
        steps[i].classList.toggle('lit',steps[i].getBoundingClientRect().top+16<=reach);
      }
    }
    addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(up);}},{passive:true});
    addEventListener('resize',function(){if(!queued){queued=true;requestAnimationFrame(up);}});
    up();
  })();

  /* ---- journée avec/sans (page indépendants) : la même frise, deux fins ----
     Sans JS ou en mouvement réduit, les deux versions affichent leur état final. */
  (function(){
    var day=document.querySelector('[data-day]');if(!day)return;
    if(REDUCE||!('IntersectionObserver' in window))return;
    var rows=[
      {el:day.querySelector('.day-sans'),miss:true},
      {el:day.querySelector('.day-avec'),miss:false}
    ];
    if(!rows[0].el||!rows[1].el)return;
    rows.forEach(function(r){
      r.blks=[].slice.call(r.el.querySelectorAll('.day-blk'));
      r.calls=[].slice.call(r.el.querySelectorAll('.day-call'));
      r.outs=[].slice.call(r.el.querySelectorAll(r.miss?'.dp-chip':'.dg'));
      r.fail=r.el.querySelector('.day-fail');
      r.score=r.el.querySelector('.day-score');
      r.score0=r.score?r.score.textContent:'';
    });
    day.classList.add('anim');
    var timers=[],vis=false;
    function later(fn,d){timers.push(setTimeout(fn,d));}
    function clearAll(){timers.forEach(clearTimeout);timers=[];}
    function resetRow(r){
      r.el.classList.remove('cur','lost');
      r.blks.concat(r.calls,r.outs).forEach(function(e){e.classList.remove('on');});
      r.calls.forEach(function(c){c.classList.remove('gone','done');});
      if(r.fail)r.fail.classList.remove('on');
      /* le compteur reste vide tant que sa version n'a pas joué */
      if(r.score)r.score.textContent='';
    }
    function reset(){clearAll();rows.forEach(resetRow);}
    /* une version : blocs posés de gauche à droite, appels qui tombent à
       intervalles irréguliers, puis le sort de chaque appel */
    function play(r,next){
      resetRow(r);r.el.classList.add('cur');
      var t=200;
      r.blks.forEach(function(b){later(function(){b.classList.add('on');},t);t+=380;});
      t+=200;
      var gaps=[0,1150,700,1500],n=0;
      r.calls.forEach(function(c,i){
        t+=gaps[i]||900;
        later(function(){c.classList.add('on');},t);
        later(function(){
          c.classList.add(r.miss?'gone':'done');
          if(r.outs[i])r.outs[i].classList.add('on');
          n++;
          if(r.score)r.score.textContent=r.miss
            ?(n+(n>1?' appels manqués':' appel manqué'))
            :(n+(n>1?' appels traités':' appel traité'));
        },t+620);
      });
      t+=1300;
      if(r.miss)later(function(){
        r.el.classList.add('lost');
        if(r.fail)r.fail.classList.add('on');
        if(r.score)r.score.textContent='0 rappel passé';
      },t);
      /* 2 s de pause entre les deux versions */
      later(function(){r.el.classList.remove('cur');next();},t+2300);
    }
    function cycle(){
      if(!vis)return;
      play(rows[0],function(){
        if(!vis)return;
        later(function(){play(rows[1],function(){
          later(function(){reset();later(cycle,600);},1200);
        });},350);
      });
    }
    var iod=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;reset();later(cycle,450);}
      else if(!e.isIntersecting&&vis){vis=false;reset();}
    });},{threshold:.25});
    iod.observe(day);
  })();

  /* ---- extension du numéro (page indépendants) : points lumineux, pause hors écran ---- */
  (function(){
    var ns=document.querySelector('[data-split]');if(!ns)return;
    var zone=ns.querySelector('.ns-zone');
    function size(){if(zone)ns.style.setProperty('--bx',Math.round(zone.offsetWidth*0.267)+'px');}
    size();addEventListener('resize',size);
    if(REDUCE||!('IntersectionObserver' in window))return;
    var ion=new IntersectionObserver(function(es){es.forEach(function(e){
      ns.classList.toggle('run',e.isIntersecting);});},{threshold:.25});
    ion.observe(ns);
  })();

  /* ---- tableau de bord du soir (page indépendants) : les lignes se classent une à une ---- */
  (function(){
    var dash=document.querySelector('[data-dash]');if(!dash)return;
    if(REDUCE||!('IntersectionObserver' in window))return;
    var rows=[].slice.call(dash.querySelectorAll('.drow'));
    var pop=dash.querySelector('.dash-pop');
    if(rows.length<3)return;
    dash.classList.add('anim');
    /* ordre : ligne 1 → ligne 2 → badge + historique → ligne 3 */
    var steps=[
      {el:rows[0],d:900},
      {el:rows[1],d:650},
      {el:pop,d:1250,lit:rows[1]},
      {el:rows[2],d:1100}
    ];
    var idx=0,timer=null,vis=false;
    function clear(){clearTimeout(timer);idx=0;
      rows.forEach(function(r){r.classList.remove('on','lit');});
      if(pop)pop.classList.remove('on');}
    function step(){
      if(idx<steps.length){
        var s=steps[idx];
        if(s.el)s.el.classList.add('on');
        if(s.lit)s.lit.classList.add('lit');
        idx++;timer=setTimeout(step,s.d);
      }else{
        timer=setTimeout(function(){clear();timer=setTimeout(step,650);},3900);
      }
    }
    var iob=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;timer=setTimeout(step,500);}
      else if(!e.isIntersecting&&vis){vis=false;clear();}
    });},{threshold:.3});
    iob.observe(dash);
  })();

  /* ---- congés (page indépendants) : l'interrupteur ferme les jours, en boucle ----
     L'état par défaut du HTML est « fermé » (.on) : c'est l'état final figé. */
  (function(){
    var aw=document.querySelector('[data-away]');if(!aw)return;
    if(REDUCE||!('IntersectionObserver' in window))return;
    var timer=null,vis=false;
    function clear(){clearTimeout(timer);aw.classList.add('on');}
    function cycle(open){
      /* open=true : tout est disponible ; puis l'interrupteur bascule */
      aw.classList.toggle('on',!open);
      timer=setTimeout(function(){cycle(!open);},open?1700:3400);
    }
    var ioa=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;timer=setTimeout(function(){cycle(true);},900);}
      else if(!e.isIntersecting&&vis){vis=false;clear();}
    });},{threshold:.35});
    ioa.observe(aw);
  })();

  /* ---- barre d'appel mobile (toujours accessible) ---- */
  (function(){
    var T={
      fr:{b:'Janet décroche maintenant',s:'Disponible · c’est une IA',btn:'Appeler'},
      nl:{b:'Janet neemt nu op',s:'Beschikbaar · het is een AI',btn:'Bellen'},
      en:{b:'Janet picks up now',s:'Available · it’s an AI',btn:'Call'}
    };var t=T[LANG]||T.fr;
    var bar=document.createElement('div');bar.className='callbar';
    bar.innerHTML='<img src="'+PRE+'assets/janet-avatar-128.webp" alt="Janet" width="38" height="38">'+
      '<div class="t"><b>'+t.b+'</b><span>'+t.s+'</span></div>'+
      '<a class="btn btn-grad" href="tel:+32460254413">'+t.btn+'</a>';
    document.body.appendChild(bar);
    function onScroll(){if(scrollY>300)bar.classList.add('show');else bar.classList.remove('show');}
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  })();

})();
