/* ---- theme ---- */
/* theme */
(function(){
  var r=document.documentElement,b=document.getElementById('theme');
  try{var s=localStorage.getItem('theme');if(s)r.setAttribute('data-theme',s)}catch(e){}
  b.addEventListener('click',function(){
    var dark=r.getAttribute('data-theme')?r.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
    var n=dark?'light':'dark';r.setAttribute('data-theme',n);
    try{localStorage.setItem('theme',n)}catch(e){}
  });
})();

/* ---- language ---- */
/* language toggle */
(function(){
  var els=[].slice.call(document.querySelectorAll('[data-fr]')),btn=document.getElementById('lang');
  els.forEach(function(e){e.setAttribute('data-en',e.innerHTML)});
  var tEn=document.title,tFr='Ilyasse Lasri – Ingénieur Informatique & Réseaux';
  function set(l){
    els.forEach(function(e){e.innerHTML=e.getAttribute('data-'+l)});
    document.documentElement.lang=l;btn.textContent=l==='fr'?'EN':'FR';
    btn.setAttribute('aria-label',l==='fr'?'Switch to English':'Passer en français');
    document.title=l==='fr'?tFr:tEn;
    try{localStorage.setItem('lang',l)}catch(x){}
  }
  var saved='en';try{saved=localStorage.getItem('lang')==='fr'?'fr':'en'}catch(x){}
  if(saved==='fr')set('fr');
  btn.addEventListener('click',function(){set(document.documentElement.lang==='fr'?'en':'fr')});
})();

/* ---- architecture-toggle ---- */
/* architecture toggle */
(function(){var b=document.getElementById('archToggle'),p=document.getElementById('archPanel'),c=b.closest('.proj');b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);p.hidden=!o;c.classList.toggle('open',o);if(o)p.scrollIntoView({block:'nearest',behavior:'smooth'})})})();

/* ---- event-architecture-toggle ---- */
(function(){var b=document.getElementById('eventArchToggle'),p=document.getElementById('eventArchPanel'),c=b.closest('.proj');b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);p.hidden=!o;c.classList.toggle('event-arch-open',o);if(o)c.scrollIntoView({block:'nearest',behavior:'smooth'})})})();

/* ---- iot-illustration-toggle ---- */
(function(){var b=document.getElementById('iotToggle'),p=document.getElementById('iotPanel'),c=b.closest('.proj');b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);p.hidden=!o;c.classList.toggle('iot-open',o);if(o)c.scrollIntoView({block:'nearest',behavior:'smooth'})})})();

