import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { z } from 'zod'

export interface GuestProfile {
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
    nationality: string
    profession?: string
    company?: string
  }
  contactInfo: {
    email: string
    phone: string
    alternatePhone?: string
    address: {
      street: string
      city: string
      state: string
      country: string
      zipCode: string
    }
    emergencyContact: {
      name: string
      relationship: string
      phone: string
    }
  }
  identification: {
    primaryDocument: {
      type: 'passport' | 'drivers_license' | 'aadhar' | 'pan' | 'voter_id'
      number: string
      issuingCountry: string
      issuingAuthority?: string
      issueDate: Date
      expiryDate?: Date
      frontImage: string
      backImage?: string
    }
    secondaryDocument?: {
      type: string
      number: string
      frontImage: string
    }
  }
  preferences: {
    language: string
    dietary: string[]
    accessibility: string[]
    roomPreferences: {
      floor?: 'low' | 'medium' | 'high'
      view?: string[]
      bedType?: string
      smokingRoom: boolean
    }
    communicationPreferences: {
      email: boolean
      sms: boolean
      whatsapp: boolean
      phone: boolean
    }
  }
  travelInfo: {
    purpose: 'business' | 'leisure' | 'family' | 'medical' | 'other'
    arrivalMode: 'flight' | 'train' | 'bus' | 'car' | 'other'
    flightDetails?: {
      airline: string
      flightNumber: string
      arrivalTime: Date
      departureTime?: Date
    }
    companionGuests: Array<{
      name: string
      relationship: string
      age: number
      documentType?: string
      documentNumber?: string
    }>
  }
  healthDeclaration: {
    hasSymptoms: boolean
    symptoms?: string[]
    recentTravel: boolean
    travelHistory?: Array<{
      country: string
      dateOfVisit: Date
    }>
    vaccinationStatus?: {
      vaccinated: boolean
      vaccineType?: string
      lastDoseDate?: Date
      certificateNumber?: string
    }
    additionalInfo?: string
  }
  consent: {
    termsAccepted: boolean
    privacyPolicyAccepted: boolean
    marketingOptIn: boolean
    dataProcessingConsent: boolean
    signatureImage?: string
    timestamp: Date
    ipAddress: string
  }
  verificationStatus: {
    emailVerified: boolean
    phoneVerified: boolean
    documentVerified: 'pending' | 'verified' | 'rejected'
    backgroundCheckStatus?: 'pending' | 'cleared' | 'flagged'
  }
}

export interface RegistrationSession {
  sessionId: string
  bookingId: string
  guestEmail: string
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  partialData: Partial<GuestProfile>
  expiresAt: Date
  lastUpdated: Date
  submissionAttempts: number
}

export interface RegistrationResponse {
  success: boolean
  sessionId?: string
  currentStep?: number
  nextStep?: string
  completionPercentage?: number
  error?: string
  validationErrors?: Array<{
    field: string
    message: string
  }>
}

export interface DocumentVerificationResult {
  verified: boolean
  confidence: number
  extractedData?: {
    name: string
    documentNumber: string
    expiryDate?: Date
    issueDate?: Date
  }
  issues?: string[]
  requiresManualReview: boolean
}

export class DigitalRegistrationService {
  private static readonly REGISTRATION_STEPS = [
    'personal_info',
    'contact_info',
    'identification',
    'travel_info',
    'health_declaration',
    'preferences',
    'review_and_consent'
  ]

  // Start guest registration process
  static async startRegistration(bookingId: string, guestEmail: string): Promise<RegistrationResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      // Check if registration already exists
      const existingSession = await this.getRegistrationSession(bookingId, guestEmail)
      if (existingSession && existingSession.expiresAt > new Date()) {
        return {
          success: true,
          sessionId: existingSession.sessionId,
          currentStep: existingSession.currentStep,
          nextStep: this.REGISTRATION_STEPS[existingSession.currentStep],
          completionPercentage: (existingSession.completedSteps.length / this.REGISTRATION_STEPS.length) * 100
        }
      }

      // Create new registration session
      const sessionId = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const session: RegistrationSession = {
        sessionId,
        bookingId,
        guestEmail,
        currentStep: 0,
        totalSteps: this.REGISTRATION_STEPS.length,
        completedSteps: [],
        partialData: {},
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastUpdated: new Date(),
        submissionAttempts: 0
      }

      // Store session (in production, use Redis or similar)
      await this.saveRegistrationSession(session)

      // Send registration link
      await this.sendRegistrationLink(booking, sessionId)

