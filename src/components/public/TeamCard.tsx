"use client";

import { useState } from 'react';

interface TeamMember {
  name: string;
  title: string;
  email: string;
  phone: string;
  bio: string;
  image: string;
  linkedin?: string;
}

interface TeamCardProps {
  member: TeamMember;
}

export default function TeamCard({ member }: TeamCardProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
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
                  {showEmail ? (
                    <a href={`mailto:${member.email}`} className="hover:text-blue-400 transition-colors">
                      {member.email}
                    </a>
                  ) : (
                    <button 
                      onClick={() => setShowEmail(true)}
                      className="hover:text-blue-400 transition-colors text-left"
                    >
                      Click to reveal email
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {showPhone ? (
                    <a href={`tel:${member.phone}`} className="hover:text-blue-400 transition-colors">
                      {member.phone}
                    </a>
                  ) : (
                    <button 
                      onClick={() => setShowPhone(true)}
                      className="hover:text-blue-400 transition-colors text-left"
                    >
                      Click to reveal phone
                    </button>
                  )}
                </div>

                {member.linkedin && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
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
