import TeamFlipCard from "@/components/public/TeamFlipCard";
import { regionalManagers, hqTeam } from "@/data/team";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-brandblack">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Our Team
          </h1>
        </div>

        {/* Regional Managers Section */}
        <div className="mb-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-brand mb-2 text-center">Regional Managers</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regionalManagers.map((member, index) => (
              <TeamFlipCard key={index} member={member} />
            ))}
          </div>
        </div>

        {/* Global HQ Team Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-brand mb-2 text-center">Global HQ Team</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hqTeam.map((member, index) => (
              <TeamFlipCard key={index} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
