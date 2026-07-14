/* ============================================================
   For Jojo 🌸  —  interactions
   ============================================================ */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Build SVG blossoms inside the bouquet
     --------------------------------------------------------- */
  const petalColors = [
    ['#ef6f97', '#d94e7c'], // rose
    ['#ffd0a8', '#ffb38a'], // peach
    ['#ffe3ef', '#ffb0cd'], // blush
    ['#ffffff', '#ffe08a'], // daisy/gold
    ['#f7a8c4', '#e26aa0'],
  ];
  function buildBlossom(g, idx) {
    const [c1, c2] = petalColors[idx % petalColors.length];
    const petals = 6;
    const r = 15;
    let inner = '';
    for (let p = 0; p < petals; p++) {
      const ang = (360 / petals) * p;
      inner += `<ellipse cx="0" cy="-14" rx="9" ry="15" fill="${c1}"
                  transform="rotate(${ang})" opacity="0.95"/>`;
    }
    inner += `<circle r="8" fill="${c2}"/>`;
    inner += `<circle r="4" fill="rgba(255,255,255,.5)"/>`;
    g.innerHTML = inner;
    g.setAttribute('data-r', r);
  }
  const blossoms = [...document.querySelectorAll('.blossom')];
  blossoms.forEach((g, i) => buildBlossom(g, i));

  // tap a bouquet flower -> burst petals from it
  blossoms.forEach((g) => {
    g.addEventListener('click', () => {
      const rect = g.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
    });
  });

  /* ---------------------------------------------------------
     2. Falling-petal canvas system
     --------------------------------------------------------- */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
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

  // ambient population
  const AMBIENT = reduceMotion ? 0 : Math.min(46, Math.round(innerWidth / 22));
  for (let i = 0; i < AMBIENT; i++) {
    const p = makePetal(Math.random() * innerWidth, Math.random() * innerHeight);
    petals.push(p);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life === Infinity ? 0.85 : Math.min(1, p.life / 60);
    ctx.beginPath();
    // simple petal: two arcs
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

      // recycle ambient petals
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

  function spawnBurst(clientX, clientY, count = 14) {
    for (let i = 0; i < count; i++) petals.push(makePetal(clientX, clientY, true));
  }

  // click anywhere -> release a little burst of petals + hearts
  addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return; // let buttons do their own thing
    spawnBurst(e.clientX, e.clientY, 8);
    floatHeart(e.clientX, e.clientY);
  });

  /* ---------------------------------------------------------
     3. Floating hearts
     --------------------------------------------------------- */
  function floatHeart(x, y) {
    const h = document.createElement('div');
    h.textContent = ['💗', '🌸', '🌷', '💛', '🌺'][(Math.random() * 5) | 0];
    Object.assign(h.style, {
      position: 'fixed', left: x + 'px', top: y + 'px',
      fontSize: 12 + Math.random() * 14 + 'px',
      pointerEvents: 'none', zIndex: 50, transition: 'transform 1.2s ease-out, opacity 1.2s ease-out',
      transform: 'translate(-50%,-50%)', opacity: '1',
    });
    document.body.appendChild(h);
    requestAnimationFrame(() => {
      h.style.transform = `translate(-50%,-50%) translateY(-80px) scale(1.4)`;
      h.style.opacity = '0';
    });
    setTimeout(() => h.remove(), 1300);
  }

  /* ---------------------------------------------------------
     4. Scroll reveal
     --------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        if (en.target.hasAttribute('data-typed')) startTyping(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal, .reveal-late, [data-typed]').forEach((el) => io.observe(el));

  /* ---------------------------------------------------------
     5. Typewriter for the letter
     --------------------------------------------------------- */
  function startTyping(el) {
    const full = el.textContent;
    if (reduceMotion) { el.classList.add('done'); return; }
    el.textContent = '';
    let i = 0;
    (function type() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        setTimeout(type, 26 + Math.random() * 40);
      } else {
        el.classList.add('done');
      }
    })();
  }

  /* ---------------------------------------------------------
     6. Petal-plucking daisy game
     --------------------------------------------------------- */
  const pluck = document.getElementById('pluck');
  const verdict = document.getElementById('verdict');
  if (pluck) {
    const dgPetals = [...pluck.querySelectorAll('.dg-petals i')];
    let idx = 0;
    pluck.addEventListener('click', () => {
      // always lands on "loves you" — rig the game 💕
      if (idx < dgPetals.length) {
        const p = dgPetals[idx++];
        p.classList.add('gone');
        const r = p.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top, 4);
      }
      const remaining = dgPetals.length - idx;
      verdict.textContent = remaining <= 0
        ? 'loves you — every single petal 🌼'
        : (idx % 2 === 1 ? 'loves you' : 'loves you a lot');
      verdict.classList.remove('pulse');
      void verdict.offsetWidth;
      verdict.classList.add('pulse');
      if (remaining <= 0) {
        setTimeout(() => { dgPetals.forEach((p) => p.classList.remove('gone')); idx = 0; }, 2400);
      }
    });
  }

  /* ---------------------------------------------------------
     7. The gift — big flower rain
     --------------------------------------------------------- */
  const giftBtn = document.getElementById('giftBtn');
  if (giftBtn) {
    giftBtn.addEventListener('click', () => {
      let n = 0;
      const iv = setInterval(() => {
        for (let i = 0; i < 6; i++) {
          const p = makePetal(Math.random() * innerWidth, -20);
          p.vy = 1.5 + Math.random() * 2;
          petals.push(p);
        }
        if (++n > 34) clearInterval(iv);
      }, 60);
      // shower of emoji flowers too
      for (let i = 0; i < 24; i++) {
        setTimeout(() => floatHeart(Math.random() * innerWidth, innerHeight - 40), i * 80);
      }
      giftBtn.querySelector('span').textContent = 'they\'re all yours 🌸';
    });
  }

  /* ---------------------------------------------------------
     8. Optional ambient sound (gentle, generated, off by default)
     --------------------------------------------------------- */
  const muteBtn = document.getElementById('muteBtn');
  let audioCtx = null, playing = false, nodes = [];
  function startAmbient() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 587.33, 659.25, 783.99]; // C D E G — pentatonic-ish, gentle
    const master = audioCtx.createGain();
    master.gain.value = 0.0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2);
    function chime() {
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
    }
    nodes = [master];
    playing = true;
    chime();
  }
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (!playing) { startAmbient(); muteBtn.textContent = '🔊'; }
      else { playing = false; nodes.forEach((n) => { try { n.disconnect(); } catch (_) {} }); muteBtn.textContent = '🔈'; }
    });
  }
})();
