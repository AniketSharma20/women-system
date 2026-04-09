from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import sqlite3
import hashlib
import secrets
import json
import os
from datetime import datetime
import requests
import threading
import time
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app)

# Database setup
def init_db():
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            pattern_hash TEXT,
            phone_number TEXT,
            emergency_contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add pattern_hash column if it doesn't exist
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN pattern_hash TEXT')
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Location tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS location_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            latitude REAL,
            longitude REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Complaints table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Safe shelters table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS safe_shelters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            phone TEXT,
            capacity INTEGER,
            facilities TEXT,
            rating REAL DEFAULT 0
        )
    ''')
    
    # Emergency tips table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emergency_tips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Recommendations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            message TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE,
            priority TEXT DEFAULT 'medium',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # User behavior tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_behavior (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action_type TEXT NOT NULL,
            action_details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            location_latitude REAL,
            location_longitude REAL,
            device_info TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # User preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            preferred_shelter_type TEXT,
            notification_preferences TEXT,
            emergency_contact_preference TEXT,
            location_sharing_preference TEXT,
            last_active TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # User behavior patterns table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_behavior_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            pattern_type TEXT NOT NULL,
            pattern_data TEXT,
            confidence_score REAL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # SMS logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            recipient_number TEXT NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'emergency',
            status TEXT DEFAULT 'pending',
            twilio_sid TEXT,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert sample data
    cursor.execute('''
        INSERT OR IGNORE INTO safe_shelters (name, address, latitude, longitude, phone, capacity, facilities, rating)
        VALUES 
        ('Women Safety Center - Central', '123 Safety Street, City Center', 28.6139, 77.2090, '+91-11-2341-5678', 50, 'Security, Medical, Counseling', 4.5),
        ('Safe Haven Shelter', '456 Protection Avenue, District 2', 28.7041, 77.1025, '+91-11-3456-7890', 30, '24/7 Security, Legal Aid', 4.2),
        ('Women Protection Home', '789 Care Road, Zone 3', 28.5355, 77.3910, '+91-11-4567-8901', 40, 'Counseling, Job Training', 4.7),
        ('New Shelter', 'New Address', 28.6139, 77.2090, '+91-11-2341-5678', 50, 'Security, Medical, Counseling', 4.5),
        ('Another Shelter', 'Another Address', 28.7041, 77.1025, '+91-11-3456-7890', 30, '24/7 Security, Legal Aid', 4.2),
        ('New Shelter 2', 'New Address 2', 28.6139, 77.2090, '+91-11-2341-5678', 50, 'Security, Medical, Counseling', 4.5),
        ('Another Shelter 2', 'Another Address 2', 28.7041, 77.1025, '+91-11-3456-7890', 30, '24/7 Security, Legal Aid', 4.2)
    ''')
    
    cursor.execute('''
        INSERT OR IGNORE INTO emergency_tips (title, content, category)
        VALUES 
        ('Trust Your Intuition', 'If something feels wrong, it probably is. Do not ignore your gut feelings. Your safety is more important than being polite. Leave immediately if you feel unsafe.', 'emergency'),
        ('Emergency Contacts Ready', 'Keep emergency numbers saved and practice using quick-dial features. Save police (100), ambulance (108), and women helpline (1091) for immediate access.', 'emergency'),
        ('Know Your Exit Points', 'When in any building, always identify exits, emergency routes, and safe areas. Memorize at least two exit routes from every location.', 'emergency'),
        ('Share Your Location', 'Keep location sharing enabled with trusted contacts. In case of emergency, they can find you quickly. Update your emergency contacts regularly.', 'technology'),
        ('Use Safe Location Sharing', 'Share your live location only with trusted contacts through the app. Use the Share Location feature when meeting someone new or traveling alone.', 'technology'),
        ('Stay Aware of Surroundings', 'Avoid distractions like headphones when walking alone. Stay on well-lit, populated paths. Trust your instincts - if a place feels unsafe, leave.', 'general'),
        ('Walk with Confidence', 'Walk with purpose and make eye contact with people around you. Avoid looking lost or distracted, especially in isolated areas.', 'general'),
        ('Trust But Verify', 'When meeting someone from online or new contacts, meet in public places. Tell a friend where you are going and when you will be back.', 'safety'),
        ('Digital Safety Tip', 'Be cautious when sharing personal info online.', 'technology'),
        ('Phone Safety Tip', 'Use strong passwords and keep your phone charged.', 'technology'),
        ('New Tip', 'New tip content.', 'general'),
        ('Use the Fake Call Feature', 'If you feel unsafe, use the fake call feature to create an excuse to leave a situation quickly. It is a discreet way to extract yourself from danger.', 'safety'),
        ('Emergency Siren Awareness', 'The emergency siren can be activated instantly to attract attention and deter attackers. Know where the emergency button is in your app.', 'emergency'),
        ('Safe Transportation', 'Use registered taxi or ride-share services. Verify the license plate before entering. Share your ride details with a trusted contact.', 'travel'),
        ('Accommodation Safety', 'When traveling, choose reputable accommodations. Use deadbolts and chain locks. Keep important documents secure and have digital backups.', 'travel'),
        ('Plan Your Route', 'Before going out, plan your route and share it with someone you trust. Stick to busy, well-lit areas. Have a backup plan if something goes wrong.', 'general'),
        ('Stay Connected', 'Keep your phone charged and have emergency contacts on speed dial. Check in regularly with family or friends, especially when traveling alone.', 'contact'),
        ('Trust Your Network', 'Build a support network of friends, family, and neighbors. Having people who know your routine can help spot when something is wrong.', 'general'),
        ('Workplace Security', 'Be aware of emergency exits at work. Do not share sensitive information with colleagues you do not trust well. Report any suspicious behavior.', 'safety'),
        ('Late Night Safety', 'If working late, let someone know. Use well-lit parking lots and walkways. Consider using escort services if available at your workplace.', 'safety'),
        ('Trust But Verify Online', 'Be cautious about online relationships. Video chat before meeting in person. Search people names and photos to verify their identity.', 'technology'),
        ('Be Prepared Not Paranoid', 'Safety tips are about preparation, not fear. Being prepared gives you confidence. Review your emergency plan regularly.', 'general')
    ''')
    
    conn.commit()
    conn.close()

# Authentication functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    return hash_password(password) == password_hash

def hash_pattern(pattern):
    """Hash a pattern for secure storage"""
    pattern_string = ','.join(map(str, pattern))
    return hashlib.sha256(pattern_string.encode()).hexdigest()

def verify_pattern(pattern, pattern_hash):
    """Verify a pattern against its hash"""
    return hash_pattern(pattern) == pattern_hash

# User Behavior Analyzer
class UserBehaviorAnalyzer:
    def __init__(self):
        self.behavior_patterns = {}
        self.recommendation_rules = {
            'frequent_location_tracking': {
                'pattern': 'user tracks location more than 3 times per day',
                'recommendation': 'Suggest nearby safe shelters and emergency contacts',
                'priority': 'high'
            },
            'emergency_usage': {
                'pattern': 'user activates emergency features frequently',
                'recommendation': 'Provide safety tips and counseling resources',
                'priority': 'critical'
            },
            'complaint_filing': {
                'pattern': 'user files complaints regularly',
                'recommendation': 'Offer legal assistance and follow-up support',
                'priority': 'high'
            },
            'shelter_search': {
                'pattern': 'user searches for shelters often',
                'recommendation': 'Show nearby shelters with high ratings',
                'priority': 'medium'
            },
            'ai_assistant_usage': {
                'pattern': 'user frequently uses AI assistant',
                'recommendation': 'Provide advanced safety tips and voice commands',
                'priority': 'medium'
            }
        }

    def analyze_behavior(self, user_id, behavior_data):
        """Analyze user behavior and generate insights"""
        patterns = []
        
        # Count different types of actions
        action_counts = {}
        for action in behavior_data:
            action_type = action['action_type']
            action_counts[action_type] = action_counts.get(action_type, 0) + 1
        
        # Apply pattern detection rules
        if action_counts.get('location_tracking', 0) > 3:
            patterns.append({
                'type': 'frequent_location_tracking',
                'confidence': 0.9,
                'details': f"User tracks location {action_counts['location_tracking']} times"
            })
        
        if action_counts.get('emergency_activation', 0) > 1:
            patterns.append({
                'type': 'emergency_usage',
                'confidence': 0.85,
                'details': f"User activated emergency {action_counts['emergency_activation']} times"
            })
        
        if action_counts.get('complaint_filing', 0) > 2:
            patterns.append({
                'type': 'complaint_filing',
                'confidence': 0.8,
                'details': f"User filed {action_counts['complaint_filing']} complaints"
            })
        
        if action_counts.get('shelter_search', 0) > 4:
            patterns.append({
                'type': 'shelter_search',
                'confidence': 0.75,
                'details': f"User searched shelters {action_counts['shelter_search']} times"
            })
        
        if action_counts.get('ai_assistant', 0) > 5:
            patterns.append({
                'type': 'ai_assistant_usage',
                'confidence': 0.7,
                'details': f"User used AI assistant {action_counts['ai_assistant']} times"
            })
        
        return patterns

    def generate_recommendations(self, user_id, patterns):
        """Generate personalized recommendations based on behavior patterns"""
        recommendations = []
        
        for pattern in patterns:
            pattern_type = pattern['type']
            if pattern_type in self.recommendation_rules:
                rule = self.recommendation_rules[pattern_type]
                recommendations.append({
                    'title': f"Personalized Safety Tip: {rule['recommendation']}",
                    'description': rule['recommendation'],
                    'category': 'behavior_based',
                    'priority': rule['priority'],
                    'confidence': pattern['confidence']
                })
        
        return recommendations

    def generate_smart_notifications(self, user_id, patterns):
        """Generate smart notifications based on behavior patterns"""
        notifications = []
        
        for pattern in patterns:
            pattern_type = pattern['type']
            
            if pattern_type == 'frequent_location_tracking':
                notifications.append({
                    'title': 'Location Safety Reminder',
                    'message': 'Remember to share your location with trusted contacts when going out.',
                    'category': 'safety_reminder',
                    'priority': 'high'
                })
            
            elif pattern_type == 'emergency_usage':
                notifications.append({
                    'title': 'Emergency Support Available',
                    'message': 'Our counseling team is available 24/7. Contact us if you need support.',
                    'category': 'emergency_support',
                    'priority': 'critical'
                })
            
            elif pattern_type == 'complaint_filing':
                notifications.append({
                    'title': 'Legal Assistance Available',
                    'message': 'You can access free legal consultation through our partner organizations.',
                    'category': 'legal_support',
                    'priority': 'high'
                })
            
            elif pattern_type == 'shelter_search':
                notifications.append({
                    'title': 'Safe Shelters Nearby',
                    'message': 'We found additional safe shelters in your area. Check them out.',
                    'category': 'shelter_info',
                    'priority': 'medium'
                })
            
            elif pattern_type == 'ai_assistant_usage':
                notifications.append({
                    'title': 'Advanced Safety Features',
                    'message': 'Did you know you can use voice commands for emergency situations? Try saying "Emergency"',
                    'category': 'feature_tip',
                    'priority': 'medium'
                })
        
        return notifications


# Enhanced AI Assistant
class AIAssistant:
    def __init__(self):
        try:
            import speech_recognition as sr
            import pyttsx3
            self.recognizer = sr.Recognizer()
            self.tts_engine = pyttsx3.init()
            self.available = True
        except ImportError:
            self.available = False
            print("AI Assistant packages not available. Text-based assistant will be used.")
        
        # Comprehensive knowledge base for safety questions
        self.knowledge_base = {
            # Emergency questions
            'emergency': {
                'keywords': ['emergency', 'help', 'danger', 'panic', 'urgent', 'crisis', 'immediate'],
                'response': "🚨 EMERGENCY PROTOCOL ACTIVATED!\n\nI'm triggering all emergency features:\n• Loud siren alarm to attract attention\n• Sharing your live location with emergency contacts\n• Notifying authorities\n• Initiating fake call for your safety\n\nStay calm. Help is on the way. Your location is being shared now."
            },
            'siren': {
                'keywords': ['siren', 'alarm', 'loud', 'noise', 'alert'],
                'response': "🔊 Activating emergency siren...\n\nThe loud alarm will:\n• Attract attention from nearby people\n• Potentially deter attackers\n• Alert those around you that you need help\n\nYou can stop the siren anytime by pressing the Stop button. Use this feature when you feel unsafe or threatened."
            },
            'fake_call': {
                'keywords': ['fake call', 'fake', 'call', 'pretend call', 'simulation'],
                'response': "📞 Fake call feature activated!\n\nIn 10 seconds, you will receive a fake incoming call from Emergency Contact.\n\nThis helps you:\n• Excuse yourself from uncomfortable situations\n• Create a reason to leave\n• Feel safer in potentially dangerous scenarios\n\nYou can answer or decline the call. The call will auto-decline after 15 seconds."
            },
            'location': {
                'keywords': ['location', 'share location', 'track location', 'gps', 'where am i', 'current location'],
                'response': "📍 Location tracking activated!\n\nYour live location is being:\n• Shared with your emergency contacts\n• Stored securely for safety records\n• Updated at your chosen interval\n\nYou can start/stop tracking anytime. The map shows your current position with accuracy indicator."
            },
            'safe_shelters': {
                'keywords': ['safe shelter', 'safe place', 'shelter', 'safe house', 'refuge', 'women shelter', 'nearby shelter'],
                'response': "🏠 Finding safe shelters...\n\nI've found several safe shelters near you:\n• Women Safety Center - Central (5km away)\n• Safe Haven Shelter (8km away)\n• Women Protection Home (12km away)\n\nEach shelter offers:\n• 24/7 security\n• Medical facilities\n• Counseling services\n• Legal aid\n\nTap 'Find Nearby' to see them on the map and get directions."
            },
            'complaints': {
                'keywords': ['complaint', 'report', 'harassment', 'crime', 'incident', 'file complaint', 'submit complaint'],
                'response': "📋 Complaint Filing System\n\nYou can report:\n• Harassment (verbal, physical, digital)\n• Safety concerns in your area\n• Suspicious activities\n• Emergencies\n• Other incidents\n\nTo file a complaint:\n1. Go to Complaints section\n2. Fill in the title and description\n3. Select category\n4. Add location and time (if known)\n5. Attach evidence (photos/videos)\n6. Submit\n\nYour complaint is confidential and will be processed by authorities."
            },
            'emergency_numbers': {
                'keywords': ['emergency numbers', 'helpline', 'hotline', 'contact numbers', 'police', 'ambulance', 'fire'],
                'response': "📞 Emergency Contact Numbers:\n\n🚔 Police: 100 (24/7)\n🚑 Ambulance: 108\n🚒 Fire Brigade: 101\n👩 Women Helpline: 1091\n\nChild Helpline: 1098\nWomen's Helpline (All India): 181\n\nAll these numbers are free to call from any mobile. Save them in your contacts for quick access."
            },
            'safety_tips': {
                'keywords': ['safety tips', 'safety advice', 'stay safe', 'protection tips', 'self safety', 'prevent'],
                'response': "🛡️ Personal Safety Tips:\n\n📍 General Safety:\n• Stay alert of your surroundings always\n• Trust your instincts - if something feels wrong, leave\n• Keep your phone charged and accessible\n• Share your location with trusted contacts when going out\n\n🚶 Travel Safety:\n• Use well-lit, busy routes\n• Avoid walking alone at night when possible\n• Use reputable transport services\n• Keep someone informed of your travel plans\n\n🏠 Home Safety:\n• Install security locks and cameras\n• Don't open doors to strangers\n• Have emergency numbers saved\n\n📱 Digital Safety:\n• Use strong, unique passwords\n• Enable two-factor authentication\n• Be careful with personal information online"
            },
            'features': {
                'keywords': ['features', 'what can you do', 'capabilities', 'functions', 'help me'],
                'response': "🤖 I can help you with:\n\n🚨 Emergency Features:\n• Emergency alert (activates all safety features)\n• Siren alarm\n• Fake call simulation\n• Emergency location sharing\n\n📍 Location Tracking:\n• Live location tracking\n• Location history\n• Share location with contacts\n\n🏠 Safety Resources:\n• Find nearby safe shelters\n• Safety tips and advice\n• Emergency contact numbers\n\n📋 Reporting:\n• File complaints\n• Report incidents\n• Track complaint status\n\n💬 General Questions:\n• Answer safety-related questions\n• Provide guidance in emergencies\n• Offer safety advice and tips\n\nJust ask me anything related to your safety!"
            },
            'profile': {
                'keywords': ['profile', 'account', 'settings', 'my account', 'user profile', 'edit profile'],
                'response': "👤 Profile & Settings\n\nTo access profile features:\n• Click your avatar in the top-right corner\n• View your account information\n• Update emergency contacts\n• Adjust notification preferences\n• Customize location tracking settings\n\nYour profile includes:\n• Username and email\n• Phone number\n• Emergency contact information\n• Security settings\n\nYou can also logout from the header menu."
            },
            'notifications': {
                'keywords': ['notifications', 'alerts', 'messages', 'updates', 'notification settings'],
                'response': "🔔 Notifications System\n\nI keep you informed about:\n• Emergency alerts\n• Location updates\n• Complaint status changes\n• Safety tips\n• System notifications\n\nNotification types:\n• Unread notifications\n• Important alerts\n• Emergency broadcasts\n\nYou can:\n• Mark all as read\n• Filter by type\n• Clear all notifications\n• Adjust notification settings\n\nClick the bell icon to view your notifications."
            },
            'about': {
                'keywords': ['about', 'what is this', 'safeguard', 'women security', 'app purpose'],
                'response': "🛡️ About SafeGuard - Women Security System\n\nSafeGuard is a comprehensive women's safety application designed to empower women with tools and resources for personal security.\n\nFeatures include:\n• AI-powered safety assistant\n• Emergency alert system\n• Live location tracking\n• Safe shelter finder\n• Complaint filing system\n• Safety tips and resources\n\nOur mission: To create a safer environment for women through technology and community support.\n\nEmergency Helpline: 1091"
            },
            'how_to_use': {
                'keywords': ['how to use', 'how does this work', 'getting started', 'tutorial', 'guide'],
                'response': "📖 How to Use SafeGuard:\n\n1️⃣ Getting Started:\n• Create an account or login\n• Set up emergency contacts\n• Enable location services\n\n2️⃣ During Normal Use:\n• Keep the app running in background\n• Use quick commands with the AI assistant\n• Check safety tips regularly\n\n3️⃣ In Emergency:\n• Press the floating Emergency button OR\n• Say Emergency to the AI assistant\n• All safety features will activate\n\n4️⃣ Daily Safety:\n• Start location tracking when going out\n• Use fake call feature when feeling unsafe\n• Report any incidents via complaints\n\nNeed help with something specific? Just ask me!"
            },
            'self_defense': {
                'keywords': ['self defense', 'defense', 'protect yourself', 'fighting', 'defensive'],
                'response': "🥊 Self-Defense Tips:\n\nRemember: Your safety is the priority. Avoid confrontation when possible.\n\nBasic Techniques:\n• Palm strike to attacker's nose or chin\n• Knee kick to groin\n• Elbow strike to face or ribs\n• Finger poke to eyes\n\nUse Everyday Items as Weapons:\n• Keys between fingers\n• Umbrella\n• Hair spray or pepper spray\n• Heavy bag or purse\n\nEscape Techniques:\n• Run to well-lit, populated areas\n• Make noise to attract attention\n• Drop to the ground if grabbed\n• Scream \"Fire\" or \"Not my father\"\n\nConsider taking professional self-defense classes for better preparedness."
            },
            'travel_safety': {
                'keywords': ['travel safety', 'travel', 'journey', 'transport', 'bus', 'train', 'taxi'],
                'response': "🧳 Travel Safety Guidelines:\n\n🚗 General Tips:\n• Share your travel itinerary with someone\n• Book verified transport services\n• Check driver details before boarding\n• Sit in the back seat\n\n🚕 Taxis/Rideshare:\n• Verify license plate and driver photo\n• Share ride status with family/friends\n• Track your route on GPS\n• Don't travel alone late at night if possible\n\n🚂 Public Transport:\n• Stay in well-lit, crowded areas\n• Keep belongings secure\n• Know your route in advance\n• Avoid isolated stations\n\n✈️ Air Travel:\n• Keep valuables in carry-on\n• Stay aware of surroundings\n• Don't accept drinks from strangers\n\nStay connected with family during travel."
            },
            'digital_safety': {
                'keywords': ['digital safety', 'online', 'cyber', 'social media', 'privacy', 'stalking'],
                'response': "💻 Digital Safety Tips:\n\n📱 Social Media:\n• Review privacy settings regularly\n• Don't share real-time location updates\n• Be careful with \"check-ins\"\n• Don't accept requests from strangers\n\n📧 Email & Messaging:\n• Use strong, unique passwords\n• Enable two-factor authentication\n• Don't click suspicious links\n• Be wary of phishing attempts\n\n🔐 General Tips:\n• Keep your devices updated\n• Use VPN on public WiFi\n• Review app permissions\n• Log out from shared devices\n\nIf experiencing online harassment:\n• Block and report the person\n• Screenshot evidence\n• Report to platform administrators\n• Contact cyber crime cell if severe"
            },
            'workplace_safety': {
                'keywords': ['workplace safety', 'work', 'office', 'harassment at work', 'colleague'],
                'response': "🏢 Workplace Safety Guidelines:\n\nIf you experience harassment:\n• Document all incidents (dates, times, witnesses)\n• Report to HR immediately\n• Know your company's anti-harassment policy\n• Contact external authorities if internal reporting fails\n\nPhysical Safety at Work:\n• Know emergency exits\n• Don't work alone late if possible\n• Keep personal items secure\n• Trust your instincts about people\n\nUseful Contacts:\n• Internal HR\n• Internal security\n• External HR complaint: 1800-1234-5678\n\nKnow your rights under POSH Act (Prevention of Sexual Harassment)."
            },
            'night_safety': {
                'keywords': ['night safety', 'night', 'dark', 'late night', 'after dark'],
                'response': "🌙 Night Safety Guidelines:\n\n🚶 Walking Outside:\n• Stick to well-lit, busy routes\n• Walk confidently and aware\n• Avoid headphones or keep volume low\n• Let someone know your whereabouts\n\n🏠 Coming Home:\n• Have keys ready before reaching the door\n• Check the back seat before entering car\n• Do not linger at entrances\n\n🚗 Driving:\n• Park in well-lit, visible areas\n• Lock doors immediately upon entering\n• If followed, drive to a police station\n• Do not pick up hitchhikers\n\n🚌 Public Transport:\n• Try to travel during peak hours\n• Sit near driver or other passengers\n• Stay awake and alert\n\nIf you feel unsafe, find a shop or public place and call for help."
            },
            'home_safety': {
                'keywords': ['home safety', 'house', 'apartment', 'security at home', 'burglar'],
                'response': "🏠 Home Safety Tips:\n\n🚪 Door Security:\n• Use heavy-duty locks\n• Install door viewer/peephole\n• Don't open door to strangers\n• Use chain latch when opening door\n\n🪟 Window Security:\n• Lock all windows when leaving\n• Install security bars or grills\n• Consider window alarms\n\n📱 Technology:\n• Install security cameras\n• Use smart doorbells\n• Set up motion-sensor lights\n\n📞 Emergency:\n• Save emergency numbers on speed dial\n• Have a safe room prepared\n• Know your neighbors' contact\n\n🔑 When Moving In:\n• Change all locks\n• Check for spare keys\n• Review building security\n\nFor domestic safety concerns, contact women helpline 1091."
            },
            'helpline': {
                'keywords': ['helpline', 'women helpline', 'support', 'counseling', 'help line'],
                'response': "📞 Women Safety Helplines:\n\n🚺 Women Helpline (All India): 1091\n📱 Women Helpline (Domestic Abuse): 181\n👶 Child Helpline: 1098\n🚔 Police Emergency: 100\n🚑 Ambulance: 108\n🚒 Fire: 101\n\nWhat These Services Offer:\n• 24/7 emergency response\n• Legal guidance and support\n• Counseling services\n• Rescue operations coordination\n• Medical assistance\n\nAll calls are free and confidential. Don't hesitate to reach out if you need help."
            }
        }
        
    def get_response(self, query):
        """Get AI response for a user query"""
        query_lower = query.lower()
        
        # Check each category
        for category, data in self.knowledge_base.items():
            if any(keyword in query_lower for keyword in data['keywords']):
                return data['response']
        
        # Default response for unrecognized queries
        return self.get_default_response(query)
    
    def get_default_response(self, query):
        """Handle queries not in the knowledge base"""
        # Check for greeting
        greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy']
        if any(greet in query.lower() for greet in greetings):
            return "👋 Hello! I'm your SafeGuard AI Assistant. I'm here to help you stay safe.\n\nYou can ask me about:\n• Emergency procedures\n• Safety tips\n• How to use features\n• Location tracking\n• Safe shelters\n• Filing complaints\n• And more!\n\nWhat would you like to know about?"
        
        # Check for thanks
        thanks = ['thank', 'thanks', 'appreciate']
        if any(word in query.lower() for word in thanks):
            return "You're welcome! 😊\n\nYour safety is my priority. Don't hesitate to ask if you need anything else.\n\nStay safe!"
        
        # Check for goodbye
        bye = ['bye', 'goodbye', 'see you', 'tata', 'ciao']
        if any(word in query.lower() for word in bye):
            return "Goodbye! Stay safe out there! 🛡️\n\nRemember, I'm here 24/7 if you need help. Just open the app and ask!"
        
        # Check for feelings of unsafety
        unsafe_words = ['scared', 'afraid', 'unsafe', 'frightened', 'terrified', 'nervous', 'anxious']
        if any(word in query.lower() for word in unsafe_words):
            return "I understand you're feeling unsafe. Let's take action to help you feel more secure:\n\n1. 🌐 Go to Location section and start tracking\n2. 📞 Use Fake Call feature if you need an excuse to leave\n3. 🏠 Find nearest safe shelter\n4. 📞 Call women helpline 1091 if you need someone to talk to\n5. 🚨 Use Emergency Alert if you feel in immediate danger\n\nYou're not alone. Help is available 24/7."
        
        # Default response
        return "I'm here to help with your safety! 🛡️\n\nI can assist you with:\n• Emergency alerts and procedures\n• Location tracking and sharing\n• Finding safe shelters\n• Filing complaints\n• Safety tips and advice\n• Answering questions about using the app\n\nTry asking:\n• \"How do I use emergency features?\"\n• \"What are safety tips?\"\n• \"How to file a complaint?\"\n• \"Find nearby shelters\"\n\nWhat would you like to know?"
    
    def process_command(self, command):
        """Process voice/text command - returns action to take"""
        command = command.lower()
        
        # Check for emergency keywords first
        if any(word in command for word in ['emergency', 'help', 'danger', 'panic', 'sos', 'save me']):
            return {
                'type': 'emergency',
                'action': 'emergencyAlert()',
                'message': "🚨 Emergency detected! Activating all safety features..."
            }
        elif any(word in command for word in ['siren', 'alarm', 'loud noise']):
            return {
                'type': 'siren',
                'action': 'activateSiren()',
                'message': "🔊 Activating siren alarm..."
            }
        elif any(word in command for word in ['fake call', 'fake call', 'pretend call', 'call me']):
            return {
                'type': 'fake_call',
                'action': 'initiateFakeCall()',
                'message': "📞 Initiating fake call..."
            }
        elif any(word in command for word in ['location', 'track', 'where am i', 'gps']):
            return {
                'type': 'location',
                'action': 'startLocationTracking()',
                'message': "📍 Starting location tracking..."
            }
        elif any(word in command for word in ['safe place', 'shelter', 'safe house', 'refuge']):
            return {
                'type': 'shelter',
                'action': 'showSection(\"shelters\")',
                'message': "🏠 Finding safe shelters..."
            }
        elif any(word in command for word in ['complaint', 'report', 'file']):
            return {
                'type': 'complaint',
                'action': 'showSection(\"complaints\")',
                'message': "📋 Opening complaint section..."
            }
        elif any(word in command for word in ['tips', 'advice', 'safety', 'how to stay safe']):
            return {
                'type': 'tips',
                'action': 'showSection(\"tips\")',
                'message': "💡 Loading safety tips..."
            }
        elif any(word in command for word in ['map', 'navigation', 'directions']):
            return {
                'type': 'map',
                'action': 'showSection(\"location\")',
                'message': "🗺️ Opening map..."
            }
        elif any(word in command for word in ['contact', 'helpline', 'phone', 'call']):
            return {
                'type': 'emergency',
                'action': 'showSection(\"emergency\")',
                'message': "📞 Showing emergency contacts..."
            }
        else:
            return {
                'type': 'info',
                'action': None,
                'message': self.get_response(command)
            }
    
    def listen_and_respond(self):
        if not self.available:
            return "AI Assistant not available. Please use text input instead."
        
        try:
            import speech_recognition as sr
            with sr.Microphone() as source:
                print("Listening...")
                audio = self.recognizer.listen(source, timeout=5)
                text = self.recognizer.recognize_google(audio)
                response = self.process_command(text)
                self.speak(response['message'] if isinstance(response, dict) else response)
                return response
        except Exception as e:
            return f"Sorry, I didn't catch that. Error: {str(e)}"
    
    def speak(self, text):
        if not self.available:
            return
        
        try:
            import pyttsx3
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except:
            pass

try:
    ai_assistant = AIAssistant()
    behavior_analyzer = UserBehaviorAnalyzer()
except:
    ai_assistant = None
    behavior_analyzer = None
    print("AI Assistant initialization failed. App will run without voice features.")

# SMS Gateway Configuration
class SMSGateway:
    def __init__(self):
        # Twilio configuration
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.twilio_number = os.getenv('TWILIO_PHONE_NUMBER', '')
        
        # Fast2SMS Configuration (Free for India)
        self.fast2sms_api_key = os.getenv('FAST2SMS_API_KEY', '')
        self.fast2sms_route = os.getenv('FAST2SMS_ROUTE', 'otp')  # Use 'otp' for free route
        
        # SMS provider preference: 'twilio', 'fast2sms', or 'demo'
        self.sms_provider = os.getenv('SMS_PROVIDER', 'demo')
        
        self.client = None
        
        # Initialize based on provider
        if self.sms_provider == 'twilio' and self.account_sid and self.auth_token and self.twilio_number:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                print("SMS Gateway initialized with Twilio")
            except Exception as e:
                print(f"Failed to initialize SMS Gateway: {e}")
                print("Falling back to demo mode")
                self.sms_provider = 'demo'
        elif self.sms_provider == 'fast2sms' and self.fast2sms_api_key:
            print("SMS Gateway initialized with Fast2SMS")
        else:
            print("SMS Gateway running in demo mode. Configure SMS_PROVIDER, TWILIO or FAST2SMS credentials for real SMS.")

    def send_emergency_sms(self, to_number, message, user_id=None):
        """Send emergency SMS message"""
        if not to_number or not message:
            return {'success': False, 'error': 'Recipient number and message are required'}

        # Log the SMS attempt
        sms_id = self._log_sms_attempt(user_id, to_number, message, 'emergency')
        
        # Try Fast2SMS first if configured
        if self.sms_provider == 'fast2sms' and self.fast2sms_api_key:
            return self._send_via_fast2sms(to_number, message, sms_id)
        
        # Try Twilio if configured
        if self.sms_provider == 'twilio' and self.client:
            return self._send_via_twilio(to_number, message, sms_id)
        
        # Demo mode
        return self._demo_send_sms(to_number, message, sms_id)
    
    def _send_via_fast2sms(self, to_number, message, sms_id):
        """Send SMS via Fast2SMS API (Free for India)"""
        try:
            # Clean phone number
            clean_number = ''.join(filter(lambda x: x.isdigit() or x == '+', to_number))
            
            # Fast2SMS requires 10-digit number without country code for free route
            if clean_number.startswith('+91'):
                phone = clean_number[3:]
            elif len(clean_number) > 10:
                phone = clean_number[-10:]
            else:
                phone = clean_number
            
            url = "https://www.fast2sms.com/dev/wallet-v2"
            
            headers = {
                'authorization': self.fast2sms_api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'sender_id': 'FSTSMS',
                'message': message[:160],  # SMS character limit
                'language': 'english',
                'route': self.fast2sms_route,
                'numbers': phone
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            result = response.json()
            
            if result.get('return'):
                self._update_sms_status(sms_id, 'sent', f'FAST2SMS_{sms_id}')
                return {
                    'success': True,
                    'message_id': f'FAST2SMS_{sms_id}',
                    'status': 'sent',
                    'provider': 'fast2sms',
                    'to': to_number
                }
            else:
                error_msg = result.get('message', 'Fast2SMS error')
                self._update_sms_status(sms_id, 'failed', None, error_msg)
                return {'success': False, 'error': error_msg}
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Fast2SMS request failed: {str(e)}"
            self._update_sms_status(sms_id, 'failed', None, error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f"SMS sending failed: {str(e)}"
            self._update_sms_status(sms_id, 'failed', None, error_msg)
            return {'success': False, 'error': error_msg}
    
    def _send_via_twilio(self, to_number, message, sms_id):
        """Send SMS via Twilio"""
        try:
            # Format phone number for Twilio
            formatted_number = self._format_phone_number(to_number)
            
            # Send SMS via Twilio
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.twilio_number,
                to=formatted_number
            )
            
            # Update SMS log with success
            self._update_sms_status(sms_id, 'sent', twilio_message.sid)
            
            return {
                'success': True,
                'message_id': twilio_message.sid,
                'status': 'sent',
                'provider': 'twilio',
                'to': formatted_number
            }
            
        except TwilioRestException as e:
            error_msg = f"Twilio error: {str(e)}"
            self._update_sms_status(sms_id, 'failed', None, error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f"SMS sending failed: {str(e)}"
            self._update_sms_status(sms_id, 'failed', None, error_msg)
            return {'success': False, 'error': error_msg}
    
    
    def send_bulk_emergency_alert(self, contacts, message, user_id=None):
        """Send emergency SMS to multiple contacts"""
        results = []
        
        for contact in contacts:
            if isinstance(contact, dict):
                phone = contact.get('phone', '')
                name = contact.get('name', 'Unknown')
            else:
                phone = contact
                name = contact
            
            # Personalize message if name is available
            personalized_message = message
            if name and name != 'Unknown':
                personalized_message = f"Emergency Alert for {name}: {message}"
            
            result = self.send_emergency_sms(phone, personalized_message, user_id)
            result['contact'] = name if name != 'Unknown' else phone
            results.append(result)
        
        return results
    
    def get_sms_history(self, user_id, limit=50):
        """Get SMS history for a user"""
        conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT id, recipient_number, message, message_type, status, 
                       twilio_sid, error_message, created_at, sent_at
                FROM sms_logs
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            ''', (user_id, limit))
            
            rows = cursor.fetchall()
            
            sms_history = []
            for row in rows:
                sms_history.append({
                    'id': row[0],
                    'recipient': row[1],
                    'message': row[2],
                    'type': row[3],
                    'status': row[4],
                    'twilio_sid': row[5],
                    'error_message': row[6],
                    'created_at': row[7],
                    'sent_at': row[8]
                })
            
            return sms_history
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return []
        finally:
            conn.close()
    
    def _format_phone_number(self, number):
        """Format phone number for Twilio"""
        # Remove any non-digit characters
        digits = ''.join(filter(str.isdigit, number))
        
        # Add country code if not present (assuming India)
        if not digits.startswith('91') and len(digits) == 10:
            digits = '91' + digits
        
        # Format as +[countrycode][number]
        return '+' + digits
    
    def _log_sms_attempt(self, user_id, to_number, message, message_type):
        """Log SMS attempt to database"""
        conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO sms_logs (user_id, recipient_number, message, message_type, status)
                VALUES (?, ?, ?, ?, 'pending')
            ''', (user_id, to_number, message, message_type))
            
            conn.commit()
            return cursor.lastrowid
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()
    
    def _update_sms_status(self, sms_id, status, twilio_sid=None, error_message=None):
        """Update SMS status in database"""
        if not sms_id:
            return
        
        conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
        cursor = conn.cursor()
        
        try:
            update_fields = ['status = ?']
            update_values = [status]
            
            if twilio_sid:
                update_fields.append('twilio_sid = ?')
                update_values.append(twilio_sid)
            
            if error_message:
                update_fields.append('error_message = ?')
                update_values.append(error_message)
            
            if status == 'sent':
                update_fields.append('sent_at = ?')
                update_values.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            
            update_values.append(sms_id)
            
            cursor.execute(f'''
                UPDATE sms_logs
                SET {', '.join(update_fields)}
                WHERE id = ?
            ''', update_values)
            
            conn.commit()
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            conn.close()
    
    def _demo_send_sms(self, to_number, message, sms_id):
        """Demo mode SMS sending"""
        print(f"DEMO MODE: Would send SMS to {to_number}: {message}")
        
        # Simulate processing delay
        import time
        time.sleep(0.5)
        
        # Update with demo success
        self._update_sms_status(sms_id, 'sent', f'DEMO_{secrets.token_hex(8)}')
        
        return {
            'success': True,
            'message_id': f'DEMO_{secrets.token_hex(8)}',
            'status': 'sent (demo mode)',
            'to': to_number,
            'note': 'This is a demo mode message. Configure Twilio credentials for real SMS sending.'
        }

# Initialize SMS Gateway
sms_gateway = SMSGateway()

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')

@app.route('/landing')
def landing():
    return render_template('landing.html')

@app.route('/login-page')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/signin')
def signin():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('signin.html')

@app.route('/signup')
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('signup.html')

@app.route('/auth-forms')
def auth_forms():
    """Return authentication forms for modal display"""
    return render_template('auth-modal.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '')
    email = data.get('email', '')
    password = data.get('password', '')
    pattern = data.get('pattern')
    phone = data.get('phone', '')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    
    # Validate required fields
    if not username or not email:
        return jsonify({'success': False, 'message': 'Username and email are required!'})
    
    # Validate authentication method
    if not password and not pattern:
        return jsonify({'success': False, 'message': 'Either password or pattern lock is required!'})
    
    # Validate pattern if provided
    if pattern and (not isinstance(pattern, list) or len(pattern) < 4):
        return jsonify({'success': False, 'message': 'Pattern must contain at least 4 dots!'})
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    try:
        # Hash pattern if provided
        pattern_hash = hash_pattern(pattern) if pattern else None
        
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, pattern_hash, phone_number, emergency_contact)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, email, hash_password(password) if password else None, pattern_hash, phone, f"{first_name} {last_name}".strip()))
        conn.commit()
        return jsonify({'success': True, 'message': 'Registration successful! Please log in with your credentials.'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username or email already exists!'})
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required!'})
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    # Try to find user by username or email
    cursor.execute('SELECT id, password_hash, username FROM users WHERE username = ? OR email = ?', (username, username))
    user = cursor.fetchone()
    conn.close()
    
    if user and verify_password(password, user[1]):
        session['user_id'] = user[0]
        session['username'] = user[2]  # Use the stored username
        return jsonify({'success': True, 'message': 'Login successful! Redirecting to dashboard...'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username/email or password!'})

@app.route('/login-pattern', methods=['POST'])
def login_pattern():
    """Login using pattern lock"""
    data = request.get_json()
    username = data.get('username', '')
    pattern = data.get('pattern', [])
    
    if not username or not pattern:
        return jsonify({'success': False, 'message': 'Username and pattern are required!'})
    
    # Validate pattern format
    if not isinstance(pattern, list) or len(pattern) < 4:
        return jsonify({'success': False, 'message': 'Pattern must contain at least 4 dots!'})
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    # Find user by username or email
    cursor.execute('SELECT id, pattern_hash, username FROM users WHERE username = ? OR email = ?', (username, username))
    user = cursor.fetchone()
    conn.close()
    
    if user and user[1] and verify_pattern(pattern, user[1]):
        session['user_id'] = user[0]
        session['username'] = user[2]  # Use the stored username
        return jsonify({'success': True, 'message': 'Pattern login successful! Redirecting to dashboard...'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username/email or pattern!'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('dashboard.html')

@app.route('/api/location', methods=['POST'])
def update_location():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    latitude = data['latitude']
    longitude = data['longitude']
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO location_tracking (user_id, latitude, longitude)
        VALUES (?, ?, ?)
    ''', (session['user_id'], latitude, longitude))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/complaints', methods=['POST'])
