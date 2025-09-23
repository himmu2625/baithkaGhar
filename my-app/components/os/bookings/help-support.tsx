'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Video,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  PlayCircle,
  Download,
  Send,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Headphones,
  Calendar,
  Settings,
  Globe,
  Smartphone,
  Monitor,
  Zap,
  Shield,
  CreditCard,
  Building,
  User,
  Navigation,
  LifeBuoy,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  lastUpdated: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: {
    id: string;
    message: string;
    sender: 'user' | 'support';
    timestamp: string;
    attachments?: string[];
  }[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'interactive' | 'article';
  url?: string;
  steps?: {
    title: string;
    description: string;
    image?: string;
  }[];
  views: number;
  rating: number;
  createdAt: string;
}

interface HelpSupportProps {
  propertyId: string;
}

const categoryConfig = {
  technical: { label: 'Technical Issues', icon: Settings, color: 'text-blue-600' },
  billing: { label: 'Billing & Payments', icon: CreditCard, color: 'text-green-600' },
  feature_request: { label: 'Feature Requests', icon: Lightbulb, color: 'text-purple-600' },
  bug_report: { label: 'Bug Reports', icon: AlertTriangle, color: 'text-red-600' },
  general: { label: 'General Questions', icon: HelpCircle, color: 'text-gray-600' }
};

