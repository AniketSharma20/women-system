import unittest
import json
from app import app, init_db
import os
import tempfile

class FeaturesTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.config['TESTING'] = True
        self.app = app.test_client()

        with app.app_context():
            init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def register_and_login(self, username, password, email):
        """Helper function to register and log in a user"""
        self.app.post('/register', data=json.dumps(dict(
            username=username,
            password=password,
            email=email
        )), content_type='application/json')
        return self.app.post('/login', data=json.dumps(dict(
            username=username,
            password=password
        )), content_type='application/json')

    def test_get_recommendations_unauthorized(self):
        """Test that recommendations endpoint requires login."""
        response = self.app.get('/api/recommendations')
        self.assertEqual(response.status_code, 401)

    def test_get_notifications_unauthorized(self):
        """Test that notifications endpoint requires login."""
        response = self.app.get('/api/notifications')
        self.assertEqual(response.status_code, 401)

    def test_submit_complaint_generates_notification_and_recommendation(self):
        """Test that submitting a complaint generates a notification and a recommendation."""
        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = 1
            
            # Submit a complaint
            response = c.post('/api/complaints', data=json.dumps({
                'title': 'Test Complaint',
                'description': 'This is a test complaint.',
                'category': 'safety'
            }), content_type='application/json')
            self.assertEqual(response.status_code, 200)

            # Check for notification
            response = c.get('/api/notifications')
            self.assertEqual(response.status_code, 200)
            notifications = json.loads(response.data)
            self.assertEqual(len(notifications), 1)
            self.assertEqual(notifications[0]['title'], 'Complaint Received')

            # Check for recommendation
            response = c.get('/api/recommendations')
            self.assertEqual(response.status_code, 200)
            recommendations = json.loads(response.data)
            self.assertEqual(len(recommendations), 1)
            self.assertTrue(recommendations[0]['title'].startswith('Safety Tip:'))
            self.assertIn(recommendations[0]['description'], [
                'Always be aware of your surroundings. Avoid isolated areas especially at night.',
                'Trust Your Instincts', 'If something feels wrong, trust your gut feeling and remove yourself from the situation.',
                'Use Well-lit Routes', 'Always choose well-lit, busy routes when traveling alone.',
                'Share Your Location', 'Always share your live location with trusted contacts when going out.',
                'Emergency Numbers', 'Keep emergency numbers saved and easily accessible on your phone.'
            ])

if __name__ == '__main__':
    unittest.main()