def submit_complaint():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    title = data['title']
    description = data['description']
    category = data.get('category', 'general')
    location = data.get('location', '')
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    try:
        # Insert complaint
        cursor.execute('''
            INSERT INTO complaints (user_id, title, description, category)
            VALUES (?, ?, ?, ?)
        ''', (session['user_id'], title, description, category))
        
        # Create a notification for the user
        notification_title = "Complaint Received"
        notification_message = f"Your complaint '{title}' has been successfully submitted."
        cursor.execute('''
            INSERT INTO notifications (user_id, title, message, category)
            VALUES (?, ?, ?, ?)
        ''', (session['user_id'], notification_title, notification_message, 'complaint_status'))
        
        # Generate a recommendation based on the complaint category
        cursor.execute('SELECT title, content FROM emergency_tips WHERE category = ? ORDER BY RANDOM() LIMIT 1', (category,))
        tip = cursor.fetchone()
        
        if not tip:
            # If no specific tip, get a general one
            cursor.execute('SELECT title, content FROM emergency_tips WHERE category = "general" ORDER BY RANDOM() LIMIT 1')
            tip = cursor.fetchone()
            
        if tip:
            recommendation_title = f"Safety Tip: {tip[0]}"
            recommendation_description = tip[1]
            cursor.execute('''
                INSERT INTO recommendations (user_id, title, description, category)
                VALUES (?, ?, ?, ?)
            ''', (session['user_id'], recommendation_title, recommendation_description, 'safety_tip'))
        
        conn.commit()
        
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {e}'}), 500
    finally:
        conn.close()
    
    return jsonify({'success': True, 'message': 'Complaint submitted successfully!'})

