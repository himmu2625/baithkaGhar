"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5", 
  lg: "w-6 h-6",
  xl: "w-8 h-8"
};

// Location Pin Icon - Enhanced with gradient and travel theme
export const LocationIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`locationGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id={`locationGlow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
          fill={`url(#locationGradient-${id})`}
          filter={`url(#locationGlow-${id})`}
          className="drop-shadow-sm"
        />
        <circle cx="12" cy="10" r="3" fill="white" className="drop-shadow-sm" />
        <circle cx="12" cy="10" r="1.5" fill={`url(#locationGradient-${id})`} />
      </svg>
    </div>
  );
};

// Calendar Icon - Enhanced with depth and modern look
export const CalendarIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`calendarGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id={`calendarAccent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        {/* Calendar base */}
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={`url(#calendarGradient-${id})`} className="drop-shadow-md"/>
        {/* Calendar header */}
        <rect x="3" y="4" width="18" height="4" rx="2" ry="2" fill={`url(#calendarAccent-${id})`}/>
        {/* Calendar rings */}
        <rect x="7" y="2" width="2" height="4" rx="1" fill={`url(#calendarAccent-${id})`}/>
        <rect x="15" y="2" width="2" height="4" rx="1" fill={`url(#calendarAccent-${id})`}/>
        {/* Calendar grid */}
        <circle cx="8" cy="12" r="1" fill="white" opacity="0.8"/>
        <circle cx="12" cy="12" r="1" fill="white" opacity="0.8"/>
        <circle cx="16" cy="12" r="1" fill="white" opacity="0.8"/>
        <circle cx="8" cy="16" r="1" fill="white" opacity="0.8"/>
        <circle cx="12" cy="16" r="1.5" fill="#10B981"/>
        <circle cx="16" cy="16" r="1" fill="white" opacity="0.8"/>
      </svg>
    </div>
  );
};

// Users/Guests Icon - Enhanced with people silhouettes
export const GuestsIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`guestsGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {/* First person */}
        <circle cx="9" cy="7" r="3" fill={`url(#guestsGradient-${id})`} className="drop-shadow-sm"/>
        <path d="M2 21v-2a5 5 0 0 1 8-4" stroke={`url(#guestsGradient-${id})`} strokeWidth="2" fill="none" className="drop-shadow-sm"/>
        {/* Second person */}
        <circle cx="16" cy="7" r="3" fill={`url(#guestsGradient-${id})`} className="drop-shadow-sm"/>
        <path d="M22 21v-2a5 5 0 0 0-8-4" stroke={`url(#guestsGradient-${id})`} strokeWidth="2" fill="none" className="drop-shadow-sm"/>
        {/* Third person (background) */}
        <circle cx="12.5" cy="8" r="2.5" fill={`url(#guestsGradient-${id})`} opacity="0.7" className="drop-shadow-sm"/>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" stroke={`url(#guestsGradient-${id})`} strokeWidth="2" fill="none" opacity="0.7"/>
      </svg>
    </div>
  );
};

// Search Icon - Enhanced with magnifying glass effect
export const SearchIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`searchGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id={`lensGradient-${id}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* Search circle */}
        <circle cx="11" cy="11" r="8" stroke={`url(#searchGradient-${id})`} strokeWidth="3" className="drop-shadow-md"/>
        {/* Lens effect */}
        <circle cx="11" cy="11" r="8" fill={`url(#lensGradient-${id})`}/>
        {/* Search handle */}
        <path d="m21 21-4.35-4.35" stroke={`url(#searchGradient-${id})`} strokeWidth="3" strokeLinecap="round" className="drop-shadow-md"/>
        {/* Inner glow */}
        <circle cx="11" cy="11" r="5" stroke="white" strokeWidth="1" opacity="0.3"/>
      </svg>
    </div>
  );
};

