import { TRACKS } from "./content.js";

/* ---------- state ---------- */
const KEY = "latent-v1";
const blank = () => ({ done: {}, xp: 0, days: {}, streak: 0, last: null, miss: {}, seen: {}, termOk: {}, track: "op", read: {} });
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = { ...blank(), ...JSON.parse(raw) }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const dkey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const today = () => dkey(new Date());
const yday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dkey(d); };
const liveStreak = () => (S.last === today() || S.last === yday() ? S.streak : 0);
function award(xp) {
  const t = today();
  if (S.last !== t) { S.streak = S.last === yday() ? S.streak + 1 : 1; S.last = t; }
  S.xp += xp; S.days[t] = (S.days[t] || 0) + xp; save();
}

/* ---------- data ---------- */
let BRIEFS = [], MODELS = { models: [] }, LESSONS = [], byId = {}, TERMS = [];
async function getJSON(p, fb) { try { const r = await fetch(p, { cache: "no-cache" }); if (r.ok) return await r.json(); } catch {} return fb; }
async function load() {
  const [b, m, x] = await Promise.all([getJSON("data/briefs.json", { editions: [] }), getJSON("data/models.json", { models: [] }), getJSON("data/lessons.json", { lessons: [] })]);
  BRIEFS = b.editions || []; MODELS = m;
  const nw = TRACKS.find((t) => t.id === "nw");
  const fresh = (x.lessons || []).slice().sort((a, c) => (c.added || "").localeCompare(a.added || ""));
  nw.units = nw.units.filter((u) => !u.news);
  if (fresh.length) nw.units.unshift({ t: "From the News", news: true, lessons: fresh });
  LESSONS = [];
  for (const tr of TRACKS) tr.units.forEach((u) => u.lessons.forEach((l) => LESSONS.push({ ...l, track: tr, unit: u })));
  byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  TERMS = LESSONS.flatMap((l) => l.terms.map(([k, v]) => ({ k, v, lid: l.id, track: l.track }))).sort((a, c) => a.k.replace(/^\W+/, "").localeCompare(c.k.replace(/^\W+/, "")));
}

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtDate = (iso, o = { weekday: "long", month: "long", day: "numeric" }) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", o); };
const daysAgo = (iso) => { if (!iso) return 999; const [y, m, d] = iso.split("-").map(Number); return Math.floor((Date.now() - new Date(y, m - 1, d)) / 864e5); };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const view = $("#view"), tabs = $("#tabs");
const qKey = (lid, i) => `${lid}:${i}`;
const ICON = {
  today: '<svg viewBox="0 0 24 24"><path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/></svg>',
  models: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4-9 4zM7 10v5c3 2 7 2 10 0v-5"/></svg>',
  terms: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5zM9 10h6M9 14h6M9 18h3"/></svg>',
  you: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/></svg>',
};

/* ---------- routing (hash, so back button works and nothing feels like a popup) ---------- */
const TABS = [["today", "Today"], ["models", "Models"], ["learn", "Learn"], ["terms", "Glossary"], ["you", "You"]];
function nav(h) { if (location.hash === "#" + h) route(); else location.hash = h; }
window.addEventListener("hashchange", route);
function route() {
  const [p, a] = (location.hash.slice(1) || "today").split("/");
  const tab = { lesson: "learn", review: "learn", drill: "learn", edition: "today", archive: "today" }[p] || p;
  tabs.innerHTML = TABS.map(([k, n]) => `<a href="#${k}" class="${k === tab ? "on" : ""}">${ICON[k]}<span>${n}</span></a>`).join("");
  view.onclick = null; window.scrollTo(0, 0);
  const R = { today: () => Today(BRIEFS[0]), edition: () => Today(BRIEFS.find((e) => e.id === a) || BRIEFS[0]), archive: Archive, models: Models, learn: Learn, terms: Glossary, you: You, lesson: () => Lesson(byId[a]), review: Review, drill: Drill }[p];
  (R || (() => Today(BRIEFS[0])))();
}
const bar = (title, back) => `<header class="bar">${back ? `<a class="back" href="#${back[0]}">${ICON.back}${esc(back[1])}</a>` : `<span class="logo">Latent</span>`}${title ? `<span class="bar-t">${esc(title)}</span>` : ""}<span class="streak" title="Day streak">${liveStreak()}<small>day</small></span></header>`;

