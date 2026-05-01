# ProjectDesk Agent Instructions

These instructions are persistent project context for Codex and other AI coding assistants working in this repository.

## Project Summary

ProjectDesk is a standalone React + Vite personal project management app.

Core goals:
- Daily desktop and Android use
- Responsive, touch-friendly UI
- Local offline-first persistence
- Optional Supabase sync across devices
- Installable PWA support

## Stack

- React
- Vite
- CSS
- localStorage
- Supabase JavaScript client
- Supabase SQL schema in `supabase/schema.sql`
- PWA manifest and service worker in `public/`

## Core Rules

- Preserve the current visual design unless the user explicitly asks for a redesign.
- Keep the UI quiet, practical, and mobile-friendly.
- Treat desktop and mobile as different UX contexts. Preserve desktop workflows where they work, and use mobile-specific patterns when phone ergonomics require a different layout or interaction.
- Prefer simple, local patterns over introducing new libraries.
- Keep localStorage as the fallback/offline cache.
- Do not add authentication until the user asks for it.
- Structure Supabase-related code so auth can be added later.
- Never commit secrets or real credentials.
- Never commit `.env`.
- Keep `.env.example` updated when environment variables change.
- Do not commit generated/runtime folders such as `node_modules/`, `dist/`, or local Vite logs.

## Important Files

- `src/App.jsx` — app shell, routing, and top-level state mutations
- `src/lib/storage.js` — localStorage/Supabase storage adapter
- `src/lib/supabase.js` — Supabase client setup
- `src/index.css` — main styling and responsive rules
- `supabase/schema.sql` — Supabase database schema and RLS policies
- `README.md` — user-facing setup and project documentation
- `CHANGELOG.md` — notable changes
- `todo.md` — known future work and setup checklist

## Development Commands

Install dependencies:

```bash
npm install
```

Start locally:

```bash
npm run dev
```

Start for Android testing on the same Wi-Fi:

```bash
npm run dev -- --host 0.0.0.0
```

Build:

```bash
npm run build
```

## Git Hygiene

Before connecting to GitHub or making the first commit:

- Add a `.gitignore`.
- Exclude:
  - `.env`
  - `.env.local`
  - `node_modules/`
  - `dist/`
  - `vite-server.log`
  - `vite-server.err.log`

## Branch Rules

- `main` is production: it must stay stable, deployable, and ready for Vercel.
- Branches are safe workspaces.
- Keep the workflow practical and simple; do not add ceremony when it does not protect the app.
- Create a branch for any change that affects app behavior.
- If unsure, use a branch.

Create a branch for:
- App logic, state, mutations, or hooks
- Routing and navigation
- Storage or sync logic, including localStorage and Supabase
- Supabase schema, queries, or migrations
- UI behavior or layout changes
- Dependency changes
- Anything that requires testing before going live

Committing directly to `main` is OK for:
- `README.md`, `todo.md`, `AGENTS.md`, or documentation-only edits
- Typos or comments
- Formatting-only changes
- Trivial config tweaks, as long as relevant checks still pass

Use short-lived branch names:
  - `feat/short-description` for new features
  - `fix/short-description` for bug fixes
  - `chore/short-description` for setup, tooling, dependency, or cleanup work
  - `docs/short-description` for documentation-only changes
  - `refactor/short-description` for structural changes without behavior changes

Examples:

```text
fix/supabase-hydration
chore/logging-cleanup
feat/mobile-layout
docs/update-readme
refactor/storage-adapter
```

Start work:

```bash
git checkout main
git pull
git checkout -b <branch-name>
```

Work and commit on the branch:

```bash
git add .
git commit -m "<type>: <short description>"
```

Before merging:

```bash
npm run build
```

Merge locally; no PR is required unless the user explicitly asks for one:

```bash
git checkout main
git merge <branch-name>
git push
```

Optionally delete the branch after merge.

## Commit Rules

- One logical change per commit.
- Avoid vague commits like `misc`, `updates`, or `wip`.
- Commit format:

```text
type: short description
```

Valid types:
- `feat`
- `fix`
- `chore`
- `docs`
- `refactor`
- `test`
- Do not label internal/dev-only changes as `feat`; use `chore` or `refactor` instead.

Examples:

```text
feat: add supabase sync adapter
fix: canonicalize project route after rename
docs: document android setup
chore: add gitignore
```

## Pull Request Rules

When a GitHub repo is connected:

- Pull requests are optional for solo work.
- Open a PR only when the user explicitly asks for one, or when review/discussion would add value.
- If a PR is opened, target `main` and include what changed, why it changed, and how it was tested.
- Delete short-lived branches after merge.

## Pre-Commit User Testing Gate

Before committing implementation changes:

- Stop and ask the user to test the implementation.
- Provide a short, concrete testing guide that explains:
  - what changed
  - where to look in the app
  - the main user flows to test
  - what should be different from before
  - any known limitations or specific edge cases to check
- Do not commit until the user confirms the implementation is acceptable, unless the user explicitly says to commit without testing.
- This applies especially to UI, routing, sync, storage, PWA, mobile, and Supabase changes.
- Documentation-only edits may be committed without a manual app test when no app behavior changed.

Before committing or opening a PR:

