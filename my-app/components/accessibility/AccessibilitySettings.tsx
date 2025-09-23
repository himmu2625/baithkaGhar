'use client'

import React, { useState } from 'react'
import { useAccessibilityContext } from './AccessibilityProvider'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { AccessibleModal } from '@/components/ui/AccessibleModal'
import { AccessibleCheckbox } from '@/components/ui/AccessibleForm'

interface AccessibilitySettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const { preferences, updatePreference, announceToScreenReader } = useAccessibilityContext()
  const [hasChanges, setHasChanges] = useState(false)

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    updatePreference(key, value)
    setHasChanges(true)
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`)
  }

  const handleSave = () => {
    announceToScreenReader('Accessibility settings saved')
    setHasChanges(false)
    onClose()
  }

  const handleReset = () => {
    const defaults = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: false,
      focusIndicators: true
    }

    Object.entries(defaults).forEach(([key, value]) => {
      updatePreference(key as keyof typeof preferences, value)
    })

    announceToScreenReader('Accessibility settings reset to defaults')
    setHasChanges(false)
  }

  const settingsGroups = [
    {
      title: 'Visual Preferences',
      settings: [
        {
          key: 'highContrast' as const,
          label: 'High Contrast Mode',
          description: 'Increases contrast for better visibility'
        },
        {
          key: 'largeText' as const,
          label: 'Large Text',
          description: 'Increases text size throughout the application'
        },
        {
          key: 'focusIndicators' as const,
          label: 'Enhanced Focus Indicators',
          description: 'Makes focus outlines more visible when navigating with keyboard'
        }
      ]
    },
    {
      title: 'Motion Preferences',
      settings: [
        {
          key: 'reducedMotion' as const,
          label: 'Reduce Motion',
          description: 'Reduces animations and transitions'
        }
      ]
    },
    {
      title: 'Navigation Preferences',
      settings: [
        {
          key: 'keyboardNavigation' as const,
          label: 'Enhanced Keyboard Navigation',
          description: 'Improves keyboard navigation with additional shortcuts'
        },
        {
          key: 'screenReader' as const,
          label: 'Screen Reader Optimizations',
          description: 'Provides additional context for screen reader users'
        }
      ]
    }
  ]

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Settings"
      description="Customize your accessibility preferences to improve your experience"
      size="lg"
      footer={
        <div className="flex space-x-3">
          <AccessibleButton
            variant="primary"
            onClick={handleSave}
            ariaLabel="Save accessibility settings"
          >
            Save Settings
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            onClick={handleReset}
            ariaLabel="Reset accessibility settings to default"
          >
            Reset to Defaults
          </AccessibleButton>
          <AccessibleButton
            variant="ghost"
            onClick={onClose}
            ariaLabel="Cancel and close settings"
          >
            Cancel
          </AccessibleButton>
        </div>
      }
    >
      <div className="space-y-6">
        {hasChanges && (
          <div
            className="bg-blue-50 border border-blue-200 rounded-md p-4"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-blue-800">
              You have unsaved changes. Don't forget to save your preferences.
            </p>
          </div>
        )}

        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {group.title}
            </h3>

            <div className="space-y-4">
              {group.settings.map((setting) => (
                <AccessibleCheckbox
                  key={setting.key}
                  id={`setting-${setting.key}`}
                  label={setting.label}
                  description={setting.description}
                  checked={preferences[setting.key]}
                  onChange={(e) => handlePreferenceChange(setting.key, e.target.checked)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Keyboard Shortcuts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Navigation</h4>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Tab</span>
                  <span>Next element</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + Tab</span>
                  <span>Previous element</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter / Space</span>
                  <span>Activate button</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span>Close modal/menu</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Lists & Menus</h4>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Arrow Keys</span>
                  <span>Navigate items</span>
                </div>
                <div className="flex justify-between">
                  <span>Home</span>
                  <span>First item</span>
                </div>
                <div className="flex justify-between">
                  <span>End</span>
                  <span>Last item</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Up/Down</span>
                  <span>Jump sections</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            About Accessibility
          </h3>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              This application follows Web Content Accessibility Guidelines (WCAG) 2.1
              to ensure it's usable by everyone, including people with disabilities.
            </p>
            <p>
              If you encounter any accessibility issues or have suggestions for improvement,
              please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </AccessibleModal>
  )
}

export function AccessibilityButton() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
      <AccessibleButton
        variant="ghost"
        size="sm"
        onClick={() => setIsSettingsOpen(true)}
        ariaLabel="Open accessibility settings"
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg border"
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
        }
      >
        Accessibility
      </AccessibleButton>

      <AccessibilitySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}