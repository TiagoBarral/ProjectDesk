# ProjectDesk New Computer Handoff

Prepared October 28, 2026 for continuing work after cloning the repository on a new computer.

## First Message for a New Codex Chat

Paste the following into the first ProjectDesk chat on the new computer:

```text
We are continuing ProjectDesk from another computer. The repository is cloned from:
https://github.com/TiagoBarral/ProjectDesk.git

Read AGENTS.md first and follow it as the project workflow. Then read:
- todo.md
- CHANGELOG.md
- README.md
- _private/NEW_COMPUTER_HANDOFF.md
- _private/JOURNAL.md when historical decisions or debugging context matter

Current stable branch is main. At handoff, main/origin/main pointed to:
1b769e0 feat: improve task suggestions with ai

Do not commit _private, .env, node_modules, dist, logs, or secrets. Preserve the existing desktop UI unless a change explicitly targets desktop. Mobile changes should remain responsive/mobile-specific. Ask me to test implementation changes before committing unless I explicitly ask you to push.
```

## Current Repository State

- Repository: `https://github.com/TiagoBarral/ProjectDesk.git`
- Stable/deployable branch: `main`
- Handoff commit: `1b769e0 feat: improve task suggestions with ai`
- App version in `package.json`: `0.6.0`
- Production deployment: Vercel, triggered from `main`
- Main was synchronized with `origin/main` when this handoff was prepared.
- The only ordinary untracked file was `extensions.txt`, a VS Code extension list.

## What ProjectDesk Is

ProjectDesk is a React + Vite standalone PWA for personal project and task management. It is designed for daily desktop and Android use. It keeps localStorage as an offline cache/fallback and uses Supabase for authenticated cross-device synchronization.

Core data and features include projects, tasks, subtasks, notes, links/files, task descriptions, priorities, project pinning, project search/filtering, JSON backup/import, dynamic project routes, mobile task cards, mobile overflow menus, sync status, PWA installation assets, and controlled service-worker updates.

## Current Backend and Security State

Authentication is implemented with Supabase Auth. RLS is enabled for:

- `projects`
- `tasks`
- `subtasks`
- `files`
- `profiles`
- `workspaces`
- `workspace_members`

The authenticated workspace foundation is implemented, including a migration path from the old anonymous/default workspace data. The current UI assumes one personal workspace; workspace switching and invitations are future growth work.

The `project-files` Supabase Storage bucket is private. Files use user-prefixed paths, authenticated Storage policies, and signed URLs. Physical Storage object cleanup is implemented after metadata soft deletion. Do not loosen these policies casually.

Supabase setup SQL lives in `supabase/`. Important migrations include:

- `add-auth-rls.sql`
- `add-workspaces.sql`
- `make-file-storage-private.sql`

## Local Environment

The local `.env` contains these variable names:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

`ANTHROPIC_MODEL` is optional because the server route falls back to `claude-haiku-4-5-20251001`.

Vercel also needs the Anthropic key in its environment. Vercel environment variables remain in Vercel and do not need to be copied between computers, but the new local clone needs its own `.env`.

Never commit `.env` or `_private/CREDENTIALS.md`.

## Recent AI Feature

The New/Edit Task modal has an explicit AI Improve action. One click sends the current title and description to the server-side `/api/improve-task` route and returns both a polished title and a practical description. It never auto-saves; the user still confirms the task.

The server route uses the Anthropic Messages API, defaults to `claude-haiku-4-5-20251001`, limits input/output, rate-limits requests, and times out. Local Vite development serves the same route through middleware in `vite.config.js`.

The button uses a sparkle treatment. Desktop text is `Improve with AI`; mobile text is `AI Improve`. During loading it reads `Improving...`.

A recurring lesson from this work: installed PWAs may briefly show an older bundle until the controlled service-worker update is accepted or the app reloads. Verify the deployed commit before assuming a mobile-only code regression.

## UX Decisions to Preserve

