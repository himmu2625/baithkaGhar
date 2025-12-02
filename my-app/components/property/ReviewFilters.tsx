"use client"

import { Star, Filter, Search, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface ReviewFiltersProps {
  totalReviews: number
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedRating: string
  onRatingChange: (rating: string) => void
  selectedTripType: string
  onTripTypeChange: (tripType: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  showVerifiedOnly: boolean
  onVerifiedToggle: () => void
  activeFiltersCount: number
  onClearFilters: () => void
  ratingDistribution?: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export function ReviewFilters({
  totalReviews,
  searchQuery,
  onSearchChange,
  selectedRating,
  onRatingChange,
  selectedTripType,
  onTripTypeChange,
  sortBy,
  onSortChange,
  showVerifiedOnly,
  onVerifiedToggle,
  activeFiltersCount,
  onClearFilters,
  ratingDistribution,
}: ReviewFiltersProps) {
  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">
              Filter & Sort Reviews
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-600 hover:text-emerald-600"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* Rating Filter */}
          <Select value={selectedRating} onValueChange={onRatingChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  5 Stars {ratingDistribution && `(${ratingDistribution[5]})`}
                </div>
              </SelectItem>
              <SelectItem value="4">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4 Stars {ratingDistribution && `(${ratingDistribution[4]})`}
                </div>
              </SelectItem>
              <SelectItem value="3">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  3 Stars {ratingDistribution && `(${ratingDistribution[3]})`}
                </div>
              </SelectItem>
              <SelectItem value="2">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  2 Stars {ratingDistribution && `(${ratingDistribution[2]})`}
                </div>
              </SelectItem>
              <SelectItem value="1">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  1 Star {ratingDistribution && `(${ratingDistribution[1]})`}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Trip Type Filter */}
          <Select value={selectedTripType} onValueChange={onTripTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Trip Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trip Types</SelectItem>
              <SelectItem value="solo">Solo Trip</SelectItem>
              <SelectItem value="couple">Couple's Trip</SelectItem>
              <SelectItem value="family">Family Trip</SelectItem>
              <SelectItem value="business">Business Trip</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>

          {/* Verified Only Toggle */}
          <Button
            variant={showVerifiedOnly ? "default" : "outline"}
            onClick={onVerifiedToggle}
            className={showVerifiedOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verified Only
          </Button>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{totalReviews}</span> review{totalReviews !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  )
}