/* ---- lanyard ---- */
/* lanyard physics: verlet rope + two-point rigid card, fixed timestep */
(function(){
  var stage=document.getElementById('stage'),card=document.getElementById('card'),path=document.getElementById('ropePath');
  var N=6,L=34,CW=280,CH=472,H=1/120,G=0.2,DAMP=0.991,ITER=16;
  var P=[],IM=[],ax=0,ay=-6,clip=N,low=N+1,drag=false,gx=0,gy=0,tx=0,ty=0,acc=0,last=0,vis=true;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* look: strap with edge, stitching and soft shadow, metal anchor and clip */
  var NS='http://www.w3.org/2000/svg',rope=document.getElementById('rope');
  function mk(tag,at,st){var e=document.createElementNS(NS,tag),k;for(k in at)e.setAttribute(k,at[k]);for(k in st||{})e.style[k]=st[k];return e}
  var defs=mk('defs');
  defs.innerHTML='<filter id="lyBlur" filterUnits="userSpaceOnUse" x="-400" y="-100" width="1200" height="1200"><feGaussianBlur stdDeviation="3.5"/></filter>'+
    '<linearGradient id="lyMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f8fb"/><stop offset=".5" stop-color="#aab1c0"/><stop offset="1" stop-color="#6f7686"/></linearGradient>';
  rope.insertBefore(defs,rope.firstChild);
  var shadow=mk('path',{fill:'none','stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#lyBlur)',transform:'translate(5 8)'},{stroke:'rgba(8,12,40,.3)',strokeWidth:'12px'});
  var edge=mk('path',{fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},{stroke:'color-mix(in srgb,var(--rope) 55%,#000)',strokeWidth:'15px'});
  var stitch=mk('path',{fill:'none','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'3 6'},{stroke:'rgba(255,255,255,.65)',strokeWidth:'1.4px'});
  path.style.strokeWidth='11px';path.setAttribute('stroke-linejoin','round');
  rope.insertBefore(shadow,path);rope.insertBefore(edge,path);path.parentNode.appendChild(stitch);
  var anchor=mk('rect',{width:28,height:11,rx:5,y:-14,fill:'url(#lyMetal)',stroke:'rgba(0,0,0,.25)','stroke-width':.8});
  rope.appendChild(anchor);
  var layers=[shadow,edge,path,stitch];
  var clipEl=document.createElement('div');
  clipEl.setAttribute('aria-hidden','true');
  clipEl.style.cssText='position:absolute;left:0;top:0;width:30px;height:46px;pointer-events:none;z-index:3;transform-origin:50% 29px;will-change:transform;filter:drop-shadow(0 3px 3px rgba(8,12,40,.35))';
  clipEl.innerHTML='<svg viewBox="0 0 30 46" width="30" height="46"><rect x="6" y="1.5" width="18" height="26" rx="9" fill="none" stroke="url(#lyMetal)" stroke-width="3.5"/><rect x="9" y="22" width="12" height="14" rx="3" fill="url(#lyMetal)" stroke="rgba(0,0,0,.22)" stroke-width=".8"/><rect x="12.5" y="26" width="5" height="6" rx="2.5" fill="#2a2f3d" opacity=".55"/></svg>';
  stage.appendChild(clipEl);
  var SHADOW='px 30px 60px -20px rgba(10,14,40,.38),0 0 0 1px var(--accent-soft),0 0 40px -10px var(--glow)';
  function size(){ax=stage.clientWidth/2}
  function init(){
    size();P=[];IM=[];
    for(var i=0;i<=N+1;i++){
      var y=ay+(i<=N?i*L:N*L+CH);
      P.push({x:ax,y:y,px:ax-(reduce?0:(i/(N+1))*2),py:y});
      IM.push(i===0?0:(i>=N?0.55:1));
    }
  }
  function len(i){return i<N?L:CH}
  function step(){
    P[0].x=ax;P[0].y=ay;P[0].px=ax;P[0].py=ay;
    for(var i=1;i<P.length;i++){
      var p=P[i];
      if(drag&&i===clip){
        var cx=Math.min(Math.max(tx,-1e4),1e4),cy=ty,dx=cx-ax,dy=cy-ay,d=Math.hypot(dx,dy),max=N*L;
        if(d>max){cx=ax+dx/d*max;cy=ay+dy/d*max}
        p.px=p.x;p.py=p.y;p.x+=(cx-p.x)*0.2;p.y+=(cy-p.y)*0.2;continue;
      }
      var vx=(p.x-p.px)*DAMP,vy=(p.y-p.py)*DAMP;
      p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+G*(i>=N?1.6:1);
    }
    for(var k=0;k<ITER;k++){
      for(var s=0;s<=N;s++){
        var a=P[s],b=P[s+1],ia=IM[s],ib=IM[s+1];
        if(drag&&s===clip)ia=0; if(drag&&s+1===clip)ib=0;
        var dx2=b.x-a.x,dy2=b.y-a.y,dist=Math.hypot(dx2,dy2)||1e-6,diff=(dist-len(s))/dist,w=ia+ib;
        if(!w)continue;
        a.x+=dx2*diff*ia/w;a.y+=dy2*diff*ia/w;b.x-=dx2*diff*ib/w;b.y-=dy2*diff*ib/w;
      }
      P[0].x=ax;P[0].y=ay;
    }
  }
  function render(){
    var c=P[clip],q=P[low],ang=Math.atan2(-(q.x-c.x),q.y-c.y);
    var vx=c.x-c.px,ry=reduce?0:Math.max(-14,Math.min(14,vx*2.4));
    card.style.transform='perspective(1000px) translate3d('+(c.x-CW/2)+'px,'+c.y+'px,0) rotate('+ang+'rad) rotateY('+ry+'deg)';
    card.style.boxShadow=(-ang*70).toFixed(1)+SHADOW;
    card.style.setProperty('--sx',(50-ang*180-ry*2)+'%');
    clipEl.style.transform='translate3d('+(c.x-15)+'px,'+(c.y-29)+'px,0) rotate('+ang+'rad)';
    anchor.setAttribute('x',P[0].x-14);
    var d='M'+P[0].x+' '+P[0].y;
    for(var i=1;i<=N;i++){
      var m=P[i],n=P[Math.min(i+1,N)];
      if(i<N)d+=' Q'+m.x+' '+m.y+' '+((m.x+n.x)/2)+' '+((m.y+n.y)/2);else d+=' L'+m.x+' '+m.y;
    }
    for(var li=0;li<layers.length;li++)layers[li].setAttribute('d',d);
  }
  function frame(t){
    requestAnimationFrame(frame);
    if(!vis){last=t;return}
    var dt=Math.min((t-last)/1000||0,0.05);last=t;acc+=dt;
    size();
    while(acc>=H){step();acc-=H}
    render();
  }
  function pt(e){var r=stage.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  card.addEventListener('pointerdown',function(e){
    drag=true;card.classList.add('grab');card.setPointerCapture(e.pointerId);
    var p=pt(e);gx=p.x-P[clip].x;gy=p.y-P[clip].y;tx=P[clip].x;ty=P[clip].y;e.preventDefault();
  });
  card.addEventListener('pointermove',function(e){if(!drag)return;var p=pt(e);tx=p.x-gx;ty=p.y-gy});
  function up(){drag=false;card.classList.remove('grab')}
  card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up);
  document.getElementById('swing').addEventListener('click',function(){
    var dir=Math.random()<.5?-1:1;
    for(var i=1;i<P.length;i++)P[i].px-=dir*(0.55+i*.12);
  });
  new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(stage);
  init();render();requestAnimationFrame(function(t){last=t;frame(t)});
})();

