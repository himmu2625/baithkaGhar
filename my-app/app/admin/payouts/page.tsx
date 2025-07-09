"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  IndianRupee,
  Calendar,
  Users,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface Payout {
  _id: string;
  influencerId: {
    _id: string;
    name: string;
    email: string;
    referralCode: string;
    platform: string;
  };
  amount: number;
  netAmount: number;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  taxDeductions?: {
    tds: number;
    gst: number;
    other: number;
  };
  requestedAt: string;
  paidAt?: string;
  processedBy?: {
    name: string;
    email: string;
  };
  metadata?: {
    totalBookings: number;
    avgCommissionRate: number;
    totalRevenue: number;
  };
}

interface PayoutFormData {
  action: 'generate_batch' | 'create_single';
  periodStart: string;
  periodEnd: string;
  influencerId?: string;
}

interface ProcessPayoutData {
  transactionId: string;
  razorpayPayoutId: string;
  notes: string;
}

export default function AdminPayoutsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [summary, setSummary] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<PayoutFormData>({
    action: 'generate_batch',
    periodStart: '',
    periodEnd: '',
    influencerId: ''
  });
  
  const [processData, setProcessData] = useState<ProcessPayoutData>({
    transactionId: '',
    razorpayPayoutId: '',
    notes: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Check admin permissions
  useEffect(() => {
    if (session && !["admin", "super_admin"].includes(session.user?.role || "")) {
      router.push("/admin/login");
    }
  }, [session, router]);

  // Set default date range (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFormData(prev => ({
      ...prev,
      periodStart: firstDay.toISOString().split('T')[0],
      periodEnd: lastDay.toISOString().split('T')[0]
    }));
    
    setMonthFilter(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  // Fetch payouts
  const fetchPayouts = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        month: monthFilter
      });

      const response = await fetch(`/api/admin/payouts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
        setSummary(data.summary || []);
        setPagination(data.pagination);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payouts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter, monthFilter]);

  // Create payout
  const handleCreatePayout = async () => {
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setIsCreateDialogOpen(false);
        fetchPayouts();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create payout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      toast({
        title: "Error",
        description: "Failed to create payout",
        variant: "destructive",
      });
    }
  };

  // Process payout (mark as paid)
  const handleProcessPayout = async () => {
    if (!selectedPayout) return;

    try {
      const response = await fetch(`/api/admin/payouts/${selectedPayout._id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Payout marked as paid successfully",
        });
        setIsProcessDialogOpen(false);
        setSelectedPayout(null);
        setProcessData({
          transactionId: '',
          razorpayPayoutId: '',
          notes: ''
        });
        fetchPayouts();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process payout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing payout:", error);
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      paid: "default",
      failed: "destructive",
      cancelled: "outline"
    } as const;
    
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800", 
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSummaryByStatus = (status: string) => {
    const statusData = summary.find(s => s._id === status);
    return statusData || { count: 0, totalAmount: 0, totalNetAmount: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-darkGreen">Payout Management</h1>
          <p className="text-gray-600">Process influencer commission payouts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-darkGreen hover:bg-darkGreen/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Payout</DialogTitle>
              <DialogDescription>
                Generate payouts for influencers
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="action">Payout Type</Label>
                <Select value={formData.action} onValueChange={(value: any) => setFormData(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generate_batch">Generate for All Active Influencers</SelectItem>
                    <SelectItem value="create_single">Create for Specific Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayout} className="bg-darkGreen hover:bg-darkGreen/90">
                Create Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getSummaryByStatus('pending').count}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{getSummaryByStatus('pending').totalNetAmount.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getSummaryByStatus('processing').count}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{getSummaryByStatus('processing').totalNetAmount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {getSummaryByStatus('paid').count}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{getSummaryByStatus('paid').totalNetAmount.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{summary.reduce((sum, s) => sum + s.totalNetAmount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {summary.reduce((sum, s) => sum + s.count, 0)} payouts
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-darkGreen" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.influencerId.name}</p>
                      <p className="text-sm text-gray-500">{payout.influencerId.email}</p>
                      <p className="text-sm text-gray-500">
                        {payout.influencerId.referralCode} • {payout.influencerId.platform}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(payout.periodStart).toLocaleDateString()}</p>
                      <p className="text-gray-500">to</p>
                      <p>{new Date(payout.periodEnd).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">₹{payout.amount.toLocaleString()}</p>
                      {payout.taxDeductions && (
                        <p className="text-xs text-gray-500">
                          TDS: ₹{payout.taxDeductions.tds}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-green-600">₹{payout.netAmount.toLocaleString()}</p>
                    {payout.metadata && (
                      <p className="text-xs text-gray-500">
                        {payout.metadata.totalBookings} bookings
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payout.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(payout.requestedAt).toLocaleDateString()}</p>
                      <p className="text-gray-500">{new Date(payout.requestedAt).toLocaleTimeString()}</p>
                      {payout.paidAt && (
                        <p className="text-green-600 text-xs">
                          Paid: {new Date(payout.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(payout.status === 'pending' || payout.status === 'processing') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setIsProcessDialogOpen(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {payout.transactionId && (
                        <div className="text-xs text-gray-500">
                          Txn: {payout.transactionId.slice(-6)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {payouts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payouts found. Create your first payout to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              {selectedPayout && `Processing payout of ₹${selectedPayout.netAmount.toLocaleString()} for ${selectedPayout.influencerId.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                value={processData.transactionId}
                onChange={(e) => setProcessData(prev => ({ ...prev, transactionId: e.target.value }))}
                placeholder="Enter payment transaction ID"
              />
            </div>
            
            <div>
              <Label htmlFor="razorpayPayoutId">Razorpay Payout ID</Label>
              <Input
                id="razorpayPayoutId"
                value={processData.razorpayPayoutId}
                onChange={(e) => setProcessData(prev => ({ ...prev, razorpayPayoutId: e.target.value }))}
                placeholder="pout_xxxxxxxxxxxxx"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={processData.notes}
                onChange={(e) => setProcessData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this payment..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayout} 
              className="bg-green-600 hover:bg-green-700"
              disabled={!processData.transactionId}
            >
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchPayouts(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchPayouts(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 