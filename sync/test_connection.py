"""
test_connection.py
Aeries OneRoster API — OAuth 2.0 Client Credentials with form-data.
"""

import os
import json
from dotenv import load_dotenv
import requests

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

BASE_URL = os.getenv('AERIES_ONEROSTER_URL')
CLIENT_ID = os.getenv('AERIES_CLIENT_ID')
CLIENT_SECRET = os.getenv('AERIES_CLIENT_SECRET')

# Step 1: Get token using multipart form-data
token_url = f"{BASE_URL}/token"
print(f"Requesting token from: {token_url}")

token_response = requests.post(token_url, files={
    'client_id': (None, CLIENT_ID),
    'client_secret': (None, CLIENT_SECRET),
    'grant_type': (None, 'client_credentials'),
    'scope': (None, 'https://purl.imsglobal.org/spec/or/v1p1/scope/roster-core.readonly'),
})

print(f"Token status: {token_response.status_code}")

if token_response.status_code != 200:
    print(f"Token error: {token_response.text[:500]}")
    exit(1)

token_data = token_response.json()
access_token = token_data['access_token']
print(f"Token acquired!\n")

# Step 2: Fetch students
students_url = f"{BASE_URL}/ims/oneroster/v1p1/students"
print(f"Fetching students from: {students_url}")

api_response = requests.get(
    students_url,
    headers={'Authorization': f'Bearer {access_token}'},
    params={'limit': 2}
)

print(f"API status: {api_response.status_code}\n")

if api_response.status_code == 200:
    data = api_response.json()
    if 'users' in data:
        # Redact student names for safety
        student = data['users'][0]
        print("First student structure (keys only):")
        print(json.dumps(list(student.keys()), indent=2))
        print("\nFull record (check for house field):")
        # Redact name fields
        safe = {k: v for k, v in student.items()}
        safe['givenName'] = '[REDACTED]'
        safe['familyName'] = '[REDACTED]'
        print(json.dumps(safe, indent=2))
    else:
        print(f"Response keys: {list(data.keys())}")
else:
    print(f"Error: {api_response.text[:500]}")