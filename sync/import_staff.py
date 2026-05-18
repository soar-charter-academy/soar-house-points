"""
import_staff.py
Only import staff who have actually given house points.
Cross-references the Google Sheet submissions against
the staff roster CSV to find active point-givers.
"""

import os
import csv
from dotenv import load_dotenv
import gspread
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ---- Config ----
SHEET_NAME = "TEST SOAR House Points (Responses)"
WORKSHEET_NAME = "House Points"
DATA_START_ROW = 9

# ---- Connect services ----
gc = gspread.service_account(filename='sync/service-account.json')
ws = gc.open(SHEET_NAME).worksheet(WORKSHEET_NAME)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
sb = create_client(url, key)

# ---- Get unique staff names from the sheet ----
all_values = ws.get_all_values()
data_rows = all_values[DATA_START_ROW - 1:]

sheet_names = set()
for row in data_rows:
    name = row[1].strip()
    if name and name != 'Spirit Tally':  # Skip system entries
        sheet_names.add(name)

print(f"Found {len(sheet_names)} unique staff names in sheet\n")

# ---- Load roster CSV and build name → email map ----
roster_path = os.path.join(os.path.dirname(__file__), 'staff_roster.csv')
name_to_email = {}
print("CSV names:", sorted(name_to_email.keys()))
with open(roster_path, 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header
    for row in reader:
        first = row[0].strip()
        last = row[1].strip()
        email = row[2].strip().lower()
        full_name = f"{first} {last}"
        name_to_email[full_name] = email

# ---- Manual name aliases (sheet name → roster name) ----
NAME_ALIASES = {
    'Art De Leon': 'Art DeLeon',      # Update these with the real CSV names
    'Bea Munoz': 'Beatrice Munoz',
    'Jen Reitz': 'Jennifer Reitz',
    'Georgina Baro Mora': 'Georgina Baro',
    'Macy Smith': 'Macy Imbriani'
    # Add others as needed
}

# ---- Match sheet names to roster ----
matched = []
unmatched = []

for name in sorted(sheet_names):
    lookup_name = NAME_ALIASES.get(name, name)
    email = name_to_email.get(lookup_name)
    if email:
        matched.append((name, email))
    else:
        unmatched.append(name)

print(f"Matched: {len(matched)}")
print(f"Unmatched: {len(unmatched)}\n")

if unmatched:
    print("Unmatched names (won't be imported):")
    for name in unmatched:
        print(f"  - {name}")
    print()

# ---- Create Supabase auth users for matched staff ----
created = 0
skipped = 0
errors = 0

for name, email in matched:
    prefix = email.split('@')[0]
    if prefix.isdigit():
        skipped += 1
        continue

    try:
        sb.auth.admin.create_user({
            "email": email,
            "email_confirm": True,
            "user_metadata": {"full_name": name},
        })
        print(f"  Created: {name} ({email})")
        created += 1
    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            print(f"  Already exists: {name} ({email})")
            skipped += 1
        else:
            print(f"  Error for {name}: {error_msg}")
            errors += 1

print(f"\nDone! Created: {created}, Skipped: {skipped}, Errors: {errors}")