# Fix: Replace `resend` with Nodemailer in `src/app/contact/actions.ts`

You removed the `resend` package, so the dynamic import fails:

```
TS2307: Cannot find module 'resend'
```

We will:
1) Remove any `resend` imports/usages.
2) Use **Nodemailer** with SMTP app password.
3) Ensure types are correct and code works as a **Server Action**.

---

## 1) Ensure env vars

Add these to `.env.example` and set them in Vercel (Project → Settings → Env Vars):

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=465
SMTP_USER=your-user@example.com
SMTP_PASS=app-password-here

CONTACT_FROM_EMAIL=your-user@example.com
CONTACT_TO_EMAIL=recipient@example.com
```

---

## 2) Update dependencies

You already have Nodemailer + types:
- `nodemailer`: ^7.0.6
- `@types/nodemailer`: ^7.0.1

No changes required here.

---

## 3) Patch `src/app/contact/actions.ts`

Replace the existing implementation with this **server action**:

```ts
"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
  // optional spam controls
  token: z.string().optional(),   // hCaptcha token if used
  hp: z.string().optional(),      // honeypot field
});

export async function submitContact(formData: FormData) {
  const data = schema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    token: formData.get("token")?.toString(),
    hp: formData.get("company")?.toString(),
  });

  // honeypot
  if (data.hp && data.hp.length > 0) {
    // pretend success; do not send mail
    return { ok: true };
  }

  // TODO: verify hCaptcha on server if using it

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.CONTACT_FROM_EMAIL!,
    to: process.env.CONTACT_TO_EMAIL!,
    subject: `Contact form: ${data.name}`,
    text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  });

  return { ok: true, id: info.messageId };
}
```

> If this file lived under `/app/contact/actions.ts`, ensure your **ContactForm** uses a `<form action={submitContact}>` pattern or a client function that calls the server action.

---

## 4) Remove `resend` from `package.json`

If it still exists:
```bash
npm pkg delete dependencies.resend
npm install
```

---

## 5) Sanity checks

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Test the form locally. If the SMTP provider is Gmail/Outlook, use an **App Password** and make sure the `from` address is allowed by the provider.

---

## Acceptance Criteria

- No more `resend` imports.
- Form sends email via **Nodemailer**.
- `npx tsc --noEmit` passes.
- Build succeeds locally and on Vercel.
