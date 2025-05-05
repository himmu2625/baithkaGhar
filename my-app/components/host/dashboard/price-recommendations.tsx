"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowUp, ArrowDown, Minus, TrendingUp, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getPriceRecommendations } from "@/lib/api/host"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Property {
  id: string
  title: string
  price: number
  type: string
  location: {
    city: string
    state: string
  }
  [key: string]: any
}

interface PriceRecommendationsProps {
  properties: Property[]
}

interface RecommendationResponse {
  currentPrice: number
  marketAverage: number
  recommendation: {
    action: "increase" | "decrease" | "maintain"
    percentage: number
    reason: string
  }
  similarProperties: Property[]
}

export default function PriceRecommendations({ properties }: PriceRecommendationsProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newPrice, setNewPrice] = useState<number | null>(null)
  const [priceUpdated, setPriceUpdated] = useState(false)
  
  // Initialize with first property selected if available
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id)
    }
  }, [properties, selectedPropertyId])
  
 
  const fetchRecommendations = useCallback(async (propertyId: string) => {
    setIsLoading(true)
    setPriceUpdated(false)
    try {
      const data = await getPriceRecommendations(propertyId)
      setRecommendation(data)
      
      // Calculate suggested new price
      const selectedProperty = properties.find(p => p.id === propertyId)
      if (selectedProperty && data.recommendation) {
        if (data.recommendation.action === "increase") {
          setNewPrice(Math.round(selectedProperty.price * (1 + data.recommendation.percentage / 100)))
        } else if (data.recommendation.action === "decrease") {
          setNewPrice(Math.round(selectedProperty.price * (1 - data.recommendation.percentage / 100)))
        } else {
          setNewPrice(selectedProperty.price)
        }
      }
    } catch (error: any) {
      console.error("Error fetching price recommendations:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch price recommendations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [properties, setIsLoading, setPriceUpdated, setRecommendation, setNewPrice])

   // Fetch recommendations when property selection changes
   useEffect(() => {
    if (selectedPropertyId) {
      fetchRecommendations(selectedPropertyId)
    }
  }, [selectedPropertyId, fetchRecommendations])
  
  const handleUpdatePrice = () => {
    // In a real implementation, this would call an API to update the price
    if (newPrice !== null) {
      toast({
        title: "Price Updated",
        description: "Your property's price has been updated successfully.",
      })
      setPriceUpdated(true)
    }
  }
  
  const getSelectedProperty = () => {
    return properties.find(p => p.id === selectedPropertyId) || null
  }
  
  const selectedProperty = getSelectedProperty()
  
  const renderActionIcon = (action: string) => {
    switch(action) {
      case "increase":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "decrease":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Price Recommendations</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Our AI algorithm analyzes similar properties in your area to recommend 
                    optimal pricing based on market demand, seasonality, and booking patterns.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a property
            </label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedPropertyId || ""}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              disabled={isLoading}
            >
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.title} - ₹{property.price}/night
                </option>
              ))}
            </select>
          </div>
          
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-darkGreen mb-4" />
                <p className="text-gray-500">Analyzing market data...</p>
              </div>
            </div>
          ) : recommendation && selectedProperty ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-stretch gap-4">
                <div className="flex-1 bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Current Price</div>
                  <div className="text-2xl font-bold">₹{selectedProperty.price}</div>
                </div>
                <div className="flex-1 bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Market Average</div>
                  <div className="text-2xl font-bold">₹{recommendation.marketAverage}</div>
                </div>
                <div className="flex-1 bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Recommended Price</div>
                  <div className="text-2xl font-bold">₹{newPrice || selectedProperty.price}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-800">Recommendation</h3>
                </div>
                <div className="flex items-center mb-3">
                  {renderActionIcon(recommendation.recommendation.action)}
                  <span className="ml-2 font-medium">
                    {recommendation.recommendation.action === "increase" ? (
                      <span className="text-green-600">Increase price by {recommendation.recommendation.percentage}%</span>
                    ) : recommendation.recommendation.action === "decrease" ? (
                      <span className="text-red-600">Decrease price by {recommendation.recommendation.percentage}%</span>
                    ) : (
                      <span className="text-gray-600">Maintain current price</span>
                    )}
                  </span>
                </div>
                <p className="text-blue-700 text-sm">{recommendation.recommendation.reason}</p>
              </div>
              
              {recommendation.recommendation.action !== "maintain" && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Update Your Price</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 mb-1">New Price (₹/night)</label>
                      <Input 
                        type="number" 
                        value={newPrice || ""} 
                        onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)} 
                        className="w-full"
                      />
                    </div>
                    <Button 
                      onClick={handleUpdatePrice} 
                      className="bg-darkGreen hover:bg-darkGreen/90"
                      disabled={priceUpdated}
                    >
                      {priceUpdated ? "Price Updated" : "Update Price"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-3">Similar Properties</h3>
                <div className="space-y-2">
                  {recommendation.similarProperties.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Property</th>
                            <th className="px-4 py-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {recommendation.similarProperties.map(property => (
                            <tr key={property.id}>
                              <td className="px-4 py-3">
                                <div className="font-medium">{property.title}</div>
                                <div className="text-xs text-gray-500">{property.rating ? `${property.rating}★` : "Unrated"}</div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">₹{property.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No similar properties found in your area.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                Select a property to view pricing recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 