import Link from "next/link";

export default function ProductTeaser() {
  return (
    <section className="bg-slate-50 py-16 px-6 text-center">
      <h2 className="font-heading text-3xl font-bold text-slate-900 mb-4">Wireline Express</h2>
      <p className="max-w-2xl mx-auto mb-6 text-slate-600">
        Our wheeled carriages and orientation tools simplify high-deviation logging and improve sample quality.
      </p>
      <Link href="/catalog" className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium">
        Explore Catalog
      </Link>
    </section>
  );
}
