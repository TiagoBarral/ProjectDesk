# ProjectDesk

ProjectDesk is a personal project management web app built from a converted single-file artifact into a standalone React + Vite application.

It is designed for daily use on desktop and Android, with project cards, a priority dashboard, editable tasks and subtasks, task detail descriptions, notes, files/links, mobile-friendly layouts, local offline storage, PWA support, and optional Supabase sync.

Current release: `v0.6.0` functional alpha / early private beta.

## Features

- Project dashboard with progress cards
- Project pinning so important projects stay first
- Priority dashboard across all projects
- Filters by importance, project, and status
- Mobile dashboard filter sheet for smaller screens
- Project detail pages with Tasks, Notes, and Files tabs
- Create, edit, and delete projects
- Editable project names and statuses
- Safer confirmation modals for destructive deletes
- Task titles plus optional descriptions
- Task detail modal with project, priority, status, description, and subtasks
- Editable tasks and subtasks
- Task priorities and importance levels
- Project notes
- Persistent file uploads and link tracking per project
- JSON export/import backups
- Email/password login with Supabase Auth
- Completion stats
- Responsive Android-friendly UI
- Browser routes for project pages and tabs
- Refresh-safe navigation
- 404/not-found page for invalid routes
- Desktop breadcrumbs in project detail pages
- Browser back/forward support
- Installable PWA support
- Controlled PWA update prompt for new deployments
- localStorage persistence by default
- Authenticated Supabase sync with localStorage fallback
- Sync status indicator with last synced, syncing, offline, and error states

## Tech Stack

- React
- Vite
- Supabase JavaScript client
- CSS
- localStorage
- PWA manifest and service worker

## Project Structure

```text
ProjectDesk/
  public/
    icon.svg
    manifest.webmanifest
    sw.js
  src/
    components/
    lib/
      storage.js
      supabase.js
      auth.js
    App.jsx
    index.css
    main.jsx
  supabase/
    schema.sql
    add-task-title-description.sql
    add-file-storage.sql
    add-project-pinning.sql
    add-auth-rls.sql
  CHANGELOG.md
  README.md
  todo.md
  package.json
  vite.config.js
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

For testing from an Android phone on the same Wi-Fi:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the network URL that Vite prints, for example:

```text
http://192.168.1.75:5173/
```

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Quality Checks

Run the focused unit tests:

```bash
npm run test:run
```

Run lint:

```bash
npm run lint
```

Run the smoke check for production build plus direct project route helpers:

```bash
npm run smoke
```

Format the new quality tooling and test files:

```bash
npm run format
```

The formatter is intentionally scoped to the new tooling/test files to avoid a noisy whole-app formatting pass.

Check formatting without rewriting files:

```bash
npm run format:check
```

Check production dependency advisories:

```bash
npm audit --omit=dev
```

## Routing

The app uses browser routes without adding a routing library.

Examples:

```text
/
/projects/polimetrics/tasks
/projects/polimetrics/notes
/projects/polimetrics/files
```

Project URLs are generated from project names. If a project is renamed, the app updates the URL slug automatically.

Old id-based links still resolve and are canonicalized to the current name-based path.

## Storage

ProjectDesk uses a storage adapter pattern:

- localStorage is always used as the offline cache.
- Supabase is used when environment variables are configured and a user is signed in.
- If Supabase is unavailable, the app keeps working from localStorage.
- Signed-in localStorage cache is scoped by Supabase user id.
- Saves write to localStorage first, then sync scoped row changes to Supabase.
- Remote refresh runs on startup, focus, visibility changes, a timed interval, and after successful saves.
- Projects, tasks, subtasks, and file metadata use `updated_at` and `deleted_at` so newer edits and soft deletes can converge across devices.
- Pending local edits are retried after remote refresh when Supabase becomes reachable again.
- Stale local rows are skipped during Supabase upsert so older devices do not overwrite newer remote data.
- Remote refresh applies Supabase data to the UI before retrying pending local edits, so one failed retry does not block cross-device updates.
- Uploaded file bytes are stored in Supabase Storage bucket `project-files`; localStorage stores metadata only.
- New uploaded files are stored under user-specific Storage paths and opened with signed URLs.

The storage layer lives in:

```text
src/lib/storage.js
src/lib/supabase.js
src/lib/auth.js
```

## Supabase Auth Setup

ProjectDesk now uses Supabase Email/Password Auth for cross-device sync.

1. In Supabase, enable Email provider authentication.
2. Create or sign up the first ProjectDesk user.
3. Run `supabase/add-auth-rls.sql` in the Supabase SQL editor.
4. If you already had pre-auth rows in Supabase, copy the new user's UUID from Supabase Auth and run the commented backfill block in `supabase/add-auth-rls.sql` so those rows are claimed by your account.
5. Restart the Vite dev server and sign in.

The app keeps local offline cache behavior. On first sign-in, if no user-scoped cache exists on that browser, ProjectDesk can read the old pre-auth local cache and save it under the signed-in user.

The `project-files` bucket is prepared for user-prefixed private Storage paths. Keep the bucket public until any legacy pre-auth uploaded objects have been checked or migrated; then run the final commented `update storage.buckets set public = false` statement in `supabase/add-auth-rls.sql`.

## Supabase Sync

Supabase is optional. The app works immediately with localStorage.

To enable sync across desktop and Android:

1. Create or select a Supabase project.
2. Open the Supabase SQL editor.
3. Run the full contents of:

```text
supabase/schema.sql
```

If your database was created before task descriptions were added, also run:

```text
supabase/add-task-title-description.sql
```

If your database was created before persistent file uploads were added, also run:

```text
supabase/add-file-storage.sql
```

This creates/updates the public `project-files` Storage bucket for the current no-auth phase.

If your database was created before project pinning was added, also run:

```text
supabase/add-project-pinning.sql
```

4. Copy your Supabase Project URL.
5. Copy your anon public API key.
6. Create a local `.env` file from `.env.example`.
7. Add:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

8. Restart the Vite dev server.
9. Test one edit on desktop and confirm it appears on Android.
10. Test one edit on Android and confirm it appears on desktop.

## Authentication

Authentication is not enabled yet.

Supabase is intentionally simple for now: no login/auth, no RLS, and no realtime. Before sharing this app publicly, add authentication and enable Supabase RLS policies for authenticated users.

## PWA

The app includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icon.svg`

This allows the app to be installed from supported browsers. For Android install testing, serve the app from localhost or HTTPS.

The service worker uses a controlled update flow. New deployments can show an `Update available` prompt with a Reload action instead of forcing surprise reloads or keeping stale app code around for too long.

## Data Backups

The home page includes a small Data modal for:

- Exporting the current ProjectDesk state as JSON
- Importing a JSON backup

Imports replace the current dataset and mark missing records as soft-deleted so old Supabase rows do not silently reappear.

## Development Notes

Useful project documents:

- [CHANGELOG.md](CHANGELOG.md)
- [todo.md](todo.md)
- [supabase/schema.sql](supabase/schema.sql)

Avoid committing:

- `node_modules/`
- `dist/`
- `.env`
- Vite log files

## Current Status

The app is functional as an early private beta. It supports local daily use, optional Supabase cross-device sync, browser routes, PWA basics, file uploads, JSON backups, and project/task management flows. Before treating it as a stable daily-driver release, verify Android PWA install/offline behavior and continue real-world desktop-to-mobile sync testing.
