/* ==========================================================
   PETALS: cánh hoa rơi trên nền
   ========================================================== */
window.App = window.App || {};

App.Petals = (function () {
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#fbcfe8', '#f472b6', '#f43f5e', '#fde047', '#e879f9'];
  let w = 0;
  let h = 0;
  let petals = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function reset(p, initial) {
    p.x = Math.random() * w;
    p.y = initial ? Math.random() * h : -20;
    p.size = Math.random() * 8 + 5;
    p.vy = Math.random() * 1.4 + 0.7;
    p.vx = Math.random() - 0.5;
    p.angle = Math.random() * 360;
    p.spin = Math.random() * 2 - 1;
    p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.opacity = Math.random() * 0.5 + 0.4;
    return p;
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    petals.forEach(function (p) {
      p.y += p.vy;
      p.x += Math.sin(p.y * 0.01) + p.vx;
      p.angle += p.spin;
      if (p.y > h + 20) reset(p, false);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }

  function start() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 28; i++) petals.push(reset({}, true));
    requestAnimationFrame(frame);
  }

  return { start: start };
})();
