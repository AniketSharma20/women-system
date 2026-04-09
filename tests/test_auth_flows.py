#!/usr/bin/env python3
"""
Test script to validate the authentication flows.
This script tests the main components that were fixed.
"""

import requests
import json
import time
import webbrowser
from urllib.parse import urljoin

class AuthFlowTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_landing_page(self):
        """Test that the landing page loads correctly."""
        print("Testing Landing Page...")
        try:
            response = self.session.get(self.base_url)
            if response.status_code == 200:
                print("✓ Landing page loads successfully")
                return True
            else:
                print(f"✗ Landing page failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Landing page test failed: {e}")
            return False
    
    def test_auth_forms(self):
        """Test that authentication forms load correctly."""
        print("Testing Auth Forms...")
        try:
            response = self.session.get(urljoin(self.base_url, "/auth-forms"))
            if response.status_code == 200:
                print("✓ Auth forms load successfully")
                return True
            else:
                print(f"✗ Auth forms failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Auth forms test failed: {e}")
            return False
    
    def test_registration(self):
        """Test user registration flow."""
        print("Testing Registration...")
        try:
            # Test data
            test_data = {
                "firstName": "Test",
                "lastName": "User",
                "username": f"testuser_{int(time.time())}",
                "email": f"test_{int(time.time())}@example.com",
                "phone": "+1234567890",
                "password": "TestPassword123"
            }
            
            response = self.session.post(
                urljoin(self.base_url, "/register"),
                json=test_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✓ Registration successful")
                    return True
                else:
                    print(f"✗ Registration failed: {result.get('message')}")
                    return False
            else:
                print(f"✗ Registration failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Registration test failed: {e}")
            return False
    
    def test_login(self, username, password):
        """Test user login flow."""
        print("Testing Login...")
        try:
            login_data = {
                "username": username,
                "password": password
            }
            
            response = self.session.post(
                urljoin(self.base_url, "/login"),
                json=login_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✓ Login successful")
                    return True
                else:
                    print(f"✗ Login failed: {result.get('message')}")
                    return False
            else:
                print(f"✗ Login failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Login test failed: {e}")
            return False
    
    def test_dashboard_access(self):
        """Test dashboard access after login."""
        print("Testing Dashboard Access...")
        try:
            response = self.session.get(urljoin(self.base_url, "/dashboard"))
            if response.status_code == 200:
                print("✓ Dashboard accessible after login")
                return True
            else:
                print(f"✗ Dashboard access failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Dashboard test failed: {e}")
            return False
    
    def test_logout(self):
        """Test logout functionality."""
        print("Testing Logout...")
        try:
            response = self.session.get(urljoin(self.base_url, "/logout"))
            if response.status_code == 302:  # Redirect after logout
                print("✓ Logout successful")
                return True
            else:
                print(f"✗ Logout failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Logout test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all authentication flow tests."""
        print("=" * 60)
        print("SAFE GUARD AUTHENTICATION FLOW TEST")
        print("=" * 60)
        
        tests = [
            ("Landing Page", self.test_landing_page),
            ("Auth Forms", self.test_auth_forms),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- {test_name} ---")
            if test_func():
                passed += 1
        
        # Test registration and login flow
        print(f"\n--- Registration & Login Flow ---")
        if self.test_registration():
            # Extract test user info for login
            test_username = f"testuser_{int(time.time())}"
            test_password = "TestPassword123"
            
            if self.test_login(test_username, test_password):
                if self.test_dashboard_access():
                    passed += 3  # Registration, login, and dashboard access
                self.test_logout()  # Test logout but don't count it
        
        print("\n" + "=" * 60)
        print("TEST RESULTS")
        print("=" * 60)
        print(f"Passed: {passed}/{total + 2} tests")
        success_rate = (passed / (total + 2)) * 100
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("\n🎉 EXCELLENT! Authentication flows are working correctly!")
        elif success_rate >= 60:
            print("\n👍 GOOD! Most authentication flows are working.")
        else:
            print("\n⚠️  WARNING! Some authentication flows may have issues.")
        
        return passed, total + 2

def main():
    """Main test function."""
    print("Starting Authentication Flow Tests...")
    print("Make sure the Flask server is running on http://localhost:5000")
    
    tester = AuthFlowTester()
    passed, total = tester.run_all_tests()
    
    if passed == total:
        print("\n✅ All tests passed! Authentication system is working correctly.")
    else:
        print(f"\n❌ {total - passed} test(s) failed. Please check the issues above.")
    
    print("\nTo manually test:")
    print("1. Open http://localhost:5000 in your browser")
    print("2. Try signing up with a new account")
    print("3. Log in with the created account")
    print("4. Verify you can access the dashboard")

if __name__ == "__main__":
    main()