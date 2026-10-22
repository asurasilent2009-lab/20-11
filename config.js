/* ==========================================================
   CONFIG: mọi con số/đường dẫn hay chỉnh nằm ở đây
   ========================================================== */
window.App = window.App || {};

App.Config = {
  audio: {
    // Đường dẫn file âm thanh (để cùng thư mục với index.html, tên viết thường)
    files: {
      bgmMenu: 'bgm-menu.mp3',    // nhạc nền menu
      bgmGame: 'bgm-game.mp3',    // nhạc nền khi chơi
      correct: 'correct.mp3',    // âm thanh trả lời đúng
      wrong:   'wrong.mp3'       // âm thanh trả lời sai (~4.2s)
    },
    // Âm lượng từng loại (0 -> 1)
    volumes: { bgmMenu: 1, bgmGame: 1, correct: 0.75, wrong: 1 },
    // Âm lượng nhạc nền bị hạ xuống khi âm thanh "sai" đang chạy
    duckVolume: 0.35
  },

  timing: {
    screenFade: 1600,        // ms: menu <-> game (hình + nhạc nền fade out rồi fade in)
    shake: 600,              // ms: lắc ống trước khi que bay lên
    stickRise: 700,          // ms: que bay lên trước khi mở tờ xăm
    answerDelay: 1000,       // ms: hồi hộp chờ trước khi công bố đúng/sai

    wrongZoomScale: 1.32,    // độ phóng to khi sai
    wrongZoomOutAt: 3800,    // ms: tính từ lúc nhạc "sai" bắt đầu, tới lúc zoom out (khoảng 3s -> 4s)
    wrongZoomOutDuration: 900 // ms: thời gian zoom out kiểu nảy (bounce)
  }
};
