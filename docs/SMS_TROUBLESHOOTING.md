# SMS Gateway Troubleshooting Guide

## Problem Identified
The SMS gateway is not working properly because **Twilio credentials are not configured**.

## Root Cause
The application is running in demo mode because the required environment variables are missing:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` 
- `TWILIO_PHONE_NUMBER`

## Solution Steps

### 1. Install Missing Dependencies
```bash
pip install python-dotenv
```

### 2. Create Environment Configuration
Copy the example file and add your credentials:
```bash
copy .env.example .env
```

Then edit `.env` file with your actual Twilio credentials:
```
TWILIO_ACCOUNT_SID=your_actual_account_sid
TWILIO_AUTH_TOKEN=your_actual_auth_token
TWILIO_PHONE_NUMBER=your_actual_twilio_number
```

### 3. Get Twilio Credentials
1. Sign up at [twilio.com](https://www.twilio.com)
2. Go to Console → Settings → General
3. Copy your Account SID and Auth Token
4. Get a Twilio phone number from Console → Phone Numbers → Manage

### 4. Test the Configuration
Run the application and test SMS functionality:
```bash
python app.py
```
Use the `/api/sms/test` endpoint to verify SMS sending works.

## Common Issues & Fixes

### Issue: "Demo mode" messages only
**Fix**: Ensure all three environment variables are set correctly in `.env` file.

### Issue: Invalid phone number format
**Fix**: Phone numbers should be in E.164 format (e.g., +1234567890)

### Issue: Twilio authentication error
**Fix**: Verify your Account SID and Auth Token are correct and haven't expired

### Issue: Insufficient balance
**Fix**: Check your Twilio account has sufficient credits

### Issue: Phone number not verified
**Fix**: For trial accounts, verify recipient phone numbers in Twilio Console

## Verification
After configuration, check:
1. SMS logs show status 'sent' instead of 'sent (demo mode)'
2. Recipients receive actual SMS messages
3. No authentication errors in logs

## Emergency Fallback
The system includes a demo mode that simulates SMS sending when Twilio is not configured, ensuring the application continues to function for testing purposes.
