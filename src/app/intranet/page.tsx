import Link from "next/link";

export default function IntranetHome() {
  const athenaUrl = process.env.NEXT_PUBLIC_ATHENA_URL || "https://athena.example.com";
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Intranet</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <a
          href={athenaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold mb-2">Athena</h2>
          <p className="text-gray-600">Go to Athena portal</p>
        </a>
        <Link
          href="/intranet/kiosk"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold mb-2">Kiosk</h2>
          <p className="text-gray-600">Access the internal kiosk application</p>
        </Link>
      </div>
    </main>
  );
}
