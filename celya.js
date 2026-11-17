/* Celya — JS du thème clair (lot « refonte premium », 14/11/2026).
   GTM (GTM-KF9QCKB2) ne se charge QU'APRÈS le consentement (localStorage
   'celya-consent') — jamais d'iframe noscript. GA4 est configuré DANS GTM.
   Aucun pixel en dur : tout événement passe par dataLayer, et seulement si le
   visiteur a accepté les cookies.

   Budget navigateur : une seule boucle requestAnimationFrame (RAF), qui ne
   tourne que lorsqu'il y a du travail ; un seul écouteur scroll et un seul
   resize, passifs (onScroll / onResize) ; aucune mesure de mise en page dans
   la boucle — tout passe par vrect() / drect(), en cache ; les animations CSS
   hors écran sont en pause (.anim-off), la vidéo du héros aussi. */

(function(){
  var LANG=(document.documentElement.lang||'fr').slice(0,2);
  var BLOG=/\/(blog|lp)\//.test(location.pathname); /* blog/ et lp/ sont un niveau sous la racine de la langue : le lien cookies remonte d'un cran */
  var HAS_IO='IntersectionObserver' in window;
  var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CONSENT_KEY='celya-consent';

  /* ---- ordonnanceur : une seule boucle rAF, qui ne tourne que si quelqu'un a du travail ---- */
  var RAF=(function(){
    var q=[],id=null;
    function frame(now){id=null;var run=q;q=[];for(var i=0;i<run.length;i++)run[i](now);}
    return function(fn){if(q.indexOf(fn)<0)q.push(fn);if(id===null)id=requestAnimationFrame(frame);};
  })();

  /* ---- mesures en cache ----
     vrect(el) : rectangle dans le viewport, valable jusqu'au prochain scroll/resize.
     drect(el) : position dans le document + taille, valable jusqu'au prochain resize. */
  var VR=new Map(),DR=new Map();
  function vrect(el){var r=VR.get(el);if(!r){r=el.getBoundingClientRect();VR.set(el,r);}return r;}
  function drect(el){var r=DR.get(el);if(!r){var b=el.getBoundingClientRect();r={top:b.top+scrollY,left:b.left+scrollX,width:b.width,height:b.height};DR.set(el,r);}return r;}

  /* ---- un seul écouteur scroll, un seul resize, passifs, rythmés par RAF ---- */
  var scrollFns=[],resizeFns=[];
  function onScroll(fn){scrollFns.push(fn);}
  function onResize(fn){resizeFns.push(fn);}
  function scrolled(){VR.clear();for(var i=0;i<scrollFns.length;i++)scrollFns[i]();}
  function resized(){VR.clear();DR.clear();for(var i=0;i<resizeFns.length;i++)resizeFns[i]();}
  addEventListener('scroll',function(){RAF(scrolled);},{passive:true});
  addEventListener('resize',function(){RAF(resized);},{passive:true});
  addEventListener('load',function(){RAF(resized);});

  /* ---- année du pied de page ---- */
  document.querySelectorAll('.yr').forEach(function(e){e.textContent=new Date().getFullYear();});

  /* ---- menu mobile : les liens sont écrits dans le HTML (SEO) ; ici, l'ouverture seule ---- */
  (function(){
    var btn=document.querySelector('.burger');if(!btn)return;
    function set(open){document.body.classList.toggle('mnav-open',open);btn.setAttribute('aria-expanded',open?'true':'false');}
    btn.addEventListener('click',function(){set(btn.getAttribute('aria-expanded')!=='true');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('mnav-open')){set(false);btn.focus();}});
    onResize(function(){if(innerWidth>1180)set(false);});
  })();

  /* ---- rien ne s'anime hors écran : chaque élément animé est observé, et
     reçoit .anim-off dès qu'il sort du viewport (le CSS met alors son animation
     en pause). Vérifiable : document.getAnimations() ne rend que des animations
     en pause hors écran. ---- */
  (function(){
    if(!HAS_IO||!document.getAnimations)return;
    var seen=[];
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){e.target.classList.toggle('anim-off',!e.isIntersecting);});
    });
    /* une scène qui se joue à plusieurs éléments ([data-anim-root], la scène
       « Un appel, de bout en bout ») se met en pause d'un bloc : sinon ses
       morceaux se figeraient chacun à leur heure et ne seraient plus en phase.
       Elle ne tourne que lorsque son téléphone est entier à l'écran (ou le
       remplit) : aucune de ses étapes ne s'anime alors hors écran. */
    var roots=document.querySelectorAll('[data-anim-root]');
    if(roots.length){
      var rio=new IntersectionObserver(function(es){
        es.forEach(function(e){
          var full=e.intersectionRatio>=0.99||(e.rootBounds&&e.intersectionRect.height>=e.rootBounds.height-2);
          e.target._animRoot.classList.toggle('anim-off',!full);
        });
      },{threshold:[0,0.5,0.9,0.99,1]});
      roots.forEach(function(r){var ph=r.querySelector('.phone')||r;seen.push(r);r.classList.add('anim-off');ph._animRoot=r;rio.observe(ph);});
    }
    document.getAnimations().forEach(function(a){
      var t=a.effect&&a.effect.target;
      if(!t||t.nodeType!==1||seen.indexOf(t)>=0)return;
      if(t.closest&&t.closest('[data-anim-root]'))return;
      if(typeof CSSAnimation!=='undefined'&&!(a instanceof CSSAnimation))return;
      seen.push(t);t.classList.add('anim-off');io.observe(t);
    });
  })();

  /* ---- héros vidéo des accueils (retour du 15/11/2026) ----
     1. la source et le poster sont choisis UNE fois, au chargement : version
        mobile sous 720 px de large, version ordinateur au-dessus ;
     2. prefers-reduced-motion : poster seul, aucune lecture, aucun effet ;
     3. hors écran : pause (.anim-off), reprise au retour ;
     4. au défilement, sur les 60 % premiers de la hauteur du héros : la vidéo
        grossit (1 → 1,06) et se dissout, le texte remonte et s'efface, le C de
        l'étiquette grandit (28 → 72 px) et se pose en tête de la section
        suivante. transform et opacity seulement ; positions lues dans drect()
        (cache invalidé au resize), jamais dans la boucle de défilement. */
  (function(){
    var hero=document.querySelector('[data-hv]');if(!hero)return;
    var v=hero.querySelector('video'),media=hero.querySelector('.hv-media'),txt=hero.querySelector('.hv-txt'),
        tag=hero.querySelector('.hv-lab'),pill=hero.querySelector('.hv-tag'),box=hero.querySelector('.hv-cbox'),
        c=box&&box.querySelector('.cv'),slot=document.querySelector('.hv-slot');
    var mob=innerWidth<720;
    v.poster=v.getAttribute(mob?'data-poster-m':'data-poster-d');
    if(REDUCE){v.removeAttribute('autoplay');v.pause();hero.classList.add('hv-still');return;}
    v.src=v.getAttribute(mob?'data-src-m':'data-src-d');
    function play(){var p=v.play();if(p&&p.catch)p.catch(function(){});}
    play();
    if(HAS_IO)new IntersectionObserver(function(es){
      var on=es[0].isIntersecting;
      v.classList.toggle('anim-off',!on);
      if(on)play();else v.pause();
    }).observe(hero);
    /* pages d'atterrissage (data-hv="lp") : la vidéo seule, sans l'effet au
       défilement — l'exception d'opacité du 15/11/2026 ne couvre que les accueils */
    if(hero.getAttribute('data-hv')==='lp')return;
    /* mesures : une fois, puis à chaque resize */
    var H=0,dx=0,dy=0,S=72/28;
    function measure(){
      var h=drect(hero);H=h.height;
      if(box&&slot){var a=drect(box),b=drect(slot);dx=(b.left+b.width/2)-(a.left+a.width/2);dy=(b.top+b.height/2)-(a.top+a.height/2);S=b.width/a.width;}
      update();
    }
    function update(){
      var p=H?Math.min(1,Math.max(0,scrollY/(H*0.6))):0;
      media.style.transform=p?'scale('+(1+0.06*p).toFixed(4)+')':'';
      media.style.opacity=p?(1-p).toFixed(3):'';
      txt.style.transform=p?'translateY('+(-28*p).toFixed(1)+'px)':'';
      txt.style.opacity=p?Math.max(0,1-p*1.4).toFixed(3):'';
      if(tag)tag.style.opacity=p?Math.max(0,1-p*2).toFixed(3):'';
      if(pill)pill.classList.toggle('hv-tag-off',p>0.02);
      if(c)c.style.transform=p?'translate('+(dx*p).toFixed(1)+'px,'+(dy*p).toFixed(1)+'px) scale('+(1+(S-1)*p).toFixed(3)+')':'';
    }
    onResize(measure);onScroll(update);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){RAF(resized);});
    measure();
  })();

  /* ---- replis « sur téléphone seulement » : ouverts au-dessus de 720 px ---- */
  (function(){
    var ds=document.querySelectorAll('details.fold-m');if(!ds.length)return;
    var wide=null;
    function sync(){var w=innerWidth>=720;if(w===wide)return;wide=w;ds.forEach(function(d){d.open=w;});}
    sync();onResize(sync);
  })();

  /* ---- vidéo : rien ne se charge avant le clic ---- */
  document.querySelectorAll('.vid-play').forEach(function(b){
    b.addEventListener('click',function(){
      var box=b.closest('.vid'),v=box.querySelector('video');if(!v)return;
      box.classList.add('playing');v.controls=true;v.preload='auto';
      var p=v.play();if(p&&p.catch)p.catch(function(){});
      v.focus();
    });
  });

  /* ---- barre d'appel mobile : visible quand les boutons du héros ne le sont plus ---- */
  (function(){
    var bar=document.querySelector('.mbar');if(!bar)return;
    var hero=document.querySelector('[data-hero]')||document.querySelector('main .cta-pair');
    var root=document.documentElement;
    if(!hero||!HAS_IO){root.classList.add('mbar-on');return;}
    new IntersectionObserver(function(es){
      var e=es[0];
      /* au-dessus ou dans l'écran : barre cachée ; défilé au-delà : barre affichée */
      root.classList.toggle('mbar-on',!e.isIntersecting&&e.boundingClientRect.top<0);
    }).observe(hero);
  })();

  /* ---- mesure : seulement avec l'accord du visiteur, et seulement via GTM ---- */
  function consented(){try{return localStorage.getItem(CONSENT_KEY)==='granted';}catch(e){return false;}}
  function track(ev,cb){
    if(!consented()){if(cb)cb();return;}
    window.dataLayer=window.dataLayer||[];
    if(cb){
      var done=false;function go(){if(!done){done=true;cb();}}
      ev.eventCallback=go;ev.eventTimeout=1200;
      dataLayer.push(ev);
      /* GTM pas encore chargé : on ne retient pas le visiteur */
      setTimeout(go,window.google_tag_manager?1300:150);
    }else dataLayer.push(ev);
  }
  window.celyaTrack=track;
  /* événements (lot « prêt pour les publicités », 17/11/2026) : les noms
     click_call et generate_lead ne changent pas (Google Ads est réglé dessus) ;
     ils portent form (le data-lead du formulaire : demo, contact, lp-garages…),
     page et lang. Aucun nom de régie ni identifiant de compte ici : tout se
     règle dans GTM. */
  var leadForm=document.querySelector('form[data-lead]');
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="tel:"]');
    if(a)track({event:'click_call',form:leadForm?leadForm.getAttribute('data-lead'):'',page:location.pathname,lang:LANG});
    /* bandeau cookies : le bloc consentement a déjà écrit le choix du visiteur
       (son écouteur, sur le bouton, passe avant celui-ci) ; l'attribution suit */
    if(e.target.closest&&e.target.closest('.caccept,.cdecline'))keepAttr();
  });
  /* identifiant unique d'un envoi : le même part à web-lead et dans generate_lead
     (dédoublonnage futur du pixel Meta et des envois depuis le serveur) */
  function eventId(){try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);}

  /* ---- attribution : UTM et identifiants de clic, lus à l'arrivée ----
     Sans accord : gardés pour la session seulement (sessionStorage), comme avant.
     Après « Accepter » : recopiés dans localStorage (même clé, avec la date
     d'arrivée), pour un visiteur qui revient plus tard ; gardés 90 jours au
     plus à partir de cette date, puis effacés ; une nouvelle arrivée avec des
     paramètres remplace l'ancienne. Après « Refuser », ou sans accord à
     l'ouverture d'une page (accord retiré en effaçant les données du site),
     localStorage ne garde rien. */
  var ATTR_KEY='celya-attrib',ATTR_DAYS=90,PARAMS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];
  function readAttr(){try{return JSON.parse(sessionStorage.getItem(ATTR_KEY)||'{}')||{};}catch(e){return {};}}
  function readKept(){
    try{
      var o=JSON.parse(localStorage.getItem(ATTR_KEY)||'null');
      if(!o||!o.attr||!(o.saved_at>0))return null;
      if(Date.now()-o.saved_at>ATTR_DAYS*864e5){localStorage.removeItem(ATTR_KEY);return null;}
      return o.attr;
    }catch(e){return null;}
  }
  function keepAttr(){
    try{
      if(!consented()){localStorage.removeItem(ATTR_KEY);return;}
      var a=readAttr();
      localStorage.setItem(ATTR_KEY,JSON.stringify({attr:a,saved_at:a.t||Date.now()}));
    }catch(e){}
  }
  (function(){
    var a=readAttr(),q=new URLSearchParams(location.search),seen=false,i;
    for(i=0;i<PARAMS.length;i++){if(q.get(PARAMS[i])){seen=true;break;}}
    if(seen){a={t:Date.now()};for(i=0;i<PARAMS.length;i++){var v=q.get(PARAMS[i]);if(v)a[PARAMS[i]]=v.slice(0,200);}a.landing_page=location.pathname;}
    else if(!a.landing_page&&consented()){var k=readKept();if(k)a=k;} /* retour d'un visiteur qui a accepté */
    if(!a.landing_page)a.landing_page=location.pathname; /* page d'origine de la session */
    if(!a.t)a.t=Date.now();
    try{sessionStorage.setItem(ATTR_KEY,JSON.stringify(a));}catch(e){}
    keepAttr();
  })();

  /* ---- formulaires de prospect (demo.html, pages d'atterrissage, contact.html) ---- */
  document.querySelectorAll('form[data-lead]').forEach(function(f){
    var a=readAttr();
    PARAMS.concat(['landing_page']).forEach(function(k){var el=f.elements[k];if(el&&a[k])el.value=a[k];});
    if(f.elements.page)f.elements.page.value=location.pathname;
    var err=f.querySelector('.f-err'),btn=f.querySelector('button[type=submit]'),label=btn?btn.innerHTML:'';
    function fail(msg){if(err){err.textContent=msg;err.classList.add('on');}}
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      if(err)err.classList.remove('on');
      var E=f.elements,kind=f.getAttribute('data-lead');
      var val=function(n){return E[n]?String(E[n].value||'').trim():'';};
      var bad=[];
      if(!val('name'))bad.push(E.name);
      if(E.phone&&(E.phone.required||val('phone'))&&val('phone').replace(/\D/g,'').length<8)bad.push(E.phone);
      /* contact : comme avant la migration, un téléphone ou un e-mail suffit, mais l'un des deux est requis */
      if(f.getAttribute('data-need')==='phone-or-email'&&!val('phone')&&!val('email'))bad.push(E.phone,E.email);
      if(E.consent&&!E.consent.checked)bad.push(E.consent);
      if(E.email&&val('email')&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email')))bad.push(E.email);
      [].forEach.call(f.querySelectorAll('[aria-invalid]'),function(x){x.removeAttribute('aria-invalid');});
      if(bad.length){bad.forEach(function(x){if(x)x.setAttribute('aria-invalid','true');});fail(f.getAttribute('data-err-required'));if(bad[0])bad[0].focus();return;}
      var body={
        name:val('name'),company:val('company'),phone:val('phone'),email:val('email'),
        need:val('need'),website:E.website?E.website.value:'',
        source:f.getAttribute('data-source')||'website form',
        metier:val('metier'),moment:E.moment?(f.querySelector('input[name=moment]:checked')||{}).value||'':'',
        consent_contact:E.consent?!!E.consent.checked:undefined,
        lang:LANG,page:location.pathname,landing_page:val('landing_page'),
        event_id:eventId()
      };
      PARAMS.forEach(function(k){body[k]=val(k);});
      if(btn){btn.disabled=true;btn.textContent=f.getAttribute('data-sending')||'…';}
      fetch('https://piufpzeicmvgtieybgra.supabase.co/functions/v1/web-lead',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      }).then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok)throw 0;
        var next=f.getAttribute('data-next');
        track({event:'generate_lead',event_id:body.event_id,form:kind,page:body.page,lang:LANG,metier:body.metier||'',utm_campaign:body.utm_campaign||''},function(){
          if(next)location.href=next;else{var ok=f.querySelector('.f-ok');if(ok){f.querySelector('.f-body').hidden=true;ok.hidden=false;}}
        });
      }).catch(function(){
        if(btn){btn.disabled=false;btn.innerHTML=label;}
        fail(f.getAttribute('data-err-server'));
      });
    });
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
      fr:{msg:'Mesure et publicité (Google Analytics, Google Ads, Meta) : à vous de choisir.',ok:'Accepter',no:'Refuser',more:'En savoir plus'},
      nl:{msg:'Cookies voor metingen en advertenties (Google Analytics, Google Ads, Meta): u beslist.',ok:'Accepteren',no:'Weigeren',more:'Meer info'},
      en:{msg:'Cookies for analytics and ads (Google Analytics, Google Ads, Meta): you choose.',ok:'Accept',no:'Decline',more:'More info'}
    };var t=T[LANG]||T.fr;
    var saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
    if(saved==='granted'){grant();loadGTM();return;}
    if(saved==='denied')return;
    function build(){
      var b=document.createElement('div');b.className='cbanner';
      b.innerHTML='<span class="cmsg">'+t.msg+' <a href="'+(BLOG?'../':'')+'cookies.html">'+t.more+'</a></span>'+
        '<span class="cbtns"><button class="cdecline">'+t.no+'</button><button class="caccept">'+t.ok+'</button></span>';
      document.body.appendChild(b);
      /* la hauteur du bandeau est publiée dans --cbanner-h : sous 720 px le héro
         s'en sert comme padding bas tant que le bandeau est affiché. Retirée au
         clic, sur l'un comme sur l'autre bouton. Rien d'autre ne change ici :
         ni le consentement, ni le chargement de GTM. */
      var vivant=true; /* onResize n'a pas de retrait : après le clic, mesure() doit ne plus rien faire,
                          sinon elle réécrit --cbanner-h à 0 sur un bandeau détaché à chaque resize */
      function mesure(){if(!vivant)return;document.documentElement.style.setProperty('--cbanner-h',Math.ceil(b.getBoundingClientRect().height)+'px');}
      function ferme(){vivant=false;document.documentElement.style.removeProperty('--cbanner-h');b.remove();}
      mesure();onResize(mesure);
      if(document.fonts&&document.fonts.ready)document.fonts.ready.then(mesure); /* les Geist chargées changent le nombre de lignes */
      b.querySelector('.caccept').addEventListener('click',function(){try{localStorage.setItem(KEY,'granted');}catch(e){}grant();loadGTM();ferme();});
      b.querySelector('.cdecline').addEventListener('click',function(){try{localStorage.setItem(KEY,'denied');}catch(e){}ferme();});
    }
    if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
  })();
})();
