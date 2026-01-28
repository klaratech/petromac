export default function PatentsPage() {
  const wirewireExpressPatents = [
    {
      category: "Tool Taxi & Guide",
      patents: [
        { title: "Sensor Transportation Apparatus and Guide Device", number: "US9,863,198", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US9863198B2.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "US10,364,627", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US10364627B2.pdf" },
        { title: "Wellbore Logging Tool Assembly", number: "US10,612,333", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US10612333B2.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "US11,047,191", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11047191B1.pdf" },
        { title: "Sensor Transportation Apparatus – \"Lubrication Delivery system\"", number: "US11,111,774", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11111774B2.pdf" },
        { title: "Orientation apparatus and hole finder device for a wireline logging tool string", number: "US11,371,306", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11371306B2.pdf" },
        { title: "Sensor transportation apparatus for a wireline logging toolstring", number: "US11,873,692", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11873692B2.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "UAE-7283", jurisdiction: "United Arab Emirates", link: "https://www.petromac.co.nz/pdf/UAE-7283.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "MY-169945", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-169945%20B.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "MY-195422-A", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-195422-A.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "EP2920405", jurisdiction: "France, Netherlands, Norway, United Kingdom", link: "https://www.petromac.co.nz/pdf/EP2920405B1.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "EP3726001", jurisdiction: "Denmark, Italy, Norway, United Kingdom", link: "https://www.petromac.co.nz/pdf/EP3726001B1.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "Eurasia 031097", jurisdiction: "Russia, Armenia, Azerbaijan, Belarus, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan", link: "https://www.petromac.co.nz/pdf/EA031097B1.pdf" },
        { title: "Un dispositivo guía para uso en equipos de sensores de guía en Aplicaciones de registro por cable de perforación", number: "NC2020/0008570", jurisdiction: "Colombia", link: "https://www.petromac.co.nz/pdf/NC202_0008570.pdf" },
        { title: "Sensor Transportation Apparatus and Guide Device", number: "ZL201380059792.3", jurisdiction: "China", link: "https://www.petromac.co.nz/pdf/CN104919132B.pdf" },
        { title: "Sensor Transportation Device - \"Guide Device\"", number: "ZL201810053768.3", jurisdiction: "China", link: "https://www.petromac.co.nz/pdf/CN108104751B.pdf" },
        { title: "Aparelho de transporte... Guide device combination through a wellbore.", number: "BR 112015010666.8", jurisdiction: "Brazil", link: "https://www.petromac.co.nz/pdf/BR%20taxi.pdf" },
      ]
    },
    {
      category: "Pathfinder",
      patents: [
        { title: "Guide Device", number: "US11,371,296", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11371296B2.pdf" },
        { title: "A device for centering a sensor assembly in a wellbore", number: "US12,116,850", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US12116850B1.pdf" },
        { title: "A Guide Device", number: "MY-203027-A", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-203027-A.pdf" },
        { title: "A Guide Device", number: "GB2583249", jurisdiction: "United Kingdom", link: "https://www.petromac.co.nz/pdf/GB2583249B.pdf" },
        { title: "Guide Device", number: "CA3085434", jurisdiction: "Canada", link: "https://www.petromac.co.nz/pdf/CA3085434 Granted specification.pdf" },
        { title: "Guide Device", number: "AU2019205752", jurisdiction: "Australia", link: "https://www.petromac.co.nz/pdf/AU2019205752B2.pdf" },
      ]
    },
    {
      category: "Wireline Express Cased Hole",
      patents: [
        { title: "Sensor transportation device", number: "US11,933,160", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11933160B1.pdf" },
        { title: "Toolstring transportation apparatus", number: "US11,970,914", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11970914.pdf" },
      ]
    }
  ];

  const focusPatents = [
    {
      category: "Helix Centraliser (CX7, CX9, CX13)",
      patents: [
        { title: "Device for centering a sensor assembly in a bore", number: "US10,947,791", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US10947791B1.pdf" },
        { title: "Device for centering sensor assembly in a bore", number: "US11,913,291", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11913291B2.pdf" },
        { title: "Device for centering sensor assembly in a bore", number: "US12,281,525", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US12281525.pdf" },
        { title: "Device for centering sensor assembly in a bore", number: "SA 16064", jurisdiction: "Saudi Arabia", link: "https://www.petromac.co.nz/pdf/SA16064.pdf" },
        { title: "Device for centering sensor assembly in a bore", number: "GB2611986", jurisdiction: "United Kingdom", link: "https://www.petromac.co.nz/pdf/GB2611986.pdf" },
      ]
    },
    {
      category: "Rocker Centraliser (CRU, CRIL)",
      patents: [
        { title: "A device for centering a sensor assembly in a bore", number: "US10,947,792", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US10947792B1.pdf" },
        { title: "Device for centering sensor assembly in a bore", number: "US12,104,443", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US12104443B2.pdf" },
      ]
    },
    {
      category: "Adjustable Centraliser (CA7)",
      patents: [
        { title: "Sensor transportation device", number: "US10,988,991", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US10988991B1.pdf" },
      ]
    },
    {
      category: "Parallelogram Centraliser and Compact Spring Centraliser (CP12)",
      patents: [
        { title: "Device for centering a sensor assembly in a bore", number: "US11,136,880", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11136880B1.pdf" },
      ]
    },
    {
      category: "Co-pivot Centraliser (PC8)",
      patents: [
        { title: "Device for centering sensor assembly in a bore – \"Co-pivot Centraliser\"", number: "US11,713,627", jurisdiction: "United States of America", link: "https://www.petromac.co.nz/pdf/US11713627B1.pdf" },
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-brandblack">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white text-center">
          Petromac&apos;s intellectual property
        </h1>
        
        <div className="mb-12 bg-white/5 rounded-lg p-6 border border-white/10">
          <p className="text-white/90 leading-relaxed mb-4">
            At Petromac we design and manufacture a broad range of bespoke devices particularly for the wireline logging industry.
          </p>
          <p className="text-white/90 leading-relaxed mb-4">
            Petromac Wireline Express™ devices have made a quantum leap in wireline operations, setting world records for deviation and depth achieved during gravity decent in open hole. In doing so, Petromac devices have enabled significant cost and time saving benefits for both the wireline logging companies and the operators we serve.
          </p>
          <p className="text-white/90 leading-relaxed mb-4">
            In addition, Petromac&apos;s Focus™ Precision Centralisers, which include the world&apos;s first open hole roller centraliser and cased hole Rocker™ centraliser, are revolutionising centralisation in both open and cased hole logging.
          </p>
          <p className="text-white/90 leading-relaxed">
            The technology behind Petromac devices is, of necessity, protected by patents. A list of granted patents is provided below. While we make every effort to keep this list up to date, please note that it may not include all newly granted patents.
          </p>
        </div>

        {/* Wireline Express Patents */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-brand">Petromac Wireline Express™ Intellectual Property</h2>
          
          {wirewireExpressPatents.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-white">{category.category}</h3>
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-white/20">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-brand">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Patent
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Jurisdiction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.patents.map((patent, patentIndex) => (
                        <tr key={patentIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {patent.title}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <a
                              href={patent.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:text-brand/80 hover:underline font-medium"
                            >
                              {patent.number}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {patent.jurisdiction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Focus Patents */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-brand">Petromac Focus™ Intellectual Property</h2>
          
          {focusPatents.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-white">{category.category}</h3>
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-white/20">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-brand">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Patent
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                          Jurisdiction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.patents.map((patent, patentIndex) => (
                        <tr key={patentIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {patent.title}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <a
                              href={patent.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:text-brand/80 hover:underline font-medium"
                            >
                              {patent.number}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {patent.jurisdiction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <p className="text-white/90 text-sm leading-relaxed">
            <strong>Note:</strong> Any party (e.g., wireline service company, E&P operator or conveyance accessory provider) that manufactures, imports, offers for sale, sells, or uses any Petromac patented technology, without permission or licence from Petromac, is considered to infringe the patented technology. If you wish to understand more, please feel free to contact us.
          </p>
        </div>
      </div>
    </main>
  );
}
