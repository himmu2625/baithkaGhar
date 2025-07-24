"use client";

import { useEffect, useState, useCallback } from "react";
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
import AdminDynamicPricingIndicator from "@/components/admin/DynamicPricingIndicator";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface PropertyRequest {
  _id: string;
  name: string;
  contactNo: string;
  email: string;
  propertyType: string;
  address: {
    city: string;
    state: string;
  };
  userId: {
    name: string;
    email: string;
    phone?: string;
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
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  price?: {
    base?: number;
  };
  pricing?: {
    perNight?: number;
  };
  minStay?: number;
  maxStay?: number;
  propertySize?: string;
  totalHotelRooms?: number;
  stayTypes?: string[];
  generalAmenities?: Record<string, boolean>;
  otherAmenities?: string;
  description?: string;
  policyDetails?: string;
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

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching property requests: status=${activeTab}, page=${page}`);
      console.log("Current session:", session);
      
      const url = `/api/admin/property-requests?status=${activeTab}&page=${page}`;
      console.log("Fetching URL:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are sent
      });
      
      console.log(`API Response: ${response.status} ${response.statusText}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('API Response data:', data);

      if (data.success) {
        setRequests(data.propertyRequests);
        setTotalPages(data.pagination.pages);
        console.log(`Successfully loaded ${data.propertyRequests.length} property requests`);
        console.log('Property requests details:', data.propertyRequests.map((req: any) => ({
          id: req._id,
          title: req.title || req.name,
          status: req.verificationStatus,
          user: req.userId?.name
        })));
        console.log('Pagination info:', data.pagination);
      } else {
        console.error('API Error:', data.message);
        console.error('Full error response:', data);
        toast.error(data.message || "Failed to fetch property requests");
        
        // Additional debugging for auth issues
        if (response.status === 401) {
          console.error('Authentication failed - user may not be logged in');
          console.error('Session status:', status);
          console.error('Session data:', session);
        } else if (response.status === 403) {
          console.error('Authorization failed - user may not have admin role');
          console.error('User session:', session);
          console.error('User role:', session?.user?.role);
        }
      }
    } catch (error) {
      console.error("Network error fetching property requests:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'Unknown';
      
      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
        name: errorName
      });
      toast.error("Network error: Failed to fetch property requests");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, session, status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchRequests();
    } else if (status === "loading") {
      console.log("Property requests: Session loading...");
    } else {
      console.log("Property requests: Unknown session state", { status, session });
    }
  }, [session, status, activeTab, page, fetchRequests, router]);

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
                                {request.userId.phone && (
                                  <>
                                    <br />
                                    Mobile: {request.userId.phone}
                                  </>
                                )}
                                <br />
                                Property Contact: {request.name} - {request.contactNo}
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
                                      {/* Basic Property Information */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                          <h4 className="font-semibold mb-2">Property Details</h4>
                                          <div className="space-y-1 text-sm">
                                            <p><span className="font-medium">Name:</span> {selectedProperty.name}</p>
                                            <p><span className="font-medium">Type:</span> {selectedProperty.propertyType}</p>
                                            <p><span className="font-medium">Location:</span> {selectedProperty.address.city}, {selectedProperty.address.state}</p>
                                            <p><span className="font-medium">Max Guests:</span> {selectedProperty.maxGuests || 'Not specified'}</p>
                                            <p><span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms || 'Not specified'}</p>
                                            <p><span className="font-medium">Bathrooms:</span> {selectedProperty.bathrooms || 'Not specified'}</p>
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            Pricing & Dynamic Preview
                                          </h4>
                                          
                                          {/* Base Price Information */}
                                          <div className="space-y-3">
                                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                              <div className="text-sm font-medium text-gray-600 mb-1">Base Price</div>
                                              <div className="text-lg font-bold text-gray-900">
                                                ₹{typeof selectedProperty.price === 'object' && selectedProperty.price?.base ? 
                                                  Number(selectedProperty.price.base).toLocaleString() : 
                                                  (selectedProperty.pricing?.perNight !== undefined && selectedProperty.pricing?.perNight !== null && !isNaN(Number(selectedProperty.pricing.perNight)) ? 
                                                    Number(selectedProperty.pricing.perNight).toLocaleString() : 
                                                    'Not specified'
                                                  )
                                                }/night
                                              </div>
                                            </div>

                                            {/* Dynamic Pricing Preview */}
                                            {(selectedProperty.price?.base || selectedProperty.pricing?.perNight) && (
                                              <div className="border border-blue-200 rounded-lg overflow-hidden">
                                                <div className="bg-blue-50 p-2 border-b border-blue-200">
                                                  <div className="text-sm font-medium text-blue-800">Dynamic Pricing Preview</div>
                                                  <div className="text-xs text-blue-600">How pricing would work once approved</div>
                                                </div>
                                                <div className="p-3">
                                                  <AdminDynamicPricingIndicator
                                                    propertyId={selectedProperty._id}
                                                    basePrice={typeof selectedProperty.price === 'object' && selectedProperty.price?.base ? 
                                                      Number(selectedProperty.price.base) : 
                                                      (selectedProperty.pricing?.perNight !== undefined && selectedProperty.pricing?.perNight !== null && !isNaN(Number(selectedProperty.pricing.perNight)) ? 
                                                        Number(selectedProperty.pricing.perNight) : 
                                                        5000
                                                      )
                                                    }
                                                    variant="detailed"
                                                    showControls={false}
                                                    showPreview={true}
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Stay Information */}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div>
                                                <span className="font-medium">Min Stay:</span> {selectedProperty.minStay || 'Not specified'} days
                                              </div>
                                              <div>
                                                <span className="font-medium">Max Stay:</span> {selectedProperty.maxStay || 'Not specified'} days
                                              </div>
                                              <div>
                                                <span className="font-medium">Property Size:</span> {selectedProperty.propertySize || 'Not specified'}
                                              </div>
                                              <div>
                                                <span className="font-medium">Total Rooms:</span> {selectedProperty.totalHotelRooms || 'Not specified'}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Owner Information */}
                                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                        <h4 className="font-semibold mb-3 text-blue-800">Contact Information</h4>
                                        
                                        {/* User Account Information */}
                                        <div className="mb-4">
                                          <h5 className="font-medium text-blue-700 mb-2">Account Owner</h5>
                                          <div className="space-y-1 text-sm pl-3">
                                            <p><span className="font-medium">Name:</span> {selectedProperty.userId.name}</p>
                                            <p><span className="font-medium">Email:</span> {selectedProperty.userId.email}</p>
                                            {selectedProperty.userId.phone ? (
                                              <p><span className="font-medium">Mobile:</span> {selectedProperty.userId.phone}</p>
                                            ) : (
                                              <p className="text-gray-500 italic">Mobile number not provided</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Property Contact Information */}
                                        <div>
                                          <h5 className="font-medium text-blue-700 mb-2">Property Contact</h5>
                                          <div className="space-y-1 text-sm pl-3">
                                            <p><span className="font-medium">Contact Name:</span> {selectedProperty.name}</p>
                                            <p><span className="font-medium">Contact Email:</span> {selectedProperty.email}</p>
                                            <p><span className="font-medium">Contact Number:</span> {selectedProperty.contactNo}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Stay Types */}
                                      {selectedProperty.stayTypes && selectedProperty.stayTypes.length > 0 && (
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                          <h4 className="font-semibold mb-2">Stay Types</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {selectedProperty.stayTypes.map((stayType, index) => (
                                              <Badge key={index} variant="secondary">{stayType}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Amenities */}
                                      {selectedProperty.generalAmenities && (
                                        <div className="p-4 bg-green-50 rounded-lg">
                                          <h4 className="font-semibold mb-2">Amenities</h4>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                            {Object.entries(selectedProperty.generalAmenities).map(([key, value]) => (
                                              value && (
                                                <div key={key} className="flex items-center gap-1">
                                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </div>
                                              )
                                            ))}
                                          </div>
                                          {selectedProperty.otherAmenities && (
                                            <div className="mt-2">
                                              <span className="font-medium">Other Amenities:</span>
                                              <p className="text-sm mt-1">{selectedProperty.otherAmenities}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Description */}
                                      {selectedProperty.description && (
                                        <div className="p-4 bg-yellow-50 rounded-lg">
                                          <h4 className="font-semibold mb-2">Description</h4>
                                          <p className="text-sm">{selectedProperty.description}</p>
                                        </div>
                                      )}

                                      {/* Policy Details */}
                                      {selectedProperty.policyDetails && (
                                        <div className="p-4 bg-purple-50 rounded-lg">
                                          <h4 className="font-semibold mb-2">Policy Details</h4>
                                          <p className="text-sm">{selectedProperty.policyDetails}</p>
                                        </div>
                                      )}

                                      {/* Property Images */}
                                      <div className="space-y-4">
                                        <h4 className="font-semibold">Property Images</h4>
                                        {selectedProperty.categorizedImages.map(
                                          (category) => (
                                            <div
                                              key={category.category}
                                              className="space-y-2"
                                            >
                                              <h5 className="font-medium capitalize">
                                                {category.category} Photos ({category.files.length})
                                              </h5>
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