/* ---------- Today (daily brief) ---------- */
function Today(e) {
  if (!e) { view.innerHTML = `<div class="page">${bar()}<p class="muted pad">No brief yet. Check back soon.</p></div>`; return; }
  S.read[e.id] = 1; save();
  const latest = e.id === BRIEFS[0].id;
  const [lead, ...rest] = e.stories;
  const fresh = LESSONS.filter((l) => l.added && daysAgo(l.added) <= 7);
  const newModels = (MODELS.models || []).filter((m) => daysAgo(m.released) <= 14).slice(0, 6);
  const next = LESSONS.find((l) => l.track.id === S.track && !S.done[l.id]) || LESSONS.find((l) => !S.done[l.id]);
  const story = (s, big) => `<article class="story ${big ? "lead" : ""}">
      <div class="kicker k-${esc(s.kicker.toLowerCase())}">${esc(s.kicker)}</div>
      <h2>${esc(s.headline)}</h2><p class="dek">${md(s.dek)}</p>
      <div class="why"><span>Why it matters</span>${md(s.why)}</div>
      <div class="story-foot">${(s.learn || []).filter((id) => byId[id]).map((id) => `<a class="learnlink" href="#lesson/${id}">${S.done[id] ? ICON.check : ICON.arrow}Learn: ${esc(byId[id].t)}</a>`).join("")}
      <div class="srcs">${(s.sources || []).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("")}</div></div></article>`;
  view.innerHTML = `<div class="page">${bar(latest ? "" : "", latest ? null : ["archive", "Editions"])}
    <section class="mast"><div class="mast-date">${fmtDate(e.date)} · ${esc(e.edition)} edition</div><h1>The Brief</h1></section>
    <nav class="quick">
      <a href="#models">${ICON.models}Models</a><a href="#learn">${ICON.learn}Learn</a><a href="#review">${ICON.check}Review</a><a href="#archive">${ICON.today}Past briefs</a>
    </nav>
    <section class="big-pic"><div class="eyebrow">The big picture</div><p>${md(e.bigPicture)}</p></section>
    ${lead ? story(lead, true) : ""}
    ${newModels.length && latest ? `<section class="rail"><div class="sec-h"><h3>New models</h3><a href="#models">All models ›</a></div>
      <div class="hscroll">${newModels.map((m) => `<a class="mcard" href="#models"><span class="lab">${esc(m.lab)}</span><b>${esc(m.name)}</b><span class="meta">${fmtDate(m.released, { month: "short", day: "numeric" })} · ${esc(m.access)}</span>${m.price ? `<span class="price">${esc(m.price)}</span>` : ""}</a>`).join("")}</div></section>` : ""}
    <div class="stories">${rest.map((s) => story(s)).join("")}</div>
    ${e.ahead?.length ? `<section class="ahead"><div class="sec-h"><h3>On the radar</h3></div>${e.ahead.map((a) => `<div class="ah"><span>${esc(a.when)}</span><p>${md(a.what)}</p></div>`).join("")}</section>` : ""}
    ${fresh.length && latest ? `<section class="rail"><div class="sec-h"><h3>New lessons from the news</h3></div>${fresh.map((l) => `<a class="row" href="#lesson/${l.id}"><span class="row-t">${esc(l.t)}<small>${l.terms.length} new terms</small></span>${S.done[l.id] ? `<span class="ok">${ICON.check}</span>` : ICON.arrow}</a>`).join("")}</section>` : ""}
    ${next ? `<a class="cont" href="#lesson/${next.id}"><div><div class="eyebrow">Keep learning · ${esc(next.track.name)}</div><b>${esc(next.t)}</b></div>${ICON.arrow}</a>` : ""}
    ${e.sources?.length ? `<p class="fine">More reading: ${e.sources.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(" · ")}</p>` : ""}
  </div>`;
}
function Archive() {
  view.innerHTML = `<div class="page">${bar("Past briefs", ["today", "Today"])}<div class="list">
    ${BRIEFS.map((e) => `<a class="row" href="#edition/${e.id}"><span class="row-t">${fmtDate(e.date, { weekday: "short", month: "short", day: "numeric" })} · ${esc(e.edition)}<small>${esc(e.stories[0]?.headline || "")}</small></span>${ICON.arrow}</a>`).join("")}
  </div></div>`;
}

