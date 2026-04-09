# Women Security System Application

A comprehensive web-based security application designed specifically for women's safety, featuring real-time location tracking, emergency assistance, AI assistance, and various safety features.

## Features

### 🔐 Authentication System
- Secure user registration and login
- Session management
- Password hashing for security

### 📍 Live Location Tracking
- Real-time GPS location sharing
- Interactive maps with Leaflet.js
- Location history tracking
- Emergency location sharing

### 🏠 Safe Night Shelters
- Database of safe shelters with details
- Interactive map showing shelter locations
- Contact information and facilities
- Ratings and capacity information

### 📝 Complaint Box
- Submit safety complaints
- Categorized complaint system
- Status tracking for complaints
- Secure storage in database

### 🚨 Emergency Features
- **Siren System**: Audio alarm with visual indicators
- **Fake Call System**: Simulated emergency calls
- **Emergency Contacts**: Quick access to emergency numbers
- **One-click Emergency Alert**: Share location and activate all features

### 🤖 Personal AI Assistant
- Voice-activated commands
- Natural language processing
- Safety-focused responses
- Integration with emergency features

### 💡 Emergency Tips
- Safety guidelines and tips
- Categorized information
- Easy-to-read format
- Regularly updated content

### 📱 Responsive Design
- Mobile-friendly interface
- Cross-platform compatibility
- Modern, intuitive UI
- Accessibility features

## Technology Stack

### Backend
- **Python Flask**: Web framework
- **SQLite**: Database for data storage
- **SpeechRecognition**: Voice processing
- **pyttsx3**: Text-to-speech functionality

### Frontend
- **HTML5**: Structure and content
- **CSS3**: Styling and responsive design
- **JavaScript**: Client-side functionality
- **Leaflet.js**: Interactive maps
- **Font Awesome**: Icons

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)
- Internet connection for maps and external APIs

### Setup Instructions

1. **Clone or download the project**
   ```bash
   # If you have the project files, navigate to the project directory
   cd women-security-system
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost:5000`
   - Register a new account or login

## Usage Guide

### Getting Started
1. **Registration**: Create a new account with username, email, and password
2. **Login**: Access the dashboard with your credentials
3. **Setup**: Enable location services for full functionality

### Using Security Features

#### Location Tracking
1. Click "Live Location" in the navigation
2. Click "Start Tracking" to begin GPS monitoring
3. View your location on the interactive map
4. Use "Share Location" to send your position to contacts

#### Emergency Features
1. Navigate to the "Emergency" section
2. Use quick buttons for:
   - **Siren**: Activate loud alarm
   - **Fake Call**: Simulate incoming emergency call
   - **Emergency Alert**: Share location with all features

#### Safe Shelters
1. Visit "Safe Shelters" section
2. View available shelters on map and list
3. Click on shelters for detailed information
4. Get directions to nearest shelter

#### AI Assistant
1. Go to "AI Assistant" section
2. Type commands or use voice input
3. Ask about safety procedures, location sharing, or emergency help
4. AI responds with relevant safety information

#### Filing Complaints
1. Use "Complaints" section
2. Fill out the complaint form with details
3. Select appropriate category
4. Submit for review and action

## File Structure

```
women-security-system/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── security_system.db    # SQLite database (created automatically)
├── templates/
│   ├── index.html        # Login/Register page
│   └── dashboard.html    # Main dashboard
└── static/
    ├── style.css         # CSS styles
    ├── script.js         # JavaScript functionality
    └── siren.mp3         # Siren sound file (add your own)
```

## Database Schema

The application creates a SQLite database with the following tables:

- **users**: User account information
- **location_tracking**: GPS location history
- **complaints**: User-submitted complaints
- **safe_shelters**: Safe shelter locations and details
- **emergency_tips**: Safety tips and guidelines

## Security Features

- Password hashing using SHA-256
- Session-based authentication
- CORS protection
- Input validation and sanitization
- Secure API endpoints

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - User logout

### Location Services
- `POST /api/location` - Update user location

### Emergency Features
- `POST /api/siren` - Activate siren
- `POST /api/fake-call` - Initiate fake call
- `POST /api/ai-assistant` - AI assistant commands

### Data Retrieval
- `GET /api/shelters` - Get safe shelters
- `GET /api/tips` - Get safety tips

### Complaints
- `POST /api/complaints` - Submit complaint

## Advanced Features

### Voice Commands
The AI assistant supports voice commands like:
- "Emergency" - Activates emergency features
- "Location sharing" - Starts location tracking
- "Safe place" - Shows nearby shelters
- "Fake call" - Initiates fake call simulation

### Emergency Protocols
- Automatic location sharing during emergencies
- Siren activation with visual indicators
- Emergency contact calling
- Real-time alerts and notifications

### Geolocation Integration
- HTML5 Geolocation API
- Real-time position updates
- Accuracy tracking
- Background location monitoring

## Troubleshooting

### Common Issues

1. **Location not working**
   - Ensure location services are enabled
   - Use HTTPS for geolocation (or localhost)
   - Check browser permissions

2. **Microphone not working**
   - Allow microphone permissions in browser
   - Check system audio settings
   - Ensure microphone is not used by other applications

3. **Database errors**
   - Ensure write permissions in project directory
   - Check SQLite installation
   - Restart the application

4. **Map not loading**
   - Check internet connection
   - Ensure Leaflet.js CDN is accessible
   - Clear browser cache

### Performance Tips
- Use modern browsers for best performance
- Enable location services for accurate tracking
- Close unnecessary browser tabs
- Use WiFi for better location accuracy

## Development

### Adding New Features
1. Modify `app.py` for backend functionality
2. Update templates for new pages
3. Add corresponding CSS and JavaScript
4. Update database schema if needed

### Customization
- Modify colors in `static/style.css`
- Add new emergency contacts in dashboard
- Update shelter database with local information
- Customize AI assistant responses

## License

This project is created for educational and safety purposes. Please ensure compliance with local laws and regulations when deploying.

## Support

For technical support or feature requests, please refer to the documentation or contact the development team.

## Safety Disclaimer

This application is designed to enhance personal safety but should not replace professional emergency services. Always contact local authorities in genuine emergency situations.

---

**Remember: Your safety is the top priority. Use this application responsibly and always trust your instincts.**