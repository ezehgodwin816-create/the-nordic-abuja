/**
 * The Nordic Group — Welcome Experience
 * Loading sequence + continuous background animation + hotel cards reveal
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- LOADING SEQUENCE ---------- */
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPercent = document.getElementById('loaderPercent');
  const loaderStatus = document.getElementById('loaderStatus');
  const main = document.getElementById('main');

  const statuses = [
    'Preparing your experience…',
    'Loading hotel profiles…',
    'Connecting intelligent systems…',
    'Almost ready…',
    'Welcome'
  ];

  let progress = 0;
  let statusIndex = 0;

  function setProgress(p) {
    progress = Math.min(100, Math.max(0, p));
    if (loaderFill) loaderFill.style.width = progress + '%';
    if (loaderPercent) loaderPercent.textContent = Math.round(progress) + '%';
  }

  function runLoader() {
    if (reduceMotion) {
      setProgress(100);
      finishLoader();
      return;
    }

    const start = performance.now();
    const duration = 2200;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * 100);

      const newStatus = Math.min(statuses.length - 1, Math.floor(t * statuses.length));
      if (newStatus !== statusIndex) {
        statusIndex = newStatus;
        if (loaderStatus) loaderStatus.textContent = statuses[statusIndex];
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setProgress(100);
        if (loaderStatus) loaderStatus.textContent = 'Done';
        setTimeout(finishLoader, 380);
      }
    }
    requestAnimationFrame(tick);
  }

  function finishLoader() {
    if (!loader) return;
    loader.classList.add('is-done');
    document.body.classList.add('app-ready');
    if (main) {
      main.classList.remove('hidden');
      // Staggered reveal is handled by CSS .animate-in delays
    }
    setTimeout(() => {
      loader.style.display = 'none';
    }, 700);
  }

  /* ---------- CONTINUOUS BACKGROUND CANVAS ---------- */
  function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const PARTICLE_COUNT = 48;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          a: 0.15 + Math.random() * 0.35
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // soft connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183, 139, 85, ${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(183, 139, 85, ${0.08 * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => {
      resize();
      createParticles();
    }, { passive: true });
  }

  /* ---------- CARD HOVER GLOW ---------- */
  function setupCards() {
    document.querySelectorAll('.hotel-card').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        if (reduceMotion) return;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });
  }

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    runLoader();
    initCanvas();
    setupCards();
  });

  // Safety: never block UI forever
  setTimeout(() => {
    if (loader && !loader.classList.contains('is-done')) {
      setProgress(100);
      finishLoader();
    }
  }, 4500);
})();