// Star Rating Icon - Enhanced with glow effect
export const StarIcon = ({ className, size = "md", filled = true }: IconProps & { filled?: boolean }) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`starGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id={`starGlow-${id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filled ? `url(#starGradient-${id})` : "none"}
          stroke={`url(#starGradient-${id})`}
          strokeWidth={filled ? "0" : "2"}
          filter={filled ? `url(#starGlow-${id})` : "none"}
          className="drop-shadow-sm"
        />
        {filled && (
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#starGradient-${id})`}
            opacity="0.8"
          />
        )}
      </svg>
    </div>
  );
};

// Building/Hotel Icon - Enhanced with architectural details
export const BuildingIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`hotelGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id={`hotelAccent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        {/* Building base */}
        <rect x="3" y="4" width="18" height="17" rx="1" fill={`url(#hotelGradient-${id})`} className="drop-shadow-lg"/>
        {/* Entrance */}
        <rect x="10" y="16" width="4" height="5" fill={`url(#hotelAccent-${id})`}/>
        {/* Windows row 1 */}
        <rect x="6" y="7" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        <rect x="11" y="7" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        <rect x="16" y="7" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        {/* Windows row 2 */}
        <rect x="6" y="11" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        <rect x="11" y="11" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        <rect x="16" y="11" width="2" height="2" rx="0.5" fill={`url(#hotelAccent-${id})`} opacity="0.8"/>
        {/* Roof */}
        <polygon points="2,4 12,1 22,4" fill={`url(#hotelAccent-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Heart Icon - Enhanced with romantic glow
export const HeartIcon = ({ className, size = "md", filled = false }: IconProps & { filled?: boolean }) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`heartGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <filter id={`heartGlow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill={filled ? `url(#heartGradient-${id})` : "none"}
          stroke={`url(#heartGradient-${id})`}
          strokeWidth={filled ? "0" : "2"}
          filter={filled ? `url(#heartGlow-${id})` : "none"}
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );
};

// Credit Card Icon - Enhanced with card design
export const CreditCardIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`cardGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id={`cardStripe-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        {/* Card base */}
        <rect x="2" y="5" width="20" height="14" rx="3" ry="3" fill={`url(#cardGradient-${id})`} className="drop-shadow-lg"/>
        {/* Magnetic stripe */}
        <rect x="2" y="9" width="20" height="3" fill={`url(#cardStripe-${id})`}/>
        {/* Chip */}
        <rect x="5" y="13" width="3" height="2" rx="0.5" fill="#E5E7EB"/>
        {/* Card number dots */}
        <circle cx="11" cy="14" r="0.5" fill="#E5E7EB"/>
        <circle cx="13" cy="14" r="0.5" fill="#E5E7EB"/>
        <circle cx="15" cy="14" r="0.5" fill="#E5E7EB"/>
        <circle cx="17" cy="14" r="0.5" fill="#E5E7EB"/>
      </svg>
    </div>
  );
};

// Social Media Icons - Enhanced with brand colors and modern design

// Facebook Icon - Enhanced with brand blue gradient
export const FacebookIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`facebookGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4267B2" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <filter id={`facebookGlow-${id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="4" fill={`url(#facebookGradient-${id})`} filter={`url(#facebookGlow-${id})`} className="drop-shadow-lg"/>
        <path d="M18.77 7.46H15.5v-1.9c0-.9.6-1.1 1-1.1h2.2v-3.4H15.5c-2.8 0-5.1 2.2-5.1 5.1v1.3H7.7v3.4h2.7V22h4.1v-11.1h2.6l.57-3.4z" fill="white"/>
      </svg>
    </div>
  );
};

// Instagram Icon - Enhanced with colorful gradient
export const InstagramIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`instagramGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="25%" stopColor="#FF8E53" />
            <stop offset="50%" stopColor="#FF6B6B" />
            <stop offset="75%" stopColor="#C13584" />
            <stop offset="100%" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#instagramGradient-${id})`} className="drop-shadow-lg"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
        <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
      </svg>
    </div>
  );
};

