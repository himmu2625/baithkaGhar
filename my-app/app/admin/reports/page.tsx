'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  ArrowDownUp,
  Check,
  Clock,
  Eye,
  Filter,
  MoreHorizontal,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ReportStatus, ReportType, ReportTargetType } from '@/models/Report';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';


interface Report {
  _id: string;
  type: ReportType;
  targetType: ReportTargetType;
  status: ReportStatus;
  reason: string;
  details?: string;
  attachments?: string[];
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
  reporter: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  property?: {
    _id: string;
    title: string;
    location: {
      address: string;
    };
    images?: string[];
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  review?: {
    _id: string;
    rating: number;
    comment: string;
  };
  booking?: {
    _id: string;
    bookingCode: string;
    startDate: string;
    endDate: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalReports: number;
  totalPages: number;
  hasMore: boolean;
}

// Add a type definition for AbortController
declare global {
  interface Window {
    currentController?: AbortController;
  }
}

// Client component for reports content
function AdminReportsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();

  // Current view state
  const [activeTab, setActiveTab] = useState<string>(searchParams?.get('status') || 'all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter state
  const [filters, setFilters] = useState({
    type: searchParams?.get('type') || 'all',
    targetType: searchParams?.get('targetType') || 'all',
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: searchParams?.get('sortOrder') || 'desc',
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: parseInt(searchParams?.get('page') || '1'),
    limit: parseInt(searchParams?.get('limit') || '10'),
    totalReports: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: ReportStatus.PENDING,
    adminResponse: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!session || !session.user) return;
    
    setIsLoading(true);
    
    // Abort previous requests
    if (window.currentController) {
      window.currentController.abort();
    }
    
    // Create new controller
    const controller = new AbortController();
    window.currentController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Build query string
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (activeTab !== 'all') params.append("status", activeTab);
      if (filters.type !== 'all') params.append("type", filters.type);
      if (filters.targetType !== 'all') params.append("targetType", filters.targetType);
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
      
      console.log("Fetching reports with params:", params.toString());
      
      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Reports data received:", { 
        count: data.reports?.length || 0,
        pagination: data.pagination 
      });
      
      setReports(data.reports || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        totalReports: 0,
        totalPages: 0,
        hasMore: false
      });
      setStatusCounts(data.statusCounts || {});
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.error("Request timed out");
        toast({
          title: "Request timed out",
          description: "The server took too long to respond. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error("Error fetching reports:", err);
        toast({
          title: "Error fetching reports",
          description: err instanceof Error ? err.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setLoading(false);
    }
  }, [activeTab, filters, pagination.page, pagination.limit, session, toast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user.role !== 'admin') {
        router.push('/');
        toast({
          title: 'Unauthorized',
          description: 'You do not have permission to access this page',
          variant: 'destructive',
        });
      } else {
        fetchReports();
      }
    }
  }, [status, session, router, toast, fetchReports, activeTab, pagination.page, filters]);
  

  useEffect(() => {
    // Clean up any pending requests or state when navigating away
    return () => {
      // This will run when the component unmounts (navigating away)
      setLoading(false);
      setIsLoading(false);
    };
  }, [pathname]);

  const safeApiCall = async <T,>(apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (err) {
      console.error("API call failed:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  };



  const updateUrlParams = () => {
    const newParams = new URLSearchParams();
    
    if (activeTab !== 'all') newParams.set('status', activeTab);
    if (filters.type !== 'all') newParams.set('type', filters.type);
    if (filters.targetType !== 'all') newParams.set('targetType', filters.targetType);
    if (filters.sortBy !== 'createdAt') newParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'desc') newParams.set('sortOrder', filters.sortOrder);
    if (pagination.page !== 1) newParams.set('page', pagination.page.toString());
    
    const url = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, '', url);
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    updateUrlParams();
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setUpdateForm({
      status: report.status,
      adminResponse: report.adminResponse || '',
    });
    setIsReportDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedReport._id,
          status: updateForm.status,
          adminResponse: updateForm.adminResponse,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update report');
      }
      
      toast({
        title: 'Report updated',
        description: 'The report has been successfully updated',
      });
      
      setIsReportDialogOpen(false);
      
      // Update report in the list
      setReports(prev => 
        prev.map(report => 
          report._id === selectedReport._id
            ? { ...report, status: updateForm.status, adminResponse: updateForm.adminResponse }
            : report
        )
      );
      
      // Update status counts
      setStatusCounts(prev => {
        const newCounts = { ...prev };
        if (selectedReport.status !== updateForm.status) {
          newCounts[selectedReport.status] = (newCounts[selectedReport.status] || 0) - 1;
          newCounts[updateForm.status] = (newCounts[updateForm.status] || 0) + 1;
        }
        return newCounts;
      });
      
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update report',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reports?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete report');
      }
      
      toast({
        title: 'Report deleted',
        description: 'The report has been successfully deleted',
      });
      
      setIsDeleteDialogOpen(false);
      setReportToDelete(null);
      
      // Remove report from the list
      setReports(prev => prev.filter(report => report._id !== id));
      
      // Update status counts
      const deletedReport = reports.find(report => report._id === id);
      if (deletedReport) {
        setStatusCounts(prev => {
          const newCounts = { ...prev };
          newCounts[deletedReport.status] = (newCounts[deletedReport.status] || 0) - 1;
          return newCounts;
        });
      }
      
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete report',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case ReportStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="text-blue-500 border-blue-500"><AlertCircle className="w-3 h-3 mr-1" />Under Review</Badge>;
      case ReportStatus.RESOLVED:
        return <Badge variant="outline" className="text-green-500 border-green-500"><Check className="w-3 h-3 mr-1" />Resolved</Badge>;
      case ReportStatus.DISMISSED:
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatReportType = (type: ReportType) => {
    return type.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTargetDetails = (report: Report) => {
    switch (report.targetType) {
      case ReportTargetType.PROPERTY:
        return report.property ? {
          name: report.property.title,
          type: 'Property',
          link: `/property/${report.property._id}`,
        } : { name: 'Unknown property', type: 'Property', link: '#' };
      
      case ReportTargetType.USER:
        return report.user ? {
          name: report.user.name,
          type: 'User',
          link: `/user/${report.user._id}`,
        } : { name: 'Unknown user', type: 'User', link: '#' };
      
      case ReportTargetType.REVIEW:
        return report.review ? {
          name: `${report.review.rating}/5 Star Review`,
          type: 'Review',
          link: `/reviews/${report.review._id}`,
        } : { name: 'Unknown review', type: 'Review', link: '#' };
      
      case ReportTargetType.BOOKING:
        return report.booking ? {
          name: `Booking #${report.booking.bookingCode}`,
          type: 'Booking',
          link: `/bookings/${report.booking._id}`,
        } : { name: 'Unknown booking', type: 'Booking', link: '#' };
      
      default:
        return { name: 'Unknown', type: 'Unknown', link: '#' };
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Report Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Reports</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => {
              setError(null);
              fetchReports();
            }}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Report Management</h1>
        
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <Select
            value={filters.targetType}
            onValueChange={(value) => setFilters(prev => ({ ...prev, targetType: value }))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(ReportTargetType).map(type => (
                <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              {Object.values(ReportType).map(type => (
                <SelectItem key={type} value={type}>{formatReportType(type)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'asc' }))}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, sortBy: 'status', sortOrder: 'asc' }))}>
                By Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, sortBy: 'type', sortOrder: 'asc' }))}>
                By Type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleApplyFilters} size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-yellow-50">
          <CardHeader className="py-4">
            <CardTitle className="text-yellow-700 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts[ReportStatus.PENDING] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50">
          <CardHeader className="py-4">
            <CardTitle className="text-blue-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts[ReportStatus.UNDER_REVIEW] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardHeader className="py-4">
            <CardTitle className="text-green-700 flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts[ReportStatus.RESOLVED] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardHeader className="py-4">
            <CardTitle className="text-red-700 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Dismissed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts[ReportStatus.DISMISSED] || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const targetDetails = getTargetDetails(report);
                    return (
                      <TableRow key={report._id}>
                        <TableCell>
                          <div className="font-medium">{formatReportType(report.type)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{targetDetails.name}</div>
                          <div className="text-sm text-muted-foreground">{targetDetails.type}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.reporter.profilePicture && (
                              <Image
                              src={report.reporter.profilePicture}
                              alt={report.reporter.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                            )}
                            <div>
                              <div className="font-medium">{report.reporter.name}</div>
                              <div className="text-xs text-muted-foreground">{report.reporter.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(report.createdAt), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReportToDelete(report._id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {formatReportType(selectedReport.type)} Report
              </DialogTitle>
              <DialogDescription>
                {getStatusBadge(selectedReport.status)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Reported By</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedReport.reporter.profilePicture && (
                      <Image
                      src={selectedReport.reporter.profilePicture}
                      alt={selectedReport.reporter.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    
                    )}
                    <div>
                      <p>{selectedReport.reporter.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedReport.reporter.email}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm">Target</h3>
                  <p>{getTargetDetails(selectedReport).name}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.targetType}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-sm">Reason</h3>
                <p className="mt-1">{selectedReport.reason}</p>
              </div>
              
              {selectedReport.details && (
                <div>
                  <h3 className="font-medium text-sm">Additional Details</h3>
                  <p className="mt-1">{selectedReport.details}</p>
                </div>
              )}
              
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm">Attachments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {selectedReport.attachments.map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Image
  src={url}
  alt={`Attachment ${index + 1}`}
  width={300} // or use an appropriate size for your grid layout
  height={96}
  className="object-cover rounded-md border hover:opacity-80 transition-opacity w-full h-24"
/>

                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-sm">Update Report Status</h3>
                <Select
                  value={updateForm.status}
                  onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value as ReportStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReportStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ').toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Admin Response</h3>
                <Textarea
                  placeholder="Add a response that will be visible to the reporter"
                  className="mt-1"
                  value={updateForm.adminResponse}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, adminResponse: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateReport}>
                Update Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setReportToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main page component with Suspense boundary
export default function AdminReportsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <div className="animate-pulse">Loading reports dashboard...</div>
      </div>
    }>
      <AdminReportsContent />
    </Suspense>
  );
} 