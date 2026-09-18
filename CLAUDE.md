# Verifaan

Test automation platform, portfolio project.
Requirements and decisions: Confluence space VFN (PRD, ADRs, Domain Model, API Contract).
Technical reference mirrors: see /docs.

## Stack
- Backend: Node.js, TypeScript, Fastify, Prisma, SQLite
- Frontend: React, TypeScript, Vite, Tailwind, dnd-kit
- Testing: Vitest, Supertest, React Testing Library

## Rules
- Strict TDD: always write a failing test first. Never write the test and
  the implementation in the same step. Wait for me to confirm the test fails
  before writing implementation code.
- Explain any pattern or library usage I have not seen before, briefly, in
  the same message as the code.
- After every new implementation, briefly explain, at a high level, what
  you did and what the code does.
- Do not add dependencies without asking first.
- Do not change the Prisma schema without flagging it, it must stay in sync
  with docs/schema.md and the Confluence Domain Model page.

## Code quality principles
Apply these on every change, not just when asked:
- KISS (Keep It Simple): prefer the plainest solution that satisfies the
  test. If two approaches both pass, pick the one with fewer moving parts.
- YAGNI (You Aren't Gonna Need It): don't build for a future requirement
  that doesn't exist yet. No speculative abstractions, no config options
  nothing currently uses.
- DRY (Don't Repeat Yourself): don't copy-paste logic across two places,
  but don't force a shared abstraction onto two things that only look
  similar today and may need to diverge, duplication is often cheaper
  than the wrong abstraction.
- Single Responsibility: a function does one job. If you're writing "and"
  when describing what a function does, split it.
- Prefer named, top-level functions over inline/anonymous ones,
  especially for anything with real logic (not a one-line callback).
  Someone reading the file should be able to find and understand each
  step by its name, not by unwinding nested closures.
- Readability over cleverness: optimize for the next person (including me
  in a future session) reading this code cold, not for fewest lines or
  fewest files.
- If a piece of code needs a paragraph to explain what it does, that's a
  signal to restructure it into smaller, named pieces, not to add a
  comment.
- When a change could be written two ways, one straightforward and one
  "elegant" but harder to follow, explain the tradeoff before picking
  the clever one, don't apply it silently.
  
## Design
Before building any UI component, read frontend/DESIGN.md for color, type,
and layout tokens. Do not introduce colors, fonts, or spacing values not
defined there.