import Footer from "@/components/public/Footer";
import Link from "next/link";

export default function ContactPage() {
  return (
    <main>
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg mb-4">
            This page is under construction. Please check back later.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
