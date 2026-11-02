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
const when = (iso) => { const n = daysAgo(iso); return n <= 0 ? "Today" : n === 1 ? "Yesterday" : fmt(iso); };
const view = $("#view"), tabs = $("#tabs");
const qKey = (lid, i) => `${lid}:${i}`;

/* ---------- generated art: each story/model gets its own gradient, colored by topic ---------- */
const PAL = {
  models: ["#5B4BFF", "#FF4FA3"], business: ["#10B981", "#0EA5E9"], policy: ["#F59E0B", "#EF4444"], security: ["#EF4444", "#7C3AED"],
  research: ["#0EA5E9", "#22D3EE"], standards: ["#64748B", "#14B8A6"], tools: ["#EAB308", "#F97316"], chips: ["#06B6D4", "#6366F1"],
  google: ["#4285F4", "#34A853"], openai: ["#10A37F", "#0E7490"], anthropic: ["#D97757", "#B4413C"], meta: ["#0866FF", "#A855F7"],
  xai: ["#71717A", "#27272A"], mistral: ["#FF7000", "#E11D48"], deepseek: ["#4D6BFE", "#06B6D4"],
  op: ["#8B7CFF", "#22D3EE"], bd: ["#A855F7", "#EC4899"], nw: ["#F97316", "#EAB308"],
};
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pal = (k) => PAL[String(k || "").toLowerCase().replace(/\W/g, "")] || PAL.models;
function art(seed, key) {
  const [a, b] = pal(key); const h = hash(seed);
  const x1 = h % 60, y1 = (h >> 8) % 50, x2 = 50 + ((h >> 16) % 50), y2 = 50 + ((h >> 4) % 50), ang = h % 360;
  return `background:radial-gradient(110% 130% at ${x1}% ${y1}%, ${a} 0, ${a}55 30%, transparent 62%),radial-gradient(100% 120% at ${x2}% ${y2}%, ${b} 0, ${b}44 35%, transparent 70%),linear-gradient(${ang}deg,#121218,#1d1b2b);`;
}
const dot = (name) => `<span class="dot" style="background:linear-gradient(135deg,${pal(name)[0]},${pal(name)[1]})"></span>`;

const I = {
  today: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M3 8.5 12 4l9 4.5-9 4.5z"/><path d="M7 10.5V15c3 2.2 7 2.2 10 0v-4.5"/></svg>',
  models: '<svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  go: '<svg class="go" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
  ok: '<svg class="m" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  no: '<svg class="m" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  review: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg>',
  cards: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="14" rx="3"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"/></svg>',
};
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const backBtn = (h) => `<a class="backbtn" href="#${h}" aria-label="Back">${I.back}</a>`;
const R = ({ href, t, s, v, lead = "", cls = "" }) => `<a class="r ${cls}" ${href ? `href="${esc(href)}"` : ""}>${lead}<div class="main"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ""}</div>${v ? `<span class="v">${v}</span>` : ""}${href ? I.go : ""}</a>`;

/* ---------- routing ---------- */
const TABS = [["today", "Discover"], ["learn", "Learn"], ["models", "Models"], ["me", "Me"]];
const go = (h) => { if (location.hash === "#" + h) route(); else location.hash = h; };
window.addEventListener("hashchange", route);
function route() {
  const [p, a, b] = (location.hash.slice(1) || "today").split("/");
  const tab = { story: "today", edition: "today", archive: "today", model: "models", lesson: "learn", review: "learn", drill: "learn", glossary: "learn" }[p] || p;
  tabs.innerHTML = TABS.map(([k, n]) => `<a href="#${k}" class="${k === tab ? "on" : ""}">${I[k]}<span>${n}</span></a>`).join("");
  view.onclick = null; window.scrollTo(0, 0);
  const V = {
    today: () => Discover(BRIEFS[0]), edition: () => Discover(BRIEFS.find((e) => e.id === a)), story: () => Story(BRIEFS.find((e) => e.id === a), +b), archive: Archive,
    models: Models, model: () => Model(MODELS.models[+a]), learn: Learn, lesson: () => Lesson(byId[a]), review: Review, drill: Drill, glossary: Glossary, me: Me,
  }[p];
  (V || (() => Discover(BRIEFS[0])))();
}

