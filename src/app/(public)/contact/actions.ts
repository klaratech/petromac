"use server";

import { z } from "zod";
import { createEmailTransport, getFromAddress } from "@/lib/email";
import { appendEmailLog } from "@/lib/emailLog";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  company: z.string().optional(), // honeypot field
  _timing: z.string().default("0"), // timing check
  token: z.string().optional(), // hCaptcha token if used
});

export async function submitContact(formData: FormData) {
  try {
    // Parse and validate form data
    const data = contactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      company: formData.get("company")?.toString() || "",
      _timing: formData.get("_timing")?.toString() || "0",
      token: formData.get("token")?.toString(),
    });

    // Honeypot check - if filled, pretend success but don't send
    if (data.company && data.company.length > 0) {
      return { ok: true };
    }

    // Timing check - form should take at least 3 seconds to fill
    const timeTaken = parseFloat(data._timing);
    if (timeTaken < 3) {
      return { ok: true }; // Pretend success
    }

    // TODO: verify hCaptcha on server if using it

    // Check if SMTP is configured
    const contactToEmail = process.env.CONTACT_TO_EMAIL;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !contactToEmail) {
      return { ok: true }; // Return success even if not configured
    }

    // Send email via Nodemailer
    try {
      const transporter = createEmailTransport();

      const info = await transporter.sendMail({
        from: getFromAddress(),
        to: contactToEmail,
        replyTo: data.email,
        subject: `Contact Form: ${data.name}`,
        text: `From: ${data.name} <${data.email}>\n\nMessage:\n${data.message}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Message:</strong></p>
          <p>${data.message.replace(/\n/g, "<br>")}</p>
        `,
      });

      await appendEmailLog({ recipientEmail: data.email, emailType: 'contact' });

      return { ok: true, id: info.messageId };
    } catch {
      // Still return success to user
      return { ok: true };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: "Validation failed" };
    }
    return { ok: false, error: "Failed to submit form" };
  }
}
