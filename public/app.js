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
  BRIEFS = b.editions || [];
  MODELS = m; MODELS.models = (m.models || []).slice().sort((a, c) => (c.released || "0").localeCompare(a.released || "0"));
  const nw = TRACKS.find((t) => t.id === "nw");
  const fresh = (x.lessons || []).slice().sort((a, c) => (c.added || "").localeCompare(a.added || ""));
  nw.units = nw.units.filter((u) => !u.news);
  if (fresh.length) nw.units.unshift({ t: "From the news", news: true, lessons: fresh });
  LESSONS = [];
  for (const tr of TRACKS) tr.units.forEach((u) => u.lessons.forEach((l) => LESSONS.push({ ...l, track: tr, unit: u })));
  byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  TERMS = LESSONS.flatMap((l) => l.terms.map(([k, v]) => ({ k, v, lid: l.id }))).sort((a, c) => a.k.replace(/^\W+/, "").localeCompare(c.k.replace(/^\W+/, "")));
}

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const toDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmt = (iso, o = { month: "short", day: "numeric" }) => (iso ? toDate(iso).toLocaleDateString("en-US", o) : "");
const daysAgo = (iso) => (iso ? Math.floor((Date.now() - toDate(iso)) / 864e5) : 999);
const view = $("#view"), tabs = $("#tabs");
const qKey = (lid, i) => `${lid}:${i}`;
const I = {
  today: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z M12 5.5V19"/></svg>',
  models: '<svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  check: '<svg class="done" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  ok: '<svg class="mark" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  no: '<svg class="mark" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  ext: '<svg class="chev" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/></svg>',
};
const row = ({ href, t, st, val, lead = "", cls = "", ext }) => `<a class="row ${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${lead}<span class="main"><span class="t">${t}</span>${st ? `<span class="st">${st}</span>` : ""}</span>${val ? `<span class="val">${val}</span>` : ""}${ext ? I.ext : I.chev}</a>`;
const nav = (back) => `<header class="nav">${back ? `<a class="back" href="#${back[0]}">${I.back}${esc(back[1])}</a>` : ""}<span class="streak">${liveStreak() ? `${liveStreak()} day streak` : ""}</span></header>`;

/* ---------- routing ---------- */
const TABS = [["today", "Today"], ["learn", "Learn"], ["models", "Models"], ["me", "Me"]];
const go = (h) => { if (location.hash === "#" + h) route(); else location.hash = h; };
window.addEventListener("hashchange", route);
function route() {
  const [p, a, b] = (location.hash.slice(1) || "today").split("/");
  const tab = { story: "today", edition: "today", archive: "today", model: "models", lesson: "learn", review: "learn", drill: "learn", glossary: "learn" }[p] || p;
  tabs.innerHTML = TABS.map(([k, n]) => `<a href="#${k}" class="${k === tab ? "on" : ""}">${I[k]}<span>${n}</span></a>`).join("");
  view.onclick = null; window.scrollTo(0, 0);
  const R = {
    today: () => Today(BRIEFS[0]), edition: () => Today(BRIEFS.find((e) => e.id === a)), story: () => Story(BRIEFS.find((e) => e.id === a), +b), archive: Archive,
    models: Models, model: () => Model(MODELS.models[+a]), learn: Learn, lesson: () => Lesson(byId[a]), review: Review, drill: Drill, glossary: Glossary, me: Me,
  }[p];
  (R || (() => Today(BRIEFS[0])))();
}

