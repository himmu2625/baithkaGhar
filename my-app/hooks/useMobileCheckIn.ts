'use client'

import { useState, useCallback } from 'react'

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  roomNumber: string
  roomType: string
  guests: number
  totalAmount: number
  amenities: string[]
  specialRequests: string[]
}

interface GuestInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  idNumber: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  specialRequests: string
}

interface DocumentUpload {
  id: string
  type: 'id' | 'passport' | 'visa' | 'other'
  name: string
  file: File | null
  uploaded: boolean
  verified: boolean
}

interface ServiceRequest {
  id: string
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'dining' | 'transport'
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'acknowledged' | 'completed'
  timestamp: string
}

interface CheckInState {
  currentStep: number
  booking: BookingDetails | null
  guestInfo: GuestInfo
  documents: DocumentUpload[]
  serviceRequests: ServiceRequest[]
  isLoading: boolean
  error: string | null
  checkInComplete: boolean
}

interface UseMobileCheckInReturn {
  state: CheckInState
  actions: {
    lookupBooking: (identifier: string) => Promise<boolean>
    updateGuestInfo: (info: Partial<GuestInfo>) => void
    uploadDocument: (type: DocumentUpload['type'], file: File) => Promise<boolean>
    completeCheckIn: () => Promise<boolean>
    submitServiceRequest: (type: ServiceRequest['type'], description: string, urgency: ServiceRequest['urgency']) => Promise<boolean>
    setCurrentStep: (step: number) => void
    clearError: () => void
    reset: () => void
  }
}

const initialGuestInfo: GuestInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idNumber: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  specialRequests: ''
}

const initialState: CheckInState = {
  currentStep: 0,
  booking: null,
  guestInfo: initialGuestInfo,
  documents: [],
  serviceRequests: [],
  isLoading: false,
  error: null,
  checkInComplete: false
}

export function useMobileCheckIn(): UseMobileCheckInReturn {
  const [state, setState] = useState<CheckInState>(initialState)

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const lookupBooking = useCallback(async (identifier: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mobile/checkin?action=lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to find booking')
        return false
      }

      setState(prev => ({
        ...prev,
        booking: data.booking,
        currentStep: 1
      }))

      return true
    } catch (error) {
      console.error('Booking lookup error:', error)
      setError('Network error. Please check your connection and try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const updateGuestInfo = useCallback((info: Partial<GuestInfo>) => {
    setState(prev => ({
      ...prev,
      guestInfo: { ...prev.guestInfo, ...info }
    }))
  }, [])

  const uploadDocument = useCallback(async (type: DocumentUpload['type'], file: File): Promise<boolean> => {
    if (!state.booking) {
      setError('No booking found')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise

      const response = await fetch('/api/mobile/checkin?action=upload-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: state.booking.id,
          documentType: type,
          documentData: base64Data,
          fileName: file.name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload document')
        return false
      }

      // Add document to state
      const newDoc: DocumentUpload = {
        id: data.documentId,
        type,
        name: file.name,
        file,
        uploaded: true,
        verified: data.verified
      }

      setState(prev => ({
        ...prev,
        documents: [...prev.documents.filter(doc => doc.type !== type), newDoc]
      }))

      return true
    } catch (error) {
      console.error('Document upload error:', error)
      setError('Failed to upload document. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [state.booking, setLoading, setError])

  const completeCheckIn = useCallback(async (): Promise<boolean> => {
    if (!state.booking) {
      setError('No booking found')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Verify guest information first
      const verifyResponse = await fetch('/api/mobile/checkin?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: state.booking.id,
          ...state.guestInfo
        })
      })

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        setError(verifyData.error || 'Failed to verify guest information')
        return false
      }

      // Complete check-in
      const checkInResponse = await fetch('/api/mobile/checkin?action=complete-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: state.booking.id,
          guestInfo: state.guestInfo,
          documentsVerified: state.documents.some(doc => doc.type === 'id' && doc.verified),
          paymentConfirmed: true
        })
      })

      const checkInData = await checkInResponse.json()

      if (!checkInResponse.ok) {
        setError(checkInData.error || 'Failed to complete check-in')
        return false
      }

      setState(prev => ({
        ...prev,
        checkInComplete: true,
        currentStep: 5
      }))

      return true
    } catch (error) {
      console.error('Check-in completion error:', error)
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [state.booking, state.guestInfo, state.documents, setLoading, setError])

  const submitServiceRequest = useCallback(async (
    type: ServiceRequest['type'],
    description: string,
    urgency: ServiceRequest['urgency']
  ): Promise<boolean> => {
    if (!state.booking) {
      setError('No booking found')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mobile/checkin?action=service-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: state.booking.id,
          type,
          description,
          urgency,
          roomNumber: state.booking.roomNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit service request')
        return false
      }

      // Add service request to state
      const newRequest: ServiceRequest = {
        id: data.requestId,
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1) + ' Request',
        description,
        urgency,
        status: 'pending',
        timestamp: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        serviceRequests: [...prev.serviceRequests, newRequest]
      }))

      return true
    } catch (error) {
      console.error('Service request error:', error)
      setError('Failed to submit service request. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [state.booking, setLoading, setError])

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    state,
    actions: {
      lookupBooking,
      updateGuestInfo,
      uploadDocument,
      completeCheckIn,
      submitServiceRequest,
      setCurrentStep,
      clearError,
      reset
    }
  }
}