// Twitter Icon - Enhanced with brand blue
export const TwitterIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`twitterGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1DA1F2" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="4" fill={`url(#twitterGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M8 19c7 0 11-6 11-11v-0.5c0.8-0.6 1.5-1.3 2-2.1-0.7 0.3-1.5 0.5-2.3 0.6 0.8-0.5 1.4-1.3 1.7-2.2-0.8 0.5-1.6 0.8-2.5 1-0.7-0.8-1.7-1.3-2.8-1.3-2.1 0-3.8 1.7-3.8 3.8 0 0.3 0 0.6 0.1 0.9-3.1-0.2-5.9-1.6-7.7-3.9-0.3 0.6-0.5 1.2-0.5 1.9 0 1.3 0.7 2.5 1.7 3.2-0.6 0-1.2-0.2-1.7-0.5v0c0 1.8 1.3 3.3 3 3.7-0.3 0.1-0.6 0.1-1 0.1-0.2 0-0.5 0-0.7-0.1 0.5 1.5 1.9 2.6 3.6 2.6-1.3 1-3 1.6-4.8 1.6-0.3 0-0.6 0-0.9-0.1 1.7 1.1 3.8 1.7 6 1.7z" fill="white"/>
      </svg>
    </div>
  );
};

// LinkedIn Icon - Enhanced with professional blue
export const LinkedinIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`linkedinGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0077B5" />
            <stop offset="100%" stopColor="#004182" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="4" fill={`url(#linkedinGradient-${id})`} className="drop-shadow-lg"/>
        <rect x="6" y="9" width="2" height="8" fill="white"/>
        <circle cx="7" cy="6.5" r="1" fill="white"/>
        <path d="M12 9v8h2v-4c0-1.1 0.9-2 2-2s2 0.9 2 2v4h2v-4.5c0-2.5-2-4.5-4.5-4.5S12 10 12 12.5z" fill="white"/>
      </svg>
    </div>
  );
};

// YouTube Icon - Enhanced with red gradient
export const YoutubeIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`youtubeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" />
            <stop offset="100%" stopColor="#CC0000" />
          </linearGradient>
        </defs>
        <rect x="2" y="5" width="20" height="14" rx="4" fill={`url(#youtubeGradient-${id})`} className="drop-shadow-lg"/>
        <polygon points="10,8 10,16 16,12" fill="white"/>
      </svg>
    </div>
  );
};

// Mail Icon - Enhanced with gradient and envelope design
export const MailIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`mailGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <rect x="2" y="4" width="20" height="16" rx="2" fill={`url(#mailGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M2 6l10 6 10-6" stroke="white" strokeWidth="2" fill="none"/>
        <rect x="2" y="4" width="20" height="2" fill="url(#mailGradient-${id})"/>
      </svg>
    </div>
  );
};

// Phone Icon - Enhanced with communication theme
export const PhoneIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`phoneGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={`url(#phoneGradient-${id})`} className="drop-shadow-lg"/>
      </svg>
    </div>
  );
};

// Send Icon - Enhanced for newsletter signup
export const SendIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`sendGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M2 3l20 9L2 21l4-9-4-9z" fill={`url(#sendGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M6 12h16" stroke="white" strokeWidth="1.5"/>
      </svg>
    </div>
  );
};

// Shield Icon - Enhanced for security/admin
export const ShieldIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`shieldGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={`url(#shieldGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Help/Question Icon - Enhanced with modern design
export const HelpIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`helpGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill={`url(#helpGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="17" r="1" fill="white"/>
      </svg>
    </div>
  );
};

// Sparkles Icon - Enhanced with magical effect
export const SparklesIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`sparklesGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill={`url(#sparklesGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M19 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill={`url(#sparklesGradient-${id})`}/>
        <path d="M6 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill={`url(#sparklesGradient-${id})`}/>
      </svg>
    </div>
  );
};

// Chart/Analytics Icon - Enhanced for dashboard
export const ChartIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`chartGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="2" fill={`url(#chartGradient-${id})`} className="drop-shadow-lg"/>
        <path d="M8 12v4h2v-4z" fill="white"/>
        <path d="M12 8v8h2V8z" fill="white"/>
        <path d="M16 10v6h2v-6z" fill="white"/>
      </svg>
    </div>
  );
};

