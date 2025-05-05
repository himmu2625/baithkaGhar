"use client"

import type React from "react"

import Link from "next/link"
import { useLoginPrompt } from "@/hooks/use-login-prompt"

interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function ProtectedLink({ href, children, className, onClick }: ProtectedLinkProps) {
  const { isLoggedIn, promptLogin } = useLoginPrompt()

  const handleClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      promptLogin()
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
