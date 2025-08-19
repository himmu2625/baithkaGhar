"use client"

import React from "react"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function MainLayout({ children, title, description }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      {title && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}