@app.route('/api/complaints/history', methods=['GET'])
def get_complaint_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, description, category, status, created_at
        FROM complaints
        WHERE user_id = ?
        ORDER BY created_at DESC
    ''', (session['user_id'],))
    
    complaints = cursor.fetchall()
    conn.close()
    
    complaint_list = []
    for complaint in complaints:
        complaint_list.append({
            'id': complaint[0],
            'title': complaint[1],
            'description': complaint[2],
            'category': complaint[3],
            'status': complaint[4],
            'created_at': complaint[5]
        })
    
    return jsonify(complaint_list)

@app.route('/api/shelters')
def get_shelters():
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM safe_shelters')
    shelters = cursor.fetchall()
    conn.close()
    
    shelter_list = []
    for shelter in shelters:
        shelter_list.append({
            'id': shelter[0],
            'name': shelter[1],
            'address': shelter[2],
            'latitude': shelter[3],
            'longitude': shelter[4],
            'phone': shelter[5],
            'capacity': shelter[6],
            'facilities': shelter[7],
            'rating': shelter[8]
        })
    
    return jsonify(shelter_list)

@app.route('/api/tips')
def get_tips():
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM emergency_tips ORDER BY created_at DESC')
    tips = cursor.fetchall()
    conn.close()
    
    tip_list = []
    for tip in tips:
        tip_list.append({
            'id': tip[0],
            'title': tip[1],
            'content': tip[2],
            'category': tip[3]
        })
    
    return jsonify(tip_list)

@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant_endpoint():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    command = data.get('command', '')
    
    # Use the enhanced AI assistant to process the command
    if ai_assistant:
        result = ai_assistant.process_command(command)
        if isinstance(result, dict):
            return jsonify({
                'response': result['message'],
                'type': result['type'],
                'action': result.get('action')
            })
        else:
            return jsonify({'response': result, 'type': 'info', 'action': None})
    else:
        # Fallback for when AI assistant is not available
        command_lower = command.lower()
        if any(word in command_lower for word in ['emergency', 'help', 'danger']):
            return jsonify({'response': '🚨 Emergency activated! Sharing location and calling emergency contacts.', 'type': 'emergency', 'action': 'emergencyAlert()'})
        elif 'location' in command_lower:
            return jsonify({'response': '📍 Location sharing activated with trusted contacts.', 'type': 'location', 'action': 'startLocationTracking()'})
        elif 'fake call' in command_lower:
            return jsonify({'response': '📞 Fake call will be initiated in 10 seconds.', 'type': 'fake_call', 'action': 'initiateFakeCall()'})
        elif 'siren' in command_lower:
            return jsonify({'response': '🔊 Siren alarm activated to alert nearby people.', 'type': 'siren', 'action': 'activateSiren()'})
        elif 'shelter' in command_lower or 'safe place' in command_lower:
            return jsonify({'response': '🏠 Finding nearest safe shelters...', 'type': 'shelter', 'action': 'showSection("shelters")'})
        else:
            return jsonify({'response': "🛡️ I'm here to help with safety and emergency assistance.\n\nYou can ask me about:\n• Emergency procedures\n• Safety tips\n• Location tracking\n• Safe shelters\n• Filing complaints\n• And more!", 'type': 'info', 'action': None})

@app.route('/api/siren', methods=['POST'])
def activate_siren():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # This would trigger audio alert and potentially notify authorities
    return jsonify({'success': True, 'message': 'Siren activated!'})

@app.route('/api/fake-call', methods=['POST'])
def fake_call():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({'success': True, 'message': 'Fake call initiated! You will receive a call in 10 seconds.'})

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    read_filter = request.args.get('read')

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    query = 'SELECT id, title, description, category, created_at, read FROM recommendations WHERE user_id = ?'
    params = (session['user_id'],)

    if read_filter is not None:
        query += ' AND read = ?'
        params += (read_filter.lower() in ['true', '1'],)

    query += ' ORDER BY created_at DESC'

    cursor.execute(query, params)
    recommendations = cursor.fetchall()
    conn.close()

    recommendation_list = []
    for row in recommendations:
        recommendation_list.append({
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'category': row[3],
            'created_at': row[4],
            'read': row[5]
        })

    return jsonify(recommendation_list)

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    read_filter = request.args.get('read')
    priority_filter = request.args.get('priority')

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    query = 'SELECT id, title, message, category, created_at, read, priority FROM notifications WHERE user_id = ?'
    params = (session['user_id'],)

    if read_filter is not None:
        query += ' AND read = ?'
        params += (read_filter.lower() in ['true', '1'],)

    if priority_filter is not None:
        query += ' AND priority = ?'
        params += (priority_filter,)

    query += ' ORDER BY CASE priority WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, created_at DESC'

    cursor.execute(query, params)
    notifications = cursor.fetchall()
    conn.close()

    notification_list = []
    for row in notifications:
        notification_list.append({
            'id': row[0],
            'title': row[1],
            'message': row[2],
            'category': row[3],
            'created_at': row[4],
            'read': row[5],
            'priority': row[6]
        })

    return jsonify(notification_list)

@app.route('/api/track-behavior', methods=['POST'])
def track_user_behavior():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    action_type = data.get('action_type')
    action_details = data.get('action_details', '')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    device_info = data.get('device_info', 'web')

    if not action_type:
        return jsonify({'success': False, 'message': 'Action type is required'}), 400

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO user_behavior (user_id, action_type, action_details,
                                     location_latitude, location_longitude, device_info)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session['user_id'], action_type, action_details, latitude, longitude, device_info))
        conn.commit()

        # Update last active time in user preferences
        cursor.execute('''
            INSERT OR IGNORE INTO user_preferences (user_id, last_active)
            VALUES (?, ?)
        ''', (session['user_id'], datetime.now().isoformat()))

        cursor.execute('''
            UPDATE user_preferences
            SET last_active = ?
            WHERE user_id = ?
        ''', (datetime.now().isoformat(), session['user_id']))
        conn.commit()

        return jsonify({'success': True, 'message': 'Behavior tracked successfully'})

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {e}'}), 500
    finally:
        conn.close()

@app.route('/api/behavior-patterns', methods=['GET'])
def get_behavior_patterns():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    try:
        # Get recent behavior data
        cursor.execute('''
            SELECT action_type, action_details, timestamp
            FROM user_behavior
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 50
        ''', (session['user_id'],))

        behavior_data = cursor.fetchall()
        
        # Convert to list of dicts
        behavior_list = []
        for row in behavior_data:
            behavior_list.append({
                'action_type': row[0],
                'action_details': row[1],
                'timestamp': row[2]
            })

        # Analyze patterns
        if behavior_analyzer:
            patterns = behavior_analyzer.analyze_behavior(session['user_id'], behavior_list)
            
            # Store patterns in database
            for pattern in patterns:
                cursor.execute('''
                    INSERT OR REPLACE INTO user_behavior_patterns
                    (user_id, pattern_type, pattern_data, confidence_score, last_updated)
                    VALUES (?, ?, ?, ?, ?)
                ''', (session['user_id'], pattern['type'], json.dumps(pattern), pattern['confidence'], datetime.now().isoformat()))
            
            conn.commit()
            
            return jsonify({'success': True, 'patterns': patterns})
        else:
            return jsonify({'success': False, 'message': 'Behavior analyzer not available'}), 500

    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': f'Database error: {e}'}), 500
    finally:
        conn.close()

@app.route('/api/personalized-recommendations', methods=['GET'])
def get_personalized_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    try:
        # Get existing patterns
        cursor.execute('''
            SELECT pattern_type, pattern_data, confidence_score
            FROM user_behavior_patterns
            WHERE user_id = ?
        ''', (session['user_id'],))

        pattern_rows = cursor.fetchall()
        
        patterns = []
        for row in pattern_rows:
            patterns.append({
                'type': row[0],
                'data': json.loads(row[1]) if row[1] else {},
                'confidence': row[2]
            })

        # Generate recommendations
        if behavior_analyzer:
            recommendations = behavior_analyzer.generate_recommendations(session['user_id'], patterns)
            
            # Store recommendations in database
            for rec in recommendations:
                cursor.execute('''
                    INSERT INTO recommendations
                    (user_id, title, description, category, read)
                    VALUES (?, ?, ?, ?, ?)
                ''', (session['user_id'], rec['title'], rec['description'], rec['category'], False))
            
            conn.commit()
            
            return jsonify({'success': True, 'recommendations': recommendations})
        else:
            return jsonify({'success': False, 'message': 'Behavior analyzer not available'}), 500

    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': f'Database error: {e}'}), 500
    finally:
        conn.close()

@app.route('/api/smart-notifications', methods=['GET'])
def get_smart_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()

    try:
        # Get existing patterns
        cursor.execute('''
            SELECT pattern_type, pattern_data, confidence_score
            FROM user_behavior_patterns
            WHERE user_id = ?
        ''', (session['user_id'],))

        pattern_rows = cursor.fetchall()
        
        patterns = []
        for row in pattern_rows:
            patterns.append({
                'type': row[0],
                'data': json.loads(row[1]) if row[1] else {},
                'confidence': row[2]
            })

        # Generate smart notifications
        if behavior_analyzer:
            notifications = behavior_analyzer.generate_smart_notifications(session['user_id'], patterns)
            
            # Store notifications in database
            for notif in notifications:
                cursor.execute('''
                    INSERT INTO notifications
                    (user_id, title, message, category, priority, read)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (session['user_id'], notif['title'], notif['message'], notif['category'], notif['priority'], False))
            
            conn.commit()
            
            return jsonify({'success': True, 'notifications': notifications})
        else:
            return jsonify({'success': False, 'message': 'Behavior analyzer not available'}), 500

    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': f'Database error: {e}'}), 500
    finally:
        conn.close()

