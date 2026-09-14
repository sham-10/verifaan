# Verifaan — Design System

Full reasoning: ADR-006 in Confluence (space VFN, Architecture Decision Records page).

## What this product is
A precision engineering tool for QA professionals, closer in spirit to VS Code,
Linear, or Tosca Commander than to a marketing site or generic SaaS dashboard.
Dense, information-rich, restrained. The step list and properties panel are
the product; nothing should visually compete with them.

## Color
| Token | Hex | Use |
|---|---|---|
| `--bg-panel` | `#0F1115` | App background, dark panels |
| `--bg-surface` | `#1A1D23` | Cards, panel surfaces, elevated areas |
| `--text-primary` | `#E5E7EB` | Primary text on dark surfaces |
| `--accent` | `#6366F1` | Actions, selection, focus states — the ONLY accent color |
| `--status-pass` | (standard green) | PASS state only, nowhere else |
| `--status-fail` | (standard red/rose) | FAIL state only, nowhere else |

Green and red are reserved exclusively for execution status. Never use them
for anything else (icons, buttons, decoration), or PASS/FAIL loses its
visual meaning.

## Typography
- One sans-serif for UI chrome: Inter or system-ui.
- One monospace for anything representing code, locators, or JSON (step
  target values, properties panel fields): keeps "this is data" visually
  distinct from "this is interface."
- No more than two typefaces total.

## Layout
- Dense, IDE-style, not landing-page spacious.
- Panels separated by 1px hairline borders (`border-white/10` or similar),
  not drop shadows.
- Minimal corner radius: 2 to 4px. Not the rounded-everything "SaaS-card
  kit" look.
- Three-panel Test Designer layout (Actions / Test Steps / Properties) is
  the primary screen; everything else is secondary.

## What to avoid (the generic AI-UI defaults)
- Soft grey drop shadows under every card (`rgba(0,0,0,.1)`-style)
- One border-radius applied uniformly regardless of hierarchy
- Gradient washes as decoration
- Tracked-out ALL-CAPS labels, meta strings joined with middle dots, em-dash
  labels, "→" appended to buttons — generic template chrome, not this
  product's voice
- A landing-page hero moment on what is a working tool, not a marketing page

## Foundation
Build on shadcn/ui (Radix primitives) + Tailwind CSS, per ADR-001 and
ADR-006. Use shadcn's accessible primitives (dialogs, dropdowns, tooltips)
rather than hand-rolling equivalents.

## Quality floor (non-negotiable, don't need to be asked)
- Responsive down to a reasonable minimum width
- Visible keyboard focus states
- Reduced-motion respected
- Sufficient color contrast on the dark palette above

## Writing in the UI
- Name things by what a QA engineer understands, not by internal system
  names (e.g. "Steps," not "step entities").
- Buttons say exactly what happens: "Save test," "Run test," not "Submit."
- Errors state what went wrong and how to fix it, in the interface's voice,
  never vague, never apologetic.
- An empty state (e.g. no tests yet) is an invitation to act, not a mood.