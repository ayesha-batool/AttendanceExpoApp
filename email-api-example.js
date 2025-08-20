// Example Email API Endpoint
// You can deploy this to Vercel, Netlify, or any other hosting service

// For Vercel, save this as api/send-email.js
// For Netlify, save this as functions/send-email.js

const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // your email@gmail.com
    pass: process.env.EMAIL_PASSWORD // your app password
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

// Email template
const createEmailTemplate = (code) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .code { font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Police Department Management System</h1>
            <p>Email Verification</p>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with our Police Department Management System. To complete your registration, please enter the verification code below:</p>
            
            <div class="code">${code}</div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This code will expire in 15 minutes</li>
                <li>You can only use this code once</li>
                <li>If you didn't request this code, please ignore this email</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Police Department Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// API handler
async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, code, message } = req.body;

    // Validate required fields
    if (!to || !code) {
      return res.status(400).json({ error: 'Missing required fields: to, code' });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject || 'Email Verification Code',
      html: createEmailTemplate(code),
      text: `Your verification code is: ${code}. This code will expire in 15 minutes.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message
    });
  }
}

// Export for different platforms
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
}

// For Vercel
if (typeof exports !== 'undefined') {
  exports.default = handler;
}

// For Netlify
if (typeof window === 'undefined') {
  exports.handler = handler;
}

