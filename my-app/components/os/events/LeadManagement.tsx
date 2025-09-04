'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  MessageCircle,
  Star,
  DollarSign,
  Target
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  _id: string;
  leadNumber: string;
  source: string;
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  eventRequirements: {
    eventType: string;
    preferredDates: string[];
    expectedGuests: {
      min: number;
      max: number;
    };
    budget?: {
      min?: number;
      max?: number;
    };
  };
  status: string;
  priority: string;
  leadScore: number;
  assignedTo: {
    name: string;
    email: string;
  };
  lastContactDate?: string;
  nextFollowUp?: string;
  createdAt: string;
  interactions?: any[];
  quotations?: any[];
}

interface LeadManagementProps {
  propertyId: string;
}

export default function LeadManagement({ propertyId }: LeadManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    source: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalLeads: 0,
    averageLeadScore: 0,
    conversionRate: 0,
    totalConversions: 0,
    totalValue: 0
  });

  // New lead form
  const [newLeadForm, setNewLeadForm] = useState({
    source: '',
    sourceDetails: '',
    client: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    eventRequirements: {
      eventType: '',
      preferredDates: [] as Date[],
      expectedGuests: { min: 1, max: 1 },
      budget: { min: 0, max: 0 },
      cateringRequired: true,
      decorationRequired: true
    },
    priority: 'normal'
  });

  // Interaction form
  const [interactionForm, setInteractionForm] = useState({
    type: '',
    summary: '',
    outcome: '',
    duration: 0,
    followUpRequired: false,
    followUpDate: null as Date | null,
    nextAction: ''
  });

  useEffect(() => {
    fetchLeads();
  }, [propertyId, filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        propertyId,
        ...filters
      });

      const response = await fetch(`/api/events/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async () => {
    try {
      const response = await fetch('/api/events/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          ...newLeadForm,
          eventRequirements: {
            ...newLeadForm.eventRequirements,
            preferredDates: newLeadForm.eventRequirements.preferredDates.map(date => date.toISOString())
          }
        }),
      });

      if (response.ok) {
        await fetchLeads();
        setShowNewLeadDialog(false);
        resetNewLeadForm();
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const addInteraction = async () => {
    if (!selectedLead) return;

    try {
      const response = await fetch(`/api/events/leads/${selectedLead._id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interactionForm,
          followUpDate: interactionForm.followUpDate?.toISOString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedLead(data.lead);
        await fetchLeads();
        setShowInteractionDialog(false);
        resetInteractionForm();
      }
    } catch (error) {
      console.error('Failed to add interaction:', error);
    }
  };

  const resetNewLeadForm = () => {
    setNewLeadForm({
      source: '',
      sourceDetails: '',
      client: {
        name: '',
        email: '',
        phone: '',
        company: ''
      },
      eventRequirements: {
        eventType: '',
        preferredDates: [],
        expectedGuests: { min: 1, max: 1 },
        budget: { min: 0, max: 0 },
        cateringRequired: true,
        decorationRequired: true
      },
      priority: 'normal'
    });
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      type: '',
      summary: '',
      outcome: '',
      duration: 0,
      followUpRequired: false,
      followUpDate: null,
      nextAction: ''
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      interested: 'bg-green-100 text-green-800',
      quoted: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const eventTypes = [
    'wedding', 'conference', 'birthday', 'corporate', 'exhibition', 'other'
  ];

  const leadSources = [
    'website', 'phone', 'email', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'
  ];

  const interactionTypes = [
    'call', 'email', 'meeting', 'site-visit', 'whatsapp', 'other'
  ];

  const outcomes = [
    'positive', 'neutral', 'negative', 'no-response'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Lead Management</h2>
          <p className="text-gray-600">Track and convert event inquiries</p>
        </div>
        <Button onClick={() => setShowNewLeadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{stats.averageLeadScore}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold">{stats.totalConversions}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Value</p>
                <p className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {leadSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchLeads}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {leads.map((lead) => (
          <Card key={lead._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{lead.client.name}</h3>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                    <Badge className={getPriorityColor(lead.priority)} variant="outline">
                      {lead.priority.toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{lead.leadScore}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Contact</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{lead.client.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{lead.client.phone}</span>
                        </div>
                        {lead.client.company && (
                          <div className="text-gray-600">{lead.client.company}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Event Details</p>
                      <div className="space-y-1">
                        <p className="font-medium">{lead.eventRequirements.eventType}</p>
                        <p>{lead.eventRequirements.expectedGuests.min}-{lead.eventRequirements.expectedGuests.max} guests</p>
                        {lead.eventRequirements.budget?.max && (
                          <p>Budget: ₹{lead.eventRequirements.budget.min?.toLocaleString()} - ₹{lead.eventRequirements.budget.max?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Timeline</p>
                      <div className="space-y-1">
                        <p>Created: {format(new Date(lead.createdAt), 'MMM dd, yyyy')}</p>
                        {lead.lastContactDate && (
                          <p>Last Contact: {format(new Date(lead.lastContactDate), 'MMM dd, yyyy')}</p>
                        )}
                        {lead.nextFollowUp && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-600">
                              Follow-up: {format(new Date(lead.nextFollowUp), 'MMM dd')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setShowInteractionDialog(true);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
                <div>
                  Lead #{lead.leadNumber} • Source: {lead.source} • Assigned to: {lead.assignedTo.name}
                </div>
                <div className="flex items-center space-x-4">
                  {lead.interactions && (
                    <span>{lead.interactions.length} interactions</span>
                  )}
                  {lead.quotations && (
                    <span>{lead.quotations.length} quotes</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Lead Dialog */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead information to start tracking this inquiry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lead Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source *</Label>
                <Select value={newLeadForm.source} onValueChange={(value) => 
                  setNewLeadForm(prev => ({ ...prev, source: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceDetails">Source Details</Label>
                <Input
                  value={newLeadForm.sourceDetails}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, sourceDetails: e.target.value }))}
                  placeholder="Additional source information"
                />
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h4 className="font-semibold">Client Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Name *</Label>
                  <Input
                    value={newLeadForm.client.name}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      client: { ...prev.client, name: e.target.value }
                    }))}
                    placeholder="Client name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    type="email"
                    value={newLeadForm.client.email}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      client: { ...prev.client, email: e.target.value }
                    }))}
                    placeholder="Client email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone *</Label>
                  <Input
                    value={newLeadForm.client.phone}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      client: { ...prev.client, phone: e.target.value }
                    }))}
                    placeholder="Client phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientCompany">Company</Label>
                  <Input
                    value={newLeadForm.client.company}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      client: { ...prev.client, company: e.target.value }
                    }))}
                    placeholder="Company name"
                  />
                </div>
              </div>
            </div>

            {/* Event Requirements */}
            <div className="space-y-4">
              <h4 className="font-semibold">Event Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select value={newLeadForm.eventRequirements.eventType} onValueChange={(value) => 
                    setNewLeadForm(prev => ({
                      ...prev,
                      eventRequirements: { ...prev.eventRequirements, eventType: value }
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newLeadForm.priority} onValueChange={(value) => 
                    setNewLeadForm(prev => ({ ...prev, priority: value }))
                  }>
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

                <div className="space-y-2">
                  <Label htmlFor="minGuests">Min Guests *</Label>
                  <Input
                    type="number"
                    value={newLeadForm.eventRequirements.expectedGuests.min}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      eventRequirements: {
                        ...prev.eventRequirements,
                        expectedGuests: {
                          ...prev.eventRequirements.expectedGuests,
                          min: parseInt(e.target.value) || 1
                        }
                      }
                    }))}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGuests">Max Guests *</Label>
                  <Input
                    type="number"
                    value={newLeadForm.eventRequirements.expectedGuests.max}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      eventRequirements: {
                        ...prev.eventRequirements,
                        expectedGuests: {
                          ...prev.eventRequirements.expectedGuests,
                          max: parseInt(e.target.value) || 1
                        }
                      }
                    }))}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minBudget">Min Budget (₹)</Label>
                  <Input
                    type="number"
                    value={newLeadForm.eventRequirements.budget.min}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      eventRequirements: {
                        ...prev.eventRequirements,
                        budget: {
                          ...prev.eventRequirements.budget,
                          min: parseInt(e.target.value) || 0
                        }
                      }
                    }))}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBudget">Max Budget (₹)</Label>
                  <Input
                    type="number"
                    value={newLeadForm.eventRequirements.budget.max}
                    onChange={(e) => setNewLeadForm(prev => ({
                      ...prev,
                      eventRequirements: {
                        ...prev.eventRequirements,
                        budget: {
                          ...prev.eventRequirements.budget,
                          max: parseInt(e.target.value) || 0
                        }
                      }
                    }))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewLeadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createLead}>
                Create Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Interaction Dialog */}
      <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Interaction</DialogTitle>
            <DialogDescription>
              Record a new interaction with {selectedLead?.client.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interaction Type *</Label>
                <Select value={interactionForm.type} onValueChange={(value) => 
                  setInteractionForm(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {interactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome *</Label>
                <Select value={interactionForm.outcome} onValueChange={(value) => 
                  setInteractionForm(prev => ({ ...prev, outcome: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {outcomes.map((outcome) => (
                      <SelectItem key={outcome} value={outcome}>
                        {outcome.charAt(0).toUpperCase() + outcome.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                type="number"
                value={interactionForm.duration}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                value={interactionForm.summary}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="What was discussed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextAction">Next Action</Label>
              <Input
                value={interactionForm.nextAction}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, nextAction: e.target.value }))}
                placeholder="What needs to be done next..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={interactionForm.followUpRequired}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, followUpRequired: e.target.checked }))}
              />
              <Label htmlFor="followUpRequired">Follow-up required</Label>
            </div>

            {interactionForm.followUpRequired && (
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {interactionForm.followUpDate ? format(interactionForm.followUpDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={interactionForm.followUpDate || undefined}
                      onSelect={(date) => setInteractionForm(prev => ({ ...prev, followUpDate: date || null }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInteractionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addInteraction}>
                Add Interaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}