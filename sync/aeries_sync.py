"""
aeries_sync.py
Sync student roster and house assignments from Aeries REST API to Supabase.
Only syncs active students.
"""

import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

AERIES_BASE = 'https://soaracademyapi.aeries.net/admin/api/v5'
AERIES_CERT = os.getenv('AERIES_API_CERT')
SCHOOL_CODES = [1, 2]  # Elementary TK-6 and Middle 7-8

sb = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# House code → house_id lookup
houses = sb.table('houses').select('id, name').execute()
HOUSE_MAP = {}
for h in houses.data:
    letter = h['name'][0].upper()
    HOUSE_MAP[letter] = h['id']

print(f"House map: { {k: v[:8] for k, v in HOUSE_MAP.items()} }\n")


def fetch_aeries_students():
    """Fetch active students from Aeries REST API."""
    all_students = []
    for code in SCHOOL_CODES:
        r = requests.get(
            f'{AERIES_BASE}/schools/{code}/students',
            headers={'AERIES-CERT': AERIES_CERT, 'Accept': 'application/json'}
        )
        if r.status_code != 200:
            print(f"Aeries API error for school {code}: {r.status_code}")
            continue
        students = r.json()
        # Filter active only
        active = [s for s in students if not s.get('InactiveStatusCode', '')]
        print(f"  School {code}: {len(active)} active ({len(students) - len(active)} inactive, skipped)")
        all_students.extend(active)
    return all_students


def sync_students():
    """Sync Aeries students to Supabase."""
    aeries_students = fetch_aeries_students()
    print(f"\nTotal active students: {len(aeries_students)}\n")

    # Get existing students from Supabase for comparison
    existing = sb.table('students').select('id, aeries_id').execute()
    existing_map = {s['aeries_id']: s['id'] for s in existing.data}

    # Track students seen in Aeries (to mark others inactive)
    seen_ids = set()

    created = 0
    updated = 0
    skipped = 0
    missing_house = []

    for student in aeries_students:
        student_id = str(student.get('StudentID', ''))
        first_name = student.get('FirstName', '').strip()
        last_name = student.get('LastName', '').strip()
        grade = student.get('Grade')
        house_code = (student.get('UserCode1', '') or '').strip().upper()
        student_number = student_id  # StudentID is the 6-digit number
        birth_date = student.get('Birthdate', None)

        # Parse birth date (Aeries returns ISO format)
        if birth_date:
            birth_date = birth_date[:10]  # Just the date part

        if not student_id or not first_name:
            skipped += 1
            continue

        seen_ids.add(student_id)

        # Map house code to house_id
        house_id = HOUSE_MAP.get(house_code)

        # Track missing houses
        if not house_id:
            enroll_date = student.get('SchoolEnterDate', 'unknown')
            if enroll_date:
                enroll_date = str(enroll_date)[:10]
            missing_house.append(
                f"  {first_name} {last_name} (ID: {student_number}, grade: {grade}, enrolled: {enroll_date})"
            )

        # Build record
        record = {
            'aeries_id': student_id,
            'first_name': first_name,
            'last_name': last_name,
            'grade': grade,
            'house_id': house_id,
            'student_number': student_number,
            'birth_date': birth_date,
            'active': True,
        }

        if student_id in existing_map:
            sb.table('students') \
                .update(record) \
                .eq('aeries_id', student_id) \
                .execute()
            updated += 1
        else:
            sb.table('students') \
                .insert(record) \
                .execute()
            created += 1

    # Mark students not in Aeries as inactive
    deactivated = 0
    for aeries_id in existing_map:
        if aeries_id not in seen_ids:
            sb.table('students') \
                .update({'active': False}) \
                .eq('aeries_id', aeries_id) \
                .execute()
            deactivated += 1

    print(f"Created: {created}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"Deactivated: {deactivated}")
    print(f"\n--- Missing house assignment ({len(missing_house)}) ---")
    for line in missing_house:
        print(line)


if __name__ == '__main__':
    sync_students()