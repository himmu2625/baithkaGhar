"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  number: number
  title: string
  description: string
}

interface ProgressIndicatorProps {
  currentStep: number
  steps: Step[]
}

export const BOOKING_STEPS = [
  { number: 1, title: "Review", description: "Review your booking" },
  { number: 2, title: "Guest Details", description: "Enter information" },
  { number: 3, title: "Payment", description: "Complete payment" },
  { number: 4, title: "Confirmation", description: "Booking confirmed" },
]

export function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
  return (
    <div className="w-full mt-14 px-4 bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Desktop view */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                      currentStep > step.number
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 hidden lg:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-4 transition-all",
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">
              Step {currentStep} of {steps.length}
            </p>
            <p className="text-xs text-gray-500">
              {steps.find((s) => s.number === currentStep)?.title}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
