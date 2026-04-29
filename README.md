# ProjectDesk

ProjectDesk is a personal project management web app built from a converted single-file artifact into a standalone React + Vite application.

It is designed for daily use on desktop and Android, with project cards, a priority dashboard, editable tasks and subtasks, task detail descriptions, notes, files/links, mobile-friendly layouts, local offline storage, PWA support, and optional Supabase sync.

Current release: `v0.6.0` functional alpha / early private beta.

## Features

- Project dashboard with progress cards
- Priority dashboard across all projects
- Filters by importance, project, and status
- Project detail pages with Tasks, Notes, and Files tabs
- Create, edit, and delete projects
- Editable project names and statuses
- Task titles plus optional descriptions
- Task detail modal with project, priority, status, description, and subtasks
- Editable tasks and subtasks
- Task priorities and importance levels
- Project notes
- File/link tracking per project
- Completion stats
- Responsive Android-friendly UI
- Browser routes for project pages and tabs
- Refresh-safe navigation
- Browser back/forward support
- Installable PWA support
- localStorage persistence by default
- Optional Supabase sync with localStorage fallback
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
    App.jsx
    index.css
    main.jsx
  supabase/
    schema.sql
    add-task-title-description.sql
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
- Supabase is used when environment variables are configured.
- If Supabase is unavailable, the app keeps working from localStorage.
- Saves write to localStorage first, then sync scoped row changes to Supabase.
- Remote refresh runs on startup, focus, visibility changes, a timed interval, and after successful saves.
- Projects, tasks, and subtasks use `updated_at` and `deleted_at` so newer edits and soft deletes can converge across devices.

The storage layer lives in:

```text
src/lib/storage.js
src/lib/supabase.js
```

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

The app is functional as an early private beta. It supports local daily use, optional Supabase cross-device sync, browser routes, PWA basics, and project/task management flows. Before treating it as a stable daily-driver release, verify Android PWA install/offline behavior and continue real-world desktop-to-mobile sync testing.
