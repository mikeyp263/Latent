# Latent design system: Dark feed

Dark, premium, image-led, like Perplexity Discover. Every screen has one obvious thing to look at first.

## Rules
- Dark only. Near-black background, slightly lighter cards. No borders except hairlines between list items.
- Imagery is generated: every story, model, and lesson gets a gradient "art" made from its topic or lab colors (`art(seed, key)` in app.js). Same item, same art, every time.
- Feed first: a big hero card for the lead story, then compact items (headline left, art thumbnail right).
- Detail pages open with a full-bleed art cover, the headline overlapping its fade, then key numbers (`stats`), then text.
- Color comes from the art. UI chrome stays grayscale; violet accent only for progress, lesson links, and the active quiz state.
- System font (SF Pro on iPhone). Bold, tight headlines; calm gray body text.

## Tokens (styles.css `:root`)
| Group | Tokens |
|---|---|
| Surfaces | `--bg` #0B0B0D, `--card` #151518, `--card-2` #1C1C21, `--line`, `--line-2` |
| Text | `--text` #F4F4F5, `--text-2` #C9C9CF (body), `--text-3` #8B8B94 (meta), `--text-4` (disabled) |
| Accent | `--accent` #8B7CFF, `--good`, `--bad` |
| Radius | `--r-lg` 24 (hero, feature), `--r-md` 16 (cards, buttons), `--r-sm` 12 |
| Topic palettes | `PAL` in app.js: kickers (models, business, policy, security, research, standards, tools, chips), labs, tracks |

## Components
| Component | Class | Use |
|---|---|---|
| Page title | `.h1` + `.sub` | Top of each tab. |
| Chips | `.chips` | Filter a feed (categories, labs, tracks). Active chip is white. |
| Hero card | `.hero` | Lead story: art, source line, headline, 2-line dek. |
| Feed item | `.item` + `.thumb` | Headline + source line, art thumbnail. Also model rows. |
| Horizontal cards | `.hs` + `.mc` | New models rail. |
| Cover | `.cover` + `.art-h` + `.backbtn` | Detail page header. |
| Key numbers | `.nums` | 2 to 3 big figures on a story or model. |
| Learn link | `.learn` | Bordered row linking to a lesson. |
| Source pills | `.srcs` | Story sources. |
| Next card | `.nextcard` | Bottom of story or lesson. |
| List rows | `.rows` + `.r` | Lessons, glossary, details. `.num` circle shows lesson number or a check. |
| Feature card | `.feature` | Continue-learning card on Learn. |
| Tiles | `.tiles` | Review, Vocab, Glossary shortcuts. |
| Quiz | `.q` `.opt` `.why` | Options as dark cards; green/red outline on answer. |
| Buttons | `.btn` (white), `.ghost`, `.danger` | |
| Tab bar | `.tabs` | Discover, Learn, Models, Me. |
