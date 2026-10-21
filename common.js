/* ============================================================
   common.js = mga bagay na ginagamit ng LAHAT ng pages
   (transpose, pagpapakita ng chords, login guard)
   ============================================================ */
const $ = (id) => document.getElementById(id);
const NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const FLATS = { Bb: "A#", Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#" };
const CHORD = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M)?\d*(?:sus\d?|add\d+)?)(?:\/([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M)?\d*(?:sus\d?|add\d+)?))?$/;
const shift = (n, st) => NOTES[(((NOTES.indexOf(FLATS[n] || n) + st) % 12) + 12) % 12];
const isChordLine = (l) => l.trim() !== "" && l.trim().split(/\s+/).every((w) => CHORD.test(w)); // lahat chord = chord line
const transposeLine = (l, st) => l.replace(/\S+/g, (w) => { const m = w.match(CHORD); return shift(m[1], st) + m[2] + (m[3] ? "/" + shift(m[3], st) + m[4] : ""); });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escRepeat = (s) => esc(s).replace(/\(\s*\d+\s*[xX]\s*\)/g, (m) => '<span class="repeat-mark">' + m + "</span>");

// Maliit na mensahe sa loob ng page (para sa error lang), kusang nawawala
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// In-page login box (email + password) para sa Supabase. tryLogin(email, pw) -> error text o null kung tama.
function loginBox(tryLogin) {
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "pw-overlay";
    ov.innerHTML =
      '<form class="pw-card" autocomplete="on">' +
      '<div class="pw-lock">&#128273;</div><h2>Login</h2>' +
      '<input id="lgEmail" type="email" placeholder="Email" autocomplete="username">' +
      '<input id="lgPass" type="password" placeholder="Password" autocomplete="current-password">' +
      '<div class="pw-err" id="lgErr"></div>' +
      '<div class="pw-actions"><button type="button" class="pill grey" id="lgCancel">CANCEL</button>' +
      '<button type="submit" class="pill">LOGIN</button></div></form>';
    document.body.appendChild(ov);
    const card = ov.firstChild, em = $("lgEmail"), pw = $("lgPass"), err = $("lgErr");
    const done = (ok) => { document.removeEventListener("keydown", onKey); ov.remove(); resolve(ok); };
    const onKey = (e) => { if (e.key === "Escape") done(false); };
    document.addEventListener("keydown", onKey);
    card.onsubmit = async (e) => {
      e.preventDefault();
      const msg = await tryLogin(em.value.trim(), pw.value);
      if (!msg) return done(true);
      err.textContent = msg; pw.value = ""; pw.focus();
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    };
    $("lgCancel").onclick = () => done(false);
    ov.onmousedown = (e) => { if (e.target === ov) done(false); };
    em.focus();
  });
}

// Login + error handling (hihingi lang ng login kung kailangan)
async function guard(fn) {
  try { if (await DB.ensureLogin()) await fn(); } catch (e) { toast("Error: " + (e.message || e)); }
}

// ----- Panel ng kanta (title, key, bpm, transpose, chords) -----
let current = null, transpose = 0;
const TRANSPOSE_STORAGE_KEY = "songTransposes";
const songTransposes = new Map(Object.entries(JSON.parse(localStorage.getItem(TRANSPOSE_STORAGE_KEY) || "{}")));
function saveTranspose(songId, steps) {
  songTransposes.set(String(songId), steps);
  localStorage.setItem(TRANSPOSE_STORAGE_KEY, JSON.stringify(Object.fromEntries(songTransposes)));
}
const MAX_TR = 6;   // LIMIT ng transpose: -6 hanggang +6 (palitan ang numero kung gusto mo)
function openSong(s) {
  current = s; transpose = Number(songTransposes.get(String(s.id)) ?? 0);
  // Phone: ang Back button/gesture ng phone ang pambalik sa listahan (walang nakikitang arrow)
  if (PHONE.matches && !document.body.classList.contains("show-song")) { try { history.pushState({ song: 1 }, ""); } catch (e) {} }
  document.body.classList.add("show-song"); showSong();
}
window.addEventListener("popstate", () => document.body.classList.remove("show-song", "lineup-song"));
// Isang line ng chords/lyrics -> HTML. Tinatranspose ang chords kahit kasama ng lyrics.
// Pwede ring [C] na bracket style: "[C]Amazing [G]grace"
function renderLine(l, st) {
  if (isChordLine(l)) return '<span class="chord">' + escRepeat(transposeLine(l, st)) + "</span>";
  const parts = l.split(/(\s+|\|:?|:\|)/).filter((x) => x !== "");   // hiwalay din ang bar lines (|, |:, :|) para maayos kahit walang space: D|F#m|G|A|
  const sym = (t) => t !== undefined && /\S/.test(t) && !/[A-Za-z0-9]/.test(t);   // simbolo lang (| : |: atbp.), walang letra
  return parts.map((w, i) => {
    if (!w.trim()) return esc(w);
    const br = w.match(/^\[(.+)\]$/), core = br ? br[1] : w, m = core.match(CHORD);
    if (!m) return escRepeat(w);
    // Ang "A" na mag-isa sa gitna ng lyrics ay English "A" (hindi chord), maliban kung may 2+ space sa tabi niya
    // Pero kapag may bar line (| |: :) sa tabi niya, chord siya (halimbawa "G | A |:")
    if (!br && core === "A" && !(sym(parts[i - 2]) || sym(parts[i - 1]) || sym(parts[i + 1]) || sym(parts[i + 2]))) {
      const sp = parts[i + 1] || "", nxt = parts[i + 2];
      if (sp && sp.length < 2 && nxt !== undefined && !CHORD.test(nxt)) return esc(w);
    }
    const t = shift(m[1], st) + m[2] + (m[3] ? "/" + shift(m[3], st) + m[4] : "");
    return '<span class="chord">' + esc(br ? "[" + t + "]" : t) + "</span>";
  }).join("");
}

