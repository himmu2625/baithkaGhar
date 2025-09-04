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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  TrendingUp, 
  MessageSquare,
  Mail,
  Phone,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Filter,
  Download,
  Send,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
  _id: string;
  feedbackNumber: string;
  eventDetails: {
    eventName: string;
    eventDate: string;
    eventType: string;
    venueName: string;
  };
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  status: 'pending' | 'partial' | 'completed' | 'analyzed' | 'archived';
  completionPercentage: number;
  overallRatings?: {
    overallSatisfaction: number;
    valueForMoney: number;
    likelinessToRecommend: number;
    likelinessToRebook: number;
  };
  npsData?: {
    score: number;
    category: 'detractor' | 'passive' | 'promoter';
  };
  issues?: Array<{
    category: string;
    severity: string;
    description: string;
    status: string;
  }>;
  feedbackConfig: {
    collectionMethod: string;
    sentDate?: string;
    responseDate?: string;
    remindersSent: number;
  };
  createdAt: string;
}

interface EventFeedbackManagerProps {
  propertyId: string;
}

export default function EventFeedbackManager({ propertyId }: EventFeedbackManagerProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    completionRate: 0,
    averageOverallSatisfaction: 0,
    npsScore: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    totalIssues: 0,
    issueResolutionRate: 0
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [propertyId, filters]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        propertyId,
        ...filters
      });

      const response = await fetch(`/api/events/feedback?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedbackRequest = async (eventBookingId: string) => {
    try {
      const response = await fetch('/api/events/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          eventBookingId,
          collectionMethod: 'email',
          autoFollowUp: true,
          maxReminders: 3
        }),
      });

      if (response.ok) {
        await fetchFeedbacks();
      }
    } catch (error) {
      console.error('Failed to send feedback request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      analyzed: 'bg-purple-100 text-purple-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getNPSColor = (category: string) => {
    const colors = {
      promoter: 'bg-green-100 text-green-800',
      passive: 'bg-yellow-100 text-yellow-800',
      detractor: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating / 2)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-1 text-sm font-medium ${getRatingColor(rating)}`}>
          {rating}/10
        </span>
      </div>
    );
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
          <h2 className="text-2xl font-bold">Event Feedback Management</h2>
          <p className="text-gray-600">Collect and analyze client feedback</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.totalFeedbacks}</p>
                <p className="text-sm text-gray-500">{stats.completionRate}% completion</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{stats.averageOverallSatisfaction}/10</p>
                <div className="flex items-center mt-1">
                  {renderStarRating(stats.averageOverallSatisfaction)}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Score</p>
                <p className={`text-2xl font-bold ${stats.npsScore >= 50 ? 'text-green-600' : 
                  stats.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.npsScore}
                </p>
                <p className="text-sm text-gray-500">
                  {stats.promoters}P {stats.passives}Pa {stats.detractors}D
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues</p>
                <p className="text-2xl font-bold">{stats.totalIssues}</p>
                <p className="text-sm text-gray-500">{stats.issueResolutionRate}% resolved</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NPS Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Net Promoter Score Breakdown</CardTitle>
          <CardDescription>Distribution of customer satisfaction levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.promoters}</div>
                <div className="text-sm text-gray-600">Promoters (9-10)</div>
                <div className="text-xs text-green-600">Loyal enthusiasts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.passives}</div>
                <div className="text-sm text-gray-600">Passives (7-8)</div>
                <div className="text-xs text-yellow-600">Satisfied but unenthusiastic</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.detractors}</div>
                <div className="text-sm text-gray-600">Detractors (0-6)</div>
                <div className="text-xs text-red-600">Unhappy customers</div>
              </div>
            </div>
            
            {stats.totalFeedbacks > 0 && (
              <div className="space-y-2">
                <Progress 
                  value={(stats.promoters / stats.totalFeedbacks) * 100} 
                  className="h-2 bg-gray-200"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">
                    NPS Score: <span className={stats.npsScore >= 50 ? 'text-green-600' : 
                      stats.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}>
                      {stats.npsScore}
                    </span>
                  </span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                placeholder="Search by client name or event..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchFeedbacks}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{feedback.eventDetails.eventName}</h3>
                    <Badge className={getStatusColor(feedback.status)}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </Badge>
                    {feedback.npsData && (
                      <Badge className={getNPSColor(feedback.npsData.category)}>
                        {feedback.npsData.category.toUpperCase()} ({feedback.npsData.score})
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Client</p>
                      <div className="space-y-1">
                        <p className="font-medium">{feedback.client.name}</p>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{feedback.client.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{feedback.client.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Event Details</p>
                      <div className="space-y-1">
                        <p>{feedback.eventDetails.eventType}</p>
                        <p>{feedback.eventDetails.venueName}</p>
                        <p>{format(new Date(feedback.eventDetails.eventDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Feedback Status</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Completion</span>
                            <span>{feedback.completionPercentage}%</span>
                          </div>
                          <Progress value={feedback.completionPercentage} className="h-2" />
                        </div>
                        
                        {feedback.overallRatings && (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">Overall Satisfaction</div>
                            {renderStarRating(feedback.overallRatings.overallSatisfaction)}
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
                      setSelectedFeedback(feedback);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  
                  {feedback.feedbackConfig.remindersSent < 3 && feedback.status === 'pending' && (
                    <Button size="sm" variant="outline">
                      <Send className="h-4 w-4 mr-1" />
                      Send Reminder
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>#{feedback.feedbackNumber}</span>
                  <span>Method: {feedback.feedbackConfig.collectionMethod}</span>
                  <span>Created: {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}</span>
                  {feedback.feedbackConfig.sentDate && (
                    <span>Sent: {format(new Date(feedback.feedbackConfig.sentDate), 'MMM dd')}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  {feedback.issues && feedback.issues.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>{feedback.issues.length} issues</span>
                    </div>
                  )}
                  <span>{feedback.feedbackConfig.remindersSent} reminders sent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFeedback?.eventDetails.eventName} - Feedback Details
            </DialogTitle>
            <DialogDescription>
              Complete feedback analysis for {selectedFeedback?.client.name}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <Tabs defaultValue="ratings" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="ratings" className="space-y-6">
                {selectedFeedback.overallRatings && (
                  <div>
                    <h4 className="font-semibold mb-4">Overall Ratings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Overall Satisfaction</div>
                        {renderStarRating(selectedFeedback.overallRatings.overallSatisfaction)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Value for Money</div>
                        {renderStarRating(selectedFeedback.overallRatings.valueForMoney)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Likelihood to Recommend</div>
                        {renderStarRating(selectedFeedback.overallRatings.likelinessToRecommend)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Likelihood to Rebook</div>
                        {renderStarRating(selectedFeedback.overallRatings.likelinessToRebook)}
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeedback.npsData && (
                  <div>
                    <h4 className="font-semibold mb-4">Net Promoter Score</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{selectedFeedback.npsData.score}/10</div>
                          <Badge className={getNPSColor(selectedFeedback.npsData.category)}>
                            {selectedFeedback.npsData.category.toUpperCase()}
                          </Badge>
                        </div>
                        {selectedFeedback.npsData.category === 'promoter' ? (
                          <ThumbsUp className="h-8 w-8 text-green-600" />
                        ) : selectedFeedback.npsData.category === 'detractor' ? (
                          <ThumbsDown className="h-8 w-8 text-red-600" />
                        ) : (
                          <Users className="h-8 w-8 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">No detailed comments available for this feedback yet.</p>
                    <p className="text-xs text-gray-500">Comments will appear here once the client completes the detailed feedback form.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="issues">
                <div className="space-y-4">
                  {selectedFeedback.issues && selectedFeedback.issues.length > 0 ? (
                    selectedFeedback.issues.map((issue, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{issue.category}</Badge>
                            <Badge className={
                              issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'serious' ? 'bg-orange-100 text-orange-800' :
                              issue.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {issue.severity}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(issue.status)}>
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-gray-700">{issue.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">No issues reported</p>
                      <p className="text-green-600 text-sm">Great job! The client had no complaints.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insights">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800">Feedback Insights</h4>
                    <p className="text-blue-700 text-sm">
                      Detailed insights and recommendations will be generated once more feedback data is available.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}