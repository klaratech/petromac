import Link from "next/link";

export default function ProductTeaser() {
  return (
    <section className="bg-gray-50 py-16 px-6 text-center">
      <h2 className="text-3xl font-bold mb-4">Wireline Express</h2>
      <p className="max-w-2xl mx-auto mb-6">
        Our wheeled carriages and orientation tools simplify high-deviation logging and improve sample quality.
      </p>
      <Link href="/catalog" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Explore Catalog
      </Link>
    </section>
  );
}
