/* Hero — the Epoch mark, sprayed into being as a mist of particles.
   Sprig + wordmark + bar are sampled from an offscreen render of the logo. */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  const WORD_COLORS = ['#F6D3E0', '#F2C4D3', '#E04B86', '#FFFFFF', '#C9A46A', '#C03268'];
  const WORD_WEIGHTS = [0.34, 0.2, 0.24, 0.1, 0.06, 0.06];
  const LEAF_COLORS = ['#BDBABC', '#8F8C8E', '#D9D5D7'];
  const LEAF_PATH = new Path2D('M0 0 C-6 -8 -6 -21 0 -28 C6 -21 6 -8 0 0Z');
  const LEAVES = [[29, 44, -58, 1], [31, 34, -18, 1], [33, 37, 38, 1], [33, 28, 70, .72]];

  let W = 0, H = 0, DPR = 1;
  let parts = [], groups = [], sprays = [], motes = [];
  let mouse = { x: -9999, y: -9999, px: -9999, py: -9999 };
  let disperse = 0, visible = true, started = false, startT = 0, raf = 0, layout = null;
  let mistSprite = null;

  function pick(weights) {
    let r = Math.random(), a = 0;
    for (let i = 0; i < weights.length; i++) { a += weights[i]; if (r <= a) return i; }
    return weights.length - 1;
  }

  function makeMistSprite() {
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(224,75,134,.55)');
    grd.addColorStop(.4, 'rgba(192,50,104,.18)');
    grd.addColorStop(1, 'rgba(192,50,104,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return s;
  }

  /* Render the logo offscreen: red channel = letters, green channel = sprig & bar */
  function sampleLogo() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d');
    const letters = 'EPOCH'.split('');
    const small = W < 700;
    let fs = Math.min(H * 0.34, 340);
    const fontOf = (s) => `500 ${s}px "Cormorant Garamond", "Times New Roman", serif`;
    o.font = fontOf(fs);
    const measure = () => letters.reduce((a, l) => a + o.measureText(l).width, 0) + fs * 0.05 * (letters.length - 1);
    const maxW = W * (small ? 0.86 : 0.66);
    let total = measure();
    if (total > maxW) { fs = fs * maxW / total; o.font = fontOf(fs); total = measure(); }

    const capH = fs * 0.64;
    const cy = H * (small ? 0.44 : 0.46);
    const base = cy + capH / 2;
    let x = (W - total) / 2;
    const startX = x;
    o.fillStyle = '#f00';
    o.textBaseline = 'alphabetic';
    let oCenter = 0, cStart = 0;
    letters.forEach((l, i) => {
      const w = o.measureText(l).width;
      if (l === 'O') oCenter = x + w * 0.5;
      if (l === 'C') cStart = x;
      o.fillText(l, x, base);
      x += w + fs * 0.05;
    });

    // bar
    o.fillStyle = '#0f0';
    const barY = base + fs * 0.1, barH = Math.max(3, fs * 0.075);
    o.fillRect(startX, barY, total, barH);

    // sprig, rising out of the "O" towards the "C" as in the logo
    const sc = (fs * 0.92) / 64;
    const ax = (oCenter + cStart) / 2 - 6 * sc, ay = base - capH * 0.42;
    o.save();
    o.translate(ax - 22 * sc, ay - 63 * sc);
    o.scale(sc, sc);
    o.strokeStyle = '#0f0'; o.lineWidth = 1.8; o.lineCap = 'round';
    o.beginPath(); o.moveTo(22, 63); o.bezierCurveTo(28, 52, 31, 42, 33, 27); o.stroke();
    LEAVES.forEach(([lx, ly, rot, s]) => {
      o.save(); o.translate(lx, ly); o.rotate(rot * Math.PI / 180); o.scale(s, s); o.fill(LEAF_PATH); o.restore();
    });
    o.restore();

    const data = o.getImageData(0, 0, W, H).data;
    const area = total * capH;
    let gap = Math.max(2, Math.round(Math.sqrt(area / (small ? 2400 : 6500))));
    const pts = [];
    for (let yy = 0; yy < H; yy += gap) {
      for (let xx = 0; xx < W; xx += gap) {
        const i = (yy * W + xx) * 4;
        if (data[i] > 140) pts.push([xx, yy, 0]);
        else if (data[i + 1] > 140) pts.push([xx, yy, 1]);
      }
    }
    return { pts, fs, base, barY, barH, gap };
  }

  function build(intro) {
    layout = sampleLogo();
    const nozzle = { x: -W * 0.05, y: H * 1.08 };
    parts = layout.pts.map(([tx, ty, leaf]) => {
      const sweep = (tx / W);
      const p = {
        tx, ty, leaf,
        x: intro ? nozzle.x + (Math.random() - .5) * 40 : tx,
        y: intro ? nozzle.y + (Math.random() - .5) * 40 : ty,
        vx: 0, vy: 0,
        k: 0.018 + Math.random() * 0.02,
        damp: 0.86 + Math.random() * 0.05,
        delay: intro ? sweep * 1100 + Math.random() * 500 + (leaf ? 900 : 0) : 0,
        launched: !intro,
        s: (leaf ? 1.1 : 1.0) * (0.7 + Math.random() * 0.9 + layout.gap * 0.22),
        c: leaf ? 100 + Math.floor(Math.random() * LEAF_COLORS.length) : pick(WORD_WEIGHTS),
        seed: Math.random() * 1000,
        sx: (Math.random() - .5) * 2,
        sy: Math.random(),
        a: 0.55 + Math.random() * 0.45
      };
      return p;
    });
    // group by colour so fillStyle changes rarely
    const map = new Map();
    parts.forEach(p => { if (!map.has(p.c)) map.set(p.c, []); map.get(p.c).push(p); });
    groups = [...map.entries()].map(([c, list]) => ({ color: c >= 100 ? LEAF_COLORS[c - 100] : WORD_COLORS[c], list }));

    // drifting motes of mist
    const n = W < 700 ? 26 : 46;
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 60 + Math.random() * 180, vx: (Math.random() - .5) * .15, vy: -.05 - Math.random() * .2,
      a: .05 + Math.random() * .12
    }));

    const center = document.querySelector('.hero__center');
    if (center) center.style.top = (layout.barY + layout.barH + layout.fs * 0.16) + 'px';
  }

  function resize(intro) {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build(intro);
  }

  function spray(x, y, n = 140) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 7;
      sprays.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, life: 1, s: Math.random() * 2.2 + .6, c: WORD_COLORS[pick(WORD_WEIGHTS)] });
    }
    // shockwave on the mark
    parts.forEach(p => {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
      if (d < 260) { const f = (1 - d / 260) * 16; p.vx += dx / d * f; p.vy += dy / d * f; }
    });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const t = now - startT;
    ctx.clearRect(0, 0, W, H);

    // mist motes
    ctx.globalCompositeOperation = 'lighter';
    motes.forEach(m => {
      m.x += m.vx; m.y += m.vy - disperse * 2;
      if (m.y < -m.r) { m.y = H + m.r; m.x = Math.random() * W; }
      if (m.x < -m.r) m.x = W + m.r; if (m.x > W + m.r) m.x = -m.r;
      ctx.globalAlpha = m.a * (1 - disperse * .6);
      ctx.drawImage(mistSprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    });
    ctx.globalCompositeOperation = 'source-over';

    const R = touch ? 0 : 120, R2 = R * R;
    const mvx = mouse.x - mouse.px, mvy = mouse.y - mouse.py;
    mouse.px += (mouse.x - mouse.px) * .3; mouse.py += (mouse.y - mouse.py) * .3;
    const dOffY = disperse * H * 0.9, dOffX = disperse * W * 0.35;
    const fade = Math.max(0, 1 - disperse * 1.15);

    for (const g of groups) {
      ctx.fillStyle = g.color;
      for (const p of g.list) {
        if (!p.launched) {
          if (t < p.delay) continue;
          p.launched = true;
          p.vx = (p.tx - p.x) * 0.055 + (Math.random() - .5) * 8;
          p.vy = (p.ty - p.y) * 0.055 + (Math.random() - .5) * 8;
        }
        p.vx += (p.tx - p.x) * p.k;
        p.vy += (p.ty - p.y) * p.k;
        if (R) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R);
            p.vx += dx / d * f * 3.2 + mvx * f * .08;
            p.vy += dy / d * f * 3.2 + mvy * f * .08;
          }
        }
        p.vx *= p.damp; p.vy *= p.damp;
        p.x += p.vx; p.y += p.vy;

        const sh = Math.sin(now * 0.0016 + p.seed);
        const dx = p.x + sh * 0.6 + p.sx * dOffX * (0.4 + p.sy);
        const dy = p.y + Math.cos(now * 0.0013 + p.seed) * 0.6 - dOffY * (0.35 + p.sy);
        const speed = Math.abs(p.vx) + Math.abs(p.vy);
        ctx.globalAlpha = Math.min(1, p.a * (0.75 + sh * 0.25) + speed * 0.02) * fade;
        const s = p.s + Math.min(speed * 0.08, 1.4);
        ctx.fillRect(dx, dy, s, s);
      }
    }

    // spray bursts
    for (let i = sprays.length - 1; i >= 0; i--) {
      const s = sprays[i];
      s.vx *= .96; s.vy = s.vy * .96 - .02; s.x += s.vx; s.y += s.vy; s.life -= .012;
      if (s.life <= 0) { sprays.splice(i, 1); continue; }
      ctx.globalAlpha = s.life * fade;
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }

  const api = {
    start() {
      if (started) return; started = true;
      mistSprite = makeMistSprite();
      const go = () => {
        resize(!reduce);
        startT = performance.now();
        if (reduce) { frame(startT); cancelAnimationFrame(raf); return; }
        raf = requestAnimationFrame(frame);
      };
      const fontReady = document.fonts && document.fonts.load ? document.fonts.load('500 120px "Cormorant Garamond"') : Promise.resolve();
      Promise.race([fontReady, new Promise(r => setTimeout(r, 1500))]).then(go, go);

      const hero = canvas.parentElement;
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
      hero.addEventListener('click', (e) => {
        if (e.target.closest('a,button')) return;
        const r = canvas.getBoundingClientRect();
        spray(e.clientX - r.left, e.clientY - r.top);
      });
      let rt; let lastW = window.innerWidth;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          if (touch && Math.abs(window.innerWidth - lastW) < 2) return; // ignore mobile URL-bar resizes
          lastW = window.innerWidth; resize(false);
          if (reduce) frame(performance.now());
        }, 200);
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
      }
    },
    setProgress(p) { disperse = Math.max(0, Math.min(1, p)); },
    spray
  };
  window.EpochHero = api;
})();