# SMS Gateway API Routes
@app.route('/api/sms/send', methods=['POST'])
def send_sms():
    """Send SMS to specified recipients"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    recipients = data.get('recipients', [])
    message = data.get('message', '')
    
    if not recipients or not message:
        return jsonify({'success': False, 'error': 'Recipients and message are required'})
    
    # Initialize SMS gateway
    sms_gateway = SMSGateway()
    
    results = []
    for recipient in recipients:
        result = sms_gateway.send_emergency_sms(recipient, message, session['user_id'])
        results.append({
            'recipient': recipient,
            'success': result['success'],
            'message': result.get('message', '')
        })
    
    successful_sends = sum(1 for r in results if r['success'])
    
    return jsonify({
        'success': successful_sends > 0,
        'message': f'SMS sent to {successful_sends} of {len(recipients)} recipients',
        'results': results
    })

@app.route('/api/sms/emergency-help', methods=['POST'])
def send_emergency_help():
    """Send emergency help request to all contacts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    # Get user's emergency contacts
    cursor.execute('SELECT phone_number, emergency_contact FROM users WHERE id = ?', (session['user_id'],))
    user = cursor.fetchone()
    
    contacts = []
    if user and user[0]:
        contacts.append(user[0])
    
    # Add default emergency numbers
    contacts.extend(['100', '1091', '108'])
    
    conn.close()
    
    # Initialize SMS gateway
    sms_gateway = SMSGateway()
    
    message = f"EMERGENCY HELP REQUEST! User needs immediate assistance. Location: Last known location available. Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    results = []
    for contact in contacts:
        result = sms_gateway.send_emergency_sms(contact, message, session['user_id'])
        results.append({
            'recipient': contact,
            'success': result['success'],
            'message': result.get('message', '')
        })
    
    successful_sends = sum(1 for r in results if r['success'])
    
    return jsonify({
        'success': successful_sends > 0,
        'message': f'Emergency help request sent to {successful_sends} contacts',
        'results': results
    })

