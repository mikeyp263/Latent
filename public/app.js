import { TRACKS } from "./content.js";

/* ---------- state ---------- */
const KEY = "latent-v1";
const blank = () => ({ done: {}, xp: 0, days: {}, streak: 0, last: null, miss: {}, seen: {}, termOk: {}, track: "op" });
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = { ...blank(), ...JSON.parse(raw) }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const yday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function liveStreak() { return S.last === today() || S.last === yday() ? S.streak : 0; }
function award(xp) {
  const t = today();
  if (S.last !== t) { S.streak = S.last === yday() ? S.streak + 1 : 1; S.last = t; }
  S.xp += xp; S.days[t] = (S.days[t] || 0) + xp; save();
}

/* ---------- content index ---------- */
const LESSONS = [];
for (const tr of TRACKS) tr.units.forEach((u, ui) => u.lessons.forEach((l) => LESSONS.push({ ...l, track: tr, unit: u, ui })));
const byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
const TERMS = LESSONS.flatMap((l) => l.terms.map(([k, v]) => ({ k, v, lid: l.id, track: l.track }))).sort((a, b) => a.k.replace(/^\W+/, "").localeCompare(b.k.replace(/^\W+/, "")));

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const view = $("#view");
const tabs = $("#tabs");
const qKey = (lid, i) => `${lid}:${i}`;

const ICON = {
  learn: '<svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h12v14H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12"/></svg>',
  review: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg>',
  terms: '<svg viewBox="0 0 24 24"><path d="M5 4h14M5 9h14M5 14h9M5 19h6"/></svg>',
  me: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-6 5-6 9-1-1-2-2-2-3-1 2-1 4-1 6 0 4 3 7 7 7Z"/></svg>',
};

