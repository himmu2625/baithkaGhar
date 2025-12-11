// Email validation
export function validateEmail(email: string): { valid: boolean; message: string } {
  if (!email) {
    return { valid: false, message: "Email is required" }
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Please enter a valid email address" }
  }

  // Check for common typos
  const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
  const domain = email.split("@")[1]?.toLowerCase()

  if (domain) {
    // Check for typos like gmail.co, gamil.com, etc.
    const suggestions: { [key: string]: string } = {
      "gmail.co": "gmail.com",
      "gamil.com": "gmail.com",
      "gmial.com": "gmail.com",
      "yahooo.com": "yahoo.com",
      "yaho.com": "yahoo.com",
      "hotmial.com": "hotmail.com",
      "outlok.com": "outlook.com",
    }

    if (suggestions[domain]) {
      return {
        valid: false,
        message: `Did you mean ${email.split("@")[0]}@${suggestions[domain]}?`,
      }
    }
  }

  return { valid: true, message: "" }
}

// Phone validation
export function validatePhone(
  phone: string,
  countryCode: string
): { valid: boolean; message: string } {
  if (!phone) {
    return { valid: false, message: "Phone number is required" }
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "")

  // Basic length check (most countries: 7-15 digits)
  if (cleanPhone.length < 7) {
    return { valid: false, message: "Phone number is too short" }
  }

  if (cleanPhone.length > 15) {
    return { valid: false, message: "Phone number is too long" }
  }

  // Country-specific validation
  if (countryCode === "+91") {
    // India: must be 10 digits
    if (cleanPhone.length !== 10) {
      return { valid: false, message: "Indian phone numbers must be 10 digits" }
    }
    // Must start with 6, 7, 8, or 9
    if (!["6", "7", "8", "9"].includes(cleanPhone[0])) {
      return { valid: false, message: "Invalid Indian phone number" }
    }
  }

  return { valid: true, message: "" }
}

// Name validation
export function validateName(name: string, field: string): { valid: boolean; message: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: `${field} is required` }
  }

  if (name.trim().length < 2) {
    return { valid: false, message: `${field} must be at least 2 characters` }
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/
  if (!nameRegex.test(name)) {
    return { valid: false, message: `${field} contains invalid characters` }
  }

  return { valid: true, message: "" }
}

// GSTIN validation (Indian tax ID)
export function validateGSTIN(gstin: string): { valid: boolean; message: string } {
  if (!gstin) {
    return { valid: false, message: "GSTIN is required" }
  }

  // GSTIN format: 15 characters (2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

  if (!gstinRegex.test(gstin)) {
    return { valid: false, message: "Invalid GSTIN format" }
  }

  return { valid: true, message: "" }
}

// Format phone number for display (adds spaces)
export function formatPhoneNumber(phone: string, countryCode: string): string {
  const cleanPhone = phone.replace(/\D/g, "")

  if (countryCode === "+91" && cleanPhone.length === 10) {
    // Format as: 98765 43210
    return `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
  }

  return cleanPhone
}

// Validate date range
export function validateDateRange(
  checkIn: Date,
  checkOut: Date
): { valid: boolean; message: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkIn < today) {
    return { valid: false, message: "Check-in date cannot be in the past" }
  }

  if (checkOut <= checkIn) {
    return { valid: false, message: "Check-out must be after check-in" }
  }

  // Maximum advance booking (365 days)
  const maxAdvance = new Date(today)
  maxAdvance.setDate(maxAdvance.getDate() + 365)

  if (checkIn > maxAdvance) {
    return { valid: false, message: "Cannot book more than 365 days in advance" }
  }

  return { valid: true, message: "" }
}
