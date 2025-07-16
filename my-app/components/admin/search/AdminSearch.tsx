"use client"

import React, { useState } from 'react'
import { SearchIcon, CloseIcon } from "@/components/ui/enhanced-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command"

interface SearchResult {
  id: string
  title: string
  type: 'property' | 'booking' | 'user' | 'payment'
  icon: React.ReactNode
  href: string
}

interface AdminSearchProps {
  placeholder?: string
  onSubmit?: (value: string) => void
}

export function AdminSearch({ placeholder = "Search...", onSubmit }: AdminSearchProps) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  
  // Real search implementation - fetches from API
  const performSearch = async (query: string) => {
    setIsLoading(true)
    
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        console.error('Search API failed')
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(value)
    }
    performSearch(value)
    setOpen(true)
  }
  
  const handleSelect = (result: SearchResult) => {
    // In a real implementation, this would navigate to the result URL
    console.log('Selected result:', result)
    setOpen(false)
    
    // Mock navigation could be implemented with router.push(result.href)
  }
  
  return (
    <>
      <form onSubmit={handleSearch} className="relative w-full">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" size="sm" />
        <Input
          placeholder={placeholder}
          className="pl-8 pr-10"
          value={value}
          onChange={e => setValue(e.target.value)}
          onClick={() => {
            if (value.trim()) {
              setOpen(true)
              performSearch(value)
            }
          }}
        />
        {value && (
          <button 
            type="button"
            className="absolute right-2.5 top-2.5"
            onClick={() => setValue('')}
          >
            <CloseIcon className="h-4 w-4 text-gray-500 hover:text-gray-900" size="sm" />
          </button>
        )}
      </form>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search properties, bookings, users..." 
          value={value}
          onValueChange={setValue}
        />
        <CommandList>
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.length > 0 && (
                <CommandGroup heading="Results">
                  {results.map(result => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 py-3"
                    >
                      {result.icon}
                      <div>
                        <p className="font-medium">{result.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{result.type} • {result.id}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem 
                  onSelect={() => {
                    setOpen(false)
                    if (onSubmit) {
                      onSubmit(value)
                    }
                  }}
                  className="justify-center text-center py-3"
                >
                  <Button variant="outline" className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Search for "{value}"
                  </Button>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 