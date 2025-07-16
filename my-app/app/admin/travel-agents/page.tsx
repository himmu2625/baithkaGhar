"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Building, 
  Calendar, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  AlertCircle,
  TrendingUp,
  MapPin,
  Briefcase,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  Edit,
  UserPlus,
  UserCheck,
  UserX
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface TravelAgentApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyType: string;
  status: string;
  statusDisplay: string;
  ageInDays: number;
  createdAt: string;
  adminNotes?: string;
  rejectionReason?: string;
  businessDetails: {
    website?: string;
    yearsInBusiness?: number;
    specialties?: string[];
    targetMarkets?: string[];
    annualTurnover?: number;
    teamSize?: number;
  };
  commissionExpectations: {
    preferredType: string;
    expectedRate: number;
    minimumBookingValue?: number;
  };
}

interface TravelAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyType: string;
  status: string;
  verificationStatus: string;
  totalEarnings: number;
  walletBalance: number;
  totalBookings: number;
  totalRevenue: number;
  totalClients: number;
  averageBookingValue: number;
  commissionDisplay: string;
  joinedAt: string;
  lastActiveAt?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessDetails: {
    website?: string;
    yearsInBusiness?: number;
    specialties?: string[];
    targetMarkets?: string[];
  };
  commissionStructure: {
    type: string;
    rate: number;
    tierRates?: Array<{
      minBookings: number;
      rate: number;
    }>;
    specialRates?: {
      luxuryProperties?: number;
      longStays?: number;
      bulkBookings?: number;
    };
  };
  preferences: {
    preferredDestinations?: string[];
    preferredPropertyTypes?: string[];
    preferredStayTypes?: string[];
    commissionPayoutFrequency: string;
    autoPayout: boolean;
    minPayoutAmount: number;
  };
  notes?: string;
  tags?: string[];
}

