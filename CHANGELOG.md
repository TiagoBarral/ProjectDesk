# Changelog

All notable changes to ProjectDesk will be documented in this file.

This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and can later adopt semantic versioning once releases begin.

## [Unreleased]

### Added
- Added `.gitignore` with exclusions for generated files, local env files, logs, and private local-only files.
- Converted the original single-file Claude artifact into a standalone React + Vite app.
- Added a component-based structure under `src/`.
- Added `package.json`, `index.html`, `vite.config.js`, and Vite build scripts.
- Added project dashboard cards with completion rings.
- Added global priority dashboard across all projects.
- Added filters for importance, project, and status.
- Added project detail tabs for tasks, notes, and files.
- Added task creation, completion toggles, deletion, priority dots, and importance badges.
- Added subtask creation, completion toggles, deletion, and inline editing.
- Added editable project name, status, and color.
- Added editable tasks via modal.
- Added editable file/link display names and link paths.
- Added notes editing per project.
- Added file/link support per project.
- Added localStorage persistence as the default offline-first cache.
- Added a storage adapter structure so Supabase can replace or supplement localStorage.
- Added installable PWA support with `manifest.webmanifest`, `sw.js`, and app icon.
- Added responsive mobile layout for Android.
- Added mobile-friendly priority task cards instead of a cramped table.
- Added touch-friendly button/input sizing.
- Added real browser routing for project pages and tabs.
- Added browser back/forward support.
- Added refresh-safe project detail routes.
- Added dynamic name-based project URL slugs.
- Added route canonicalization when a project is renamed.
- Added Supabase client setup with `@supabase/supabase-js`.
- Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variable support.
- Added `.env.example`.
- Added Supabase schema under `supabase/schema.sql`.
- Added Supabase sync adapter with localStorage fallback/offline cache.
- Added SQL tables for projects, tasks, subtasks, and files.
- Added seeded demo data for all projects with tasks, subtasks, notes, priorities, and links.
- Added `todo.md` with remaining project work and setup steps.
- Added detailed Supabase sync enablement steps to `todo.md`.
- Added project journal rules to `AGENTS.md`.
- Added a phased product roadmap to `todo.md`.

### Changed
- Replaced Claude/Cowork-specific save logic with a reusable data layer.
- Moved project location from `D:\NB25702\OneDrive - Novabase\Documents\New project` to `D:\PERSONAL\ProjectDesk`.
- Changed routing from id-only paths like `/projects/polimetrics/tasks` to dynamic name slugs like `/projects/societymetrics/tasks`.
- Kept id-based route fallback so old links still resolve.
- Preserved the original visual design while improving structure and responsiveness.
- Updated storage key versions during demo data and persistence changes so fresh test data could load cleanly.
- Simplified Supabase sync to plain `projects`, `tasks`, `subtasks`, and `files` tables with localStorage-first saves.
- Removed current-phase Supabase RLS/auth assumptions from the schema documentation; auth and RLS remain future work.

### Fixed
- Fixed Supabase save sync to upsert exact `projects`, `tasks`, and `subtasks` rows with required foreign keys.

### Verified
- Installed Node.js/npm through winget when npm was missing.
- Installed project dependencies.
- Verified production builds with `npm run build`.
- Started the Vite dev server locally.
- Verified local app response at `http://localhost:5173/`.
- Verified network app URL for Android testing at `http://192.168.1.75:5173/`.
- Verified direct project routes return successfully.
- Verified build after routing, editing, seeded data, and Supabase changes.

### Known Next Work
- Connect the local repository to GitHub.
- Decide whether to rename the default branch from `master` to `main`.
- Run the Supabase SQL schema in a real Supabase project.
- Test desktop-to-Android and Android-to-desktop sync.
- Add visible Supabase sync/offline error states.
- Add create/delete project flows.
- Add safer delete confirmations.
- Add auth later and update RLS policies to use `owner_id = auth.uid()`.
