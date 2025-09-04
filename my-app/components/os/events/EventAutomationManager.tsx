'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Zap,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Settings,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Plus,
  BarChart3,
  Clock,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Automation {
  _id: string;
  automationName: string;
  automationType: 'email' | 'sms' | 'whatsapp' | 'notification' | 'task' | 'workflow';
  isActive: boolean;
  triggers: Array<{
    triggerType: string;
    triggerEvent?: string;
    timeDelay?: {
      value: number;
      unit: string;
    };
  }>;
  targetAudience: {
    recipientType: string;
  };
  analytics: {
    totalTriggers: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    engagementMetrics?: {
      openRate: number;
      clickRate: number;
      responseRate: number;
      conversionRate: number;
    };
  };
  lastExecutedAt?: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface EventAutomationManagerProps {
  propertyId: string;
}

export default function EventAutomationManager({ propertyId }: EventAutomationManagerProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    automationType: '',
    isActive: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalAutomations: 0,
    activeAutomations: 0,
    totalExecutions: 0,
    successRate: 0,
    totalTriggers: 0,
    typeBreakdown: {
      email: 0,
      sms: 0,
      workflow: 0
    }
  });

  // New automation form
  const [newAutomation, setNewAutomation] = useState({
    automationName: '',
    automationType: 'email',
    triggers: [{
      triggerType: 'event',
      triggerEvent: 'booking-confirmed',
      timeDelay: { value: 0, unit: 'hours' }
    }],
    targetAudience: {
      recipientType: 'client'
    },
    messageConfig: {
      emailConfig: {
        subject: '',
        template: 'booking-confirmation',
        textContent: ''
      },
      smsConfig: {
        message: ''
      }
    },
    executionConfig: {
      isActive: true,
      priority: 'normal',
      maxRetries: 3
    }
  });

  useEffect(() => {
    fetchAutomations();
  }, [propertyId, filters]);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        propertyId,
        ...filters
      });

      const response = await fetch(`/api/events/automation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAutomation = async () => {
    try {
      const response = await fetch('/api/events/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          ...newAutomation
        }),
      });

      if (response.ok) {
        await fetchAutomations();
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const toggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/events/automation/${automationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'executionConfig.isActive': !isActive
        }),
      });

      if (response.ok) {
        await fetchAutomations();
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const resetForm = () => {
    setNewAutomation({
      automationName: '',
      automationType: 'email',
      triggers: [{
        triggerType: 'event',
        triggerEvent: 'booking-confirmed',
        timeDelay: { value: 0, unit: 'hours' }
      }],
      targetAudience: {
        recipientType: 'client'
      },
      messageConfig: {
        emailConfig: {
          subject: '',
          template: 'booking-confirmation',
          textContent: ''
        },
        smsConfig: {
          message: ''
        }
      },
      executionConfig: {
        isActive: true,
        priority: 'normal',
        maxRetries: 3
      }
    });
  };

  const getAutomationTypeIcon = (type: string) => {
    const icons = {
      email: Mail,
      sms: MessageSquare,
      whatsapp: Phone,
      notification: Bell,
      task: CheckCircle,
      workflow: Activity
    };
    const IconComponent = icons[type as keyof typeof icons] || Zap;
    return <IconComponent className="h-4 w-4" />;
  };

  const getAutomationTypeColor = (type: string) => {
    const colors = {
      email: 'bg-blue-100 text-blue-800',
      sms: 'bg-green-100 text-green-800',
      whatsapp: 'bg-emerald-100 text-emerald-800',
      notification: 'bg-purple-100 text-purple-800',
      task: 'bg-orange-100 text-orange-800',
      workflow: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSuccessRate = (automation: Automation) => {
    if (automation.analytics.totalExecutions === 0) return 0;
    return Math.round((automation.analytics.successfulExecutions / automation.analytics.totalExecutions) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Event Automation</h2>
          <p className="text-gray-600">Automate your event management workflows</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Automations</p>
                <p className="text-2xl font-bold">{stats.totalAutomations}</p>
                <p className="text-sm text-gray-500">{stats.activeAutomations} active</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-sm text-gray-500">{stats.totalExecutions} executions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Email Automations</p>
                <p className="text-2xl font-bold">{stats.typeBreakdown.email}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SMS Automations</p>
                <p className="text-2xl font-bold">{stats.typeBreakdown.sms}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Triggers</p>
                <p className="text-2xl font-bold">{stats.totalTriggers}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search automations..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />

            <Select value={filters.automationType} onValueChange={(value) => setFilters(prev => ({ ...prev, automationType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchAutomations}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      <div className="grid gap-4">
        {automations.map((automation) => (
          <Card key={automation._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getAutomationTypeIcon(automation.automationType)}
                      <h3 className="font-semibold text-lg">{automation.automationName}</h3>
                    </div>
                    <Badge className={getAutomationTypeColor(automation.automationType)}>
                      {automation.automationType.toUpperCase()}
                    </Badge>
                    <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                      {automation.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Trigger</p>
                      <div className="space-y-1">
                        {automation.triggers.map((trigger, index) => (
                          <div key={index}>
                            <p className="font-medium capitalize">{trigger.triggerEvent?.replace('-', ' ') || trigger.triggerType}</p>
                            {trigger.timeDelay && trigger.timeDelay.value > 0 && (
                              <p className="text-xs text-gray-500">
                                Delay: {trigger.timeDelay.value} {trigger.timeDelay.unit}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Target</p>
                      <div className="space-y-1">
                        <p className="font-medium capitalize">{automation.targetAudience.recipientType}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Performance</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Success Rate</span>
                            <span>{getSuccessRate(automation)}%</span>
                          </div>
                          <Progress value={getSuccessRate(automation)} className="h-1" />
                        </div>
                        <p className="text-xs text-gray-500">
                          {automation.analytics.totalExecutions} executions
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Analytics</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Triggers:</span>
                          <span>{automation.analytics.totalTriggers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Successes:</span>
                          <span>{automation.analytics.successfulExecutions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Failures:</span>
                          <span>{automation.analytics.failedExecutions}</span>
                        </div>
                        {automation.analytics.engagementMetrics && (
                          <>
                            <div className="flex justify-between">
                              <span>Open Rate:</span>
                              <span>{automation.analytics.engagementMetrics.openRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Click Rate:</span>
                              <span>{automation.analytics.engagementMetrics.clickRate}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAutomation(automation._id, automation.isActive)}
                  >
                    {automation.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAutomation(automation);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>

                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Created by {automation.createdBy.name}</span>
                  <span>Created: {format(new Date(automation.createdAt), 'MMM dd, yyyy')}</span>
                  {automation.lastExecutedAt && (
                    <span>Last run: {format(new Date(automation.lastExecutedAt), 'MMM dd, HH:mm')}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {automation.isActive ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Running</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Paused</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription>
              Set up automated workflows for your events
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Setup</TabsTrigger>
              <TabsTrigger value="trigger">Trigger</TabsTrigger>
              <TabsTrigger value="message">Message</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="automationName">Automation Name *</Label>
                  <Input
                    id="automationName"
                    placeholder="e.g., Booking Confirmation Email"
                    value={newAutomation.automationName}
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, automationName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="automationType">Automation Type *</Label>
                  <Select 
                    value={newAutomation.automationType} 
                    onValueChange={(value) => setNewAutomation(prev => ({ ...prev, automationType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="notification">Push Notification</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientType">Target Audience *</Label>
                <Select 
                  value={newAutomation.targetAudience.recipientType} 
                  onValueChange={(value) => setNewAutomation(prev => ({
                    ...prev,
                    targetAudience: { ...prev.targetAudience, recipientType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                    <SelectItem value="custom">Custom Recipients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="trigger" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Event *</Label>
                  <Select 
                    value={newAutomation.triggers[0].triggerEvent} 
                    onValueChange={(value) => setNewAutomation(prev => ({
                      ...prev,
                      triggers: [{
                        ...prev.triggers[0],
                        triggerEvent: value as any
                      }]
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking-created">Booking Created</SelectItem>
                      <SelectItem value="booking-confirmed">Booking Confirmed</SelectItem>
                      <SelectItem value="payment-received">Payment Received</SelectItem>
                      <SelectItem value="event-completed">Event Completed</SelectItem>
                      <SelectItem value="feedback-received">Feedback Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={newAutomation.executionConfig.priority} 
                    onValueChange={(value) => setNewAutomation(prev => ({
                      ...prev,
                      executionConfig: { ...prev.executionConfig, priority: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Add Delay</Label>
                  <Switch />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delay Value</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newAutomation.triggers[0].timeDelay?.value}
                      onChange={(e) => setNewAutomation(prev => ({
                        ...prev,
                        triggers: [{
                          ...prev.triggers[0],
                          timeDelay: {
                            ...prev.triggers[0].timeDelay!,
                            value: parseInt(e.target.value) || 0
                          }
                        }]
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select 
                      value={newAutomation.triggers[0].timeDelay?.unit} 
                      onValueChange={(value) => setNewAutomation(prev => ({
                        ...prev,
                        triggers: [{
                          ...prev.triggers[0],
                          timeDelay: {
                            ...prev.triggers[0].timeDelay!,
                            unit: value as any
                          }
                        }]
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="message" className="space-y-4">
              {newAutomation.automationType === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailSubject">Email Subject *</Label>
                    <Input
                      id="emailSubject"
                      placeholder="Your booking is confirmed!"
                      value={newAutomation.messageConfig.emailConfig?.subject}
                      onChange={(e) => setNewAutomation(prev => ({
                        ...prev,
                        messageConfig: {
                          ...prev.messageConfig,
                          emailConfig: {
                            ...prev.messageConfig.emailConfig!,
                            subject: e.target.value
                          }
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailTemplate">Template</Label>
                    <Select 
                      value={newAutomation.messageConfig.emailConfig?.template} 
                      onValueChange={(value) => setNewAutomation(prev => ({
                        ...prev,
                        messageConfig: {
                          ...prev.messageConfig,
                          emailConfig: {
                            ...prev.messageConfig.emailConfig!,
                            template: value as any
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking-confirmation">Booking Confirmation</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="thank-you">Thank You</SelectItem>
                        <SelectItem value="feedback-request">Feedback Request</SelectItem>
                        <SelectItem value="payment-reminder">Payment Reminder</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailContent">Email Content</Label>
                    <Textarea
                      id="emailContent"
                      placeholder="Dear {{clientName}}, your booking for {{eventName}} has been confirmed..."
                      rows={6}
                      value={newAutomation.messageConfig.emailConfig?.textContent}
                      onChange={(e) => setNewAutomation(prev => ({
                        ...prev,
                        messageConfig: {
                          ...prev.messageConfig,
                          emailConfig: {
                            ...prev.messageConfig.emailConfig!,
                            textContent: e.target.value
                          }
                        }
                      }))}
                    />
                    <p className="text-xs text-gray-500">
                      Use variables like {`{{clientName}}, {{eventName}}, {{eventDate}}`} for personalization
                    </p>
                  </div>
                </div>
              )}

              {newAutomation.automationType === 'sms' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsMessage">SMS Message *</Label>
                    <Textarea
                      id="smsMessage"
                      placeholder="Hi {{clientName}}, your booking for {{eventName}} on {{eventDate}} is confirmed. Thank you!"
                      rows={4}
                      maxLength={160}
                      value={newAutomation.messageConfig.smsConfig?.message}
                      onChange={(e) => setNewAutomation(prev => ({
                        ...prev,
                        messageConfig: {
                          ...prev.messageConfig,
                          smsConfig: {
                            ...prev.messageConfig.smsConfig!,
                            message: e.target.value
                          }
                        }
                      }))}
                    />
                    <p className="text-xs text-gray-500">
                      {newAutomation.messageConfig.smsConfig?.message?.length || 0}/160 characters
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createAutomation}>
              Create Automation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAutomation?.automationName}
            </DialogTitle>
            <DialogDescription>
              Detailed view and analytics for this automation
            </DialogDescription>
          </DialogHeader>

          {selectedAutomation && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <Badge className={getAutomationTypeColor(selectedAutomation.automationType)}>
                          {selectedAutomation.automationType.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant={selectedAutomation.isActive ? 'default' : 'secondary'}>
                          {selectedAutomation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target:</span>
                        <span className="text-sm font-medium capitalize">
                          {selectedAutomation.targetAudience.recipientType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm">{format(new Date(selectedAutomation.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created by:</span>
                        <span className="text-sm">{selectedAutomation.createdBy.name}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Triggers:</span>
                        <span className="text-sm font-medium">{selectedAutomation.analytics.totalTriggers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Executions:</span>
                        <span className="text-sm font-medium">{selectedAutomation.analytics.totalExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate:</span>
                        <span className="text-sm font-medium">{getSuccessRate(selectedAutomation)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed Executions:</span>
                        <span className="text-sm font-medium text-red-600">{selectedAutomation.analytics.failedExecutions}</span>
                      </div>
                      {selectedAutomation.lastExecutedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Executed:</span>
                          <span className="text-sm">{format(new Date(selectedAutomation.lastExecutedAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Execution Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Success Rate</span>
                            <span>{getSuccessRate(selectedAutomation)}%</span>
                          </div>
                          <Progress value={getSuccessRate(selectedAutomation)} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                              {selectedAutomation.analytics.successfulExecutions}
                            </div>
                            <div className="text-sm text-green-600">Successful</div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-700">
                              {selectedAutomation.analytics.failedExecutions}
                            </div>
                            <div className="text-sm text-red-600">Failed</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedAutomation.analytics.engagementMetrics && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Engagement Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Open Rate:</span>
                            <span className="text-sm font-medium">
                              {selectedAutomation.analytics.engagementMetrics.openRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Click Rate:</span>
                            <span className="text-sm font-medium">
                              {selectedAutomation.analytics.engagementMetrics.clickRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Response Rate:</span>
                            <span className="text-sm font-medium">
                              {selectedAutomation.analytics.engagementMetrics.responseRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Conversion Rate:</span>
                            <span className="text-sm font-medium">
                              {selectedAutomation.analytics.engagementMetrics.conversionRate}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Execution History</CardTitle>
                    <CardDescription>Recent automation executions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Execution history will be displayed here</p>
                      <p className="text-sm">Track individual automation runs and their outcomes</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}