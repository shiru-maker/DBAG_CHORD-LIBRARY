/* dev.js = Developer Page: dagdag / edit / delete ng kanta */

// ISANG LOCK LANG: ang login ng Supabase. Kapag naka-login na sa device na ito, diretso pasok (walang hihingin).
// Kapag hindi pa naka-login at nag-cancel, babalik sa main page.
DB.ensureLogin().then((ok) => {
  if (!ok) { location.replace("index.html"); return; }
  document.body.style.visibility = "visible";
  init();
});

function init() {
let songs = [], editingId = null;

function buildForm() {
  $("fKey").innerHTML = '<option value="">Key:</option>' + NOTES.flatMap((n) => [`<option value="${n}">${n}</option>`, `<option value="${n}m">${n}m</option>`]).join("");
  $("keyList").innerHTML = NOTES.map((n) => `<label><b>${n}</b><input data-key="${n}" placeholder="Singer"></label>`).join(""); // singer kada key
  buildKeyPicker();
}
/* ===== MAGANDANG KEY PICKER (kapalit ng karaniwang dropdown ng browser) ===== */
function syncKey() {
  const v = $("fKey").value;
  const minor = /m$/.test(v);
  $("keyPickBtn").textContent = v ? "Key: " + v : "Key:";
  document.querySelectorAll("#keyPickPanel .key-note").forEach((b) => b.classList.toggle("sel", v !== "" && b.dataset.k === v));
  document.querySelectorAll("#keyPickPanel .key-mode").forEach((b) => b.classList.toggle("sel", b.dataset.mode === (minor ? "minor" : "major")));
}
function renderKeyNotes(mode) {
  const suffix = mode === "minor" ? "m" : "";
  $("keyPickPanel").dataset.mode = mode;
  const grid = $("keyPickPanel").querySelector(".key-notes");
  grid.innerHTML = "";
  NOTES.forEach((n) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key-note"; b.dataset.k = n + suffix; b.textContent = n + suffix;
    grid.appendChild(b);
  });
}
function buildKeyPicker() {
  const sel = $("fKey"), wrap = document.createElement("div");
  sel.style.display = "none";                              // nandoon pa rin siya (taguan ng value), pero hindi na kita
  wrap.id = "keyPick";
  wrap.innerHTML = '<button type="button" id="keyPickBtn"></button><div id="keyPickPanel"><div class="key-notes"></div><div class="key-mode-tabs"><button type="button" class="key-mode" data-mode="major">Major</button><button type="button" class="key-mode" data-mode="minor">Minor</button></div></div>';
  sel.after(wrap);
  renderKeyNotes("major");
  $("keyPickBtn").onclick = (e) => { e.stopPropagation(); wrap.classList.toggle("open"); };
  $("keyPickPanel").onclick = (e) => {
    const mode = e.target.closest(".key-mode");
    if (mode) { renderKeyNotes(mode.dataset.mode); syncKey(); return; }
    const b = e.target.closest("button"); if (!b) return;
    sel.value = b.dataset.k; syncKey(); wrap.classList.remove("open");
  };
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) wrap.classList.remove("open"); });   // pindutin ang labas = isara
  syncKey();
}
function fillForm(s) {                    // s = kantang ie-edit, o {} para sa bago
  editingId = s.id || null;
  $("fTitle").value = s.title || ""; $("fBy").value = s.artist || ""; $("fBpm").value = s.bpm || "";
  $("fKey").value = s.song_key || ""; $("fChords").value = s.chords || "";
  document.querySelectorAll("#keyList input").forEach((i) => (i.value = (s.singers || {})[i.dataset.key] || ""));
  syncKey();
}

$("saveBtn").onclick = () => {
  const title = $("fTitle").value.trim();
  if (!title) return toast("Please enter a Song Title.");
  const singers = {};
  document.querySelectorAll("#keyList input").forEach((i) => { if (i.value.trim()) singers[i.dataset.key] = i.value.trim(); });
  const song = { id: editingId || crypto.randomUUID(), title, artist: $("fBy").value.trim(), song_key: $("fKey").value,
                 bpm: $("fBpm").value.trim(), chords: $("fChords").value, singers };
  guard(async () => {
    await DB.saveSong(song);
    const i = songs.findIndex((x) => x.id === song.id);
    if (i >= 0) songs[i] = song; else songs.push(song);
    songs.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true }));
    renderDelList();
    fillForm({});                                          // linisin ang form, handa na para sa susunod na kanta
    const b = $("saveBtn"); b.textContent = "SAVED \u2713";   // maliit na palatandaan sa mismong button
    setTimeout(() => (b.textContent = "SAVE"), 1500);
  });
};

/* ===== EDIT PANEL (kanan): pindutin ang title = i-edit sa form, X = burahin ===== */
function renderDelList() {
  const q = $("delSearch").value.trim().toLowerCase();
  $("delList").innerHTML = "";
  songs.filter((s) => s.title.toLowerCase().includes(q)).forEach((s) => {
    const li = document.createElement("li"), t = document.createElement("button"), b = document.createElement("button");
    t.className = "pick-title"; t.textContent = s.title; t.title = "Edit";
    t.onclick = () => editSong(s);
    b.className = "x-btn"; b.textContent = "\u00D7"; b.title = "Delete";
    b.onclick = () => deleteSong(s);
    if (s.id === editingId) li.classList.add("editing");   // naka-highlight ang kasalukuyang ine-edit
    li.append(t, b); $("delList").appendChild(li);
  });
  if (!$("delList").children.length) {
    const li = document.createElement("li"); li.className = "empty"; li.textContent = "No songs found"; $("delList").appendChild(li);
  }
}
function editSong(s) {
  fillForm(s);                                           // lalabas sa form sa kaliwa (kung saan mo siya unang tinype)
  if (window.matchMedia("(max-width: 800px)").matches) $("delPanel").classList.remove("open");   // phone: isara para kita ang form
  else renderDelList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function deleteSong(s) {
  guard(async () => {
    await DB.deleteSong(s.id);
    songs = songs.filter((x) => x.id !== s.id);
    if (editingId === s.id) fillForm({});                // kung yun ang naka-edit, linisin ang form
    renderDelList();
  });
}
$("editBtn").onclick = () => {
  const open = $("delPanel").classList.toggle("open");   // pindutin ulit = isara
  if (open) { $("delSearch").value = ""; renderDelList(); $("delSearch").focus(); }
};
document.addEventListener("click", (e) => {
  if (!$("delPanel").contains(e.target) && e.target !== $("editBtn")) $("delPanel").classList.remove("open");
});
$("newBtn").onclick = () => { fillForm({}); renderDelList(); };   // blangkong form para sa bagong kanta
$("delSearch").oninput = renderDelList;

$("logoutBtn").onclick = async () => { await DB.logout(); location.href = "index.html"; };   // burahin ang login sa device na ito

buildForm();
DB.getSongs().then((s) => { songs = s; }).catch((e) => toast("Failed to load data: " + e.message));
}
