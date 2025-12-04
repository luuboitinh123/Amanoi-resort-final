// Email Service for Sending Booking Confirmations
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development/testing, use Gmail or another SMTP service
  // For production, use a service like SendGrid, Mailgun, or AWS SES
  // Support both SMTP_* and EMAIL_* env var naming (some docs/use-cases use EMAIL_*)
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
  const secureEnv = (process.env.SMTP_SECURE || process.env.EMAIL_SECURE);
  const secure = secureEnv === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

// Email templates
const emailTemplates = {
  bookingConfirmation: (booking, user) => {
    const checkInDate = new Date(booking.check_in).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const checkOutDate = new Date(booking.check_out).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const defaultCheckInTime = '3:00 PM';
    const defaultCheckOutTime = '11:00 AM';

    return {
      subject: `Booking Confirmation - ${booking.booking_reference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8F9F04; color: #F9EFCC; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background-color: #F9EFCC; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
            .booking-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: bold; color: #8F9F04; }
            .detail-value { color: #333; }
            .highlight { color: #8F9F04; font-weight: bold; font-size: 18px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #8F9F04; color: #F9EFCC; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p style="margin: 0; font-size: 18px;">Thank you for choosing Amanoi</p>
            </div>
            
            <div class="content">
              <p>Dear ${user.first_name} ${user.last_name},</p>
              
              <p>We are pleased to confirm your reservation at Amanoi. Your booking has been successfully processed.</p>
              
              <div class="booking-details">
                <h2 style="color: #8F9F04; margin-top: 0;">Booking Details</h2>
                
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span class="detail-value highlight">${booking.booking_reference}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Room:</span>
                  <span class="detail-value">${booking.room_name || 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Check-in:</span>
                  <span class="detail-value">${checkInDate}<br><small>${defaultCheckInTime}</small></span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Check-out:</span>
                  <span class="detail-value">${checkOutDate}<br><small>${defaultCheckOutTime}</small></span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Guests:</span>
                  <span class="detail-value">${booking.adults} Adult(s), ${booking.children || 0} Child(ren)</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Nights:</span>
                  <span class="detail-value">${booking.nights || 1}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Total Amount:</span>
                  <span class="detail-value highlight">$${parseFloat(booking.total_price || 0).toFixed(2)}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" style="text-transform: capitalize;">${booking.booking_status || 'Confirmed'}</span>
                </div>
              </div>
              
              <h3 style="color: #8F9F04;">Important Information</h3>
              <ul>
                <li>Please arrive at the hotel reception for check-in at <strong>${defaultCheckInTime}</strong></li>
                <li>Check-out time is <strong>${defaultCheckOutTime}</strong></li>
                <li>Please bring a valid ID and the credit card used for booking (if applicable)</li>
                <li>If you need to modify or cancel your booking, please contact us at least 24 hours before check-in</li>
              </ul>
              
              <h3 style="color: #8F9F04;">Need Help?</h3>
              <p>
                <strong>Phone:</strong> +84 931055975<br>
                <strong>Email:</strong> amanoi@aman.com<br>
                <strong>Address:</strong> Vinh Hy Village, Vinh Hai Commune, Khanh Hoa Province, Vietnam
              </p>
              
              <p>We look forward to welcoming you to Amanoi!</p>
              
              <p>Best regards,<br>
              <strong>The Amanoi Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p>&copy; 2025 Amanoi. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Booking Confirmation - ${booking.booking_reference}

Dear ${user.first_name} ${user.last_name},

We are pleased to confirm your reservation at Amanoi.

BOOKING DETAILS:
- Booking Reference: ${booking.booking_reference}
- Room: ${booking.room_name || 'N/A'}
- Check-in: ${checkInDate} at ${defaultCheckInTime}
- Check-out: ${checkOutDate} at ${defaultCheckOutTime}
- Guests: ${booking.adults} Adult(s), ${booking.children || 0} Child(ren)
- Nights: ${booking.nights || 1}
- Total Amount: $${parseFloat(booking.total_price || 0).toFixed(2)}
- Status: ${booking.booking_status || 'Confirmed'}

IMPORTANT INFORMATION:
- Please arrive at the hotel reception for check-in at ${defaultCheckInTime}
- Check-out time is ${defaultCheckOutTime}
- Please bring a valid ID and the credit card used for booking (if applicable)

Need Help?
Phone: +84 931055975
Email: amanoi@aman.com

We look forward to welcoming you to Amanoi!

Best regards,
The Amanoi Team
      `
    };
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, user) => {
  try {
    // Check if email is enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email service is disabled. Skipping email send.');
      return { success: true, skipped: true };
    }

    // Check if SMTP/EMAIL credentials are configured (support both naming schemes)
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (!smtpUser || !smtpPass) {
      console.warn('SMTP/EMAIL credentials not configured. Email will not be sent.');
      return { success: false, error: 'SMTP not configured' };
    }

    const transporter = createTransporter();
    const emailContent = emailTemplates.bookingConfirmation(booking, user);

    const mailOptions = {
      from: `"Amanoi" <${smtpUser}>`,
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      to: user.email 
    };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // Don't throw error - booking is already created, email failure shouldn't break the flow
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    if (process.env.EMAIL_ENABLED !== 'true') {
      return { verified: false, message: 'Email service is disabled' };
    }

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (!smtpUser || !smtpPass) {
      return { verified: false, message: 'SMTP/EMAIL credentials not configured' };
    }

    const transporter = createTransporter();
    await transporter.verify();
    
    return { verified: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { verified: false, message: `Email configuration error: ${error.message}` };
  }
};

module.exports = {
  sendBookingConfirmation,
  verifyEmailConfig
};


