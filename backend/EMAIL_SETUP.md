# Email Configuration Guide

## Overview

The booking system sends automated confirmation emails when bookings are created or confirmed. This guide explains how to configure email functionality.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

The `nodemailer` package is already included in `package.json`.

### 2. Configure Email Settings

Add the following to your `backend/.env` file:

```env
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Test Email Configuration

```bash
npm run test-email
```

## Email Service Options

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Hotel Booking System"
   - Copy the 16-character password
3. **Update `.env`**:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Option 3: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com
2. **Create API Key** in SendGrid dashboard
3. **Update `.env`**:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Option 4: Mailgun

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Option 5: AWS SES

```env
EMAIL_ENABLED=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_ENABLED` | Enable/disable email service | `false` | No |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes (if enabled) |
| `SMTP_PORT` | SMTP server port | `587` | Yes (if enabled) |
| `SMTP_SECURE` | Use TLS/SSL | `false` | No |
| `SMTP_USER` | SMTP username/email | - | Yes (if enabled) |
| `SMTP_PASS` | SMTP password/app password | - | Yes (if enabled) |

## Testing

### Test Email Configuration

```bash
cd backend
npm run test-email
```

This will:
1. Verify SMTP configuration
2. Test connection to email server
3. Send a test booking confirmation email

### Test in Application

1. Create a booking through the website
2. Check the email inbox of the registered user
3. Verify the confirmation email is received

## Email Templates

The system uses HTML email templates with:
- Professional design matching the website
- Booking details (reference, dates, room, price)
- Important information (check-in/out times)
- Contact information
- Plain text fallback

Templates are located in: `backend/services/emailService.js`

## Troubleshooting

### "Email service is disabled"
- Set `EMAIL_ENABLED=true` in `.env`

### "SMTP credentials not configured"
- Add `SMTP_USER` and `SMTP_PASS` to `.env`

### "Invalid login" (Gmail)
- Use an App Password, not your regular password
- Make sure 2FA is enabled

### "Connection timeout"
- Check firewall settings
- Verify SMTP host and port
- Try different SMTP service

### Emails not sending
- Check server logs for errors
- Verify email address is valid
- Check spam/junk folder
- Test with `npm run test-email`

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Set up SPF/DKIM records** for your domain
3. **Monitor email delivery rates**
4. **Set up bounce handling**
5. **Use environment-specific configurations**

## Security Notes

- Never commit `.env` file with real credentials
- Use App Passwords for Gmail (not regular passwords)
- Rotate email credentials regularly
- Use environment variables, not hardcoded values