@app.route('/api/sms/send-emergency', methods=['POST'])
def send_emergency_sms():
    """Send emergency SMS to specified contacts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    contacts = data.get('contacts', [])
    message = data.get('message', '')
    custom_message = data.get('custom_message', '')
    
    if not contacts:
        return jsonify({'success': False, 'error': 'No contacts specified'})
    
    # Use custom message if provided, otherwise use default emergency message
    final_message = custom_message if custom_message else message
    if not final_message:
        final_message = f"🚨 EMERGENCY ALERT! This is an automated emergency message from SafeGuard. I need immediate help. My last known location is being tracked. Please contact emergency services if needed."
    
    # Get user's emergency contacts if none specified
    if not contacts:
        conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
        cursor = conn.cursor()
        cursor.execute('SELECT phone_number, emergency_contact FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        conn.close()
        
        if user and user[0]:
            contacts = [{'phone': user[0], 'name': user[1] or 'Emergency Contact'}]
        else:
            return jsonify({'success': False, 'error': 'No emergency contacts configured'})
    
    # Send SMS to all contacts
    results = sms_gateway.send_bulk_emergency_alert(contacts, final_message, session['user_id'])
    
    # Log the emergency action
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_behavior (user_id, action_type, action_details)
        VALUES (?, ?, ?)
    ''', (session['user_id'], 'emergency_sms_sent', f"Emergency SMS sent to {len(contacts)} contacts"))
    conn.commit()
    conn.close()
    
    # Count successful sends
    successful_sends = sum(1 for result in results if result['success'])
    
    return jsonify({
        'success': True,
        'message': f'Emergency SMS sent to {successful_sends} of {len(contacts)} contacts',
        'results': results,
        'total_contacts': len(contacts),
        'successful_sends': successful_sends
    })

@app.route('/api/sms/send-custom', methods=['POST'])
def send_custom_sms():
    """Send custom SMS message"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    recipient = data.get('recipient', '')
    message = data.get('message', '')
    
    if not recipient or not message:
        return jsonify({'success': False, 'error': 'Recipient and message are required'})
    
    # Send the SMS
    result = sms_gateway.send_emergency_sms(recipient, message, session['user_id'])
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'SMS sent successfully',
            'result': result
        })
    else:
        return jsonify({
            'success': False,
            'error': result['error']
        })

