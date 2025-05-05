"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
  mode?: "fade" | "slide-up" | "slide-left";
  delay?: number;
  duration?: number;
};

export default function PageTransition({
  children,
  className = "",
  mode = "fade",
  delay = 0,
  duration = 300,
}: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(false);
    
    // Reset on route change
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [pathname, delay]);
  
  // Determine animation class based on mode
  const animationClass = mode === "slide-up" 
    ? "animate-slideUp" 
    : mode === "slide-left" 
      ? "animate-slideLeft" 
      : "animate-fadeIn";
  
  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible 
      ? "translateY(0) translateX(0)" 
      : mode === "slide-up" 
        ? "translateY(10px)" 
        : mode === "slide-left" 
          ? "translateX(10px)" 
          : "translateY(0)",
    transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-out`,
  };
  
  return (
    <div 
      className={`${className} ${isVisible ? animationClass : ''}`}
      style={style}
    >
      {children}
    </div>
  );
} 