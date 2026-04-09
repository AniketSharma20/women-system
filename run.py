#!/usr/bin/env python3
"""
Women Security System - Startup Script
This script initializes and runs the women security system application.
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if all required packages are installed."""
    # Only check for essential packages that are required for the app to run
    essential_packages = [
        'flask',
        'flask_cors', 
        'requests'
    ]
    
    # Optional packages for enhanced features (AI assistant)
    optional_packages = [
        'speech_recognition',
        'pyttsx3'
    ]
    
    missing_essential = []
    missing_optional = []
    
    # Check essential packages
    for package in essential_packages:
        try:
            __import__(package)
        except ImportError:
            missing_essential.append(package)
    
    # Check optional packages
    for package in optional_packages:
        try:
            __import__(package)
        except ImportError:
            missing_optional.append(package)
    
    if missing_essential:
        print("Missing essential packages:")
        for package in missing_essential:
            print(f"  - {package}")
        print("\nInstalling missing essential packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_essential)
            print("Essential packages installed successfully!")
        except subprocess.CalledProcessError as e:
            print(f"Error installing packages: {e}")
            print("Please install packages manually: pip install flask flask-cors requests")
            return False
    
    if missing_optional:
        print("Optional packages not available (AI Assistant features will be disabled):")
        for package in missing_optional:
            print(f"  - {package}")
        print("You can install these later for voice features: pip install speech_recognition pyttsx3")
    
    return True

def setup_directories():
    """Create necessary directories if they don't exist."""
    directories = ['templates', 'static']
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")

def main():
    """Main startup function."""
    print("=" * 50)
    print("Women Security System")
    print("=" * 50)
    print("Starting application...")
    
    try:
        # Check requirements
        print("Checking requirements...")
        if not check_requirements():
            print("Failed to install essential packages. Please check your Python/pip installation.")
            sys.exit(1)
        
        # Setup directories
        print("Setting up directories...")
        setup_directories()
        
        # Import and run the app
        print("Starting Flask application...")
        print("Access the application at: http://localhost:5000")
        print("Press Ctrl+C to stop the application")
        print("-" * 50)
        
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\nApplication stopped by user.")
    except Exception as e:
        print(f"Error starting application: {e}")
        print("Please check the error and try again.")
        sys.exit(1)

if __name__ == '__main__':
    main()



    #this is a test comment