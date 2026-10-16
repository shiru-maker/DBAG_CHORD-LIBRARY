/* lineup.js = Sunday Line-up page: set of songs sa tamang order, may minus para tanggalin */
let songs = [], lineup = [];
const SLOTS = 12;   // ilang slot ang makikita (gaya ng design mo)

function renderList() {
  $("songList").innerHTML = "";
  navList = lineup.map((id) => songs.find((s) => s.id === id)).filter(Boolean);
  navList.forEach((s) =>
    $("songList").appendChild(songRow(s, "minus-btn", "\u2212", () => removeSong(s.id))));
  for (let i = lineup.length; i < SLOTS; i++) $("songList").appendChild(document.createElement("li")); // bakanteng slot
  $("dots").innerHTML = lineup.map(() => '<span class="dot"></span>').join("");                       // tuldok (phone)
}
function removeSong(id) {
  guard(async () => { const ids = lineup.filter((x) => x !== id); await DB.setLineup(ids); lineup = ids; renderList(); });
}
Promise.all([DB.getSongs(), DB.getLineup()]).then(([s, l]) => { songs = s; lineup = l; renderList(); })
  .catch((e) => toast("Failed to load data: " + e.message));
