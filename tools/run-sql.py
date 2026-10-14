import json
import os
import sys
import urllib.error
import urllib.request

token = os.environ["SUPABASE_ACCESS_TOKEN"]
ref = os.environ["SUPABASE_PROJECT_REF"]

sql = sys.stdin.read() if sys.argv[1] == "-" else open(sys.argv[1]).read()

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{ref}/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req, timeout=180) as response:
        body = response.read().decode()
        print(f"OK {response.status}")
        print(body[:4000])
except urllib.error.HTTPError as error:
    print(f"HTTP {error.code}")
    print(error.read().decode()[:4000])
    sys.exit(1)
