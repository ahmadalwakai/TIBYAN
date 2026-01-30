"use client";

import { Box } from "@chakra-ui/react";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <Box display="flex" alignItems="center" gap={3}>
      {/* Enhanced Premium Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Gradient */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B45E" />
            <stop offset="50%" stopColor="#C8A24A" />
            <stop offset="100%" stopColor="#B08C3A" />
          </linearGradient>
          
          {/* Navy Gradient */}
          <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0E2847" />
            <stop offset="50%" stopColor="#0B1F3A" />
            <stop offset="100%" stopColor="#081628" />
          </linearGradient>
          
          {/* Radial Glow */}
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C8A24A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C8A24A" stopOpacity="0" />
          </radialGradient>
          
          {/* Shadow */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0B1F3A" floodOpacity="0.3"/>
          </filter>
          
          {/* Inner Shadow */}
          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Glow */}
        <circle cx="60" cy="60" r="55" fill="url(#glowGradient)" />
        
        {/* Outer Decorative Ring - Islamic Pattern */}
        <circle
          cx="60"
          cy="60"
          r="52"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        
        {/* Main Circle Border - Double Ring */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="url(#goldGradient)"
          strokeWidth="3.5"
          fill="none"
          filter="url(#shadow)"
        />
        
        {/* Inner Decorative Dots */}
        <circle cx="60" cy="8" r="2" fill="url(#goldGradient)" />
        <circle cx="60" cy="112" r="2" fill="url(#goldGradient)" />
        <circle cx="8" cy="60" r="2" fill="url(#goldGradient)" />
        <circle cx="112" cy="60" r="2" fill="url(#goldGradient)" />
        
        {/* Sacred Geometry Base - Octagon */}
        <path
          d="M 60 15 L 82 22 L 98 38 L 105 60 L 98 82 L 82 98 L 60 105 L 38 98 L 22 82 L 15 60 L 22 38 L 38 22 Z"
          fill="url(#navyGradient)"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          opacity="0.2"
        />

        {/* Main Book Container - Refined */}
        <g filter="url(#innerShadow)">
          {/* Book Cover - Left Page */}
          <path
            d="M 35 30 L 58 30 L 58 90 L 35 90 Z"
            fill="url(#navyGradient)"
            stroke="url(#goldGradient)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Book Cover - Right Page */}
          <path
            d="M 62 30 L 85 30 L 85 90 L 62 90 Z"
            fill="url(#navyGradient)"
            stroke="url(#goldGradient)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Ornate Spine/Binding */}
          <rect 
            x="57" 
            y="30" 
            width="6" 
            height="60" 
            fill="url(#goldGradient)"
            filter="url(#shadow)"
          />
          
          {/* Decorative Spine Details */}
          <line x1="60" y1="35" x2="60" y2="85" stroke="#0B1F3A" strokeWidth="0.5" opacity="0.6" />
          <circle cx="60" cy="38" r="1.5" fill="#0B1F3A" opacity="0.4" />
          <circle cx="60" cy="50" r="1.5" fill="#0B1F3A" opacity="0.4" />
          <circle cx="60" cy="62" r="1.5" fill="#0B1F3A" opacity="0.4" />
          <circle cx="60" cy="74" r="1.5" fill="#0B1F3A" opacity="0.4" />
        </g>
        
        {/* Elegant Page Lines - Left */}
        <g opacity="0.9">
          <line x1="40" y1="40" x2="53" y2="40" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="40" y1="48" x2="53" y2="48" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="40" y1="56" x2="53" y2="56" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="40" y1="64" x2="53" y2="64" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="40" y1="72" x2="50" y2="72" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="40" y1="80" x2="48" y2="80" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        
        {/* Elegant Page Lines - Right */}
        <g opacity="0.9">
          <line x1="67" y1="40" x2="80" y2="40" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="67" y1="48" x2="80" y2="48" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="67" y1="56" x2="80" y2="56" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="67" y1="64" x2="80" y2="64" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="67" y1="72" x2="77" y2="72" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="67" y1="80" x2="75" y2="80" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Top Crown/Star Ornament - Islamic Star Pattern */}
        <g filter="url(#shadow)">
          <path
            d="M 60 15 L 63 22 L 70 22 L 65 26 L 67 33 L 60 28 L 53 33 L 55 26 L 50 22 L 57 22 Z"
            fill="url(#goldGradient)"
            stroke="#0B1F3A"
            strokeWidth="0.5"
          />
          {/* Inner star detail */}
          <circle cx="60" cy="24" r="1.5" fill="#0B1F3A" opacity="0.3" />
        </g>

        {/* Arabic Calligraphy Hint - Letter ت (Taa) - Enhanced */}
        <g transform="translate(60, 98)">
          {/* Two dots */}
          <circle cx="-6" cy="0" r="2.5" fill="url(#goldGradient)" filter="url(#shadow)" />
          <circle cx="6" cy="0" r="2.5" fill="url(#goldGradient)" filter="url(#shadow)" />
          {/* Curved base */}
          <path
            d="M -10 3 Q 0 8 10 3"
            stroke="url(#goldGradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            filter="url(#shadow)"
          />
        </g>
        
        {/* Corner Ornamental Details - Islamic Geometry */}
        <g opacity="0.4" stroke="url(#goldGradient)" strokeWidth="1" fill="none">
          <path d="M 20 20 L 25 20 L 25 25" strokeLinecap="round"/>
          <path d="M 100 20 L 95 20 L 95 25" strokeLinecap="round"/>
          <path d="M 20 100 L 25 100 L 25 95" strokeLinecap="round"/>
          <path d="M 100 100 L 95 100 L 95 95" strokeLinecap="round"/>
        </g>

        {/* Subtle Inner Glow Effect */}
        <circle 
          cx="60" 
          cy="60" 
          r="45" 
          fill="none" 
          stroke="url(#goldGradient)" 
          strokeWidth="0.5" 
          opacity="0.2"
        />
      </svg>

      {/* Enhanced Logo Text */}
      {showText && (
        <Box>
          <Box
            fontSize="2xl"
            fontWeight="900"
            lineHeight="1.2"
            letterSpacing="tight"
            css={{
              background: "linear-gradient(135deg, #0B1F3A 0%, #C8A24A 50%, #0B1F3A 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 2px 4px rgba(200, 162, 74, 0.2)",
            }}
          >
            تبيان
          </Box>
          <Box
            fontSize="sm"
            fontWeight="700"
            lineHeight="1"
            letterSpacing="wider"
            css={{
              background: "linear-gradient(135deg, #C8A24A 0%, #0B1F3A 50%, #C8A24A 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            TIBYAN
          </Box>
        </Box>
      )}
    </Box>
  );
}
