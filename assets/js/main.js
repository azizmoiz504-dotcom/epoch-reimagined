/* Epoch — orchestration: content rendering, loader, smooth scroll, choreography. */
(function () {
  const D = window.EPOCH_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const arrow = '<svg><use href="#arrow"/></svg>';

  /* ------------------------------------------------------------------
     1. Render content from data
     ------------------------------------------------------------------ */
  function renderPanels() {
    const host = $('#panels');
    host.innerHTML = D.categories.map(c => `
      <article class="panel" id="cat-${c.id}" style="--bg:${c.theme.bg};--ink-c:${c.theme.ink};--accent:${c.theme.accent}">
        <div class="panel__inner">
          <div class="panel__left">
            <div>
              <div class="panel__no">${c.no} / 06</div>
              <p class="panel__kicker">${c.kicker}</p>
              <h3 class="panel__name">${c.name}</h3>
              <p class="panel__lead">${c.lead}</p>
              <ul class="panel__tags">${c.tags.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
            <div>
              <div class="panel__specs">${c.specs.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
              <button class="btn btn--pill panel__cta magnetic" data-cat="${c.id}"><span>Explore ${c.name}</span>${arrow}</button>
            </div>
          </div>
          <div class="panel__right" data-cat="${c.id}" data-cursor="Explore">
            <img src="${c.hero}" alt="${c.name} by Epoch" loading="lazy">
            <div class="panel__thumbs">${c.products.slice(0, 4).map(p => `<img src="${p.img}" alt="" loading="lazy">`).join('')}</div>
            <span class="panel__count">${c.products.length} product lines</span>
          </div>
        </div>
        <div class="panel__shade"></div>
      </article>`).join('');
  }

  function renderJourney() {
    const host = $('#jSteps');
    host.insertAdjacentHTML('beforeend', D.journey.map((s, i) => `
      <div class="step" data-i="${i}">
        <span class="step__no">Step 0${i + 1}</span>
        <h3>${s.t}</h3>
        <p>${s.d}</p>
      </div>`).join(''));
  }

  function renderFaq() {
    $('#faqList').innerHTML = D.faq.map((f, i) => `
      <div class="acc${i === 0 ? ' is-open' : ''}">
        <button class="acc__q" aria-expanded="${i === 0}" aria-controls="faq-a${i}" id="faq-q${i}">${f.q}<span class="acc__icon" aria-hidden="true"></span></button>
        <div class="acc__a" id="faq-a${i}" role="region" aria-labelledby="faq-q${i}"><div><p>${f.a}</p></div></div>
      </div>`).join('');
    $$('.acc__q').forEach(b => b.addEventListener('click', () => {
      const acc = b.parentElement, open = !acc.classList.contains('is-open');
      $$('.acc.is-open').forEach(a => { a.classList.remove('is-open'); a.querySelector('.acc__q').setAttribute('aria-expanded', 'false'); });
      if (open) { acc.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
      setTimeout(() => hasGsap && ScrollTrigger.refresh(), 650);
    }));
  }

  function renderFooter() {
    $('#footProducts').innerHTML = D.categories.map(c => `<li><a href="#cat-${c.id}" data-cat="${c.id}">${c.name}</a></li>`).join('');
    $('#year').textContent = new Date().getFullYear();
  }

  function renderMapDots() {
    const g = $('.map__dots'); if (!g) return;
    let html = '';
    for (let y = 20; y < 340; y += 14) for (let x = 14; x < 600; x += 14) {
      const n = Math.sin(x * 0.021) * Math.cos(y * 0.027) + Math.sin((x + y) * 0.011);
      if (n > 0.15) html += `<circle cx="${x}" cy="${y}" r="1.4"/>`;
    }
    g.innerHTML = html;
  }

  renderPanels(); renderJourney(); renderFaq(); renderFooter(); renderMapDots();
  // duplicate marquee content for a seamless loop
  const mq = $('#marquee'); mq.innerHTML += mq.innerHTML + mq.innerHTML;

  /* ------------------------------------------------------------------
     2. Drawers (category detail + privacy)
     ------------------------------------------------------------------ */
  let lenis = null;
  let lastFocus = null;
  function openDrawer(el) {
    lastFocus = document.activeElement;
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => el.querySelector('.drawer__close').focus({ preventScroll: true }), 50);
  }
  function closeDrawer(el) {
    el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
    document.documentElement.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  function openCategory(id) {
    const c = D.categories.find(x => x.id === id); if (!c) return;
    const drawer = $('#drawer'), panel = drawer.querySelector('.drawer__panel');
    panel.style.setProperty('--dbg', c.theme.bg);
    panel.style.setProperty('--dink', c.theme.ink);
    panel.style.setProperty('--daccent', c.theme.accent);
    $('#drawerContent').innerHTML = `
      <span class="d-no">${c.no} / 06 — ${c.kicker}</span>
      <h2 class="d-title" id="drawerTitle">${c.name}</h2>
      <div class="d-hero"><img src="${c.hero}" alt=""></div>
      <p class="d-intro">${c.intro}</p>
      <div class="d-products">${c.products.map((p, i) => `
        <div class="d-prod" style="transition-delay:${0.25 + i * 0.07}s">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <div><h4>${p.name}</h4><ul>${p.points.map(t => `<li>${t}</li>`).join('')}</ul></div>
        </div>`).join('')}</div>
      <div class="d-cta"><h4>Make ${c.name.toLowerCase()} under your name.</h4><a href="#lab" class="btn btn--pill" data-close-go><span>Compose a brief</span>${arrow}</a></div>`;
    panel.scrollTop = 0;
    openDrawer(drawer);
  }
  document.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]');
    if (cat) { e.preventDefault(); openCategory(cat.dataset.cat); return; }
    if (e.target.closest('[data-open-privacy]')) { openDrawer($('#privacy')); return; }
    const close = e.target.closest('[data-close]');
    if (close) { closeDrawer(close.closest('.drawer')); return; }
    const go = e.target.closest('[data-close-go]');
    if (go) { e.preventDefault(); closeDrawer(go.closest('.drawer')); setTimeout(() => scrollToHash('#lab'), 400); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.drawer.is-open').forEach(closeDrawer);
      if (document.body.classList.contains('menu-open')) toggleMenu(false);
    }
  });

  /* ------------------------------------------------------------------
     3. Menu + anchors
     ------------------------------------------------------------------ */
  const burger = $('#burger');
  function toggleMenu(force) {
    const on = typeof force === 'boolean' ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', on);
    burger.setAttribute('aria-expanded', String(on));
    $('#menu').setAttribute('aria-hidden', String(!on));
    on ? lenis && lenis.stop() : lenis && lenis.start();
  }
  burger.addEventListener('click', () => toggleMenu());

  function scrollToHash(hash) {
    const t = hash === '#top' ? 0 : $(hash);
    if (t === null) return;
    if (lenis) lenis.scrollTo(t, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else if (t === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else t.scrollIntoView({ behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-cat') || a.hasAttribute('data-close-go')) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    e.preventDefault();
    if (document.body.classList.contains('menu-open')) { toggleMenu(false); setTimeout(() => scrollToHash(hash), 450); }
    else scrollToHash(hash);
  });

  /* ------------------------------------------------------------------
     4. Forms → compose an email (no backend required)
     ------------------------------------------------------------------ */
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 4200); };
  function validate(form) {
    let ok = true;
    $$('[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.parentElement.classList.toggle('is-invalid', bad); if (bad) ok = false;
    });
    return ok;
  }
  $('#cCv').addEventListener('change', (e) => {
    const f = e.target.files[0];
    $('.upload__text').innerHTML = f ? `${f.name} <small>READY</small>` : 'Upload your CV <small>PDF</small>';
  });
  $('#careerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (!validate(f)) return toast('Please add your name and a valid email.');
    const body = `Name: ${$('#cName').value}\nEmail: ${$('#cEmail').value}\nAge: ${$('#cAge').value}\nQualification: ${$('#cQual').value}\n\n${$('#cMsg').value}\n\n(CV attached)`;
    location.href = `mailto:online@epoch.ae?subject=${encodeURIComponent('Job application — ' + $('#cName').value)}&body=${encodeURIComponent(body)}`;
    toast('Opening your email app — remember to attach your CV.');
  });
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(e.target)) return toast('Please fill in your name, email and message.');
    const body = `${$('#fMsg').value}\n\n— ${$('#fName').value}\n${$('#fEmail').value}${$('#fPhone').value ? '\n' + $('#fPhone').value : ''}`;
    location.href = `mailto:online@epoch.ae?subject=${encodeURIComponent('Website enquiry — ' + $('#fName').value)}&body=${encodeURIComponent(body)}`;
    toast('Opening your email app — thank you for reaching out!');
  });

  /* ------------------------------------------------------------------
     5. Cursor + magnetic buttons
     ------------------------------------------------------------------ */
  if (fine && !reduce) {
    document.documentElement.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
    (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', (e) => {
      const v = e.target.closest('[data-cursor]');
      const l = e.target.closest('a, button, .chip, label.upload, input, textarea');
      cur.classList.toggle('is-view', !!v);
      cur.classList.toggle('is-link', !v && !!l);
      label.textContent = v ? v.dataset.cursor : '';
      cur.classList.toggle('is-hidden', !!e.target.closest('iframe, .map-wrap'));
    });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));

    document.addEventListener('pointermove', (e) => {
      const m = e.target.closest('.magnetic');
      $$('.magnetic.is-mag').forEach(x => { if (x !== m) { x.classList.remove('is-mag'); x.style.transform = ''; } });
      if (!m) return;
      const r = m.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      m.classList.add('is-mag');
      m.style.transition = 'transform .25s cubic-bezier(.22,1,.36,1)';
      m.style.transform = `translate(${dx * .22}px, ${dy * .32}px)`;
    });
  }

  /* ------------------------------------------------------------------
     6. Without GSAP (or reduced motion): show everything, start hero
     ------------------------------------------------------------------ */
  const loader = $('#loader');
  if (!hasGsap || reduce) {
    loader && loader.remove();
    window.EpochHero && window.EpochHero.start();
    $$('[data-count]').forEach(el => el.textContent = el.dataset.count + (el.dataset.suffix || ''));
    $$('.manifesto').forEach(m => m.style.opacity = 1);
    initJourneyStatic();
    return;
  }

  /* ------------------------------------------------------------------
     7. Motion system
     ------------------------------------------------------------------ */
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-anim');
  document.body.classList.add('is-loading');

  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  if (history.scrollRestoration) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  // word splitter — keeps <em>, <br> and &nbsp; intact
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \n\t]+)/).forEach(p => {
            if (!p) return;
            if (/^[ \n\t]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'wd';
            const i = document.createElement('span'); i.textContent = p;
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.wd > span', el);
  }
  const splitMap = new Map();
  $$('[data-split]').forEach(el => splitMap.set(el, splitWords(el)));
  splitMap.forEach((words) => gsap.set(words, { yPercent: 115 }));

  // --- Loader → hero intro
  const sprigLeaves = $$('.loader__sprig path:not(.stem)');
  gsap.set('.loader__word span', { y: 0, yPercent: 110 });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader__sprig .stem', { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }, 0)
    .fromTo(sprigLeaves, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: .9, stagger: .09 }, .1)
    .to('.loader__word span', { yPercent: 0, duration: 1.2, stagger: .07 }, .25)
    .to('.loader__meta', { opacity: 1, duration: .8 }, .7)
    .to('#loaderBar', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, .2)
    .add(() => window.EpochHero && window.EpochHero.start(), 1.75)
    .to('.loader__word span', { yPercent: -110, duration: .8, stagger: .05, ease: 'expo.in' }, 1.9)
    .to(['.loader__sprig', '.loader__meta'], { opacity: 0, y: -20, duration: .5, ease: 'power2.in' }, 1.95)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 2.35)
    .add(() => {
      loader.remove();
      document.body.classList.remove('is-loading');
      lenis.start();
    })
    .from('.nav > *', { y: -30, opacity: 0, duration: 1.2, stagger: .08 }, 2.8)
    .from('.hero__top', { y: 20, opacity: 0, duration: 1.2 }, 2.9)
    .from('.hero__tag', { y: 24, opacity: 0, duration: 1.4 }, 3.0)
    .to(splitMap.get($('.hero__lede')), { yPercent: 0, duration: 1.2, stagger: .025 }, 3.0)
    .from('.hero__ctas > *', { y: 30, opacity: 0, duration: 1.2, stagger: .1 }, 3.15)
    .from(['.hero__scroll', '.hero__hint', '.wa-float'], { opacity: 0, duration: 1.2 }, 3.4);
  tl.set(loader, { clipPath: 'inset(0 0 0% 0)' }, 0);

  // --- Global: progress bar, nav state
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  const nav = $('#nav');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', scroll > lastY && scroll > 300);
    lastY = scroll;
  });
  $$('.nav__links a').forEach(a => {
    const sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
  });

  // --- Hero: mark disperses into mist as you scroll away
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => window.EpochHero && window.EpochHero.setProgress(s.progress * 1.3) });
  gsap.to(['.hero__bottom', '.hero__top', '.hero__center', '.hero__scroll'], { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true } });

  // --- Marquee: endless, reacts to scroll velocity & direction
  (function marquee() {
    const track = $('#marquee');
    let x = 0, dir = -1, skew = 0;
    const third = () => track.scrollWidth / 3;
    gsap.ticker.add(() => {
      const v = lenis.velocity || 0;
      if (Math.abs(v) > .5) dir = v > 0 ? -1 : 1;
      x += dir * (0.6 + Math.min(Math.abs(v) * .35, 14));
      const w = third();
      if (x <= -w) x += w; if (x > 0) x -= w;
      skew += ((Math.max(-10, Math.min(10, v * .6))) - skew) * .1;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
    });
  })();

  // --- Split headings rise in
  splitMap.forEach((words, el) => {
    if (el.classList.contains('hero__lede')) return;
    gsap.to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: .035, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // --- Manifesto: words ink in as you read
  (function manifesto() {
    const m = $('#manifesto');
    const words = [];
    const walk = (node) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/([ \n\t]+)/).forEach(p => {
          if (!p) return;
          if (/^[ \n\t]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = p; words.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(m);
    gsap.to(words, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: m, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  })();

  // --- Clip reveals + parallax images
  $$('.reveal-clip').forEach(el => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 35%', scrub: true } }));
  $$('[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -9 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // --- Counters
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    const from = end > 1000 ? 1900 : 0;
    const o = { v: from };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: end > 1000 ? 2.4 : 1.8, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) + suf }) });
    el.textContent = from + suf;
  });

  // --- Brands
  gsap.from('.brands__list li', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.brands__list', start: 'top 88%' } });

  // --- Story: horizontal travel on desktop
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('#storyTrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const st = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.story', start: 'top top', end: () => '+=' + dist(), pin: '.story__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.to('.story__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    // chapters lift as they travel through
    $$('.chapter').forEach(ch => gsap.from(ch, { y: 80, rotate: 2, opacity: .3, ease: 'none', scrollTrigger: { trigger: ch, containerAnimation: st, start: 'left 100%', end: 'left 55%', scrub: true } }));
    return () => {};
  });
  mm.add('(max-width: 860px)', () => {
    $$('.chapter').forEach(ch => gsap.from(ch, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: ch, start: 'top 88%' } }));
  });
  // route arc draws itself
  (function arc() {
    const p = $('#routeArc'); if (!p) return;
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.story', start: 'top 60%' } });
  })();

  // --- Collection: stacked panels, each world slides over the last
  mm.add('(min-width: 861px)', () => {
    const panels = $$('.panel');
    panels.forEach((panel, i) => {
      const inner = $('.panel__inner', panel), img = $('.panel__right > img', panel);
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
      const name = $('.panel__name', panel);
      gsap.from(name, { yPercent: 40, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 60%' } });
      gsap.from($$('.panel__tags li, .panel__specs div', panel), { y: 24, opacity: 0, duration: 1, stagger: .04, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 45%' } });
      gsap.from($('.panel__right', panel), { clipPath: 'inset(18% 10% 18% 10% round 22px)', ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top top', scrub: true } });
      const next = panels[i + 1];
      if (!next) return;
      const tlp = gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
      tlp.to(inner, { scale: .9, borderRadius: 28, ease: 'none' }, 0).to($('.panel__shade', panel), { opacity: .55, ease: 'none' }, 0);
    });
  });
  mm.add('(max-width: 860px)', () => {
    $$('.panel').forEach(panel => gsap.from($('.panel__left', panel), { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 75%' } }));
  });

  // --- Capabilities bento
  gsap.from('.card', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.bento', start: 'top 85%' } });
  gsap.from('.can', { scaleY: 0, duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.cans', start: 'top 90%' } });

  // --- Journey: a droplet travels the path, steps light up
  initJourney();

  // --- FAQ items
  gsap.from('.acc', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.accordion', start: 'top 85%' } });

  // --- Forms & contact
  gsap.from('.form > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '#careerForm', start: 'top 85%' } });
  gsap.from('.ccard', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.contact__cards', start: 'top 88%' } });

  // --- Footer: the wordmark rises
  gsap.from('.footer__word span', { yPercent: 70, opacity: 0, ease: 'expo.out', duration: 1.4, stagger: .08, scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });
  gsap.from('.footer__sprig', { scale: 0, rotate: -40, opacity: 0, ease: 'expo.out', duration: 1.6, delay: .3, scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  // refresh once fonts & images settle
  const refresh = () => ScrollTrigger.refresh();
  document.fonts && document.fonts.ready.then(refresh);
  addEventListener('load', refresh);

  /* ------------------------------------------------------------------
     Journey helpers
     ------------------------------------------------------------------ */
  function buildJourneyPath() {
    const host = $('#jSteps'), svg = $('#jLine');
    const h = host.offsetHeight, w = svg.clientWidth || 60, cx = w / 2, amp = w * .32;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('height', h);
    const steps = $$('.step', host);
    let d = `M${cx} 0`;
    steps.forEach((s, i) => {
      const y = s.offsetTop + s.offsetHeight / 2;
      const prevY = i === 0 ? 0 : steps[i - 1].offsetTop + steps[i - 1].offsetHeight / 2;
      const side = i % 2 ? -amp : amp;
      d += ` C${cx + side} ${prevY + (y - prevY) * .35}, ${cx + side} ${prevY + (y - prevY) * .65}, ${cx} ${y}`;
    });
    d += ` L${cx} ${h}`;
    $('#jPath').setAttribute('d', d);
    $('#jPathBg').setAttribute('d', d);
    return $('#jPath');
  }
  function initJourneyStatic() { buildJourneyPath(); const p = $('#jPath'); const pt = p.getPointAtLength(0); $('#jDrop').setAttribute('cx', pt.x); $('#jDrop').setAttribute('cy', pt.y); $$('.step').forEach(s => s.classList.add('is-active')); }
  function initJourney() {
    let path = buildJourneyPath(), len = path.getTotalLength();
    const drop = $('#jDrop');
    const setP = (p) => {
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len * (1 - p);
      const pt = path.getPointAtLength(len * p);
      drop.setAttribute('cx', pt.x); drop.setAttribute('cy', pt.y);
    };
    setP(0);
    ScrollTrigger.create({
      trigger: '#jSteps', start: 'top 55%', end: 'bottom 55%', scrub: .6,
      onUpdate: (s) => setP(s.progress),
      onRefresh: () => { path = buildJourneyPath(); len = path.getTotalLength(); }
    });
    const num = $('#jNum');
    $$('.step').forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: 'top 60%', end: 'bottom 40%',
      onToggle: (st) => {
        s.classList.toggle('is-active', st.isActive);
        if (st.isActive) { gsap.fromTo(num, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out' }); num.textContent = '0' + (i + 1); }
      }
    }));
  }
})();
