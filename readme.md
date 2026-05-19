# SOAR House Points

A house points tracking app for SOAR Charter Academy. Staff award points to five houses — Kiburi, Fierté, Orgullo, Supurbia, and Hokori — with a one-tap mobile interface backed by a real-time database.

## Design Tenets

- **Fast point giving.** The core interaction is: open app → tap house → confirm. A detail modal appears with optional student name and notes fields, but the confirm button is prominent and immediate — two taps from open to recorded with no required fields.
- **Optimistic UI.** The interface updates instantly on confirm. Database writes happen in the background. This also lays the groundwork for offline support in the native app.
- **Append-only points log.** Points are never edited. Mistakes are corrected via soft delete (staff can remove their own points from a personal history view). Full audit trail is preserved.
- **No negative points.** The `value` field enforces `> 0` at the database level.

## How to Use

### For Staff (Giving Points)

1. Go to [soarpoints.netlify.app](https://soarpoints.netlify.app)
2. Click **Sign in with Google** using your `@soarcharteracademy.org` account
3. Tap a house button to award a point
4. In the confirmation modal, optionally add a student name and/or notes, then tap **Confirm**
5. The +1 animation confirms the point was recorded

### Viewing and Removing Your Points

1. Tap the **HOUSE POINTS** button in the header
2. Your awarded points appear in reverse chronological order with house, value, date, and notes
3. Tap **Remove** on any point to soft-delete it (corrects mistakes)
4. Tap **← Back** to return to the house buttons

### For Admins (Sync Scripts)

All sync scripts live in the `sync/` folder and require a `.env` file with Supabase and Google credentials. Run from the project root.

#### Import Staff from Roster

Creates Supabase accounts for staff who have given points. Uses `sync/staff_roster.csv` for name-to-email mapping and cross-references the Google Sheet to only import active point-givers.

```bash
python3.12 sync/import_staff.py
```

#### Sync Google Sheet → Supabase

Imports historical points from the Google Sheet into the database. Each sheet row is expanded into individual point entries per house. Rows are marked with a sync ID in column I to prevent duplicate imports. Safe to run repeatedly.

```bash
python3.12 sync/sheet_sync.py to-db
```

#### Sync Supabase → Google Sheet

Appends app-created points back to the Google Sheet for continuity during the transition period. Only syncs points with `source='app'` that haven't been written to the sheet yet.

```bash
python3.12 sync/sheet_sync.py to-sheet
```

#### Run Both Directions

```bash
python3.12 sync/sheet_sync.py
```

#### Cleanup Staff (Destructive)

Removes all Supabase auth users and their associated data except for protected accounts. Used during setup to reset and re-import.

```bash
python3.12 sync/cleanup_staff.py
```

#### Test Connections

```bash
python3.12 sync/test_sheet.py        # Verify Google Sheets API access
python3.12 sync/test_connection.py   # Test Aeries OneRoster API (pending auth fix)
```

### Required Environment Variables

Create a `.env` file in the project root (never committed to git):

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_publishable_key
    SUPABASE_SERVICE_KEY=your_secret_service_role_key
    AERIES_ONEROSTER_URL=https://your-aeries-instance
    AERIES_CLIENT_ID=your_oneroster_consumer_id
    AERIES_CLIENT_SECRET=your_oneroster_consumer_secret

### Local Development

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`. Changes hot-reload automatically.

### Database Migrations

Schema changes are saved as numbered SQL files in `migrations/`. Run them in order against the Supabase SQL Editor when setting up a fresh database.

## Architecture

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React (Vite) | Mobile-first web app |
| Backend / DB | Supabase (PostgreSQL) | Auth, REST API, real-time subscriptions, row-level security |
| Auth | Google SSO via Supabase Auth | Restricted to `@soarcharteracademy.org` domain |
| Hosting | Netlify | Free tier, push-to-deploy from GitHub |
| Mobile | Expo / React Native (planned) | iOS and Android app store deployment |
| SIS Integration | Aeries REST API → Python sync script | Student rosters, class assignments, house membership |
| Sheet Sync | Python script via GitHub Actions | Bidirectional sync with existing Google Sheet during transition |

### Database Schema (Supabase / PostgreSQL)

- **houses** — id, name, color_hex. Seeded with the five houses.
- **profiles** — Linked to Supabase `auth.users`. Auto-created on first Google SSO login. Includes role (teacher, admin, aide).
- **points** — Append-only log. References house, staff, and optionally student. Supports soft delete via `deleted_at`. Optional `category` and `notes` fields.
- **quick_lists** — Staff-created named groups of students for fast access (e.g., "My 3rd period").
- **quick_list_students** — Junction table linking quick lists to students.
- **students** — Synced from Aeries SIS. Linked to house. `aeries_id` is the sync anchor.

Row-level security enforces: staff can only insert points as themselves, can only soft-delete their own points, and all authenticated users can read non-deleted points and house data.

### Google Sheet Sync (Transition Period)

During the transition from the existing Google Sheet to the app, a bidirectional sync keeps both systems current:

- A `uuid` column in the sheet serves as the dedup key.
- Sheet rows without a UUID are new → inserted into Supabase, UUID written back.
- Supabase rows not in the sheet → appended to the sheet with their UUID.
- Runs on a cron schedule via GitHub Actions (Python script, hourly during school hours).
- A `source` column on the `points` table tracks whether each point originated from the app or the sheet.

The sheet sync will be retired once app-based reporting is fully built out.

## Roadmap

### Phase 1 — MVP (current)
- [x] Supabase project and database schema
- [x] Google SSO authentication
- [x] House buttons UI (2×2 grid + 1, one-tap point giving)
- [x] Points written to Supabase on tap
- [x] Deploy to Netlify

### Phase 1.5 — Branding & Visual Identity
- [x] SOAR eagle logo on login and header
- [x] Custom house crest assets (Canva/Adobe)

### Phase 1.7 — Staff Point History
- [x] Staff can view their own awarded points
- [x] Staff can soft-delete their own points (mistake correction)

### Phase 2 — Student Integration
- [ ] Aeries roster sync (Python script, scheduled)
- [ ] Individual student point assignment
- [ ] Student search
- [ ] Custom quick lists
- [ ] Class roster views
- [ ] Section-based class rosters (synced from Aeries master schedule)
- [ ] Award points from roster view

### Phase 3 — Sheet Sync & Staff Features
- [x] Bidirectional Google Sheet sync (Python + GitHub Actions)
- [x] Optional category and notes on point entry
- [x] Point value selector in modal (+/- stepper with tappable editable number field, default 1)
- [ ] Live leaderboard (Supabase real-time subscriptions)
- [ ] Select and remove multiple points from My Points screen


### Phase 3.5 Branding Improvements 
- [ ] House-colored UI theming throughout
- [ ] Polished "Hogwarts-y" aesthetic (textures, typography, animations)
- [ ] Point-award animations and sound effects
- [ ] Leaderboard visual treatment (banners, shields, etc.)

### Phase 4 — Reporting
- [ ] Points by house over time
- [ ] Points by staff member
- [ ] Individual student point history
- [ ] Exportable reports for discipline support
- [ ] Daily/weekly/monthly breakdowns

### Phase 5 — PWA & Offline
- [ ] PWA manifest and service worker
- [ ] Installable to home screen (iOS and Android)
- [ ] Offline support (local point queue + sync on reconnect)
- [ ] Push notifications for milestones
- [ ] Student/parent read-only access tier
- [ ] Student dashboard: house totals, personal point history, streaks
- [ ] Parent view: child's points and house standing

### Phase 6 — Production Hardening (Optional)
- [ ] Terraform infrastructure-as-code
- [ ] CI/CD with GitHub Actions
- [ ] Automated tests

