"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  Eye,
  Edit,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  FileText,
  Users,
  MessageCircle,
  Smartphone,
  Zap
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'booking_confirmation' | 'payment_reminder' | 'check_in_reminder' | 'check_out_reminder' | 'cancellation' | 'custom'
  isActive: boolean
  variables: string[]
  createdAt: string
  updatedAt: string
}

interface CommunicationHistory {
  id: string
  bookingId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  type: 'email' | 'sms' | 'whatsapp'
  templateId?: string
  subject?: string
  message: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  sentAt: string
  deliveredAt?: string
  provider: 'smtp' | 'twilio' | 'whatsapp_business'
}

interface AutomationRule {
  id: string
  name: string
  trigger: 'booking_created' | 'payment_received' | 'check_in_due' | 'check_out_due' | 'booking_cancelled'
  delay: number // minutes
  templateId: string
  channels: ('email' | 'sms' | 'whatsapp')[]
  isActive: boolean
  conditions?: {
    bookingStatus?: string[]
    paymentStatus?: string[]
    guestType?: string[]
  }
}

interface CommunicationCenterProps {
  propertyId: string
}

const templateTypes = {
  booking_confirmation: { label: 'Booking Confirmation', icon: CheckCircle2, color: 'text-green-600' },
  payment_reminder: { label: 'Payment Reminder', icon: Clock, color: 'text-yellow-600' },
  check_in_reminder: { label: 'Check-in Reminder', icon: Calendar, color: 'text-blue-600' },
  check_out_reminder: { label: 'Check-out Reminder', icon: Calendar, color: 'text-purple-600' },
  cancellation: { label: 'Cancellation Notice', icon: XCircle, color: 'text-red-600' },
  custom: { label: 'Custom Template', icon: FileText, color: 'text-gray-600' }
}

const communicationTypes = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' }
}

