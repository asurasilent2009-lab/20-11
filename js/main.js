/* ==========================================================
   MAIN: khởi động và gắn sự kiện
   ========================================================== */
document.addEventListener('DOMContentLoaded', async function () {
  const $ = function (id) { return document.getElementById(id); };

  App.UI.init();
  App.Petals.start();
  App.Audio.init();
  App.Game.init();

  $('start-btn').addEventListener('click', App.Game.start);
  $('home-btn').addEventListener('click', App.Game.goMenu);
  $('draw-btn').addEventListener('click', App.Game.draw);
  $('close-btn').addEventListener('click', App.Game.closeCard);
  $('replay-btn').addEventListener('click', App.Game.restart);

  const jar = $('jar');
  jar.addEventListener('click', App.Game.draw);
  jar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); App.Game.draw(); }
  });

  $('sound-btn').addEventListener('click', App.Audio.toggleMute);
  App.Audio.onMuteChange(App.UI.renderMute);
  App.UI.renderMute(App.Audio.isMuted());

  // Chờ font tải (tối đa 1.2s) rồi mới chạy hiệu ứng mở đầu cho tiêu đề không bị nhảy
  await Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 1200); })
  ]);
  App.UI.showScreen('menu', { first: true });
});