- Run `npm run build`.
- Update `CHANGELOG.md` under `[Unreleased]` for meaningful user-facing changes.
- Update `README.md` if setup, architecture, or usage changed.
- Update `todo.md` if new follow-up work was discovered or completed.
- Confirm no secrets or generated folders are included.
- Never push broken code to `main`.

## Changelog Rules

- Update `CHANGELOG.md` before committing code, not after every tiny working edit.
- Use the `[Unreleased]` section during active development.
- Keep entries user-facing and meaningful.
- Do not list every tiny internal edit.
- Documentation-only or internal cleanup commits only need changelog entries when they affect setup, usage, architecture, storage, routing, sync, releases, or user-visible behavior.
- Use these categories when useful:
  - `Added`
  - `Changed`
  - `Fixed`
  - `Removed`
  - `Verified`
  - `Known Next Work`

If a task changes code behavior, storage, setup, routing, UI, PWA behavior, or Supabase behavior, update `CHANGELOG.md` before the commit that includes that work.

## Versioning Rules

Use Semantic Versioning once releases begin:

```text
MAJOR.MINOR.PATCH
```

- `PATCH` for bug fixes only
- `MINOR` for backwards-compatible features
- `MAJOR` for breaking changes or major product direction changes

Release when a coherent set of work is stable end-to-end, not after every commit.

Release checklist:

1. All work is merged into `main`.
2. `npm run build` passes.
3. App runs locally without obvious errors.
4. Rename `[Unreleased]` in `CHANGELOG.md` to a version and date, for example:

```md
## [0.1.0] - 2026-04-27
```

5. Add a fresh empty `## [Unreleased]` section above the release.
6. Commit with:

```text
chore: release v0.1.0
```

7. Tag the commit:

```bash
git tag v0.1.0
```

8. Push the branch and tag.

## Documentation Rules

- Keep `README.md` accurate when setup or architecture changes.
- Keep `todo.md` focused on future work, setup tasks, and known gaps.
- Remove or update completed TODO items instead of leaving stale completed checkboxes forever.
- Keep `CHANGELOG.md` about what changed.
- Keep `todo.md` about what remains.
- Keep `README.md` about how to understand and run the project.

## Documentation Commit Timing

- Commit documentation immediately when it changes how we must work now, such as workflow, safety, secrets, deployment, or required setup rules.
- Batch small documentation notes, TODO refinements, wording tweaks, and future-idea entries into the next docs cleanup commit.
- Do not create tiny docs commits unless the change is operationally important or the user asks to save it now.

## Journal Rules

- Keep the personal development journal at `_private/JOURNAL.md`.
- `_private/` is gitignored and must never be committed.
- Whenever `CHANGELOG.md` is updated, update `_private/JOURNAL.md` in the same action without asking first.
- Also update the journal whenever the user asks, or after a session with meaningful work.
- Create a journal entry whenever there is a meaningful debate, planning decision, lesson learned, or "eureka" moment, even if no code changes were made.
- Capture why the debate or realization mattered, what options were considered, what decision was made, and how it should affect future work.
- The journal is not a changelog. It is a personal development log written for portfolio reflection.
- Write in first person: `I built`, `I learned`, `I got stuck`, not `the developer`.
- Keep it human and honest about confusion, failures, debugging, and decisions.
- Document every meaningful hurdle in a human way: what felt confusing, what looked misleading, what evidence changed the direction, and why it took time.
- When an issue is solved, add a resolution reflection too: what finally proved the fix worked, what the real root cause was, and what the full process taught me.
- Prefer a coherent story over a dry technical summary. Capture the arc from symptom, to false leads, to final proof.
- Use prose, not bullet-point dumps.
- Avoid technical jargon unless explaining the technical lesson is the point.
- Do not copy private details from other projects into this project's journal.

Use this format for each working session:

```md
## Month D, YYYY - Short title describing the session

### What I built

One or two paragraphs. Concrete and specific. What exists now that did not before.

### What I was trying to learn

What skill, concept, or problem drove this session beyond just shipping the feature.

### What went wrong

Honest account of failures, dead ends, and wasted time. Do not sanitize it.

### Biggest challenge / bug

The single hardest thing. One focused story: what it was, why it was hard, and how it was resolved.

### What I learned

The insight that will change how I approach something next time.

### What I would do differently

Specific and actionable. What would change if starting over with today's knowledge.
```

## Supabase Rules

- Supabase is optional; localStorage must keep working without it.
- Required env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Never commit real Supabase keys.
- Keep `.env.example` in sync with required env vars.
- SQL schema changes belong in `supabase/schema.sql`.
- Current no-auth mode is intentionally simple: no login/auth, no RLS, no realtime.
- When auth is added later, enable RLS and add authenticated-user policies.

## Routing Rules

- Project routes use name-based slugs.
- If a project is renamed, the route should canonicalize to the new slug.
- Old id-based routes should keep resolving where practical.
- Refreshing a project tab route should preserve the active project and tab.

## Quality Rules

- Run `npm run build` after meaningful code changes.
- Check mobile behavior for layout-sensitive UI changes.
- Prefer small, focused edits over broad rewrites.
- Do not redesign the app unless explicitly asked.
