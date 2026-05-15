"""
test_sheet.py
Verify Google Sheets API access and inspect the sheet structure.
"""

import gspread

# Authenticate with the service account
gc = gspread.service_account(filename='sync/service-account.json')

# Open the sheet — replace with your actual sheet name
sheet = gc.open("SOAR House Points (Responses)")
worksheet = sheet.worksheet("House Points")  # specific tab by name

# Show the headers (row 8) and a few data rows
headers = worksheet.row_values(8)
print(f"Headers: {headers}\n")

# Grab a few rows starting from row 9
sample = worksheet.get('A9:H11')
for row in sample:
    # Redact the name column
    if len(row) > 1:
        row[1] = '[STAFF]'
    print(row)

print(f"\nTotal rows in sheet: {worksheet.row_count}")
print(f"Last row with data: {len(worksheet.get_all_values())}")