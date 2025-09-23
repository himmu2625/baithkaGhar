"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Palette, Layout, Bell, Users, Settings, Save, RotateCcw, Upload, Download, Eye, EyeOff, Plus, X, Monitor, Moon, Sun } from 'lucide-react'

interface ThemeSettings {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  darkMode: boolean
  fontSize: number
  fontFamily: string
  borderRadius: number
  animations: boolean
}

interface LayoutSettings {
  sidebarPosition: 'left' | 'right'
  compactMode: boolean
  showBreadcrumbs: boolean
  defaultView: 'grid' | 'list' | 'table'
  cardsPerRow: number
  showQuickActions: boolean
  collapsibleSidebar: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  newBookings: boolean
  checkInReminders: boolean
  paymentAlerts: boolean
  cancelations: boolean
  soundEnabled: boolean
  frequency: 'immediate' | 'hourly' | 'daily'
}

interface UserRole {
  id: string
  name: string
  permissions: string[]
  description: string
  users: number
}

interface WorkflowStep {
  id: string
  name: string
  type: 'approval' | 'notification' | 'action' | 'condition'
  enabled: boolean
  config: any
}

const CustomizationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('appearance')
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    darkMode: false,
    fontSize: 14,
    fontFamily: 'Inter',
    borderRadius: 8,
    animations: true
  })
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    sidebarPosition: 'left',
    compactMode: false,
    showBreadcrumbs: true,
    defaultView: 'grid',
    cardsPerRow: 3,
    showQuickActions: true,
    collapsibleSidebar: false
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newBookings: true,
    checkInReminders: true,
    paymentAlerts: true,
    cancelations: true,
    soundEnabled: false,
    frequency: 'immediate'
  })
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [workflows, setWorkflows] = useState<WorkflowStep[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize mock data
  const initializeData = useCallback(() => {
    const mockRoles: UserRole[] = [
      {
        id: '1',
        name: 'Admin',
        permissions: ['all'],
        description: 'Full system access',
        users: 2
      },
      {
        id: '2',
        name: 'Manager',
        permissions: ['bookings:read', 'bookings:write', 'reports:read', 'guests:read'],
        description: 'Booking and guest management',
        users: 5
      },
      {
        id: '3',
        name: 'Front Desk',
        permissions: ['bookings:read', 'check-in', 'check-out', 'guests:read'],
        description: 'Front desk operations',
        users: 8
      },
      {
        id: '4',
        name: 'Housekeeping',
        permissions: ['rooms:read', 'rooms:update', 'maintenance:create'],
        description: 'Room management and maintenance',
        users: 12
      }
    ]

    const mockWorkflows: WorkflowStep[] = [
      {
        id: '1',
        name: 'New booking approval',
        type: 'approval',
        enabled: true,
        config: { threshold: 10000, approvers: ['manager'] }
      },
      {
        id: '2',
        name: 'Check-in notification',
        type: 'notification',
        enabled: true,
        config: { channels: ['email', 'sms'], timing: '24h' }
      },
      {
        id: '3',
        name: 'Payment failure action',
        type: 'action',
        enabled: true,
        config: { retries: 3, escalation: true }
      }
    ]

    setUserRoles(mockRoles)
    setWorkflows(mockWorkflows)
  }, [])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const handleThemeChange = (key: keyof ThemeSettings, value: any) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const handleLayoutChange = (key: keyof LayoutSettings, value: any) => {
    setLayoutSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = () => {
    console.log('Saving settings...', { themeSettings, layoutSettings, notificationSettings })
    setHasUnsavedChanges(false)
  }

  const resetToDefaults = () => {
    setThemeSettings({
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4',
      darkMode: false,
      fontSize: 14,
      fontFamily: 'Inter',
      borderRadius: 8,
      animations: true
    })
    setLayoutSettings({
      sidebarPosition: 'left',
      compactMode: false,
      showBreadcrumbs: true,
      defaultView: 'grid',
      cardsPerRow: 3,
      showQuickActions: true,
      collapsibleSidebar: false
    })
    setNotificationSettings({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      newBookings: true,
      checkInReminders: true,
      paymentAlerts: true,
      cancelations: true,
      soundEnabled: false,
      frequency: 'immediate'
    })
    setHasUnsavedChanges(true)
  }

  const exportSettings = () => {
    const settings = { themeSettings, layoutSettings, notificationSettings, userRoles, workflows }
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'booking-system-settings.json'
    a.click()
  }

  const colorPresets = [
    { name: 'Ocean', primary: '#0ea5e9', secondary: '#3b82f6', accent: '#06b6d4' },
    { name: 'Forest', primary: '#059669', secondary: '#10b981', accent: '#34d399' },
    { name: 'Sunset', primary: '#ea580c', secondary: '#f97316', accent: '#fb923c' },
    { name: 'Purple', primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa' },
    { name: 'Rose', primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              System Customization
            </h1>
            <p className="text-gray-600 mt-2">Personalize your booking management experience</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewMode ? 'Exit Preview' : 'Preview'}
            </Button>
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">You have unsaved changes</span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Theme Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Color Theme
                    </CardTitle>
                    <CardDescription>Customize the color scheme of your interface</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Color Presets */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            className="h-16 p-2 flex flex-col items-center gap-1"
                            onClick={() => {
                              handleThemeChange('primaryColor', preset.primary)
                              handleThemeChange('secondaryColor', preset.secondary)
                              handleThemeChange('accentColor', preset.accent)
                            }}
                          >
                            <div className="flex gap-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: preset.secondary }}
                              />
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <span className="text-xs">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Input
                            id="primary-color"
                            type="color"
                            value={themeSettings.primaryColor}
                            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={themeSettings.primaryColor}
                            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={themeSettings.secondaryColor}
                            onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={themeSettings.secondaryColor}
                            onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Input
                            id="accent-color"
                            type="color"
                            value={themeSettings.accentColor}
                            onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={themeSettings.accentColor}
                            onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {themeSettings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={themeSettings.darkMode}
                        onCheckedChange={(checked) => handleThemeChange('darkMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Typography */}
                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Adjust font settings for better readability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Font Family</Label>
                      <Select value={themeSettings.fontFamily} onValueChange={(value) => handleThemeChange('fontFamily', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Font Size: {themeSettings.fontSize}px</Label>
                      <Slider
                        value={[themeSettings.fontSize]}
                        onValueChange={(value) => handleThemeChange('fontSize', value[0])}
                        min={12}
                        max={18}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Border Radius: {themeSettings.borderRadius}px</Label>
                      <Slider
                        value={[themeSettings.borderRadius]}
                        onValueChange={(value) => handleThemeChange('borderRadius', value[0])}
                        min={0}
                        max={16}
                        step={2}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="animations">Enable Animations</Label>
                      <Switch
                        id="animations"
                        checked={themeSettings.animations}
                        onCheckedChange={(checked) => handleThemeChange('animations', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>See how your changes look in real-time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="p-6 rounded-lg border"
                      style={{
                        backgroundColor: themeSettings.darkMode ? '#1f2937' : '#ffffff',
                        color: themeSettings.darkMode ? '#f9fafb' : '#111827',
                        fontSize: `${themeSettings.fontSize}px`,
                        fontFamily: themeSettings.fontFamily,
                        borderRadius: `${themeSettings.borderRadius}px`
                      }}
                    >
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">Sample Booking Card</h3>
                        <div className="flex gap-2">
                          <button
                            className="px-4 py-2 rounded text-white font-medium"
                            style={{
                              backgroundColor: themeSettings.primaryColor,
                              borderRadius: `${themeSettings.borderRadius}px`
                            }}
                          >
                            Primary Button
                          </button>
                          <button
                            className="px-4 py-2 rounded text-white font-medium"
                            style={{
                              backgroundColor: themeSettings.secondaryColor,
                              borderRadius: `${themeSettings.borderRadius}px`
                            }}
                          >
                            Secondary
                          </button>
                          <button
                            className="px-4 py-2 rounded text-white font-medium"
                            style={{
                              backgroundColor: themeSettings.accentColor,
                              borderRadius: `${themeSettings.borderRadius}px`
                            }}
                          >
                            Accent
                          </button>
                        </div>
                        <div className="space-y-2">
                          <p>Guest: John Doe</p>
                          <p>Room: Deluxe King</p>
                          <p>Check-in: Today</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Interface Layout
                  </CardTitle>
                  <CardDescription>Customize the layout and structure of your interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Sidebar Position</Label>
                    <Select value={layoutSettings.sidebarPosition} onValueChange={(value: 'left' | 'right') => handleLayoutChange('sidebarPosition', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Default View</Label>
                    <Select value={layoutSettings.defaultView} onValueChange={(value: 'grid' | 'list' | 'table') => handleLayoutChange('defaultView', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cards Per Row: {layoutSettings.cardsPerRow}</Label>
                    <Slider
                      value={[layoutSettings.cardsPerRow]}
                      onValueChange={(value) => handleLayoutChange('cardsPerRow', value[0])}
                      min={2}
                      max={6}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compact-mode">Compact Mode</Label>
                      <Switch
                        id="compact-mode"
                        checked={layoutSettings.compactMode}
                        onCheckedChange={(checked) => handleLayoutChange('compactMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-breadcrumbs">Show Breadcrumbs</Label>
                      <Switch
                        id="show-breadcrumbs"
                        checked={layoutSettings.showBreadcrumbs}
                        onCheckedChange={(checked) => handleLayoutChange('showBreadcrumbs', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-quick-actions">Show Quick Actions</Label>
                      <Switch
                        id="show-quick-actions"
                        checked={layoutSettings.showQuickActions}
                        onCheckedChange={(checked) => handleLayoutChange('showQuickActions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="collapsible-sidebar">Collapsible Sidebar</Label>
                      <Switch
                        id="collapsible-sidebar"
                        checked={layoutSettings.collapsibleSidebar}
                        onCheckedChange={(checked) => handleLayoutChange('collapsibleSidebar', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Layout Preview</CardTitle>
                  <CardDescription>Visualize your layout changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-xs text-gray-600 mb-2">Layout Structure Preview</div>
                    <div className={`flex gap-2 ${layoutSettings.sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 bg-blue-200 rounded p-2 text-xs">
                        Sidebar
                        {layoutSettings.sidebarPosition === 'right' ? ' (R)' : ' (L)'}
                      </div>
                      <div className="flex-1 bg-white rounded p-2 space-y-2">
                        {layoutSettings.showBreadcrumbs && (
                          <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                        )}
                        <div className={`grid gap-1 ${
                          layoutSettings.defaultView === 'grid' ? `grid-cols-${layoutSettings.cardsPerRow}` :
                          layoutSettings.defaultView === 'list' ? 'grid-cols-1' : 'grid-cols-1'
                        }`}>
                          {Array.from({ length: layoutSettings.cardsPerRow }, (_, i) => (
                            <div
                              key={i}
                              className={`bg-blue-100 rounded ${
                                layoutSettings.compactMode ? 'h-4' : 'h-6'
                              }`}
                            />
                          ))}
                        </div>
                        {layoutSettings.showQuickActions && (
                          <div className="h-3 bg-green-200 rounded w-1/4"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled">Sound Alerts</Label>
                    <Switch
                      id="sound-enabled"
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationChange('soundEnabled', checked)}
                    />
                  </div>

                  <div>
                    <Label>Notification Frequency</Label>
                    <Select value={notificationSettings.frequency} onValueChange={(value: 'immediate' | 'hourly' | 'daily') => handleNotificationChange('frequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Types</CardTitle>
                  <CardDescription>Choose which events trigger notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-bookings">New Bookings</Label>
                    <Switch
                      id="new-bookings"
                      checked={notificationSettings.newBookings}
                      onCheckedChange={(checked) => handleNotificationChange('newBookings', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkin-reminders">Check-in Reminders</Label>
                    <Switch
                      id="checkin-reminders"
                      checked={notificationSettings.checkInReminders}
                      onCheckedChange={(checked) => handleNotificationChange('checkInReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-alerts">Payment Alerts</Label>
                    <Switch
                      id="payment-alerts"
                      checked={notificationSettings.paymentAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('paymentAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="cancelations">Cancelations</Label>
                    <Switch
                      id="cancelations"
                      checked={notificationSettings.cancelations}
                      onCheckedChange={(checked) => handleNotificationChange('cancelations', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notification Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preview</CardTitle>
                <CardDescription>Test how notifications will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">New Booking Received</div>
                      <div className="text-sm text-gray-600">John Doe - Deluxe King Room</div>
                    </div>
                    <Badge>Email</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Check-in Reminder</div>
                      <div className="text-sm text-gray-600">Guest arriving tomorrow</div>
                    </div>
                    <Badge>Push</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Roles
                    </CardTitle>
                    <CardDescription>Manage user roles and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{role.name}</h4>
                              <Badge variant="outline">{role.users} users</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                            <div className="flex gap-1 mt-2">
                              {role.permissions.slice(0, 3).map((permission, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                              {role.permissions.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{role.permissions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            {role.name !== 'Admin' && (
                              <Button size="sm" variant="outline">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button className="w-full" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Role
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Matrix</CardTitle>
                    <CardDescription>Quick overview of role permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 font-medium">
                        <span>Permission</span>
                        <span>Roles</span>
                      </div>
                      {[
                        'Bookings Read',
                        'Bookings Write',
                        'Reports Access',
                        'User Management',
                        'Settings Access'
                      ].map((permission) => (
                        <div key={permission} className="grid grid-cols-2 gap-2 text-xs">
                          <span>{permission}</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Workflows</CardTitle>
                <CardDescription>Configure automated processes and approval flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={(checked) => {
                            setWorkflows(prev => prev.map(w =>
                              w.id === workflow.id ? { ...w, enabled: checked } : w
                            ))
                            setHasUnsavedChanges(true)
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{workflow.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{workflow.type}</Badge>
                            <span className="text-sm text-gray-600">
                              {workflow.type === 'approval' && 'Requires manager approval'}
                              {workflow.type === 'notification' && 'Sends notifications'}
                              {workflow.type === 'action' && 'Performs automated actions'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import/Export</CardTitle>
                  <CardDescription>Backup and restore your settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Import Settings</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="file" accept=".json" className="flex-1" />
                      <Button variant="outline">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Export Settings</Label>
                    <Button onClick={exportSettings} className="w-full mt-1" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Current Settings
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>Reset to Defaults</Label>
                    <Button onClick={resetToDefaults} variant="destructive" className="w-full mt-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system status and information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span className="font-mono">v2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span>2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Used</span>
                    <span>2.4 GB / 10 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span>27</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CustomizationSettings