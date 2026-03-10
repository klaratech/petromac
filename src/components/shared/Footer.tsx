import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:justify-between sm:text-left">
          <div className="text-lg font-heading font-semibold text-white">
            Petromac
          </div>
          <div className="text-sm text-slate-400">
            <p>© 2026 Petromac. All rights reserved.</p>
          </div>
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
      </div>
    </footer>
  );
}
