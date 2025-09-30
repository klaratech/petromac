import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Petromac brand section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xl font-heading font-semibold text-white mb-2">
              Petromac
            </h3>
            <p className="text-sm text-slate-400 max-w-xs text-center md:text-left">
              Advanced wireline solutions for the oil and gas industry
            </p>
          </div>

          {/* Center/Right: Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <Link
              href="/privacy-policy"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-use"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Terms of Use
            </Link>
            <Link
              href="/contact"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom row: Copyright */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
          <p>
            © {currentYear} Petromac. All rights reserved.{" "}
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            {" / "}
            <Link href="/terms-of-use" className="hover:text-slate-300 transition-colors">
              Terms of Use
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
