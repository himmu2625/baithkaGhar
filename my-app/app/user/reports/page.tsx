'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ReportStatus, ReportType, ReportTargetType } from '@/models/reportTypes';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReportItem {
  _id: string;
  type: ReportType;
  targetType: ReportTargetType;
  status: ReportStatus;
  reason: string;
  details?: string;
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
  property?: {
    _id: string;
    title: string;
    location: {
      address: string;
    };
    images: string[];
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

export default function UserReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalReports: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
  
      if (activeTab !== 'all') {
        query.append('status', activeTab.toUpperCase());
      }
  
      const response = await fetch(`/api/reports?${query.toString()}`);
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }
  
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, toast]); // ✅ correct dependencies
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReports();
    }
  }, [status, fetchReports, router]); // ✅ safe and stable
  

  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case ReportStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="text-blue-500 border-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case ReportStatus.RESOLVED:
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case ReportStatus.DISMISSED:
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" /> Dismissed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTargetName = (report: ReportItem) => {
    switch (report.targetType) {
      case ReportTargetType.PROPERTY:
        return report.property?.title || 'Unknown property';
      case ReportTargetType.USER:
        return report.user?.name || 'Unknown user';
      case ReportTargetType.REVIEW:
        return `Review for ${report.review?.rating}/5 stars`;
      case ReportTargetType.BOOKING:
        return `Booking ${report.booking?.bookingCode}`;
      default:
        return 'Unknown target';
    }
  };

  const formatReportType = (type: ReportType) => {
    return type.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Reports</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reports</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">You haven't submitted any reports yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report._id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {formatReportType(report.type)}
                      </CardTitle>
                      <CardDescription>
                        {report.targetType}: {getTargetName(report)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">Reason:</p>
                      <p className="text-sm">{report.reason}</p>
                    </div>
                    
                    {report.details && (
                      <div>
                        <p className="font-medium text-sm">Details:</p>
                        <p className="text-sm">{report.details}</p>
                      </div>
                    )}
                    
                    {report.adminResponse && (
                      <>
                        <Separator className="my-2" />
                        <div>
                          <p className="font-medium text-sm">Admin Response:</p>
                          <p className="text-sm">{report.adminResponse}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                  <div>
                    Submitted {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </div>
                  {report.resolvedAt && (
                    <div>
                      Resolved {formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true })}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
} 