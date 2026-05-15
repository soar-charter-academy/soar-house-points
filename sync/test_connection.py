"""
test_connection.py
Narrow down the correct token request format for /admin/token.
"""

import os
import json
import base64
from dotenv import load_dotenv
import requests

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

BASE_URL = os.getenv('AERIES_ONEROSTER_URL')
CLIENT_ID = os.getenv('AERIES_CLIENT_ID')
CLIENT_SECRET = os.getenv('AERIES_CLIENT_SECRET')

TOKEN_URL = f"{BASE_URL}/token"
SCOPES = 'https://purl.imsglobal.org/spec/or/v1p1/scope/roster-core.readonly'

print(f"Token URL: {TOKEN_URL}\n")

# 1: No scope at all
print("1) No scope, body auth")
r = requests.post(TOKEN_URL, data={
    'grant_type': 'client_credentials',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
})
print(f"   {r.status_code} {r.text[:200]}\n")

# 2: Basic auth header, no scope
print("2) No scope, Basic auth header")
creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
r = requests.post(TOKEN_URL, headers={
    'Authorization': f'Basic {creds}',
    'Content-Type': 'application/x-www-form-urlencoded',
}, data={'grant_type': 'client_credentials'})
print(f"   {r.status_code} {r.text[:200]}\n")

# 3: Basic auth with scope
print("3) Basic auth + scope")
r = requests.post(TOKEN_URL, headers={
    'Authorization': f'Basic {creds}',
    'Content-Type': 'application/x-www-form-urlencoded',
}, data={
    'grant_type': 'client_credentials',
    'scope': SCOPES,
})
print(f"   {r.status_code} {r.text[:200]}\n")

# 4: JSON body instead of form data
print("4) JSON body")
r = requests.post(TOKEN_URL, json={
    'grant_type': 'client_credentials',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'scope': SCOPES,
})
print(f"   {r.status_code} {r.text[:200]}\n")

# 5: Try consumer_key/consumer_secret naming
print("5) consumer_key/consumer_secret naming")
r = requests.post(TOKEN_URL, data={
    'grant_type': 'client_credentials',
    'consumer_key': CLIENT_ID,
    'consumer_secret': CLIENT_SECRET,
    'scope': SCOPES,
})
print(f"   {r.status_code} {r.text[:200]}\n")

# 6: Basic auth, JSON body, with scope
print("6) Basic auth + JSON body + scope")
r = requests.post(TOKEN_URL, headers={
    'Authorization': f'Basic {creds}',
    'Content-Type': 'application/json',
}, json={
    'grant_type': 'client_credentials',
    'scope': SCOPES,
})
print(f"   {r.status_code} {r.text[:200]}\n")

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
        print(f"Found students! Showing first record structure:")
        print(json.dumps(data['users'][0], indent=2))
    else:
        print(f"Response keys: {list(data.keys())}")
        print(json.dumps(data, indent=2)[:500])
else:
    print(f"Error: {api_response.text[:500]}")