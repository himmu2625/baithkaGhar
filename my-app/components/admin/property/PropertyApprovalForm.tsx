"use client"

import React, { useState } from 'react'
import { Check, X, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

type ApprovalStatus = "approved" | "rejected" | "pending_changes"

interface PropertyBasicInfo {
  id: string
  name: string
  description: string
  location: {
    address: string
    city: string
    state: string
    country: string
  }
  host: {
    id: string
    name: string
    email: string
  }
  price: number
  type: string
  amenities: string[]
  images: string[]
  rules: string[]
  createdAt: string
  currentStatus: 'pending' | 'active' | 'rejected' | 'inactive'
}

interface ApprovalFormData {
  status: ApprovalStatus
  featured: boolean
  verified: boolean
  adminNotes: string
  hostMessage?: string
}

interface PropertyApprovalFormProps {
  property: PropertyBasicInfo
  onApprove: (data: ApprovalFormData, propertyId: string) => Promise<void>
  onCancel: () => void
}

export function PropertyApprovalForm({
  property,
  onApprove,
  onCancel
}: PropertyApprovalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ApprovalFormData>({
    status: "approved",
    featured: false,
    verified: false,
    adminNotes: "",
    hostMessage: property.currentStatus === "rejected" 
      ? "Your property has been approved and is now listed on our platform."
      : "",
  })

  const handleStatusChange = (status: ApprovalStatus) => {
    setFormData(prev => ({ ...prev, status }))
  }

  const handleFeaturedChange = (checked: boolean | "indeterminate") => {
    setFormData(prev => ({ ...prev, featured: checked === true }))
  }

  const handleVerifiedChange = (checked: boolean | "indeterminate") => {
    setFormData(prev => ({ ...prev, verified: checked === true }))
  }

  const handleAdminNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, adminNotes: e.target.value }))
  }

  const handleHostMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, hostMessage: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await onApprove(formData, property.id)
    } catch (error) {
      console.error("Error submitting approval form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Property Review</span>
          <Badge 
            variant="outline" 
            className={
              property.currentStatus === 'pending' 
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                : property.currentStatus === 'active'
                ? 'bg-green-100 text-green-800 border-green-200'
                : property.currentStatus === 'rejected'
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
            }
          >
            {property.currentStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and approve or reject this property listing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium">{property.name}</h3>
            <p className="text-sm text-muted-foreground">
              {property.location.city}, {property.location.state}, {property.location.country}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Host Information</h4>
              <p className="text-sm">{property.host.name}</p>
              <p className="text-sm text-muted-foreground">{property.host.email}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Property Details</h4>
              <p className="text-sm">Type: {property.type}</p>
              <p className="text-sm">Price: ₹{property.price} per night</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{property.description}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Amenities</h4>
            <div className="flex flex-wrap gap-1">
              {property.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Approval Decision</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value: string) => handleStatusChange(value as ApprovalStatus)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="font-normal flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="font-normal flex items-center">
                  <X className="w-4 h-4 mr-2 text-red-500" />
                  Reject
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="pending_changes" id="pending_changes" />
                <Label htmlFor="pending_changes" className="font-normal flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                  Request Changes
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {formData.status === "approved" && (
            <div className="space-y-4">
              <div className="flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={handleFeaturedChange}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="featured">
                    Mark as Featured
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Featured properties appear prominently on the homepage and search results
                  </p>
                </div>
              </div>
              
              <div className="flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  id="verified"
                  checked={formData.verified}
                  onCheckedChange={handleVerifiedChange}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="verified">
                    Mark as Verified
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Verified properties have been checked by our team for quality and accuracy
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes (Internal Only)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Enter any notes about this property (visible to admin team only)"
              className="min-h-[100px]"
              value={formData.adminNotes}
              onChange={handleAdminNotesChange}
            />
            <p className="text-sm text-muted-foreground">
              These notes will only be visible to the admin team
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hostMessage">Message to Host</Label>
            <Textarea
              id="hostMessage"
              placeholder="Enter a message to send to the host"
              className="min-h-[100px]"
              value={formData.hostMessage || ''}
              onChange={handleHostMessageChange}
            />
            <p className="text-sm text-muted-foreground">
              This message will be sent to the host along with your decision
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 