const statusConfig = {
  sent: { label: 'Sent', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  delivered: { label: 'Delivered', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  failed: { label: 'Failed', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  pending: { label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' }
}

export default function CommunicationCenter({ propertyId }: CommunicationCenterProps) {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [history, setHistory] = useState<CommunicationHistory[]>([])
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Initialize mock data
  useEffect(() => {
    const initializeData = () => {
      // Mock templates
      const mockTemplates: EmailTemplate[] = [
        {
          id: 'tmpl_1',
          name: 'Welcome & Booking Confirmation',
          subject: 'Your booking is confirmed! Welcome to {{propertyName}}',
          body: 'Dear {{guestName}},\n\nThank you for choosing {{propertyName}}! We are excited to host you.\n\nBooking Details:\n- Check-in: {{checkInDate}}\n- Check-out: {{checkOutDate}}\n- Room: {{roomType}}\n- Total Amount: {{totalAmount}}\n\nWe look forward to your visit!\n\nBest regards,\n{{propertyName}} Team',
          type: 'booking_confirmation',
          isActive: true,
          variables: ['propertyName', 'guestName', 'checkInDate', 'checkOutDate', 'roomType', 'totalAmount'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tmpl_2',
          name: 'Payment Reminder',
          subject: 'Payment reminder for your booking at {{propertyName}}',
          body: 'Dear {{guestName}},\n\nThis is a friendly reminder that your payment for booking {{bookingId}} is due.\n\nAmount Due: {{amountDue}}\nDue Date: {{dueDate}}\n\nPlease complete your payment to secure your reservation.\n\nThank you!',
          type: 'payment_reminder',
          isActive: true,
          variables: ['propertyName', 'guestName', 'bookingId', 'amountDue', 'dueDate'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      // Mock communication history
      const mockHistory: CommunicationHistory[] = [
        {
          id: 'comm_1',
          bookingId: 'BK001',
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          guestPhone: '+91 9876543210',
          type: 'email',
          templateId: 'tmpl_1',
          subject: 'Your booking is confirmed! Welcome to Hotel Paradise',
          message: 'Dear John Doe, Thank you for choosing Hotel Paradise...',
          status: 'delivered',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
          provider: 'smtp'
        },
        {
          id: 'comm_2',
          bookingId: 'BK002',
          guestName: 'Jane Smith',
          guestEmail: 'jane@example.com',
          type: 'sms',
          subject: '',
          message: 'Hi Jane! Your check-in is tomorrow at Hotel Paradise. Room 201 is ready for you!',
          status: 'sent',
          sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          provider: 'twilio'
        }
      ]

      // Mock automation rules
      const mockAutomations: AutomationRule[] = [
        {
          id: 'auto_1',
          name: 'Booking Confirmation Email',
          trigger: 'booking_created',
          delay: 5,
          templateId: 'tmpl_1',
          channels: ['email'],
          isActive: true,
          conditions: {
            bookingStatus: ['confirmed'],
            paymentStatus: ['paid', 'pending']
          }
        },
        {
          id: 'auto_2',
          name: 'Check-in Reminder',
          trigger: 'check_in_due',
          delay: 1440, // 24 hours
          templateId: 'tmpl_2',
          channels: ['email', 'sms'],
          isActive: true
        }
      ]

      setTemplates(mockTemplates)
      setHistory(mockHistory)
      setAutomations(mockAutomations)
      setLoading(false)
    }

    setTimeout(initializeData, 1000) // Simulate loading
  }, [propertyId])

  const saveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      setLoading(true)

      if (template.id) {
        // Update existing template
        setTemplates(prev => prev.map(t =>
          t.id === template.id ? { ...t, ...template, updatedAt: new Date().toISOString() } : t
        ))
      } else {
        // Create new template
        const newTemplate: EmailTemplate = {
          id: `tmpl_${Date.now()}`,
          name: template.name || '',
          subject: template.subject || '',
          body: template.body || '',
          type: template.type || 'custom',
          isActive: template.isActive ?? true,
          variables: extractVariables(template.body || ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setTemplates(prev => [...prev, newTemplate])
      }

      setShowTemplateDialog(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map(match => match.slice(2, -2)) : []
  }

  const sendMessage = async (data: {
    bookingId: string
    channels: string[]
    templateId?: string
    customMessage?: string
  }) => {
    try {
      const newMessage: CommunicationHistory = {
        id: `comm_${Date.now()}`,
        bookingId: data.bookingId,
        guestName: 'Guest Name',
        guestEmail: 'guest@example.com',
        type: data.channels[0] as 'email' | 'sms' | 'whatsapp',
        templateId: data.templateId,
        message: data.customMessage || 'Template message...',
        status: 'sent',
        sentAt: new Date().toISOString(),
        provider: 'smtp'
      }

      setHistory(prev => [newMessage, ...prev])
      setShowSendDialog(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading communication center...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Communication Center
            </h1>
            <p className="text-gray-600 mt-2">Manage guest communications and automated messaging</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Quick Send
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Communication History</TabsTrigger>
            <TabsTrigger value="automation">Automation Rules</TabsTrigger>
            <TabsTrigger value="send">Send Message</TabsTrigger>
          </TabsList>

          {/* Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Email Templates</h3>
                <p className="text-gray-600">Manage your communication templates</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedTemplate(null)
                  setShowTemplateDialog(true)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredTemplates.map((template) => {
                const typeConfig = templateTypes[template.type]
                const TypeIcon = typeConfig.icon

                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.subject}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{typeConfig.label}</Badge>
                              <Badge variant={template.isActive ? "default" : "secondary"}>
                                {template.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setShowTemplateDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Communication History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Communication History</h3>
                <p className="text-gray-600">Track all guest communications</p>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredHistory.map((item) => {
                const typeConfig = communicationTypes[item.type]
                const statusConf = statusConfig[item.status]
                const TypeIcon = typeConfig.icon

                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${statusConf.bgColor}`}>
                            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.guestName}</h4>
                            <p className="text-sm text-gray-600">
                              Booking: {item.bookingId} | {item.guestEmail}
                            </p>
                            {item.subject && (
                              <p className="text-sm font-medium mt-1">{item.subject}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                              {item.message}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${statusConf.color} text-white`}>
                            {statusConf.label}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.sentAt).toLocaleString()}
                          </p>
                          {item.deliveredAt && (
                            <p className="text-xs text-green-600">
                              Delivered: {new Date(item.deliveredAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Automation Rules Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Automation Rules</h3>
                <p className="text-gray-600">Set up automated communication workflows</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </div>

            <div className="grid gap-4">
              {automations.map((rule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{rule.name}</h4>
                          <p className="text-sm text-gray-600">
                            Trigger: {rule.trigger.replace('_', ' ')} | Delay: {rule.delay} minutes
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {rule.channels.map((channel) => {
                              const channelConfig = communicationTypes[channel as keyof typeof communicationTypes]
                              return (
                                <Badge key={channel} variant="outline">
                                  <channelConfig.icon className="h-3 w-3 mr-1" />
                                  {channelConfig.label}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => {
                            setAutomations(prev => prev.map(a =>
                              a.id === rule.id ? { ...a, isActive: checked } : a
                            ))
                          }}
                        />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Send Message Tab */}
          <TabsContent value="send" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send New Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="booking-id">Booking ID</Label>
                    <Input id="booking-id" placeholder="Enter booking ID" />
                  </div>
                  <div>
                    <Label htmlFor="template">Select Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Communication Channels</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-message">Custom Message</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Enter your custom message here..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    defaultValue={selectedTemplate?.name}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select defaultValue={selectedTemplate?.type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templateTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  defaultValue={selectedTemplate?.subject}
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <Label htmlFor="template-body">Message Body</Label>
                <Textarea
                  id="template-body"
                  defaultValue={selectedTemplate?.body}
                  placeholder="Enter message content with variables like {{guestName}}, {{propertyName}}, etc."
                  rows={10}
                />
              </div>

              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Use variables like {"{{guestName}}"}, {"{{propertyName}}"}, {"{{checkInDate}}"} to personalize messages.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  onClick={() => saveTemplate(selectedTemplate || {})}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}