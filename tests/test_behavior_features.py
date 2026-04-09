#!/usr/bin/env python3
"""
Test script for the advanced user behavior-driven recommendations and smart personalized notifications feature.
"""

import sqlite3
import json
import sys
import os

# Add the current directory to Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, behavior_analyzer

def test_database_schema():
    """Test that the database has the required tables for behavior tracking."""
    print("🔍 Testing database schema...")
    
    conn = sqlite3.connect('security_system.db')
    cursor = conn.cursor()
    
    # Check if required tables exist
    required_tables = ['user_behavior', 'user_preferences', 'user_behavior_patterns']
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = [table[0] for table in cursor.fetchall()]
    
    missing_tables = [table for table in required_tables if table not in existing_tables]
    
    if missing_tables:
        print(f"❌ Missing tables: {', '.join(missing_tables)}")
        return False
    
    print("✅ All required tables exist in the database.")
    
    # Check user_behavior table structure
    cursor.execute("PRAGMA table_info(user_behavior)")
    behavior_columns = [col[1] for col in cursor.fetchall()]
    
    required_behavior_columns = ['user_id', 'action_type', 'action_details', 'timestamp', 'location_latitude', 'location_longitude', 'device_info']
    missing_behavior_columns = [col for col in required_behavior_columns if col not in behavior_columns]
    
    if missing_behavior_columns:
        print(f"❌ Missing columns in user_behavior table: {', '.join(missing_behavior_columns)}")
        return False
    
    print("✅ user_behavior table has all required columns.")
    
    # Check user_preferences table structure
    cursor.execute("PRAGMA table_info(user_preferences)")
    preferences_columns = [col[1] for col in cursor.fetchall()]
    
    required_preferences_columns = ['user_id', 'preferred_shelter_type', 'notification_preferences', 'emergency_contact_preference', 'location_sharing_preference', 'last_active']
    missing_preferences_columns = [col for col in required_preferences_columns if col not in preferences_columns]
    
    if missing_preferences_columns:
        print(f"❌ Missing columns in user_preferences table: {', '.join(missing_preferences_columns)}")
        return False
    
    print("✅ user_preferences table has all required columns.")
    
    # Check user_behavior_patterns table structure
    cursor.execute("PRAGMA table_info(user_behavior_patterns)")
    patterns_columns = [col[1] for col in cursor.fetchall()]
    
    required_patterns_columns = ['user_id', 'pattern_type', 'pattern_data', 'confidence_score', 'last_updated']
    missing_patterns_columns = [col for col in required_patterns_columns if col not in patterns_columns]
    
    if missing_patterns_columns:
        print(f"❌ Missing columns in user_behavior_patterns table: {', '.join(missing_patterns_columns)}")
        return False
    
    print("✅ user_behavior_patterns table has all required columns.")
    
    conn.close()
    return True

def test_behavior_analyzer():
    """Test the behavior analyzer functionality."""
    print("\n🔍 Testing behavior analyzer...")
    
    if not behavior_analyzer:
        print("❌ Behavior analyzer not initialized")
        return False
    
    # Test sample behavior data
    sample_behavior_data = [
        {'action_type': 'location_tracking', 'action_details': 'Started tracking', 'timestamp': '2023-01-01 10:00:00'},
        {'action_type': 'location_tracking', 'action_details': 'Location updated', 'timestamp': '2023-01-01 10:05:00'},
        {'action_type': 'location_tracking', 'action_details': 'Location updated', 'timestamp': '2023-01-01 10:10:00'},
        {'action_type': 'location_tracking', 'action_details': 'Location updated', 'timestamp': '2023-01-01 10:15:00'},
        {'action_type': 'emergency_activation', 'action_details': 'Activated siren', 'timestamp': '2023-01-01 11:00:00'},
        {'action_type': 'complaint_filing', 'action_details': 'Filed harassment complaint', 'timestamp': '2023-01-01 12:00:00'},
        {'action_type': 'shelter_search', 'action_details': 'Searched for nearby shelters', 'timestamp': '2023-01-01 13:00:00'},
        {'action_type': 'ai_assistant', 'action_details': 'Used voice command', 'timestamp': '2023-01-01 14:00:00'},
    ]
    
    try:
        # Test pattern analysis
        patterns = behavior_analyzer.analyze_behavior(1, sample_behavior_data)
        
        if not patterns:
            print("❌ No patterns detected from sample data")
            return False
        
        print(f"✅ Detected {len(patterns)} behavior patterns:")
        for pattern in patterns:
            print(f"   - {pattern['type']} (confidence: {pattern['confidence']})")
        
        # Test recommendation generation
        recommendations = behavior_analyzer.generate_recommendations(1, patterns)
        
        if not recommendations:
            print("❌ No recommendations generated from patterns")
            return False
        
        print(f"✅ Generated {len(recommendations)} personalized recommendations:")
        for rec in recommendations:
            print(f"   - {rec['title']} (priority: {rec['priority']})")
        
        # Test smart notification generation
        notifications = behavior_analyzer.generate_smart_notifications(1, patterns)
        
        if not notifications:
            print("❌ No smart notifications generated from patterns")
            return False
        
        print(f"✅ Generated {len(notifications)} smart notifications:")
        for notif in notifications:
            print(f"   - {notif['title']} (priority: {notif['priority']})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in behavior analyzer: {e}")
        return False

