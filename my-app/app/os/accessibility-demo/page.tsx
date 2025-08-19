"use client"

import React, { useState } from "react"
import { MainLayout } from "@/components/os/layout"
import { RequireOSAccess } from "@/components/os/auth/rbac-protected-route"
import {
  AccessibilityProvider,
  useKeyboardNavigation,
  useScreenReaderAnnouncement,
  useHighContrastMode,
  useOnboarding,
  useHelp,
  FocusableWrapper,
  AccessibleField,
  AccessibleButton,
  AccessibleModal,
  HighContrastToggle,
  SkipToContent,
  OnboardingTrigger,
  HelpTrigger,
  QuickHelp,
  OnboardingOverlay,
  OnboardingProgress,
  HelpModal,
  NavigationModeIndicator,
  InteractiveTooltip,
  GuidedTour,
  onboardingFlows,
} from "@/components/os/accessibility"

const AccessibilityDemoContent: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { announce } = useScreenReaderAnnouncement()
  const { isHighContrast, isReducedMotion } = useHighContrastMode()
  const { startOnboarding } = useOnboarding()
  const { openHelp } = useHelp()
  const { registerShortcut, setIsNavigationMode, isNavigationMode } =
    useKeyboardNavigation()

  // Register keyboard shortcuts
  React.useEffect(() => {
    registerShortcut({
      key: "h",
      description: "Open help",
      action: openHelp,
    })

    registerShortcut({
      key: "o",
      description: "Start onboarding",
      action: () => startOnboarding(onboardingFlows[0]),
    })
  }, [registerShortcut, openHelp, startOnboarding])

  const handleSubmit = () => {
    announce("Form submitted successfully", "polite")
    setShowModal(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = "Name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.message) newErrors.message = "Message is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <div className="p-6 space-y-8">
      <SkipToContent targetId="main-content">
        Skip to main content
      </SkipToContent>

      <div id="main-content">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Accessibility Features Demo
        </h1>

        {/* Keyboard Navigation Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Keyboard Navigation
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Try navigating with your keyboard. Use Tab to move between
              elements and Enter/Space to activate them.
            </p>
            <div className="flex flex-wrap gap-4">
              <FocusableWrapper id="demo-button-1" priority={1}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Focusable Button 1
                </button>
              </FocusableWrapper>
              <FocusableWrapper id="demo-button-2" priority={2}>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Focusable Button 2
                </button>
              </FocusableWrapper>
              <FocusableWrapper id="demo-button-3" priority={3}>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Focusable Button 3
                </button>
              </FocusableWrapper>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsNavigationMode(!isNavigationMode)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                {isNavigationMode ? "Exit" : "Enter"} Navigation Mode
              </button>
              <span className="text-sm text-gray-500">
                Press H, I, B, F, S, R for quick navigation
              </span>
            </div>
          </div>
        </section>

        {/* Screen Reader Support Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Screen Reader Support
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              These components are optimized for screen readers with proper ARIA
              labels and live regions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AccessibleField
                id="demo-name"
                label="Name"
                required
                error={errors.name}
                description="Enter your full name"
              >
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </AccessibleField>

              <AccessibleField
                id="demo-email"
                label="Email"
                required
                error={errors.email}
                description="Enter your email address"
              >
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </AccessibleField>
            </div>

            <AccessibleField
              id="demo-message"
              label="Message"
              required
              error={errors.message}
              description="Enter your message"
            >
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </AccessibleField>

            <AccessibleButton
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Form
            </AccessibleButton>
          </div>
        </section>

        {/* High Contrast Mode Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            High Contrast Mode
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Toggle high contrast mode and see how the interface adapts for
              better visibility.
            </p>
            <div className="flex items-center space-x-4">
              <HighContrastToggle />
              <span className="text-sm text-gray-500">
                System preference:{" "}
                {isHighContrast ? "High contrast" : "Standard"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Standard Text
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This is standard text content.
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Interactive Element
                </h3>
                <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                  Click me
                </button>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Status
                </h3>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Success
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* User Onboarding Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            User Onboarding
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Experience guided tours and interactive tooltips to learn about
              the system.
            </p>
            <div className="flex flex-wrap gap-4">
              <OnboardingTrigger />
              <InteractiveTooltip content="This is an interactive tooltip that appears on hover">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Hover for Tooltip
                </button>
              </InteractiveTooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                data-tour="key-metrics"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Key Metrics
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This section would show important metrics.
                </p>
              </div>
              <div
                data-tour="recent-bookings"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Recent Bookings
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This section would show recent bookings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Help & Documentation Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Help & Documentation
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Access comprehensive help articles and documentation.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={openHelp}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Open Help Center
              </button>
              <QuickHelp topic="getting-started">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Quick Help: Getting Started
                </button>
              </QuickHelp>
            </div>
          </div>
        </section>

        {/* Accessibility Status Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Accessibility Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                System Preferences
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>
                  High Contrast: {isHighContrast ? "Enabled" : "Disabled"}
                </li>
                <li>
                  Reduced Motion: {isReducedMotion ? "Enabled" : "Disabled"}
                </li>
                <li>
                  Navigation Mode: {isNavigationMode ? "Active" : "Inactive"}
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    H
                  </kbd>{" "}
                  - Open Help
                </li>
                <li>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    O
                  </kbd>{" "}
                  - Start Onboarding
                </li>
                <li>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    Tab
                  </kbd>{" "}
                  - Navigate
                </li>
                <li>
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    Esc
                  </kbd>{" "}
                  - Close/Cancel
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Accessible Modal */}
      <AccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Form Submitted Successfully"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Thank you for submitting the form. Your message has been received.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Submitted Data:
            </h4>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Name:
                </dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {formData.name}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Email:
                </dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {formData.email}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Message:
                </dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {formData.message}
                </dd>
              </div>
            </dl>
          </div>
          <AccessibleButton
            onClick={() => setShowModal(false)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </AccessibleButton>
        </div>
      </AccessibleModal>

      {/* Floating Help Button */}
      <HelpTrigger />

      {/* Onboarding Overlay */}
      <OnboardingOverlay />
      <OnboardingProgress />

      {/* Help Modal */}
      <HelpModal />

      {/* Navigation Mode Indicator */}
      <NavigationModeIndicator />
    </div>
  )
}

const AccessibilityDemoPage: React.FC = () => {
  return (
    <RequireOSAccess>
      <AccessibilityProvider>
        <MainLayout>
          <AccessibilityDemoContent />
        </MainLayout>
      </AccessibilityProvider>
    </RequireOSAccess>
  )
}

export default AccessibilityDemoPage
