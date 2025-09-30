"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  company: z.string().optional(), // honeypot field
  _timing: z.string().default("0"), // timing check
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

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactToEmail = process.env.CONTACT_TO_EMAIL;
    const contactFromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey || !contactToEmail || !contactFromEmail) {
      return { ok: true }; // Return success even if not configured
    }

    // Send email via Resend
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: contactFromEmail,
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

      return { ok: true };
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
