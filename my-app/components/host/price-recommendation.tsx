"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { getPriceRecommendations } from '@/lib/api/host'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Property {
  id: string;
  title: string;
}

/**
 * Component for hosts to get price recommendations for their properties
 */
export function PriceRecommendation() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [recommendation, setRecommendation] = useState<{
    currentPrice: number;
    marketAverage: number;
    recommendation: {
      action: string;
      percentage: number;
      reason: string;
    };
  } | null>(null)

  useEffect(() => {
    // Fetch real properties from API
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/host/properties');
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        } else {
          console.error('Failed to fetch properties');
          setProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };
    
    fetchProperties();
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property first",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    
    try {
      const result = await getPriceRecommendations(selectedPropertyId);
      setRecommendation(result)
    } catch (error: any) {
      console.error('Error getting price recommendation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to get price recommendations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Price Recommendation</CardTitle>
        <CardDescription>
          Get a price recommendation based on your property details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property">Select Property</Label>
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
              disabled={loadingProperties}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {recommendation && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="mb-2">
                <span className="font-semibold">Current price:</span> ₹{recommendation.currentPrice}/night
              </div>
              <div className="mb-2">
                <span className="font-semibold">Market average:</span> ₹{recommendation.marketAverage}/night
              </div>
              <div className="mb-2">
                <span className="font-semibold">Recommendation:</span> {recommendation.recommendation.action} price by {recommendation.recommendation.percentage}%
              </div>
              <p className="text-sm text-muted-foreground">
                {recommendation.recommendation.reason}
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading || loadingProperties}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : "Get Recommendation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 