/* ---------- Today ---------- */
function Today(e) {
  if (!e) { view.innerHTML = `<div class="page">${nav()}<h1 class="large">Today</h1><p class="subtitle">No brief yet.</p></div>`; return; }
  const latest = e.id === BRIEFS[0]?.id;
  const storyRow = (s, i) => `<a class="story ${i === 0 ? "top" : ""}" href="#story/${e.id}/${i}"><div class="meta"><span>${esc(s.kicker)}</span><span>·</span><span>${esc(s.sources?.[0]?.[0] || "")}</span></div><h3>${esc(s.headline)}</h3><p>${md(s.dek)}</p></a>`;
  const newModels = latest ? MODELS.models.map((m, i) => ({ m, i })).filter(({ m }) => daysAgo(m.released) <= 7) : [];
  const fresh = latest ? LESSONS.filter((l) => l.added && daysAgo(l.added) <= 3) : [];
  view.innerHTML = `<div class="page">${nav(latest ? null : ["archive", "Past briefs"])}
    <h1 class="large">${latest ? "Today" : fmt(e.date, { month: "long", day: "numeric" })}</h1>
    <p class="subtitle">${fmt(e.date, { weekday: "long", month: "long", day: "numeric" })} · ${esc(e.edition)}</p>
    <div class="sh">Top stories</div>
    <div class="group">${e.stories.map(storyRow).join("")}</div>
    ${newModels.length ? `<div class="sh">New this week</div><div class="group">${newModels.map(({ m, i }) => row({ href: `#model/${i}`, t: esc(m.name), st: `${esc(m.lab)} · ${fmt(m.released)}`, val: esc(((m.price || "").match(/\$[\d.]+ \/ \$[\d.]+/) || [""])[0]) })).join("")}</div>` : ""}
    ${e.ahead?.length ? `<div class="sh">Coming up</div><div class="group">${e.ahead.map((a) => `<div class="row"><span class="main"><span class="st">${esc(a.when)}</span><span class="t" style="font:var(--t-sub)">${md(a.what)}</span></span></div>`).join("")}</div>` : ""}
    ${fresh.length ? `<div class="sh">New lessons</div><div class="group">${fresh.map((l) => row({ href: `#lesson/${l.id}`, t: esc(l.t), st: "From today's news", lead: S.done[l.id] ? I.check : "" })).join("")}</div>` : ""}
    <div class="sh">More</div><div class="group">${row({ href: "#archive", t: "Past briefs", val: String(BRIEFS.length) })}</div>
  </div>`;
}
function Story(e, i) {
  const s = e?.stories?.[i]; if (!s) return go("today");
  const back = e.id === BRIEFS[0].id ? ["today", "Today"] : [`edition/${e.id}`, fmt(e.date)];
  const learn = (s.learn || []).filter((id) => byId[id]);
  view.innerHTML = `<div class="page">${nav(back)}<article class="article">
    <div class="kick">${esc(s.kicker)} · ${fmt(e.date, { month: "long", day: "numeric" })}</div>
    <h1>${esc(s.headline)}</h1>
    <div class="prose"><p>${md(s.dek)}</p></div>
    <h2 class="h2">Why it matters</h2><div class="prose"><p>${md(s.why)}</p></div>
    ${learn.length ? `<div class="sh">Understand it</div><div class="group">${learn.map((id) => row({ href: `#lesson/${id}`, t: esc(byId[id].t), st: esc(byId[id].track.name), lead: S.done[id] ? I.check : "" })).join("")}</div>` : ""}
    <div class="sh">Sources</div><div class="group">${(s.sources || []).map(([n, u]) => row({ href: u, t: esc(n), ext: true })).join("")}</div>
    ${e.stories[i + 1] ? `<div class="sh">Next story</div><div class="group">${row({ href: `#story/${e.id}/${i + 1}`, t: esc(e.stories[i + 1].headline) })}</div>` : ""}
  </article></div>`;
}
function Archive() {
  view.innerHTML = `<div class="page">${nav(["today", "Today"])}<h1 class="large">Past briefs</h1>
    <div class="sh">Editions</div><div class="group">${BRIEFS.map((e) => row({ href: `#edition/${e.id}`, t: `${fmt(e.date, { weekday: "short", month: "short", day: "numeric" })} · ${esc(e.edition)}`, st: esc(e.stories[0]?.headline) })).join("")}</div></div>`;
}

