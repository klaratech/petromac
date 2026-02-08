# Vercel Email Configuration Guide

This guide explains how to configure email functionality for the Petromac website, including:
- Contact form submissions
- PDF email delivery (Product Catalog & Success Stories)

## Prerequisites

Before configuring Vercel, you need:
1. An email account that supports SMTP (using Office365: info@petromac.co.nz)
2. App-specific password for Office365

---

## Step 1: Generate App Password (Outlook)



### For Office365/Outlook (Petromac Configuration):
1. Go to https://account.microsoft.com/security
2. Navigate to Security → **Advanced security options**
3. Enable 2-Step Verification (if not already enabled)
4. Under **App passwords**, select **Create a new app password**
5. Enter "Petromac Website" as the name
6. Copy the generated password (you'll need this for both contact form and PDF email functionality)

**Note:** If your organization uses Office365 Business, you may need to contact your IT administrator to:
- Enable SMTP authentication for the account
- Generate an app password or provide SMTP credentials


---

## Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables one by one:

### Required Variables:

#### For Contact Form:
| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SMTP_HOST` | `smtp-mail.outlook.com` | Office365 SMTP server |
| `SMTP_PORT` | `587` | SMTP server port (TLS) |
| `SMTP_USER` | `info@petromac.co.nz` | Petromac email address |
| `SMTP_PASS` | `[app-password]` | App password from Office365 |
| `CONTACT_FROM_EMAIL` | `info@petromac.co.nz` | Email address to send from |
| `CONTACT_TO_EMAIL` | `info@petromac.co.nz` | Where contact form emails should be sent |

**Note:** The `SMTP_*` variables are shared by both the contact form and PDF email delivery endpoints. There is no separate `EMAIL_*` configuration.

#### Security Allowlists (Recommended):
| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `ALLOWED_ORIGINS` | `https://www.petromac.com,https://petromac.vercel.app` | Allowed origins/referrers for email endpoints |
| `ALLOWED_EMAIL_DOMAINS` | `petromac.com,petromac.co.nz` | Domains allowed to receive PDFs |
| `ALLOWED_EMAIL_RECIPIENTS` | `info@petromac.co.nz,marketing@petromac.co.nz` | Explicit allowlist of recipient emails |

### Petromac Office365 Configuration:

**Complete Environment Variables Setup:**
```env
# Unified SMTP (used by contact form + PDF email endpoints)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=info@petromac.co.nz
SMTP_PASS=[your-office365-app-password]
CONTACT_FROM_EMAIL=info@petromac.co.nz
CONTACT_TO_EMAIL=info@petromac.co.nz

# Email Endpoint Security
ALLOWED_ORIGINS=https://www.petromac.com,https://petromac.vercel.app
ALLOWED_EMAIL_DOMAINS=petromac.com,petromac.co.nz
ALLOWED_EMAIL_RECIPIENTS=info@petromac.co.nz
```

### Other SMTP Configurations (for reference):

**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
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

## Step 5: Test Email Functionality

### Test Contact Form:
1. Visit your production site
2. Navigate to the Contact page
3. Fill out and submit the form
4. Check info@petromac.co.nz for the message

### Test PDF Email Delivery:
1. Navigate to the Product Catalog page (`/catalog`) or Success Stories page (`/success-stories/flipbook`)
2. Click the green **"Email PDF"** button
3. Enter your email address
4. Click **"Send"**
5. Check your email inbox for the PDF attachment

---

## Verification Checklist (Recommended)
- ✅ `ALLOWED_ORIGINS` is set for your production domain(s)
- ✅ `ALLOWED_EMAIL_DOMAINS` or `ALLOWED_EMAIL_RECIPIENTS` is set (email allowlist)
- ✅ `SMTP_*` and `EMAIL_*` variables are set in Vercel
- ✅ Email endpoints return **clear errors** if allowlists are missing
- ✅ Success Stories PDF endpoint works: `POST /api/pdf/success-stories`

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
3. Update `src/app/(public)/contact/actions.ts` to use their API
4. Set API credentials as environment variables in Vercel

---

## Email Features

### Contact Form Features:
- ✅ Honeypot spam protection (invisible company field)
- ✅ Timing check (minimum 3 seconds to fill form)
- ✅ Form validation with Zod (including input length limits)
- ✅ Rate limiting (3 requests/minute per IP)
- ✅ HTML escaping to prevent XSS in email content
- ✅ HTML and plain text email formats
- ✅ Reply-to header set to user's email

### PDF Email Delivery Features:
- ✅ Email Product Catalog directly to users
- ✅ Email Success Stories document directly to users
- ✅ Professional email template with Petromac branding
- ✅ PDF attachments included automatically
- ✅ Modal interface with email validation
- ✅ Success/error feedback

---

## Questions?

If you encounter issues, check:
1. Vercel deployment logs: Project → Deployments → [latest] → Functions
2. Email provider's SMTP documentation
3. Vercel environment variables are set correctly
