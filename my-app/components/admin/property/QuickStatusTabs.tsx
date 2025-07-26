'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { Check, X, Loader2 } from 'lucide-react'

interface QuickStatusTabsProps {
  propertyId: string
  initialStatus: 'active' | 'inactive' | 'pending' | 'available'
  onStatusChange?: (newStatus: 'active' | 'inactive') => void
  className?: string
  disabled?: boolean
}

export function QuickStatusTabs({
  propertyId,
  initialStatus,
  onStatusChange,
  className = '',
  disabled = false
}: QuickStatusTabsProps) {
  const [status, setStatus] = useState<'active' | 'inactive'>(
    initialStatus === 'active' || initialStatus === 'available' ? 'active' : 'inactive'
  )
  const [loading, setLoading] = useState(false)
  
  const updateStatus = async (newStatus: 'active' | 'inactive') => {
    if (newStatus === status || disabled || loading) return
    
    try {
      setLoading(true)
      
      console.log(`Updating property ${propertyId} status to ${newStatus}`)
      
      const response = await fetch(`/api/properties/${propertyId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          status: newStatus,
          _method: "patch"
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update property status: ${response.status}`)
      }

      // Update local state
      setStatus(newStatus)
      
      // Call the callback if provided
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      
      toast({
        title: "Success",
        description: `Property is now ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating property status:", error)
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (value: string) => {
    if (disabled || loading) return
    updateStatus(value as 'active' | 'inactive')
  }

  return (
    <div className={className}>
      {loading && (
        <div className="flex justify-center items-center h-8 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <Tabs 
        value={status} 
        onValueChange={handleValueChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="active" disabled={loading || disabled} className="text-xs">
            <Check className="h-3.5 w-3.5 mr-1" />
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive" disabled={loading || disabled} className="text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Inactive
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
} 