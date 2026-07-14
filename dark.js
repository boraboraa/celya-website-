// Celya — dark pages shared JS
document.querySelectorAll('#yr').forEach(function(e){e.textContent=new Date().getFullYear();});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
var rot=document.getElementById('rotor');
if(rot){var lang=(document.documentElement.lang||'en').slice(0,2);var W={en:['business','shop','restaurant','clinic','agency','team'],fr:['entreprise','boutique','restaurant','clinique','agence','équipe'],nl:['onderneming','winkel','restaurant','praktijk','bureau','team']};var words=W[lang]||W.en;var ri=0;setInterval(function(){rot.style.opacity=0;setTimeout(function(){ri=(ri+1)%words.length;rot.textContent=words[ri];rot.style.opacity=1;},300);},2200);}
document.querySelectorAll('[data-toggle]').forEach(function(t){
  t.querySelectorAll('.opt').forEach(function(o){
    o.addEventListener('click',function(){
      t.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on');});
      o.classList.add('on');
    });
  });
});

/* site-wide neural-network background */
(function(){
  var c=document.createElement('canvas');
  c.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:.55';
  document.body.appendChild(c);
  var x=c.getContext('2d'),W,H,pts,dpr;
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth;H=window.innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);var n=Math.max(30,Math.min(82,Math.floor(W/24)));pts=[];for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28});}
  function draw(){x.clearRect(0,0,W,H);for(var i=0;i<pts.length;i++){var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;}
  for(var a=0;a<pts.length;a++)for(var b=a+1;b<pts.length;b++){var dx=pts[a].x-pts[b].x,dy=pts[a].y-pts[b].y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){x.strokeStyle='rgba(95,140,255,'+(0.14*(1-d/140))+')';x.lineWidth=1;x.beginPath();x.moveTo(pts[a].x,pts[a].y);x.lineTo(pts[b].x,pts[b].y);x.stroke();}}
  for(var k=0;k<pts.length;k++){x.fillStyle='rgba(34,211,238,0.5)';x.beginPath();x.arc(pts[k].x,pts[k].y,1.6,0,6.3);x.fill();}
  requestAnimationFrame(draw);}
  size();draw();window.addEventListener('resize',size);
})();

/* ---- Cookie consent + Google Tag Manager (consent-gated) ---- */
(function(){
  var GTM_ID='GTM-KF9QCKB2'; /* GTM container — GA4 & any other tags are configured INSIDE GTM */
  var KEY='celya-consent';
  function loadGTM(){
    if(!GTM_ID||window._celyaGTM)return; window._celyaGTM=true; /* load once, only after consent */
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',GTM_ID);
  }
  var lang=(document.documentElement.lang||'en').slice(0,2);
  var T={
    en:{msg:'We use cookies to measure visits (Google Analytics). You choose.',ok:'Accept',no:'Decline',more:'More info'},
    fr:{msg:'Nous utilisons des cookies pour mesurer l’audience (Google Analytics). À vous de choisir.',ok:'Accepter',no:'Refuser',more:'En savoir plus'},
    nl:{msg:'We gebruiken cookies om bezoekers te meten (Google Analytics). U beslist.',ok:'Accepteren',no:'Weigeren',more:'Meer info'}
  };var t=T[lang]||T.en;
  var saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
  if(saved==='granted'){loadGTM();return;}
  if(saved==='denied'){return;}
  function build(){
    var b=document.createElement('div');b.className='cbanner';
    b.innerHTML='<span class="cmsg">'+t.msg+' <a href="cookies.html">'+t.more+'</a></span>'+
      '<span class="cbtns"><button class="cdecline">'+t.no+'</button><button class="caccept">'+t.ok+'</button></span>';
    document.body.appendChild(b);document.body.classList.add('cbopen');
    b.querySelector('.caccept').addEventListener('click',function(){try{localStorage.setItem(KEY,'granted');}catch(e){}loadGTM();b.remove();document.body.classList.remove('cbopen');});
    b.querySelector('.cdecline').addEventListener('click',function(){try{localStorage.setItem(KEY,'denied');}catch(e){}b.remove();document.body.classList.remove('cbopen');});
  }
  if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
})();

/* ---- Mobile navigation (hamburger menu) ---- */
(function(){
  var header=document.querySelector('header');if(!header)return;
  var nav=header.querySelector('nav');var links=header.querySelector('.nav-links');if(!nav||!links)return;
  var burger=document.createElement('button');burger.className='navtoggle';burger.setAttribute('aria-label','Menu');burger.setAttribute('aria-expanded','false');
  burger.innerHTML='<span></span><span></span><span></span>';
  nav.appendChild(burger);
  var panel=document.createElement('div');panel.className='mobmenu';
  var inner=document.createElement('div');inner.className='wrap';
  inner.appendChild(links.cloneNode(true));
  var cta=nav.querySelector('a.btn');if(cta)inner.appendChild(cta.cloneNode(true));
  panel.appendChild(inner);header.appendChild(panel);
  function close(){panel.classList.remove('open');burger.classList.remove('on');burger.setAttribute('aria-expanded','false');}
  burger.addEventListener('click',function(){var o=panel.classList.toggle('open');burger.classList.toggle('on',o);burger.setAttribute('aria-expanded',o?'true':'false');});
  panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close);});
})();

/* ---- Floating "Talk to Janet" widget (every page) ---- */
(function(){
  var lang=(document.documentElement.lang||'en').slice(0,2);
  var pre=(lang==='fr'||lang==='nl')?'../':''; /* fr/ and nl/ pages live one level below the assets */
  var T={
    en:{role:"Celya's AI agent",live:'Available now',call:'Call Janet',wa:'WhatsApp',msg:'Hi Janet — show me what you can do for my business.',note:'She picks up in seconds — 24/7, in FR, NL or EN.',aria:'Talk to Janet'},
    fr:{role:"l'agent IA de Celya",live:'Disponible maintenant',call:'Appeler Janet',wa:'WhatsApp',msg:'Bonjour Janet — montrez-moi ce que vous pouvez faire pour mon entreprise.',note:'Elle répond en quelques secondes — 24h/24, en FR, NL ou EN.',aria:'Parler à Janet'},
    nl:{role:'de AI-agent van Celya',live:'Nu beschikbaar',call:'Bel Janet',wa:'WhatsApp',msg:'Hallo Janet — laat me zien wat je voor mijn zaak kunt doen.',note:'Ze neemt op in enkele seconden — 24/7, in FR, NL of EN.',aria:'Praat met Janet'}
  };var t=T[lang]||T.en;
  var av=pre+'assets/janet-avatar-128.png';
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
