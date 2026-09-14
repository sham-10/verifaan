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
- Do not add dependencies without asking first.
- Do not change the Prisma schema without flagging it, it must stay in sync
  with docs/schema.md and the Confluence Domain Model page.

## Design
Before building any UI component, read frontend/DESIGN.md for color, type,
and layout tokens. Do not introduce colors, fonts, or spacing values not
defined there.