/* ---------- Discover ---------- */
let catF = "Top";
const words = (s) => [s.summary, ...(s.sections || []).flatMap((x) => [...(x.p || []), ...(x.list || []), ...(x.table || []).flat()])].join(" ").split(/\s+/).length;
const readMin = (s) => Math.max(1, Math.round(words(s) / 220));
const srcNames = (s) => { const n = (s.sources || []).map((x) => x.name); return n.length > 2 ? `${n.slice(0, 2).join(", ")} +${n.length - 2}` : n.join(", "); };
const kick = (k) => `<span class="kick" style="--k:${pal(k)[0]}">${esc(k)}</span>`;
function Discover(e) {
  if (!e) { view.innerHTML = `<div class="page"><h1 class="h1">Discover</h1><p class="sub">No brief yet.</p></div>`; return; }
  const latest = e.id === BRIEFS[0]?.id;
  const cats = ["Top", ...new Set(e.stories.map((s) => s.kicker))];
  const draw = () => {
    const list = e.stories.map((s, i) => ({ s, i })).filter(({ s }) => catF === "Top" || s.kicker === catF);
    const [lead, ...rest] = list;
    const top = catF === "Top";
    const newModels = latest && top ? MODELS.models.map((m, i) => ({ m, i })).filter(({ m }) => daysAgo(m.released) <= 10) : [];
    view.innerHTML = `<div class="page">
      ${latest ? "" : `<a class="sub" href="#archive">‹ Past briefs</a>`}
      <h1 class="h1">${latest ? "Discover" : fmt(e.date, { month: "long", day: "numeric" })}</h1>
      <p class="sub">${fmt(e.date, { weekday: "long", month: "long", day: "numeric" })} · ${esc(e.edition)} edition · ${e.stories.length} stories</p>
      <div class="chips">${cats.map((c) => `<button class="${c === catF ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      ${lead ? `<div class="sec"><h2>${top ? "Top story" : esc(catF)}</h2></div>
        <a class="hero" href="#story/${e.id}/${lead.i}"><div class="art" style="${art(lead.s.headline, lead.s.kicker)}"></div><div class="in">${kick(lead.s.kicker)}<div class="t">${esc(lead.s.headline)}</div><div class="d">${md(lead.s.summary)}</div><div class="meta">${esc(srcNames(lead.s))} · ${readMin(lead.s)} min read</div></div></a>` : ""}
      ${rest.length ? `<div class="sec"><h2>${top ? "Latest" : "More"}</h2></div><div class="feed">${rest.map(({ s, i }) => item(e, s, i)).join("")}</div>` : ""}
      ${newModels.length ? `<div class="sec"><h2>New models</h2><a href="#models">All models</a></div><div class="hs">${newModels.map(({ m, i }) => `<a class="mc" href="#model/${i}"><div class="art" style="${art(m.name, m.lab)}">${esc(m.lab)}</div><div class="in"><b>${esc(m.name)}</b><span>${esc(priceShort(m.price) || m.access)}</span></div></a>`).join("")}</div>` : ""}
      ${e.ahead?.length && top ? `<div class="sec"><h2>Coming up</h2></div><div class="rows ahead">${e.ahead.map((a) => `<div class="r"><span class="when">${esc(a.when)}</span><span class="what">${md(a.what)}</span></div>`).join("")}</div>` : ""}
      ${top ? `<a class="pastlink" href="#archive">Past editions ${I.go}</a>` : ""}
    </div>`;
    view.onclick = (ev) => { const b = ev.target.closest("[data-cat]"); if (b) { catF = b.dataset.cat; draw(); } };
  };
  draw();
}
const item = (e, s, i) => `<a class="item" href="#story/${e.id}/${i}"><div class="main">${kick(s.kicker)}<div class="t">${esc(s.headline)}</div><div class="meta">${esc(srcNames(s))} · ${readMin(s)} min</div></div><div class="thumb" style="${art(s.headline, s.kicker)}"></div></a>`;
const priceShort = (p) => ((p || "").match(/\$[\d.]+ \/ \$[\d.]+/) || [""])[0];

