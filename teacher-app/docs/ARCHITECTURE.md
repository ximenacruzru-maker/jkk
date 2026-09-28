# Declara Teacher — architectural analysis

How the teacher edition was derived from Declara (`ximenacruzru-maker/vidura`), what was kept, what was replaced,
and how the local-first, private data layer works. Declara was read only; nothing in that repository was changed.

---

## A. Declara's architecture

| Area | Declara (insurance) |
|---|---|
| Build | Vite 8, TypeScript 6, React 19, `base: './'` so it runs from any sub-path |
| Routing | `react-router-dom` 7 `HashRouter`; every page is `lazy()`-loaded; routes gated by role (`can(me, 'books')` …) |
| State | No state library. Each page loads its own data with a small `useAsync` hook and calls Supabase directly; local UI state in `useState`; a few filters kept in module variables |
| Backend | Supabase: email/password auth (with recovery/invite links), Postgres with row-level security per agency, Storage (documents), Edge Functions (`agencyzoom-sync/refresh/history`, `commissions`, `legacy-data`, `legacy-import`, `platform-admin`, `staff-admin`) |
| Database | `staff_accounts`, `agencies`, `platform_admins`, `user_prefs`, `work_items`, `checklist_items/ticks`, `chat_messages`, `licenses`, `hr_staff/hr_punches`, `training_progress/status`, `agency_logins` (+ log), `documents`, `reference_data`, `lead_spend`, `sync_log`, `force_refresh_log`, policy/quote/account tables fed by AgencyZoom |
| Auth | `auth.tsx` context: Supabase session → staff account → role/section access (`lib/access.ts`); forced password change; browser storage stashed per agency (`agencyStorage.ts`) |
| Legacy screens | The original performance screens run in an iframe (`public/perf`, `LegacyHost`) with a scoped copy of their CSS |
| Styling | One global stylesheet (`src/styles.css`) built on CSS custom properties; themes are `html[data-theme=…]` overrides; the Executive Dashboard has its own scoped `executive.css` |
| Charts | Hand-written inline SVG (score-card gauges, bars, meters, day chart, donut, renewal chart) in `pages/executive/parts.tsx` |
| Quality | GitHub Actions: build, `oxlint`, and a Playwright layout test that visits every page at phone and desktop width in each theme against a Supabase stub; deploys to GitHub Pages |

## B. Reusable parts (carried over)

| Declara source | In the teacher app |
|---|---|
| `src/styles.css`: shell, sidebar, top bar, tiles, panels, tables, pills, drawer, tabs, forms, cards, checklist, progress bars, settings band/tabs, theme-picker rows, alert bar, toast, phone layout | `src/styles.css`, copied with only the insurance-only blocks removed (chat, AI panel, logins, renewals, year-over-year, agencies, legacy iframe, protégé cards) |
| All five themes, including Talavera's nine-slice painted tiles and Halloween's artwork | Unchanged, same assets (`src/assets/…`) |
| `lib/theme.ts` (themes, typefaces, seasonal themes, `applyLook`, flicker-free cache) | Same tables and logic; saving goes to `localStorage` only |
| `components/ui.tsx` (PageHead, Tile, Panel, Drawer, Tabs, Search, KV, Empty…) | Same components, plus autosaving `AutoText` / `AutoNumber` fields |
| `components/icons.tsx` | Same icon set, plus teacher icons |
| `components/Layout.tsx` (four-section sidebar, ☰ drawer on phones, global search dropdown, account menu, top-right actions) | Same structure; search now finds students/classes/assignments/goals; the sync pill shows "Saved"; the AI button became "Quick add" |
| `pages/executive/parts.tsx` (ScoreCard, Gauge, Bars, Meter, DayChart, Donut) | `components/charts.tsx`, same markup, restyled on the shared tokens |
| Settings layout and Appearance tab | `pages/Settings.tsx` |
| My Space daily checklist, Work Queue filters + inline form, Books of Business record drawer (`?open=<id>`) | Dashboard tasks panel, Calendar & Tasks list, student/assignment/goal drawers |
| `lib/format.ts` (dates, `downloadCsv`, `timeAgo`) | Same helpers, local date instead of Pacific time |
| Playwright layout test approach | `tests/e2e.mjs` (plus autosave, backup and privacy checks) |

## C. Insurance-specific parts (removed or replaced)

Not copied: `auth.tsx`, `lib/supabase.ts`, `lib/access.ts`, `lib/agencyStorage.ts`, `lib/data.ts` (policies, quotes, folios,
staff), `lib/books.ts` (accounts, P&C book, renewals), `lib/perf/*` (commissions, executive metrics, AgencyZoom),
`lib/foresight.ts`, `lib/logins.ts`, `DeclaraAI`, `ForesightAI`, `SyncControl`, `LegacyHost` + `public/perf`, `DocUpload`,
`LoginCreds`, `PasswordImport`, `FolioPicker`, and the pages Agencies, Books, ChangePassword, Chat, Licensing, MyPay,
Passwords, Proteges, RenewalAlert, Resources, Training, Foresight and the Executive Dashboard's insurance content.
Also the entire `supabase/` folder (functions, migrations, seeds, carrier logos).

