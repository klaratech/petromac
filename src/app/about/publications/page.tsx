export default function PublicationsPage() {
  const publications = [
    {
      organization: "Society of Petroleum Engineers",
      reference: "Folger, M., McCormick, S., & Sarian, S. (2017, March 21). Innovative Conveyance System Saves $9.4M on a Deep Water, High Angle Well in the Nam Con Son Basin.",
      event: "Presented at SPE/ICOTA Houston, 2017",
    },
    {
      organization: "Society of Petroleum Engineers",
      reference: "Brindle, F., Rafique, M., Thatha, R., McCormick, S., Escott, S., Bajwa, H., & Cocagne, M. (2018, November 12). Use of New Wireline Conveyance Technologies on an Offshore Abu Dhabi Well Saves Significant Rig Time and Results in Improved Sonic and Nuclear Magnetic Resonance Data Quality.",
      event: "Presented at ADIPEC 2018",
    },
    {
      organization: "Society of Petrophysicists and Well Log Analysts",
      reference: "Donald, J. A., Wielemaker, E., Schlicht, P., Lei, T., Mishra, A. K., Samantray, A. K., Al Mazrouei, S., Thatha, R., McCormick, S. (2020, June 22). Positive Tool Orientation Significantly Improves Data Quality and Enables Gravity Descents of Wireline Toolstrings to Near-Horizontal Deviations in the Middle East for Array Sonic and Borehole Image Data.",
      event: "Presented at SPWLA Annual Symposium 2020",
    },
    {
      organization: "Society of Petrophysicists and Well Log Analysts",
      reference: "Mishra, A. K., Samantray, A., Al Mazrouei, S., Al Blooshi, A., Cig, K., Jha, N., Cherian, J., McCormick, S., Thatha, R., Leonard, M. (2020, June 22). Latest Wireline Conveyance Technologies Set a New World Record, Achieving Gravity Descent to 79 Degrees in Open Hole.",
      event: "Presented at SPWLA Annual Symposium 2020",
    },
    {
      organization: "Society of Petroleum Engineers",
      reference: "McCormick, S., Thatha, R., Leonard, M., Escott, S., Sedgwick, A., LeCompte, B., Zuliani, P., Naveena-Chandran, R. (2020, Sep 3). Recent Technological Advances Provide Highly Efficient and Reduced Risk Solutions for Conveying Wireline Formation Evaluation Toolstrings in Deepwater Operations. Society of Petroleum Engineers.",
      event: "Presented at SPE Lebanon Symposium 2020",
    },
    {
      organization: "International Petroleum Technology Conference",
      reference: "Zeghlache, M.L., Ida, H.M., Benslimani. A., Thatha, R. (2021, Mar 23). Innovative Deployment Technique to Optimize Logging Conveyance and Improve Data Quality.",
      event: "Presented at IPTC,KL 2021",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Publications</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Event
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {publications.map((publication, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {publication.organization}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {publication.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {publication.event}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