/* ---------- Models ---------- */
let labF = "All";
function Models() {
  const ms = (MODELS.models || []).slice().sort((a, b) => (b.released || "0").localeCompare(a.released || "0"));
  const labs = ["All", ...new Set(ms.map((m) => m.lab))];
  const draw = () => {
    const f = ms.filter((m) => labF === "All" || m.lab === labF);
    view.innerHTML = `<div class="page">${bar()}<section class="mast sm"><div class="mast-date">Updated ${fmtDate(MODELS.updated, { month: "long", day: "numeric" })}</div><h1>Models</h1><p class="muted">Every model worth knowing, newest first. Prices are per million input / output tokens.</p></section>
      <div class="chips">${labs.map((l) => `<button class="chip ${l === labF ? "on" : ""}" data-lab="${esc(l)}">${esc(l)}</button>`).join("")}</div>
      <div class="list">${f.map((m) => `<article class="model">
        <div class="m-top"><span class="lab">${esc(m.lab)}</span>${daysAgo(m.released) <= 14 ? `<span class="new">New</span>` : ""}<span class="acc a-${esc(m.access.split(" ")[0].toLowerCase())}">${esc(m.access)}</span></div>
        <h3>${esc(m.name)}</h3>
        <div class="specs">${m.released ? `<span><small>Released</small>${fmtDate(m.released, { month: "short", day: "numeric", year: "numeric" })}</span>` : ""}${m.price ? `<span><small>Price</small>${esc(m.price)}</span>` : ""}${m.context ? `<span><small>Context</small>${esc(m.context)}</span>` : ""}</div>
        <p>${md(m.note)}</p>${m.link ? `<a class="src" href="${esc(m.link)}" target="_blank" rel="noopener">${esc(host(m.link))} ${ICON.ext}</a>` : ""}
      </article>`).join("")}</div></div>`;
    view.onclick = (e) => { const b = e.target.closest("[data-lab]"); if (b) { labF = b.dataset.lab; draw(); } };
  };
  draw();
}

/* ---------- Learn ---------- */
function Learn() {
  const tr = TRACKS.find((t) => t.id === S.track) || TRACKS[0];
  const all = tr.units.flatMap((u) => u.lessons);
  const n = all.filter((l) => S.done[l.id]).length;
  const next = all.find((l) => !S.done[l.id]);
  const due = Object.values(S.miss).filter((v) => v > 0).length;
  view.innerHTML = `<div class="page">${bar()}
    <section class="mast sm"><h1>Learn</h1></section>
    <div class="seg">${TRACKS.map((t) => `<button class="${t.id === tr.id ? "on" : ""}" data-track="${t.id}">${esc(t.name)}</button>`).join("")}</div>
    <section class="trackhead"><p>${esc(tr.tag)}</p><div class="meter"><i style="width:${(n / all.length) * 100}%"></i></div><span class="muted sm">${n} of ${all.length} lessons</span></section>
    ${Object.keys(S.done).length ? `<a class="cont alt" href="#review"><div><div class="eyebrow">Review</div><b>${due ? `${due} to brush up on` : "Keep it fresh"}</b></div>${ICON.arrow}</a>` : ""}
    ${tr.units.map((u, ui) => `<section class="unit"><div class="sec-h"><h3><span class="un">${u.news ? "NEW" : `Unit ${ui + (tr.units[0].news ? 0 : 1)}`}</span>${esc(u.t)}</h3></div>
      ${u.lessons.map((l) => `<a class="row lesson-row ${S.done[l.id] ? "is-done" : ""} ${next && l.id === next.id ? "is-next" : ""}" href="#lesson/${l.id}">
        <span class="lr-dot">${S.done[l.id] ? ICON.check : ""}</span><span class="row-t">${esc(l.t)}<small>${l.terms.length} terms · ${l.qs.length} scenarios${l.added ? ` · added ${fmtDate(l.added, { month: "short", day: "numeric" })}` : ""}</small></span>${ICON.arrow}</a>`).join("")}
    </section>`).join("")}
    ${tr.id === "nw" ? `<p class="fine">New lessons land here automatically when the news introduces a concept worth knowing.</p>` : ""}
  </div>`;
  view.onclick = (e) => { const b = e.target.closest("[data-track]"); if (b) { S.track = b.dataset.track; save(); Learn(); } };
}

