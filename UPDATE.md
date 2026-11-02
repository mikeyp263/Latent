# Latent: how to publish an edition

Latent's goal: make Mikey the most knowledgeable person in the room about AI. Every edition should give him the full story with the data, explain any jargon, and say honestly what it means. He wants to know first, so cover what's genuinely new since the last edition, not evergreen filler.

Run this twice a day (morning and afternoon, US Eastern). Steps:

## 1. Get oriented
- Read `public/data/briefs.json` (newest edition first), `public/data/models.json`, and `public/data/lessons.json`.
- Note the last edition's id and date. Your window is everything since then. Don't repeat a story already covered unless there's a real development (then say what's new).
- Get today's date and time in America/New_York. Edition id is `YYYY-MM-DD-am` before noon ET, `YYYY-MM-DD-pm` after. `edition` is "Morning" or "Afternoon".

## 2. Research (use web search; send several searches at once)
Cover at minimum:
- New model releases and updates: OpenAI, Anthropic, Google/DeepMind, Meta, xAI, Mistral, DeepSeek, Qwen/Alibaba, Moonshot (Kimi), Zhipu (GLM), Nvidia, Microsoft, Apple, Amazon.
- Agents, coding tools, developer platforms, MCP and other standards.
- Research results people are talking about (papers, benchmarks, safety findings).
- Business: funding, IPOs, acquisitions, revenue, pricing changes, chips and compute deals.
- Policy and law: US federal and state, EU, China.
- Security incidents involving AI.
Prefer primary sources (company blogs, docs, filings, government sites) and major outlets (Reuters, Bloomberg, The Verge, TechCrunch, Axios, The Information, CNBC). Use roundup newsletters only to find leads, then confirm with a primary or major source. Never state a number you couldn't confirm. If something is rumor or a report, say so ("reportedly", "according to X").

## 3. Write the edition
Mikey wants to actually understand each story, not skim a two-line summary. Each story is a real short article: what happened in full, the data, what the jargon means, and what it means. Look at the existing edition in `briefs.json` for the bar.

Prepend a new object to `editions` in `briefs.json`:
```json
{
  "id": "2026-11-02-pm", "date": "2026-11-02", "edition": "Afternoon",
  "stories": [ {
    "kicker": "Models",
    "headline": "...",
    "summary": "One sentence shown under the headline.",
    "stats": [["$16.3B", "Revenue, H1 2026"]],
    "sections": [
      { "h": "What happened", "p": ["paragraph", "paragraph"] },
      { "h": "By the numbers", "table": [["Label", "Value"]], "note": "Where the numbers come from." },
      { "h": "What the jargon means", "p": ["**Term:** plain-English meaning."] },
      { "h": "What it means", "p": ["..."] },
      { "h": "What to watch", "p": ["..."] }
    ],
    "sources": [ { "name": "TechCrunch", "title": "Article title", "url": "https://..." } ]
  } ],
  "ahead": [ { "when": "Tue Nov 3", "what": "..." } ]
}
```
- 4 to 10 stories, most important first. The first is the lead. Quiet window? Fewer stories is fine; don't pad.
- `kicker`: one of Models, Business, Policy, Security, Research, Standards, Tools, Chips.
- `headline`: specific and plain, like a good newspaper. No hype words.
- `summary`: one sentence. It's a subtitle, not the story.
- `stats`: 0 to 3 headline figures, [value, short label]. Only confirmed numbers. Keep values short.
- `sections`: build the article from these. Each section has `h` plus any of `p` (paragraphs, **bold** allowed), `table` ([label, value] rows), `list` (bullets), `note` (small source line under a table).
  - Always: "What happened" (full facts: who, what, when, how, with names and dates; 1 to 3 paragraphs) and "What it means" (the honest analysis; call out marketing claims, benchmark noise, limited access, and how it affects people building with AI).
  - When there's data, put it in a table ("By the numbers", "Benchmarks", "Price and specs", "Where each X stands"). If the source has numbers, use them. Say whose numbers they are in `note`.
  - When the story uses terms a smart non-specialist might not know, add "What the jargon means" and define them plainly in the context of this story.
  - Add "What to watch" when there's a clear next step or date.
  - Don't link to lessons from articles. Articles are news; lessons live in Learn.
- `sources`: every outlet you used, each with `name`, the article `title`, and `url`. Primary sources first.
- `ahead`: upcoming dated events worth knowing. Carry forward still-upcoming items from the last edition and drop past ones.
- Keep only the 60 most recent editions in the file.

## 4. Update the models tracker
In `models.json`, add any newly released model (name, lab, released YYYY-MM-DD, access: Closed / Open weights / Limited / Preview, price "$in / $out" per million tokens, context, note, link). Update price or access changes on existing entries. Set `updated` to today. Only include models worth knowing (frontier, notable open weights, or big price/perf shifts), not every minor variant.

## 5. Add lessons when the news needs one
If a story depends on a concept that no existing lesson covers (check `content.js` and `lessons.json` titles and terms), add a lesson to `lessons.json` with the same shape as the existing ones:
`id` ("nw" + next number), `added` (YYYY-MM-DD), `t`, `cards` (3 short teaching paragraphs, **bold** key terms), `terms` ([term, definition] pairs), `qs` (3 scenario questions: [question, correct, wrong, wrong, (wrong), why]; correct answer first), `ex` ([explain-it-back prompt, expert answer]).
Teach the durable concept, not just the news item. 0 to 2 lessons per edition. They show up in Learn under "From the news".

## 6. Style rules
- Follow DESIGN.md. Don't change the app's look in a brief run; only data files and the cache version change.
- Never use em dashes (the long dash). Use commas, colons, periods, or parentheses.
- Plain, direct, concise. No hype.
- Facts must come from your research this run, with sources.

## 7. Ship it
- Run `node scripts/validate.mjs`. Fix every error it reports.
- Bump the `CACHE` version in `public/sw.js` (latent-vN to latent-vN+1).
- Commit with a message like `Brief: 2026-11-02 Afternoon` and push to `main`. GitHub Pages deploys automatically.
