"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
  category?: string
}

interface ModernMultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  onAddNew?: (label: string) => Promise<MultiSelectOption | null>
  allowAddNew?: boolean
}

export function ModernMultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  onAddNew,
  allowAddNew = false,
}: ModernMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options

    const searchLower = search.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  // Group by category
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, MultiSelectOption[]> = {}
    filteredOptions.forEach((option) => {
      const cat = option.category || "Other"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(option)
    })
    return groups
  }, [filteredOptions])

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleAddNew = async () => {
    if (!onAddNew || !search.trim() || isAdding) return

    setIsAdding(true)
    try {
      const newOption = await onAddNew(search.trim())
      if (newOption) {
        // Add the new option to selection
        onChange([...value, newOption.value])
        // Clear search and close dropdown
        setSearch("")
        setOpen(false)
      }
    } catch (error) {
      console.error("Failed to add new category:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const formatCategoryName = (cat: string) => {
    return cat
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Normalize label to Title Case (matches server-side normalization)
  const normalizeLabel = (label: string): string => {
    return label
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button - Matching your form style */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex w-full min-h-[42px] items-center justify-between rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium transition-all",
          "border-lightGreen hover:border-mediumGreen",
          "focus:outline-none focus:ring-2 focus:ring-mediumGreen focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          open && "border-mediumGreen ring-2 ring-mediumGreen ring-offset-2"
        )}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 pr-2">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="bg-lightGreen/40 text-darkGreen border border-mediumGreen/30 hover:bg-lightGreen/60 font-medium px-2.5 py-1 text-xs"
              >
                {option.label}
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(option.value, e)
                  }}
                  className="ml-1.5 hover:bg-mediumGreen/40 rounded-full p-0.5 transition-colors inline-flex items-center cursor-pointer"
                  role="button"
                  aria-label={`Remove ${option.label}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(option.value, e as any)
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))
          ) : (
            <span className="text-gray-600 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="h-5 w-5 text-mediumGreen shrink-0" />
      </button>

      {/* Dropdown - High z-index, clear styling */}
      {open && (
        <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-mediumGreen rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b-2 border-lightGreen/30 bg-lightGreen/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full px-3 py-2.5 text-sm font-medium text-darkGreen border-2 border-lightGreen rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mediumGreen focus:border-mediumGreen placeholder:text-gray-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-[320px] overflow-y-auto">
            {Object.keys(groupedOptions).length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-sm text-gray-600 font-medium mb-3">
                  No results found for &quot;{search}&quot;
                </div>
                {allowAddNew && search.trim() && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500">
                      Will be saved as: <span className="font-semibold text-mediumGreen">&quot;{normalizeLabel(search)}&quot;</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNew}
                      disabled={isAdding}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                        "bg-mediumGreen text-white hover:bg-darkGreen",
                        "focus:outline-none focus:ring-2 focus:ring-mediumGreen focus:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isAdding ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <span className="text-lg">+</span>
                          Add &quot;{normalizeLabel(search)}&quot; as new category
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category}>
                  {/* Category Header - Opaque background */}
                  <div className="px-4 py-2.5 text-xs font-bold text-mediumGreen uppercase bg-lightGreen sticky top-0 border-b border-lightGreen/30">
                    {formatCategoryName(category)}
                  </div>

                  {/* Category Options - Better contrast */}
                  {categoryOptions.map((option) => {
                    const isSelected = value.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggle(option.value)
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-all cursor-pointer border-b border-gray-100",
                          "hover:bg-lightGreen/30 active:bg-lightGreen/40",
                          isSelected && "bg-lightGreen/50 hover:bg-lightGreen/60"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-5 w-5 text-mediumGreen shrink-0 mt-0.5 font-bold",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-darkGreen">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-700 mt-1 font-normal">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
