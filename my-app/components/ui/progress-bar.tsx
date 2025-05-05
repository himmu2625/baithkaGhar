"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// The actual ProgressBar component that uses hooks from 'next/navigation'
export function ProgressBarImpl() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reset progress when the route changes
    setProgress(0);
    
    // Show progress bar
    setVisible(true);
    
    // Calculate estimated load time based on route complexity
    // More complex routes may take longer to load
    const isComplexRoute = pathname?.includes('/property/') || 
                           pathname?.includes('/dashboard/') || 
                           pathname?.includes('/checkout/');
    
    const loadTimeMultiplier = isComplexRoute ? 1.5 : 1;
    const baseSpeed = 80; // ms between increments
    
    // Simulate loading progress with varying speed
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Initially fast, then slows down as we get closer to 90%
        const speedFactor = prevProgress < 30 ? 3 : 
                            prevProgress < 60 ? 2 : 
                            prevProgress < 80 ? 1 : 0.5;
        
        const increment = Math.max(0.5, speedFactor * (100 - prevProgress) / 20);
        const nextProgress = prevProgress + increment;
        
        // Cap at 90% until complete
        return nextProgress > 90 ? 90 : nextProgress;
      });
    }, baseSpeed * loadTimeMultiplier);
    
    // Complete progress after a short delay
    const timer = setTimeout(() => {
      setProgress(100);
      // Fade out after reaching 100%
      setTimeout(() => setVisible(false), 300);
    }, 300);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-transparent">
      <div 
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/70 transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          transition: progress === 100 ? 'width 200ms ease-out, opacity 300ms ease-out' : 'width 200ms ease-out',
          opacity: progress === 100 ? 0 : 1
        }}
      />
    </div>
  );
}

// Default export for easy use in layout.tsx that handles Suspense
export default function ProgressBar() {
  return <ProgressBarImpl />;
} 