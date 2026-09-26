# Declara Teacher

The teacher edition of Declara: the same design system (sidebar, top bar, score cards, panels, drawers, settings, and
all five themes, including Talavera and the seasonal Halloween) rebuilt around a classroom — classes, students,
assignments, grades, attendance, learning goals, skills, notes, tasks and a calendar.

**Local-first and private.** There is no backend and no account. Everything is saved automatically in the browser's
IndexedDB on the teacher's device. Nothing is uploaded, and the built app's security policy blocks network requests
outright. Teachers keep their own backups (optionally password-encrypted).

## What's inside

| Screen | What a teacher does there |
|---|---|
| Dashboard | Students, classes, work due, attendance, upcoming events, tasks; class progress and mastery; assignments due / upcoming / missing / recently graded; goals needing attention; tasks; recent activity |
| Calendar & Tasks | Month calendar with events, tasks and due dates; day agenda; filterable task list (lesson prep, grading, parent meetings, activities, tests, projects, school events, personal) |
| Classes | Create classes (name, grade, subject, school year, room, colour, description); each class has students, assignments, attendance, goals and notes; archive or delete |
| Students | Search/filter/sort, paste a whole class list, CSV export; a detailed profile drawer with averages, attendance, missing work, goals, grades, notes |
| Attendance | Take attendance (Present / Absent / Tardy / Excused, "mark the rest present"), and view by date, by student, or as a summary |
| Assignments | Title, class, subject, category, due date, points, grading type, status, skills; filter by class, subject, status and date; enter grades with comments, missing and excused |
| Gradebook | Type grades straight into a student × assignment grid; a skills view shows mastery per skill |
| Goals & Skills | Goals for one student or a whole class with start/target dates, progress and status; "behind / due soon" detection; skills list |
| Notes | Private notes on students, classes, assignments, goals, or general; pin, search |
| Reports | Class summary and printable student progress reports; CSV |
| Settings | Profile, grading (percent / letter / points / mastery, custom letter scale), appearance, reminders, data & backup, privacy |

## Run it

```bash
cd teacher-app
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/ (adds the privacy Content-Security-Policy)
npm run lint
npm run test:e2e     # after build: autosave, backup/restore, every page × theme × phone/desktop, no outside requests
```

`test:e2e` uses Playwright's Chromium; set `CHROMIUM_PATH` to use another Chrome.

## One-file version (no web server)

```bash
npm run build:single   # writes dist-single/Declara-Teacher.html
```

A single ~2 MB HTML file with everything inside it. Double-click it to open the full app, with no internet connection
(tested in Chrome). Data is saved in that browser. Keep the file in one place — depending on the browser, moving or
renaming it can open a fresh, empty app — and use Settings › Data & backup to move data between computers.

## Deploy

`dist/` is a static site: host it on GitHub Pages, Netlify, Cloudflare Pages or any web server. It needs no server-side
code and no database. Keep the address stable — a browser's saved data belongs to the site's address, so moving the app
to a new domain means teachers restore a backup there.

## Where things are

```
src/lib/model.ts       the data model and labels
src/lib/db.ts          IndexedDB: stores, indexes, transactions
src/lib/store.ts       in-memory store written through to IndexedDB; autosave; cascades; save status
src/lib/backup.ts      backup format, validation, AES-GCM encryption
src/lib/grading.ts     scores, averages, letters, mastery
src/lib/sample.ts      made-up sample classroom (Emma Garcia, Liam Johnson, …)
src/lib/theme.ts       Declara's themes and typefaces
src/styles.css         Declara's stylesheet (inherited)
src/teacher.css        teacher-only components, on Declara's tokens
src/components/        Layout (shell), ui kit, charts, forms, grade editor, notes, backup tools, dialogs
src/pages/             one file per screen
docs/ARCHITECTURE.md   the analysis: Declara → teacher edition, data model, storage, backup, privacy, migration
```

All sample data is fictional. Never load real student information into a demo.
