#!/usr/bin/env python3
"""
Test script for user registration endpoint
"""

import requests
import json

def test_register():
    """Test the registration endpoint"""
    url = "http://localhost:8000/api/auth/register"
    
    # Test data
    test_user = {
        "username": "testuser456",
        "email": "testuser456@example.com", 
        "password": "TestPass123",
        "full_name": "Test User 456",
        "role": "customer"
    }
    
    print(f"🧪 Testing registration endpoint: {url}")
    print(f"📊 Test data: {json.dumps(test_user, indent=2)}")
    
    try:
        response = requests.post(url, json=test_user)
        
        print(f"\n📤 Request sent")
        print(f"📥 Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Registration successful!")
            print(f"👤 Created user: {result.get('username')} ({result.get('email')})")
            print(f"🆔 User ID: {result.get('id')}")
            print(f"👤 Role: {result.get('role')}")
        else:
            print("❌ Registration failed!")
            try:
                error = response.json()
                print(f"🚨 Error: {error}")
            except:
                print(f"🚨 Raw error: {response.text}")
        
        return response.status_code == 201
        
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    test_register() 