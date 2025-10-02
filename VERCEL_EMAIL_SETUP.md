# Vercel Email Configuration Guide

This guide explains how to configure email functionality for the contact form in Vercel.

## Prerequisites

Before configuring Vercel, you need:
1. An email account that supports SMTP
2. App-specific password (for Gmail/Outlook) or SMTP credentials

---

## Step 1: Generate App Password (Gmail/Outlook)

### For Gmail:
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Go to **App Passwords**: https://myaccount.google.com/apppasswords
5. Select "Mail" and "Other (Custom name)"
6. Enter "Petromac Website" as the name
7. Click **Generate**
8. Copy the 16-character password (you'll need this for `SMTP_PASS`)

### For Outlook/Hotmail:
1. Go to account settings
2. Navigate to Security
3. Select **Advanced security options**
4. Under App passwords, select **Create a new app password**
5. Copy the generated password

### For Other Providers:
Check your email provider's documentation for SMTP settings and credentials.

---

## Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables one by one:

### Required Variables:

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `465` | SMTP server port (465 for SSL, 587 for TLS) |
| `SMTP_USER` | `your-email@gmail.com` | Your email address |
| `SMTP_PASS` | `abcd efgh ijkl mnop` | App password (16 chars for Gmail) |
| `CONTACT_FROM_EMAIL` | `your-email@gmail.com` | Email address to send from (usually same as SMTP_USER) |
| `CONTACT_TO_EMAIL` | `recipient@example.com` | Where contact form emails should be sent |

### Common SMTP Configurations:

**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Outlook/Hotmail:**
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
```

**Yahoo:**
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

---

## Step 3: Set Environment Variable Scope

For each variable, you can choose which environments it applies to:
- ✅ **Production** (required)
- ✅ **Preview** (recommended for testing)
- ⬜ **Development** (optional - use local .env file instead)

---

## Step 4: Deploy

After adding all environment variables:
1. Trigger a new deployment (or wait for next push to main/master)
2. The new environment variables will be available in the deployment

---

## Step 5: Test the Contact Form

1. Visit your production site
2. Navigate to the Contact page
3. Fill out and submit the form
4. Check the recipient email address for the message

---

## Troubleshooting

### Error: "Authentication failed"
- Double-check `SMTP_USER` and `SMTP_PASS` are correct
- Ensure you're using an **app password**, not your regular email password
- For Gmail, ensure 2-Step Verification is enabled

### Error: "Connection timeout"
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Try port 587 if 465 doesn't work (and vice versa)
- Check if your hosting provider blocks SMTP ports

### Emails not arriving
- Check spam/junk folder
- Verify `CONTACT_TO_EMAIL` is correct
- Check Vercel function logs for errors

### "Less secure app access" (Gmail)
- This setting is deprecated - use App Passwords instead
- Enable 2-Step Verification and generate an App Password

---

## Security Best Practices

✅ **DO:**
- Use app-specific passwords
- Enable 2-Factor Authentication on your email account
- Keep SMTP credentials private (never commit to Git)
- Use different passwords for development and production

❌ **DON'T:**
- Use your regular email password
- Commit .env files to version control
- Share SMTP credentials
- Use personal email for production (consider a dedicated account)

---

## Alternative: SendGrid/Mailgun

If you prefer a dedicated email service:
1. Sign up for SendGrid (free tier: 100 emails/day) or Mailgun
2. Get API credentials
3. Update `src/app/contact/actions.ts` to use their API
4. Set API credentials as environment variables in Vercel

---

## Contact Form Features

The current implementation includes:
- ✅ Honeypot spam protection (invisible company field)
- ✅ Timing check (minimum 3 seconds to fill form)
- ✅ Form validation with Zod
- ✅ Graceful error handling
- ✅ HTML and plain text email formats
- ✅ Reply-to header set to user's email

---

## Questions?

If you encounter issues, check:
1. Vercel deployment logs: Project → Deployments → [latest] → Functions
2. Email provider's SMTP documentation
3. Vercel environment variables are set correctly
