"""
sheet_sync.py
Sync house points between Google Sheet and Supabase.
Direction: Sheet → Supabase (import existing points)

Reads rows from the Google Sheet, matches staff names to profiles,
expands multi-house rows into individual point entries, and writes
them to Supabase with source='sheet'. Marks synced rows in the sheet
to prevent duplicate imports.
"""

import os
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv
import gspread
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ---- Configuration ----

SHEET_NAME = "SOAR House Points (Responses)"
WORKSHEET_NAME = "House Points"
HEADER_ROW = 8
DATA_START_ROW = 9
SYNC_COLUMN = 9  # Column I — we'll add a "Synced" marker here

# Map sheet column headers to house names in the database
HOUSE_COLUMNS = {
    2: "Fierte",     # Column C (0-indexed: 2)
    3: "Kiburi",     # Column D
    4: "Orgullo",    # Column E
    5: "Hokori",     # Column F
    6: "Superbia",   # Column G
}

# ---- Connect to services ----

def connect_sheet():
    gc = gspread.service_account(filename='sync/service-account.json')
    sheet = gc.open(SHEET_NAME)
    return sheet.worksheet(WORKSHEET_NAME)

def connect_supabase():
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    return create_client(url, key)

# ---- Load lookup data from Supabase ----

def load_houses(sb):
    """Build a map of house name → house ID."""
    result = sb.table('houses').select('id, name').execute()
    return {h['name']: h['id'] for h in result.data}

def load_profiles(sb):
    """Build a map of display name → profile ID."""
    result = sb.table('profiles').select('id, display_name').execute()
    return {p['display_name']: p['id'] for p in result.data}

# ---- Sync logic ----

def sync_sheet_to_supabase():
    print("Connecting to services...")
    ws = connect_sheet()
    sb = connect_supabase()

    houses = load_houses(sb)
    profiles = load_profiles(sb)

    print(f"Loaded {len(houses)} houses, {len(profiles)} staff profiles")
    print(f"Known staff: {list(profiles.keys())}\n")

    # Get all data rows
    all_values = ws.get_all_values()
    data_rows = all_values[DATA_START_ROW - 1:]  # Skip header rows

    synced_count = 0
    skipped_count = 0
    error_count = 0

    for row_idx, row in enumerate(data_rows):
        row_num = DATA_START_ROW + row_idx  # Actual sheet row number

        # Check if already synced (column I has a value)
        sync_marker = row[SYNC_COLUMN - 1] if len(row) >= SYNC_COLUMN else ""
        if sync_marker:
            skipped_count += 1
            continue

        # Parse the row
        timestamp_str = row[0]
        staff_name = row[1]
        notes = row[7] if len(row) > 7 else None

        # Match staff name to profile
        staff_id = profiles.get(staff_name)
        if not staff_id:
            print(f"  Row {row_num}: Unknown staff '{staff_name}' — skipping")
            error_count += 1
            continue

        # Parse timestamp
        try:
            timestamp = datetime.strptime(timestamp_str, "%m/%d/%Y %H:%M:%S")
            timestamp_iso = timestamp.isoformat()
        except ValueError:
            print(f"  Row {row_num}: Bad timestamp '{timestamp_str}' — skipping")
            error_count += 1
            continue

        # Build point entries for each house with value > 0
        points_to_insert = []
        for col_idx, house_name in HOUSE_COLUMNS.items():
            try:
                value = int(row[col_idx]) if row[col_idx] else 0
            except ValueError:
                value = 0

            if value > 0:
                house_id = houses.get(house_name)
                if not house_id:
                    print(f"  Row {row_num}: Unknown house '{house_name}' — skipping")
                    continue

                points_to_insert.append({
                    'house_id': house_id,
                    'staff_id': staff_id,
                    'value': value,
                    'notes': notes if notes else None,
                    'source': 'sheet',
                    'created_at': timestamp_iso,
                })

        # Insert points into Supabase
        if points_to_insert:
            try:
                sb.table('points').insert(points_to_insert).execute()
                # Mark the row as synced in the sheet
                sync_id = str(uuid.uuid4())[:8]
                ws.update_cell(row_num, SYNC_COLUMN, sync_id)
                time.sleep(1.5)
                synced_count += 1
                print(f"  Row {row_num}: {staff_name} — {len(points_to_insert)} point(s) synced")
            except Exception as e:
                print(f"  Row {row_num}: Insert failed — {e}")
                error_count += 1
        else:
            # Row had no points > 0, mark as synced anyway
            ws.update_cell(row_num, SYNC_COLUMN, "no-pts")
            time.sleep(1.5)
            skipped_count += 1

    print(f"\nDone! Synced: {synced_count}, Skipped: {skipped_count}, Errors: {error_count}")

def sync_supabase_to_sheet():
    """Write app-created points back to the Google Sheet."""
    print("\n--- Syncing Supabase → Sheet ---\n")

    ws = connect_sheet()
    sb = connect_supabase()

    houses = load_houses(sb)
    # Reverse map: house_id → house_name
    house_names = {v: k for k, v in houses.items()}

    profiles = load_profiles(sb)
    # Reverse map: profile_id → display_name
    profile_names = {v: k for k, v in profiles.items()}

    # Fetch app points not yet synced to sheet
    result = sb.table('points') \
        .select('*') \
        .eq('source', 'app') \
        .is_('sheet_synced_at', 'null') \
        .is_('deleted_at', 'null') \
        .order('created_at') \
        .execute()

    points = result.data
    print(f"Found {len(points)} app points to sync to sheet\n")

    if not points:
        print("Nothing to sync.")
        return

    synced = 0
    errors = 0

    for point in points:
        staff_name = profile_names.get(point['staff_id'], 'Unknown')
        house_name = house_names.get(point['house_id'], 'Unknown')
        timestamp = point['created_at']
        notes = point.get('notes') or ''
        value = point.get('value', 1)

        # Build a row matching the sheet format:
        # Timestamp, Name, Fierte, Kiburi, Orgullo, Hokori, Superbia, Notes, SyncID
        house_values = {
            'Fierte': 0, 'Kiburi': 0, 'Orgullo': 0,
            'Hokori': 0, 'Superbia': 0,
        }
        house_values[house_name] = value

        row = [
            timestamp,
            staff_name,
            str(house_values['Fierte']),
            str(house_values['Kiburi']),
            str(house_values['Orgullo']),
            str(house_values['Hokori']),
            str(house_values['Superbia']),
            notes,
            point['id'][:8],  # Sync marker (truncated UUID)
        ]

        try:
            ws.append_row(row, value_input_option='USER_ENTERED')

            # Mark as synced in Supabase
            sb.table('points') \
                .update({'sheet_synced_at': datetime.now().isoformat()}) \
                .eq('id', point['id']) \
                .execute()

            print(f"  {staff_name} → {house_name} +{value}")
            synced += 1
            time.sleep(1.5)  # Throttle for Sheets API
        except Exception as e:
            print(f"  Error: {e}")
            errors += 1

    print(f"\nDone! Synced to sheet: {synced}, Errors: {errors}")

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        direction = sys.argv[1]
        if direction == 'to-db':
            sync_sheet_to_supabase()
        elif direction == 'to-sheet':
            sync_supabase_to_sheet()
        else:
            print("Usage: python sheet_sync.py [to-db|to-sheet]")
    else:
        # Run both directions
        sync_sheet_to_supabase()
        sync_supabase_to_sheet()