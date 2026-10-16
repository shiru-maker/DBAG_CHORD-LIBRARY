/* ============================================================
   db.js = lahat ng usapan sa DATABASE ay nandito.
   1) Gumawa ng project sa supabase.com
   2) Ilagay sa baba ang Project URL at anon public key
      (Project Settings > API)
   Kapag blangko pa, gagamit muna ng LOCALSTORAGE (sa browser mo lang,
   pang-test) para gumana na agad ang website.
   ============================================================ */
const SUPABASE_URL = "https://pnyjfqtljgfcteflxgbx.supabase.co";   // halimbawa: "https://abcd1234.supabase.co"
const SUPABASE_KEY = "sb_publishable_Nkwzw7LAudTEgr2Iip0stw_2f-8AQ9S";   // anon public key (ligtas ito sa GitHub kung naka-RLS)

const sb = (SUPABASE_URL && SUPABASE_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }   // maaalala ang login sa device na ito hanggang mag-logout ka
    }) : null;

// Sample na kanta para sa test mode (walang Supabase)
const SAMPLE = [
  { id: "s1", title: "Praise 1", artist: "", song_key: "A", bpm: "120", singers: { A: "Lara", C: "Juan" },
    chords: "A            D\nSample lyrics here\nE            A\nSecond line here" },
  { id: "s2", title: "Praise 2", artist: "", song_key: "G", bpm: "100", singers: { G: "Maria" },
    chords: "G       C\nSample lyrics here\nD       G\nSecond line here" },
  { id: "s3", title: "Worship 1", artist: "", song_key: "D", bpm: "70", singers: { D: "Lara" },
    chords: "D       A/C#   Bm\nSample lyrics here\nG       A      D\nSecond line here" }
];
const local = (k, d) => JSON.parse(localStorage.getItem(k) || "null") || d;

const DB = {
  // Kunin ang lahat ng kanta (alphabetical ayon sa title, hindi mahalaga ang malaki/maliit na letra)
  async getSongs() {
    let list;
    if (!sb) list = local("songs", SAMPLE);
    else {
      const { data, error } = await sb.from("songs").select("*");
      if (error) throw error;
      list = data;
    }
    return [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true }));
  },
  // I-save (bago o na-edit na) na kanta
  async saveSong(song) {
    if (!sb) { const all = local("songs", SAMPLE).filter(s => s.id !== song.id); all.push(song); localStorage.setItem("songs", JSON.stringify(all)); return; }
    const { error } = await sb.from("songs").upsert(song);
    if (error) throw error;
  },
  // Burahin ang kanta (kasama sa line up kung nandoon)
  async deleteSong(id) {
    if (!sb) {
      localStorage.setItem("songs", JSON.stringify(local("songs", SAMPLE).filter(s => s.id !== id)));
    } else {
      const { data, error } = await sb.from("songs").delete().eq("id", id).select();   // .select() = ibalik ang nabura para makumpirma
      if (error) throw error;
      if (!data || !data.length) throw new Error("Could not delete from the database (no permission, or the song no longer exists).");
    }
    const ids = await this.getLineup();
    if (ids.includes(id)) await this.setLineup(ids.filter(x => x !== id));
  },
  // Line up = listahan ng song id sa tamang pagkakasunod-sunod
  async getLineup() {
    if (!sb) return local("lineup", []);
    const { data } = await sb.from("lineup").select("song_ids").eq("id", 1).maybeSingle();
    return (data && data.song_ids) || [];
  },
  async setLineup(ids) {
    if (!sb) { localStorage.setItem("lineup", JSON.stringify(ids)); return; }
    const { error } = await sb.from("lineup").upsert({ id: 1, song_ids: ids });
    if (error) throw error;
  },
  // Logout: buburahin ang naka-save na login sa device/browser na ito
  async logout() {
    if (sb) await sb.auth.signOut();
  },
  // Login: isang beses lang kada device. Pagka-login, hindi na hihingi hanggang mag-logout.
  async ensureLogin() {
    if (!sb) return true;
    const { data } = await sb.auth.getSession();
    if (data.session) return true;
    return loginBox(async (email, password) => {     // magandang login box sa loob ng page
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return error ? "Incorrect email or password." : null;
    });
  }
};