/* ---------- tabs ---------- */
let tab = "learn";
function renderTabs() {
  const t = [["learn", "Learn"], ["review", "Review"], ["terms", "Glossary"], ["me", "Progress"]];
  tabs.innerHTML = t.map(([k, n]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${ICON[k]}<span>${n}</span></button>`).join("");
}
tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { tab = b.dataset.tab; go(); } });

function topbar(title) {
  return `<header class="top"><div class="brand"><span class="mark"></span>${title}</div>
    <div class="pills"><span class="pill" title="Day streak">${ICON.flame}${liveStreak()}</span><span class="pill" title="Total XP">${ICON.bolt}${S.xp}</span></div></header>`;
}

function go() {
  tabs.hidden = false; renderTabs(); window.scrollTo(0, 0);
  ({ learn: Learn, review: Review, terms: Glossary, me: Me })[tab]();
}

/* ---------- Learn ---------- */
function Learn() {
  const tr = TRACKS.find((t) => t.id === S.track) || TRACKS[0];
  document.body.dataset.c = tr.c;
  const all = tr.units.flatMap((u) => u.lessons);
  const next = all.find((l) => !S.done[l.id]);
  const pct = Math.round((all.filter((l) => S.done[l.id]).length / all.length) * 100);
  view.innerHTML = `<div class="wrap">${topbar("Latent")}
    <div class="seg" role="tablist">${TRACKS.map((t) => `<button data-c="${t.c}" aria-selected="${t.id === tr.id}" data-track="${t.id}">${t.name}</button>`).join("")}</div>
    <section class="hero">
      <div class="hero-k">${esc(tr.tag)}</div>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="hero-row"><span>${pct}% complete</span>${next ? `<button class="btn" data-open="${next.id}">${S.done[all[0].id] ? "Continue" : "Start"}: ${esc(next.t)}</button>` : `<span class="ok">Track complete</span>`}</div>
    </section>
    ${tr.units.map((u, ui) => `<section class="unit"><div class="unit-h"><span class="mono">U${ui + 1}</span>${esc(u.t)}</div>
      <ol class="path">${u.lessons.map((l) => {
        const st = S.done[l.id] ? "done" : next && l.id === next.id ? "next" : "";
        return `<li><button class="node ${st}" data-open="${l.id}"><span class="dot">${st === "done" ? ICON.check : ""}</span><span class="nt">${esc(l.t)}<small>${l.terms.length} terms · ${l.qs.length} scenarios</small></span></button></li>`;
      }).join("")}</ol></section>`).join("")}
    ${tr.id === "nw" ? `<p class="note">Want something newer covered? Just ask Claude to add a What's New lesson on it.</p>` : ""}
  </div>`;
  view.onclick = (e) => {
    const t = e.target.closest("[data-track]"); if (t) { S.track = t.dataset.track; save(); Learn(); return; }
    const o = e.target.closest("[data-open]"); if (o) Lesson(byId[o.dataset.open]);
  };
}

/* ---------- Lesson runner ---------- */
function buildQ(l, i) {
  const [q, a, ...rest] = l.qs[i];
  const why = rest.pop();
  return { lid: l.id, i, q, a, opts: shuffle([a, ...rest]), why };
}

function Lesson(l) {
  document.body.dataset.c = l.track.c;
  const steps = [...l.cards.map((c, i) => ({ k: "card", c, i })), { k: "terms" }, ...l.qs.map((_, i) => ({ k: "q", q: buildQ(l, i) })), { k: "ex" }];
  runSession({ title: l.t, steps, lesson: l, onDone: (stats) => {
    const first = !S.done[l.id];
    S.done[l.id] = Date.now(); l.terms.forEach(([k]) => (S.termOk[k] = S.termOk[k] || 0));
    award((first ? 20 : 8) + stats.right * 2);
    Finish({ l, stats, first });
  } });
}

function runSession({ title, steps, lesson, onDone }) {
  tabs.hidden = true; view.onclick = null;
  let idx = 0; const stats = { right: 0, wrong: 0 }; const retried = new Set();
  const draw = () => {
    const s = steps[idx];
    const prog = Math.round((idx / steps.length) * 100);
    view.innerHTML = `<div class="wrap lesson">
      <header class="ltop"><button class="ib" data-quit aria-label="Close">${ICON.x}</button><div class="meter"><i style="width:${prog}%"></i></div></header>
      <div class="stage" id="stage"></div></div>`;
    const st = $("#stage");
    $("[data-quit]").onclick = () => go();
    if (s.k === "card") {
      st.innerHTML = `<div class="eyebrow">${esc(title)} · ${s.i + 1}/${lesson.cards.length}</div><div class="card">${md(s.c)}</div>
        <div class="foot"><button class="btn wide" id="nx">Continue</button></div>`;
    } else if (s.k === "terms") {
      st.innerHTML = `<div class="eyebrow">New vocabulary</div><h2>Words to own</h2>
        <dl class="terms">${lesson.terms.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        <div class="foot"><button class="btn wide" id="nx">Test me</button></div>`;
    } else if (s.k === "q") {
      const q = s.q;
      st.innerHTML = `<div class="eyebrow">${s.retry ? "Try again" : "Scenario"}</div><h2 class="q">${md(q.q)}</h2>
        <div class="opts">${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${md(o)}</button>`).join("")}</div>
        <div class="foot" id="fb"></div>`;
      st.querySelector(".opts").onclick = (e) => {
        const b = e.target.closest(".opt"); if (!b || st.dataset.ans) return;
        st.dataset.ans = 1;
        const ok = q.opts[+b.dataset.i] === q.a;
        st.querySelectorAll(".opt").forEach((x, i) => { if (q.opts[i] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); x.disabled = true; });
        const k = qKey(q.lid, q.i); S.seen[k] = Date.now();
        if (ok) { stats.right++; if (S.miss[k]) S.miss[k] = Math.max(0, S.miss[k] - 1); }
        else { stats.wrong++; S.miss[k] = (S.miss[k] || 0) + 1; if (!retried.has(k)) { retried.add(k); const r = { k: "q", q: { ...q, opts: shuffle(q.opts) }, retry: true }; const exAt = steps.findIndex((x, j) => j > idx && x.k === "ex"); exAt < 0 ? steps.push(r) : steps.splice(exAt, 0, r); } }
        save();
        $("#fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "Correct." : "Not quite."}</b> ${md(q.why)}</div><button class="btn wide" id="nx">Continue</button>`;
        $("#nx").onclick = next;
      };
      return;
    } else if (s.k === "ex") {
      st.innerHTML = `<div class="eyebrow">Explain it back</div><h2 class="q">${md(lesson.ex[0])}</h2>
        <textarea id="ta" rows="5" placeholder="Say it in your own words. Typing it out is what makes it stick."></textarea>
        <div class="foot" id="fb"><button class="btn wide" id="rv">Compare with an expert answer</button></div>`;
      $("#rv").onclick = () => {
        $("#fb").innerHTML = `<div class="expert"><div class="eyebrow">How an expert would say it</div>${md(lesson.ex[1])}</div>
          <div class="rate"><span>How did you do?</span><div><button class="chip" data-r="2">Nailed it</button><button class="chip" data-r="1">Partly</button><button class="chip" data-r="0">Missed it</button></div></div>`;
        $(".rate").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; const k = `${lesson.id}:ex`; if (r < 2) S.miss[k] = (S.miss[k] || 0) + 1; else delete S.miss[k]; save(); next(); };
      };
      return;
    }
    $("#nx").onclick = next;
  };
  const next = () => { idx++; if (idx >= steps.length) onDone(stats); else draw(); };
  draw();
}

function Finish({ l, stats, first }) {
  const xp = (first ? 20 : 8) + stats.right * 2;
  const tr = l.track; const all = tr.units.flatMap((u) => u.lessons); const nxt = all.find((x) => !S.done[x.id]);
  view.innerHTML = `<div class="wrap lesson"><div class="stage done">
    <div class="burst">${ICON.check}</div><h1>${esc(l.t)}</h1>
    <div class="stats"><div><b>+${xp}</b><span>XP</span></div><div><b>${stats.right}/${stats.right + stats.wrong}</b><span>correct</span></div><div><b>${liveStreak()}</b><span>day streak</span></div></div>
    <p class="muted">${l.terms.length} terms added to your glossary${stats.wrong ? ". Misses will come back in Review." : "."}</p>
    <div class="foot">${nxt ? `<button class="btn wide" id="nl">Next: ${esc(nxt.t)}</button>` : ""}<button class="btn ghost wide" id="hm">Back to path</button></div>
  </div></div>`;
  $("#hm").onclick = () => { tab = "learn"; go(); };
  if (nxt) $("#nl").onclick = () => Lesson(nxt);
}

/* ---------- Review ---------- */
function reviewPool() {
  const pool = [];
  for (const l of LESSONS) if (S.done[l.id]) l.qs.forEach((_, i) => pool.push({ l, i }));
  return pool;
}
function Review() {
  document.body.dataset.c = "cyan";
  const doneN = LESSONS.filter((l) => S.done[l.id]).length;
  const misses = Object.entries(S.miss).filter(([k, v]) => v > 0 && !k.endsWith(":ex")).length;
  const learnedTerms = TERMS.filter((t) => S.done[t.lid]);
  view.innerHTML = `<div class="wrap">${topbar("Review")}
    ${doneN === 0 ? `<div class="empty"><h2>Nothing to review yet</h2><p class="muted">Finish a lesson and its scenarios and terms show up here, with the ones you miss coming back more often.</p></div>` : `
    <button class="big" id="mix"><span class="eyebrow">Scenario mix</span><b>10 questions</b><span class="muted">${misses ? `${misses} you've missed get priority` : "From everything you've finished"}</span></button>
    <button class="big" id="drill"><span class="eyebrow">Term drill</span><b>${Math.min(15, learnedTerms.length)} terms</b><span class="muted">See the word, define it in your head, flip</span></button>
    <button class="big" id="explain"><span class="eyebrow">Explain-it-back</span><b>3 prompts</b><span class="muted">The fastest way to find what you don't really know</span></button>`}
  </div>`;
  view.onclick = (e) => {
    if (e.target.closest("#mix")) {
      const p = reviewPool().map((x) => ({ ...x, s: (S.miss[qKey(x.l.id, x.i)] || 0) * 10 + Math.min(10, (Date.now() - (S.seen[qKey(x.l.id, x.i)] || 0)) / 864e5) + Math.random() * 4 }))
        .sort((a, b) => b.s - a.s).slice(0, 10);
      runSession({ title: "Review", steps: shuffle(p).map((x) => ({ k: "q", q: buildQ(x.l, x.i) })), lesson: null, onDone: (st) => { award(5 + st.right * 2); ReviewDone(st); } });
    } else if (e.target.closest("#drill")) Drill(learnedTerms);
    else if (e.target.closest("#explain")) {
      const done = LESSONS.filter((l) => S.done[l.id]);
      const pick = done.map((l) => ({ l, s: (S.miss[`${l.id}:ex`] || 0) * 10 + Math.random() * 5 })).sort((a, b) => b.s - a.s).slice(0, 3);
      let i = 0;
      const nextEx = () => { if (i >= pick.length) { award(10); ReviewDone({ right: pick.length, wrong: 0, ex: true }); return; } const l = pick[i++].l; runSession({ title: l.t, steps: [{ k: "ex" }], lesson: l, onDone: nextEx }); };
      nextEx();
    }
  };
}
function ReviewDone(st) {
  view.innerHTML = `<div class="wrap lesson"><div class="stage done"><div class="burst">${ICON.check}</div><h1>Review done</h1>
    ${st.ex ? "" : `<div class="stats"><div><b>${st.right}/${st.right + st.wrong}</b><span>correct</span></div><div><b>${liveStreak()}</b><span>day streak</span></div></div>`}
    <div class="foot"><button class="btn wide" id="hm">Back</button></div></div></div>`;
  $("#hm").onclick = () => { tab = "review"; go(); };
}
function Drill(terms) {
  const deck = terms.map((t) => ({ t, s: -(S.termOk[t.k] || 0) * 3 + Math.random() * 4 })).sort((a, b) => b.s - a.s).slice(0, 15).map((x) => x.t);
  let i = 0, known = 0; tabs.hidden = true; view.onclick = null;
  const draw = () => {
    if (i >= deck.length) { award(5 + known); ReviewDone({ right: known, wrong: deck.length - known }); return; }
    const t = deck[i];
    view.innerHTML = `<div class="wrap lesson"><header class="ltop"><button class="ib" data-quit>${ICON.x}</button><div class="meter"><i style="width:${(i / deck.length) * 100}%"></i></div></header>
      <div class="stage"><div class="eyebrow">${i + 1} of ${deck.length}</div><button class="flip" id="fl"><b>${esc(t.k)}</b><span class="muted">Define it in your head, then tap</span></button><div class="foot" id="fb"></div></div></div>`;
    $("[data-quit]").onclick = () => { tab = "review"; go(); };
    $("#fl").onclick = () => {
      $("#fl").innerHTML = `<b>${esc(t.k)}</b><span>${esc(t.v)}</span>`; $("#fl").disabled = true;
      $("#fb").innerHTML = `<div class="rate"><span>Did you know it?</span><div><button class="chip" data-r="1">Knew it</button><button class="chip" data-r="0">Didn't</button></div></div>`;
      $(".rate").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; S.termOk[t.k] = Math.max(0, (S.termOk[t.k] || 0) + (r ? 1 : -1)); known += r; save(); i++; draw(); };
    };
  };
  draw();
}

