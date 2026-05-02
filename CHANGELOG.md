# Changelog

All notable changes to ProjectDesk will be documented in this file.

This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic versioning for releases.

## [Unreleased]

### Added
- Added safer confirmation modals for deleting tasks, subtasks, and files.
- Added project pinning so important projects stay at the top.
- Added a home-page Data modal for JSON export and import backups.
- Added a Supabase migration for the project `pinned` column.
- Added persistent Supabase Storage uploads for project files.
- Added Supabase file storage migration and setup notes for the `project-files` bucket.
- Added a real not-found page for invalid project routes.
- Added desktop breadcrumbs inside project detail pages.
- Added a mobile dashboard filter sheet so filters no longer consume permanent screen space.
- Added a mobile-only floating Add Task button in project detail.
- Added mobile task metadata lines that summarize priority and status.
- Added a controlled PWA update toast with a Reload action for new deployments.

### Changed
- Changed uploaded file persistence from browser-only data URLs to metadata synced through Supabase.
- Changed the mobile home layout to show Projects before the Priority Dashboard.
- Made mobile project cards, project tabs, and Priority Dashboard summary cards more compact.
- Tightened mobile project cards, task rows, and the dashboard filter sheet for denser phone use.
- Replaced mobile Priority Dashboard priority/status text badges with compact status dots.
- Changed service worker navigation caching to network-first so Vercel deployments appear more reliably.
- Changed successful sync feedback into a short toast so "Synced just now" no longer stays visible during normal use.
- Improved mobile project detail layout with a stacked header, full-width tabs, simplified task cards, near full-screen modals, and sync indicator spacing.
- Changed task creation in project detail from a header button to a compact inline add-task row.
- Reduced Priority Dashboard task title weight for calmer scanning.

### Fixed
- Prevented unresolved project routes from silently falling back to the home page.
- Normalized duplicate project slugs so active project routes remain unique.
- Prevented uploaded files from appearing before their Supabase metadata row is saved.
- Prevented remote refresh from treating file metadata load errors as an empty file list.
- Made offline edits cache to localStorage immediately before Supabase sync is attempted.
- Added pending-sync retry after remote refresh so failed or offline local edits can sync when Supabase is reachable again.
- Hardened sync normalization against duplicate local records and missing timestamps before Supabase upserts.
- Kept stale local rows from overwriting newer Supabase rows while preserving explicit pending local changes.
- Prevented a failed background refresh after a successful save from incorrectly leaving the sync indicator stuck on `Sync failed`.
- Made remote refresh apply Supabase data to the UI before retrying pending local edits, so one bad pending row cannot block cross-device updates.

## [0.6.0] - 2026-04-29

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
- Added a small production-safe logger with dev-only debug/info logs and always-on warnings/errors.
- Added frontend pagination for the priority task list with page controls, item counts, and rows-per-page options.
- Added `deleted_at` soft-delete support for projects, tasks, and subtasks in the Supabase schema.
- Added automatic Supabase refresh on startup, focus, visibility changes, periodic polling, and after successful local saves.
- Added a small sync indicator for syncing, synced, error, and offline states.
- Added a last-synced timestamp to the sync indicator.
- Added task `title` and `description` support with clickable task detail modals.
- Added a home-page new project button and creation modal.
- Added project deletion from the project detail view with a confirmation modal.

### Changed
- Replaced Claude/Cowork-specific save logic with a reusable data layer.
- Moved project location from `D:\NB25702\OneDrive - Novabase\Documents\New project` to `D:\PERSONAL\ProjectDesk`.
- Changed routing from id-only paths like `/projects/polimetrics/tasks` to dynamic name slugs like `/projects/societymetrics/tasks`.
- Kept id-based route fallback so old links still resolve.
- Preserved the original visual design while improving structure and responsiveness.
- Updated storage key versions during demo data and persistence changes so fresh test data could load cleanly.
- Simplified Supabase sync to plain `projects`, `tasks`, `subtasks`, and `files` tables with localStorage-first saves.
- Removed current-phase Supabase RLS/auth assumptions from the schema documentation; auth and RLS remain future work.
- Replaced temporary render, route, hydration, and Supabase debug logs with concise logging summaries.
- Changed task displays to use short titles while keeping descriptions in task detail views.
- Changed priority dots to mirror task importance instead of using a separate selector.
- Changed importance dropdowns to use the same red, orange, and green visual mapping as importance badges and priority dots.
- Changed project colors to read as muted identity accents so they compete less with priority colors.
- Changed projects to use a single slate-gray accent with no project color picker.
- Renamed the Priority Dashboard task table column from `Importance` to `Priority`.
- Changed the home-page new project button to use a calmer blue project action color.
- Changed project creation from a header button to an add-project card inside the project grid.
- Moved the add-project card to the first grid position.
- Polished the project section heading.
- Matched the Priority Dashboard heading and subtitle typography to the Projects section.
- Fixed Priority Dashboard table alignment so long project names truncate cleanly and priority badges are centered.
- Centered the Priority Dashboard project column header and project chips.

### Fixed
- Fixed Supabase save sync to upsert exact `projects`, `tasks`, and `subtasks` rows with required foreign keys.
- Fixed deployed app refresh behavior so startup loads localStorage first, then hydrates from Supabase without saving local state back during initialization.
- Fixed hydration race so remote Supabase state is applied directly to React state before hydration completes.
- Fixed project route matching to use normalized project slugs instead of deriving route identity directly from display names.
- Fixed project rename persistence by saving project slugs locally and to Supabase.
- Fixed project rename navigation so the app applies the renamed project state before moving to the new slug route.
- Fixed project rename route races by pausing route fallback while the renamed project route is pending.
- Fixed stale remote hydration overwrites by timestamping project/task edits and merging local and Supabase state by `updated_at`.
- Fixed stale-device sync conflicts by keeping soft-delete tombstones, hiding deleted items in the UI, and only upserting rows when the local item event is newer than Supabase.
- Fixed local ghost-state divergence by treating Supabase as authoritative during hydration unless a local-only item is explicitly marked `sync_pending`.
- Fixed cross-device convergence delay so another device's changes can appear without manual refresh.
- Fixed project normalization to preserve stored slugs before deriving a slug from the display name.

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
- Test desktop-to-Android and Android-to-desktop sync.
- Continue mobile UX polish for task cards, filters, and project detail views.
- Verify Android PWA install and offline launch behavior.
- Add safer delete confirmations for tasks, subtasks, and files.
- Add search, import/export backup, and optional AI task improvement.
- Add auth later and update RLS policies to use `owner_id = auth.uid()`.
