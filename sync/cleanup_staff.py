"""
cleanup_staff.py
Remove all users except the original three.
Handles foreign key cascade: points → profiles → auth users.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
sb = create_client(url, key)

KEEP_EMAILS = {
    'jhicks@soarcharteracademy.org',
    'twalker@soarcharteracademy.org',
    '100000@soarcharteracademy.org',
}

users = sb.auth.admin.list_users()
deleted = 0

for user in users:
    email = user.email.lower()
    if email not in KEEP_EMAILS:
        uid = user.id

        # Delete points by this staff member
        sb.table('points').delete().eq('staff_id', uid).execute()

        # Delete profile
        sb.table('profiles').delete().eq('id', uid).execute()

        # Delete auth user
        sb.auth.admin.delete_user(uid)

        print(f"  Deleted: {email}")
        deleted += 1

print(f"\nDeleted {deleted} users.")