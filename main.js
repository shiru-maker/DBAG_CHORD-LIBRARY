/* main.js = Chord Library page: listahan, search, + button, gear */
let songs = [], lineup = [];

function renderList() {
  const q = $("search").value.trim().toLowerCase();
  $("songList").innerHTML = "";
  navList = songs.filter((s) => s.title.toLowerCase().includes(q));   // TITLE lang ang hinahanap
  navList.forEach((s) => {
    const inLineup = lineup.includes(s.id);
    const row = songRow(s, inLineup ? "minus-btn" : "add-btn", inLineup ? "−" : "+",
      () => inLineup ? removeFromLineup(s.id) : addToLineup(s));
    row.querySelector(".add-btn, .minus-btn").title = inLineup ? "Remove from Sunday Line-up" : "Add to Sunday Line-up";
    $("songList").appendChild(row);
  });
}
function addToLineup(s) {                                    // + = idagdag sa Sunday Line-up
  if (lineup.includes(s.id)) return;
  DB.setLineup([...lineup, s.id]).then(() => { lineup.push(s.id); renderList(); })
    .catch((e) => toast("Could not update Sunday Line-up: " + (e.message || e)));
}
function removeFromLineup(id) {
  const ids = lineup.filter((x) => x !== id);
  DB.setLineup(ids).then(() => { lineup = ids; renderList(); })
    .catch((e) => toast("Could not update Sunday Line-up: " + (e.message || e)));
}
$("search").oninput = renderList;
$("settingsBtn").onclick = () => { location.href = "dev.html"; };   // Developer Page: code lang ang hinihingi

Promise.all([DB.getSongs(), DB.getLineup()]).then(([s, l]) => { songs = s; lineup = l; renderList(); })
  .catch((e) => toast("Failed to load data: " + e.message));
