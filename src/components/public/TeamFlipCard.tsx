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

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (!next || !e.currentTarget.contains(next)) {
      unflip();
    }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  const handleRevealEmail = (e: MouseEvent) => {
    e.stopPropagation();
    setRevealed(true);
  };

  const handleCopyEmail = async (e: MouseEvent) => {
    e.stopPropagation();
    if (member.emailUser && member.emailDomain) {
      const email = `${member.emailUser}@${member.emailDomain}`;
      await navigator.clipboard.writeText(email);
    }
  };

  const handleEmailClick = (e: MouseEvent) => {
    e.stopPropagation();
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
      onBlur={onBlur}
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
            <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden relative">
              {member.imageSrc ? (
                <Image
                  src={member.imageSrc}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
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

            {/* Hover hint */}
            <div className="px-6 pb-4 text-center">
              <p className="text-xs text-gray-500 italic">Click or press Enter to see more</p>
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

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* LinkedIn Button */}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  aria-label={`Visit ${member.name}'s LinkedIn profile`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn Profile</span>
                </a>
              )}

              {/* Email Section */}
              {member.emailUser && member.emailDomain && (
                <div>
                  {!revealed ? (
                    <button
                      onClick={handleRevealEmail}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      Reveal Email
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg text-sm break-all">
                        {email}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyEmail}
                          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                          Copy
                        </button>
                        <a
                          href={`mailto:${email}`}
                          onClick={handleEmailClick}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hint */}
            <div className="pt-4 text-center">
              <p className="text-xs text-blue-300 italic">Click or press Escape to flip back</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