const priorityConfig = {
  low: { color: 'bg-gray-500', label: 'Low' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  urgent: { color: 'bg-red-500', label: 'Urgent' }
};

const statusConfig = {
  open: { color: 'bg-blue-500', label: 'Open', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  in_progress: { color: 'bg-yellow-500', label: 'In Progress', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  waiting: { color: 'bg-orange-500', label: 'Waiting', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  resolved: { color: 'bg-green-500', label: 'Resolved', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  closed: { color: 'bg-gray-500', label: 'Closed', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
};

export default function HelpSupport({ propertyId }: HelpSupportProps) {
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelpData();
  }, [propertyId]);

  const fetchHelpData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockFAQs: FAQItem[] = [
        {
          id: 'faq_1',
          question: 'How do I create a new booking?',
          answer: 'To create a new booking, navigate to the Bookings tab and click the "New Booking" button. Fill in the guest details, select dates and room type, then proceed through the payment process.',
          category: 'bookings',
          tags: ['booking', 'create', 'reservation'],
          helpful: 45,
          notHelpful: 3,
          lastUpdated: '2025-09-15T10:00:00Z'
        },
        {
          id: 'faq_2',
          question: 'How do I process payments through Razorpay?',
          answer: 'Razorpay integration allows secure payment processing. Go to the Payments tab, select the booking, and click "Process Payment". The system will redirect to Razorpay\'s secure gateway for payment completion.',
          category: 'payments',
          tags: ['payment', 'razorpay', 'gateway'],
          helpful: 32,
          notHelpful: 1,
          lastUpdated: '2025-09-18T14:30:00Z'
        },
        {
          id: 'faq_3',
          question: 'How do I set up room availability?',
          answer: 'Room availability is managed through the Room Status tab. You can update room status (available, cleaning, maintenance, occupied) and set availability calendars for each room type.',
          category: 'rooms',
          tags: ['rooms', 'availability', 'calendar'],
          helpful: 28,
          notHelpful: 2,
          lastUpdated: '2025-09-20T09:15:00Z'
        },
        {
          id: 'faq_4',
          question: 'How do I configure email templates?',
          answer: 'Email templates can be managed in the Communications tab. Click "Email Templates" to create or edit templates for confirmations, reminders, and other automated messages.',
          category: 'communication',
          tags: ['email', 'templates', 'communication'],
          helpful: 19,
          notHelpful: 0,
          lastUpdated: '2025-09-19T16:45:00Z'
        },
        {
          id: 'faq_5',
          question: 'How do I generate reports and analytics?',
          answer: 'The Analytics tab provides comprehensive reporting including revenue reports, occupancy analytics, guest demographics, and booking patterns. You can export data in CSV, PDF, or Excel formats.',
          category: 'analytics',
          tags: ['reports', 'analytics', 'export'],
          helpful: 37,
          notHelpful: 1,
          lastUpdated: '2025-09-21T08:20:00Z'
        }
      ];

      const mockTickets: SupportTicket[] = [
        {
          id: 'ticket_1',
          subject: 'Payment gateway integration issue',
          description: 'Having trouble with Razorpay payment processing. Payments are failing after successful gateway processing.',
          category: 'technical',
          priority: 'high',
          status: 'in_progress',
          createdAt: '2025-09-20T14:30:00Z',
          updatedAt: '2025-09-21T09:15:00Z',
          assignedTo: 'Technical Team',
          responses: [
            {
              id: 'resp_1',
              message: 'Thank you for reporting this issue. We are investigating the payment webhook configuration.',
              sender: 'support',
              timestamp: '2025-09-20T15:00:00Z'
            },
            {
              id: 'resp_2',
              message: 'We have identified the issue with webhook signature verification. Deploying a fix.',
              sender: 'support',
              timestamp: '2025-09-21T09:15:00Z'
            }
          ]
        },
        {
          id: 'ticket_2',
          subject: 'Feature request: Bulk booking operations',
          description: 'Would like to have the ability to select multiple bookings and perform bulk operations like status updates or sending communications.',
          category: 'feature_request',
          priority: 'medium',
          status: 'open',
          createdAt: '2025-09-19T11:20:00Z',
          updatedAt: '2025-09-19T11:20:00Z',
          responses: []
        }
      ];

      const mockTutorials: Tutorial[] = [
        {
          id: 'tutorial_1',
          title: 'Getting Started with Booking Management',
          description: 'Learn the basics of managing bookings, from creation to check-out',
          category: 'basics',
          duration: 15,
          difficulty: 'beginner',
          type: 'video',
          url: '#',
          views: 1248,
          rating: 4.8,
          createdAt: '2025-08-15T10:00:00Z'
        },
        {
          id: 'tutorial_2',
          title: 'Setting Up Payment Processing',
          description: 'Complete guide to configuring Razorpay and managing payments',
          category: 'payments',
          duration: 12,
          difficulty: 'intermediate',
          type: 'interactive',
          steps: [
            {
              title: 'Create Razorpay Account',
              description: 'Sign up for a Razorpay business account and get your API keys'
            },
            {
              title: 'Configure Integration',
              description: 'Add your Razorpay credentials in the payment settings'
            },
            {
              title: 'Test Payments',
              description: 'Process test payments to ensure everything works correctly'
            }
          ],
          views: 892,
          rating: 4.6,
          createdAt: '2025-08-20T14:00:00Z'
        },
        {
          id: 'tutorial_3',
          title: 'Advanced Analytics and Reporting',
          description: 'Master the analytics dashboard and create custom reports',
          category: 'analytics',
          duration: 20,
          difficulty: 'advanced',
          type: 'article',
          views: 456,
          rating: 4.9,
          createdAt: '2025-09-01T16:30:00Z'
        }
      ];

      setFaqs(mockFAQs);
      setTickets(mockTickets);
      setTutorials(mockTutorials);
    } catch (error) {
      console.error('Error fetching help data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: any) => {
    try {
      const newTicket: SupportTicket = {
        id: `ticket_${Date.now()}`,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: []
      };

      setTickets(prev => [newTicket, ...prev]);
      setShowTicketDialog(false);
      alert('Support ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create support ticket.');
    }
  };

  const markHelpful = async (faqId: string, helpful: boolean) => {
    try {
      setFaqs(prev => prev.map(faq =>
        faq.id === faqId
          ? {
              ...faq,
              helpful: helpful ? faq.helpful + 1 : faq.helpful,
              notHelpful: !helpful ? faq.notHelpful + 1 : faq.notHelpful
            }
          : faq
      ));
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading help & support...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Help & Support Center
            </h1>
            <p className="text-blue-100 text-lg">
              Get help with booking management, find tutorials, and contact support
            </p>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Video className="h-4 w-4 mr-2" />
              Video Tutorials
            </Button>
            <Button
              onClick={() => setShowTicketDialog(true)}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('faq')}>
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2">FAQs</h3>
            <p className="text-gray-600 text-sm">Find quick answers to common questions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('tutorials')}>
          <CardContent className="p-6 text-center">
            <PlayCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Tutorials</h3>
            <p className="text-gray-600 text-sm">Step-by-step guides and videos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('tickets')}>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-purple-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Support Tickets</h3>
            <p className="text-gray-600 text-sm">Track your support requests</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('contact')}>
          <CardContent className="p-6 text-center">
            <Headphones className="h-12 w-12 mx-auto text-orange-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Live Support</h3>
            <p className="text-gray-600 text-sm">Chat with our support team</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger value="faq" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            FAQs
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Tutorials
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Contact
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="faq-search">Search FAQs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="faq-search"
                      placeholder="Search questions, answers, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bookings">Bookings</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="rooms">Rooms</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id}>
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between text-left">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 mb-4">{faq.answer}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">Was this helpful?</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markHelpful(faq.id, true)}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {faq.helpful}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markHelpful(faq.id, false)}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              {faq.notHelpful}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {filteredFAQs.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No FAQs Found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search terms or browse all categories.
                  </p>
                  <Button
                    onClick={() => setShowTicketDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-6">
          <div className="grid gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {tutorial.type === 'video' ? (
                          <PlayCircle className="h-6 w-6 text-blue-600" />
                        ) : tutorial.type === 'interactive' ? (
                          <Monitor className="h-6 w-6 text-green-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{tutorial.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tutorial.duration} min
                          </span>
                          <Badge variant="outline">
                            {tutorial.difficulty}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {tutorial.rating}
                          </span>
                          <span className="text-gray-500">
                            {tutorial.views} views
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTutorial(tutorial);
                          setShowTutorialDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {tutorial.url && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Your Support Tickets</h3>
              <p className="text-gray-600">Track and manage your support requests</p>
            </div>
            <Button
              onClick={() => setShowTicketDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          <div className="grid gap-4">
            {tickets.map((ticket) => {
              const categoryConf = categoryConfig[ticket.category];
              const statusConf = statusConfig[ticket.status];
              const priorityConf = priorityConfig[ticket.priority];

              return (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${statusConf.bgColor}`}>
                          <categoryConf.icon className={`h-6 w-6 ${categoryConf.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{categoryConf.label}</Badge>
                            <Badge className={`${priorityConf.color} text-white`}>
                              {priorityConf.label}
                            </Badge>
                            <Badge className={`${statusConf.color} text-white`}>
                              {statusConf.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-sm text-gray-500">
                          Created: {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        {ticket.assignedTo && (
                          <div className="text-sm text-gray-500">
                            Assigned to: {ticket.assignedTo}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {ticket.responses.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm">
                          <strong>Latest Update:</strong> {ticket.responses[ticket.responses.length - 1].message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(ticket.responses[ticket.responses.length - 1].timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {tickets.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Support Tickets</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any support tickets yet.
                  </p>
                  <Button
                    onClick={() => setShowTicketDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Chat with our support team in real-time
                </p>
                <Badge className="bg-green-500 text-white mb-4">Online</Badge>
                <div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Send us an email and we'll respond within 24 hours
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  support@baithakaghar.com
                </div>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Call us for urgent support needs
                </p>
                <div className="text-sm text-gray-500 mb-2">
                  +91 98765 43210
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Mon-Fri 9 AM - 6 PM IST
                </div>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Office Hours & Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Support Hours</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Response Times</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Live Chat</span>
                      <span className="text-green-600">Immediate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="text-blue-600">Within 24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support Tickets</span>
                      <span className="text-purple-600">Within 4 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                placeholder="Please provide detailed information about your issue..."
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => createTicket({
                  subject: 'Sample Subject',
                  description: 'Sample Description',
                  category: 'technical',
                  priority: 'medium'
                })}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Ticket
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTicketDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Dialog */}
      <Dialog open={showTutorialDialog} onOpenChange={setShowTutorialDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTutorial?.title}</DialogTitle>
          </DialogHeader>

          {selectedTutorial && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant="outline">{selectedTutorial.difficulty}</Badge>
                <span className="text-sm text-gray-600">
                  {selectedTutorial.duration} minutes
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{selectedTutorial.rating}</span>
                </div>
              </div>

              <p className="text-gray-700">{selectedTutorial.description}</p>

              {selectedTutorial.type === 'interactive' && selectedTutorial.steps && (
                <div className="space-y-4">
                  <h4 className="font-medium">Tutorial Steps:</h4>
                  {selectedTutorial.steps.map((step, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">
                        Step {index + 1}: {step.title}
                      </h5>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedTutorial.url && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Start Tutorial
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowTutorialDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}