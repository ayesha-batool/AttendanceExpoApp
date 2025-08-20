# Real Email Setup Guide

This guide will help you set up real email sending so verification codes are actually delivered to Gmail accounts.

## 🚨 Current Issue

The verification system is currently only **simulating** email sending. Users are not receiving actual emails with verification codes.

## 🎯 Solution Options

### Option 1: Appwrite Functions (Recommended)

**Pros:** Integrated with your existing Appwrite setup, secure, scalable
**Cons:** Requires setting up a Cloud Function

#### Setup Steps:

1. **Create Appwrite Cloud Function:**
   ```bash
   # In your Appwrite console:
   # 1. Go to Functions
   # 2. Create Function
   # 3. Choose Node.js runtime
   # 4. Name it: "send-verification-email"
   ```

2. **Function Code:**
   ```javascript
   const nodemailer = require('nodemailer');

   module.exports = async ({ req, res, log, error }) => {
     try {
       const { email, code, subject, message } = JSON.parse(req.body);

       // Email configuration
       const transporter = nodemailer.createTransporter({
         service: 'gmail',
         auth: {
           user: process.env.EMAIL_USER,
           pass: process.env.EMAIL_PASSWORD
         }
       });

       const mailOptions = {
         from: process.env.EMAIL_USER,
         to: email,
         subject: subject || 'Email Verification Code',
         html: `
           <h2>Email Verification</h2>
           <p>Your verification code is: <strong>${code}</strong></p>
           <p>This code will expire in 15 minutes.</p>
         `
       };

       await transporter.sendMail(mailOptions);

       return res.json({
         success: true,
         message: 'Email sent successfully'
       });

     } catch (err) {
       error(err);
       return res.json({
         success: false,
         error: err.message
       }, 500);
     }
   };
   ```

3. **Set Environment Variables in Appwrite:**
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Update your .env file:**
   ```
   EXPO_PUBLIC_EMAIL_FUNCTION_ID=your-function-id
   ```

### Option 2: Custom Email API (Alternative)

**Pros:** Full control, can use any email service
**Cons:** Requires hosting an API endpoint

#### Setup Steps:

1. **Deploy the email API:**
   - Use the `email-api-example.js` file provided
   - Deploy to Vercel, Netlify, or any hosting service

2. **Set up Gmail App Password:**
   ```
   1. Go to Google Account settings
   2. Security > 2-Step Verification > App passwords
   3. Generate a new app password
   4. Use this password in your API
   ```

3. **Update your .env file:**
   ```
   EXPO_PUBLIC_EMAIL_API_URL=https://your-api-url.com/api/send-email
   ```

### Option 3: Third-party Email Services

#### SendGrid Setup:
```javascript
// In your email service
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'your-verified-sender@yourdomain.com',
  subject: 'Email Verification Code',
  text: `Your verification code is: ${code}`,
  html: `<h2>Verification Code: ${code}</h2>`
};

await sgMail.send(msg);
```

#### Mailgun Setup:
```javascript
// In your email service
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});

await mg.messages.create('your-domain.com', {
  from: 'noreply@yourdomain.com',
  to: email,
  subject: 'Email Verification Code',
  text: `Your verification code is: ${code}`
});
```

## 🔧 Quick Setup for Testing

### For Immediate Testing (Development Mode):

The system now includes a development mode that will:
1. Show the verification code in console logs
2. Display an alert with the code (in development)
3. Log the email content

**To test right now:**
1. Register a new user
2. Check the console logs for the verification code
3. You'll see an alert with the code
4. Enter the code in the verification modal

### Environment Variables Setup:

Add these to your `.env` file:

```bash
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Email Configuration (choose one option)
# Option 1: Appwrite Function
EXPO_PUBLIC_EMAIL_FUNCTION_ID=your-function-id

# Option 2: Custom API
EXPO_PUBLIC_EMAIL_API_URL=https://your-api-url.com/api/send-email

# Option 3: Third-party service
EXPO_PUBLIC_SENDGRID_API_KEY=your-sendgrid-key
```

## 📧 Gmail Setup for Sending Emails

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Security > 2-Step Verification > Turn on

### Step 2: Generate App Password
1. Security > 2-Step Verification > App passwords
2. Select "Mail" and your device
3. Generate password
4. Copy the 16-character password

### Step 3: Use App Password
- Use your Gmail address as `EMAIL_USER`
- Use the generated app password as `EMAIL_PASSWORD`

## 🧪 Testing the Email System

### Test Function:
```javascript
// Add this to your test page or use in console
import { verificationService } from '@/services/verificationService';

// Test email sending
const testResult = await verificationService.testEmailService('your-email@gmail.com');
console.log('Email test result:', testResult);
```

### Manual Testing:
1. Register with a real Gmail address
2. Check your Gmail inbox (and spam folder)
3. Enter the verification code
4. Verify the user is created successfully

## 🚀 Production Deployment

### For Production:

1. **Use a professional email service:**
   - SendGrid (recommended)
   - Mailgun
   - AWS SES
   - Appwrite Functions with proper email service

2. **Set up proper domain verification:**
   - Verify your domain with the email service
   - Use a professional "from" address

3. **Monitor email delivery:**
   - Set up email delivery tracking
   - Monitor bounce rates
   - Handle email failures gracefully

## 🔍 Troubleshooting

### Common Issues:

1. **Emails not sending:**
   - Check environment variables
   - Verify email service credentials
   - Check console logs for errors

2. **Gmail blocking emails:**
   - Use app passwords, not regular passwords
   - Verify your domain
   - Check spam folder

3. **Function not working:**
   - Check Appwrite Function logs
   - Verify function ID in environment variables
   - Test function manually in Appwrite console

### Debug Commands:

```javascript
// Test email service
await verificationService.testEmailService('test@example.com');

// Check verification status
const status = await verificationService.getVerificationStatus('user@example.com');
console.log('Verification status:', status);

// Clear all data (for testing)
await verificationService.clearAllVerificationData();
```

## 📱 Current Development Mode

Until you set up real email sending, the system will:

1. **Show verification codes in console:**
   ```
   📧 Sending verification email to: user@gmail.com
   🔑 Verification code: 123456
   ```

2. **Display alert in development:**
   - Shows the verification code in an alert
   - Only works in development mode (`__DEV__`)

3. **Log email content:**
   - Shows what the email would contain
   - Helps with debugging

## ✅ Next Steps

1. **Choose an email solution** (Appwrite Functions recommended)
2. **Set up the email service** following the guide above
3. **Test with a real Gmail address**
4. **Deploy to production** with proper email service

The system is now ready to send real emails once you complete the setup!

