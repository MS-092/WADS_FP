import requests
import json

def test_login_api(email: str, password: str):
    """Test login API with detailed debugging"""
    url = "http://localhost:8000/api/v1/auth/login"
    
    print(f"🔍 Testing API login for: {email}")
    print(f"🔑 Password: {password}")
    print(f"🌐 URL: {url}")
    print("-" * 60)
    
    # Test data
    data = {
        "email": email,
        "password": password
    }
    
    print(f"📤 Request data: {json.dumps(data, indent=2)}")
    
    try:
        # Make the request
        response = requests.post(
            url, 
            json=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        
        print(f"\n📬 Response:")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Headers: {dict(response.headers)}")
        print(f"   - Content Type: {response.headers.get('content-type', 'unknown')}")
        print(f"   - Response Length: {len(response.text)} chars")
        print(f"   - Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            try:
                token_data = response.json()
                print(f"🎫 Token data keys: {list(token_data.keys())}")
                if 'access_token' in token_data:
                    print(f"🔑 Access Token (first 50 chars): {token_data['access_token'][:50]}...")
            except json.JSONDecodeError:
                print("⚠️ Could not parse JSON response")
        else:
            print("❌ Login failed!")
            try:
                error_data = response.json()
                print(f"💥 Error details: {error_data}")
            except json.JSONDecodeError:
                print("⚠️ Could not parse error JSON")
        
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running on port 8000?")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        return False

def check_server_health():
    """Check if the server is running"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        print(f"✅ Server is running (status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible")
        return False
    except Exception as e:
        print(f"⚠️ Server check failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing helpdesk login API")
    print("=" * 70)
    
    # Check server first
    print("1️⃣ Checking server health...")
    if not check_server_health():
        print("\n💡 Make sure the server is running with: python run_server.py")
        exit(1)
    
    print("\n2️⃣ Testing login endpoints...")
    
    # Test cases
    test_cases = [
        ("admin@helpdesk.com", "admin123"),
        ("agent@helpdesk.com", "agent123"),
        ("admin@helpdesk.com", "wrongpassword"),  # Should fail
    ]
    
    for email, password in test_cases:
        print(f"\n{'='*70}")
        success = test_login_api(email, password)
        print(f"Result: {'✅ SUCCESS' if success else '❌ FAILED'}")
    
    print(f"\n{'='*70}")
    print("🏁 API testing completed!") 