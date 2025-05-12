"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PropertyRequest {
  _id: string;
  name: string;
  propertyType: string;
  address: {
    city: string;
    state: string;
  };
  userId: {
    name: string;
    email: string;
  };
  categorizedImages: Array<{
    category: string;
    files: Array<{
      url: string;
      public_id: string;
    }>;
  }>;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationNotes?: string;
  createdAt: string;
}

export default function PropertyRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRequest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user) {
      fetchRequests();
    }
  }, [session, status, activeTab, page]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/property-requests?status=${activeTab}&page=${page}`
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.propertyRequests);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.message || "Failed to fetch property requests");
      }
    } catch (error) {
      console.error("Error fetching property requests:", error);
      toast.error("Failed to fetch property requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (propertyId: string, status: "approved" | "rejected") => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/admin/property-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          status,
          notes: verificationNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsDetailsOpen(false);
        setVerificationNotes("");
        fetchRequests();
      } else {
        toast.error(data.message || "Failed to update property status");
      }
    } catch (error) {
      console.error("Error updating property status:", error);
      toast.error("Failed to update property status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mediumGreen"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Property Requests</CardTitle>
          <CardDescription>
            Review and manage property listing requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mediumGreen"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab} property requests found
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request._id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-64 h-48 relative">
                          <Image
                            src={
                              request.categorizedImages.find(
                                (img) => img.category === "exterior"
                              )?.files[0]?.url || "/placeholder.svg"
                            }
                            alt={request.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {request.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {request.propertyType} in {request.address.city},{" "}
                                {request.address.state}
                              </p>
                              <p className="text-sm mt-2">
                                Listed by: {request.userId.name} ({request.userId.email})
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted on:{" "}
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {getStatusBadge(request.verificationStatus)}
                              <Dialog
                                open={isDetailsOpen && selectedProperty?._id === request._id}
                                onOpenChange={(open) => {
                                  setIsDetailsOpen(open);
                                  if (!open) {
                                    setSelectedProperty(null);
                                    setVerificationNotes("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setSelectedProperty(request)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Property Details</DialogTitle>
                                    <DialogDescription>
                                      Review property information and images
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedProperty && (
                                    <div className="space-y-6">
                                      {/* Property Images */}
                                      <div className="space-y-4">
                                        {selectedProperty.categorizedImages.map(
                                          (category) => (
                                            <div
                                              key={category.category}
                                              className="space-y-2"
                                            >
                                              <h4 className="font-medium capitalize">
                                                {category.category} Photos
                                              </h4>
                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {category.files.map((file, index) => (
                                                  <div
                                                    key={index}
                                                    className="relative aspect-video"
                                                  >
                                                    <Image
                                                      src={file.url}
                                                      alt={`${category.category} ${index + 1}`}
                                                      fill
                                                      className="rounded-lg object-cover"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>

                                      {/* Verification Notes */}
                                      {request.verificationStatus === "pending" && (
                                        <div className="space-y-2">
                                          <label
                                            htmlFor="notes"
                                            className="text-sm font-medium"
                                          >
                                            Verification Notes
                                          </label>
                                          <Textarea
                                            id="notes"
                                            placeholder="Add notes about your decision (optional)"
                                            value={verificationNotes}
                                            onChange={(e) =>
                                              setVerificationNotes(e.target.value)
                                            }
                                          />
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      {request.verificationStatus === "pending" && (
                                        <div className="flex justify-end gap-4">
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              handleStatusUpdate(
                                                request._id,
                                                "rejected"
                                              )
                                            }
                                            disabled={isSubmitting}
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            Reject
                                          </Button>
                                          <Button
                                            onClick={() =>
                                              handleStatusUpdate(
                                                request._id,
                                                "approved"
                                              )
                                            }
                                            disabled={isSubmitting}
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            Approve
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 