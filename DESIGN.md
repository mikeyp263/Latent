# Latent design system

Native iOS conventions. If it wouldn't look at home next to Apple's own apps, it's wrong.

## Rules
- One accent color (indigo), used only for interactive things and the current tab. No colored categories.
- No decoration: no gradients, shadows (except the segmented control thumb), left-border callouts, pill buttons, uppercase eyebrows on everything, or emoji.
- Lists over cards. Content lives in inset grouped lists with hairline separators.
- Summary first, detail on tap. Lists show a headline and two lines max; the full text lives on its own page.
- System font only (SF Pro on iPhone).

## Tokens (styles.css `:root`)
| Group | Tokens |
|---|---|
| Color | `--bg` `--surface` `--fill` `--label` `--label-2` `--label-3` `--sep` `--accent` `--good` `--bad` (light + dark) |
| Type | `--t-large` 34/41 bold, `--t-title` 22/28 bold, `--t-headline` 17/22 semibold, `--t-body` 17/24, `--t-sub` 15/20, `--t-foot` 13/18, `--t-cap` 12/16 |
| Space | `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 20, `--s6` 24, `--s8` 32 |
| Radius | `--r` 12 |

## Components
| Component | Class | Use |
|---|---|---|
| Nav bar | `.nav` | Back link (accent) + streak. Sticky, blurred. |
| Large title | `.large` + `.subtitle` | Top of every tab screen. |
| Section header | `.sh` | Small gray caps label above a group. |
| Grouped list | `.group` | Container for rows. |
| Row | `.row` (`.main` `.t` `.st` `.val` `.chev`) | Any tappable list item. `lead` slot for a check or empty circle. `.next` highlights the next lesson. |
| Story row | `.story` (`.top` for the lead) | Kicker + source, headline, 2-line dek. |
| Article | `.article` `.kick` `h1` `.prose` `.h2` | Story, lesson, and model detail pages. |
| Segmented control | `.seg` | Switching between 2 to 4 peers (tracks). |
| Filters | `.filters` | Long horizontal lists of filters (labs). |
| Button | `.btn` / `.plain` / `.danger` / `.alt` | Filled primary, text-only, destructive, neutral. |
| Quiz | `.q` (`.opt` rows, `.why`) | Options as list rows; result icon + explanation below. |
| Tab bar | `.tabs` | Today, Learn, Models, Me. |
