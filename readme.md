# SOAR House Points

A house points tracking app for SOAR Charter Academy. Staff award points to five houses — Kiburi, Fierté, Orgullo, Supurbia, and Hokori — with a one-tap mobile interface backed by a real-time database.

## Design Tenets

- **One-tap point giving.** The core interaction is: open app → tap house → point recorded. No confirmation dialogs, no required fields. Category, notes, and student selection are always optional.
- **Optimistic UI.** The interface updates instantly on tap. Database writes happen in the background. This also lays the groundwork for offline support in the native app.
- **Append-only points log.** Points are never edited. Mistakes are corrected via soft delete (staff can remove their own points from a personal history view). Full audit trail is preserved.
- **No negative points.** The `value` field enforces `> 0` at the database level.

## Architecture

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React (Vite) | Mobile-first web app |
| Backend / DB | Supabase (PostgreSQL) | Auth, REST API, real-time subscriptions, row-level security |
| Auth | Google SSO via Supabase Auth | Restricted to `@soarcharteracademy.org` domain |
| Hosting | Vercel (planned) | Free tier, push-to-deploy from GitHub |
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

### Phase 2 — Student Integration
- [ ] Aeries roster sync (Python script, scheduled)
- [ ] Individual student point assignment
- [ ] Student search
- [ ] Custom quick lists
- [ ] Class roster views
- [ ] Section-based class rosters (synced from Aeries master schedule)
- [ ] Award points from roster view

### Phase 3 — Sheet Sync & Staff Features
- [ ] Bidirectional Google Sheet sync (Python + GitHub Actions)
- [ ] Staff personal point history with soft-delete
- [ ] Optional category and notes on point entry
- [ ] Live leaderboard (Supabase real-time subscriptions)

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

## Local Development

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`. Requires a `.env` file with Supabase credentials (see `.env.example`).