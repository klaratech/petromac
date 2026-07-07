export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-9 w-64 rounded-lg bg-gray-200 animate-pulse" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div
            className="min-h-[700px] flex items-center justify-center text-gray-500"
            role="status"
          >
            Loading catalog…
          </div>
        </div>
      </div>
    </main>
  );
}
