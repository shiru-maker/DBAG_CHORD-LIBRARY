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
  guard(async () => { const ids = lineup.filter((x) => x !== id); await DB.setLineup(ids); lineup = ids; renderList(); });
}
Promise.all([DB.getSongs(), DB.getLineup()]).then(([s, l]) => { songs = s; lineup = l; renderList(); })
  .catch((e) => toast("Failed to load data: " + e.message));

// Phone lang: buksan agad ang chord view mula sa Sunday Line-up listahan.
if (document.body.classList.contains("page-lineup")) {
  const openLineupSong = openSong;
  openSong = (song) => {
    openLineupSong(song);
    if (window.matchMedia("(max-width: 800px)").matches) document.body.classList.add("lineup-song");
  };
  if ($("backBtn")) $("backBtn").onclick = () => {
    document.body.classList.remove("lineup-song", "show-song");
  };
}
