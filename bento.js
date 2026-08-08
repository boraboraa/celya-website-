/* Celya — bento shared JS (accueil + pages métiers, FR/NL/EN)
   GTM (GTM-KF9QCKB2) ne se charge QU'APRÈS le consentement (localStorage
   'celya-consent') — jamais d'iframe noscript. GA4 est configuré DANS GTM. */

(function(){
  var LANG=(document.documentElement.lang||'fr').slice(0,2);
  var PRE=(LANG==='nl'||LANG==='en')?'../':''; /* nl/ et en/ sont un niveau sous les assets */
  var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- année du footer ---- */
  document.querySelectorAll('.yr').forEach(function(e){e.textContent=new Date().getFullYear();});

  /* ---- apparition au scroll ---- */
  if('IntersectionObserver' in window&&!REDUCE){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  }else{
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
  }

  /* ---- fond aurore : canvas basse résolution, ~15 img/s, pause hors onglet ---- */
  (function(){
    var c=document.createElement('canvas');c.id='aurora';c.setAttribute('aria-hidden','true');
    document.body.prepend(c);
    var x=c.getContext('2d');if(!x)return;
    var W,H,running=!document.hidden,last=0;
    var SCALE=.14; /* le blur CSS lisse le rendu — inutile de dessiner en pleine résolution */
    function size(){W=Math.max(2,Math.round(innerWidth*SCALE));H=Math.max(2,Math.round(innerHeight*SCALE));c.width=W;c.height=H;}
    var blobs=[
      {c:'34,211,238',r:.62,ax:.28,ay:.20,sx:.13,sy:.17,ph:0},
      {c:'79,123,255',r:.68,ax:.74,ay:.30,sx:.16,sy:.12,ph:2.1},
      {c:'168,85,247',r:.60,ax:.45,ay:.86,sx:.14,sy:.15,ph:4.2}
    ];
    function draw(t){
      x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
      for(var i=0;i<blobs.length;i++){var b=blobs[i];
        var bx=(b.ax+Math.sin(t*.00006+b.ph)*b.sx)*W;
        var by=(b.ay+Math.cos(t*.00005+b.ph)*b.sy)*H;
        var r=b.r*Math.max(W,H);
        var g=x.createRadialGradient(bx,by,0,bx,by,r);
        g.addColorStop(0,'rgba('+b.c+',.55)');g.addColorStop(1,'rgba('+b.c+',0)');
        x.fillStyle=g;x.beginPath();x.arc(bx,by,r,0,6.3);x.fill();}
      x.globalCompositeOperation='source-over';
    }
    function loop(now){if(!running)return;if(now-last>66){last=now;draw(now);}requestAnimationFrame(loop);}
    size();draw(0);
    addEventListener('resize',function(){size();draw(last);});
    if(!REDUCE){
      requestAnimationFrame(loop);
      document.addEventListener('visibilitychange',function(){var was=running;running=!document.hidden;if(running&&!was)requestAnimationFrame(loop);});
    }
  })();

  /* ---- démo d'appel : les messages apparaissent un à un, en boucle ---- */
  document.querySelectorAll('.chat[data-anim]').forEach(function(ch){
    var items=[].slice.call(ch.children);
    if(REDUCE||!('IntersectionObserver' in window)||!items.length)return;
    ch.classList.add('anim');
    var idx=0,timer=null,started=false;
    function step(){
      if(idx<items.length){items[idx].classList.add('on');idx++;timer=setTimeout(step,idx===items.length?4200:1500);}
      else{items.forEach(function(m){m.classList.remove('on');});idx=0;timer=setTimeout(step,900);}
    }
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!started){started=true;timer=setTimeout(step,600);}
      else if(!e.isIntersecting&&started){clearTimeout(timer);items.forEach(function(m){m.classList.remove('on');});idx=0;started=false;}
    });},{threshold:.35});
    io2.observe(ch);
  });

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
      b.innerHTML='<span class="cmsg">'+t.msg+' <a href="cookies.html">'+t.more+'</a></span>'+
        '<span class="cbtns"><button class="cdecline">'+t.no+'</button><button class="caccept">'+t.ok+'</button></span>';
      document.body.appendChild(b);
      b.querySelector('.caccept').addEventListener('click',function(){try{localStorage.setItem(KEY,'granted');}catch(e){}grant();loadGTM();b.remove();});
      b.querySelector('.cdecline').addEventListener('click',function(){try{localStorage.setItem(KEY,'denied');}catch(e){}b.remove();});
    }
    if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
  })();

  /* ---- barre d'appel mobile (toujours accessible) ---- */
  (function(){
    var T={
      fr:{b:'Janet décroche maintenant',s:'Disponible — c’est une IA',btn:'Appeler'},
      nl:{b:'Janet neemt nu op',s:'Beschikbaar — het is een AI',btn:'Bellen'},
      en:{b:'Janet picks up now',s:'Available — it’s an AI',btn:'Call'}
    };var t=T[LANG]||T.fr;
    var bar=document.createElement('div');bar.className='callbar';
    bar.innerHTML='<img src="'+PRE+'assets/janet-avatar-128.webp" alt="Janet" width="38" height="38">'+
      '<div class="t"><b>'+t.b+'</b><span>'+t.s+'</span></div>'+
      '<a class="btn btn-grad" href="tel:+32460254413">'+t.btn+'</a>';
    document.body.appendChild(bar);
    function onScroll(){if(scrollY>300)bar.classList.add('show');else bar.classList.remove('show');}
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  })();

  /* ---- widget Janet flottant ---- */
  (function(){
    var T={
      fr:{role:'l’assistante IA de Celya',live:'Disponible maintenant',call:'Appeler Janet',wa:'WhatsApp',msg:'Bonjour Janet — montrez-moi ce que vous savez faire.',note:'Elle décroche en quelques secondes — 24h/24, en FR, NL ou EN.',aria:'Parler à Janet'},
      nl:{role:'de AI-assistente van Celya',live:'Nu beschikbaar',call:'Bel Janet',wa:'WhatsApp',msg:'Hallo Janet — laat me zien wat u kunt.',note:'Ze neemt op in enkele seconden — 24/7, in NL, FR of EN.',aria:'Praat met Janet'},
      en:{role:'Celya’s AI assistant',live:'Available now',call:'Call Janet',wa:'WhatsApp',msg:'Hi Janet — show me what you can do.',note:'She picks up in seconds — 24/7, in FR, NL or EN.',aria:'Talk to Janet'}
    };var t=T[LANG]||T.fr;
    var av=PRE+'assets/janet-avatar-128.webp';
    var w=document.createElement('div');w.className='jfab';
    w.innerHTML='<div class="jfab-p" role="dialog" aria-label="Janet">'
      +'<div class="jfab-hd"><img src="'+av+'" alt="Janet — '+t.role+'"><div><b>Janet</b><span>'+t.role+'</span></div></div>'
      +'<span class="jlive"><i></i>'+t.live+'</span>'
      +'<a class="btn btn-grad" href="tel:+32460254413">'+t.call+'</a>'
      +'<a class="btn btn-ghost" href="https://wa.me/32470572864?text='+encodeURIComponent(t.msg)+'" target="_blank" rel="noopener">'+t.wa+'</a>'
      +'<p>'+t.note+'</p></div>'
      +'<button class="jfab-b" aria-expanded="false" aria-label="'+t.aria+'"><img src="'+av+'" alt="Janet — '+t.role+'"><span class="dot"></span></button>';
    document.body.appendChild(w);
    var btn=w.querySelector('.jfab-b');
    btn.addEventListener('click',function(){var o=w.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false');});
    document.addEventListener('click',function(e){if(!w.contains(e.target))w.classList.remove('open');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')w.classList.remove('open');});
  })();
})();