Replaced with a classroom domain (not renamed): the dashboard's cards now measure students, classes, work due, attendance,
events and tasks; "clients" and "policies" have no counterpart — the teacher app models classes, students, assignments,
grades, attendance, goals, skills, notes and tasks from scratch.

## D. Theme system and how the teacher app inherits it

1. **Tokens.** `:root` defines the palette and shape as CSS custom properties (`--navy`, `--blue`, `--teal`, `--ink`,
   `--muted`, `--line`, `--bg`, `--card`, `--soft`, `--track`, `--tint`, `--good/warn/bad` and their `-bg`, sidebar
   gradient `--sideA/B/C`, `--radius`, `--shadow`, `--serif`, `--sans`).
2. **Themes.** `html[data-theme="talavera|bubblegum|dark|declara|halloween"]` redefines the tokens and adds decorative
   rules (Talavera's painted tile borders, cobalt top bar, framed KPI tiles; Halloween's purple sidebar art, drip edge and
   stamp-frame cards). A seasonal theme (Halloween, Sep 25 – Nov 1) only appears while in season.
3. **Typefaces.** `data-font` plus `--serif` (display) and `--sans` (body) switch six pairings.
4. **Applying.** `applyLook()` sets the attributes before the first render from a cached value, so there is no flash.

The teacher app copies (not imports) these files, so a later change in Declara can't break it. Every new teacher
component — score cards, gradebook grid, attendance buttons, calendar, modal — is written only against the tokens, so all
five themes style it automatically. The one change is storage: Declara synced the choice to `user_prefs` in Supabase;
the teacher app keeps it in `localStorage` (`declara_teacher_look`). Fonts are bundled with `@fontsource` packages
instead of Google Fonts, so the app works offline and contacts no other site.

## E. Teacher data model

```
Profile (1)                       settings store, id "profile": teacher, school, grade, subject, year, grading preferences
ClassRoom ─┬─< Assignment ─┬─< Grade >── Student      grade id = assignmentId:studentId
           │               └── skillIds >── Skill
           ├─< Attendance >── Student                 attendance id = classId:studentId:date
           ├─< Goal (scope "class")
           └──< Student.classIds  (many-to-many: a student can be in several classes)
Student ───< Goal (scope "student") ──> Skill
Note  ──> one of Student | ClassRoom | Assignment | Goal | none ("general")
Task  ──> optional ClassRoom, optional Student   (tasks to tick off, or calendar events)
Activity                                          recent-activity feed, capped at 400 entries
```

| Entity | Key fields |
|---|---|
| ClassRoom | name, grade, subject, schoolYear, room, description, color, archived |
| Student | firstName, lastName, studentCode (optional), classIds[], grade, tags[], about |
| Assignment | classId, title, description, subject, category, dueDate, pointsPossible, gradingType (`points` / `mastery` / `complete`), status (`not_started` / `in_progress` / `completed` / `graded`), skillIds[] |
| Grade | assignmentId, studentId, points, mastery (`beginning` / `developing` / `proficient` / `advanced`), complete, missing, excused, comment |
| Attendance | classId, studentId, date, status (`present` / `absent` / `tardy` / `excused`), note |
| Skill | name, subject, description |
| Goal | scope (`student` / `class`), studentId, classId, title, description, subject, skillId, startDate, targetDate, progress 0–100, status |
| Note | parentType, parentId, body, pinned |
| Task | title, kind (lesson prep, grading, parent meeting, classroom activity, test, project, school event, personal), date, time, classId, studentId, notes, done, isEvent |

Grading supports several approaches without forcing letters: every grade becomes a 0–1 score (points ÷ possible;
mastery 25/50/75/100 %; complete 100 / 0 %), so mixed work still averages. Teachers choose how averages are shown —
percent, letter (custom scale), points, or mastery level — and set an on-track line. Percentages and letters are
derived, never stored.

## F. The local database (IndexedDB)

* Database `declara-teacher`, version 1, one object store per entity (`settings`, `classes`, `students`, `assignments`,
  `grades`, `attendance`, `skills`, `goals`, `notes`, `tasks`, `activity`), `keyPath: 'id'` (random UUIDs, or the
  compound ids above for grades and attendance so re-saving updates instead of duplicating).
* Indexes: students by `classIds` (multi-entry) and `lastName`; assignments by `classId`, `dueDate`, `status`; grades by
  `assignmentId`, `studentId`; attendance by `date`, `studentId`, `classId`, `[classId, date]`; goals by `studentId`,
  `classId`, `status`; notes by `[parentType, parentId]`, `updatedAt`; tasks by `date`; activity by `createdAt`.
* **Write-through store** (`lib/store.ts`): on start every store is read into memory, so screens render instantly and
  synchronously. Each change updates memory and is written to IndexedDB at once, in order, one transaction per change
  (a class deletion and its cascade are one transaction: all or nothing). The top bar shows *Saving…* → *Saved*.