/* ---------- Models ---------- */
let labF = "All";
function Models() {
  const labs = ["All", ...new Set(MODELS.models.map((m) => m.lab))];
  const draw = () => {
    const f = MODELS.models.map((m, i) => ({ m, i })).filter(({ m }) => labF === "All" || m.lab === labF);
    view.innerHTML = `<div class="page">${nav()}<h1 class="large">Models</h1><p class="subtitle">Updated ${fmt(MODELS.updated, { month: "long", day: "numeric" })}</p>
      <div class="filters">${labs.map((l) => `<button class="${l === labF ? "on" : ""}" data-lab="${esc(l)}">${esc(l)}</button>`).join("")}</div>
      <div class="sh">Newest first</div><div class="group">${f.map(({ m, i }) => row({ href: `#model/${i}`, t: esc(m.name), st: `${esc(m.lab)}${m.released ? ` · ${fmt(m.released, { month: "short", day: "numeric", year: "numeric" })}` : ""} · ${esc(m.access)}` })).join("")}</div>
      <p class="foot">Prices are per million input / output tokens.</p></div>`;
    view.onclick = (ev) => { const b = ev.target.closest("[data-lab]"); if (b) { labF = b.dataset.lab; draw(); } };
  };
  draw();
}
function Model(m) {
  if (!m) return go("models");
  const spec = (k, v) => (v ? `<div class="row"><span class="main"><span class="t">${k}</span></span><span class="val">${esc(v)}</span></div>` : "");
  view.innerHTML = `<div class="page">${nav(["models", "Models"])}<article class="article"><div class="kick">${esc(m.lab)}</div><h1>${esc(m.name)}</h1>
    <div class="prose"><p>${md(m.note)}</p></div>
    <div class="sh">Details</div><div class="group">${spec("Released", m.released && fmt(m.released, { month: "long", day: "numeric", year: "numeric" }))}${spec("Access", m.access)}${spec("Context", m.context && `${m.context} tokens`)}</div>
    ${m.price ? `<div class="sh">Price per million tokens (in / out)</div><div class="group"><div class="row"><span class="main"><span class="t">${esc(m.price)}</span></span></div></div>` : ""}
    ${m.link ? `<div class="sh">Source</div><div class="group">${row({ href: m.link, t: esc(new URL(m.link).hostname.replace(/^www\./, "")), ext: true })}</div>` : ""}
  </article></div>`;
}

/* ---------- Learn ---------- */
function Learn() {
  const tr = TRACKS.find((t) => t.id === S.track) || TRACKS[0];
  const all = tr.units.flatMap((u) => u.lessons);
  const n = all.filter((l) => S.done[l.id]).length;
  const next = all.find((l) => !S.done[l.id]);
  const due = Object.values(S.miss).filter((v) => v > 0).length;
  view.innerHTML = `<div class="page">${nav()}<h1 class="large">Learn</h1>
    <div class="seg">${TRACKS.map((t) => `<button class="${t.id === tr.id ? "on" : ""}" data-track="${t.id}">${esc(t.name)}</button>`).join("")}</div>
    ${next ? `<div class="sh">${n ? "Continue" : "Start here"}</div><div class="group">${row({ href: `#lesson/${next.id}`, t: `<b>${esc(next.t)}</b>`, st: `${esc(byId[next.id].unit.t)} · ${n} of ${all.length} done` })}</div>` : `<p class="foot">You've finished ${esc(tr.name)}.</p>`}
    <div class="sh">Practice</div><div class="group">
      ${row({ href: "#review", t: "Review", val: due ? `${due} missed` : "" })}${row({ href: "#drill", t: "Vocabulary drill" })}${row({ href: "#glossary", t: "Glossary", val: String(TERMS.length) })}</div>
    ${tr.units.map((u, ui) => `<div class="sh">${u.news ? "From the news" : `Unit ${ui + 1 - (tr.units[0].news ? 1 : 0)}: ${esc(u.t)}`}</div><div class="group">
      ${u.lessons.map((l) => row({ href: `#lesson/${l.id}`, t: esc(l.t), st: l.added ? `Added ${fmt(l.added)}` : "", lead: S.done[l.id] ? I.check : '<span class="todo"></span>', cls: next && l.id === next.id ? "next" : "" })).join("")}</div>`).join("")}
  </div>`;
  view.onclick = (e) => { const b = e.target.closest("[data-track]"); if (b) { S.track = b.dataset.track; save(); Learn(); } };
}

/* ---------- Quiz block ---------- */
function qHTML(l, i, num) {
  const [q, a, ...rest] = l.qs[i]; rest.pop();
  return `<div class="q" data-l="${l.id}" data-i="${i}"><p class="qt">${num}. ${md(q)}</p><div class="group">
    ${shuffle([a, ...rest]).map((o) => `<button class="row opt" data-ok="${o === a ? 1 : 0}"><span class="main"><span class="t">${md(o)}</span></span><span class="m"></span></button>`).join("")}</div><div class="why"></div></div>`;
}
function wireQs(root, onAnswer) {
  root.querySelectorAll(".q").forEach((c) => c.addEventListener("click", (e) => {
    const b = e.target.closest(".opt"); if (!b || c.dataset.ans) return;
    c.dataset.ans = 1; const ok = b.dataset.ok === "1"; const l = byId[c.dataset.l]; const i = +c.dataset.i; const k = qKey(l.id, i);
    c.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.ok === "1") { x.classList.add("right"); x.querySelector(".m").outerHTML = I.ok; } else if (x === b) { x.classList.add("wrong"); x.querySelector(".m").outerHTML = I.no; } });
    S.seen[k] = Date.now(); if (ok) { if (S.miss[k]) S.miss[k]--; } else S.miss[k] = (S.miss[k] || 0) + 1; save();
    c.querySelector(".why").innerHTML = `<b class="${ok ? "ok" : "no"}">${ok ? "Correct." : "Not quite."}</b> ${md(l.qs[i].at(-1))}`;
    onAnswer(ok);
  }));
}

/* ---------- Lesson ---------- */
function Lesson(l) {
  if (!l) return go("learn");
  const all = l.track.units.flatMap((u) => u.lessons); const nxt = all[all.findIndex((x) => x.id === l.id) + 1];
  view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<article class="article">
    <div class="kick">${esc(l.track.name)} · ${esc(l.unit.t)}</div><h1>${esc(l.t)}</h1>
    <div class="prose">${l.cards.map((c) => `<p>${md(c)}</p>`).join("")}</div>
    <div class="sh">Key terms</div><div class="group">${l.terms.map(([k, v]) => `<div class="row"><span class="main"><span class="t"><b>${esc(k)}</b></span><span class="st">${esc(v)}</span></span></div>`).join("")}</div>
    <h2 class="h2">Check yourself</h2>${l.qs.map((_, i) => qHTML(l, i, i + 1)).join("")}
    <h2 class="h2">Explain it back</h2><p class="prose" style="margin:0 0 var(--s3)">${md(l.ex[0])}</p>
    <textarea id="ta" placeholder="In your own words"></textarea><button class="btn plain" id="rv">Show expert answer</button><div id="exp"></div>
    <button class="btn" id="fin" ${S.done[l.id] ? "disabled" : "disabled"}>${S.done[l.id] ? "Completed" : "Answer all questions to finish"}</button>
    ${nxt ? `<div class="sh">Up next</div><div class="group">${row({ href: `#lesson/${nxt.id}`, t: esc(nxt.t) })}</div>` : ""}
  </article></div>`;
  let answered = 0, right = 0; const fin = $("#fin");
  wireQs(view, (ok) => { answered++; right += ok; if (answered === l.qs.length && !S.done[l.id]) { fin.disabled = false; fin.textContent = "Finish lesson"; } });
  $("#rv").onclick = () => {
    $("#rv").remove();
    $("#exp").innerHTML = `<div class="card"><div class="lbl">Expert answer</div><p>${md(l.ex[1])}</p></div><div class="pair"><button class="btn alt" data-r="0">I missed parts</button><button class="btn alt" data-r="2">I got it</button></div>`;
    $("#exp .pair").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const k = `${l.id}:ex`; if (b.dataset.r === "0") S.miss[k] = (S.miss[k] || 0) + 1; else delete S.miss[k]; save(); $("#exp .pair").outerHTML = `<p class="foot">${b.dataset.r === "0" ? "Noted. It'll come back in Review." : "Nice."}</p>`; };
  };
  fin.onclick = () => { if (S.done[l.id]) return; S.done[l.id] = Date.now(); award(20 + right * 2); fin.disabled = true; fin.textContent = `Completed · ${right} of ${l.qs.length} correct`; };
}

/* ---------- Review / Drill / Glossary ---------- */
function Review() {
  const done = LESSONS.filter((l) => S.done[l.id]);
  if (!done.length) { view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<h1 class="large">Review</h1><p class="subtitle">Finish a lesson first. Questions you miss come back here.</p></div>`; return; }
  const pick = done.flatMap((l) => l.qs.map((_, i) => ({ l, i, s: (S.miss[qKey(l.id, i)] || 0) * 10 + Math.min(10, (Date.now() - (S.seen[qKey(l.id, i)] || 0)) / 864e5) + Math.random() * 4 }))).sort((a, b) => b.s - a.s).slice(0, 8);
  let n = 0, right = 0;
  view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<h1 class="large">Review</h1><p class="subtitle">${pick.length} questions, missed ones first</p>
    ${pick.map((p, k) => qHTML(p.l, p.i, k + 1)).join("")}<div id="rd"></div></div>`;
  wireQs(view, (ok) => { n++; right += ok; if (n === pick.length) { award(5 + right * 2); $("#rd").innerHTML = `<div class="sh">Done</div><div class="group"><div class="row"><span class="main"><span class="t">${right} of ${n} correct</span></span></div></div>`; } });
}
function Drill() {
  const terms = TERMS.filter((t) => S.done[t.lid]);
  if (!terms.length) { view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<h1 class="large">Vocabulary</h1><p class="subtitle">Finish a lesson to unlock its terms.</p></div>`; return; }
  const deck = terms.map((t) => ({ t, s: -(S.termOk[t.k] || 0) * 3 + Math.random() * 4 })).sort((a, b) => b.s - a.s).slice(0, 12).map((x) => x.t);
  let i = 0, known = 0;
  const draw = () => {
    if (i >= deck.length) { award(5 + known); view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<h1 class="large">Done</h1><p class="subtitle">You knew ${known} of ${deck.length}.</p></div>`; return; }
    const t = deck[i];
    view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<p class="subtitle">${i + 1} of ${deck.length}</p>
      <button class="card flip" id="fl"><span class="t">${esc(t.k)}</span><span class="d">Tap to see the definition</span></button><div id="rt"></div></div>`;
    $("#fl").onclick = () => {
      $("#fl").innerHTML = `<span class="t">${esc(t.k)}</span><span class="d">${esc(t.v)}</span>`;
      $("#rt").innerHTML = `<div class="pair"><button class="btn alt" data-r="0">Didn't know</button><button class="btn" data-r="1">Knew it</button></div>`;
      $("#rt").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; S.termOk[t.k] = Math.max(0, (S.termOk[t.k] || 0) + (r ? 1 : -1)); known += r; save(); i++; draw(); };
    };
  };
  draw();
}
function Glossary() {
  let q = "";
  view.innerHTML = `<div class="page">${nav(["learn", "Learn"])}<h1 class="large">Glossary</h1><input id="s" class="search" type="search" placeholder="Search ${TERMS.length} terms" autocomplete="off"><div id="gl"></div></div>`;
  const list = () => {
    const f = TERMS.filter((t) => !q || (t.k + " " + t.v).toLowerCase().includes(q));
    const groups = {};
    f.forEach((t) => { const L = t.k.replace(/^\W+/, "")[0].toUpperCase(); (groups[L] = groups[L] || []).push(t); });
    $("#gl").innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([L, ts]) => `<div class="sh">${L}</div><div class="group">${ts.map((t) => row({ href: `#lesson/${t.lid}`, t: `<b>${esc(t.k)}</b>`, st: esc(t.v), lead: S.done[t.lid] ? I.check : "" })).join("")}</div>`).join("") : `<p class="foot">No matches.</p>`;
  };
  $("#s").oninput = (e) => { q = e.target.value.trim().toLowerCase(); list(); };
  list();
}

/* ---------- Me ---------- */
function Me() {
  const days = [...Array(7)].map((_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); return { l: "SMTWTFS"[d.getDay()], v: S.days[dkey(d)] || 0 }; });
  const mx = Math.max(30, ...days.map((d) => d.v));
  const stat = (k, v) => `<div class="row"><span class="main"><span class="t">${k}</span></span><span class="val">${v}</span></div>`;
  view.innerHTML = `<div class="page">${nav()}<h1 class="large">Me</h1>
    <div class="sh">Progress</div><div class="group">${stat("Day streak", liveStreak())}${stat("XP", S.xp)}${stat("Lessons", `${Object.keys(S.done).length} of ${LESSONS.length}`)}${stat("Terms learned", `${TERMS.filter((t) => S.done[t.lid]).length} of ${TERMS.length}`)}</div>
    <div class="sh">This week</div><div class="group"><div class="bars">${days.map((d) => `<div><i style="height:${(d.v / mx) * 100}%"></i><span>${d.l}</span></div>`).join("")}</div></div>
    <div class="sh">Tracks</div><div class="group">${TRACKS.map((t) => { const all = t.units.flatMap((u) => u.lessons); return stat(esc(t.name), `${all.filter((l) => S.done[l.id]).length} of ${all.length}`); }).join("")}</div>
    <button class="btn danger" id="reset">Reset progress</button></div>`;
  $("#reset").onclick = (e) => { if (e.target.dataset.sure) { S = blank(); save(); route(); } else { e.target.dataset.sure = 1; e.target.textContent = "Tap again to erase everything"; } };
}

load().then(route);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
