# Embassy Radio — Frontend

## Build & Dev Commands
- `npm run dev` — Vite dev server (port 5174)
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck (run before committing)
- Backend runs separately; API proxy errors in dev are expected when backend is down

## Design System

### Typography (3 fonts only)
- **Display/headings**: Cormorant Garamond (serif, refined editorial) — applied via `h1`–`h6` defaults and `.font-bebas` / `.font-serif` classes (both alias to Cormorant)
- **Body**: Nunito (sans-serif) — applied via `body` default
- **Data/mono**: IBM Plex Mono — applied via `.font-mono` / `.mono` classes

### Color Tokens (`:root` in index.css)
| Token | Value | Usage |
|-------|-------|-------|
| `--abyss` | `#07041A` | Page background (deepest) |
| `--void` | `#100C2E` | Secondary background |
| `--card` | `#19104A` | Card surfaces |
| `--panel` | `#211558` | Inset panels, inputs |
| `--raise` | `#2C1D70` | Raised panels |
| `--parch` | `#EDE8FF` | Primary text |
| `--fog2` | `#9E93CC` | Secondary text |
| `--fog` | `#7064A8` | Muted text |
| `--violet` | `#8B5CF6` | **Primary accent** — CTAs, active states, primary buttons |
| `--lav` | `#C4B5FD` | Light violet — text highlights, borders |
| `--amber` | `#D97706` | **Secondary accent (warm)** — icons, section eyebrows, decorative highlights |
| `--amber-soft` | `#FBBF24` | Light amber — hover states, secondary highlights |
| `--brown` | `#92400E` | Deep brown — sparingly for rich accents |
| `--brown-soft` | `#C8895A` | Caramel — muted warm text |
| `--ember` | `#F59E0B` | LIVE indicators only |
| `--green` | `#34D399` | Success status |
| `--red` | `#F87171` | Danger/live status |
| `--blue` | `#60A5FA` | Info status |
| `--line` | `rgba(167,139,250,.13)` | Default border |
| `--line2` | `rgba(167,139,250,.28)` | Strong border |

### Dual-Accent System
The palette uses **violet (primary, cool) + amber-brown (secondary, warm)** to avoid a monochrome feel:
- **Violet** — primary CTAs, active nav states, primary buttons, focus rings, live-now playing bars
- **Amber/brown** — section eyebrows, decorative icons (Heart, Star, etc.), card hover borders, secondary buttons, ghost button hovers, footer link hovers, schedule time labels, signal ring accents
- **Never** use amber for primary CTAs or violet for decorative icons — this keeps the hierarchy clear

### Design Token Scales
- **Spacing**: `--sp-1` (4px) through `--sp-24` (96px)
- **Radius**: `--r-sm` (6px), `--r-md` (10px), `--r-lg` (14px), `--r-pill` (999px)
- **Elevation**: `--sh-1`, `--sh-2`, `--sh-3`, `--sh-glow`, `--sh-glow-strong`
- **Transitions**: `--t-fast` (.15s), `--t-base` (.2s), `--t-slow` (.3s)

### Component Classes
- **Buttons**: `.btn .btn-primary` (solid violet), `.btn-secondary` (soft violet), `.btn-ghost` (border), `.btn-out` (violet outline), `.btn-danger`, `.btn-success`. Sizes: `.btn-sm`, `.btn-lg`
- **Cards**: `.card` (bg + border + radius + shadow), `.surface` (panel bg), `.surface-raised`
- **Tags**: `.tag` / `.admin-tag` with variants `-live`, `-green`, `-ash`, `-blue`
- **Inputs**: `.input-dark` (themed input with focus glow)

### Legacy Aliases (mapped in `:root`, don't use in new code)
`--coal`→`--abyss`, `--mahog`→`--card`, `--flame`→`--violet`, `--gold`→`--violet`, `--sunrise`→`--lav`, `--ash`→`--fog`, `--cream`→`--parch`, etc. Button aliases: `.btn-flame`→`.btn-primary`, `.btn-gold`→`.btn-primary`, `.btn-sun`→`.btn-secondary`, `.btn-line`→`.btn-ghost`

### Color Discipline Rules
1. Use `--violet` for primary CTAs and active states only — not decoratively on every border/icon
2. Use `--lav` for text accents and highlights
3. Reserve `--ember` strictly for LIVE indicators
4. Status colors (`--green`/`--red`/`--blue`) only for status
5. `text-white` only on colored (violet/red/green) backgrounds for contrast; use `var(--parch)` for body text on dark surfaces

### Dashboard System
Dashboard pages use `.dashboard-content` wrapper which scopes the same tokens. Dashboard-specific classes: `.kpi`, `.dbtn-*`, `.dtag-*`, `.dcard`, `.dtbl`, `.sched-card`, `.console`, `.vu-wrap`, `.sig`, `.bc-b`
