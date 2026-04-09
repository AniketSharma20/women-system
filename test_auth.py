#!/usr/bin/env python3
"""
Test script to verify the authentication system is working correctly
"""

import sys
import os
import sqlite3
import hashlib
import json

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all required modules can be imported"""
    try:
        from app import init_db, hash_password, verify_password, app
        print("✓ All imports successful")
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_password_functions():
    """Test password hashing and verification"""
    try:
        from app import hash_password, verify_password
        
        test_password = "testpassword123"
        hashed = hash_password(test_password)
        
        # Test correct password
        if not verify_password(test_password, hashed):
            print("✗ Password verification failed for correct password")
            return False
        
        # Test wrong password
        if verify_password("wrongpassword", hashed):
            print("✗ Password verification failed - accepted wrong password")
            return False
        
        print("✓ Password functions working correctly")
        return True
    except Exception as e:
        print(f"✗ Password function error: {e}")
        return False

def test_database():
    """Test database initialization and basic operations"""
    try:
        from app import init_db, hash_password
        
        # Initialize database
        init_db()
        
        # Check if database file exists
        if not os.path.exists('security_system.db'):
            print("✗ Database file not created")
            return False
        
        # Test database connection and basic operations
        conn = sqlite3.connect('security_system.db')
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("✗ Users table not created")
            conn.close()
            return False
        
        # Test user registration
        test_user = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'phone': '+1234567890'
        }
        
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, phone_number)
            VALUES (?, ?, ?, ?)
        ''', (test_user['username'], test_user['email'], 
              hash_password(test_user['password']), test_user['phone']))
        conn.commit()
        
        # Test user retrieval
        cursor.execute('SELECT id, password_hash, username FROM users WHERE username = ?', 
                      (test_user['username'],))
        user = cursor.fetchone()
        
        if not user:
            print("✗ Test user not found in database")
            conn.close()
            return False
        
        # Test password verification
        if not verify_password(test_user['password'], user[1]):
            print("✗ Stored password verification failed")
            conn.close()
            return False
        
        # Clean up test user
        cursor.execute('DELETE FROM users WHERE username = ?', (test_user['username'],))
        conn.commit()
        conn.close()
        
        print("✓ Database operations working correctly")
        return True
    except Exception as e:
        print(f"✗ Database error: {e}")
        return False

def test_flask_app():
    """Test Flask app configuration"""
    try:
        from app import app
        
        # Test app configuration
        if not app.secret_key:
            print("✗ Flask app missing secret key")
            return False
        
        print("✓ Flask app configuration correct")
        return True
    except Exception as e:
        print(f"✗ Flask app error: {e}")
        return False

def test_templates():
    """Test if template files exist and are readable"""
    try:
        templates_dir = 'templates'
        required_templates = ['index.html', 'dashboard.html']
        
        for template in required_templates:
            template_path = os.path.join(templates_dir, template)
            if not os.path.exists(template_path):
                print(f"✗ Template file missing: {template}")
                return False
            
            # Try to read the file
            with open(template_path, 'r') as f:
                content = f.read()
                if not content:
                    print(f"✗ Template file empty: {template}")
                    return False
        
        print("✓ Template files exist and are readable")
        return True
    except Exception as e:
        print(f"✗ Template error: {e}")
        return False

def test_static_files():
    """Test if static files exist"""
    try:
        static_dir = 'static'
        required_files = ['script.js', 'auth-styles.css', 'style.css']
        
        for file in required_files:
            file_path = os.path.join(static_dir, file)
            if not os.path.exists(file_path):
                print(f"✗ Static file missing: {file}")
                return False
        
        print("✓ Static files exist")
        return True
    except Exception as e:
        print(f"✗ Static files error: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing SafeGuard Authentication System")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Password Functions", test_password_functions),
        ("Database Operations", test_database),
        ("Flask App Configuration", test_flask_app),
        ("Template Files", test_templates),
        ("Static Files", test_static_files)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        else:
            print(f"  {test_name} failed!")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Authentication system is ready.")
        return True
    else:
        print("❌ Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)