/* ---------- Lesson: an article page with inline checks ---------- */
function qHTML(l, i, idx) {
  const [q, a, ...rest] = l.qs[i]; rest.pop();
  const opts = shuffle([a, ...rest]);
  return `<div class="check" data-l="${l.id}" data-i="${i}"><div class="cq"><span>${idx}</span>${md(q)}</div>
    <div class="opts">${opts.map((o) => `<button class="opt" data-ok="${o === a ? 1 : 0}">${md(o)}</button>`).join("")}</div><div class="cfb"></div></div>`;
}
function wireChecks(root, onAnswer) {
  root.querySelectorAll(".check").forEach((c) => c.addEventListener("click", (e) => {
    const b = e.target.closest(".opt"); if (!b || c.dataset.ans) return;
    c.dataset.ans = 1; const ok = b.dataset.ok === "1"; const l = byId[c.dataset.l]; const i = +c.dataset.i; const k = qKey(l.id, i);
    c.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.ok === "1") x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
    S.seen[k] = Date.now(); if (ok) { if (S.miss[k]) S.miss[k]--; } else S.miss[k] = (S.miss[k] || 0) + 1; save();
    c.querySelector(".cfb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "Right." : "Not quite."}</b> ${md(l.qs[i].at(-1))}</div>`;
    onAnswer(ok);
  }));
}
function Lesson(l) {
  if (!l) return nav("learn");
  const all = l.track.units.flatMap((u) => u.lessons); const pos = all.findIndex((x) => x.id === l.id); const nxt = all[pos + 1];
  const mins = Math.max(3, Math.round((l.cards.join(" ").split(" ").length + 220) / 180));
  view.innerHTML = `<div class="page">${bar("", ["learn", "Learn"])}<article class="lesson">
    <div class="kicker">${esc(l.track.name)} · ${esc(l.unit.t)}</div><h1>${esc(l.t)}</h1><div class="muted sm">${mins} min${S.done[l.id] ? " · Completed" : ""}</div>
    <div class="body">${l.cards.map((c) => `<p>${md(c)}</p>`).join("")}</div>
    <aside class="words"><div class="eyebrow">Words to own</div><dl>${l.terms.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></aside>
    <section class="checks"><h2>Check yourself</h2>${l.qs.map((_, i) => qHTML(l, i, i + 1)).join("")}</section>
    <section class="explain"><h2>Explain it back</h2><p class="cq0">${md(l.ex[0])}</p>
      <textarea id="ta" rows="4" placeholder="Say it in your own words. This is what makes it stick."></textarea>
      <button class="btn ghost" id="rv">Compare with an expert</button><div id="exp"></div></section>
    <button class="btn" id="fin" ${S.done[l.id] ? "" : "disabled"}>${S.done[l.id] ? "Completed" : "Answer the checks to finish"}</button>
    ${nxt ? `<a class="cont" href="#lesson/${nxt.id}"><div><div class="eyebrow">Up next</div><b>${esc(nxt.t)}</b></div>${ICON.arrow}</a>` : ""}
  </article></div>`;
  let answered = 0, right = 0, rated = S.done[l.id] ? 1 : 0;
  const fin = $("#fin");
  const ready = () => { if (S.done[l.id]) return; if (answered === l.qs.length) { fin.disabled = false; fin.textContent = "Finish lesson"; } };
  wireChecks(view, (ok) => { answered++; right += ok; ready(); });
  $("#rv").onclick = () => {
    $("#exp").innerHTML = `<div class="expert"><div class="eyebrow">How an expert would say it</div>${md(l.ex[1])}</div><div class="rate">${[["2", "Nailed it"], ["1", "Partly"], ["0", "Missed it"]].map(([v, n]) => `<button class="chip" data-r="${v}">${n}</button>`).join("")}</div>`;
    $("#exp .rate").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; const k = `${l.id}:ex`; if (r < 2) S.miss[k] = (S.miss[k] || 0) + 1; else delete S.miss[k]; save(); $("#exp .rate").innerHTML = `<span class="muted sm">Saved. ${r < 2 ? "It'll come back in Review." : "Nice."}</span>`; rated = 1; };
  };
  fin.onclick = () => {
    if (S.done[l.id]) return;
    S.done[l.id] = Date.now(); const xp = 20 + right * 2; award(xp);
    fin.outerHTML = `<div class="donebox">${ICON.check}<div><b>Lesson complete · +${xp} XP</b><span>${right}/${l.qs.length} right · ${l.terms.length} terms added to your glossary · ${liveStreak()} day streak</span></div></div>`;
  };
}

