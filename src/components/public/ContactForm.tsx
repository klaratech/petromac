"use client";

import { useState, FormEvent } from "react";
import { submitContact } from "@/app/(public)/contact/actions";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [formStartTime] = useState(Date.now());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const formDataObj = new FormData(e.currentTarget);
      
      // Add timing check to FormData
      const timeTaken = (Date.now() - formStartTime) / 1000;
      formDataObj.append("_timing", timeTaken.toString());

      const result = await submitContact(formDataObj);

      if (result.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-xl mx-auto">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-8">
              Get in Touch
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field - hidden from users */}
              <input
                type="text"
                name="company"
                autoComplete="off"
                tabIndex={-1}
                className="absolute opacity-0 pointer-events-none"
                aria-hidden="true"
              />

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={200}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-brand focus:ring-brand"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  maxLength={320}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-brand focus:ring-brand"
                  placeholder="john@example.com"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={5000}
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-md bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-brand focus:ring-brand resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand text-white hover:bg-brand/90 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg px-6 py-2 font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div className="p-4 rounded-md bg-green-900/20 border border-green-700 text-green-300">
                  Thank you for your message! We&apos;ll get back to you soon.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="p-4 rounded-md bg-red-900/20 border border-red-700 text-red-300">
                  Something went wrong. Please try again or contact us directly.
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