export default function TravelAgentsManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("applications");
  
  // Applications state
  const [applications, setApplications] = useState<TravelAgentApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TravelAgentApplication | null>(null);
  const [applicationActionDialog, setApplicationActionDialog] = useState(false);
  const [applicationActionType, setApplicationActionType] = useState<'approve' | 'reject' | 'review'>('approve');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [applicationRejectionReason, setApplicationRejectionReason] = useState('');
  const [applicationFilters, setApplicationFilters] = useState({
    status: 'all',
    companyType: 'all'
  });
  const [applicationPagination, setApplicationPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Active agents state
  const [travelAgents, setTravelAgents] = useState<TravelAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<TravelAgent | null>(null);
  const [agentActionDialog, setAgentActionDialog] = useState(false);
  const [agentActionType, setAgentActionType] = useState<'update' | 'updateStatus' | 'updateCommission' | 'addFunds' | 'withdrawFunds' | 'getAnalytics'>('update');
  const [agentNotes, setAgentNotes] = useState('');
  const [agentAmount, setAgentAmount] = useState('');
  const [agentFilters, setAgentFilters] = useState({
    status: 'all',
    companyType: 'all'
  });
  const [agentPagination, setAgentPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true);
      const params = new URLSearchParams({
        page: applicationPagination.page.toString(),
        limit: applicationPagination.limit.toString(),
        ...(applicationFilters.status && applicationFilters.status !== 'all' && { status: applicationFilters.status }),
        ...(applicationFilters.companyType && applicationFilters.companyType !== 'all' && { companyType: applicationFilters.companyType })
      });

      const response = await fetch(`/api/admin/travel-agent-applications?${params}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setApplicationPagination(data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch applications",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setApplicationsLoading(false);
    }
  }, [applicationPagination.page, applicationPagination.limit, applicationFilters.status, applicationFilters.companyType]);

  const fetchTravelAgents = useCallback(async () => {
    try {
      setAgentsLoading(true);
      const params = new URLSearchParams({
        page: agentPagination.page.toString(),
        limit: agentPagination.limit.toString(),
        ...(agentFilters.status && agentFilters.status !== 'all' && { status: agentFilters.status }),
        ...(agentFilters.companyType && agentFilters.companyType !== 'all' && { companyType: agentFilters.companyType })
      });

      const response = await fetch(`/api/admin/travel-agents?${params}`);
      const data = await response.json();

      if (data.success) {
        setTravelAgents(data.travelAgents);
        setAgentPagination(data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch travel agents",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch travel agents",
        variant: "destructive"
      });
    } finally {
      setAgentsLoading(false);
    }
  }, [agentPagination.page, agentPagination.limit, agentFilters.status, agentFilters.companyType]);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchTravelAgents();
    }
  }, [activeTab, applicationFilters, applicationPagination.page, agentFilters, agentPagination.page, fetchApplications, fetchTravelAgents]);

  const handleApplicationAction = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch('/api/admin/travel-agent-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: applicationActionType,
          notes: applicationNotes,
          rejectionReason: applicationActionType === 'reject' ? applicationRejectionReason : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        });
        setApplicationActionDialog(false);
        setApplicationNotes('');
        setApplicationRejectionReason('');
        setSelectedApplication(null);
        fetchApplications();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to process action",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive"
      });
    }
  };

  const handleAgentAction = async () => {
    if (!selectedAgent) return;

    try {
      const payload: any = {
        action: agentActionType,
        travelAgentId: selectedAgent.id
      };

      switch (agentActionType) {
        case 'updateStatus':
          payload.status = agentNotes; // Using notes field for status
          break;
        case 'addFunds':
        case 'withdrawFunds':
          payload.amount = parseFloat(agentAmount);
          break;
        case 'updateCommission':
          payload.commissionStructure = {
            type: 'percentage',
            rate: parseFloat(agentAmount)
          };
          break;
        default:
          payload.notes = agentNotes;
      }

      const response = await fetch('/api/admin/travel-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        });
        setAgentActionDialog(false);
        setAgentNotes('');
        setAgentAmount('');
        setSelectedAgent(null);
        fetchTravelAgents();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to process action",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock },
      approved: { variant: "default" as const, icon: CheckCircle },
      rejected: { variant: "destructive" as const, icon: XCircle },
      under_review: { variant: "outline" as const, icon: AlertCircle },
      active: { variant: "default" as const, icon: UserCheck },
      suspended: { variant: "destructive" as const, icon: UserX },
      inactive: { variant: "secondary" as const, icon: UserX }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getCompanyTypeIcon = (type: string) => {
    const iconMap = {
      individual: Users,
      agency: Building,
      corporate: Briefcase,
      tour_operator: Globe
    };
    return iconMap[type as keyof typeof iconMap] || Users;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderApplicationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Applications</h2>
          <Badge variant="secondary" className="ml-2">
            {applicationPagination.total} total
          </Badge>
        </div>
        <div className="flex gap-2">
          <Select value={applicationFilters.status} onValueChange={(value) => setApplicationFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>
          <Select value={applicationFilters.companyType} onValueChange={(value) => setApplicationFilters(prev => ({ ...prev, companyType: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="tour_operator">Tour Operator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {applicationsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications</h3>
            <p className="text-gray-500 text-center">No travel agent applications found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => {
            const Icon = getCompanyTypeIcon(application.companyType);
            return (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{application.name}</h3>
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Company:</strong> {application.companyName}</p>
                            <p><strong>Email:</strong> {application.email}</p>
                            <p><strong>Phone:</strong> {application.phone}</p>
                            <p><strong>Type:</strong> {application.companyType.replace('_', ' ').toUpperCase()}</p>
                          </div>
                          <div>
                            <p><strong>Expected Commission:</strong> {application.commissionExpectations.expectedRate}%</p>
                            <p><strong>Years in Business:</strong> {application.businessDetails.yearsInBusiness || 'N/A'}</p>
                            <p><strong>Team Size:</strong> {application.businessDetails.teamSize || 'N/A'}</p>
                            <p><strong>Applied:</strong> {application.ageInDays} days ago</p>
                          </div>
                        </div>
                        {application.adminNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm"><strong>Admin Notes:</strong> {application.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setApplicationActionType('approve');
                          setApplicationActionDialog(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApplication(application);
                          setApplicationActionType('reject');
                          setApplicationActionDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApplication(application);
                          setApplicationActionType('review');
                          setApplicationActionDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Active Agents</h2>
          <Badge variant="secondary" className="ml-2">
            {agentPagination.total} total
          </Badge>
        </div>
        <div className="flex gap-2">
          <Select value={agentFilters.status} onValueChange={(value) => setAgentFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agentFilters.companyType} onValueChange={(value) => setAgentFilters(prev => ({ ...prev, companyType: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="tour_operator">Tour Operator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {agentsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : travelAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Agents</h3>
            <p className="text-gray-500 text-center">No travel agents found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {travelAgents.map((agent) => {
            const Icon = getCompanyTypeIcon(agent.companyType);
            return (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{agent.name}</h3>
                          {getStatusBadge(agent.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Company:</strong> {agent.companyName}</p>
                            <p><strong>Email:</strong> {agent.email}</p>
                            <p><strong>Phone:</strong> {agent.phone}</p>
                            <p><strong>Commission:</strong> {agent.commissionDisplay}</p>
                          </div>
                          <div>
                            <p><strong>Total Earnings:</strong> {formatCurrency(agent.totalEarnings)}</p>
                            <p><strong>Wallet Balance:</strong> {formatCurrency(agent.walletBalance)}</p>
                            <p><strong>Total Bookings:</strong> {agent.totalBookings}</p>
                            <p><strong>Total Revenue:</strong> {formatCurrency(agent.totalRevenue)}</p>
                          </div>
                          <div>
                            <p><strong>Total Clients:</strong> {agent.totalClients}</p>
                            <p><strong>Avg Booking:</strong> {formatCurrency(agent.averageBookingValue)}</p>
                            <p><strong>Joined:</strong> {new Date(agent.joinedAt).toLocaleDateString()}</p>
                            <p><strong>Last Active:</strong> {agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {agent.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm"><strong>Notes:</strong> {agent.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setAgentActionType('updateStatus');
                          setAgentActionDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setAgentActionType('addFunds');
                          setAgentActionDialog(true);
                        }}
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Add Funds
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setAgentActionType('getAnalytics');
                          setAgentActionDialog(true);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Travel Agent Management</h1>
            <p className="text-gray-600">Manage applications and active travel agents</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Applications
            {applicationPagination.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {applicationPagination.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Agents
            {agentPagination.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {agentPagination.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          {renderApplicationsTab()}
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          {renderAgentsTab()}
        </TabsContent>
      </Tabs>

      {/* Application Action Dialog */}
      <Dialog open={applicationActionDialog} onOpenChange={setApplicationActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {applicationActionType === 'approve' && 'Approve Application'}
              {applicationActionType === 'reject' && 'Reject Application'}
              {applicationActionType === 'review' && 'Review Application'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={applicationNotes}
                onChange={(e) => setApplicationNotes(e.target.value)}
                placeholder="Add notes about this action..."
              />
            </div>
            {applicationActionType === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={applicationRejectionReason}
                  onChange={(e) => setApplicationRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleApplicationAction} className="flex-1">
                {applicationActionType === 'approve' && 'Approve'}
                {applicationActionType === 'reject' && 'Reject'}
                {applicationActionType === 'review' && 'Mark for Review'}
              </Button>
              <Button variant="outline" onClick={() => setApplicationActionDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Action Dialog */}
      <Dialog open={agentActionDialog} onOpenChange={setAgentActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {agentActionType === 'updateStatus' && 'Update Status'}
              {agentActionType === 'addFunds' && 'Add Funds'}
              {agentActionType === 'withdrawFunds' && 'Withdraw Funds'}
              {agentActionType === 'updateCommission' && 'Update Commission'}
              {agentActionType === 'getAnalytics' && 'Analytics'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {agentActionType === 'updateStatus' && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={agentNotes} onValueChange={setAgentNotes}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(agentActionType === 'addFunds' || agentActionType === 'withdrawFunds' || agentActionType === 'updateCommission') && (
              <div>
                <Label htmlFor="amount">
                  {agentActionType === 'addFunds' && 'Amount to Add'}
                  {agentActionType === 'withdrawFunds' && 'Amount to Withdraw'}
                  {agentActionType === 'updateCommission' && 'Commission Rate (%)'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={agentAmount}
                  onChange={(e) => setAgentAmount(e.target.value)}
                  placeholder={
                    agentActionType === 'addFunds' ? 'Enter amount' :
                    agentActionType === 'withdrawFunds' ? 'Enter amount' :
                    'Enter percentage'
                  }
                />
              </div>
            )}
            {agentActionType === 'getAnalytics' && (
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Analytics for {selectedAgent?.name}</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total Bookings:</strong> {selectedAgent?.totalBookings}</p>
                  <p><strong>Total Revenue:</strong> {selectedAgent ? formatCurrency(selectedAgent.totalRevenue) : 'N/A'}</p>
                  <p><strong>Average Booking Value:</strong> {selectedAgent ? formatCurrency(selectedAgent.averageBookingValue) : 'N/A'}</p>
                  <p><strong>Total Clients:</strong> {selectedAgent?.totalClients}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="agentNotes">Notes</Label>
              <Textarea
                id="agentNotes"
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Add notes about this action..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAgentAction} className="flex-1">
                {agentActionType === 'updateStatus' && 'Update Status'}
                {agentActionType === 'addFunds' && 'Add Funds'}
                {agentActionType === 'withdrawFunds' && 'Withdraw Funds'}
                {agentActionType === 'updateCommission' && 'Update Commission'}
                {agentActionType === 'getAnalytics' && 'Close'}
              </Button>
              <Button variant="outline" onClick={() => setAgentActionDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 