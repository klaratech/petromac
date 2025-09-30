import Link from "next/link";

const problems = [
  { title: "Deviation", desc: "Operate reliably in high deviation wells.", link: "/case-studies" },
  { title: "Ledges", desc: "Manage ledges and hole irregularities.", link: "/case-studies" },
  { title: "Orientation", desc: "Orient probes for better sample quality.", link: "/case-studies" },
  { title: "Sticking", desc: "Mitigate differential sticking risks.", link: "/case-studies" },
];

export default function ProblemSection() {
  return (
    <section className="py-16 px-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4 bg-white">
      {problems.map((p) => (
        <div key={p.title} className="border-2 border-brand/20 rounded-xl p-6 shadow-subtle hover:shadow-card hover:border-brand/40 transition-all">
          <h3 className="text-xl font-bold text-brand mb-2">{p.title}</h3>
          <p className="text-gray-700 mb-4">{p.desc}</p>
          <Link href={p.link} className="text-brand hover:text-brand/80 font-medium transition-colors">
            Read More →
          </Link>
        </div>
      ))}
    </section>
  );
}
