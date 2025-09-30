import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          {/* Left: Petromac */}
          <div className="text-lg font-heading font-semibold text-white">
            Petromac
          </div>

          {/* Right: Links with separator */}
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <div className="h-4 w-px bg-slate-600" />
            <Link
              href="/terms"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Terms of Use
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-slate-400">
          <p>© 2025 Petromac. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
