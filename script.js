/* ============================================================
   For Jojo 🌸  —  single-screen interactions
   ============================================================ */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. build SVG blossoms ---------- */
  const petalColors = [
    ['#ef6f97', '#d94e7c'], // rose
    ['#ffd0a8', '#ffb38a'], // peach
    ['#ffe3ef', '#ffb0cd'], // blush
    ['#ffffff', '#ffe08a'], // daisy/gold
    ['#f7a8c4', '#e26aa0'],
    ['#ff9bbd', '#e05c8c'],
    ['#ffc8a2', '#f6a56b'],
  ];
  function buildBlossom(g, idx) {
    const [c1, c2] = petalColors[idx % petalColors.length];
    const petals = 6;
    let inner = '';
    for (let p = 0; p < petals; p++) {
      const ang = (360 / petals) * p;
      inner += `<ellipse cx="0" cy="-15" rx="10" ry="16" fill="${c1}" transform="rotate(${ang})" opacity="0.96"/>`;
    }
    inner += `<circle r="8.5" fill="${c2}"/>`;
    inner += `<circle r="4" fill="rgba(255,255,255,.55)"/>`;
    g.innerHTML = inner;
  }
  const blossoms = [...document.querySelectorAll('.blossom')];
  blossoms.forEach((g, i) => buildBlossom(g, i));
  blossoms.forEach((g) => g.addEventListener('click', (e) => {
    e.stopPropagation();
    const r = g.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top + r.height / 2, 12);
  }));

  /* ---------- 2. falling-petal canvas ---------- */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  function resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * DPR;
    canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const PALETTE = ['#ef6f97', '#ffb38a', '#ffd7e4', '#f4c15b', '#e26aa0', '#ffffff'];
  const petals = [];

  function makePetal(x, y, burst = false) {
    const size = 6 + Math.random() * 10;
    return {
      x: x ?? Math.random() * innerWidth,
      y: y ?? -20,
      size,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.06,
      vx: burst ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 0.8,
      vy: burst ? -Math.random() * 5 - 1 : 0.6 + Math.random() * 1.2,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      life: burst ? 120 : Infinity,
      gravity: burst ? 0.12 : 0,
    };
  }

  const AMBIENT = reduceMotion ? 0 : Math.min(46, Math.round(innerWidth / 24));
  for (let i = 0; i < AMBIENT; i++) petals.push(makePetal(Math.random() * innerWidth, Math.random() * innerHeight));

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life === Infinity ? 0.85 : Math.min(1, p.life / 60);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(p.size, -p.size, p.size, p.size, 0, p.size * 1.6);
    ctx.bezierCurveTo(-p.size, p.size, -p.size, -p.size, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.vr;
      if (p.life !== Infinity) p.life--;
      if (p.life === Infinity) {
        if (p.y > innerHeight + 30) { p.y = -20; p.x = Math.random() * innerWidth; }
        if (p.x > innerWidth + 30) p.x = -20;
        if (p.x < -30) p.x = innerWidth + 20;
      } else if (p.life <= 0 || p.y > innerHeight + 40) {
        petals.splice(i, 1);
        continue;
      }
      drawPetal(p);
    }
    requestAnimationFrame(tick);
  }
  if (!reduceMotion) tick();

  function spawnBurst(x, y, count = 12) {
    for (let i = 0; i < count; i++) petals.push(makePetal(x, y, true));
  }

  /* ---------- 3. floating hearts ---------- */
  function floatHeart(x, y) {
    const h = document.createElement('div');
    h.textContent = ['💗', '🌸', '🌷', '💛', '🌺'][(Math.random() * 5) | 0];
    Object.assign(h.style, {
      position: 'fixed', left: x + 'px', top: y + 'px',
      fontSize: 12 + Math.random() * 14 + 'px',
      pointerEvents: 'none', zIndex: 50,
      transition: 'transform 1.2s ease-out, opacity 1.2s ease-out',
      transform: 'translate(-50%,-50%)', opacity: '1',
    });
    document.body.appendChild(h);
    requestAnimationFrame(() => {
      h.style.transform = 'translate(-50%,-50%) translateY(-80px) scale(1.4)';
      h.style.opacity = '0';
    });
    setTimeout(() => h.remove(), 1300);
  }

  /* click anywhere -> petals + a heart */
  addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    spawnBurst(e.clientX, e.clientY, 8);
    floatHeart(e.clientX, e.clientY);
  });

  /* ---------- 4. gentle ambient chimes (off by default) ---------- */
  const muteBtn = document.getElementById('muteBtn');
  let audioCtx = null, playing = false, master = null;
  function startAmbient() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 587.33, 659.25, 783.99];
    master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2);
    (function chime() {
      if (!playing) return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[(Math.random() * notes.length) | 0] * (Math.random() < 0.5 ? 1 : 2);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);
      osc.connect(g); g.connect(master);
      osc.start(); osc.stop(audioCtx.currentTime + 2.3);
      setTimeout(chime, 900 + Math.random() * 1600);
    })();
  }
  if (muteBtn) muteBtn.addEventListener('click', () => {
    if (!playing) { playing = true; startAmbient(); muteBtn.textContent = '🔊'; }
    else { playing = false; try { master && master.disconnect(); } catch (_) {} muteBtn.textContent = '🔈'; }
  });
})();