- Desktop should remain spacious and close to the original artifact design.
- Mobile can use different responsive patterns when phone ergonomics require it.
- Projects appear before the Priority Dashboard.
- Homepage Projects and Priority Dashboard are separated by whitespace and a subtle divider.
- Mobile project cards are compact and dense.
- Secondary mobile actions belong in overflow menus.
- The account/workspace menu is connected to a top-right gear and clamps within the viewport.
- Priority colors are semantic: High red, Medium orange, Low green.
- Project identity should stay neutral/slate/blue and should not compete with priority colors.
- Avoid redesigning the app without an explicit request.

## Sensitive Technical Areas

### Sync

`src/lib/storage.js` and the hydration/refresh logic in `src/App.jsx` were hard-won. Preserve localStorage fallback, pending local edits, scoped row-level writes, `updated_at` conflict handling, and `deleted_at` soft deletes. Do not use broad full-state saves casually and do not resurrect stale deleted rows.

### Routing

Project route parameters are slugs, not always IDs. Use the central resolver: stored slug first, generated slug second, ID fallback. On rename, update name and slug in state, persist, then navigate. Do not redirect home while hydration or rename routing is pending.

### Files

Do not store base64 file contents in localStorage. Supabase Storage contains file objects; database rows contain metadata. Opening private files depends on signed URLs.

### PWA

The service worker uses a controlled update flow. Navigation must remain network-first and `index.html` must not be aggressively cached. Stale deployments caused real confusion in the past.

## Quality Commands

Run these from the cloned repository:

```bash
npm install
npm run test:run
npm run lint
npm run format:check
npm run build
npm run smoke
```

At the last AI feature push, lint and the production build passed. The test suite had 12 passing tests during implementation.

## Main Remaining Work

The authoritative list is `todo.md`. Important open themes at handoff:

- Due dates or scheduled task dates
- Search across projects, tasks, notes, and files
- Tags/labels
- Reset/demo-data action
- Continued real-phone mobile polish
- Android PWA install and offline-launch testing
- App screenshots and remaining install polish
- Empty states for no tasks/no projects
- Priority visual cleanup, spacing, and typography refinement
- Optional workspace switching and invitation/member management if multi-user use becomes necessary
- Finish production validation/budget controls for the Anthropic integration
- Consider extracting the journal workflow into a reusable Codex skill

## Local-Only Files to Restore

Copy these into the root of the new clone while preserving paths:

- `.env`
- `_private/CREDENTIALS.md`
- `_private/JOURNAL.md`
- `_private/NEW_COMPUTER_HANDOFF.md`
- `extensions.txt` (optional, for recreating the editor setup)

Do not copy `node_modules`, `dist`, or Vite logs. Recreate dependencies with `npm install` and build output with `npm run build`.

## Data That Is Not in Git or the Transfer Folder

Browser localStorage is tied to the browser/profile/origin and is not copied with the source tree. Before retiring the old computer, use ProjectDesk's Data menu to export a JSON backup. This is especially important if the sync indicator shows offline/error or there may be pending local edits.

After signing in on the new computer, Supabase should load synchronized remote data. Keep the JSON export until the new device has been verified.

## New Computer Checklist

1. Clone the GitHub repository.
2. Copy the local-only transfer files into the clone.
3. Install current Node.js LTS and run `npm install`.
4. Optionally install VS Code extensions from `extensions.txt`.
5. Run `npm run test:run`, `npm run lint`, and `npm run build`.
6. Start with `npm run dev`.
7. Sign in and verify projects load from Supabase.
8. Create/edit one test task and confirm sync.
9. Upload and open one small file to verify private Storage signed URLs.
10. Test AI Improve locally.
11. Keep the old computer and JSON export available until all checks pass.

## Working Style

- Debate first when product/UX direction is unclear or the user says “let's debate.”
- Implement directly when requirements are clear.
- For large features, start with a small slice.
- Explain file edits before making them.
- Do not commit or push unless explicitly asked.
- Run the build before implementation pushes.
- Update `CHANGELOG.md` for meaningful user-facing changes and update `_private/JOURNAL.md` in the same action.
- Before committing implementation changes, ask the user to test and provide a concrete test checklist unless the user explicitly asks to push immediately.