/* ---------- Review ---------- */
function Review() {
  const done = LESSONS.filter((l) => S.done[l.id]);
  if (!done.length) { view.innerHTML = `<div class="page">${bar("Review", ["learn", "Learn"])}<p class="pad muted">Finish a lesson first. Its questions and terms show up here, and anything you miss comes back more often.</p></div>`; return; }
  const pool = done.flatMap((l) => l.qs.map((_, i) => ({ l, i, s: (S.miss[qKey(l.id, i)] || 0) * 10 + Math.min(10, (Date.now() - (S.seen[qKey(l.id, i)] || 0)) / 864e5) + Math.random() * 4 })));
  const pick = pool.sort((a, b) => b.s - a.s).slice(0, 8);
  let right = 0, n = 0;
  view.innerHTML = `<div class="page">${bar("Review", ["learn", "Learn"])}<article class="lesson">
    <h1>Review</h1><p class="muted">${pick.length} questions, weighted toward what you've missed and haven't seen lately.</p>
    <a class="cont alt" href="#drill"><div><div class="eyebrow">Or</div><b>Drill your vocabulary</b></div>${ICON.arrow}</a>
    <section class="checks">${pick.map((p, k) => `<div class="from">${esc(p.l.t)}</div>${qHTML(p.l, p.i, k + 1)}`).join("")}</section><div id="rdone"></div></article></div>`;
  wireChecks(view, (ok) => { n++; right += ok; if (n === pick.length) { award(5 + right * 2); $("#rdone").innerHTML = `<div class="donebox">${ICON.check}<div><b>Review done · ${right}/${n}</b><span>${liveStreak()} day streak</span></div></div>`; } });
}
function Drill() {
  const terms = TERMS.filter((t) => S.done[t.lid]);
  if (!terms.length) return nav("review");
  const deck = terms.map((t) => ({ t, s: -(S.termOk[t.k] || 0) * 3 + Math.random() * 4 })).sort((a, b) => b.s - a.s).slice(0, 12).map((x) => x.t);
  let i = 0, known = 0;
  const draw = () => {
    if (i >= deck.length) { award(5 + known); view.innerHTML = `<div class="page">${bar("Vocab drill", ["learn", "Learn"])}<article class="lesson"><div class="donebox">${ICON.check}<div><b>Drill done · knew ${known}/${deck.length}</b><span>${liveStreak()} day streak</span></div></div><a class="cont" href="#learn"><div><b>Back to Learn</b></div>${ICON.arrow}</a></article></div>`; return; }
    const t = deck[i];
    view.innerHTML = `<div class="page">${bar("Vocab drill", ["learn", "Learn"])}<article class="lesson"><div class="muted sm">${i + 1} of ${deck.length}</div>
      <button class="flip" id="fl"><b>${esc(t.k)}</b><span class="muted">Define it in your head, then tap</span></button><div id="rt"></div></article></div>`;
    $("#fl").onclick = () => {
      $("#fl").innerHTML = `<b>${esc(t.k)}</b><span>${esc(t.v)}</span>`;
      $("#rt").innerHTML = `<div class="rate"><button class="chip" data-r="1">Knew it</button><button class="chip" data-r="0">Didn't</button></div>`;
      $("#rt").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; S.termOk[t.k] = Math.max(0, (S.termOk[t.k] || 0) + (r ? 1 : -1)); known += r; save(); i++; draw(); };
    };
  };
  draw();
}

