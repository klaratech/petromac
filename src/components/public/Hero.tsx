import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-cover bg-center text-white h-[70vh]" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
      <div className="flex flex-col items-center justify-center h-full bg-black/50 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Bespoke Devices for the Wireline Logging Industry
        </h1>
        <p className="max-w-2xl mb-6 text-lg md:text-xl">
          Solutions for differential sticking, high deviation, orientation, and sample quality
        </p>
        <div className="flex gap-4">
          <Link href="/catalog" className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
            View Catalog
          </Link>
          <Link href="/case-studies" className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-800">
            Case Studies
          </Link>
        </div>
      </div>
    </section>
  );
}
