# Latent

The place to keep up with and learn AI: a twice-daily brief, a live model tracker, and lessons that make you fluent.

## Daily updates
A scheduled task publishes a Morning and an Afternoon edition: it researches what happened, writes the brief, updates the model tracker, adds lessons for new concepts, and pushes. The procedure is in [UPDATE.md](UPDATE.md). Data lives in `public/data/` (`briefs.json`, `models.json`, `lessons.json`); check it with `node scripts/validate.mjs`.

## Tracks
- **Fluent**: talk shop and use AI like a pro (tokens, context, RAG, agents, MCP, evals, the landscape)
- **Under the Hood**: how models are built (loss, backprop, transformers, attention, scaling laws, RLHF, quantization, MoE)
- **What's New**: where the frontier is. Ask Claude to add lessons as things change.

## Features
- Every lesson: teaching cards, a "words to own" vocab step, scenario questions (misses come back at the end), and explain-it-back with an expert answer to compare
- Review: scenario mix weighted toward what you missed, term drill, explain-it-back drill
- Glossary of every term, searchable
- XP, streaks, weekly chart. Progress is stored on the device.

## Layout
`public/` is the whole app (plain HTML/CSS/JS, no build step). Lessons live in `public/content.js`. Bump `CACHE` in `public/sw.js` after changes so installed copies update.

Every push to `main` deploys `public/` to GitHub Pages.

## Add to home screen
iPhone: open the site in Safari, Share, Add to Home Screen.
