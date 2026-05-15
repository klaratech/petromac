"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { buildClientApiUrl } from "@/lib/api";

/**
 * Contact form — form only. The page chrome (header, grid, info sidebar)
 * lives in src/app/(public)/contact/page.tsx. Rendered inside a white card
 * as the primary column of the contact layout.
 */
export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const formStartTimeRef = useRef(0);

  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const formDataObj = new FormData(e.currentTarget);

      const formStartTime = formStartTimeRef.current || Date.now();
      const timeTaken = (Date.now() - formStartTime) / 1000;
      formDataObj.append("_timing", timeTaken.toString());

      const response = await fetch(buildClientApiUrl("/api/contact"), {
        method: "POST",
        body: formDataObj,
      });

      const result = (await response.json()) as { ok: boolean; error?: string };

      if (response.ok && result.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
        formStartTimeRef.current = Date.now();
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-card p-6 md:p-8">
      <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">
        Send us a message
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Fields marked <span className="text-red-500">*</span> are required.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Honeypot field — hidden from users */}
        <input
          type="text"
          name="company"
          autoComplete="off"
          tabIndex={-1}
          className="absolute opacity-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Full Name + Email — side by side on wider screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              aria-required="true"
              maxLength={200}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={fieldClass}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-required="true"
              maxLength={320}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={fieldClass}
              placeholder="jane@example.com"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className={labelClass}>
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            aria-required="true"
            maxLength={5000}
            rows={7}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            className={`${fieldClass} resize-none`}
            placeholder="Tell us about your well, tool string, or what you'd like to see — and we'll point you to the right person."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Sending…" : "Send message"}
          </button>
        </div>

        {/* Status messages */}
        <div aria-live="polite">
          {submitStatus === "success" && (
            <div
              role="alert"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              Thank you for your message — we&apos;ll get back to you soon.
            </div>
          )}
          {submitStatus === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              Something went wrong. Please try again, or email us directly at{" "}
              <a
                href="mailto:info@petromac.co.nz"
                className="font-medium underline"
              >
                info@petromac.co.nz
              </a>
              .
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