def test_api_endpoints():
    """Test the API endpoints for behavior tracking."""
    print("\n🔍 Testing API endpoints...")
    
    # Create a test client
    test_client = app.test_client()
    
    # Test behavior tracking endpoint
    try:
        response = test_client.post('/api/track-behavior', 
                                   json={'action_type': 'test_action', 'action_details': 'Test behavior'},
                                   follow_redirects=True)
        
        if response.status_code != 401:  # Should return 401 since no user is logged in
            print("❌ Behavior tracking endpoint should require authentication")
            return False
        
        print("✅ Behavior tracking endpoint requires authentication as expected")
        
    except Exception as e:
        print(f"❌ Error testing behavior tracking endpoint: {e}")
        return False
    
    # Test other endpoints (they should also require authentication)
    endpoints_to_test = [
        '/api/behavior-patterns',
        '/api/personalized-recommendations', 
        '/api/smart-notifications'
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = test_client.get(endpoint, follow_redirects=True)
            
            if response.status_code != 401:
                print(f"❌ {endpoint} should require authentication")
                return False
            
            print(f"✅ {endpoint} requires authentication as expected")
            
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")
            return False
    
    return True

def test_frontend_integration():
    """Test that the frontend has the necessary JavaScript functions."""
    print("\n🔍 Testing frontend integration...")
    
    try:
        with open('static/script.js', 'r') as f:
            js_content = f.read()
        
        # Check for required functions
        required_functions = [
            'trackUserBehavior',
            'loadPersonalizedRecommendations', 
            'displayPersonalizedRecommendations',
            'loadSmartNotifications',
            'showSmartNotification',
            'analyzeBehaviorPatterns',
            'initBehaviorTracking',
            'setupBehaviorEventListeners'
        ]
        
        missing_functions = []
        for func in required_functions:
            if f'function {func}' not in js_content:
                missing_functions.append(func)
        
        if missing_functions:
            print(f"❌ Missing frontend functions: {', '.join(missing_functions)}")
            return False
        
        print("✅ All required frontend functions are present.")
        
        # Check for CSS styles
        with open('static/style.css', 'r') as f:
            css_content = f.read()
        
        required_styles = [
            '.recommendation-item.personalized',
            '.priority-badge',
            '.notification.smart'
        ]
        
        missing_styles = []
        for style in required_styles:
            if style not in css_content:
                missing_styles.append(style)
        
        if missing_styles:
            print(f"❌ Missing CSS styles: {', '.join(missing_styles)}")
            return False
        
        print("✅ All required CSS styles are present.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing frontend integration: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting tests for advanced user behavior-driven recommendations and smart personalized notifications...\n")
    
    tests = [
        test_database_schema,
        test_behavior_analyzer,
        test_api_endpoints,
        test_frontend_integration
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test in tests:
        if test():
            passed_tests += 1
        else:
            print(f"\n❌ {test.__name__} failed")
    
    print(f"\n📊 Test Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! The feature is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)