export default function Loading() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="container mx-auto px-4 pt-10 md:pt-12 pb-6 md:pb-8">
        <div className="h-10 md:h-12 w-72 max-w-full rounded-lg bg-slate-200 animate-pulse" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100 animate-pulse" />
      </section>
      <section className="container mx-auto px-4 pb-12">
        <div
          className="min-h-[700px] rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500"
          role="status"
        >
          Loading success stories…
        </div>
      </section>
    </main>
  );
}
