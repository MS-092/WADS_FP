import requests
import json

url = "http://localhost:8000/api/v1/auth/login"
data = {
    "email": "admin@helpdesk.com",
    "password": "admin123"
}

print(f"Testing login API: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        print("✅ Login successful!")
        token_data = response.json()
        print(f"Access Token: {token_data.get('access_token', 'N/A')[:50]}...")
    else:
        print("❌ Login failed!")
        
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to server. Is it running?")
except Exception as e:
    print(f"❌ Error: {e}") 