/* ---------- Glossary ---------- */
function Glossary() {
  let q = "", only = false;
  view.innerHTML = `<div class="page">${bar()}<section class="mast sm"><h1>Glossary</h1><p class="muted">Every term in Latent. Learned ones are marked.</p></section>
    <input id="s" class="search" type="search" placeholder="Search ${TERMS.length} terms" autocomplete="off">
    <label class="tog"><input type="checkbox" id="only"> Learned only</label><div id="gl" class="list"></div></div>`;
  const list = () => {
    const f = TERMS.filter((t) => (!only || S.done[t.lid]) && (!q || (t.k + " " + t.v).toLowerCase().includes(q)));
    $("#gl").innerHTML = f.length ? f.map((t) => `<div class="term ${S.done[t.lid] ? "got" : ""}"><div class="tk">${esc(t.k)}${S.done[t.lid] ? ICON.check : ""}</div><div class="tv">${esc(t.v)}</div><a href="#lesson/${t.lid}">${esc(byId[t.lid].t)} ›</a></div>`).join("") : `<p class="muted">No matches.</p>`;
  };
  $("#s").oninput = (e) => { q = e.target.value.trim().toLowerCase(); list(); };
  $("#only").onchange = (e) => { only = e.target.checked; list(); };
  list();
}

/* ---------- You ---------- */
function You() {
  const days = [...Array(7)].map((_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); return { l: "SMTWTFS"[d.getDay()], v: S.days[dkey(d)] || 0 }; });
  const mx = Math.max(30, ...days.map((d) => d.v));
  const learned = TERMS.filter((t) => S.done[t.lid]).length;
  view.innerHTML = `<div class="page">${bar()}<section class="mast sm"><h1>You</h1></section>
    <div class="stats"><div><b>${liveStreak()}</b><span>Day streak</span></div><div><b>${S.xp}</b><span>XP</span></div><div><b>${learned}<small>/${TERMS.length}</small></b><span>Terms</span></div><div><b>${Object.keys(S.done).length}<small>/${LESSONS.length}</small></b><span>Lessons</span></div></div>
    <section class="panel"><div class="eyebrow">This week</div><div class="bars">${days.map((d) => `<div><i style="height:${(d.v / mx) * 100}%"></i><span>${d.l}</span></div>`).join("")}</div></section>
    <section class="panel"><div class="eyebrow">Tracks</div>${TRACKS.map((t) => { const all = t.units.flatMap((u) => u.lessons); const n = all.filter((l) => S.done[l.id]).length; return `<div class="trow"><span>${esc(t.name)}</span><div class="meter"><i style="width:${(n / all.length) * 100}%"></i></div><span class="muted sm">${n}/${all.length}</span></div>`; }).join("")}</section>
    <button class="btn ghost" id="reset">Reset progress</button></div>`;
  $("#reset").onclick = (e) => { if (e.target.dataset.sure) { S = blank(); save(); route(); } else { e.target.dataset.sure = 1; e.target.textContent = "Tap again to erase everything"; } };
}

load().then(route);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