* **Automatic saving.** There is no Save button anywhere. Text fields save ~0.4 s after typing stops, on blur, and on
  `pagehide` / `visibilitychange`, so closing the tab mid-sentence still keeps it. A new record is created the moment its
  first detail is typed.
* **Durability.** After the first save the app calls `navigator.storage.persist()` so the browser doesn't evict the data
  under disk pressure. Another open tab of the app is told about changes through `BroadcastChannel` and re-reads them.
* **No IndexedDB** (some private windows): the app still runs in memory and shows a clear warning that nothing will be kept.
* **localStorage** holds only small preferences: `declara_teacher_look` (theme/typeface) and
  `declara_teacher_reminded` (date of the last browser reminder).

## G. Backup, restore, reset

**Download backup** → `Teacher-App-Backup-YYYY-MM-DD.json`:

```json
{ "format": "declara-teacher-backup", "schemaVersion": 1, "app": "Declara Teacher",
  "exportedAt": "2026-09-26T19:04:11.201Z",
  "counts": { "classes": 4, "students": 24, "grades": 118, … },
  "data":   { "settings": [ … ], "classes": [ … ], "students": [ … ], … every store … } }
```

**Restore** checks, in order: readable JSON → the `format` marker → `schemaVersion` not newer than the app → every store
is an array → every record has an `id` and its required fields → array fields are arrays. Records pointing at a class,
student or assignment that isn't in the backup are counted, reported and left out. The teacher then sees what's in the
file next to what's in the app now, is warned that everything will be replaced (with a one-click "download what's here
first"), and confirms. The restore empties and refills every store in **one transaction**, so a failure changes nothing.

**Encrypted backup** → `Teacher-App-Backup-YYYY-MM-DD-encrypted.json`. The teacher's password goes through PBKDF2-SHA-256
(600,000 iterations, random 16-byte salt) to an AES-GCM-256 key; the whole backup is encrypted with a random 12-byte IV
using the browser's Web Crypto. The file holds only the format marker, KDF parameters, salt, IV and ciphertext — no
names or grades in the clear. The password never leaves the device and a wrong one is rejected by AES-GCM's
authentication check. Without the password the backup can't be opened by anyone, the seller included.

**Reset** requires typing `RESET`, offers a backup first, then clears every store and the app's localStorage keys
(the theme choice is kept) and returns to the welcome screen.

## H. Privacy — what could transmit data, and what the teacher app does instead

Transmission points found in Declara, none of which exist in the teacher app:

| Declara | Sends | Teacher app |
|---|---|---|
| `lib/supabase.ts` client (project URL + publishable key) and every `supabase.from(…)` in pages/libs | All records to Supabase | No Supabase dependency at all |
| `supabase.auth` sign-in, recovery links, session in `localStorage` `sb-*` | Credentials, session | No accounts |
| `supabase.functions.invoke` (staff-admin, platform-admin, commissions, agencyzoom-refresh) | Staff data, commission queries | None |
| `supabase.storage` uploads (DocUpload) | Documents | None |
| `user_prefs` upsert | Theme choice | Theme kept in localStorage |
| Google Fonts `<link>` in `index.html` | Visitor IP/referrer to Google | Fonts bundled |
| `fetch('./training.html')` | (own file) | None |

Declara has no analytics SDK; the teacher app has none either. Enforcement: the production `index.html` carries a
Content-Security-Policy with `connect-src 'none'` (no `fetch`/XHR/WebSocket/beacon to anywhere), `form-action 'none'`,
and scripts/styles/fonts/images only from the app's own origin — so even a future mistake can't send classroom data.
`tests/e2e.mjs` fails if the app requests anything outside its own files. Browser reminders use the local Notification
API. What remains outside the app's control: the static host sees ordinary page requests (IP address, time) but never
any classroom data; browser extensions the teacher installs can read any page.

## I. Migration plan (as carried out)

1. **Declara untouched.** It was cloned read-only for study; no commits, branches or pushes were made to `vidura`.
2. **Separate project.** The teacher app lives in `teacher-app/` in this repository with its own `package.json`,
   lockfile, build and tests. It shares no runtime code with Declara — design files were *copied* — so neither app can
   break the other. (This repository's existing marketing pages at the root are also untouched.)
3. **Skeleton first, domain second.** Copied the design system (styles, themes, assets, UI kit, layout, charts),
   removed every Supabase/auth/insurance dependency, then built the classroom data model, local store and screens on it.
4. **Verification.** `npm run build`, `npm run lint`, and `npm run test:e2e` (autosave across reload, backup/restore
   including encryption, every page × 5 themes × phone/desktop, no outside requests).
5. **Later (optional).** If both apps keep evolving, extract the shared styles/UI kit into a small shared package so
   design fixes flow to both; until then, port design changes by hand.

### Known limits

* Data lives in one browser on one device (by design). Moving to a new computer means backup → restore.
* Data belongs to the site's address: if the app is later served from a different domain, teachers restore a backup there.
* The build must be served over http(s) (any static host); opening `index.html` straight from disk isn't supported by
  browsers for module scripts.
* Browser reminders appear when the app is opened; there is no background push (that would need a server).
