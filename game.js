/* ==========================================================
   GAME: luật chơi và luồng điều khiển
   rút xăm -> mở tờ xăm -> chọn đáp án -> hồi hộp -> đúng / sai
   ========================================================== */
window.App = window.App || {};

App.Game = (function () {
  const T = App.Config.timing;
  const ALL = App.Data.questions.concat(App.Data.challenges);

  let deck = ALL.slice();
  let current = null;
  let busy = false;        // đang rút xăm / đang chuyển màn hình / đang mở tờ xăm
  let answering = false;   // đang xử lý một đáp án

  const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function renderCounter() { App.UI.renderCounter(deck.length, ALL.length); }

  function removeCurrent() {
    deck = deck.filter(function (d) { return d.id !== current.id; });
    renderCounter();
  }

  function init() {
    renderCounter();
    App.UI.setDrawEnabled(true);
  }

  /* ---------- Chuyển giữa menu và game ---------- */
  async function start() {
    if (busy) return;
    busy = true;
    // Nhạc menu + menu fade out, rồi nhạc game + game fade in
    App.Audio.crossfadeTo('bgmGame', T.screenFade);
    App.UI.showScreen('game');
    await wait(T.screenFade * 1.4);
    busy = false;
  }

  async function goMenu() {
    if (busy) return;
    busy = true;
    App.UI.setStartLabel(deck.length < ALL.length ? 'Chơi tiếp' : 'Bắt đầu chơi');
    App.Audio.crossfadeTo('bgmMenu', T.screenFade);
    App.UI.showScreen('menu');
    await wait(T.screenFade * 1.4);
    busy = false;
  }

  /* ---------- Rút xăm ---------- */
  async function draw() {
    if (busy) return;

    if (deck.length === 0) {
      App.UI.openVictory();
      App.Audio.playCorrect();
      App.Effects.confetti(true);
      return;
    }

    busy = true;
    App.UI.setDrawEnabled(false);

    App.UI.jarShake(true);
    App.Audio.playShake();
    setTimeout(App.Audio.playShake, 220);
    await wait(T.shake);

    App.UI.jarShake(false);
    App.UI.flyStick();
    App.Audio.playUnfold();
    await wait(T.stickRise);

    current = deck[Math.floor(Math.random() * deck.length)];
    openCard(current);
    setTimeout(App.UI.hideStick, 150);
  }

  function openCard(item) {
    if (item.type === 'quiz') {
      App.UI.showQuiz(item, answer);
      return;
    }
    // Quà / thử thách: luôn là tin vui, bỏ khỏi ống ngay
    App.UI.showChallenge(item);
    App.Audio.playCorrect();
    App.Effects.confetti(false);
    removeCurrent();
    App.UI.showClose('Nhận quà và rút tiếp 🌸');
  }

  /* ---------- Trả lời ---------- */
  async function answer(idx) {
    if (answering) return;
    answering = true;

    const item = current;
    const isCorrect = idx === item.correctIndex;

    // Khoảnh khắc hồi hộp: chưa cho biết đúng hay sai
    App.UI.markPending(idx);
    App.UI.setFeedback('Đang chấm đáp án…', 'info');
    await wait(T.answerDelay);

    if (isCorrect) {
      App.UI.reveal(idx, item.correctIndex);
      App.UI.setFeedback('🎉 Đúng rồi! Bông hoa điểm 10 dành cho bạn!', 'ok');
      App.Audio.playCorrect();
      App.Effects.confetti(false);
      removeCurrent();                       // trả lời đúng thì quẻ rời khỏi ống
      App.UI.showClose('Rút quẻ tiếp 🌸');
    } else {
      await wrongSequence(item, idx);        // trả lời sai thì quẻ ở lại trong ống
    }
    answering = false;
  }

  async function wrongSequence(item, idx) {
    App.UI.reveal(idx, item.correctIndex);
    App.UI.setFeedback('Chưa đúng rồi! Câu này giữ trong ống để thử lại sau nhé!', 'bad');
    App.UI.shakePaper();

    App.Audio.duck(true, 200);
    const info = await App.Audio.playWrong();   // chờ tiếng thực sự bắt đầu rồi mới zoom

    // Zoom out vào khoảng giây 3 -> 4; nếu file ngắn hơn thì tự co lại cho khớp
    let zoomOutAt = T.wrongZoomOutAt;
    if (info.duration) {
      zoomOutAt = Math.min(zoomOutAt, info.duration * 1000 - T.wrongZoomOutDuration * 0.65);
    }
    zoomOutAt = Math.max(800, zoomOutAt);

    await App.Effects.wrongZoom({
      scale: T.wrongZoomScale,
      zoomOutAt: zoomOutAt,
      bounceMs: T.wrongZoomOutDuration
    }).done;

    App.Audio.duck(false, 800);
    App.UI.showClose('Đã hiểu (rút xăm khác) 🌸');
  }

  /* ---------- Đóng tờ xăm / chơi lại ---------- */
  function closeCard() {
    App.UI.closePaper();
    current = null;
    busy = false;
    App.UI.setDrawEnabled(true);

    if (deck.length === 0) {
      setTimeout(function () {
        App.UI.openVictory();
        App.Audio.playCorrect();
        App.Effects.confetti(true);
      }, 300);
    }
  }

  function restart() {
    deck = ALL.slice();
    renderCounter();
    App.UI.closeVictory();
  }

  return { init: init, start: start, goMenu: goMenu, draw: draw, closeCard: closeCard, restart: restart };
})();
