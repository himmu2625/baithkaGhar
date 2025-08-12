"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

/**
 * Independence Day Theme Component
 * Adds a tricolor gradient overlay to the entire website
 * Only displays between August 12-15, 2025
 */
export default function IndependenceDayTheme() {
  const [showIndependenceTheme, setShowIndependenceTheme] = useState(false)

  // Check if current date is between Aug 12-15, 2025 for Independence Day theme
  useEffect(() => {
    const today = new Date();
    const independenceTheme = today >= new Date(2025, 7, 12) && today <= new Date(2025, 7, 15);
    setShowIndependenceTheme(independenceTheme);
    
    // For development testing - remove in production
    setShowIndependenceTheme(true);
  }, []);

  if (!showIndependenceTheme) return null;

  return (
    <>
      {/* Site-wide Tricolor Gradient Border */}
      <div className="fixed top-0 left-0 w-full h-2 z-50 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] animate-gradient-x"></div>
      
      {/* Site-wide Tricolor Gradient Corner Accents */}
      <div className="fixed top-0 left-0 w-16 h-16 z-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF9933] to-transparent opacity-40"></div>
      </div>
      <div className="fixed top-0 right-0 w-16 h-16 z-40 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white to-transparent opacity-40"></div>
      </div>
      <div className="fixed bottom-0 left-0 w-16 h-16 z-40 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-[#138808] to-transparent opacity-40"></div>
      </div>
      <div className="fixed bottom-0 right-0 w-16 h-16 z-40 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[#FF9933] to-transparent opacity-40"></div>
      </div>

      {/* Floating Independence Day Badge */}
      <Link 
        href="/about" 
        className="fixed top-20 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg hover:scale-110 transition-transform duration-300"
        title="Celebrating India's Independence Day"
      >
        <IndianFlagSVG />
      </Link>

      {/* Subtle Confetti Elements */}
      <FestiveConfetti count={15} />

      {/* Global Style Modifications */}
      <style jsx global>{`
        /* Add subtle tricolor glow to buttons */
        .btn-primary, button[type="submit"], .btn-secondary {
          box-shadow: 0 0 10px rgba(255, 153, 51, 0.2), 0 0 15px rgba(19, 136, 8, 0.1) !important;
        }
        
        /* Add subtle tricolor border to cards and sections */
        .card, .section, .container, .property-card, .deal-card {
          border-image: linear-gradient(to right, #FF9933, white, #138808) 1 !important;
        }

        /* Add subtle tricolor underline to headings */
        h1, h2, h3 {
          background-image: linear-gradient(to right, #FF9933, white, #138808);
          background-position: 0 100%;
          background-size: 100% 2px;
          background-repeat: no-repeat;
        }
      `}</style>
    </>
  )
}

// Indian Flag SVG Component
function IndianFlagSVG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
      <circle cx="12" cy="12" r="11" fill="white" stroke="#000" strokeWidth="0.5" />
      <path d="M12 1C5.925 1 1 5.925 1 12H23C23 5.925 18.075 1 12 1Z" fill="#FF9933" />
      <path d="M12 23C18.075 23 23 18.075 23 12H1C1 18.075 5.925 23 12 23Z" fill="#138808" />
      <circle cx="12" cy="12" r="3" fill="#000080" />
      <circle cx="12" cy="12" r="2.5" fill="white" />
      <circle cx="12" cy="12" r="0.5" fill="#000080" />
      {/* 24 spokes of the Ashoka Chakra */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = 12 + 2.5 * Math.cos(angle);
        const y1 = 12 + 2.5 * Math.sin(angle);
        const x2 = 12 + 3 * Math.cos(angle);
        const y2 = 12 + 3 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#000080"
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

// Festive Confetti Component
function FestiveConfetti({ count = 30 }) {
  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const size = Math.random() * 10 + 5;
        const left = `${Math.random() * 100}%`;
        const animationDuration = `${Math.random() * 10 + 15}s`;
        const animationDelay = `${Math.random() * 5}s`;
        const color = i % 3 === 0 ? '#FF9933' : i % 3 === 1 ? 'white' : '#138808';
        
        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left,
              top: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: '50%',
              opacity: 0.6,
              animationDuration,
              animationDelay,
            }}
          />
        );
      })}
    </div>
  );
}