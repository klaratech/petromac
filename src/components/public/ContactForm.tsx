"use client";

import { useState, FormEvent } from "react";
import { submitContact } from "@/app/contact/actions";

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact Form */}
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
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-md bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-brand focus:ring-brand resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg px-8 py-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>

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

          {/* Right: Partner Logos */}
          <div className="flex items-center justify-center">
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
              <h3 className="font-heading text-xl font-semibold text-white mb-6 text-center">
                Trusted by Industry Leaders
              </h3>
              <div className="grid grid-cols-2 gap-6 items-center">
                {/* Placeholder for partner logos */}
                <div className="h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                  Partner Logo
                </div>
                <div className="h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                  Partner Logo
                </div>
                <div className="h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                  Partner Logo
                </div>
                <div className="h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                  Partner Logo
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-6 text-center">
                Join our network of satisfied clients worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