function section(x) {
  return `<section class="sect"><h2>${esc(x.h)}</h2>
    ${(x.p || []).map((p) => `<p>${md(p)}</p>`).join("")}
    ${x.list ? `<ul>${x.list.map((li) => `<li>${md(li)}</li>`).join("")}</ul>` : ""}
    ${x.table ? `<div class="dt">${x.table.map(([k, v]) => `<div><span>${md(k)}</span><b>${md(v)}</b></div>`).join("")}</div>` : ""}
    ${x.note ? `<p class="note">${md(x.note)}</p>` : ""}</section>`;
}
function Story(e, i) {
  const s = e?.stories?.[i]; if (!s) return go("today");
  const back = e.id === BRIEFS[0].id ? "today" : `edition/${e.id}`;
  const nx = e.stories[i + 1];
  view.innerHTML = `<div class="page flush"><div class="cover art" style="${art(s.headline, s.kicker)}">${backBtn(back)}</div>
    <header class="art-h">${kick(s.kicker)}<h1>${esc(s.headline)}</h1>
      <p class="deck">${md(s.summary)}</p>
      <a class="byline" href="#srcs"><span>${fmt(e.date, { month: "long", day: "numeric" })} · ${readMin(s)} min read</span><span>Sources: ${esc(srcNames(s))} ${I.go}</span></a></header>
    ${s.stats?.length ? `<div class="nums">${s.stats.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
    <div class="body">${(s.sections || []).map(section).join("")}</div>
    <section class="sect" id="srcs"><h2>Sources</h2><p class="note" style="margin-top:0">Tap to open the original reporting.</p>
      <div class="srclist">${(s.sources || []).map((x, k) => `<a href="${esc(x.url)}" target="_blank" rel="noopener"><span class="n">${k + 1}</span><span class="main"><small>${esc(x.name)}</small><b>${esc(x.title || x.name)}</b><em>${esc(host(x.url))}</em></span>${I.ext}</a>`).join("")}</div></section>
    ${nx ? `<a class="nextcard" href="#story/${e.id}/${i + 1}"><div class="art" style="${art(nx.headline, nx.kicker)}"></div><div class="in"><small>Next story</small><b>${esc(nx.headline)}</b></div></a>` : `<a class="nextcard" href="#${back}"><div class="in"><small>That's everything</small><b>Back to Discover</b></div></a>`}
  </div>`;
  const by = $(".byline"); by.onclick = (ev) => { ev.preventDefault(); $("#srcs").scrollIntoView({ behavior: "smooth" }); };
}
function Archive() {
  view.innerHTML = `<div class="page"><a class="sub" href="#today">‹ Discover</a><h1 class="h1">Past briefs</h1>
    <div class="rows" style="margin-top:20px">${BRIEFS.map((e) => R({ href: `#edition/${e.id}`, t: `${fmt(e.date, { weekday: "short", month: "short", day: "numeric" })} · ${esc(e.edition)}`, s: esc(e.stories[0]?.headline) })).join("")}</div></div>`;
}

/* ---------- Models ---------- */
let labF = "All";
function Models() {
  const labs = ["All", ...new Set(MODELS.models.map((m) => m.lab))];
  const draw = () => {
    const f = MODELS.models.map((m, i) => ({ m, i })).filter(({ m }) => labF === "All" || m.lab === labF);
    view.innerHTML = `<div class="page"><h1 class="h1">Models</h1><p class="sub">Every model worth knowing · updated ${fmt(MODELS.updated)}</p>
      <div class="chips">${labs.map((l) => `<button class="${l === labF ? "on" : ""}" data-lab="${esc(l)}">${esc(l)}</button>`).join("")}</div>
      <div style="margin-top:8px">${f.map(({ m, i }) => `<a class="item" href="#model/${i}"><div class="thumb" style="${art(m.name, m.lab)}">${esc(m.lab[0])}</div><div class="main"><div class="t">${esc(m.name)}</div><div class="src">${esc(m.lab)} · ${m.released ? when(m.released) : "Restricted"} · ${esc(m.access)}</div></div><span class="muted" style="font:600 14px var(--font)">${esc(priceShort(m.price))}</span></a>`).join("")}</div>
      <p class="sub" style="margin-top:12px">Prices per million input / output tokens.</p></div>`;
    view.onclick = (ev) => { const b = ev.target.closest("[data-lab]"); if (b) { labF = b.dataset.lab; draw(); } };
  };
  draw();
}
function Model(m) {
  if (!m) return go("models");
  const [pin, pout] = (priceShort(m.price) || " / ").split(" / ");
  const stats = [[pin, "Input / 1M"], [pout, "Output / 1M"], [m.context, "Context"]].filter(([v]) => v && v.trim());
  view.innerHTML = `<div class="page flush"><div class="cover sm art" style="${art(m.name, m.lab)}">${backBtn("models")}</div>
    <div class="art-h" style="margin-top:-60px"><div class="src">${dot(m.lab)}${esc(m.lab)} · ${m.released ? fmt(m.released, { month: "long", day: "numeric", year: "numeric" }) : "Release date not public"}</div><h1>${esc(m.name)}</h1></div>
    ${stats.length ? `<div class="nums">${stats.map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join("")}</div>` : ""}
    <div class="prose"><p>${md(m.note)}</p></div>
    <div class="label">Details</div><div class="rows" style="margin-top:10px">${R({ t: "Access", v: esc(m.access) })}${m.price ? R({ t: "Pricing", s: esc(m.price) }) : ""}</div>
    ${m.link ? `<div class="label">Source</div><div class="srcs"><a href="${esc(m.link)}" target="_blank" rel="noopener">${dot(m.lab)}${esc(new URL(m.link).hostname.replace(/^www\./, ""))}</a></div>` : ""}
  </div>`;
}

/* ---------- Learn ---------- */
function Learn() {
  const tr = TRACKS.find((t) => t.id === S.track) || TRACKS[0];
  const all = tr.units.flatMap((u) => u.lessons);
  const n = all.filter((l) => S.done[l.id]).length;
  const next = all.find((l) => !S.done[l.id]);
  const due = Object.values(S.miss).filter((v) => v > 0).length;
  let num = 0;
  view.innerHTML = `<div class="page"><h1 class="h1">Learn</h1><p class="sub">${n} of ${all.length} lessons in ${esc(tr.name)}</p>
    <div class="chips">${TRACKS.map((t) => `<button class="${t.id === tr.id ? "on" : ""}" data-track="${t.id}">${esc(t.name)}</button>`).join("")}</div>
    ${next ? `<a class="feature" href="#lesson/${next.id}"><div class="art" style="${art(next.t, tr.id)}"><span>${n ? "Continue" : "Start here"}</span></div><div class="in"><div class="src">${esc(byId[next.id].unit.t)}</div><div class="t">${esc(next.t)}</div><div class="bar"><i style="width:${(n / all.length) * 100}%"></i></div></div></a>` : `<p class="sub" style="margin-top:16px">You've finished ${esc(tr.name)}.</p>`}
    <div class="tiles"><a class="tile" href="#review">${I.review}<b>Review</b><span>${due ? `${due} to redo` : "Mixed quiz"}</span></a><a class="tile" href="#drill">${I.cards}<b>Vocab</b><span>Flashcards</span></a><a class="tile" href="#glossary">${I.book}<b>Glossary</b><span>${TERMS.length} terms</span></a></div>
    ${tr.units.map((u) => `<div class="sec"><h2>${u.news ? "From the news" : esc(u.t)}</h2></div><div class="rows">
      ${u.lessons.map((l) => { num++; const done = S.done[l.id]; return R({ href: `#lesson/${l.id}`, t: esc(l.t), s: l.added ? `Added ${fmt(l.added)}` : `${l.terms.length} terms · ${l.qs.length} questions`, lead: `<span class="num ${done ? "done" : ""}">${done ? I.check : num}</span>`, cls: next && l.id === next.id ? "next" : "" }); }).join("")}</div>`).join("")}
  </div>`;
  view.onclick = (e) => { const b = e.target.closest("[data-track]"); if (b) { S.track = b.dataset.track; save(); Learn(); } };
}

/* ---------- quiz ---------- */
function qHTML(l, i, numLabel) {
  const [q, a, ...rest] = l.qs[i]; rest.pop();
  return `<div class="q" data-l="${l.id}" data-i="${i}"><p class="qt">${numLabel}. ${md(q)}</p>${shuffle([a, ...rest]).map((o) => `<button class="opt" data-ok="${o === a ? 1 : 0}"><span>${md(o)}</span><span class="m"></span></button>`).join("")}<div class="why"></div></div>`;
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
  view.innerHTML = `<div class="page flush"><div class="cover sm art" style="${art(l.t, l.track.id)}">${backBtn("learn")}</div>
    <div class="art-h" style="margin-top:-60px"><div class="src">${dot(l.track.id)}${esc(l.track.name)} · ${esc(l.unit.t)}</div><h1>${esc(l.t)}</h1></div>
    <div class="prose">${l.cards.map((c) => `<p>${md(c)}</p>`).join("")}</div>
    <div class="label">Key terms</div><div class="rows terms" style="margin-top:10px">${l.terms.map(([k, v]) => `<div class="r"><div class="t">${esc(k)}</div><div class="s">${esc(v)}</div></div>`).join("")}</div>
    <div class="sec"><h2>Check yourself</h2></div>${l.qs.map((_, i) => qHTML(l, i, i + 1)).join("")}
    <div class="sec"><h2>Explain it back</h2></div><p class="qt" style="font:500 16px/1.5 var(--font);color:var(--text-2);margin:0">${md(l.ex[0])}</p>
    <textarea placeholder="In your own words"></textarea><div id="exp"><button class="btn ghost" id="rv">Show expert answer</button></div>
    <button class="btn" id="fin" disabled>${S.done[l.id] ? "Completed" : "Answer every question to finish"}</button>
    ${nxt ? `<a class="nextcard" href="#lesson/${nxt.id}"><div class="art" style="${art(nxt.t, l.track.id)}"></div><div class="in"><small>Up next</small><b>${esc(nxt.t)}</b></div></a>` : ""}
  </div>`;
  let answered = 0, right = 0; const fin = $("#fin");
  wireQs(view, (ok) => { answered++; right += ok; if (answered === l.qs.length && !S.done[l.id]) { fin.disabled = false; fin.textContent = "Finish lesson"; } });
  $("#rv").onclick = () => {
    $("#exp").innerHTML = `<div class="expert"><small>Expert answer</small><p>${md(l.ex[1])}</p></div><div class="pair"><button class="btn ghost" data-r="0">I missed parts</button><button class="btn ghost" data-r="2">I got it</button></div>`;
    $("#exp .pair").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const k = `${l.id}:ex`; if (b.dataset.r === "0") S.miss[k] = (S.miss[k] || 0) + 1; else delete S.miss[k]; save(); $("#exp .pair").outerHTML = `<p class="why">${b.dataset.r === "0" ? "Noted. It'll come back in Review." : "Nice."}</p>`; };
  };
  fin.onclick = () => { if (S.done[l.id]) return; S.done[l.id] = Date.now(); award(20 + right * 2); fin.disabled = true; fin.textContent = `Completed · ${right} of ${l.qs.length} correct · +${20 + right * 2} XP`; };
}

/* ---------- Review / Drill / Glossary ---------- */
function Review() {
  const done = LESSONS.filter((l) => S.done[l.id]);
  const head = `<div class="page"><a class="sub" href="#learn">‹ Learn</a><h1 class="h1">Review</h1>`;
  if (!done.length) { view.innerHTML = `${head}<p class="sub">Finish a lesson first. Questions you miss come back here.</p></div>`; return; }
  const pick = done.flatMap((l) => l.qs.map((_, i) => ({ l, i, s: (S.miss[qKey(l.id, i)] || 0) * 10 + Math.min(10, (Date.now() - (S.seen[qKey(l.id, i)] || 0)) / 864e5) + Math.random() * 4 }))).sort((a, b) => b.s - a.s).slice(0, 8);
  let n = 0, right = 0;
  view.innerHTML = `${head}<p class="sub">${pick.length} questions, the ones you missed first</p>${pick.map((p, k) => qHTML(p.l, p.i, k + 1)).join("")}<div id="rd"></div></div>`;
  wireQs(view, (ok) => { n++; right += ok; if (n === pick.length) { award(5 + right * 2); $("#rd").innerHTML = `<div class="nums" style="margin-top:28px"><div><b>${right}/${n}</b><span>Correct</span></div><div><b>${liveStreak()}</b><span>Day streak</span></div></div>`; } });
}
function Drill() {
  const head = `<div class="page"><a class="sub" href="#learn">‹ Learn</a><h1 class="h1">Vocab</h1>`;
  const terms = TERMS.filter((t) => S.done[t.lid]);
  if (!terms.length) { view.innerHTML = `${head}<p class="sub">Finish a lesson to unlock its terms.</p></div>`; return; }
  const deck = terms.map((t) => ({ t, s: -(S.termOk[t.k] || 0) * 3 + Math.random() * 4 })).sort((a, b) => b.s - a.s).slice(0, 12).map((x) => x.t);
  let i = 0, known = 0;
  const draw = () => {
    if (i >= deck.length) { award(5 + known); view.innerHTML = `${head}<div class="nums" style="margin-top:20px"><div><b>${known}/${deck.length}</b><span>Knew it</span></div><div><b>${liveStreak()}</b><span>Day streak</span></div></div><a class="btn" href="#learn">Back to Learn</a></div>`; return; }
    const t = deck[i];
    view.innerHTML = `${head}<p class="sub">${i + 1} of ${deck.length}</p><button class="flip" id="fl"><div class="art" style="${art(t.k, "op")}"></div><div class="in"><div class="t">${esc(t.k)}</div><div class="d">Tap to reveal</div></div></button><div id="rt"></div></div>`;
    $("#fl").onclick = () => {
      $("#fl .d").textContent = t.v;
      $("#rt").innerHTML = `<div class="pair"><button class="btn ghost" data-r="0">Didn't know</button><button class="btn" data-r="1">Knew it</button></div>`;
      $("#rt").onclick = (e) => { const b = e.target.closest("[data-r]"); if (!b) return; const r = +b.dataset.r; S.termOk[t.k] = Math.max(0, (S.termOk[t.k] || 0) + (r ? 1 : -1)); known += r; save(); i++; draw(); };
    };
  };
  draw();
}
function Glossary() {
  let q = "";
  view.innerHTML = `<div class="page"><a class="sub" href="#learn">‹ Learn</a><h1 class="h1">Glossary</h1><input class="search" id="s" type="search" placeholder="Search ${TERMS.length} terms" autocomplete="off"><div id="gl"></div></div>`;
  const list = () => {
    const f = TERMS.filter((t) => !q || (t.k + " " + t.v).toLowerCase().includes(q));
    const groups = {};
    f.forEach((t) => { const L = t.k.replace(/^\W+/, "")[0].toUpperCase(); (groups[L] = groups[L] || []).push(t); });
    $("#gl").innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([L, ts]) => `<div class="sec"><h2>${L}</h2></div><div class="rows">${ts.map((t) => R({ href: `#lesson/${t.lid}`, t: esc(t.k), s: esc(t.v), lead: S.done[t.lid] ? `<span class="num done">${I.check}</span>` : "" })).join("")}</div>`).join("") : `<p class="sub">No matches.</p>`;
  };
  $("#s").oninput = (e) => { q = e.target.value.trim().toLowerCase(); list(); };
  list();
}

/* ---------- Me ---------- */
function Me() {
  const days = [...Array(7)].map((_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); return { l: "SMTWTFS"[d.getDay()], v: S.days[dkey(d)] || 0 }; });
  const mx = Math.max(30, ...days.map((d) => d.v));
  view.innerHTML = `<div class="page"><h1 class="h1">Me</h1>
    <div class="nums"><div><b>${liveStreak()}</b><span>Day streak</span></div><div><b>${S.xp}</b><span>XP</span></div><div><b>${TERMS.filter((t) => S.done[t.lid]).length}</b><span>Terms known</span></div></div>
    <div class="sec"><h2>This week</h2></div><div class="chart">${days.map((d) => `<div><i style="height:${(d.v / mx) * 100}%"></i><span>${d.l}</span></div>`).join("")}</div>
    <div class="sec"><h2>Tracks</h2></div><div class="rows">${TRACKS.map((t) => { const all = t.units.flatMap((u) => u.lessons); const n = all.filter((l) => S.done[l.id]).length; return `<div class="r"><div class="main"><div class="t">${esc(t.name)}</div><div class="trk" style="margin-top:8px"><div class="bar"><i style="width:${(n / all.length) * 100}%"></i></div><span class="s" style="margin:0">${n}/${all.length}</span></div></div></div>`; }).join("")}</div>
    <button class="btn danger" id="reset" style="margin-top:28px">Reset progress</button></div>`;
  $("#reset").onclick = (e) => { if (e.target.dataset.sure) { S = blank(); save(); route(); } else { e.target.dataset.sure = 1; e.target.textContent = "Tap again to erase everything"; } };
}

load().then(route);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
