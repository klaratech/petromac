import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand text-white py-8 px-6 text-center">
      <div className="mb-4 flex justify-center gap-6">
        <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-white/80 transition-colors">Terms of Use</Link>
        <Link href="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
      </div>
      <p className="text-sm text-white/90">© {new Date().getFullYear()} Petromac. All rights reserved.</p>
    </footer>
  );
}