/* ---------- Glossary ---------- */
function Glossary() {
  document.body.dataset.c = "cyan";
  let q = "", only = false;
  view.innerHTML = `<div class="wrap">${topbar("Glossary")}
    <div class="search"><input id="s" type="search" placeholder="Search ${TERMS.length} terms" autocomplete="off"><label class="tog"><input type="checkbox" id="only"> Learned only</label></div>
    <div id="gl"></div></div>`;
  const list = () => {
    const f = TERMS.filter((t) => (!only || S.done[t.lid]) && (!q || (t.k + " " + t.v).toLowerCase().includes(q)));
    $("#gl").innerHTML = f.length ? f.map((t) => `<div class="gt ${S.done[t.lid] ? "" : "locked"}" data-c="${t.track.c}"><div class="gk">${esc(t.k)}${S.done[t.lid] ? "" : '<span class="tag">not learned yet</span>'}</div><div class="gv">${esc(t.v)}</div><button class="gl" data-open="${t.lid}">${esc(byId[t.lid].t)} ›</button></div>`).join("") : `<p class="muted">No matches.</p>`;
  };
  $("#s").oninput = (e) => { q = e.target.value.trim().toLowerCase(); list(); };
  $("#only").onchange = (e) => { only = e.target.checked; list(); };
  view.onclick = (e) => { const o = e.target.closest("[data-open]"); if (o) Lesson(byId[o.dataset.open]); };
  list();
}

