"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { 
  UserPlus, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Eye,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Define the admin request type
interface AdminRequest {
  _id: string
  fullName: string
  email: string
  organization: string
  position: string
  requestedRole: string
  accessReason: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewDate?: string
  reviewNotes?: string
}

export default function AdminRequestsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  // Check if user is admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
      router.push("/admin/dashboard")
    }
  }, [session, status, router])

  // Fetch admin requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/admin/requests")
        if (!response.ok) {
          throw new Error("Failed to fetch admin requests")
        }
        const data = await response.json()
        setRequests(data.requests)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load admin requests",
          variant: "destructive",
        })
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchRequests()
    }
  }, [status])

  const handleViewDetails = (request: AdminRequest) => {
    setSelectedRequest(request)
    setOpenDetailsDialog(true)
  }

  const handleReviewRequest = (request: AdminRequest, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setReviewAction(action)
    setReviewNotes("")
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!selectedRequest || !reviewAction) return

    setReviewLoading(true)

    try {
      const response = await fetch(`/api/admin/requests/${selectedRequest._id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update request")
      }

      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id 
            ? { ...req, status: reviewAction === "approve" ? "approved" : "rejected", reviewNotes, reviewDate: new Date().toISOString() } 
            : req
        )
      )

      toast({
        title: `Request ${reviewAction === "approve" ? "Approved" : "Rejected"}`,
        description: `The admin request for ${selectedRequest.fullName} has been ${reviewAction === "approve" ? "approved" : "rejected"}.`,
      })

      setReviewDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: `Failed to ${reviewAction} the request. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setReviewLoading(false)
    }
  }

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => request.status === activeTab)

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-darkGreen" />
          <p className="mt-4">Loading requests...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <UserPlus className="mr-2 h-6 w-6" />
              Admin Access Requests
            </CardTitle>
            <CardDescription>
              Review and manage requests for admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No admin access requests found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main content
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UserPlus className="mr-2 h-6 w-6" />
            Admin Access Requests
          </CardTitle>
          <CardDescription>
            Review and manage requests for admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mt-2"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Pending
                <Badge variant="secondary" className="ml-2">
                  {requests.filter(r => r.status === "pending").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approved
                <Badge variant="secondary" className="ml-2">
                  {requests.filter(r => r.status === "approved").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                Rejected
                <Badge variant="secondary" className="ml-2">
                  {requests.filter(r => r.status === "rejected").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {["pending", "approved", "rejected"].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue}>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No {tabValue} requests found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Requested Role</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request._id}>
                            <TableCell className="font-medium">{request.fullName}</TableCell>
                            <TableCell>{request.email}</TableCell>
                            <TableCell>{request.organization}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {request.requestedRole.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {tabValue === "pending" ? 
                                format(new Date(request.createdAt), "MMM d, yyyy") :
                                format(new Date(request.reviewDate || request.createdAt), "MMM d, yyyy")
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                                
                                {tabValue === "pending" && (
                                  <>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => handleReviewRequest(request, "approve")}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleReviewRequest(request, "reject")}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Admin access request from {selectedRequest?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm">Name:</div>
                    <div className="text-sm font-medium">{selectedRequest.fullName}</div>
                    <div className="text-sm">Email:</div>
                    <div className="text-sm font-medium">{selectedRequest.email}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Company Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm">Organization:</div>
                    <div className="text-sm font-medium">{selectedRequest.organization}</div>
                    <div className="text-sm">Position:</div>
                    <div className="text-sm font-medium">{selectedRequest.position}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Access Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm">Requested Role:</div>
                    <div className="text-sm font-medium capitalize">
                      {selectedRequest.requestedRole.replace("_", " ")}
                    </div>
                    <div className="text-sm">Request Date:</div>
                    <div className="text-sm font-medium">
                      {format(new Date(selectedRequest.createdAt), "MMMM d, yyyy")}
                    </div>
                    <div className="text-sm">Status:</div>
                    <div>
                      <Badge 
                        variant={
                          selectedRequest.status === "approved" ? "outline" :
                          selectedRequest.status === "rejected" ? "destructive" : "default"
                        }
                        className={cn(
                          "capitalize",
                          selectedRequest.status === "approved" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-500"
                        )}
                      >
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedRequest.reviewDate && (
                  <div>
                    <h3 className="font-medium text-sm">Review Information</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-sm">Review Date:</div>
                      <div className="text-sm font-medium">
                        {format(new Date(selectedRequest.reviewDate), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2">
                <h3 className="font-medium text-sm">Access Reason</h3>
                <p className="mt-2 text-sm p-3 bg-muted rounded-md">
                  {selectedRequest.accessReason}
                </p>
              </div>

              {selectedRequest.reviewNotes && (
                <div className="col-span-1 md:col-span-2">
                  <h3 className="font-medium text-sm">Review Notes</h3>
                  <p className="mt-2 text-sm p-3 bg-muted rounded-md">
                    {selectedRequest.reviewNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Admin Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? "Approve this user's request for admin access" 
                : "Reject this user's request for admin access"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-2 text-sm font-medium">Add notes (optional):</p>
            <Textarea
              placeholder={
                reviewAction === "approve"
                  ? "Add any notes about permissions, responsibilities, etc."
                  : "Provide a reason for rejection"
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewLoading}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              className={reviewAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={submitReview}
              disabled={reviewLoading}
            >
              {reviewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : reviewAction === "approve" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve Access
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 