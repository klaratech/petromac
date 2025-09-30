import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-6 text-center">
      <div className="mb-4 flex justify-center gap-6">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Use</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
      </div>
      <p>© {new Date().getFullYear()} Petromac. All rights reserved.</p>
    </footer>
  );
}
