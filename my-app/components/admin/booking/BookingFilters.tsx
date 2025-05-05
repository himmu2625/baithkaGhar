"use client"

import React from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface BookingFiltersProps {
  searchTerm: string
  paymentFilter: string
  onSearchChange: (value: string) => void
  onPaymentFilterChange: (value: string) => void
  onResetFilters: () => void
}

export function BookingFilters({
  searchTerm,
  paymentFilter,
  onSearchChange,
  onPaymentFilterChange,
  onResetFilters
}: BookingFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2 block">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search by ID, property, or guest"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute right-2.5 top-2.5"
                  onClick={() => onSearchChange('')}
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                </button>
              )}
            </div>
          </div>
          
          {/* Payment status filter */}
          <div className="w-full md:w-48">
            <Label htmlFor="payment-status" className="mb-2 block">
              Payment Status
            </Label>
            <Select 
              value={paymentFilter} 
              onValueChange={onPaymentFilterChange}
            >
              <SelectTrigger id="payment-status">
                <SelectValue placeholder="All payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reset filters */}
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={onResetFilters}
          >
            <Filter className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 