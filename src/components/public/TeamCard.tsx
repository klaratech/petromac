"use client";

interface TeamMember {
  name: string;
  title: string;
  email: string;
  phone: string;
  bio: string;
  image: string;
}

interface TeamCardProps {
  member: TeamMember;
}

export default function TeamCard({ member }: TeamCardProps) {
  return (
    <div className="group perspective-1000 h-96">
      <div className="relative w-full h-full transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Image Container */}
            <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden">
              <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-white">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            
            {/* Contact Details */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <p className="text-blue-400 text-sm font-medium mb-4">{member.title}</p>
              
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${member.email}`} className="hover:text-blue-400 transition-colors">
                    {member.email}
                  </a>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${member.phone}`} className="hover:text-blue-400 transition-colors">
                    {member.phone}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Hover hint */}
            <div className="px-6 pb-4 text-center">
              <p className="text-xs text-gray-500 italic">Hover to see bio</p>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-xl border border-blue-600 rotate-y-180 overflow-hidden">
          <div className="h-full flex flex-col p-6">
            <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
            <p className="text-blue-300 text-sm font-medium mb-4">{member.title}</p>
            
            <div className="flex-1 overflow-y-auto">
              <p className="text-gray-200 text-sm leading-relaxed">{member.bio}</p>
            </div>
            
            {/* Hover hint */}
            <div className="pt-4 text-center">
              <p className="text-xs text-blue-300 italic">Hover to see contact details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
