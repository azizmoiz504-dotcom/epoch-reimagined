/* Scent Lab — compose a product, watch it fill and spray, send the brief. */
(function () {
  const form = document.getElementById('labForm');
  if (!form) return;

  const FORMATS = [
    { id: 'air', label: 'Air Freshener', shape: 'can', bases: ['Water-based', 'Oil-based'], sizes: ['75 ml', '150 ml', '250 ml', '300 ml', '400 ml'] },
    { id: 'refill', label: 'Automatic Refill', shape: 'can', bases: ['Oil-based'], sizes: ['250 ml', '300 ml', '400 ml'] },
    { id: 'car', label: 'Car Freshener', shape: 'can', bases: ['Water-based', 'Oil-based'], sizes: ['To discuss'] },
    { id: 'spray', label: 'Body Spray', shape: 'can', bases: ['Classic', 'Alcohol-free'], sizes: ['To discuss'] },
    { id: 'mist', label: 'Body Mist', shape: 'bottle', bases: ['Silicone', 'Water', 'Oil'], sizes: ['To discuss'] },
    { id: 'attar', label: 'Attar Oil', shape: 'attar', bases: ['Pure & alcohol-free'], sizes: ['Roll-on', 'Ornate bottle + box'] }
  ];
  const SCENTS = [
    { id: 'arabic', label: 'Arabic', c1: '#D7B26E', c2: '#6B3F1F', mist: '215,178,110' },
    { id: 'oriental', label: 'Oriental', c1: '#E04B86', c2: '#6E1A40', mist: '224,75,134' },
    { id: 'french', label: 'French', c1: '#BBA0E6', c2: '#5E48A8', mist: '187,160,230' },
    { id: 'signature', label: 'Your signature', c1: '#F2C4D3', c2: '#C03268', mist: '242,196,211' }
  ];

  const state = { format: 'air', scent: 'oriental', base: 'Oil-based', size: '300 ml', brand: '' };
  const $ = (s) => document.querySelector(s);
  const vessel = $('#vessel'), stage = $('#labStage');
  const fmt = () => FORMATS.find(f => f.id === state.format);
  const sc = () => SCENTS.find(s => s.id === state.scent);

  function chips(key, items, current) {
    const box = form.querySelector(`[data-key="${key}"]`);
    box.innerHTML = '';
    items.forEach(it => {
      const id = typeof it === 'string' ? it : it.id;
      const label = typeof it === 'string' ? it : it.label;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = label;
      b.setAttribute('aria-pressed', String(id === current));
      b.addEventListener('click', () => { set(key, id); });
      box.appendChild(b);
    });
  }

  function set(key, val) {
    state[key] = val;
    if (key === 'format') {
      const f = fmt();
      if (!f.bases.includes(state.base)) state.base = f.bases[f.bases.length > 1 ? 1 : 0];
      if (!f.sizes.includes(state.size)) state.size = f.sizes[Math.min(3, f.sizes.length - 1)];
    }
    render();
    puff(40);
  }

  function render() {
    const f = fmt(), s = sc();
    chips('format', FORMATS, state.format);
    chips('scent', SCENTS, state.scent);
    chips('base', f.bases, state.base);
    chips('size', f.sizes, state.size);

    vessel.dataset.shape = f.shape;
    vessel.style.setProperty('--c1', s.c1);
    vessel.style.setProperty('--c2', s.c2);
    const idx = f.sizes.indexOf(state.size);
    vessel.style.setProperty('--fill', (0.35 + 0.55 * ((idx + 1) / f.sizes.length)).toFixed(2));
    const name = (state.brand || 'Your brand').toUpperCase();
    $('#vBrand').textContent = name;
    $('#vSub').textContent = `${f.label}${state.size !== 'To discuss' ? ' · ' + state.size : ''}`;

    const scentWord = s.id === 'signature' ? 'signature-scent' : s.label;
    const art = /^[aeiou]/i.test(scentWord) ? 'an' : 'a';
    const size = state.size === 'To discuss' ? 'size to be discussed' : state.size.toLowerCase();
    const brandTxt = state.brand ? `under our brand <b>${esc(state.brand)}</b>` : 'under our own brand';
    $('#labBrief').innerHTML = `We’d like to develop ${art} <b>${scentWord}</b> <b>${f.label.toLowerCase()}</b> — <b>${state.base.toLowerCase()}</b>, <b>${size}</b> — ${brandTxt}.`;

    const plain = `Hello Epoch! We'd like to develop ${art} ${scentWord} ${f.label.toLowerCase()} — ${state.base.toLowerCase()}, ${size} — ${state.brand ? 'under our brand "' + state.brand + '"' : 'under our own brand'}. (Brief composed in the Epoch Scent Lab.)`;
    $('#labWa').href = 'https://wa.me/971557916612?text=' + encodeURIComponent(plain);
    $('#labMail').href = 'mailto:online@epoch.ae?subject=' + encodeURIComponent('New product brief' + (state.brand ? ' — ' + state.brand : '')) + '&body=' + encodeURIComponent(plain);
  }

  function esc(t) { return t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  $('#labBrand').addEventListener('input', (e) => { state.brand = e.target.value.trim(); render(); });

  /* --- mist canvas --- */
  const cv = $('#labMist'), cx = cv.getContext('2d');
  let mist = [], running = false, holding = false, W = 0, H = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
  }
  function nozzle() {
    const cap = vessel.querySelector('.vessel__cap').getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    return { x: cap.left - st.left + cap.width / 2, y: cap.top - st.top - 8 };
  }
  function emit(n) {
    if (reduce) return;
    const p = nozzle(), col = sc().mist;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + 0.55 + (Math.random() - .5) * .7;
      const sp = 3 + Math.random() * 6;
      mist.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + Math.random() * 4, life: 1, col });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function puff(n) { emit(n); vessel.classList.add('is-spraying'); setTimeout(() => vessel.classList.remove('is-spraying'), 180); }
  function tick() {
    if (holding) emit(10);
    cx.clearRect(0, 0, W, H);
    for (let i = mist.length - 1; i >= 0; i--) {
      const m = mist[i];
      m.vx *= .965; m.vy = m.vy * .965 - .015; m.x += m.vx; m.y += m.vy; m.r += .55; m.life -= .011;
      if (m.life <= 0) { mist.splice(i, 1); continue; }
      const g = cx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      g.addColorStop(0, `rgba(${m.col},${(m.life * .35).toFixed(3)})`);
      g.addColorStop(1, `rgba(${m.col},0)`);
      cx.fillStyle = g; cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, Math.PI * 2); cx.fill();
    }
    if (mist.length || holding) requestAnimationFrame(tick); else running = false;
  }
  const btn = $('#labSpray');
  const down = (e) => { e.preventDefault(); holding = true; vessel.classList.add('is-spraying'); emit(20); };
  const up = () => { holding = false; vessel.classList.remove('is-spraying'); };
  btn.addEventListener('pointerdown', down);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, up));
  btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') puff(80); });

  window.addEventListener('resize', size);
  size();
  render();
  if ('IntersectionObserver' in window) {
    let done = false;
    new IntersectionObserver(([en]) => { if (en.isIntersecting && !done) { done = true; setTimeout(() => puff(90), 500); } }, { threshold: .5 }).observe(stage);
  }
})();
