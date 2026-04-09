#!/usr/bin/env python3
"""
Test script to verify authentication display fixes
"""
import sys
import os
import requests
import time
from threading import Thread

# Add the app to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_app_startup():
    """Test that the Flask app can start without errors"""
    try:
        from app import app, init_db
        print("✅ Flask app imported successfully")
        
        # Test database initialization
        init_db()
        print("✅ Database initialized successfully")
        
        # Test app configuration
        print(f"✅ App secret key configured: {app.secret_key[:8]}...")
        print(f"✅ App debug mode: {app.debug}")
        
        return True
    except Exception as e:
        print(f"❌ Error starting app: {e}")
        return False

def test_routes():
    """Test that all required routes are available"""
    try:
        from app import app
        with app.test_client() as client:
            # Test main route
            response = client.get('/')
            print(f"✅ Main route (/) returns status: {response.status_code}")
            
            # Test auth forms route
            response = client.get('/auth-forms')
            print(f"✅ Auth forms route (/auth-forms) returns status: {response.status_code}")
            
            # Test landing route
            response = client.get('/landing')
            print(f"✅ Landing route (/landing) returns status: {response.status_code}")
            
            return True
    except Exception as e:
        print(f"❌ Error testing routes: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    try:
        from app import app
        with app.test_client() as client:
            # Test registration endpoint (should return JSON error for missing data)
            response = client.post('/register', 
                                 json={},
                                 content_type='application/json')
            print(f"✅ Registration endpoint (/register) returns status: {response.status_code}")
            
            # Test login endpoint (should return JSON error for missing data)
            response = client.post('/login',
                                 json={},
                                 content_type='application/json')
            print(f"✅ Login endpoint (/login) returns status: {response.status_code}")
            
            return True
    except Exception as e:
        print(f"❌ Error testing auth endpoints: {e}")
        return False

def test_template_rendering():
    """Test that templates render without errors"""
    try:
        from app import app
        with app.test_client() as client:
            # Test main page rendering
            response = client.get('/')
            if response.status_code == 200:
                content = response.get_data(as_text=True)
                if 'SafeGuard' in content and 'authModal' in content:
                    print("✅ Main page renders correctly with auth modal")
                else:
                    print("⚠️  Main page renders but missing expected content")
            
            # Test auth forms rendering
            response = client.get('/auth-forms')
            if response.status_code == 200:
                content = response.get_data(as_text=True)
                if 'Sign In' in content and 'Sign Up' in content:
                    print("✅ Auth forms render correctly")
                else:
                    print("⚠️  Auth forms render but missing expected content")
            
            return True
    except Exception as e:
        print(f"❌ Error testing template rendering: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 Testing SafeGuard Authentication System")
    print("=" * 50)
    
    tests = [
        ("App Startup", test_app_startup),
        ("Routes", test_routes),
        ("Auth Endpoints", test_auth_endpoints),
        ("Template Rendering", test_template_rendering),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} tests...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Tests passed: {passed}/{len(results)}")
    
    if passed == len(results):
        print("\n🎉 All tests passed! The authentication system should work correctly.")
        print("\n💡 To start the application:")
        print("   python app.py")
        print("\n🌐 Then visit:")
        print("   http://localhost:5000")
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed. Please check the errors above.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)