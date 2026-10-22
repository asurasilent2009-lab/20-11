/* ==========================================================
   AUDIO: nhạc nền (fade/crossfade), âm thanh đúng/sai, tiếng tổng hợp dự phòng
   - Dùng file trong assets/audio/. Thiếu file nào thì tự dùng tiếng tổng hợp thay thế.
   ========================================================== */
window.App = window.App || {};

App.Audio = (function () {
  const cfg = App.Config.audio;
  const files = cfg.files;
  const volumes = cfg.volumes;

  const tracks = {};          // tên -> HTMLAudioElement
  const broken = new Set();   // file lỗi / không tồn tại
  const fades = new Map();    // tên -> token fade đang chạy
  const muteListeners = [];

  let muted = false;
  let ducked = false;
  let current = null;         // nhạc nền đang được chọn ('bgmMenu' | 'bgmGame')
  let synthCtx = null;
  let synthMaster = null;

  try { muted = localStorage.getItem('bxm-muted') === '1'; } catch (e) { /* bỏ qua */ }

  const clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };

  function make(name, loop) {
    const el = new Audio();
    el.preload = 'auto';
    el.loop = loop;
    el.muted = muted;
    el.volume = loop ? 0 : volumes[name];
    el.addEventListener('error', function () { markBroken(name); });
    el.src = files[name];
    tracks[name] = el;
  }

  function markBroken(name) {
    if (!broken.has(name)) {
      broken.add(name);
      console.warn('[Audio] Không phát được "' + name + '" (' + files[name] + '). Kiểm tra tên file / thư mục assets/audio/.');
    }
  }

  function bgmTarget(name) {
    return ducked ? Math.min(volumes[name], cfg.duckVolume) : volumes[name];
  }

  /* ---------- Fade âm lượng ---------- */
  function fade(name, to, ms, delay) {
    const el = tracks[name];
    if (!el) return Promise.resolve();
    const token = {};
    fades.set(name, token);
    const from = el.volume;
    const t0 = performance.now() + (delay || 0);
    return new Promise(function (resolve) {
      function step(now) {
        if (fades.get(name) !== token) return resolve();
        const k = ms <= 0 ? 1 : clamp01((now - t0) / ms);
        const eased = k * k * (3 - 2 * k);
        el.volume = clamp01(from + (to - from) * eased);
        if (k < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- Nhạc nền ---------- */
  // Gọi play() ngay trong lúc bấm (để trình duyệt cho phép) và bắt đầu fade luôn,
  // không chờ play() xong -> không bị fade khác ghi đè.
  function startTrack(name, fadeMs, delay) {
    const el = tracks[name];
    if (!el || broken.has(name)) return Promise.resolve(false);
    if (el.paused) el.volume = 0;

    const p = el.play();
    fade(name, bgmTarget(name), fadeMs, delay);

    return Promise.resolve(p).then(function () {
      return true;
    }).catch(function (e) {
      // Chỉ file không đọc được mới là "hỏng". AbortError / NotAllowedError thì không.
      if (e && e.name === 'NotSupportedError') markBroken(name);
      fades.set(name, {});            // huỷ fade đang chờ vì chưa phát được
      return false;
    });
  }

  function stopTrack(name, fadeMs, reset) {
    const el = tracks[name];
    if (!el || el.paused) return;
    fade(name, 0, fadeMs).then(function () {
      if (el.volume <= 0.01) {
        el.pause();
        if (reset) el.currentTime = 0;
      }
    });
  }

  // Menu fade out -> game fade in (nhạc game vào chậm hơn một nhịp)
  function crossfadeTo(name, ms) {
    if (current === name) return;
    const prev = current;
    current = name;
    if (prev) stopTrack(prev, ms * 0.8, prev === 'bgmMenu');
    startTrack(name, ms, prev ? ms * 0.4 : 0).then(function (ok) {
      if (!ok && current === name && !broken.has(name)) armGesture();
    });
  }

  // Trình duyệt chặn tự phát nhạc: chờ lần chạm hợp lệ đầu tiên rồi phát bài đang chọn.
  // (touchend / click mới được tính là cử chỉ hợp lệ trên điện thoại, pointerdown thì không.)
  const GESTURES = ['click', 'touchend', 'keydown'];
  let armed = false;

  function onGesture() {
    const el = tracks[current];
    if (!el || broken.has(current)) return disarm();
    if (!el.paused) return disarm();
    startTrack(current, 1200, 0).then(function (ok) { if (ok) disarm(); });
  }
  function disarm() {
    armed = false;
    GESTURES.forEach(function (g) { document.removeEventListener(g, onGesture, true); });
  }
  function armGesture() {
    if (armed) return;
    armed = true;
    GESTURES.forEach(function (g) { document.addEventListener(g, onGesture, true); });
  }

  function init() {
    make('bgmMenu', true);
    make('bgmGame', true);
    make('correct', false);
    make('wrong', false);

    current = 'bgmMenu';
    startTrack('bgmMenu', 1800, 0).then(function (ok) {
      if (!ok && !broken.has('bgmMenu')) armGesture();
    });

    // Chuyển tab thì tạm dừng nhạc nền
    document.addEventListener('visibilitychange', function () {
      const el = tracks[current];
      if (!el || broken.has(current)) return;
      if (document.hidden) el.pause();
      else if (el.volume > 0) el.play().catch(function () {});
    });
  }

  // Hạ nhạc nền khi âm thanh "sai" chạy, rồi trả lại
  function duck(on, ms) {
    ducked = on;
    if (current && tracks[current] && !tracks[current].paused) {
      fade(current, bgmTarget(current), ms || 300);
    }
  }

  /* ---------- Hiệu ứng âm thanh bằng file ---------- */
  async function playSfx(name) {
    const el = tracks[name];
    if (!el || broken.has(name)) return null;
    try {
      el.pause();
      el.currentTime = 0;
      el.volume = volumes[name];
      await el.play();
      return el;
    } catch (e) {
      if (e && e.name === 'NotSupportedError') markBroken(name);
      return null;
    }
  }

  /* ---------- Âm thanh tổng hợp (dự phòng / lắc ống / mở giấy) ---------- */
  function synth() {
    if (!synthCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      synthCtx = new Ctx();
      synthMaster = synthCtx.createGain();
      synthMaster.gain.value = muted ? 0 : 1;
      synthMaster.connect(synthCtx.destination);
    }
    if (synthCtx.state === 'suspended') synthCtx.resume();
    return synthCtx;
  }

  function tone(o) {
    const ctx = synth();
    if (!ctx) return;
    const now = ctx.currentTime + (o.t || 0);
    const dur = o.dur || 0.2;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, now);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, now + dur);
    g.gain.setValueAtTime(o.gain || 0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g);
    g.connect(synthMaster);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playShake() { tone({ type: 'triangle', f0: 160, f1: 45, dur: 0.15, gain: 0.3 }); }
  function playUnfold() { tone({ type: 'sine', f0: 280, f1: 650, dur: 0.22, gain: 0.2 }); }

  function synthCorrect() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone({ type: 'sine', f0: f, dur: 0.35, t: i * 0.08, gain: 0.25 });
    });
  }
  function synthWrong() {
    tone({ type: 'sawtooth', f0: 220, f1: 110, dur: 0.5, gain: 0.25 });
    tone({ type: 'sawtooth', f0: 165, f1: 70, dur: 0.7, t: 0.35, gain: 0.25 });
  }

  /* ---------- API cho game ---------- */
  function playCorrect() {
    playSfx('correct').then(function (el) { if (!el) synthCorrect(); });
  }

  // Trả về khi âm thanh đã BẮT ĐẦU chạy, để hiệu ứng zoom khớp với tiếng
  async function playWrong() {
    const el = await playSfx('wrong');
    if (el) {
      return { duration: isFinite(el.duration) ? el.duration : null };
    }
    synthWrong();
    return { duration: 1.1 };
  }

  function stopWrong() {
    const el = tracks.wrong;
    if (el && !el.paused) { el.pause(); el.currentTime = 0; }
  }

  function setMuted(v) {
    muted = !!v;
    Object.keys(tracks).forEach(function (k) { tracks[k].muted = muted; });
    if (synthMaster) synthMaster.gain.value = muted ? 0 : 1;
    try { localStorage.setItem('bxm-muted', muted ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    muteListeners.forEach(function (cb) { cb(muted); });
  }

  return {
    init: init,
    crossfadeTo: crossfadeTo,
    duck: duck,
    playShake: playShake,
    playUnfold: playUnfold,
    playCorrect: playCorrect,
    playWrong: playWrong,
    stopWrong: stopWrong,
    isMuted: function () { return muted; },
    toggleMute: function () { setMuted(!muted); },
    onMuteChange: function (cb) { muteListeners.push(cb); }
  };
})();
