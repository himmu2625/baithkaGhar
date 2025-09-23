interface QRScanResult {
  data: string
  timestamp: Date
  confidence?: number
}

interface QRScannerOptions {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
  fps?: number
  qrbox?: { width: number; height: number }
  aspectRatio?: number
}

interface ScannerCallback {
  onScanSuccess: (result: QRScanResult) => void
  onScanError?: (error: string) => void
  onCameraError?: (error: string) => void
}

export class QRScannerService {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private animationFrame: number | null = null
  private scanning = false
  private callbacks: ScannerCallback | null = null

  constructor() {
    this.initializeCanvas()
  }

  private initializeCanvas(): void {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    options: QRScannerOptions = {},
    callbacks: ScannerCallback
  ): Promise<void> {
    this.video = videoElement
    this.callbacks = callbacks

    const defaultOptions: QRScannerOptions = {
      facingMode: 'environment',
      width: 640,
      height: 480,
      fps: 10,
      aspectRatio: 1.0,
      ...options
    }

    try {
      // Request camera permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: defaultOptions.facingMode,
          width: { ideal: defaultOptions.width },
          height: { ideal: defaultOptions.height }
        }
      })

      // Set up video element
      this.video.srcObject = this.stream
      this.video.setAttribute('playsinline', 'true')

      await new Promise<void>((resolve, reject) => {
        this.video!.onloadedmetadata = () => {
          this.video!.play()
            .then(() => resolve())
            .catch(reject)
        }
      })

      // Start scanning loop
      this.scanning = true
      this.scanLoop()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access denied'
      this.callbacks?.onCameraError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  private scanLoop(): void {
    if (!this.scanning || !this.video || !this.canvas || !this.context) {
      return
    }

    // Draw video frame to canvas
    this.canvas.width = this.video.videoWidth
    this.canvas.height = this.video.videoHeight
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

    // Get image data for QR detection
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)

    // Detect QR code
    const qrResult = this.detectQRCode(imageData)
    if (qrResult) {
      this.callbacks?.onScanSuccess(qrResult)
      this.stopScanning()
      return
    }

    // Continue scanning
    this.animationFrame = requestAnimationFrame(() => this.scanLoop())
  }

  private detectQRCode(imageData: ImageData): QRScanResult | null {
    // Simple QR detection algorithm (in production, use a proper QR library like jsQR)
    // This is a simplified implementation for demonstration

    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // Convert to grayscale
    const grayscale = new Uint8ClampedArray(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      grayscale[i / 4] = gray
    }

    // Look for QR patterns (simplified detection)
    const patterns = this.findQRPatterns(grayscale, width, height)
    if (patterns.length >= 3) {
      // Simulate QR data extraction
      const mockQRData = this.extractQRData(patterns)
      if (mockQRData) {
        return {
          data: mockQRData,
          timestamp: new Date(),
          confidence: 0.95
        }
      }
    }

    return null
  }

  private findQRPatterns(grayscale: Uint8ClampedArray, width: number, height: number): Array<{ x: number; y: number }> {
    const patterns: Array<{ x: number; y: number }> = []
    const threshold = 128

    // Simplified pattern detection - look for black squares
    for (let y = 0; y < height - 20; y += 5) {
      for (let x = 0; x < width - 20; x += 5) {
        if (this.isQRPattern(grayscale, x, y, width, threshold)) {
          patterns.push({ x, y })
        }
      }
    }

    return patterns
  }

  private isQRPattern(
    grayscale: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    threshold: number
  ): boolean {
    // Check for a pattern similar to QR finder patterns
    // This is highly simplified - real QR detection is much more complex

    const patternSize = 7
    let blackPixels = 0
    let totalPixels = 0

    for (let dy = 0; dy < patternSize; dy++) {
      for (let dx = 0; dx < patternSize; dx++) {
        const pixel = grayscale[(y + dy) * width + (x + dx)]
        if (pixel !== undefined) {
          totalPixels++
          if (pixel < threshold) {
            blackPixels++
          }
        }
      }
    }

    // Look for roughly 50% black pixels (QR patterns have alternating black/white)
    const blackRatio = blackPixels / totalPixels
    return blackRatio > 0.3 && blackRatio < 0.7
  }

  private extractQRData(patterns: Array<{ x: number; y: number }>): string | null {
    // In a real implementation, this would decode the actual QR data
    // For this demo, we'll simulate detection of known QR patterns

    // Simulate finding a booking QR code
    const mockBookingQR = {
      type: 'booking_qr',
      version: '1.0',
      bookingId: 'booking-001',
      confirmationNumber: 'BG-2024-001234',
      action: 'checkin',
      propertyId: 'prop-001',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      verificationCode: 'demo-verification-code',
      hash: 'demo-hash-value'
    }

    return JSON.stringify(mockBookingQR)
  }

  stopScanning(): void {
    this.scanning = false

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.video) {
      this.video.srcObject = null
    }
  }

  async scanImage(imageFile: File): Promise<QRScanResult | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        if (!this.canvas || !this.context) {
          resolve(null)
          return
        }

        // Draw image to canvas
        this.canvas.width = img.width
        this.canvas.height = img.height
        this.context.drawImage(img, 0, 0)

        // Get image data and detect QR
        const imageData = this.context.getImageData(0, 0, img.width, img.height)
        const result = this.detectQRCode(imageData)
        resolve(result)
      }

      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(imageFile)
    })
  }

  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.HTMLVideoElement
    )
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('Error getting camera devices:', error)
      return []
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    if (this.scanning) {
      this.stopScanning()
    }

    if (!this.video || !this.callbacks) {
      throw new Error('Scanner not initialized')
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    })

    this.stream = stream
    this.video.srcObject = stream

    await new Promise<void>((resolve, reject) => {
      this.video!.onloadedmetadata = () => {
        this.video!.play()
          .then(() => {
            this.scanning = true
            this.scanLoop()
            resolve()
          })
          .catch(reject)
      }
    })
  }

  async hasFlash(): Promise<boolean> {
    try {
      if (!this.stream) return false

      const videoTrack = this.stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities?.()

      return !!(capabilities && 'torch' in capabilities)
    } catch (error) {
      return false
    }
  }

  async toggleFlash(enable: boolean): Promise<boolean> {
    try {
      if (!this.stream) return false

      const videoTrack = this.stream.getVideoTracks()[0]
      await videoTrack.applyConstraints({
        advanced: [{ torch: enable }]
      })

      return true
    } catch (error) {
      console.error('Error toggling flash:', error)
      return false
    }
  }

  getVideoConstraints(): MediaTrackConstraints | null {
    if (!this.stream) return null

    const videoTrack = this.stream.getVideoTracks()[0]
    return videoTrack.getConstraints()
  }

  destroy(): void {
    this.stopScanning()
    this.canvas = null
    this.context = null
    this.video = null
    this.callbacks = null
  }
}

