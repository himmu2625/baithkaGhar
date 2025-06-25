import { Loader2, CreditCard, ShieldCheck, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckoutLoadingProps {
  className?: string
  step?: "details" | "payment" | "confirmation"
}

export function CheckoutLoading({ className, step = "details" }: CheckoutLoadingProps) {
  const steps = [
    { id: "details", label: "Booking Details", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "confirmation", label: "Confirmation", icon: ShieldCheck },
  ]

  return (
    <div className={cn("min-h-screen bg-gray-50 py-16", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => {
                const Icon = stepItem.icon
                const isActive = stepItem.id === step
                const isCompleted = steps.findIndex(s => s.id === step) > index
                
                return (
                  <div key={stepItem.id} className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                      isActive ? "bg-mediumGreen text-white" : 
                      isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isActive ? "text-mediumGreen" : "text-gray-500"
                    )}>
                      {stepItem.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Loading Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-mediumGreen animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-darkGreen mb-2">
                {step === "details" && "Loading booking details..."}
                {step === "payment" && "Processing payment..."}
                {step === "confirmation" && "Confirming your booking..."}
              </h2>
              <p className="text-gray-500 text-center">
                {step === "details" && "Please wait while we prepare your booking information."}
                {step === "payment" && "Securely processing your payment. Do not refresh this page."}
                {step === "confirmation" && "Almost done! We're confirming your reservation."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutLoading 