# GitHub Copilot Instructions — Sottotesi

Follow the repository-wide rules defined in `/AGENTS.md`.

Before modifying implementation:

- Read `docs/architecture.md`.
- When working on a specific application context, read the relevant file in `docs/views/`.
- For UI or styling work, read `docs/styleguide.md`.

Treat these documents as project context and verify them against the actual implementation when necessary.

## Current phase

The project is in consolidation, cleanup and UI refinement.

Prefer:
- small scoped changes;
- existing components;
- existing patterns;
- existing tokens;
- safe removal of verified dead code.

Do not:
- introduce speculative features;
- perform repository-wide refactors unless explicitly requested;
- change UX semantics as part of visual cleanup;
- merge Admin, Coach, Student or Public application shells.

## Technical rules

- Use `@` aliases for imports.
- Shared CSS variables belong in `src/styles/theme.css`.
- Do not introduce arbitrary hardcoded design values when an appropriate existing token exists.
- Preserve context-specific Layout, Header and Sidebar components.
- Drawers are actions/interfaces, not sources of truth.

For recurring audit or consolidation workflows, use the available project skills.