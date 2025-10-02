import Flipbook from "@/components/shared/pdf/Flipbook";

export default function SuccessStoriesFlipbookPage() {
  const pages = Array.from({ length: 47 }, (_, i) =>
    `/flipbooks/successstories/page-${String(i + 1).padStart(3, "0")}.jpg`
  );
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Success Stories</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Flipbook pages={pages} width={600} height={800} />
        </div>
      </div>
    </main>
  );
}
