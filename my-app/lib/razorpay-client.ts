"use client"

// Define types
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  modal?: {
    backdropClose?: boolean
    escape?: boolean
    handleBack?: boolean
    confirm?: {
      heading?: string
      description?: string
      buttonText?: string
    }
  }
  handler?: (response: RazorpayResponse) => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Keep track of whether Razorpay script is loaded
let isRazorpayLoaded = false

/**
 * Load the Razorpay script if not already loaded
 * @returns Promise indicating that Razorpay is ready
 */
const loadRazorpay = async (): Promise<boolean> => {
  if (isRazorpayLoaded) {
    return true
  }
  
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    
    script.onload = () => {
      isRazorpayLoaded = true
      resolve(true)
    }
    
    document.body.appendChild(script)
  })
}

/**
 * Initialize and open Razorpay checkout
 * @param options - Razorpay options
 * @returns Promise resolving to payment response or error
 */
export const openRazorpayCheckout = async (
  options: Omit<RazorpayOptions, 'handler'>
): Promise<RazorpayResponse> => {
  // Load Razorpay script if not already loaded
  await loadRazorpay()
  
  return new Promise((resolve, reject) => {
    const razorpayOptions: RazorpayOptions = {
      ...options,
      handler: function (response) {
        resolve(response)
      },
    }
    
    try {
      // Initialize Razorpay
      const razorpayInstance = new (window as any).Razorpay(razorpayOptions)
      
      // Open checkout modal
      razorpayInstance.open()
      
      // Handle escape key press
      razorpayInstance.on('payment.failed', function (response: any) {
        reject(new Error(response.error.description))
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Create a checkout order and open Razorpay payment window
 * @param params - Checkout parameters
 */
export const createAndOpenRazorpayCheckout = async (params: {
  bookingId: string
  propertyId: string
  returnUrl: string
}): Promise<{ success: boolean; paymentId?: string; orderId?: string; signature?: string; error?: string }> => {
  try {
    // Call our API to create a Razorpay order
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to create order")
    }

    // Open Razorpay checkout
    if (!result.orderId || !result.key || !result.amount) {
      throw new Error("Invalid order details returned from server")
    }

    // Open Razorpay checkout
    const paymentResponse = await openRazorpayCheckout({
      key: result.key,
      amount: result.amount,
      currency: result.currency || "INR",
      name: "Baithaka Ghar",
      description: result.description || "Property Booking",
      order_id: result.orderId,
      prefill: {
        name: result.userName || "",
        email: result.userEmail || "",
      },
      notes: result.notes || {},
      theme: {
        color: "#4CAF50"
      }
    })

    // Verify the payment on the server
    const verifyResponse = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: params.bookingId,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
      }),
    })

    const verifyResult = await verifyResponse.json()

    if (!verifyResponse.ok) {
      throw new Error(verifyResult.error || "Payment verification failed")
    }

    return {
      success: true,
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature,
    }
  } catch (error: any) {
    console.error("Error processing payment:", error)
    return {
      success: false,
      error: error.message || "Payment processing failed"
    }
  }
} 