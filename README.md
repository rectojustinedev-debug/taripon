# TARIPON — Setup Guide

TARIPON is a single **TanStack Start (React)** application that uses **Supabase Authentication** with **email and password** only.

Email verification is completed using a **6-digit OTP** sent through **Gmail SMTP** via **Nodemailer**. Google Sign-In and all OAuth providers have been completely removed.

---

# What's Changed

## Removed Google Authentication

Google Sign-In has been removed from the application.

The following changes were made:

- Removed the **Continue with Google** button from `src/routes/auth.tsx`
- Removed all OAuth authentication handlers
- Deleted the `/auth-callback` route
- Removed all homepage references to Google Sign-In
- Removed every call to:

```ts
supabase.auth.signInWithOAuth(...)
```

The application now supports **email/password authentication only**.

---

## Gmail-Based OTP Email Verification

OTP emails are now sent using **Nodemailer** with **Gmail SMTP** instead of the Resend API.

Email flow:

```
User Registration
        │
        ▼
Server creates an unconfirmed Supabase user
        │
        ▼
Generate a 6-digit OTP
        │
        ▼
Send OTP using Gmail SMTP
        │
        ▼
User enters OTP on /verify-email
        │
        ▼
Email verified
```

Mailer implementation:

```
src/lib/mailer.server.ts
```

---

## Unified Application

The project has been merged into a single application.

The previous standalone:

```
otp-service/
```

has been removed.

Its functionality now lives in:

```
src/integrations/supabase/otp-actions.functions.ts
src/lib/otp.server.ts
src/lib/mailer.server.ts
```

---

# 1. Configure Supabase

The project is already configured to use:

```
https://bcunytrpoodnvlktxrxj.supabase.co
```

Open your Supabase project:

https://supabase.com/dashboard/project/bcunytrpoodnvlktxrxj

Navigate to:

```
Project Settings
    → API
```

Copy the following keys into your `.env` file.

| Supabase Key | Environment Variable |
|--------------|----------------------|
| Anon (Public) Key | `SUPABASE_PUBLISHABLE_KEY` |
| Anon (Public) Key | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Service Role Key | `SUPABASE_SERVICE_ROLE_KEY` |

> **Important**
>
> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
> It must remain server-side only.

---

## Run Database Migrations

Inside your Supabase project:

```
SQL Editor
```

Execute every SQL file inside:

```
supabase/migrations/
```

Run them in chronological order (oldest timestamp first).

These migrations create all required database objects, including:

- users
- profiles
- savings
- goals
- otp_codes
- other required tables

---

# 2. Configure Gmail SMTP

OTP emails are sent through Gmail using **Nodemailer**.

Because Gmail no longer allows regular password authentication, you must use an **App Password**.

## Step 1

Enable **2-Step Verification**

https://myaccount.google.com/security

---

## Step 2

Generate an App Password

https://myaccount.google.com/apppasswords

Choose:

```
App:
Mail
```

Copy the generated **16-character App Password**.

---

## Step 3

Update your `.env`

```env
GMAIL_USER=yourgmail@gmail.com

GMAIL_APP_PASSWORD=your-16-character-app-password

OTP_FROM_NAME=TARIPON
```

| Variable | Description |
|----------|-------------|
| `GMAIL_USER` | Gmail account used to send OTP emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your Gmail password) |
| `OTP_FROM_NAME` | Display name shown in outgoing emails |

---

### Gmail Sending Limits

A free Gmail account allows approximately:

- **500 emails/day**

This is sufficient for development and small-scale applications.

For production systems with high email volume, consider using:

- Resend
- SendGrid
- Amazon SES
- Mailgun

---

# 3. Install Dependencies

```bash
npm install
```

---

# 4. Start the Development Server

```bash
npm run dev
```

By default, the application runs at:

```
http://localhost:8080
```

---

# 5. Build for Production

```bash
npm run build
```

This generates a standard Node.js server using:

```
preset: "node-server"
```

---

# 6. Start the Production Server

```bash
node .output/server/index.mjs
```

---

# Required Environment Variables

Your deployment environment must include the following variables:

```env
SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GMAIL_USER=
GMAIL_APP_PASSWORD=
OTP_FROM_NAME=
```

> **Important**
>
> The application will not function correctly without
> `SUPABASE_SERVICE_ROLE_KEY`, as server-side authentication and OTP
> verification depend on it.

---

# Deployment

TARIPON can be deployed to any Node.js-compatible hosting provider, including:

- Railway
- Render
- Fly.io
- DigitalOcean
- VPS
- Azure App Service
- Google Cloud Run
- AWS EC2

Ensure all required environment variables are configured before starting the server.

---

# Authentication Flow

```
Register
    │
    ▼
Create Supabase User (Unconfirmed)
    │
    ▼
Generate 6-Digit OTP
    │
    ▼
Send Email via Gmail SMTP
    │
    ▼
User Enters OTP
    │
    ▼
Verify Email
    │
    ▼
Sign In with Email & Password
```
