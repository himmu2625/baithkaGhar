"use client"

import React, { useState } from 'react'
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  
  // Mock search results - in a real implementation this would be fetched from an API
  const mockSearch = async (query: string) => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }
    
    // Generate mock results based on query
    const mockResults: SearchResult[] = [
      {
        id: 'prop_12345',
        title: 'Mountain View Villa',
        type: 'property',
        icon: <div className="bg-green-100 text-green-800 w-8 h-8 rounded-full flex items-center justify-center">P</div>,
        href: '/admin/properties/prop_12345'
      },
      {
        id: 'book_67890',
        title: 'Booking #67890 - Rahul Sharma',
        type: 'booking',
        icon: <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center">B</div>,
        href: '/admin/bookings?id=book_67890'
      },
      {
        id: 'usr_54321',
        title: 'Priya Patel',
        type: 'user',
        icon: <div className="bg-purple-100 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center">U</div>,
        href: '/admin/users/usr_54321'
      },
      {
        id: 'pay_98765',
        title: 'Payment #98765 - ₹15,000',
        type: 'payment',
        icon: <div className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center">P</div>,
        href: '/admin/payments/pay_98765'
      }
    ]
    
    setResults(mockResults)
    setIsLoading(false)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(value)
    }
    mockSearch(value)
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
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder={placeholder}
          className="pl-8 pr-10"
          value={value}
          onChange={e => setValue(e.target.value)}
          onClick={() => {
            if (value.trim()) {
              setOpen(true)
              mockSearch(value)
            }
          }}
        />
        {value && (
          <button 
            type="button"
            className="absolute right-2.5 top-2.5"
            onClick={() => setValue('')}
          >
            <X className="h-4 w-4 text-gray-500 hover:text-gray-900" />
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