# SOAR House Points

A house points tracking app for [SOAR Charter Academy](https://soarcharteracademy.org). Staff award points to five houses with a fast, mobile-first interface backed by a real-time database.

**[Live App](https://soarpoints.web.app)** · **[Project Board](https://github.com/orgs/soarautomation/projects/1)** · **[Issues](https://github.com/soarautomation/soar-house-points/issues)**

![Screenshot of house buttons and leaderboard](docs/screenshot.png)

## Features

- **One-tap point giving** — tap a house, optionally add student name and notes, confirm
- **Real-time leaderboard** — updates live across all devices via Supabase subscriptions
- **Point history** — staff view and manage their own points; tap any house to see its full history
- **Google SSO** — staff sign in with school Google accounts; student accounts are blocked automatically
- **Bidirectional sheet sync** — legacy Google Sheet stays current during transition, synced via GitHub Actions
- **PWA** — installable to home screen on iOS and Android, no app store required
- **Soft delete** — mistakes are corrected, never erased; full audit trail preserved

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend | Supabase (PostgreSQL, Auth, REST API, Realtime) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions (auto-deploy on push, scheduled sheet sync) |
| Infrastructure | Terraform (GCP project, APIs, service accounts) |
| Sync Scripts | Python (Google Sheets API, Aeries OneRoster API) |

## Architecture

The app is a static React frontend that talks directly to Supabase. No custom backend server — Supabase provides the database, authentication, auto-generated REST API, and real-time subscriptions. Row-level security policies enforce that staff can only modify their own points.

A Python sync script runs on a GitHub Actions schedule to keep the legacy Google Sheet bidirectionally synced with the database during the transition period. A separate sync pipeline (in progress) connects to the Aeries SIS via OneRoster API for student roster data.

Infrastructure is codified in Terraform, managing the GCP project, enabled APIs, service accounts, IAM roles, and Firebase Hosting.

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12
- A Supabase project
- A Google Cloud project with Sheets and Drive APIs enabled

### Local Development

```bash
git clone https://github.com/soarautomation/soar-house-points.git
cd soar-house-points
npm install
npm run dev
```

Create a `.env` file in the project root:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
SUPABASE_SERVICE_KEY=your_service_role_key
AERIES_ONEROSTER_URL=https://your-aeries-instance
AERIES_CLIENT_ID=your_consumer_id
AERIES_CLIENT_SECRET=your_consumer_secret

### Database Setup

Run the migration files in order against the Supabase SQL Editor:
migrations/001_initial_schema.sql
migrations/002_students_sections.sql
migrations/003_add_source_column.sql
migrations/004_fix_update_policy.sql
migrations/005_sheet_sync_tracking.sql
migrations/006_house_totals.sql
migrations/007_go_live_reset.sql
migrations/008_fix_sheet_timestamps.sql
migrations/009_profiles_read_all.sql

### Sync Scripts

All scripts live in `sync/` and require the `.env` file and a Google service account key at `sync/service-account.json`.

| Command | Description |
|---------|-------------|
| `python3.12 sync/sheet_sync.py` | Run bidirectional sheet sync |
| `python3.12 sync/sheet_sync.py to-db` | Sheet → database only |
| `python3.12 sync/sheet_sync.py to-sheet` | Database → sheet only |
| `python3.12 sync/import_staff.py` | Create Supabase accounts for staff who have given points |
| `python3.12 sync/test_connection.py` | Test Aeries OneRoster API connection |

### Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Manages: GCP project APIs, service accounts, IAM roles, Firebase Hosting site.

## Project Structure
src/
App.jsx                 # Main app: auth, routing, state
supabase.js             # Supabase client config
components/
HouseButton.jsx       # Tappable house tile with +N animation
PointModal.jsx        # Confirmation dialog with value/notes
PointHistory.jsx      # Staff's own point history with multi-select delete
PointRow.jsx          # Single point entry in history
HouseHistory.jsx      # Full point history for a house
Leaderboard.jsx       # Live-updating ranked standings
FloatingPoint.jsx     # +N floating animation
sync/
sheet_sync.py           # Bidirectional Google Sheet sync
import_staff.py         # Bulk staff account creation
test_connection.py      # Aeries API connectivity test
cleanup_staff.py        # Reset staff accounts (destructive)
terraform/
main.tf                 # GCP infrastructure as code
migrations/               # Numbered SQL schema changes
public/images/            # House crests, logo, rank icons

## Design Tenets

- **Fast point giving** — two taps from open to recorded, no required fields
- **Optimistic UI** — interface updates instantly, database writes in background
- **Append-only log** — points are never edited, only soft-deleted
- **No negative points** — enforced at the database level

## License

MIT