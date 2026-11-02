// Validates the data files the daily update writes. Run: node scripts/validate.mjs
import { readFileSync } from "node:fs";
import { TRACKS } from "../public/content.js";
const read = (p) => JSON.parse(readFileSync(new URL(`../public/data/${p}`, import.meta.url)));
const errs = [];
const err = (m) => errs.push(m);
const b = read("briefs.json"), m = read("models.json"), x = read("lessons.json");
const ids = new Set(TRACKS.flatMap((t) => t.units.flatMap((u) => u.lessons.map((l) => l.id))));
for (const l of x.lessons) {
  if (ids.has(l.id)) err(`duplicate lesson id ${l.id}`); ids.add(l.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.added || "")) err(`${l.id}: added must be YYYY-MM-DD`);
  if (!l.t || !l.cards?.length) err(`${l.id}: needs t and cards`);
  if (!l.terms?.every((t) => t.length === 2)) err(`${l.id}: terms must be [term, def]`);
  if (!l.qs?.length || !l.qs.every((q) => q.length >= 4)) err(`${l.id}: qs must be [q, correct, wrong..., why]`);
  if (l.ex?.length !== 2) err(`${l.id}: ex must be [prompt, answer]`);
}
const eids = new Set();
for (const e of b.editions) {
  if (eids.has(e.id)) err(`duplicate edition ${e.id}`); eids.add(e.id);
  if (!/^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(e.id)) err(`edition id ${e.id} must be YYYY-MM-DD-am|pm`);
  if (!e.stories?.length) err(`${e.id}: needs stories`);
  for (const s of e.stories || []) {
    for (const k of ["kicker", "headline", "summary"]) if (!s[k]) err(`${e.id}: story missing ${k}`);
    if (!s.sections?.length) err(`${e.id}: "${s.headline}" needs sections`);
    for (const x of s.sections || []) {
      if (!x.h) err(`${e.id}: section missing h`);
      if (!x.p && !x.table && !x.list) err(`${e.id}: section "${x.h}" needs p, table, or list`);
      if (x.table && !x.table.every((r) => r.length === 2)) err(`${e.id}: table rows in "${x.h}" must be [label, value]`);
    }
    if (!s.sources?.length || !s.sources.every((x) => x.name && x.url)) err(`${e.id}: "${s.headline}" sources must be {name, title, url}`);
    if (s.stats && !s.stats.every((x) => x.length === 2)) err(`${e.id}: stats must be [value, label]`);
  }
}
if (b.editions.some((e, i) => i && e.id > b.editions[i - 1].id)) err("editions must be newest first");
for (const mo of m.models) for (const k of ["name", "lab", "access", "note"]) if (!mo[k]) err(`model ${mo.name}: missing ${k}`);
const all = JSON.stringify([b, m, x]);
if (/—/.test(all)) err("em dash found; use commas, colons, or periods");
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`OK: ${b.editions.length} editions, ${m.models.length} models, ${x.lessons.length} news lessons`);