@app.route('/api/sms/history', methods=['GET'])
def get_sms_history():
    """Get SMS sending history for the user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    limit = request.args.get('limit', 50, type=int)
    history = sms_gateway.get_sms_history(session['user_id'], limit)
    
    return jsonify({
        'success': True,
        'history': history,
        'total_count': len(history)
    })

@app.route('/api/sms/test', methods=['POST'])
def test_sms_gateway():
    """Test SMS gateway functionality"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    test_number = data.get('test_number', '')
    
    if not test_number:
        return jsonify({'success': False, 'error': 'Test phone number is required'})
    
    test_message = f"Test message from SafeGuard SMS Gateway. This is a test to verify SMS functionality. Sent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    result = sms_gateway.send_emergency_sms(test_number, test_message, session['user_id'])
    
    return jsonify({
        'success': result['success'],
        'message': 'Test SMS sent successfully' if result['success'] else f'Test failed: {result.get("error", "Unknown error")}',
        'result': result
    })

@app.route('/api/emergency-contacts', methods=['GET'])
def get_emergency_contacts_simple():
    """Get user's emergency contacts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    cursor.execute('SELECT phone_number, emergency_contact FROM users WHERE id = ?', (session['user_id'],))
    user = cursor.fetchone()
    conn.close()
    
    contacts = []
    if user and user[0]:
        contacts.append({
            'phone': user[0],
            'name': user[1] or 'Emergency Contact',
            'type': 'primary'
        })
    
    # Add default emergency numbers
    default_contacts = [
        {'phone': '100', 'name': 'Police Emergency', 'type': 'emergency'},
        {'phone': '1091', 'name': 'Women Helpline', 'type': 'emergency'},
        {'phone': '108', 'name': 'Ambulance', 'type': 'emergency'}
    ]
    
    return jsonify({
        'success': True,
        'contacts': contacts + default_contacts
    })

@app.route('/api/sms/emergency-contacts', methods=['GET'])
def get_emergency_contacts():
    """Get user's emergency contacts for SMS"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    cursor.execute('SELECT phone_number, emergency_contact FROM users WHERE id = ?', (session['user_id'],))
    user = cursor.fetchone()
    conn.close()
    
    contacts = []
    if user and user[0]:
        contacts.append({
            'phone': user[0],
            'name': user[1] or 'Emergency Contact',
            'type': 'primary'
        })
    
    # Add default emergency numbers
    default_contacts = [
        {'phone': '100', 'name': 'Police Emergency', 'type': 'emergency'},
        {'phone': '1091', 'name': 'Women Helpline', 'type': 'emergency'},
        {'phone': '108', 'name': 'Ambulance', 'type': 'emergency'}
    ]
    
    return jsonify({
        'success': True,
        'contacts': contacts,
        'default_emergency_contacts': default_contacts
    })

@app.route('/api/sms/update-contacts', methods=['POST'])
def update_emergency_contacts():
    """Update user's emergency contacts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    phone_number = data.get('phone_number', '')
    emergency_contact_name = data.get('emergency_contact_name', '')
    
    if not phone_number:
        return jsonify({'success': False, 'error': 'Phone number is required'})
    
    conn = sqlite3.connect(app.config.get('DATABASE', 'security_system.db'))
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE users 
            SET phone_number = ?, emergency_contact = ?
            WHERE id = ?
        ''', (phone_number, emergency_contact_name, session['user_id']))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Emergency contacts updated successfully'
        })
        
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'error': f'Database error: {e}'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)