// Utility functions for QR code handling
export const QRUtils = {
  // Validate QR code data structure
  validateQRData(data: string): { valid: boolean; error?: string; parsed?: any } {
    try {
      const parsed = JSON.parse(data)

      if (!parsed.type || parsed.type !== 'booking_qr') {
        return { valid: false, error: 'Invalid QR code type' }
      }

      if (!parsed.bookingId || !parsed.confirmationNumber) {
        return { valid: false, error: 'Missing required booking information' }
      }

      if (!parsed.expiresAt || new Date(parsed.expiresAt) < new Date()) {
        return { valid: false, error: 'QR code has expired' }
      }

      return { valid: true, parsed }
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' }
    }
  },

  // Format QR data for display
  formatQRData(data: string): { success: boolean; info?: any; error?: string } {
    const validation = this.validateQRData(data)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const parsed = validation.parsed!
    return {
      success: true,
      info: {
        type: parsed.action || 'Unknown',
        booking: parsed.confirmationNumber,
        guest: parsed.guestName || 'Unknown Guest',
        room: parsed.roomNumber || 'N/A',
        expiresAt: new Date(parsed.expiresAt).toLocaleString(),
        property: parsed.propertyId || 'Unknown Property'
      }
    }
  },

  // Generate QR display URL for sharing
  generateQRDisplayUrl(qrData: string): string {
    const encodedData = encodeURIComponent(qrData)
    return `${window.location.origin}/qr/display?data=${encodedData}`
  },

  // Create QR code as data URL (simplified implementation)
  async generateQRImage(data: string, size: number = 200): Promise<string> {
    // In production, use a proper QR library like qrcode
    // This is a placeholder implementation

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    canvas.width = size
    canvas.height = size

    // Simple black and white pattern
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = '#000000'
    const moduleSize = size / 25

    // Draw simplified QR pattern
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        const hash = data.charCodeAt((x + y) % data.length)
        if (hash % 2 === 0) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    return canvas.toDataURL('image/png')
  }
}