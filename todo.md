# ProjectDesk TODO

## Setup and Repository
- [ ] Create the GitHub repository and add it as `origin`.
- [ ] Make the first clean commit from `D:\PERSONAL\ProjectDesk`.
- [ ] Decide whether the default branch should be `main` instead of `master`.

## Supabase Sync
- [ ] Create or choose the Supabase project.
- [ ] Run `supabase/schema.sql` in the Supabase SQL editor.
- [x] Create a local `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] Restart the Vite dev server after adding `.env`.
- [ ] Verify desktop edits sync to Android.
- [ ] Verify Android edits sync back to desktop.
- [ ] Add a visible sync/offline error state if Supabase save fails.
- [ ] Consider replacing full-table save with row-level upserts/deletes for larger datasets.

## Enable Supabase Sync Steps
- [ ] Open the Supabase dashboard and create/select a project.
- [ ] Go to the SQL editor in Supabase.
- [ ] Paste and run the full contents of `supabase/schema.sql`.
- [ ] In Supabase, go to Project Settings > API.
- [x] Copy the Project URL.
- [x] Copy the anon public API key.
- [x] In `D:\PERSONAL\ProjectDesk`, create a `.env` file based on `.env.example`.
- [x] Add `VITE_SUPABASE_URL=your-project-url` to `.env`.
- [x] Add `VITE_SUPABASE_ANON_KEY=your-anon-key` to `.env`.
- [ ] Stop the running Vite server if it is active.
- [ ] Restart with `npm run dev -- --host 0.0.0.0`.
- [ ] Open the app on desktop and make one small edit.
- [ ] Open the Android URL on the phone and confirm the edit appears.
- [ ] Make one edit on Android and confirm it appears on desktop after refresh.
- [ ] Keep `.env` out of git.

## App Functionality
- [ ] Add create/delete project flows.
- [ ] Add safer delete confirmations for projects, tasks, subtasks, and files.
- [ ] Add project ordering or pinning.
- [ ] Add due dates or scheduled dates for tasks.
- [ ] Add search across projects, tasks, notes, and files.
- [ ] Add tags or labels for tasks.
- [ ] Add a reset/demo-data action for testing.
- [ ] Add import/export JSON backup.

## Routing and Navigation
- [ ] Keep testing name-based project routes after renames.
- [ ] Add redirect handling for duplicate project-name slugs.
- [ ] Add a 404/not-found state for invalid routes instead of silently going home.
- [ ] Consider adding breadcrumb navigation inside project detail pages.

## Mobile and PWA
- [ ] Test install flow on Android from Chrome.
- [ ] Test offline launch after installing the PWA.
- [ ] Verify all edit modals are comfortable on small Android screens.
- [ ] Add app screenshots/icons for a more polished install prompt.
- [ ] Decide where to deploy over HTTPS so Android install works outside localhost.

## Product Roadmap

### Phase 2 - Mobile UX
Goal: make the app usable daily on a phone without breaking desktop.

- [ ] Replace task table with mobile task cards.
- [ ] Stack project cards vertically on small screens.
- [ ] Reduce dashboard density on mobile.
- [ ] Increase tap targets for buttons and icons.
- [ ] Move task/project actions into an overflow menu or swipe interaction.
- [ ] Add a sticky bottom `+ Add Task` button.
- [ ] Collapse filters into a dropdown or modal.
- [ ] Simplify the project view on mobile so tasks stay the focus.
- [ ] Keep all changes responsive and preserve the desktop layout.

### Phase 3 - PWA
Goal: make the app feel like an installable mobile app.

- [ ] Add or verify `manifest.json` / `manifest.webmanifest`.
- [ ] Add or verify the service worker.
- [ ] Configure app name.
- [ ] Configure icons.
- [ ] Configure theme color.
- [ ] Enable and test Add to Home Screen.
- [ ] Test install on Android.
- [ ] Ensure fullscreen or standalone display mode without browser UI.
- [ ] Ensure basic offline capability.

### Phase 4 - Sync UX
Goal: make sync status trustworthy and visible.

- [ ] Add sync indicator states: Saving, Saved, Offline, Error.
- [ ] Show offline mode clearly.
- [ ] Show sync failure without blocking local app usage.
- [ ] Prevent silent sync failures.

### Phase 5 - Data Stability
Goal: prevent future data bugs.

- [ ] Normalize state on load.
- [ ] Handle local vs Supabase conflicts.
- [ ] Prevent duplicate inserts.
- [ ] Ensure consistent IDs across devices.
- [ ] Add safe fallback if Supabase fails.

### Phase 6 - UX Polish
Goal: make the app enjoyable for daily use.

- [ ] Clean priority visuals and reduce noise.
- [ ] Add subtle animations for task completion and task creation.
- [ ] Improve loading states.
- [ ] Add empty states for no tasks and no projects.
- [ ] Improve spacing and typography.

### Phase 7 - Optional Growth
Goal: support multi-user or production use only if the app grows.

- [ ] Add Supabase Auth.
- [ ] Add RLS for data isolation.
- [ ] Add backup/export.
- [ ] Add conflict handling.

## Future Auth
- [ ] Later: add login/auth and update Supabase RLS policies for authenticated users.
- [ ] Add user profile/workspace support if more than one person will use the app.
- [ ] Add migration path from anonymous `workspace_id = 'default'` data to authenticated data.

## Quality
- [ ] Add basic component tests for storage transforms and route helpers.
- [ ] Add a lint/format setup.
- [ ] Add a smoke test for build and direct project routes.
- [ ] Review accessibility for icon-only edit/delete buttons.
