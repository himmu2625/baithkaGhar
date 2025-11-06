"use client"

import React from "react"
import { Check, BedDouble, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export interface RoomCategory {
  id: string
  name: string
  description?: string
  price: number
  maxGuests: number
  amenities?: string[]
  roomSize?: string
  image?: string
}

interface RoomCategorySelectorProps {
  categories: RoomCategory[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
  checkIn?: Date
  checkOut?: Date
  className?: string
}

export function RoomCategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
  checkIn,
  checkOut,
  className = ""
}: RoomCategorySelectorProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  const nights = checkIn && checkOut ? Math.max(1, Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))) : 1

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <BedDouble className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-gray-900">Choose your room</span>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id
          const totalPrice = category.price * nights

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all border-2 ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectCategory(category.id)}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left side - Category details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-semibold ${
                        isSelected ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {category.name}
                      </h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    {/* Room size */}
                    {category.roomSize && (
                      <p className="text-[10px] text-gray-500 mb-1">
                        Room size: {category.roomSize}
                      </p>
                    )}

                    {/* Max guests */}
                    <div className="flex items-center gap-1 mb-2">
                      <Users className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">
                        Max {category.maxGuests} guest{category.maxGuests > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Amenities */}
                    {category.amenities && category.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {category.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {category.amenities.length > 3 && (
                          <span className="text-[9px] text-gray-500">
                            +{category.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {category.description && (
                      <p className="text-[10px] text-gray-600 mt-1 leading-tight">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Right side - Price */}
                  <div className="text-right">
                    <div className={`text-base font-bold ${
                      isSelected ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      ₹{category.price.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-gray-500">per night</div>
                    {checkIn && checkOut && nights > 1 && (
                      <div className="text-[10px] text-gray-600 mt-1 font-medium">
                        ₹{totalPrice.toLocaleString()} for {nights}N
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <Badge className="bg-green-600 text-white text-[10px] py-0 px-2">
                      ✓ SELECTED
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
