"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: () => void;
  text?: string;
  showText?: boolean;
}

export function BackButton({ 
  className, 
  variant = "ghost", 
  size = "default",
  onClick,
  text = "Back",
  showText = true
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-2 hover:gap-3 transition-all duration-200 hover:scale-105",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 group-hover:animate-pulse" />
      {showText && <span>{text}</span>}
    </Button>
  );
} 