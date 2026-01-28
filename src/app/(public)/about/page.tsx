import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Origins Content (3 columns width) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Origins of Petromac</h2>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="md:w-1/4 flex-shrink-0">
                  <Image
                    src="/images/team/Steve.jpg"
                    alt="Stephen McCormick - Founder"
                    width={300}
                    height={400}
                    className="rounded-lg shadow-md w-full h-auto"
                  />
                </div>
                
                <div className="md:w-3/4 space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Throughout my career in petrophysics, I became increasingly frustrated with the poor log data from drill pipe conveyance and logging while drilling measurements. It is well recognised that wireline logs can deliver the most accurate, high resolution information in a very efficient manner. Wireline logging operations however, do not always run smoothly. Ledges, cuttings and high deviation can impede tool-string descent. Tool sticking compromises data quality and often leads to considerable unplanned expense.
                  </p>
                  
                  <p>
                    Qualified as a mechanical engineer, with a drive for perfection, I set out to design, validate and manufacture a range of bespoke devices with the aim to minimise wireline logging risk, improve operational efficiency and data quality. The Petromac wireline express system was born to resolve the challenges that have plagued wireline logging for over 50yrs.
                  </p>
                  
                  <p>
                    Our passionate team of highly experienced regional managers pride themselves on delivery of exceptional outcomes to customers through the use of our world leading bespoke devices.
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Founder</p>
                    <p className="text-xl font-semibold text-gray-900">Stephen McCormick</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Links (1 column width) */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">More Information</h3>
              
              <Link
                href="/about/patents"
                className="block p-4 mb-3 border border-gray-200 rounded-lg text-center bg-gray-50/60 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h4 className="text-base font-semibold tracking-wide text-gray-900">Patents</h4>
              </Link>
              
              <Link
                href="/about/publications"
                className="block p-4 border border-gray-200 rounded-lg text-center bg-gray-50/60 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h4 className="text-base font-semibold tracking-wide text-gray-900">Publications</h4>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
