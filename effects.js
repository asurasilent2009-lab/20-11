/* ==========================================================
   EFFECTS: pháo giấy, zoom màn hình khi trả lời sai
   ========================================================== */
window.App = window.App || {};

App.Effects = (function () {
  const stage = document.getElementById('stage');
  const flash = document.getElementById('flash');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Pháo giấy ---------- */
  function confettiBurst(grand) {
    if (typeof confetti !== 'function') return;
    if (!grand) {
      confetti({
        particleCount: 70, spread: 60, origin: { y: 0.65 }, zIndex: 80,
        colors: ['#f472b6', '#fb7185', '#c084fc', '#fde047']
      });
      return;
    }
    const duration = 3000;
    const end = Date.now() + duration;
    const base = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 80 };
    const timer = setInterval(function () {
      const left = end - Date.now();
      if (left <= 0) return clearInterval(timer);
      confetti(Object.assign({}, base, {
        particleCount: 50 * (left / duration),
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      }));
    }, 250);
  }

  /* ---------- Zoom khi sai ----------
     Zoom in cùng lúc nhạc chạy (đấm nhanh rồi trườn chậm), tới zoomOutAt thì
     zoom out kiểu nảy. Trả về { done: Promise, cancel() }. */
  let active = null;

  function cancelZoom() {
    if (!active) return;
    active.anims.forEach(function (a) { a.cancel(); });
    active.resolve();
    active = null;
  }

  function wrongZoom(opts) {
    cancelZoom();
    const scale = opts.scale;
    const zoomOutAt = opts.zoomOutAt;
    const bounceMs = opts.bounceMs;

    let resolveFn;
    const done = new Promise(function (r) { resolveFn = r; });

    if (reduceMotion.matches) {
      setTimeout(resolveFn, zoomOutAt);
      return { done: done, cancel: function () {} };
    }

    const punch = 1 + (scale - 1) * 0.55;
    const zin = stage.animate([
      { transform: 'scale(1)', easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
      { transform: 'scale(' + punch + ')', offset: 0.07, easing: 'linear' },
      { transform: 'scale(' + scale + ')' }
    ], { duration: zoomOutAt, fill: 'forwards' });

    const fl = flash.animate([
      { opacity: 0 },
      { opacity: 1, offset: 0.06 },
      { opacity: 0.5, offset: 0.55 },
      { opacity: 0 }
    ], { duration: zoomOutAt + bounceMs, easing: 'ease-out' });

    active = { anims: [zin, fl], resolve: resolveFn };

    zin.onfinish = function () {
      const zout = stage.animate([
        { transform: 'scale(' + scale + ')', easing: 'cubic-bezier(0.3, 0, 0.4, 1)' },
        { transform: 'scale(0.92)', offset: 0.38, easing: 'ease-in-out' },
        { transform: 'scale(1.035)', offset: 0.66, easing: 'ease-in-out' },
        { transform: 'scale(0.992)', offset: 0.86, easing: 'ease-in-out' },
        { transform: 'scale(1)' }
      ], { duration: bounceMs });
      zin.cancel();
      if (active) active.anims = [zout, fl];
      zout.onfinish = function () {
        zout.cancel();
        active = null;
        resolveFn();
      };
    };

    return { done: done, cancel: cancelZoom };
  }

  return { confetti: confettiBurst, wrongZoom: wrongZoom };
})();
