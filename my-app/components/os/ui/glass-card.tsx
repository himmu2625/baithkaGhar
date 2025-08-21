"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "gradient" | "subtle" | "vibrant"
  blur?: "sm" | "md" | "lg" | "xl"
  opacity?: number
  hover?: boolean
}

export function GlassCard({
  children,
  className,
  variant = "default",
  blur = "md",
  opacity = 0.1,
  hover = true,
}: GlassCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-br from-white/20 via-white/10 to-transparent border-white/20"
      case "subtle":
        return "bg-white/5 border-white/10"
      case "vibrant":
        return "bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-indigo-500/20 border-white/30"
      default:
        return `bg-white/${Math.round(opacity * 100)} border-white/20`
    }
  }

  const getBlurClass = () => {
    switch (blur) {
      case "sm":
        return "backdrop-blur-sm"
      case "lg":
        return "backdrop-blur-lg"
      case "xl":
        return "backdrop-blur-xl"
      default:
        return "backdrop-blur-md"
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border shadow-2xl",
        getBlurClass(),
        getVariantStyles(),
        hover && "transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/20",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
        hover && "hover:before:opacity-100",
        className
      )}
    >
      {children}
      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
    </div>
  )
}

interface GlassCardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function GlassCardHeader({ children, className }: GlassCardHeaderProps) {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  )
}

interface GlassCardContentProps {
  children: React.ReactNode
  className?: string
}

export function GlassCardContent({ children, className }: GlassCardContentProps) {
  return (
    <div className={cn("px-6 pb-6", className)}>
      {children}
    </div>
  )
}

interface GlassCardTitleProps {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function GlassCardTitle({ children, className, icon }: GlassCardTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold text-white flex items-center gap-2", className)}>
      {icon}
      {children}
    </h3>
  )
}

interface GlassCardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function GlassCardDescription({ children, className }: GlassCardDescriptionProps) {
  return (
    <p className={cn("text-sm text-white/70 mt-1", className)}>
      {children}
    </p>
  )
}