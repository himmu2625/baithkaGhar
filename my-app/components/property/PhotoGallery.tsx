"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PhotoFile {
  url: string
  public_id: string
}

interface PhotoCategory {
  category: string
  files: PhotoFile[]
}

interface PhotoGalleryProps {
  categorizedImages: PhotoCategory[]
  propertyName: string
}

export function PhotoGallery({ categorizedImages, propertyName }: PhotoGalleryProps) {
  const [selectedTab, setSelectedTab] = useState<"property" | "traveller">("property")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [fullGalleryOpen, setFullGalleryOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
  const [currentCategoryImages, setCurrentCategoryImages] = useState<PhotoFile[]>([])
  const [heroImageIndex, setHeroImageIndex] = useState(0)

  // Get all unique categories from database and format their labels automatically
  const categories = categorizedImages.map((cat) => ({
    key: cat.category,
    // Automatically format category names: "common_area" → "Common Area", "exterior" → "Exterior"
    label: cat.category
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '),
    count: cat.files.length,
  }))

  // Calculate total photos
  const totalPhotos = categorizedImages.reduce((sum, cat) => sum + cat.files.length, 0)

  // Get all images for hero view (not filtered)
  const allImages = categorizedImages.flatMap((cat) => cat.files)

  // Get filtered images based on selected category (for full gallery view)
  const getFilteredImages = () => {
    if (selectedCategory === "all") {
      return categorizedImages.flatMap((cat) => cat.files)
    }
    const category = categorizedImages.find((cat) => cat.category === selectedCategory)
    return category?.files || []
  }

  const filteredImages = getFilteredImages()

  // Open full gallery view
  const openFullGallery = () => {
    setFullGalleryOpen(true)
  }

  // Open lightbox with specific image
  const openLightbox = (imageIndex: number) => {
    setLightboxImageIndex(imageIndex)
    setCurrentCategoryImages(filteredImages)
    setLightboxOpen(true)
  }

  // Lightbox navigation
  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev + 1) % currentCategoryImages.length)
  }

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev - 1 + currentCategoryImages.length) % currentCategoryImages.length)
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxImageIndex((prev) => (prev - 1 + currentCategoryImages.length) % currentCategoryImages.length)
      } else if (e.key === "ArrowRight") {
        setLightboxImageIndex((prev) => (prev + 1) % currentCategoryImages.length)
      } else if (e.key === "Escape") {
        setLightboxOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, currentCategoryImages.length])

  // Show only first 5 images for thumbnails
  const thumbnailImages = allImages.slice(1, 6)

  return (
    <div className="w-full">
      {/* Airbnb-Style Layout (Default View) */}
      {!fullGalleryOpen && (
        <div className="max-w-7xl mx-auto">
          {/* Desktop: Hero left (50%) + 2x2 Grid right (50%) - Airbnb Style */}
          <div className="hidden md:grid md:grid-cols-2 gap-2 h-[400px] rounded-xl overflow-hidden">
            {/* Hero Image - Left Side (50%) */}
            <button
              onClick={() => {
                setHeroImageIndex(0)
                setCurrentCategoryImages(allImages)
                setLightboxImageIndex(0)
                setLightboxOpen(true)
              }}
              className="relative w-full h-full group cursor-pointer hover:brightness-95 transition-all"
              aria-label="Open photo gallery"
            >
              <Image
                src={allImages[0]?.url || "/placeholder.svg"}
                alt={`${propertyName} - Main photo`}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            </button>

            {/* 2x2 Thumbnail Grid - Right Side (50%) */}
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {allImages.slice(1, 5).map((file, index) => (
                <div
                  key={`thumbnail-${file.public_id}-${index}`}
                  className="relative w-full h-full group"
                >
                  <button
                    onClick={() => {
                      setHeroImageIndex(index + 1)
                      setCurrentCategoryImages(allImages)
                      setLightboxImageIndex(index + 1)
                      setLightboxOpen(true)
                    }}
                    className="absolute inset-0 w-full h-full cursor-pointer hover:brightness-95 transition-all"
                    aria-label={`View photo ${index + 2}`}
                  >
                    <Image
                      src={file.url || "/placeholder.svg"}
                      alt={`${propertyName} - Photo ${index + 2}`}
                      fill
                      className="object-cover"
                      sizes="25vw"
                      loading="lazy"
                    />
                  </button>

                  {/* Show all photos button - only on last image (bottom-right) */}
                  {index === 3 && (
                    <div className="absolute inset-0 flex items-end justify-end p-4 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openFullGallery()
                        }}
                        className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2 font-medium text-sm transition-colors shadow-md pointer-events-auto"
                        aria-label={`Show all ${totalPhotos} photos`}
                      >
                        <Grid className="h-4 w-4" />
                        Show all photos
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tablet: Hero top + Thumbnails bottom */}
          <div className="hidden sm:block md:hidden">
            {/* Hero Image */}
            <button
              onClick={() => {
                setHeroImageIndex(0)
                setCurrentCategoryImages(allImages)
                setLightboxImageIndex(0)
                setLightboxOpen(true)
              }}
              className="relative w-full aspect-[16/9] rounded-t-xl overflow-hidden group cursor-pointer hover:opacity-95 transition-opacity mb-2"
              aria-label="Open photo gallery"
            >
              <Image
                src={allImages[heroImageIndex]?.url || "/placeholder.svg"}
                alt={`${propertyName} - Main photo`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </button>

            {/* Thumbnails in horizontal row */}
            <div className="grid grid-cols-4 gap-2">
              {thumbnailImages.slice(0, 4).map((file, index) => (
                <button
                  key={`thumbnail-tablet-${file.public_id}-${index}`}
                  onClick={() => {
                    if (index === 3) {
                      openFullGallery()
                    } else {
                      setHeroImageIndex(index + 1)
                      setCurrentCategoryImages(allImages)
                      setLightboxImageIndex(index + 1)
                      setLightboxOpen(true)
                    }
                  }}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer hover:opacity-95 transition-opacity"
                  aria-label={index === 3 ? "Show all photos" : `View photo ${index + 2}`}
                >
                  <Image
                    src={file.url || "/placeholder.svg"}
                    alt={`${propertyName} - Photo ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="25vw"
                    loading="lazy"
                  />
                  {index === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white hover:bg-black/70 transition-colors">
                      <Grid className="h-6 w-6 mb-1" />
                      <span className="font-medium text-xs">+{totalPhotos - 4}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: Hero + CTA button */}
          <div className="sm:hidden">
            <button
              onClick={() => {
                setHeroImageIndex(0)
                setCurrentCategoryImages(allImages)
                setLightboxImageIndex(0)
                setLightboxOpen(true)
              }}
              className="relative w-full aspect-[4/3] rounded-t-xl overflow-hidden group cursor-pointer"
              aria-label="Open photo gallery"
            >
              <Image
                src={allImages[heroImageIndex]?.url || "/placeholder.svg"}
                alt={`${propertyName} - Main photo`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </button>

            <Button
              onClick={openFullGallery}
              className="w-full mt-2 rounded-b-xl flex items-center justify-center gap-2"
              size="lg"
              aria-label={`Show all ${totalPhotos} photos`}
            >
              <Grid className="h-5 w-5" />
              Show all {totalPhotos} photos
            </Button>
          </div>
        </div>
      )}

      {/* Full Gallery Modal */}
      <Dialog open={fullGalleryOpen} onOpenChange={setFullGalleryOpen}>
        <DialogContent className="max-w-7xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header Section - Fixed */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-2xl font-bold">{propertyName} Photos</DialogTitle>
              <button
                onClick={() => setFullGalleryOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <DialogDescription className="sr-only">
              Browse all {totalPhotos} photos from {propertyName}
            </DialogDescription>

            {/* Main Tabs: Property Photos / Traveller Photos */}
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setSelectedTab("property")}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  selectedTab === "property"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Property Photos
              </button>
              <button
                onClick={() => setSelectedTab("traveller")}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  selectedTab === "traveller"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Traveller Photos
                <Badge variant="secondary" className="ml-2 text-xs">
                  Coming Soon
                </Badge>
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">

          {/* Only show property photos for now */}
          {selectedTab === "property" && (
            <>
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="flex-shrink-0"
                >
                  All
                  <Badge variant="secondary" className="ml-2 bg-white text-gray-700">
                    {totalPhotos}
                  </Badge>
                </Button>

                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.key)}
                    className="flex-shrink-0"
                  >
                    {category.label}
                    <Badge variant="secondary" className="ml-2 bg-white text-gray-700">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredImages.map((file, index) => (
                  <button
                    key={`${file.public_id}-${index}`}
                    onClick={() => openLightbox(index)}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <Image
                      src={file.url || "/placeholder.svg"}
                      alt={`${propertyName} - ${selectedCategory} ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>

              {/* Empty state */}
              {filteredImages.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No photos available for this category</p>
                </div>
              )}
            </>
          )}

          {/* Traveller Photos placeholder */}
          {selectedTab === "traveller" && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Traveller photos feature coming soon!</p>
              <p className="text-sm mt-2">Users will be able to upload and view photos from their stays</p>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog (for individual photo viewing) */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
          <DialogTitle className="sr-only">Property Photo Gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Viewing image {lightboxImageIndex + 1} of {currentCategoryImages.length} from {propertyName}
          </DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close photo viewer"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous button */}
            {currentCategoryImages.length > 1 && (
              <button
                onClick={prevLightboxImage}
                className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Main image */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
              {currentCategoryImages[lightboxImageIndex] && (
                <Image
                  src={currentCategoryImages[lightboxImageIndex].url || "/placeholder.svg"}
                  alt={`${propertyName} - Image ${lightboxImageIndex + 1} of ${currentCategoryImages.length}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
            </div>

            {/* Next button */}
            {currentCategoryImages.length > 1 && (
              <button
                onClick={nextLightboxImage}
                className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
              {lightboxImageIndex + 1} of {currentCategoryImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
