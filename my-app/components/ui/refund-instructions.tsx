import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Mail, Phone, ExternalLink } from 'lucide-react'

interface RefundInstructionsProps {
  refund: {
    processed: boolean
    amount: number
    status: string
    message: string
    instructions: {
      title: string
      message: string
      details: string[]
      timeline: string[]
      contactInfo?: {
        email: string
        phone: string
        hours: string
      }
    }
  }
  onClose?: () => void
}

export function RefundInstructions({ refund, onClose }: RefundInstructionsProps) {
  const { instructions } = refund

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          {refund.status === "completed" ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-orange-600" />
          )}
          <CardTitle className="text-lg">{instructions.title}</CardTitle>
        </div>
        <CardDescription>{instructions.message}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Refund Amount */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800">Refund Amount</span>
            <span className="text-lg font-bold text-green-900">
              ₹{refund.amount.toLocaleString()}
            </span>
          </div>
          <Badge 
            variant={refund.status === "completed" ? "default" : "secondary"}
            className="mt-2"
          >
            {refund.status === "completed" ? "Processed" : "Processing"}
          </Badge>
        </div>

        {/* Refund Details */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Refund Details</h4>
          <div className="space-y-2">
            {instructions.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                {detail}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Processing Timeline</h4>
          <div className="space-y-3">
            {instructions.timeline.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        {instructions.contactInfo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Need Help?</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-600" />
                <a 
                  href={`mailto:${instructions.contactInfo.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {instructions.contactInfo.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-blue-600" />
                <a 
                  href={`tel:${instructions.contactInfo.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {instructions.contactInfo.phone}
                </a>
              </div>
              <div className="text-xs text-blue-600">
                {instructions.contactInfo.hours}
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Refund will be processed to your original payment method</li>
                <li>• Processing times may vary depending on your bank</li>
                <li>• You will receive an email confirmation once the refund is processed</li>
                <li>• Keep this booking reference for any queries</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={() => window.open(`mailto:${instructions.contactInfo?.email || 'support@baithaka.com'}?subject=Refund Query - Booking Cancellation`, '_blank')}
            variant="outline"
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}