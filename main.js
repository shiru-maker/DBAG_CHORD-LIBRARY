/* main.js = Chord Library page: listahan, search, + button, gear */
let songs = [], lineup = [];

function renderList() {
  const q = $("search").value.trim().toLowerCase();
  $("songList").innerHTML = "";
  navList = songs.filter((s) => s.title.toLowerCase().includes(q));   // TITLE lang ang hinahanap
  navList.forEach((s) => $("songList").appendChild(songRow(s, "add-btn", "+", () => addToLineup(s))));
}
function addToLineup(s) {                                    // + = idagdag sa Sunday Line-up
  if (lineup.includes(s.id)) return;
  guard(async () => { await DB.setLineup([...lineup, s.id]); lineup.push(s.id); });
}
$("search").oninput = renderList;
$("settingsBtn").onclick = async () => { if (await DB.ensureLogin()) location.href = "dev.html"; };   // login muna (isang beses lang kada device) bago pumasok

Promise.all([DB.getSongs(), DB.getLineup()]).then(([s, l]) => { songs = s; lineup = l; renderList(); })
  .catch((e) => toast("Failed to load data: " + e.message));
