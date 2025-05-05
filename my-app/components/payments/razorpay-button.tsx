"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { createAndOpenRazorpayCheckout } from '@/lib/razorpay-client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RazorpayButtonProps {
  bookingId: string
  propertyId: string
  returnUrl: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  children?: React.ReactNode
  amount?: number
  currency?: string
  size?: "xs" | "sm" | "md" | "lg"
}

export function RazorpayButton({
  bookingId,
  propertyId,
  returnUrl,
  className = "",
  variant = "default",
  children = "Pay Now",
  amount,
  currency = "INR",
  size = "md"
}: RazorpayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const { toast } = useToast()

  const handlePayment = async () => {
    setIsLoading(true)
    setPaymentStatus("processing")
    
    try {
      const result = await createAndOpenRazorpayCheckout({
        bookingId,
        propertyId,
        returnUrl
      })
      
      if (result.success) {
        setPaymentStatus("success")
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
          variant: "success",
        })
        
        // Redirect to success page after a short delay to show success animation
        setTimeout(() => {
          window.location.href = `${returnUrl}/success?payment_id=${result.paymentId}`
        }, 1000)
      } else {
        setPaymentStatus("error")
        toast({
          title: "Payment Failed",
          description: result.error || "There was an error processing your payment.",
          variant: "destructive",
        })
        
        // Reset status after delay
        setTimeout(() => {
          setPaymentStatus("idle")
          setIsLoading(false)
        }, 2000)
      }
    } catch (error: any) {
      setPaymentStatus("error")
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      })
      
      // Reset status after delay
      setTimeout(() => {
        setPaymentStatus("idle")
        setIsLoading(false)
      }, 2000)
    }
  }

  const getButtonContent = () => {
    // Icon sizes based on button size
    const iconSizes = {
      xs: "h-3 w-3",
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5"
    };
    
    // Icon margin based on button size
    const iconMargin = {
      xs: "mr-1",
      sm: "mr-1.5",
      md: "mr-2",
      lg: "mr-2.5"
    };
    
    // Text size based on button size
    const textSize = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg"
    };
    
    const iconSize = iconSizes[size];
    const marginRight = iconMargin[size];
    const fontSize = textSize[size];

    switch (paymentStatus) {
      case "processing":
        return (
          <div className={`flex items-center ${fontSize}`}>
            <Loader2 className={`${marginRight} ${iconSize} animate-spin`} />
            <span>Processing...</span>
          </div>
        )
      case "success":
        return (
          <div className={`flex items-center ${fontSize}`}>
            <Check className={`${marginRight} ${iconSize}`} />
            <span>Payment Successful!</span>
          </div>
        )
      case "error":
        return (
          <div className={`flex items-center ${fontSize}`}>
            <AlertCircle className={`${marginRight} ${iconSize}`} />
            <span>Payment Failed</span>
          </div>
        )
      default:
        return (
          <div className={`flex items-center ${fontSize}`}>
            <CreditCard className={`${marginRight} ${iconSize}`} />
            <span>{children}</span>
            {amount && <span className="ml-1">({currency} {amount.toLocaleString()})</span>}
          </div>
        )
    }
  }
  
  const getButtonStyles = () => {
    let baseClasses = className
    
    if (paymentStatus === "success") {
      return `bg-green-600 hover:bg-green-700 text-white ${baseClasses}`
    }
    
    if (paymentStatus === "error") {
      return `bg-red-600 hover:bg-red-700 text-white ${baseClasses}`
    }
    
    return baseClasses
  }

  // Button height based on size
  const buttonHeight = {
    xs: "h-7",
    sm: "h-8 xs:h-9",
    md: "h-9 xs:h-10", 
    lg: "h-10 xs:h-12"
  }[size];
  
  // Button padding based on size
  const buttonPadding = {
    xs: "px-2 py-0.5",
    sm: "px-2.5 xs:px-3 py-1",
    md: "px-3 xs:px-4 py-1.5", 
    lg: "px-4 xs:px-6 py-2"
  }[size];
  
  return (
    <motion.div
      whileHover={{ scale: paymentStatus === "idle" ? 1.02 : 1 }}
      whileTap={{ scale: paymentStatus === "idle" ? 0.98 : 1 }}
    >
      <Button
        onClick={handlePayment}
        disabled={isLoading || paymentStatus !== "idle"}
        className={`relative overflow-hidden ${buttonHeight} ${buttonPadding} ${getButtonStyles()}`}
        variant={variant}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={paymentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {getButtonContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Animated background for processing state */}
        {paymentStatus === "processing" && (
          <div className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        )}
      </Button>
    </motion.div>
  )
} 