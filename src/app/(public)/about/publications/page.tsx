import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import JsonLd from '@/components/shared/JsonLd';

export const metadata = pageMetadata({
  title: 'Technical Papers on Wireline Conveyance',
  description:
    "Published papers and conference presentations on Petromac's wireline conveyance and centraliser technologies.",
  path: '/about/publications',
});

export default function PublicationsPage() {
  // Chronological order — append new papers at the end; the table renders
  // newest-first via the reverse() below.
  const publications = [
    {
      organization: 'Society of Petroleum Engineers',
      reference:
        'Folger, M., McCormick, S., & Sarian, S. (2017, March 21). Innovative Conveyance System Saves $9.4M on a Deep Water, High Angle Well in the Nam Con Son Basin.',
      event: 'Presented at SPE/ICOTA Houston, 2017',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Innovative Conveyance System Saves $9.4M on a Deep Water, High Angle Well in the Nam Con Son Basin',
      authors: ['M. Folger', 'S. McCormick', 'S. Sarian'],
      datePublished: '2017-03-21',
      url: 'https://onepetro.org/SPECTWI/proceedings-abstract/17CTWI/2-17CTWI/D021S011R006/194552',
    },
    {
      organization: 'Society of Petroleum Engineers',
      reference:
        'Brindle, F., Rafique, M., Thatha, R., McCormick, S., Escott, S., Bajwa, H., & Cocagne, M. (2018, November 12). Use of New Wireline Conveyance Technologies on an Offshore Abu Dhabi Well Saves Significant Rig Time and Results in Improved Sonic and Nuclear Magnetic Resonance Data Quality.',
      event: 'Presented at ADIPEC 2018',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Use of New Wireline Conveyance Technologies on an Offshore Abu Dhabi Well Saves Significant Rig Time and Results in Improved Sonic and Nuclear Magnetic Resonance Data Quality',
      authors: [
        'F. Brindle',
        'M. Rafique',
        'R. Thatha',
        'S. McCormick',
        'S. Escott',
        'H. Bajwa',
        'M. Cocagne',
      ],
      datePublished: '2018-11-12',
      url: 'https://onepetro.org/SPEADIP/proceedings-abstract/18ADIP/1-18ADIP/D012S130R001/213349',
    },
    {
      organization: 'Society of Petrophysicists and Well Log Analysts',
      reference:
        'Donald, J. A., Wielemaker, E., Schlicht, P., Lei, T., Mishra, A. K., Samantray, A. K., Al Mazrouei, S., Thatha, R., McCormick, S. (2020, June 22). Positive Tool Orientation Significantly Improves Data Quality and Enables Gravity Descents of Wireline Toolstrings to Near-Horizontal Deviations in the Middle East for Array Sonic and Borehole Image Data.',
      event: 'Presented at SPWLA Annual Symposium 2020',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Positive Tool Orientation Significantly Improves Data Quality and Enables Gravity Descents of Wireline Toolstrings to Near-Horizontal Deviations in the Middle East for Array Sonic and Borehole Image Data',
      authors: [
        'J. A. Donald',
        'E. Wielemaker',
        'P. Schlicht',
        'T. Lei',
        'A. K. Mishra',
        'A. K. Samantray',
        'S. Al Mazrouei',
        'R. Thatha',
        'S. McCormick',
      ],
      datePublished: '2020-06-22',
      url: 'https://onepetro.org/SPWLAALS/proceedings-abstract/SPWLA20/29-SPWLA20/D293S019R001/445779',
    },
    {
      organization: 'Society of Petrophysicists and Well Log Analysts',
      reference:
        'Mishra, A. K., Samantray, A., Al Mazrouei, S., Al Blooshi, A., Cig, K., Jha, N., Cherian, J., McCormick, S., Thatha, R., Leonard, M. (2020, June 22). Latest Wireline Conveyance Technologies Set a New World Record, Achieving Gravity Descent to 79 Degrees in Open Hole.',
      event: 'Presented at SPWLA Annual Symposium 2020',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Latest Wireline Conveyance Technologies Set a New World Record, Achieving Gravity Descent to 79 Degrees in Open Hole',
      authors: [
        'A. K. Mishra',
        'A. Samantray',
        'S. Al Mazrouei',
        'A. Al Blooshi',
        'K. Cig',
        'N. Jha',
        'J. Cherian',
        'S. McCormick',
        'R. Thatha',
        'M. Leonard',
      ],
      datePublished: '2020-06-22',
      url: 'https://www.spwla.org/SPWLA/Publications/Publication_Detail.aspx?iProductCode=SPWLA-5032',
    },
    {
      organization: 'Society of Petroleum Engineers',
      reference:
        'McCormick, S., Thatha, R., Leonard, M., Escott, S., Sedgwick, A., LeCompte, B., Zuliani, P., Naveena-Chandran, R. (2020, Sep 3). Recent Technological Advances Provide Highly Efficient and Reduced Risk Solutions for Conveying Wireline Formation Evaluation Toolstrings in Deepwater Operations. Society of Petroleum Engineers.',
      event: 'Presented at SPE Lebanon Symposium 2020',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Recent Technological Advances Provide Highly Efficient and Reduced Risk Solutions for Conveying Wireline Formation Evaluation Toolstrings in Deepwater Operations',
      authors: [
        'S. McCormick',
        'R. Thatha',
        'M. Leonard',
        'S. Escott',
        'A. Sedgwick',
        'B. LeCompte',
        'P. Zuliani',
        'R. Naveena-Chandran',
      ],
      datePublished: '2020-09-03',
      url: 'https://doi.org/10.2118/201218-MS',
    },
    {
      organization: 'International Petroleum Technology Conference',
      reference:
        'Zeghlache, M.L., Ida, H.M., Benslimani. A., Thatha, R. (2021, Mar 23). Innovative Deployment Technique to Optimize Logging Conveyance and Improve Data Quality.',
      event: 'Presented at IPTC,KL 2021',
      // Structured-data fields (ScholarlyArticle JSON-LD) — not rendered in the table.
      title:
        'Innovative Deployment Technique to Optimize Logging Conveyance and Improve Data Quality',
      authors: ['M. L. Zeghlache', 'H. M. Ida', 'A. Benslimani', 'R. Thatha'],
      datePublished: '2021-03-23',
      url: 'https://doi.org/10.2523/IPTC-21206-MS',
    },
  ];

  // Rich-results markup built from the same array that renders the table.
  const publicationsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Petromac peer-reviewed publications',
    itemListElement: publications.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'ScholarlyArticle',
        headline: p.title,
        author: p.authors.map((name) => ({ '@type': 'Person', name })),
        datePublished: p.datePublished,
        url: p.url,
        publisher: { '@type': 'Organization', name: p.organization },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={publicationsSchema} />
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* Header: title left, cross-link right */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Peer-Reviewed Publications
          </h1>
          <Link
            href="/about/patents"
            className="text-sm text-brand hover:text-brand/80 hover:underline whitespace-nowrap font-medium"
          >
            See also: Patents →
          </Link>
        </div>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 max-w-3xl">
          Papers and conference presentations covering Petromac&apos;s wireline conveyance,
          centralisation, and formation-testing technologies.
        </p>

        <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6"
                  >
                    Organization
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/2"
                  >
                    Reference
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3"
                  >
                    Event
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {[...publications].reverse().map((publication, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">{publication.organization}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {publication.url ? (
                        <a
                          href={publication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:text-brand/80 hover:underline"
                        >
                          {publication.reference}
                        </a>
                      ) : (
                        publication.reference
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{publication.event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
