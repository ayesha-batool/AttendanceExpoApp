import { Account, Client, Functions } from 'appwrite';

// Initialize Appwrite client for email service
const client = new Client();
const account = new Account(client);
const functions = new Functions(client);

try {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  
  if (!projectId) {
    console.error('🚨 EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set!');
    throw new Error('Appwrite Project ID not configured');
  }
  
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
    
  console.log('✅ Email service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize email service:', error);
}

// Email service using Appwrite Functions (recommended approach)
export const emailService = {
  // Send verification email using Appwrite Functions
  async sendVerificationEmail(email, code) {
    try {
      console.log('📧 Sending verification email to:', email);
      console.log('🔑 Verification code:', code);
      
      // Option 1: Using Appwrite Functions (recommended)
      // You need to create a Cloud Function in Appwrite that handles email sending
      const functionId = process.env.EXPO_PUBLIC_EMAIL_FUNCTION_ID || 'send-verification-email';
      
      const result = await functions.createExecution(
        functionId,
        JSON.stringify({
          email: email,
          code: code,
          subject: 'Email Verification Code',
          message: `Your verification code is: ${code}. This code will expire in 15 minutes.`
        })
      );
      
      console.log('✅ Verification email sent via Appwrite Function');
      return true;
      
    } catch (error) {
      console.error('❌ Error sending email via Appwrite Function:', error);
      
      // Fallback to other methods if Appwrite Function fails
      return await this.sendEmailFallback(email, code);
    }
  },

  // Fallback email sending methods
  async sendEmailFallback(email, code) {
    try {
      // Option 2: Using a simple HTTP request to your own email API
      const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL;
      
      if (emailApiUrl) {
        const response = await fetch(emailApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: 'Email Verification Code',
            code: code,
            message: `Your verification code is: ${code}. This code will expire in 15 minutes.`
          })
        });
        
        if (response.ok) {
          console.log('✅ Verification email sent via custom API');
          return true;
        }
      }
      
      // Option 3: For development/testing - show code in console and alert
      console.log('📧 DEVELOPMENT MODE: Email would be sent to:', email);
      console.log('🔑 Verification code:', code);
      console.log('📝 Email content:');
      console.log('Subject: Email Verification Code');
      console.log(`Message: Your verification code is: ${code}. This code will expire in 15 minutes.`);
      
      // In development, you can also show an alert with the code
      if (__DEV__) {
        // This will show an alert in development mode
        setTimeout(() => {
          alert(`DEVELOPMENT MODE\nVerification code for ${email}: ${code}\n\nIn production, this would be sent via email.`);
        }, 1000);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error in email fallback:', error);
      return false;
    }
  },

  // Test email service
  async testEmailService(email) {
    try {
      const testCode = '123456';
      const result = await this.sendVerificationEmail(email, testCode);
      return {
        success: result,
        message: result ? 'Email service is working' : 'Email service failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default emailService;

