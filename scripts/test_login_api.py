import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/auth/login/'
data = {
    'username': 'admin',
    'password': 'kvva@admin2024'
}

req_data = json.dumps(data).encode('utf-8')
req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json'}, method='POST')

print("="*60)
print(f"Testing Login API at: {url}")
print(f"Sending Credentials: username=admin, password=kvva@admin2024")
print("="*60)

try:
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        body = response.read().decode('utf-8')
        print(f"\nSUCCESS! Status Code: {status_code}")
        print(f"Response Body: {body}")
except urllib.error.HTTPError as e:
    print(f"\nHTTP ERROR occurred!")
    print(f"Status Code: {e.code}")
    try:
        error_body = e.read().decode('utf-8')
        print(f"Error Response: {error_body}")
    except Exception:
        pass
except urllib.error.URLError as e:
    print(f"\nCONNECTION ERROR occurred!")
    print(f"Reason: {e.reason}")
    print("\nPROBABLE REASONS:")
    print("1. The Django/Waitress backend server is NOT running on port 8000.")
    print("2. Run scripts\\start_backend.bat to start the backend server.")
print("="*60)
input("Press Enter to close...")
