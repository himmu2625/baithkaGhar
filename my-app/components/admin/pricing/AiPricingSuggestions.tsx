'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Shield, 
  Calendar,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

interface PriceSuggestion {
  type: 'optimal' | 'aggressive' | 'conservative' | 'seasonal' | 'event';
  suggestedPrice: number;
  confidence: number;
  reasoning: string[];
  expectedOccupancy: number;
  revenueImpact: number;
  marketPosition: 'below' | 'average' | 'above';
}

interface MarketAnalysis {
  averageMarketPrice: number;
  priceRange: { min: number; max: number };
  competitorCount: number;
  demandLevel: 'low' | 'medium' | 'high';
}

interface HistoricalInsights {
  averagePrice: number;
  occupancyRate: number;
  seasonalTrends: Array<{
    month: number;
    averagePrice: number;
    bookingCount: number;
  }>;
}

interface Recommendations {
  shortTerm: string[];
  longTerm: string[];
}

interface AiSuggestionsData {
  suggestions: PriceSuggestion[];
  marketAnalysis: MarketAnalysis;
  historicalInsights: HistoricalInsights;
  recommendations: Recommendations;
}

interface AiPricingSuggestionsProps {
  propertyId: string;
  currentPrice: number;
  startDate?: string;
  endDate?: string;
  guests?: number;
  onPriceSelect: (price: number) => void;
}

export default function AiPricingSuggestions({ 
  propertyId, 
  currentPrice, 
  startDate, 
  endDate, 
  guests = 2,
  onPriceSelect 
}: AiPricingSuggestionsProps) {
  const [suggestionsData, setSuggestionsData] = useState<AiSuggestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      fetchSuggestions();
    }
  }, [propertyId, startDate, endDate, guests]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        guests: guests.toString()
      });

      const response = await fetch(`/api/admin/properties/${propertyId}/ai-pricing-suggestions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSuggestionsData(data);
      } else {
        setError(data.error || 'Failed to fetch suggestions');
      }
    } catch (err) {
      setError('Network error while fetching suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'optimal': return Target;
      case 'aggressive': return Zap;
      case 'conservative': return Shield;
      case 'seasonal': return Calendar;
      default: return BarChart3;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'aggressive': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'conservative': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'seasonal': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarketPositionIcon = (position: string) => {
    switch (position) {
      case 'above': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'below': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Price Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span>Analyzing market data and generating suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Price Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchSuggestions} variant="outline" className="w-full mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!suggestionsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Price Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchSuggestions} variant="outline" className="w-full">
            Generate AI Suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { suggestions, marketAnalysis, historicalInsights, recommendations } = suggestionsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Price Suggestions
            <Badge variant="outline" className="ml-2">
              {suggestions.length} Strategies
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">₹{marketAnalysis.averageMarketPrice}</div>
              <div className="text-sm text-blue-600">Market Average</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-600">{marketAnalysis.competitorCount}</div>
              <div className="text-sm text-gray-600">Competitors</div>
            </div>
            <div className="text-center p-3 rounded-lg">
              <Badge className={getDemandLevelColor(marketAnalysis.demandLevel)}>
                {marketAnalysis.demandLevel.toUpperCase()} DEMAND
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => {
          const Icon = getSuggestionIcon(suggestion.type);
          const isExpanded = expandedCard === suggestion.type;
          
          return (
            <Card key={suggestion.type} className={`cursor-pointer transition-all hover:shadow-md ${getSuggestionColor(suggestion.type)}`}>
              <CardHeader 
                onClick={() => setExpandedCard(isExpanded ? null : suggestion.type)}
                className="pb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg capitalize">{suggestion.type} Strategy</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMarketPositionIcon(suggestion.marketPosition)}
                    <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Price and Impact */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">₹{suggestion.suggestedPrice.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">per night</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${suggestion.revenueImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {suggestion.revenueImpact >= 0 ? '+' : ''}{suggestion.revenueImpact}%
                      </div>
                      <div className="text-sm text-gray-600">revenue impact</div>
                    </div>
                  </div>

                  {/* Expected Occupancy */}
                  <div className="flex items-center justify-between text-sm">
                    <span>Expected Occupancy:</span>
                    <span className="font-medium">{Math.round(suggestion.expectedOccupancy * 100)}%</span>
                  </div>

                  {/* Reasoning (if expanded) */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="font-medium text-sm">Reasoning:</h4>
                      <ul className="space-y-1">
                        {suggestion.reasoning.map((reason, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPriceSelect(suggestion.suggestedPrice);
                    }}
                    className="w-full mt-3"
                    variant={suggestion.type === 'optimal' ? 'default' : 'outline'}
                  >
                    Use This Price
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Price Range Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minimum:</span>
                  <span className="font-medium">₹{marketAnalysis.priceRange.min}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum:</span>
                  <span className="font-medium">₹{marketAnalysis.priceRange.max}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your Position:</span>
                  <span className="font-medium">₹{currentPrice}</span>
                </div>
              </div>
            </div>

            {historicalInsights.averagePrice > 0 && (
              <div>
                <h4 className="font-medium mb-2">Historical Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Price:</span>
                    <span className="font-medium">₹{historicalInsights.averagePrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Occupancy Rate:</span>
                    <span className="font-medium">{Math.round(historicalInsights.occupancyRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Seasonal Data:</span>
                    <span className="font-medium">{historicalInsights.seasonalTrends.length} months</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.shortTerm.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Short-term Actions
                </h4>
                <ul className="space-y-2">
                  {recommendations.shortTerm.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.longTerm.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Long-term Strategy
                </h4>
                <ul className="space-y-2">
                  {recommendations.longTerm.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchSuggestions} variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          Refresh Suggestions
        </Button>
      </div>
    </div>
  );
} 