// Test Email Configuration
// Run: node scripts/test-email.js

require('dotenv').config();
const { verifyEmailConfig, sendBookingConfirmation } = require('../services/emailService');

async function testEmail() {
  console.log('📧 Testing Email Configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  const resolvedHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'not set';
  const resolvedPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || 'not set';
  const resolvedUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  console.log('  EMAIL_ENABLED:', process.env.EMAIL_ENABLED || 'not set');
  console.log('  SMTP/EMAIL_HOST:', resolvedHost);
  console.log('  SMTP/EMAIL_PORT:', resolvedPort);
  console.log('  SMTP/EMAIL_USER:', resolvedUser ? '***' + resolvedUser.slice(-5) : 'not set');
  console.log('  SMTP/EMAIL_PASS:', (process.env.SMTP_PASS || process.env.EMAIL_PASS) ? '***' : 'not set');
  console.log('');

  // Verify configuration
  const verification = await verifyEmailConfig();
  console.log('Verification Result:');
  console.log('  Verified:', verification.verified);
  console.log('  Message:', verification.message);
  console.log('');

  if (verification.verified) {
    console.log('✅ Email configuration is valid!');
    console.log('');
    console.log('Testing email send...');
    
    // Test email with sample data
    const testBooking = {
      booking_reference: 'HTL-2025-TEST',
      room_name: 'Deluxe King Room',
      check_in: '2026-01-01',
      check_out: '2026-01-03',
      adults: 2,
      children: 0,
      nights: 2,
      total_price: 440.00,
      booking_status: 'confirmed'
    };

    const testUser = {
      email: process.env.SMTP_USER || process.env.EMAIL_USER, // Send to yourself for testing
      first_name: 'Test',
      last_name: 'User'
    };

    const result = await sendBookingConfirmation(testBooking, testUser);
    
    if (result.success && !result.skipped) {
      console.log('✅ Test email sent successfully!');
      console.log('  Message ID:', result.messageId);
      console.log('  Sent to:', result.to);
    } else if (result.skipped) {
      console.log('⚠️  Email sending skipped (EMAIL_ENABLED is not "true")');
    } else {
      console.log('❌ Failed to send test email:', result.error);
    }
  } else {
    console.log('❌ Email configuration is invalid!');
    console.log('');
    console.log('To fix:');
    console.log('1. Set EMAIL_ENABLED=true in .env');
    console.log('2. Configure SMTP settings in .env');
    console.log('3. For Gmail, use an App Password (not your regular password)');
    console.log('   See: https://support.google.com/accounts/answer/185833');
  }
}

testEmail().catch(console.error);


