/* Celya — JS du thème clair (lot « refonte premium », 14/11/2026).
   GTM (GTM-KF9QCKB2) ne se charge QU'APRÈS le consentement (localStorage
   'celya-consent') — jamais d'iframe noscript. GA4 est configuré DANS GTM.
   Aucun pixel en dur : tout événement passe par dataLayer, et seulement si le
   visiteur a accepté les cookies.

   Budget navigateur : aucune boucle requestAnimationFrame, aucune animation
   pilotée en JS (le ruban et le C sont en CSS, transform/opacity) ; un seul
   écouteur resize, passif ; les animations hors écran sont mises en pause
   (.anim-off) par IntersectionObserver. */

(function(){
  var LANG=(document.documentElement.lang||'fr').slice(0,2);
  var BLOG=/\/(blog|lp)\//.test(location.pathname); /* blog/ et lp/ sont un niveau sous la racine de la langue : le lien cookies remonte d'un cran */
  var HAS_IO='IntersectionObserver' in window;
  var CONSENT_KEY='celya-consent';

  /* ---- un seul écouteur resize, passif, regroupé sur une image ---- */
  var resizeFns=[],rq=false;
  function onResize(fn){resizeFns.push(fn);}
  addEventListener('resize',function(){
    if(rq)return;rq=true;
    requestAnimationFrame(function(){rq=false;for(var i=0;i<resizeFns.length;i++)resizeFns[i]();});
  },{passive:true});

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
    document.getAnimations().forEach(function(a){
      var t=a.effect&&a.effect.target;
      if(!t||t.nodeType!==1||seen.indexOf(t)>=0)return;
      if(typeof CSSAnimation!=='undefined'&&!(a instanceof CSSAnimation))return;
      seen.push(t);t.classList.add('anim-off');io.observe(t);
    });
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
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="tel:"]');
    if(a)track({event:'click_call',page:location.pathname});
  });

  /* ---- attribution : UTM et identifiants de clic, lus à l'arrivée, gardés pour la session ---- */
  var ATTR_KEY='celya-attrib',PARAMS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];
  function readAttr(){try{return JSON.parse(sessionStorage.getItem(ATTR_KEY)||'{}')||{};}catch(e){return {};}}
  (function(){
    var a=readAttr(),q=new URLSearchParams(location.search),seen=false,i;
    for(i=0;i<PARAMS.length;i++){if(q.get(PARAMS[i])){seen=true;break;}}
    if(seen){a={};for(i=0;i<PARAMS.length;i++){var v=q.get(PARAMS[i]);if(v)a[PARAMS[i]]=v.slice(0,200);}a.landing_page=location.pathname;}
    if(!a.landing_page)a.landing_page=location.pathname; /* page d'origine de la session */
    try{sessionStorage.setItem(ATTR_KEY,JSON.stringify(a));}catch(e){}
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
        lang:LANG,page:location.pathname,landing_page:val('landing_page')
      };
      PARAMS.forEach(function(k){body[k]=val(k);});
      if(btn){btn.disabled=true;btn.textContent=f.getAttribute('data-sending')||'…';}
      fetch('https://piufpzeicmvgtieybgra.supabase.co/functions/v1/web-lead',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      }).then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok)throw 0;
        var next=f.getAttribute('data-next');
        track({event:'generate_lead',form:kind,metier:body.metier||'',utm_campaign:body.utm_campaign||''},function(){
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
