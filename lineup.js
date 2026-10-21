/* lineup.js = Sunday Line-up page: set of songs sa tamang order, may minus para tanggalin */
let songs = [], lineup = [];

function renderList() {
  $("songList").innerHTML = "";
  navList = lineup.map((id) => songs.find((s) => s.id === id)).filter(Boolean);
  navList.forEach((s) =>
    $("songList").appendChild(songRow(s, "minus-btn", "\u2212", () => removeSong(s.id))));
  $("dots").innerHTML = "";
}
function removeSong(id) {
  const ids = lineup.filter((x) => x !== id);
  DB.setLineup(ids).then(() => { lineup = ids; renderList(); })
    .catch((e) => toast("Could not update Sunday Line-up: " + (e.message || e)));
}
Promise.all([DB.getSongs(), DB.getLineup()]).then(([s, l]) => {
  songs = s; lineup = l; renderList();
  if (window.matchMedia("(max-width: 800px)").matches && navList.length) openSong(navList[0]);
})
  .catch((e) => toast("Failed to load data: " + e.message));

// Phone lang: buksan agad ang chord view mula sa Sunday Line-up listahan.
if (document.body.classList.contains("page-lineup")) {
  const readerButton = $("fullscreenBtn");
  if (readerButton) {
    readerButton.onclick = async () => {
      if (!window.matchMedia("(max-width: 800px)").matches) return;
      const active = document.body.classList.contains("reader-fullscreen");
      if (active) {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
        else {
          document.body.classList.remove("reader-fullscreen");
          requestAnimationFrame(fitChords);
        }
        return;
      }
      document.body.classList.add("reader-fullscreen");
      if (document.documentElement.requestFullscreen) {
        try { await document.documentElement.requestFullscreen(); }
        catch (_) { requestAnimationFrame(fitChords); /* CSS full-screen reading mode remains available. */ }
      } else requestAnimationFrame(fitChords);
    };
    document.addEventListener("fullscreenchange", () => {
      document.body.classList.toggle("reader-fullscreen", Boolean(document.fullscreenElement));
      requestAnimationFrame(fitChords);
    });
  }
  const openLineupSong = openSong;
  openSong = (song) => {
    openLineupSong(song);
    if (window.matchMedia("(max-width: 800px)").matches) {
      document.body.classList.add("lineup-song");
      fitChords();
    }
  };
  if ($("backBtn")) $("backBtn").onclick = () => {
    document.body.classList.remove("lineup-song", "show-song");
  };
}