// Arrow Right Icon - Enhanced for navigation
export const ArrowRightIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`arrowGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path d="M5 12h14M12 5l7 7-7 7" stroke={`url(#arrowGradient-${id})`} strokeWidth="2.5" fill="none" className="drop-shadow-sm"/>
      </svg>
    </div>
  );
};

// ===== ADMIN PANEL ICONS =====

// Dashboard Icon - Enhanced for admin dashboard
export const DashboardIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`dashboardGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="7" height="7" rx="1" fill={`url(#dashboardGradient-${id})`} className="drop-shadow-md"/>
        <rect x="14" y="3" width="7" height="7" rx="1" fill={`url(#dashboardGradient-${id})`} className="drop-shadow-md"/>
        <rect x="3" y="14" width="7" height="7" rx="1" fill={`url(#dashboardGradient-${id})`} className="drop-shadow-md"/>
        <rect x="14" y="14" width="7" height="7" rx="1" fill={`url(#dashboardGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Users Icon - Enhanced for user management
export const UsersIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`usersGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={`url(#usersGradient-${id})`} strokeWidth="2" fill="none"/>
        <circle cx="9" cy="7" r="4" fill={`url(#usersGradient-${id})`} className="drop-shadow-md"/>
        <path d="m22 21-3.5-3.5" stroke={`url(#usersGradient-${id})`} strokeWidth="2"/>
        <circle cx="19" cy="7" r="3" fill={`url(#usersGradient-${id})`} className="drop-shadow-md opacity-80"/>
      </svg>
    </div>
  );
};

