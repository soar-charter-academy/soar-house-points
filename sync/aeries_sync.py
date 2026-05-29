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

def sync_sections():
    """Sync class sections and student enrollments from Aeries."""
    print("\n--- Syncing Sections & Rosters ---\n")

    # Get existing data
    existing_sections = sb.table('sections').select('id, aeries_id').execute()
    section_map = {s['aeries_id']: s['id'] for s in existing_sections.data}

    existing_students = sb.table('students').select('id, aeries_id').execute()
    student_map = {s['aeries_id']: s['id'] for s in existing_students.data}

    sections_created = 0
    sections_updated = 0
    enrollments_created = 0

    for school_code in SCHOOL_CODES:
        # Fetch sections (class definitions)
        r = requests.get(
            f'{AERIES_BASE}/schools/{school_code}/sections',
            headers={'AERIES-CERT': AERIES_CERT, 'Accept': 'application/json'}
        )
        if r.status_code != 200:
            print(f"  Sections error for school {school_code}: {r.status_code}")
            continue

        sections = r.json()
        print(f"  School {school_code}: {len(sections)} sections")

        for sec in sections:
            if sec.get('InactiveStatusCode', ''):
                continue

            section_num = sec.get('SectionNumber')
            aeries_id = f"{school_code}_{section_num}"
            period = str(sec.get('Period', ''))

            # Build name from primary teacher
            staff_members = sec.get('SectionStaffMembers', [])
            primary = next((s for s in staff_members if s.get('IsPrimaryTeacher')), None)
            if primary:
                teacher_name = f"{primary['LastName']}"
            elif staff_members:
                teacher_name = f"{staff_members[0]['LastName']}"
            else:
                teacher_name = 'Unknown'

            name = f"{teacher_name} — Period {period}" if period else teacher_name
            
            # Try to match primary teacher to a profile
            teacher_profile_id = None
            if primary:
                teacher_key = f"{primary['FirstName']} {primary['LastName']}".lower().strip()
                # Look up from profiles
                prof_result = sb.table('profiles') \
                    .select('id') \
                    .eq('aeries_staff_id', primary['StaffID']) \
                    .execute()
                if prof_result.data:
                    teacher_profile_id = prof_result.data[0]['id']

            record = {
                'aeries_id': aeries_id,
                'name': name,
                'period': period,
                'staff_id': teacher_profile_id,
                'school_year': '2025-2026',
            }

            if aeries_id in section_map:
                sb.table('sections').update(record).eq('aeries_id', aeries_id).execute()
                sections_updated += 1
            else:
                result = sb.table('sections').insert(record).execute()
                if result.data:
                    section_map[aeries_id] = result.data[0]['id']
                sections_created += 1

        # Fetch student enrollments
        r = requests.get(
            f'{AERIES_BASE}/schools/{school_code}/classes',
            headers={'AERIES-CERT': AERIES_CERT, 'Accept': 'application/json'}
        )
        if r.status_code != 200:
            print(f"  Classes error for school {school_code}: {r.status_code}")
            continue

        enrollments = r.json()
        print(f"  School {school_code}: {len(enrollments)} enrollments")

        for enr in enrollments:
            student_aeries_id = str(enr.get('StudentID', ''))
            section_aeries_id = f"{school_code}_{enr.get('SectionNumber')}"

            student_uuid = student_map.get(student_aeries_id)
            section_uuid = section_map.get(section_aeries_id)

            if not student_uuid or not section_uuid:
                continue

            # Upsert enrollment (ignore conflicts)
            try:
                sb.table('section_students').insert({
                    'section_id': section_uuid,
                    'student_id': student_uuid,
                }).execute()
                enrollments_created += 1
            except Exception:
                pass  # Already exists (unique constraint)

    print(f"\nSections created: {sections_created}")
    print(f"Sections updated: {sections_updated}")
    print(f"Enrollments created: {enrollments_created}")

def sync_staff_ids():
    """Match Aeries StaffIDs to app profiles using teacher names from sections."""
    print("\n--- Matching Staff IDs ---\n")

    profiles = sb.table('profiles').select('id, display_name, aeries_staff_id').execute()
    profile_map = {}
    for p in profiles.data:
        if p['display_name']:
            name_key = p['display_name'].lower().strip()
            profile_map[name_key] = p

    matched = 0
    already_set = 0

    seen_staff = {}  # aeries StaffID → {first, last}

    for school_code in SCHOOL_CODES:
        r = requests.get(
            f'{AERIES_BASE}/schools/{school_code}/sections',
            headers={'AERIES-CERT': AERIES_CERT, 'Accept': 'application/json'}
        )
        if r.status_code != 200:
            continue

        for sec in r.json():
            for staff in sec.get('SectionStaffMembers', []):
                staff_id = staff.get('StaffID')
                first = staff.get('FirstName', '').strip()
                last = staff.get('LastName', '').strip()
                if staff_id and first and last:
                    seen_staff[staff_id] = {'first': first, 'last': last}

    print(f"Found {len(seen_staff)} unique staff in Aeries sections\n")

    for staff_id, names in seen_staff.items():
        full_name = f"{names['first']} {names['last']}".lower()

        if full_name in profile_map:
            profile = profile_map[full_name]
            if profile.get('aeries_staff_id') == staff_id:
                already_set += 1
                continue

            sb.table('profiles') \
                .update({'aeries_staff_id': staff_id}) \
                .eq('id', profile['id']) \
                .execute()
            print(f"  {names['first']} {names['last']} → StaffID {staff_id}")
            matched += 1
        else:
            print(f"  {names['first']} {names['last']} — no profile match")

    print(f"\nMatched: {matched}, Already set: {already_set}")    

if __name__ == '__main__':
    sync_students()
    sync_staff_ids()
    sync_sections()
