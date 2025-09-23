'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useKeyboardNavigation, useAriaAnnouncements } from '@/hooks/useAccessibility'

interface NavigationItem {
  id: string
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  submenu?: NavigationItem[]
}

interface AccessibleNavigationProps {
  items: NavigationItem[]
  activeId?: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
  ariaLabel?: string
}

export function AccessibleNavigation({
  items,
  activeId,
  orientation = 'horizontal',
  className = '',
  ariaLabel = 'Main navigation'
}: AccessibleNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<(HTMLElement | null)[]>([])
  const { handleKeyNavigation } = useKeyboardNavigation()
  const { announce } = useAriaAnnouncements()

  useEffect(() => {
    // Set initial focus to active item
    const activeIndex = items.findIndex(item => item.id === activeId)
    if (activeIndex !== -1) {
      setFocusedIndex(activeIndex)
    }
  }, [activeId, items])

  const focusItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      setFocusedIndex(index)
      itemsRef.current[index]?.focus()
    }
  }

  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    item: NavigationItem,
    index: number
  ) => {
    const isHorizontal = orientation === 'horizontal'

    handleKeyNavigation(e, {
      onArrowUp: () => {
        if (!isHorizontal) {
          const nextIndex = index > 0 ? index - 1 : items.length - 1
          focusItem(nextIndex)
        }
      },
      onArrowDown: () => {
        if (!isHorizontal) {
          const nextIndex = index < items.length - 1 ? index + 1 : 0
          focusItem(nextIndex)
        } else if (item.submenu) {
          setOpenSubmenu(item.id)
          announce(`${item.label} submenu opened`)
        }
      },
      onArrowLeft: () => {
        if (isHorizontal) {
          const nextIndex = index > 0 ? index - 1 : items.length - 1
          focusItem(nextIndex)
        } else if (openSubmenu) {
          setOpenSubmenu(null)
          announce('Submenu closed')
        }
      },
      onArrowRight: () => {
        if (isHorizontal) {
          const nextIndex = index < items.length - 1 ? index + 1 : 0
          focusItem(nextIndex)
        } else if (item.submenu) {
          setOpenSubmenu(item.id)
          announce(`${item.label} submenu opened`)
        }
      },
      onEnter: () => {
        if (item.submenu) {
          setOpenSubmenu(openSubmenu === item.id ? null : item.id)
          announce(`${item.label} submenu ${openSubmenu === item.id ? 'closed' : 'opened'}`)
        } else {
          item.onClick?.()
          announce(`${item.label} activated`)
        }
      },
      onSpace: () => {
        if (item.submenu) {
          setOpenSubmenu(openSubmenu === item.id ? null : item.id)
          announce(`${item.label} submenu ${openSubmenu === item.id ? 'closed' : 'opened'}`)
        } else {
          item.onClick?.()
          announce(`${item.label} activated`)
        }
      },
      onEscape: () => {
        if (openSubmenu) {
          setOpenSubmenu(null)
          announce('Submenu closed')
        }
      }
    })
  }

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return

    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.id ? null : item.id)
    } else {
      item.onClick?.()
      setOpenSubmenu(null)
    }
  }

  const renderNavigationItem = (item: NavigationItem, index: number) => {
    const isActive = item.id === activeId
    const isFocused = index === focusedIndex
    const hasSubmenu = Boolean(item.submenu)
    const isSubmenuOpen = openSubmenu === item.id

    const itemClasses = [
      'relative flex items-center px-3 py-2 rounded-md text-sm font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      'transition-colors duration-200',
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ].join(' ')

    const ItemContent = () => (
      <>
        {item.icon && (
          <span className="mr-2" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
        {item.badge && (
          <span
            className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
            aria-label={`${item.badge} notifications`}
          >
            {item.badge}
          </span>
        )}
        {hasSubmenu && (
          <svg
            className={`ml-2 h-4 w-4 transition-transform ${
              isSubmenuOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </>
    )

    return (
      <li key={item.id} className="relative">
        {item.href ? (
          <a
            ref={(el) => (itemsRef.current[index] = el)}
            href={item.href}
            className={itemClasses}
            aria-current={isActive ? 'page' : undefined}
            aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
            aria-haspopup={hasSubmenu ? 'menu' : undefined}
            tabIndex={isFocused || index === 0 ? 0 : -1}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            onClick={() => handleItemClick(item)}
          >
            <ItemContent />
          </a>
        ) : (
          <button
            ref={(el) => (itemsRef.current[index] = el)}
            className={itemClasses}
            aria-current={isActive ? 'page' : undefined}
            aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
            aria-haspopup={hasSubmenu ? 'menu' : undefined}
            disabled={item.disabled}
            tabIndex={isFocused || index === 0 ? 0 : -1}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            onClick={() => handleItemClick(item)}
          >
            <ItemContent />
          </button>
        )}

        {/* Submenu */}
        {hasSubmenu && isSubmenuOpen && (
          <ul
            className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            role="menu"
            aria-labelledby={`nav-item-${item.id}`}
          >
            {item.submenu!.map((subItem, subIndex) => (
              <li key={subItem.id} role="none">
                {subItem.href ? (
                  <a
                    href={subItem.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    role="menuitem"
                    onClick={() => setOpenSubmenu(null)}
                  >
                    {subItem.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {subItem.icon}
                      </span>
                    )}
                    {subItem.label}
                  </a>
                ) : (
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    role="menuitem"
                    disabled={subItem.disabled}
                    onClick={() => {
                      subItem.onClick?.()
                      setOpenSubmenu(null)
                    }}
                  >
                    {subItem.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {subItem.icon}
                      </span>
                    )}
                    {subItem.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  const navClasses = [
    orientation === 'horizontal' ? 'flex space-x-1' : 'space-y-1',
    className
  ].join(' ')

  return (
    <nav
      ref={navRef}
      className={navClasses}
      aria-label={ariaLabel}
      role="navigation"
    >
      <ul
        className={orientation === 'horizontal' ? 'flex space-x-1' : 'space-y-1'}
        role="menubar"
        aria-orientation={orientation}
      >
        {items.map((item, index) => renderNavigationItem(item, index))}
      </ul>
    </nav>
  )
}

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function AccessibleBreadcrumb({ items, className = '' }: AccessibleBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}

              {isLast ? (
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={item.onClick}
                  className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}