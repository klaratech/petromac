import TeamFlipCard from '@/components/public/TeamFlipCard';
import { regionalManagers, hqTeam } from '@/data/team';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    "Meet Petromac's team of regional managers and headquarters staff supporting wireline logging operations worldwide.",
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <header className="text-center mb-14 md:mb-16 max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Meet the team
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            Regional managers across the major oil and gas basins — anchored by an engineering and
            operations team at headquarters.
          </p>
        </header>

        {/* Regional Managers */}
        <section className="mb-16 md:mb-20">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8 md:mb-10">
            Regional managers
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regionalManagers.map((member, index) => (
              <TeamFlipCard key={index} member={member} />
            ))}
          </div>
        </section>

        {/* Global HQ */}
        <section>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8 md:mb-10">
            Global HQ team
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hqTeam.map((member, index) => (
              <TeamFlipCard key={index} member={member} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
