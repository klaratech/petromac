export default function CatalogPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gray-900 text-white py-4 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Product Catalog</h1>
            <p className="text-gray-300 text-sm">
              Browse our complete catalog of wireline logging devices and solutions
            </p>
          </div>
          <a
            href="/data/petromac-catalog.pdf"
            download
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Download PDF
          </a>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="/data/petromac-catalog.pdf#pagemode=bookmarks"
          className="w-full h-full border-0"
          title="Petromac Product Catalog"
        />
      </div>
    </div>
  );
}
