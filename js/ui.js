/* ==========================================================
   UI: mọi thao tác với DOM (màn hình, tờ xăm, đáp án, bộ đếm...)
   Không chứa luật chơi, chỉ hiển thị theo lệnh của game.js
   ========================================================== */
window.App = window.App || {};

App.UI = (function () {
  const $ = function (id) { return document.getElementById(id); };
  const fadeMs = App.Config.timing.screenFade;

  const screens = {};
  let currentScreen = null;
  let optionBtns = [];

  /* ---------- Khởi tạo ---------- */
  function init() {
    document.documentElement.style.setProperty('--screen-fade', fadeMs + 'ms');
    screens.menu = $('screen-menu');
    screens.game = $('screen-game');

    // Dựng ống xăm từ mẫu dùng chung
    const tpl = $('tpl-jar').innerHTML;
    document.querySelectorAll('[data-jar]').forEach(function (el) { el.innerHTML = tpl; });

    buildTitle();
    App.Icons.hydrate();
  }

  // Tách tiêu đề thành từng chữ để rơi lần lượt
  function buildTitle() {
    const title = document.querySelector('.menu-title');
    const words = title.dataset.text.split(' ');
    let i = 0;
    words.forEach(function (word) {
      const w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(function (ch) {
        const c = document.createElement('span');
        c.className = 'char';
        c.style.setProperty('--i', i++);
        c.textContent = ch;
        w.appendChild(c);
      });
      title.appendChild(w);
    });
    const flower = document.createElement('span');
    flower.className = 'char';
    flower.style.setProperty('--i', i++);
    flower.setAttribute('aria-hidden', 'true');
    flower.textContent = '💐';
    title.appendChild(flower);
  }

  /* ---------- Chuyển màn hình ---------- */
  function showScreen(name, opts) {
    if (currentScreen === name) return;
    const prev = screens[currentScreen];
    const next = screens[name];

    if (prev) {
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(function () { prev.classList.remove('is-leaving'); }, fadeMs);
    }
    if (opts && opts.first) {
      next.classList.add('is-first');
      setTimeout(function () { next.classList.remove('is-first'); }, fadeMs);
    }
    next.classList.remove('is-leaving');
    next.classList.add('is-active');
    currentScreen = name;
  }

  function setStartLabel(text) { $('start-label').textContent = text; }

  /* ---------- Bộ đếm ---------- */
  function renderCounter(remaining, total) {
    const el = $('remaining');
    const changed = el.textContent !== String(remaining);
    el.textContent = remaining;
    $('total').textContent = total;
    $('progress-bar').style.width = ((total - remaining) / total * 100) + '%';
    if (changed) {
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    }
  }

  /* ---------- Ống xăm ---------- */
  function jarShake(on) { $('jar').classList.toggle('is-shaking', on); }
  function setDrawEnabled(on) { $('draw-btn').disabled = !on; }

  function flyStick() {
    const s = $('rising-stick');
    s.classList.remove('is-flying');
    void s.offsetWidth;
    s.classList.add('is-flying');
  }
  function hideStick() { $('rising-stick').classList.remove('is-flying'); }

  /* ---------- Tờ xăm ---------- */
  function openPaper(variant, tagText, titleText, badgeIcon) {
    const paper = $('paper');
    paper.dataset.variant = variant;
    $('card-badge').innerHTML = App.Icons.svg(badgeIcon, 'icon--lg');
    $('card-tag').textContent = tagText;
    $('card-title').textContent = titleText;
    $('options').innerHTML = '';
    $('challenge').hidden = true;
    $('options').hidden = true;
    $('close-btn').hidden = true;
    $('close-btn').classList.remove('is-in');
    setFeedback('', 'info');
    optionBtns = [];

    paper.classList.remove('is-unfolding', 'is-shaking');
    void paper.offsetWidth;
    paper.classList.add('is-unfolding');
    $('paper-modal').classList.add('is-open');
  }

  function showQuiz(item, onPick) {
    openPaper('quiz', 'Câu hỏi trắc nghiệm', item.question, 'help-circle');
    const box = $('options');
    box.hidden = false;
    item.options.forEach(function (text, idx) {
      const b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = '<span></span>' + App.Icons.svg('circle');
      b.firstChild.textContent = text;
      b.addEventListener('click', function () { onPick(idx); });
      box.appendChild(b);
      optionBtns.push(b);
    });
  }

  function showChallenge(item) {
    openPaper('challenge', 'Món quà và thử thách nữ quyền', item.title, 'gift');
    $('challenge-desc').textContent = item.description;
    $('challenge').hidden = false;
    setFeedback('✨ Các bạn nam chuẩn bị thực hiện nhé!', 'challenge');
  }

  function setOptionIcon(btn, name) {
    btn.lastChild.outerHTML = App.Icons.svg(name);
  }

  // Khoá đáp án, chỉ nhấn mạnh đáp án vừa chọn (giai đoạn hồi hộp)
  function markPending(idx) {
    optionBtns.forEach(function (b, i) {
      b.disabled = true;
      b.classList.toggle('is-pending', i === idx);
      b.classList.toggle('is-dim', i !== idx);
    });
  }

  // Công bố kết quả
  function reveal(pickedIdx, correctIdx) {
    optionBtns.forEach(function (b, i) {
      b.classList.remove('is-pending', 'is-dim');
      if (i === correctIdx) {
        b.classList.add('is-correct');
        setOptionIcon(b, 'check-circle');
      } else if (i === pickedIdx) {
        b.classList.add('is-wrong');
        setOptionIcon(b, 'x-circle');
      } else {
        b.classList.add('is-dim');
      }
    });
  }

  function setFeedback(text, kind) {
    const f = $('feedback');
    f.className = 'feedback is-' + kind;
    f.textContent = text;
    if (text) {
      void f.offsetWidth;
      f.classList.add('is-pop');
    }
  }

  function shakePaper() {
    const p = $('paper');
    p.classList.remove('is-unfolding', 'is-shaking');
    void p.offsetWidth;
    p.classList.add('is-shaking');
  }

  function showClose(label) {
    const b = $('close-btn');
    $('close-label').textContent = label;
    b.hidden = false;
    b.classList.remove('is-in');
    void b.offsetWidth;
    b.classList.add('is-in');
  }

  function closePaper() { $('paper-modal').classList.remove('is-open'); }

  /* ---------- Hoàn thành ---------- */
  function openVictory() { $('victory-modal').classList.add('is-open'); }
  function closeVictory() { $('victory-modal').classList.remove('is-open'); }

  /* ---------- Nút âm thanh ---------- */
  function renderMute(muted) {
    const b = $('sound-btn');
    b.dataset.muted = String(muted);
    b.setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh');
  }

  return {
    init: init, showScreen: showScreen, setStartLabel: setStartLabel,
    renderCounter: renderCounter,
    jarShake: jarShake, setDrawEnabled: setDrawEnabled, flyStick: flyStick, hideStick: hideStick,
    showQuiz: showQuiz, showChallenge: showChallenge,
    markPending: markPending, reveal: reveal, setFeedback: setFeedback,
    shakePaper: shakePaper, showClose: showClose, closePaper: closePaper,
    openVictory: openVictory, closeVictory: closeVictory,
    renderMute: renderMute
  };
})();