/* ---------- Progress ---------- */
function Me() {
  document.body.dataset.c = "cyan";
  const days = [...Array(7)].map((_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; return { l: "SMTWTFS"[d.getDay()], v: S.days[key] || 0 }; });
  const mx = Math.max(30, ...days.map((d) => d.v));
  const learned = TERMS.filter((t) => S.done[t.lid]).length;
  view.innerHTML = `<div class="wrap">${topbar("Progress")}
    <div class="statgrid"><div><b>${S.xp}</b><span>Total XP</span></div><div><b>${liveStreak()}</b><span>Day streak</span></div><div><b>${learned}<small>/${TERMS.length}</small></b><span>Terms learned</span></div><div><b>${Object.keys(S.done).length}<small>/${LESSONS.length}</small></b><span>Lessons</span></div></div>
    <section class="panel"><div class="eyebrow">This week</div><div class="bars">${days.map((d) => `<div><i style="height:${(d.v / mx) * 100}%"></i><span>${d.l}</span></div>`).join("")}</div></section>
    <section class="panel"><div class="eyebrow">Tracks</div>${TRACKS.map((t) => { const all = t.units.flatMap((u) => u.lessons); const n = all.filter((l) => S.done[l.id]).length; return `<div class="trow" data-c="${t.c}"><span>${t.name}</span><div class="meter sm"><i style="width:${(n / all.length) * 100}%"></i></div><span class="mono">${n}/${all.length}</span></div>`; }).join("")}</section>
    <button class="btn ghost wide" id="reset">Reset progress</button>
  </div>`;
  $("#reset").onclick = (e) => { if (e.target.dataset.sure) { S = blank(); save(); go(); } else { e.target.dataset.sure = 1; e.target.textContent = "Tap again to erase everything"; } };
}

go();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
