"""
import_staff_houses.py
Import staff house assignments from a column-per-house CSV.
Expected format: each column header is a house name,
staff first names listed below.
"""

import os
import csv
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

sb = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Build house name → id lookup
houses = sb.table('houses').select('id, name').execute()
house_map = {h['name'].lower(): h['id'] for h in houses.data}
print(f"Houses: {list(house_map.keys())}\n")

# Build first name → profile lookup
profiles = sb.table('profiles').select('id, display_name, email').execute()
name_map = {}
duplicates = set()
for p in profiles.data:
    if not p['display_name']:
        continue
    first = p['display_name'].split()[0].lower()
    if first in name_map:
        print(f"  ⚠ Duplicate first name: '{first}' ({name_map[first]['display_name']} and {p['display_name']})")
        duplicates.add(first)
    name_map[first] = p

print(f"\nLoaded {len(name_map)} staff profiles\n")

# Read CSV
csv_path = os.path.join(os.path.dirname(__file__), 'staff_houses.csv')
updated = 0
skipped = 0

with open(csv_path) as f:
    reader = csv.reader(f)
    headers = [h.strip().lower() for h in next(reader)]

    # Map column index → house_id
    col_houses = {}
    for i, header in enumerate(headers):
        if header in house_map:
            col_houses[i] = house_map[header]
        else:
            print(f"  Unknown house column: '{header}' — skipping column")

    for row in reader:
        for col_idx, house_id in col_houses.items():
            if col_idx >= len(row):
                continue
            name = row[col_idx].strip().lower()
            if not name:
                continue

            if name in duplicates:
                print(f"  '{name}' matches multiple staff — skipping (resolve manually)")
                skipped += 1
                continue

            if name not in name_map:
                print(f"  '{name}' not found in profiles — skipping")
                skipped += 1
                continue

            profile = name_map[name]
            sb.table('profiles') \
                .update({'house_id': house_id}) \
                .eq('id', profile['id']) \
                .execute()

            print(f"  {profile['display_name']} → {headers[col_idx].title()}")
            updated += 1

print(f"\nDone! Updated: {updated}, Skipped: {skipped}")