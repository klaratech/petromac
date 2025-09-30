import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 px-6 text-center">
      <div className="mb-4 flex justify-center gap-6">
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>
      <p className="text-sm">© {new Date().getFullYear()} Petromac. All rights reserved.</p>
    </footer>
  );
}
