export default function Loading() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="h-12 md:h-14 w-2/3 max-w-xl rounded-lg bg-slate-200 animate-pulse" />
      </section>
      <section className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-6 md:py-8"
            >
              <div className="h-12 md:h-14 w-28 rounded-lg bg-slate-200 animate-pulse" />
              <div className="mt-3 h-3 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
      <section className="bg-slate-900 pt-6 md:pt-10 pb-12 md:pb-16">
        <div className="px-3 md:px-6 lg:px-10">
          <div
            className="h-[78vh] md:h-[85vh] rounded-2xl bg-slate-800/60 animate-pulse flex items-center justify-center text-slate-400"
            role="status"
          >
            Loading track record…
          </div>
        </div>
      </section>
    </main>
  );
}
