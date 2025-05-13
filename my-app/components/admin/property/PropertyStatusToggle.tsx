'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Check, X, Loader2 } from 'lucide-react'

interface PropertyStatusToggleProps {
  propertyId: string
  initialStatus: 'active' | 'inactive' | 'pending' | 'available'
  onStatusChange?: (newStatus: 'active' | 'inactive') => void
  variant?: 'switch' | 'button' | 'compact'
  className?: string
}

export function PropertyStatusToggle({
  propertyId,
  initialStatus,
  onStatusChange,
  variant = 'switch',
  className = '',
}: PropertyStatusToggleProps) {
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending' | 'available'>(initialStatus)
  const [loading, setLoading] = useState(false)
  
  const isActive = status === 'active' || status === 'available'
  
  const toggleStatus = async () => {
    try {
      setLoading(true)
      
      // Determine the new status (toggle between active and inactive)
      const newStatus = isActive ? 'inactive' : 'active'
      
      console.log(`Toggling property ${propertyId} status from ${status} to ${newStatus}`)
      
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
        throw new Error("Failed to update property status")
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

  if (variant === 'switch') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Switch 
          checked={isActive}
          onCheckedChange={toggleStatus}
          disabled={loading || status === 'pending'}
        />
        <span className="text-sm font-medium">
          {loading ? 'Updating...' : isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <Button
        variant={isActive ? "default" : "secondary"}
        size="sm"
        onClick={toggleStatus}
        disabled={loading || status === 'pending'}
        className={`h-7 px-2 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isActive ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
      </Button>
    )
  }
  
  // Default button variant
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleStatus}
      disabled={loading || status === 'pending'}
      className={`${className} ${isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : isActive ? (
        <>
          <X className="mr-2 h-4 w-4" />
          Deactivate
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Activate
        </>
      )}
    </Button>
  )
} 