      return {
        success: true,
        sessionId,
        currentStep: 0,
        nextStep: this.REGISTRATION_STEPS[0],
        completionPercentage: 0
      }

    } catch (error) {
      console.error('Start registration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Update registration step
  static async updateRegistrationStep(
    sessionId: string,
    stepName: string,
    stepData: any
  ): Promise<RegistrationResponse> {
    try {
      const session = await this.getRegistrationSessionById(sessionId)
      if (!session) {
        return {
          success: false,
          error: 'Registration session not found or expired'
        }
      }

      // Validate step data
      const validation = await this.validateStepData(stepName, stepData)
      if (!validation.valid) {
        return {
          success: false,
          validationErrors: validation.errors
        }
      }

      // Update session with step data
      session.partialData = {
        ...session.partialData,
        [stepName]: stepData
      }

      // Mark step as completed
      if (!session.completedSteps.includes(stepName)) {
        session.completedSteps.push(stepName)
      }

      // Move to next step
      const stepIndex = this.REGISTRATION_STEPS.indexOf(stepName)
      if (stepIndex >= 0) {
        session.currentStep = Math.max(session.currentStep, stepIndex + 1)
      }

      session.lastUpdated = new Date()

      await this.saveRegistrationSession(session)

      // Check if registration is complete
      if (session.completedSteps.length === this.REGISTRATION_STEPS.length) {
        return await this.completeRegistration(session)
      }

      const nextStepIndex = session.currentStep
      const nextStep = nextStepIndex < this.REGISTRATION_STEPS.length
        ? this.REGISTRATION_STEPS[nextStepIndex]
        : null

      return {
        success: true,
        sessionId,
        currentStep: session.currentStep,
        nextStep,
        completionPercentage: (session.completedSteps.length / this.REGISTRATION_STEPS.length) * 100
      }

    } catch (error) {
      console.error('Update registration step error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get registration status
  static async getRegistrationStatus(sessionId: string): Promise<{
    status: 'in_progress' | 'completed' | 'expired'
    currentStep: number
    completedSteps: string[]
    completionPercentage: number
    expiresAt: Date
    partialData?: Partial<GuestProfile>
  }> {
    try {
      const session = await this.getRegistrationSessionById(sessionId)
      if (!session) {
        return {
          status: 'expired',
          currentStep: 0,
          completedSteps: [],
          completionPercentage: 0,
          expiresAt: new Date()
        }
      }

      const status = session.expiresAt < new Date() ? 'expired' :
                    session.completedSteps.length === this.REGISTRATION_STEPS.length ? 'completed' : 'in_progress'

      return {
        status,
        currentStep: session.currentStep,
        completedSteps: session.completedSteps,
        completionPercentage: (session.completedSteps.length / this.REGISTRATION_STEPS.length) * 100,
        expiresAt: session.expiresAt,
        partialData: session.partialData
      }

    } catch (error) {
      console.error('Get registration status error:', error)
      throw error
    }
  }

  // Verify uploaded documents
  static async verifyDocuments(
    sessionId: string,
    documentImages: Array<{
      type: string
      frontImage: string
      backImage?: string
    }>
  ): Promise<{
    success: boolean
    results: DocumentVerificationResult[]
    requiresManualReview: boolean
  }> {
    try {
      const results: DocumentVerificationResult[] = []
      let requiresManualReview = false

      for (const document of documentImages) {
        const verificationResult = await this.verifyDocument(document)
        results.push(verificationResult)

        if (verificationResult.requiresManualReview) {
          requiresManualReview = true
        }
      }

      // Update session with verification results
      const session = await this.getRegistrationSessionById(sessionId)
      if (session) {
        session.partialData.verification = {
          documentResults: results,
          requiresManualReview,
          verifiedAt: new Date()
        }
        await this.saveRegistrationSession(session)
      }

      return {
        success: true,
        results,
        requiresManualReview
      }

    } catch (error) {
      console.error('Document verification error:', error)
      return {
        success: false,
        results: [],
        requiresManualReview: true
      }
    }
  }

  // Complete registration process
  static async completeRegistration(session: RegistrationSession): Promise<RegistrationResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(session.bookingId)
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      // Validate all required data is present
      const validationResult = await this.validateCompleteProfile(session.partialData)
      if (!validationResult.valid) {
        return {
          success: false,
          validationErrors: validationResult.errors
        }
      }

      // Save guest profile to booking
      booking.digitalRegistration = {
        completed: true,
        completedAt: new Date(),
        sessionId: session.sessionId,
        guestProfile: session.partialData as GuestProfile
      }

      // Update booking status
      booking.registrationStatus = 'completed'

      await booking.save()

      // Send confirmation
      await this.sendRegistrationConfirmation(booking)

      // Clean up session
      await this.cleanupSession(session.sessionId)

      return {
        success: true,
        sessionId: session.sessionId,
        currentStep: this.REGISTRATION_STEPS.length,
        completionPercentage: 100
      }

    } catch (error) {
      console.error('Complete registration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get guest profiles for property
  static async getGuestProfiles(
    propertyId: string,
    filters?: {
      checkInDateFrom?: Date
      checkInDateTo?: Date
      nationality?: string
      verificationStatus?: string
    }
  ): Promise<Array<{
    bookingId: string
    guestName: string
    email: string
    phone: string
    nationality: string
    checkInDate: Date
    verificationStatus: string
    documentStatus: string
    registrationCompletedAt: Date
  }>> {
    try {
      await connectToDatabase()

      const query: any = {
        propertyId,
        'digitalRegistration.completed': true
      }

      if (filters?.checkInDateFrom || filters?.checkInDateTo) {
        query.dateFrom = {}
        if (filters.checkInDateFrom) {
          query.dateFrom.$gte = filters.checkInDateFrom
        }
        if (filters.checkInDateTo) {
          query.dateFrom.$lte = filters.checkInDateTo
        }
      }

      if (filters?.nationality) {
        query['digitalRegistration.guestProfile.personalInfo.nationality'] = filters.nationality
      }

      if (filters?.verificationStatus) {
        query['digitalRegistration.guestProfile.verificationStatus.documentVerified'] = filters.verificationStatus
      }

      const bookings = await Booking.find(query).sort({ 'digitalRegistration.completedAt': -1 })

      return bookings.map(booking => {
        const profile = booking.digitalRegistration.guestProfile
        return {
          bookingId: booking._id.toString(),
          guestName: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
          email: profile.contactInfo.email,
          phone: profile.contactInfo.phone,
          nationality: profile.personalInfo.nationality,
          checkInDate: booking.dateFrom,
          verificationStatus: profile.verificationStatus.documentVerified,
          documentStatus: profile.identification.primaryDocument.type,
          registrationCompletedAt: booking.digitalRegistration.completedAt
        }
      })

    } catch (error) {
      console.error('Get guest profiles error:', error)
      throw error
    }
  }

  // Private helper methods
  private static async validateStepData(stepName: string, stepData: any): Promise<{
    valid: boolean
    errors?: Array<{ field: string; message: string }>
  }> {
    try {
      const schemas = this.getValidationSchemas()
      const schema = schemas[stepName]

      if (!schema) {
        return {
          valid: false,
          errors: [{ field: 'step', message: 'Invalid step name' }]
        }
      }

      schema.parse(stepData)
      return { valid: true }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }
      }

      return {
        valid: false,
        errors: [{ field: 'unknown', message: 'Validation error' }]
      }
    }
  }

  private static getValidationSchemas() {
    return {
      personal_info: z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        dateOfBirth: z.string().transform(val => new Date(val)),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
        nationality: z.string().min(2).max(3),
        profession: z.string().optional(),
        company: z.string().optional()
      }),

      contact_info: z.object({
        email: z.string().email(),
        phone: z.string().min(10).max(15),
        alternatePhone: z.string().optional(),
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().min(1),
          country: z.string().min(2),
          zipCode: z.string().min(1)
        }),
        emergencyContact: z.object({
          name: z.string().min(1),
          relationship: z.string().min(1),
          phone: z.string().min(10)
        })
      }),

      identification: z.object({
        primaryDocument: z.object({
          type: z.enum(['passport', 'drivers_license', 'aadhar', 'pan', 'voter_id']),
          number: z.string().min(1),
          issuingCountry: z.string().min(2),
          issuingAuthority: z.string().optional(),
          issueDate: z.string().transform(val => new Date(val)),
          expiryDate: z.string().transform(val => new Date(val)).optional(),
          frontImage: z.string().min(1),
          backImage: z.string().optional()
        })
      }),

      travel_info: z.object({
        purpose: z.enum(['business', 'leisure', 'family', 'medical', 'other']),
        arrivalMode: z.enum(['flight', 'train', 'bus', 'car', 'other']),
        flightDetails: z.object({
          airline: z.string(),
          flightNumber: z.string(),
          arrivalTime: z.string().transform(val => new Date(val)),
          departureTime: z.string().transform(val => new Date(val)).optional()
        }).optional(),
        companionGuests: z.array(z.object({
          name: z.string(),
          relationship: z.string(),
          age: z.number().min(0).max(120)
        })).default([])
      }),

      health_declaration: z.object({
        hasSymptoms: z.boolean(),
        symptoms: z.array(z.string()).optional(),
        recentTravel: z.boolean(),
        travelHistory: z.array(z.object({
          country: z.string(),
          dateOfVisit: z.string().transform(val => new Date(val))
        })).optional(),
        vaccinationStatus: z.object({
          vaccinated: z.boolean(),
          vaccineType: z.string().optional(),
          lastDoseDate: z.string().transform(val => new Date(val)).optional()
        }).optional()
      }),

      preferences: z.object({
        language: z.string().default('en'),
        dietary: z.array(z.string()).default([]),
        accessibility: z.array(z.string()).default([]),
        roomPreferences: z.object({
          floor: z.enum(['low', 'medium', 'high']).optional(),
          view: z.array(z.string()).default([]),
          bedType: z.string().optional(),
          smokingRoom: z.boolean().default(false)
        }).default({}),
        communicationPreferences: z.object({
          email: z.boolean().default(true),
          sms: z.boolean().default(true),
          whatsapp: z.boolean().default(false),
          phone: z.boolean().default(false)
        }).default({})
      }),

      review_and_consent: z.object({
        termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted'),
        privacyPolicyAccepted: z.boolean().refine(val => val === true, 'Privacy policy must be accepted'),
        marketingOptIn: z.boolean().default(false),
        dataProcessingConsent: z.boolean().refine(val => val === true, 'Data processing consent required'),
        signatureImage: z.string().optional()
      })
    }
  }

  private static async validateCompleteProfile(partialData: any): Promise<{
    valid: boolean
    errors?: Array<{ field: string; message: string }>
  }> {
    const requiredSteps = ['personal_info', 'contact_info', 'identification', 'review_and_consent']
    const errors: Array<{ field: string; message: string }> = []

    for (const step of requiredSteps) {
      if (!partialData[step]) {
        errors.push({
          field: step,
          message: `${step.replace('_', ' ')} is required`
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  private static async verifyDocument(document: any): Promise<DocumentVerificationResult> {
    // In production, integrate with document verification service (e.g., AWS Textract, Google Document AI)
    // For now, return mock verification

    const confidence = Math.random() * 40 + 60 // 60-100% confidence

    return {
      verified: confidence > 70,
      confidence,
      extractedData: {
        name: 'Extracted Name',
        documentNumber: document.frontImage.slice(-10),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      requiresManualReview: confidence < 80,
      issues: confidence < 70 ? ['Document quality poor', 'Some text unclear'] : undefined
    }
  }

  private static async getRegistrationSession(bookingId: string, guestEmail: string): Promise<RegistrationSession | null> {
    // In production, fetch from Redis or database
    // For now, return null (new session will be created)
    return null
  }

  private static async getRegistrationSessionById(sessionId: string): Promise<RegistrationSession | null> {
    // In production, fetch from Redis or database
    // For now, return mock session
    return {
      sessionId,
      bookingId: 'mock_booking_id',
      guestEmail: 'guest@example.com',
      currentStep: 0,
      totalSteps: this.REGISTRATION_STEPS.length,
      completedSteps: [],
      partialData: {},
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      submissionAttempts: 0
    }
  }

  private static async saveRegistrationSession(session: RegistrationSession): Promise<void> {
    // In production, save to Redis or database
    console.log('Saving registration session:', session.sessionId)
  }

  private static async sendRegistrationLink(booking: any, sessionId: string): Promise<void> {
    try {
      const { EmailService } = await import('./email-service')
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/registration/${sessionId}`

      await EmailService.sendCustomMessage(
        booking.contactDetails?.email || booking.email,
        `Please complete your digital registration for your upcoming stay. Click here: ${registrationUrl}`,
        'text'
      )

    } catch (error) {
      console.error('Send registration link error:', error)
    }
  }

  private static async sendRegistrationConfirmation(booking: any): Promise<void> {
    try {
      const { EmailService } = await import('./email-service')

      await EmailService.sendCustomMessage(
        booking.digitalRegistration.guestProfile.contactInfo.email,
        'Thank you for completing your digital registration. Your check-in process will be expedited!',
        'text'
      )

    } catch (error) {
      console.error('Send registration confirmation error:', error)
    }
  }

  private static async cleanupSession(sessionId: string): Promise<void> {
    // In production, remove from Redis or mark as completed in database
    console.log('Cleaning up registration session:', sessionId)
  }
}