const PHONE = window.matchMedia("(max-width: 800px)");
// Sa phone: liliit nang bahagya ang letra kung kailangan para kasya ang buong linya (walang side-scroll, para swipe ang gagana)
function fitChords() {
  const c = $("chords"); c.style.fontSize = "";
  if (!PHONE.matches) return;
  const base = parseFloat(getComputedStyle(c).fontSize);
  if (c.scrollWidth <= c.clientWidth + 1) return;
  c.style.fontSize = "8px";
  if (c.scrollWidth > c.clientWidth + 1) return;
  let low = 8, high = base;
  for (let i = 0; i < 7; i++) {
    const mid = (low + high) / 2;
    c.style.fontSize = mid + "px";
    if (c.scrollWidth > c.clientWidth + 1) high = mid;
    else low = mid;
  }
  c.style.fontSize = low + "px";
}
function showSong() {
  const s = current, key = shift(s.song_key || "A", transpose), singer = (s.singers || {})[key]; // singer ng bagong key
  $("songTitle").textContent = s.title;
  $("songKey").textContent = "Key: " + key + (singer ? " (" + singer + ")" : "");
  $("songBpm").textContent = "Bpm: " + (s.bpm || "");
  $("trValue").textContent = (transpose > 0 ? "+" : "") + transpose;
  $("trPlus").disabled = transpose >= MAX_TR; $("trMinus").disabled = transpose <= -MAX_TR;   // dim kapag nasa limit na
  $("chords").innerHTML = (s.chords || "").split("\n").map((l) => renderLine(l, transpose)).join("\n");
  fitChords();
}
if ($("trPlus")) {   // wala ang panel sa Developer Page
  $("trPlus").onclick = () => { if (current && transpose < MAX_TR) { transpose++; saveTranspose(current.id, transpose); showSong(); } };
  $("trMinus").onclick = () => { if (current && transpose > -MAX_TR) { transpose--; saveTranspose(current.id, transpose); showSong(); } };
  $("backBtn").onclick = () => document.body.classList.remove("show-song");   // phone: balik sa listahan
}
// ----- SWIPE (PHONE LANG): ang BUONG set (title, key, bpm, transpose, chords) ang gumagalaw -----
// kaliwa = susunod na kanta, kanan = nakaraang kanta
let navList = [];   // listahan ng kantang nilalakbay (itinatakda ng bawat page: main = nasa search, lineup = nasa line up)
function swipeTo(dir) {                                          // dir: +1 susunod, -1 nakaraan. Return true kung nalipat
  if (!current) return false;
  const i = navList.findIndex((x) => x.id === current.id), next = navList[i + dir];
  if (i < 0 || !next) return false;                              // dulo na ng listahan
  openSong(next);
  $("chords").scrollTop = 0;
  $("panel").animate([{ transform: "translateX(" + dir * 70 + "px)", opacity: 0.2 }, { transform: "none", opacity: 1 }],
                     { duration: 240, easing: "ease-out" });     // papasok ang bagong set mula sa gilid
  return true;
}
if ($("panel")) {
  const P = $("panel");
  let x0, y0, t0, ok = false, drag = false, dragX = 0;
  P.addEventListener("touchstart", (e) => {
    ok = PHONE.matches && e.touches.length === 1; drag = false;
    dragX = 0; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  P.addEventListener("touchmove", (e) => {
    if (!ok) return;
    const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (!drag && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) drag = true;
    if (drag) { dragX = dx; P.style.transform = "translateX(" + dx * 0.6 + "px)"; P.style.opacity = 1 - Math.min(Math.abs(dx) / 400, 0.5); }   // sumusunod sa daliri
  }, { passive: true });
  const resetDrag = () => {
    const from = dragX * 0.6;
    ok = drag = false;
    dragX = 0;
    P.style.transform = ""; P.style.opacity = "";
    if (from) P.animate([{ transform: "translateX(" + from + "px)" }, { transform: "none" }], { duration: 180, easing: "ease-out" });
  };
  P.addEventListener("touchend", (e) => {
    if (!ok) return;
    if (!drag) { ok = false; return; }
    const dx = e.changedTouches[0].clientX - x0, from = dx * 0.6;
    P.style.transform = ""; P.style.opacity = ""; ok = drag = false; dragX = 0;
    const commit = Math.abs(dx) > 80 || (Math.abs(dx) > 40 && Date.now() - t0 < 250);
    if (commit && swipeTo(dx < 0 ? 1 : -1)) return;
    P.animate([{ transform: "translateX(" + from + "px)" }, { transform: "none" }], { duration: 200, easing: "ease-out" });   // bumalik kung hindi tumuloy
  }, { passive: true });
  P.addEventListener("touchcancel", () => resetDrag(), { passive: true });
}

window.addEventListener("resize", () => { if (current && $("chords")) fitChords(); });

// Gumawa ng isang row ng listahan: title (pindutin = buksan) + button sa kanan
function fitSongTitle(title) {
  title.style.fontSize = "";
  const minSize = 11;
  let size = parseFloat(getComputedStyle(title).fontSize) || 20;
  while (title.scrollWidth > title.clientWidth + 1 && size > minSize) {
    size = Math.max(minSize, size - 0.5);
    title.style.fontSize = size + "px";
  }
}
function fitSongTitles() { document.querySelectorAll(".song-title").forEach(fitSongTitle); }
let titleFitScheduled = false;
function scheduleFitSongTitles() {
  if (titleFitScheduled) return;
  titleFitScheduled = true;
  requestAnimationFrame(() => { titleFitScheduled = false; fitSongTitles(); });
}
window.addEventListener("resize", fitSongTitles);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSongTitles);
function songRow(s, btnClass, btnText, onBtn) {
  const li = document.createElement("li"), t = document.createElement("button"), b = document.createElement("button");
  t.className = "song-title"; t.textContent = s.title; t.onclick = () => openSong(s);
  b.className = btnClass; b.textContent = btnText; b.onclick = onBtn;
  li.append(t, b);
  scheduleFitSongTitles();
  return li;
}

/* ===== PASSWORD NG DEVELOPER PAGE ===== */
const DEV_HASH = "9d65e801f0b61c897d38b0ae4e2a14f2f91a3c48034a6b9ba81dac197c82731d";   // SHA-256 ng Developer code dbag123
const DEV_UNLOCK_KEY = "developerUnlocked";
async function sha256(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// Lalabas ang code box sa bawat pagbukas ng Developer Page.
function unlock() {
  if (localStorage.getItem(DEV_UNLOCK_KEY) === "true") return Promise.resolve(true);
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "pw-overlay";
    ov.innerHTML =
      '<form class="pw-card" autocomplete="off">' +
      '<div class="pw-lock">&#128274;</div>' +
      "<h2>Developer Access</h2>" +
      '<input id="pwInput" type="password" placeholder="Developer code" autocomplete="off">' +
      '<div class="pw-err" id="pwErr"></div>' +
      '<div class="pw-actions"><button type="button" class="pill grey" id="pwCancel">CANCEL</button>' +
      '<button type="submit" class="pill">ENTER</button></div></form>';
    document.body.appendChild(ov);
    const card = ov.firstChild, input = $("pwInput"), err = $("pwErr");
    const done = (ok) => { document.removeEventListener("keydown", onKey); ov.remove(); resolve(ok); };
    const onKey = (e) => { if (e.key === "Escape") done(false); };
    document.addEventListener("keydown", onKey);
    card.onsubmit = async (e) => {
      e.preventDefault();
      if ((await sha256(input.value)) === DEV_HASH) {
        localStorage.setItem(DEV_UNLOCK_KEY, "true");
        return done(true);
      }
      err.textContent = "Incorrect code.";
      input.value = ""; input.focus();
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");   // kumikislap na pagyanig
    };
    $("pwCancel").onclick = () => done(false);
    ov.onmousedown = (e) => { if (e.target === ov) done(false); };   // pindutin ang labas = isara
    input.focus();
  });
}
