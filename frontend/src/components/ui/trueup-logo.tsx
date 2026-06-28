import React from 'react';

interface TrueUpLogoProps {
  className?: string;
}

export default function TrueUpLogo({ className = '' }: TrueUpLogoProps) {
  return (
    <div className={`bg-[#05080f] border border-emerald-950/70 rounded-2xl p-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.5)] ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 55"
        className="w-full h-auto select-none"
      >
        <defs>
          <linearGradient id="logo-lime" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          <linearGradient id="logo-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* "True" Text in clean, modern sans-serif */}
        <text
          x="12"
          y="34"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="400"
          fontSize="29"
          fill="#84cc16"
          letterSpacing="-0.8px"
        >
          True
        </text>

        {/* Custom "U" with Upward Arrow Head */}
        {/* The left stem, bottom curve, and right stem going up */}
        <path
          d="M 76 21 L 76 30 C 76 34.5 86 34.5 86 30 L 86 16"
          fill="none"
          stroke="url(#logo-lime)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Arrow Head resting on top of the right stem */}
        <polygon
          points="80,18 86,10 92,18"
          fill="url(#logo-lime)"
        />

        {/* "p" Text */}
        <text
          x="91"
          y="34"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="600"
          fontSize="29"
          fill="#84cc16"
          letterSpacing="-0.8px"
        >
          p
        </text>

        {/* "Media" Text under the right side of the word */}
        <text
          x="94"
          y="45"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="500"
          fontSize="8.5"
          fill="url(#logo-teal)"
          letterSpacing="0.8px"
        >
          Media
        </text>
      </svg>
    </div>
  );
}