// Analytics/BarChart Icon - Enhanced for analytics
export const AnalyticsIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`analyticsGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="3" y="12" width="4" height="9" rx="1" fill={`url(#analyticsGradient-${id})`} className="drop-shadow-md"/>
        <rect x="10" y="8" width="4" height="13" rx="1" fill={`url(#analyticsGradient-${id})`} className="drop-shadow-md"/>
        <rect x="17" y="4" width="4" height="17" rx="1" fill={`url(#analyticsGradient-${id})`} className="drop-shadow-md"/>
        <path d="M3 3v18h18" stroke={`url(#analyticsGradient-${id})`} strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Settings Icon - Enhanced for admin settings
export const SettingsIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`settingsGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="3" fill={`url(#settingsGradient-${id})`} className="drop-shadow-md"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={`url(#settingsGradient-${id})`} strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Bell/Notification Icon - Enhanced for admin notifications
export const BellIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`bellGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={`url(#bellGradient-${id})`} className="drop-shadow-md"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={`url(#bellGradient-${id})`} strokeWidth="2" fill="none"/>
        <circle cx="18" cy="6" r="3" fill="#EF4444" className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Edit Icon - Enhanced for admin editing
export const EditIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`editGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={`url(#editGradient-${id})`} strokeWidth="2" fill="none"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill={`url(#editGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Delete/Trash Icon - Enhanced for admin delete actions
export const DeleteIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`deleteGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <path d="M3 6h18" stroke={`url(#deleteGradient-${id})`} strokeWidth="2"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={`url(#deleteGradient-${id})`} strokeWidth="2" fill="none"/>
        <rect x="8" y="10" width="2" height="8" fill={`url(#deleteGradient-${id})`} className="drop-shadow-md"/>
        <rect x="14" y="10" width="2" height="8" fill={`url(#deleteGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Eye/View Icon - Enhanced for admin viewing
export const EyeIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`eyeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={`url(#eyeGradient-${id})`} strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="3" fill={`url(#eyeGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Download Icon - Enhanced for admin downloads
export const DownloadIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`downloadGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={`url(#downloadGradient-${id})`} strokeWidth="2" fill="none"/>
        <polyline points="7,10 12,15 17,10" stroke={`url(#downloadGradient-${id})`} strokeWidth="2" fill="none"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke={`url(#downloadGradient-${id})`} strokeWidth="2"/>
      </svg>
    </div>
  );
};

// Upload Icon - Enhanced for admin uploads
export const UploadIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`uploadGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={`url(#uploadGradient-${id})`} strokeWidth="2" fill="none"/>
        <polyline points="17,8 12,3 7,8" stroke={`url(#uploadGradient-${id})`} strokeWidth="2" fill="none"/>
        <line x1="12" y1="3" x2="12" y2="15" stroke={`url(#uploadGradient-${id})`} strokeWidth="2"/>
      </svg>
    </div>
  );
};

// Filter Icon - Enhanced for admin filtering
export const FilterIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`filterGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" fill={`url(#filterGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Check Icon - Enhanced for admin confirmations
export const CheckIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`checkGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill={`url(#checkGradient-${id})`} className="drop-shadow-md"/>
        <polyline points="9,12 11,14 15,10" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// X/Close Icon - Enhanced for admin cancellations
export const CloseIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`closeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill={`url(#closeGradient-${id})`} className="drop-shadow-md"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  );
};

// Clock Icon - Enhanced for admin time tracking
export const ClockIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`clockGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill={`url(#clockGradient-${id})`} className="drop-shadow-md"/>
        <polyline points="12,6 12,12 16,14" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Refresh Icon - Enhanced for admin refresh actions
export const RefreshIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`refreshGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={`url(#refreshGradient-${id})`} strokeWidth="2" fill="none"/>
        <path d="M3 3v5h5" stroke={`url(#refreshGradient-${id})`} strokeWidth="2" fill="none"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" stroke={`url(#refreshGradient-${id})`} strokeWidth="2" fill="none"/>
        <path d="M21 21v-5h-5" stroke={`url(#refreshGradient-${id})`} strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Lock Icon - Enhanced for admin security
export const LockIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`lockGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill={`url(#lockGradient-${id})`} className="drop-shadow-md"/>
        <circle cx="12" cy="7" r="4" stroke={`url(#lockGradient-${id})`} strokeWidth="2" fill="none"/>
        <circle cx="12" cy="16" r="2" fill="white"/>
      </svg>
    </div>
  );
};

// Flag Icon - Enhanced for admin reports/flags
export const FlagIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`flagGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={`url(#flagGradient-${id})`} className="drop-shadow-md"/>
        <line x1="4" y1="22" x2="4" y2="15" stroke={`url(#flagGradient-${id})`} strokeWidth="2"/>
      </svg>
    </div>
  );
};

// Menu Icon - Enhanced for admin menu toggle
export const MenuIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`menuGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>
        <line x1="3" y1="6" x2="21" y2="6" stroke={`url(#menuGradient-${id})`} strokeWidth="2"/>
        <line x1="3" y1="12" x2="21" y2="12" stroke={`url(#menuGradient-${id})`} strokeWidth="2"/>
        <line x1="3" y1="18" x2="21" y2="18" stroke={`url(#menuGradient-${id})`} strokeWidth="2"/>
      </svg>
    </div>
  );
};

// LogOut Icon - Enhanced for admin logout
export const LogOutIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`logoutGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={`url(#logoutGradient-${id})`} strokeWidth="2" fill="none"/>
        <polyline points="16,17 21,12 16,7" stroke={`url(#logoutGradient-${id})`} strokeWidth="2" fill="none"/>
        <line x1="21" y1="12" x2="9" y2="12" stroke={`url(#logoutGradient-${id})`} strokeWidth="2"/>
      </svg>
    </div>
  );
};

// User Profile Icon - Enhanced for admin user management
export const UserIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`userGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={`url(#userGradient-${id})`} strokeWidth="2" fill="none"/>
        <circle cx="12" cy="7" r="4" fill={`url(#userGradient-${id})`} className="drop-shadow-md"/>
      </svg>
    </div>
  );
};

// Trending Up Icon - Enhanced for admin growth metrics
export const TrendingUpIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`trendingUpGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke={`url(#trendingUpGradient-${id})`} strokeWidth="2" fill="none"/>
        <polyline points="16,7 22,7 22,13" stroke={`url(#trendingUpGradient-${id})`} strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Save Icon - Enhanced for admin save actions
export const SaveIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`saveGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill={`url(#saveGradient-${id})`} className="drop-shadow-md"/>
        <polyline points="17,21 17,13 7,13 7,21" stroke="white" strokeWidth="2" fill="none"/>
        <polyline points="7,3 7,8 15,8" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Alert Triangle Icon - Enhanced for admin warnings
export const AlertTriangleIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`alertGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill={`url(#alertGradient-${id})`} className="drop-shadow-md"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2"/>
        <circle cx="12" cy="17" r="1" fill="white"/>
      </svg>
    </div>
  );
};

// More Horizontal (3 dots) Icon - Enhanced for admin menus
export const MoreHorizontalIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`moreGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="1" fill={`url(#moreGradient-${id})`}/>
        <circle cx="19" cy="12" r="1" fill={`url(#moreGradient-${id})`}/>
        <circle cx="5" cy="12" r="1" fill={`url(#moreGradient-${id})`}/>
      </svg>
    </div>
  );
};

// Home Icon - Enhanced for admin dashboard home
export const HomeIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`homeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={`url(#homeGradient-${id})`} className="drop-shadow-md"/>
        <polyline points="9,22 9,12 15,12 15,22" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Message Square Icon - Enhanced for admin messaging
export const MessageSquareIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`messageGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={`url(#messageGradient-${id})`} className="drop-shadow-md"/>
        <line x1="8" y1="10" x2="16" y2="10" stroke="white" strokeWidth="1.5"/>
        <line x1="8" y1="14" x2="13" y2="14" stroke="white" strokeWidth="1.5"/>
      </svg>
    </div>
  );
};

// Indian Rupee Icon - Enhanced for admin financial management
export const IndianRupeeIcon = ({ className, size = "md" }: IconProps) => {
  const id = useId();
  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`rupeeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill={`url(#rupeeGradient-${id})`} className="drop-shadow-md"/>
        <path d="M6 7h8M6 11h8l-6 6" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M6 11h3a3 3 0 0 0 0-6" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
};

// Export all icons for easy importing
export const EnhancedIcons = {
  Location: LocationIcon,
  Calendar: CalendarIcon,
  Guests: GuestsIcon,
  Search: SearchIcon,
  Star: StarIcon,
  Building: BuildingIcon,
  Heart: HeartIcon,
  CreditCard: CreditCardIcon,
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  LinkedIn: LinkedinIcon,
  YouTube: YoutubeIcon,
  Mail: MailIcon,
  Phone: PhoneIcon,
  Send: SendIcon,
  Shield: ShieldIcon,
  Help: HelpIcon,
  Sparkles: SparklesIcon,
  Chart: ChartIcon,
  ArrowRight: ArrowRightIcon,
  // Admin Panel Icons
  Dashboard: DashboardIcon,
  Users: UsersIcon,
  Analytics: AnalyticsIcon,
  Settings: SettingsIcon,
  Bell: BellIcon,
  Edit: EditIcon,
  Delete: DeleteIcon,
  Eye: EyeIcon,
  Download: DownloadIcon,
  Upload: UploadIcon,
  Filter: FilterIcon,
  Check: CheckIcon,
  Close: CloseIcon,
  Clock: ClockIcon,
  Refresh: RefreshIcon,
  Lock: LockIcon,
  Flag: FlagIcon,
  Menu: MenuIcon,
  LogOut: LogOutIcon,
  User: UserIcon,
  TrendingUp: TrendingUpIcon,
  Save: SaveIcon,
  AlertTriangle: AlertTriangleIcon,
  MoreHorizontal: MoreHorizontalIcon,
  Home: HomeIcon,
  MessageSquare: MessageSquareIcon,
  IndianRupee: IndianRupeeIcon,
}; 