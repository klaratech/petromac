"use client";

import { useState, KeyboardEvent, MouseEvent } from "react";
import Image from "next/image";
import { TeamContact } from "@/data/team";

interface TeamFlipCardProps {
  member: TeamContact;
}

export default function TeamFlipCard({ member }: TeamFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const toggleFlip = () => setFlipped((v) => !v);
  
  const unflip = () => {
    setFlipped(false);
    setRevealed(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    } else if (e.key === "Escape") {
      e.preventDefault();
      unflip();
    }
  };


  const stop = (e: MouseEvent) => e.stopPropagation();

  const handleRevealEmail = (e: MouseEvent) => {
    e.stopPropagation();
    setRevealed(true);
  };

  const email = revealed && member.emailUser && member.emailDomain
    ? `${member.emailUser}@${member.emailDomain}`
    : null;

  const displayLocation = member.region || member.location || "";

  return (
    <div
      className="group perspective-1000 h-96 cursor-pointer"
      onClick={toggleFlip}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${member.name}, ${member.role}. Press Enter to flip card.`}
      aria-pressed={flipped}
    >
      <div
        className={`relative h-full w-full transition-transform duration-700 motion-reduce:transition-none [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(180deg)]"
        }`}
      >
        {/* Front of card */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Image Container */}
            <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden">
              {member.imageSrc ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <Image
                    src={member.imageSrc}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-white">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <p className="text-blue-400 text-sm font-medium mb-2">{member.role}</p>
              {displayLocation && (
                <p className="text-gray-400 text-xs">{displayLocation}</p>
              )}
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-xl border border-blue-600 overflow-hidden"
          onClick={stop}
        >
          <div className="h-full flex flex-col p-6">
            <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
            <p className="text-blue-300 text-sm font-medium mb-4">{member.role}</p>

            {/* Bio */}
            <div className="flex-1 overflow-y-auto mb-4">
              {member.bio ? (
                <p className="text-gray-200 text-sm leading-relaxed line-clamp-5">
                  {member.bio}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No bio available</p>
              )}
            </div>

            {/* Contact Icons */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-blue-700">
              {/* LinkedIn Icon */}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                  aria-label={`Visit ${member.name}'s LinkedIn profile`}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}

              {/* Email Icon */}
              {member.emailUser && member.emailDomain && (
                <button
                  onClick={handleRevealEmail}
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                  aria-label="Reveal email address"
                  disabled={revealed}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Revealed Email Display */}
            {revealed && email && (
              <div className="mt-4 pt-4 border-t border-blue-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-blue-950/50 text-gray-200 rounded text-xs break-all">
                    {email}
                  </div>
                  <a
                    href={`mailto:${email}`}
                    onClick={stop}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                    aria-label="Send email"
                  >
                    Send
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
