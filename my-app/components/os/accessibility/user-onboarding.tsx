"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string
  position?: "top" | "bottom" | "left" | "right"
  action?: () => void
  skip?: boolean
}

interface OnboardingFlow {
  id: string
  name: string
  description: string
  steps: OnboardingStep[]
}

// Onboarding context
interface OnboardingContextType {
  currentFlow: OnboardingFlow | null
  currentStepIndex: number
  isOnboarding: boolean
  startOnboarding: (flow: OnboardingFlow) => void
  nextStep: () => void
  previousStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
}

const OnboardingContext = React.createContext<OnboardingContextType | null>(
  null
)

export const useOnboarding = () => {
  const context = React.useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return context
}

// Onboarding provider
interface OnboardingProviderProps {
  children: React.ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isOnboarding, setIsOnboarding] = useState(false)

  const startOnboarding = (flow: OnboardingFlow) => {
    setCurrentFlow(flow)
    setCurrentStepIndex(0)
    setIsOnboarding(true)
  }

  const nextStep = () => {
    if (currentFlow && currentStepIndex < currentFlow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      completeOnboarding()
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const skipOnboarding = () => {
    setCurrentFlow(null)
    setCurrentStepIndex(0)
    setIsOnboarding(false)
  }

  const completeOnboarding = () => {
    if (currentFlow) {
      localStorage.setItem(`onboarding-${currentFlow.id}-completed`, "true")
    }
    setCurrentFlow(null)
    setCurrentStepIndex(0)
    setIsOnboarding(false)
  }

  return (
    <OnboardingContext.Provider
      value={{
        currentFlow,
        currentStepIndex,
        isOnboarding,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

// Onboarding overlay
export const OnboardingOverlay: React.FC = () => {
  const {
    currentFlow,
    currentStepIndex,
    isOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
  } = useOnboarding()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isOnboarding && currentFlow) {
      const step = currentFlow.steps[currentStepIndex]
      if (step.target) {
        const element = document.querySelector(step.target) as HTMLElement
        setTargetElement(element)
        element?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [isOnboarding, currentFlow, currentStepIndex])

  if (!isOnboarding || !currentFlow) return null

  const currentStep = currentFlow.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === currentFlow.steps.length - 1

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Highlight target element */}
      {targetElement && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 rounded-lg"
          style={{
            top: targetElement.offsetTop - 8,
            left: targetElement.offsetLeft - 8,
            width: targetElement.offsetWidth + 16,
            height: targetElement.offsetHeight + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm ${
          currentStep.position === "top"
            ? "bottom-full mb-4"
            : currentStep.position === "bottom"
            ? "top-full mt-4"
            : currentStep.position === "left"
            ? "right-full mr-4"
            : "left-full ml-4"
        }`}
        style={{
          top: targetElement
            ? targetElement.offsetTop + targetElement.offsetHeight / 2
            : "50%",
          left: targetElement
            ? targetElement.offsetLeft + targetElement.offsetWidth / 2
            : "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentStep.title}
          </h3>
          <button
            onClick={skipOnboarding}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Skip onboarding"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {currentStep.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isFirstStep && (
              <button
                onClick={previousStep}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStepIndex + 1} of {currentFlow.steps.length}
            </span>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Guided tour component
interface GuidedTourProps {
  flow: OnboardingFlow
  trigger?: React.ReactNode
  autoStart?: boolean
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  flow,
  trigger,
  autoStart = false,
}) => {
  const { startOnboarding, isOnboarding } = useOnboarding()
  const router = useRouter()

  useEffect(() => {
    if (autoStart) {
      const isCompleted = localStorage.getItem(
        `onboarding-${flow.id}-completed`
      )
      if (!isCompleted) {
        startOnboarding(flow)
      }
    }
  }, [autoStart, flow, startOnboarding])

  const handleStart = () => {
    startOnboarding(flow)
  }

  if (trigger) {
    return <div onClick={handleStart}>{trigger}</div>
  }

  return (
    <button
      onClick={handleStart}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      disabled={isOnboarding}
    >
      Start Tour
    </button>
  )
}

// Interactive tooltip component
interface InteractiveTooltipProps {
  content: string
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  showArrow?: boolean
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  content,
  children,
  position = "top",
  showArrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({ x: rect.left + rect.width / 2, y: rect.top })
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <div className="relative inline-block">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg ${
            position === "top"
              ? "bottom-full mb-2"
              : position === "bottom"
              ? "top-full mt-2"
              : position === "left"
              ? "right-full mr-2"
              : "left-full ml-2"
          }`}
          style={{
            left: coords.x,
            top: coords.y,
            transform: "translateX(-50%)",
          }}
        >
          {content}
          {showArrow && (
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === "top"
                  ? "top-full -mt-1"
                  : position === "bottom"
                  ? "bottom-full -mb-1"
                  : position === "left"
                  ? "left-full -ml-1"
                  : "right-full -mr-1"
              }`}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Progress indicator
export const OnboardingProgress: React.FC = () => {
  const { currentFlow, currentStepIndex, isOnboarding } = useOnboarding()

  if (!isOnboarding || !currentFlow) return null

  const progress = ((currentStepIndex + 1) / currentFlow.steps.length) * 100

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center space-x-3">
          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {currentStepIndex + 1} / {currentFlow.steps.length}
          </span>
        </div>
      </div>
    </div>
  )
}

// Predefined onboarding flows
export const onboardingFlows: OnboardingFlow[] = [
  {
    id: "dashboard-tour",
    name: "Dashboard Tour",
    description: "Learn about the main dashboard features",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Baithaka GHAR OS",
        description:
          "This tour will help you understand the main features of your property management system.",
        position: "bottom",
      },
      {
        id: "key-metrics",
        title: "Key Metrics",
        description:
          "View important metrics like occupancy rate, revenue, and bookings at a glance.",
        target: '[data-tour="key-metrics"]',
        position: "bottom",
      },
      {
        id: "recent-bookings",
        title: "Recent Bookings",
        description: "Monitor your latest bookings and their status here.",
        target: '[data-tour="recent-bookings"]',
        position: "left",
      },
      {
        id: "navigation",
        title: "Navigation",
        description:
          "Use the sidebar to navigate between different modules like Inventory, Bookings, and Reports.",
        target: '[data-tour="sidebar"]',
        position: "right",
      },
    ],
  },
  {
    id: "booking-flow",
    name: "Booking Management",
    description: "Learn how to manage bookings effectively",
    steps: [
      {
        id: "booking-overview",
        title: "Booking Overview",
        description:
          "This section shows all your current and upcoming bookings.",
        target: '[data-tour="booking-overview"]',
        position: "bottom",
      },
      {
        id: "create-booking",
        title: "Create New Booking",
        description: "Click here to create a new booking for your guests.",
        target: '[data-tour="create-booking"]',
        position: "top",
      },
      {
        id: "booking-filters",
        title: "Filter Bookings",
        description:
          "Use these filters to find specific bookings by date, status, or guest name.",
        target: '[data-tour="booking-filters"]',
        position: "bottom",
      },
    ],
  },
]

// Onboarding trigger component
export const OnboardingTrigger: React.FC = () => {
  const { startOnboarding } = useOnboarding()

  return (
    <div className="flex flex-wrap gap-2">
      {onboardingFlows.map((flow) => (
        <button
          key={flow.id}
          onClick={() => startOnboarding(flow)}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {flow.name}
        </button>
      ))}
    </div>
  )
}
