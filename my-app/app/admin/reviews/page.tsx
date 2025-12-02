"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Search, Filter, ChevronDown, ArrowUpDown, ThumbsUp, ThumbsDown, Flag, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  guestImage?: string;
  rating: number;
  comment: string;
  status: "published" | "pending" | "flagged" | "rejected";
  date: string;
  response?: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Review;
    direction: "ascending" | "descending";
  } | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");

  // Fetch real review data from API
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setFilteredReviews(data.reviews || []);
      } else {
        console.error('Failed to fetch reviews');
        setReviews([]);
        setFilteredReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  useEffect(() => {
    // Fetch real reviews from API
    fetchReviews();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let result = [...reviews];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (review) =>
          review.propertyName.toLowerCase().includes(query) ||
          review.guestName.toLowerCase().includes(query) ||
          review.comment.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((review) => review.status === statusFilter);
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      result = result.filter((review) => review.rating === rating);
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredReviews(result);
  }, [searchQuery, statusFilter, ratingFilter, sortConfig, reviews]);

  const handleSort = (key: keyof Review) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "flagged":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  const handleResponseClick = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response || "");
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      });

      const data = await response.json();

      if (data.success) {
        setResponseDialogOpen(false);
        fetchReviews(); // Refresh reviews
      } else {
        alert(data.error || 'Failed to add response');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response');
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: Review['status']) => {
    try {
      let endpoint = '';

      if (newStatus === 'published') {
        endpoint = `/api/admin/reviews/${reviewId}/approve`;
      } else if (newStatus === 'rejected') {
        endpoint = `/api/admin/reviews/${reviewId}/reject`;
      } else {
        return; // Unknown status
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        fetchReviews(); // Refresh reviews
      } else {
        alert(data.error || 'Failed to update review status');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review status');
    }
  };

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
       <h1 className="text-3xl font-bold flex items-center">Review Management</h1>
       <Button
         onClick={() => router.push('/admin/reviews/import')}
         className="bg-emerald-600 hover:bg-emerald-700"
       >
         <Upload className="h-4 w-4 mr-2" />
         Import Reviews
       </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-darkGreen" />
          <span className="ml-2">Loading review data...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviews.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  All reviews
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{averageRating}</span>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Across all properties
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter(r => r.status === "pending").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting moderation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Flagged Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter(r => r.status === "flagged").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by property, guest or content..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <Select
                  value={ratingFilter}
                  onValueChange={setRatingFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-auto mt-4 md:mt-0 ml-auto">
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="p-0 h-auto font-medium"
                    >
                      Review ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("rating")}
                      className="p-0 h-auto font-medium"
                    >
                      Rating
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="p-0 h-auto font-medium"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="p-0 h-auto font-medium"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.id}</TableCell>
                      <TableCell>{review.propertyName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={review.guestImage} />
                            <AvatarFallback>
                              {review.guestName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {review.guestName}
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell>
                        <p className="truncate max-w-[200px]">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(review.status)}
                        >
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewReview(review)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResponseClick(review)}>
                                Respond to review
                              </DropdownMenuItem>
                              {review.status !== "published" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(review.id, "published")}>
                                  Approve & publish
                                </DropdownMenuItem>
                              )}
                              {review.status !== "flagged" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(review.id, "flagged")}>
                                  Flag for review
                                </DropdownMenuItem>
                              )}
                              {review.status !== "rejected" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(review.id, "rejected")}>
                                  Reject review
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      No reviews found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* View Review Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                  Full review information for {selectedReview?.propertyName}
                </DialogDescription>
              </DialogHeader>
              
              {selectedReview && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={selectedReview.guestImage} />
                        <AvatarFallback>{selectedReview.guestName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{selectedReview.guestName}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedReview.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(selectedReview.status)}>
                      {selectedReview.status.charAt(0).toUpperCase() + selectedReview.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Property</h4>
                    <p>{selectedReview.propertyName}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Rating</h4>
                    <div className="flex items-center">
                      {renderStars(selectedReview.rating)}
                      <span className="ml-2 text-sm">{selectedReview.rating}/5</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Review</h4>
                    <p className="text-sm">{selectedReview.comment}</p>
                  </div>
                  
                  {selectedReview.response && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Host Response</h4>
                      <p className="text-sm">{selectedReview.response}</p>
                    </div>
                  )}
                  
                  <DialogFooter className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(selectedReview.id, "published")}
                        disabled={selectedReview.status === "published"}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(selectedReview.id, "rejected")}
                        disabled={selectedReview.status === "rejected"}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(selectedReview.id, "flagged")}
                        disabled={selectedReview.status === "flagged"}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Flag
                      </Button>
                    </div>
                    <Button onClick={() => handleResponseClick(selectedReview)}>
                      Respond
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Response Dialog */}
          <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Respond to Review</DialogTitle>
                <DialogDescription>
                  Your response will be visible to all users viewing this review
                </DialogDescription>
              </DialogHeader>
              
              {selectedReview && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Original Review</h4>
                    <div className="flex items-center mb-2">
                      {renderStars(selectedReview.rating)}
                      <span className="ml-2 text-sm">{selectedReview.rating}/5</span>
                    </div>
                    <p className="text-sm">{selectedReview.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      By {selectedReview.guestName} on {new Date(selectedReview.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Your Response
                    </label>
                    <Textarea
                      placeholder="Write your response here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={5}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitResponse} disabled={!responseText.trim()}>
                      Submit Response
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 