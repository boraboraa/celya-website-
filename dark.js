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

/* ---- Floating WhatsApp button ---- */
(function(){
  var lang=(document.documentElement.lang||'en').slice(0,2);
  var M={en:"Hi Celya, I'd like to know more about what you can automate for my business.",fr:"Bonjour Celya, j'aimerais en savoir plus sur ce que vous pouvez automatiser pour mon entreprise.",nl:"Hallo Celya, ik wil graag meer weten over wat jullie voor mijn onderneming kunnen automatiseren."};
  var msg=M[lang]||M.en;
  var a=document.createElement('a');a.className='wafloat';a.href='https://wa.me/32470572864?text='+encodeURIComponent(msg);a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','WhatsApp');
  a.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02zM12.04 20.15h-.003a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.55-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>';
  document.body.appendChild(a);
})();
