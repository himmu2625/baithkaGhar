"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, Eye, Edit, Trash, Shield, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Property {
  id: string
  name: string
  location: string
  host: {
    id: string
    name: string
  }
  type: string
  status: 'active' | 'pending' | 'inactive' | 'rejected'
  price: number
  rating?: number
  bookingsCount: number
  featured: boolean
  verified: boolean
  createdAt: string
}

interface PropertyDetailsTableProps {
  properties: Property[]
  isLoading?: boolean
  onViewProperty?: (id: string) => void
  onEditProperty?: (id: string) => void
  onDeleteProperty?: (id: string) => void
  onToggleFeatured?: (id: string, featured: boolean) => void
  onToggleVerified?: (id: string, verified: boolean) => void
  onSort?: (field: keyof Property, direction: 'asc' | 'desc') => void
}

export function PropertyDetailsTable({
  properties,
  isLoading = false,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  onToggleFeatured,
  onToggleVerified,
  onSort
}: PropertyDetailsTableProps) {
  const [sortField, setSortField] = useState<keyof Property | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Property) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(direction)
    if (onSort) {
      onSort(field, direction)
    }
  }

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderSortIcon = (field: keyof Property) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[300px] cursor-pointer"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Property
                {renderSortIcon('name')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('host')}
            >
              <div className="flex items-center">
                Host
                {renderSortIcon('host')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {renderSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center justify-end">
                Price
                {renderSortIcon('price')}
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer"
              onClick={() => handleSort('bookingsCount')}
            >
              <div className="flex items-center justify-center">
                Bookings
                {renderSortIcon('bookingsCount')}
              </div>
            </TableHead>
            <TableHead className="text-center">Badges</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`loading-${i}`}>
                <TableCell>
                  <div className="h-5 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-5 w-2/3 ml-auto bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="h-5 w-1/2 mx-auto bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 w-8 ml-auto bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))
          ) : properties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No properties found.
              </TableCell>
            </TableRow>
          ) : (
            properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="font-medium">{property.name}</div>
                  <div className="text-sm text-muted-foreground">{property.location}</div>
                  <div className="text-xs text-muted-foreground">ID: {property.id}</div>
                </TableCell>
                <TableCell>
                  <div>{property.host.name}</div>
                  <div className="text-xs text-muted-foreground">ID: {property.host.id}</div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(property.status)} text-xs py-0.5`}
                  >
                    {property.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(property.price)}
                  <div className="text-xs text-muted-foreground">per night</div>
                </TableCell>
                <TableCell className="text-center">
                  {property.bookingsCount}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    {property.featured && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-500"
                        title="Featured Property"
                        onClick={() => onToggleFeatured && onToggleFeatured(property.id, !property.featured)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                    {property.verified && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500"
                        title="Verified Property"
                        onClick={() => onToggleVerified && onToggleVerified(property.id, !property.verified)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {!property.featured && !property.verified && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewProperty && onViewProperty(property.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditProperty && onEditProperty(property.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!property.featured && (
                        <DropdownMenuItem 
                          onClick={() => onToggleFeatured && onToggleFeatured(property.id, true)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Mark as Featured
                        </DropdownMenuItem>
                      )}
                      {property.featured && (
                        <DropdownMenuItem 
                          onClick={() => onToggleFeatured && onToggleFeatured(property.id, false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Remove Featured
                        </DropdownMenuItem>
                      )}
                      {!property.verified && (
                        <DropdownMenuItem 
                          onClick={() => onToggleVerified && onToggleVerified(property.id, true)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Verified
                        </DropdownMenuItem>
                      )}
                      {property.verified && (
                        <DropdownMenuItem 
                          onClick={() => onToggleVerified && onToggleVerified(property.id, false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Remove Verification
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => onDeleteProperty && onDeleteProperty(property.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 