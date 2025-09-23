'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap,
  BarChart3,
  LineChart,
  Activity,
  Clock,
  Globe,
  ThermometerSun,
  Star,
  Building,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Percent,
  Calculator,
  Lightbulb,
  Sparkles
} from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: {
    type: 'date_range' | 'occupancy' | 'lead_time' | 'day_of_week' | 'seasonal' | 'event' | 'competitor';
    operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in';
    value: any;
    secondValue?: any;
  }[];
  actions: {
    type: 'percentage_increase' | 'percentage_decrease' | 'fixed_amount' | 'set_price';
    value: number;
    roomTypes?: string[];
  }[];
  createdAt: string;
  lastTriggered?: string;
  timesTriggered: number;
}

interface PriceSuggestion {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reasoning: string[];
  factors: {
    demand: number;
    competition: number;
    occupancy: number;
    seasonal: number;
    leadTime: number;
  };
  potentialRevenue: number;
  expectedBookings: number;
  createdAt: string;
  status: 'pending' | 'applied' | 'rejected';
}

interface MarketData {
  competitorPrices: {
    competitor: string;
    roomType: string;
    price: number;
    rating: number;
    availability: boolean;
  }[];
  demandIndicators: {
    searchVolume: number;
    bookingVelocity: number;
    inquiryRate: number;
    cancellationRate: number;
  };
  seasonalTrends: {
    month: string;
    demandIndex: number;
    priceIndex: number;
  }[];
  events: {
    name: string;
    date: string;
    impact: 'low' | 'medium' | 'high';
    category: 'holiday' | 'festival' | 'conference' | 'sports' | 'weather';
  }[];
}

interface DynamicPricingProps {
  propertyId: string;
}

const conditionTypes = {
  date_range: { label: 'Date Range', icon: Calendar },
  occupancy: { label: 'Occupancy Rate', icon: Building },
  lead_time: { label: 'Lead Time', icon: Clock },
  day_of_week: { label: 'Day of Week', icon: Calendar },
  seasonal: { label: 'Seasonal', icon: ThermometerSun },
  event: { label: 'Events', icon: Star },
  competitor: { label: 'Competitor Pricing', icon: Globe }
};

const priorityConfig = {
  1: { color: 'bg-red-500', label: 'Critical' },
  2: { color: 'bg-orange-500', label: 'High' },
  3: { color: 'bg-yellow-500', label: 'Medium' },
  4: { color: 'bg-blue-500', label: 'Low' },
  5: { color: 'bg-gray-500', label: 'Lowest' }
};

export default function DynamicPricing({ propertyId }: DynamicPricingProps) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);

  useEffect(() => {
    fetchPricingData();
  }, [propertyId]);

  const fetchPricingData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockRules: PricingRule[] = [
        {
          id: 'rule_1',
          name: 'Weekend Premium',
          description: 'Increase prices by 20% on weekends',
          isActive: true,
          priority: 2,
          conditions: [
            {
              type: 'day_of_week',
              operator: 'in',
              value: ['Friday', 'Saturday', 'Sunday']
            }
          ],
          actions: [
            {
              type: 'percentage_increase',
              value: 20
            }
          ],
          createdAt: '2025-01-15T10:00:00Z',
          lastTriggered: '2025-09-20T18:00:00Z',
          timesTriggered: 67
        },
        {
          id: 'rule_2',
          name: 'High Demand Surge',
          description: 'Increase prices when occupancy exceeds 85%',
          isActive: true,
          priority: 1,
          conditions: [
            {
              type: 'occupancy',
              operator: 'greater_than',
              value: 85
            }
          ],
          actions: [
            {
              type: 'percentage_increase',
              value: 15
            }
          ],
          createdAt: '2025-01-20T14:00:00Z',
          lastTriggered: '2025-09-21T12:00:00Z',
          timesTriggered: 23
        },
        {
          id: 'rule_3',
          name: 'Early Bird Discount',
          description: 'Decrease prices for bookings made 30+ days in advance',
          isActive: true,
          priority: 3,
          conditions: [
            {
              type: 'lead_time',
              operator: 'greater_than',
              value: 30
            }
          ],
          actions: [
            {
              type: 'percentage_decrease',
              value: 10
            }
          ],
          createdAt: '2025-02-01T09:00:00Z',
          lastTriggered: '2025-09-19T15:30:00Z',
          timesTriggered: 145
        }
      ];

      const mockSuggestions: PriceSuggestion[] = [
        {
          id: 'sugg_1',
          roomTypeId: 'room_1',
          roomTypeName: 'Deluxe Suite',
          currentPrice: 4500,
          suggestedPrice: 5200,
          confidence: 87,
          reasoning: [
            'High demand detected for this date',
            'Competitor prices are 15% higher',
            'Local event driving increased bookings'
          ],
          factors: {
            demand: 92,
            competition: 78,
            occupancy: 89,
            seasonal: 85,
            leadTime: 65
          },
          potentialRevenue: 25600,
          expectedBookings: 8,
          createdAt: '2025-09-21T08:00:00Z',
          status: 'pending'
        },
        {
          id: 'sugg_2',
          roomTypeId: 'room_2',
          roomTypeName: 'Standard Room',
          currentPrice: 2800,
          suggestedPrice: 2450,
          confidence: 76,
          reasoning: [
            'Low occupancy for this period',
            'Competitor offering lower rates',
            'Promote bookings for off-peak dates'
          ],
          factors: {
            demand: 45,
            competition: 52,
            occupancy: 41,
            seasonal: 38,
            leadTime: 85
          },
          potentialRevenue: 14700,
          expectedBookings: 12,
          createdAt: '2025-09-21T08:15:00Z',
          status: 'pending'
        },
        {
          id: 'sugg_3',
          roomTypeId: 'room_3',
          roomTypeName: 'Presidential Suite',
          currentPrice: 8500,
          suggestedPrice: 9800,
          confidence: 93,
          reasoning: [
            'Premium segment showing strong demand',
            'Limited availability increases value',
            'Corporate events driving luxury bookings'
          ],
          factors: {
            demand: 95,
            competition: 88,
            occupancy: 92,
            seasonal: 90,
            leadTime: 72
          },
          potentialRevenue: 19600,
          expectedBookings: 2,
          createdAt: '2025-09-21T08:30:00Z',
          status: 'pending'
        }
      ];

      const mockMarketData: MarketData = {
        competitorPrices: [
          { competitor: 'Ocean View Resort', roomType: 'Deluxe', price: 5800, rating: 4.3, availability: true },
          { competitor: 'Seaside Palace', roomType: 'Deluxe', price: 4900, rating: 4.1, availability: true },
          { competitor: 'Coastal Luxury', roomType: 'Standard', price: 3200, rating: 4.5, availability: false },
          { competitor: 'Beach Paradise', roomType: 'Standard', price: 2650, rating: 3.8, availability: true }
        ],
        demandIndicators: {
          searchVolume: 1250,
          bookingVelocity: 8.3,
          inquiryRate: 23.5,
          cancellationRate: 3.2
        },
        seasonalTrends: [
          { month: 'Jan', demandIndex: 75, priceIndex: 85 },
          { month: 'Feb', demandIndex: 82, priceIndex: 90 },
          { month: 'Mar', demandIndex: 95, priceIndex: 105 },
          { month: 'Apr', demandIndex: 100, priceIndex: 110 },
          { month: 'May', demandIndex: 88, priceIndex: 95 },
          { month: 'Jun', demandIndex: 92, priceIndex: 100 }
        ],
        events: [
          { name: 'Tech Conference 2025', date: '2025-09-25', impact: 'high', category: 'conference' },
          { name: 'Music Festival', date: '2025-10-05', impact: 'medium', category: 'festival' },
          { name: 'Holiday Weekend', date: '2025-10-12', impact: 'high', category: 'holiday' }
        ]
      };

      setPricingRules(mockRules);
      setPriceSuggestions(mockSuggestions);
      setMarketData(mockMarketData);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestionId: string) => {
    try {
      setPriceSuggestions(prev => prev.map(sugg =>
        sugg.id === suggestionId
          ? { ...sugg, status: 'applied' }
          : sugg
      ));

      alert('Price suggestion applied successfully!');
    } catch (error) {
      console.error('Error applying suggestion:', error);
      alert('Failed to apply price suggestion.');
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    try {
      setPriceSuggestions(prev => prev.map(sugg =>
        sugg.id === suggestionId
          ? { ...sugg, status: 'rejected' }
          : sugg
      ));
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      setPricingRules(prev => prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, isActive: !rule.isActive }
          : rule
      ));
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriceChangeIcon = (current: number, suggested: number) => {
    const change = ((suggested - current) / current) * 100;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading dynamic pricing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dynamic Pricing Engine</h2>
          <p className="text-gray-600">AI-powered pricing optimization and suggestions</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoApplyEnabled}
              onCheckedChange={setAutoApplyEnabled}
            />
            <Label>Auto-apply high confidence suggestions</Label>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Suggestions
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Avg Price Optimization</p>
                <p className="text-2xl font-bold text-blue-900">+12.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Revenue Increase</p>
                <p className="text-2xl font-bold text-green-900">₹2.8L</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Active Rules</p>
                <p className="text-2xl font-bold text-purple-900">
                  {pricingRules.filter(rule => rule.isActive).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Avg Confidence</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(priceSuggestions.reduce((sum, s) => sum + s.confidence, 0) / priceSuggestions.length)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Price Suggestions
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Pricing Rules
          </TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Price Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">AI Price Suggestions</h3>
              <p className="text-gray-600">Smart pricing recommendations based on market data</p>
            </div>
            <div className="flex items-center gap-2">
              <Label>Min Confidence:</Label>
              <div className="w-32">
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={100}
                  min={50}
                  step={5}
                />
              </div>
              <span className="text-sm">{confidenceThreshold[0]}%</span>
            </div>
          </div>

          <div className="grid gap-6">
            {priceSuggestions
              .filter(sugg => sugg.confidence >= confidenceThreshold[0] && sugg.status === 'pending')
              .map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Brain className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{suggestion.roomTypeName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Current: {formatCurrency(suggestion.currentPrice)}</span>
                            <span>→</span>
                            <span className="font-medium">Suggested: {formatCurrency(suggestion.suggestedPrice)}</span>
                            {getPriceChangeIcon(suggestion.currentPrice, suggestion.suggestedPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <Badge className={`${getConfidenceColor(suggestion.confidence)} border-none`}>
                          {suggestion.confidence}% Confidence
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => applySuggestion(suggestion.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectSuggestion(suggestion.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">Reasoning</h5>
                        <ul className="space-y-2">
                          {suggestion.reasoning.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3">Influencing Factors</h5>
                        <div className="space-y-2">
                          {Object.entries(suggestion.factors).map(([factor, value]) => (
                            <div key={factor} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={value} className="w-16 h-2" />
                                <span className="text-sm w-8 text-right">{value}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(suggestion.potentialRevenue)}
                          </div>
                          <div className="text-sm text-gray-600">Potential Revenue</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {suggestion.expectedBookings}
                          </div>
                          <div className="text-sm text-gray-600">Expected Bookings</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {((suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Price Change</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {priceSuggestions.filter(sugg => sugg.confidence >= confidenceThreshold[0] && sugg.status === 'pending').length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Price Suggestions</h3>
                  <p className="text-gray-500 mb-4">
                    All current prices are optimized or no suggestions meet your confidence threshold.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Suggestions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pricing Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Pricing Rules</h3>
              <p className="text-gray-600">Configure automated pricing rules and conditions</p>
            </div>
            <Button
              onClick={() => setShowRuleDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {pricingRules.map((rule) => {
              const priorityConf = priorityConfig[rule.priority as keyof typeof priorityConfig];

              return (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${priorityConf.color} text-white`}>
                              Priority {rule.priority}
                            </Badge>
                            <Badge variant="outline">
                              Triggered {rule.timesTriggered} times
                            </Badge>
                            {rule.lastTriggered && (
                              <Badge variant="outline">
                                Last: {new Date(rule.lastTriggered).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRule(rule);
                            setShowRuleDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Conditions</h5>
                        <div className="space-y-2">
                          {rule.conditions.map((condition, index) => {
                            const typeConfig = conditionTypes[condition.type];
                            return (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <typeConfig.icon className="h-4 w-4" />
                                  <span className="font-medium">{typeConfig.label}</span>
                                  <span>{condition.operator.replace('_', ' ')}</span>
                                  <span className="font-medium">{condition.value}</span>
                                  {condition.secondValue && (
                                    <>
                                      <span>and</span>
                                      <span className="font-medium">{condition.secondValue}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Actions</h5>
                        <div className="space-y-2">
                          {rule.actions.map((action, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {action.type.includes('increase') ? (
                                  <ArrowUp className="h-4 w-4 text-green-600" />
                                ) : action.type.includes('decrease') ? (
                                  <ArrowDown className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Calculator className="h-4 w-4 text-blue-600" />
                                )}
                                <span className="font-medium">
                                  {action.type.replace('_', ' ').replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span>
                                  {action.type.includes('percentage') ? `${action.value}%` : formatCurrency(action.value)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6">
          {marketData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Competitor Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketData.competitorPrices.map((comp, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{comp.competitor}</div>
                          <div className="text-sm text-gray-600">{comp.roomType}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs">{comp.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(comp.price)}</div>
                          <Badge variant={comp.availability ? "default" : "secondary"}>
                            {comp.availability ? "Available" : "Sold Out"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Demand Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Search Volume</span>
                      <div className="flex items-center gap-2">
                        <Progress value={marketData.demandIndicators.searchVolume / 20} className="w-24" />
                        <span className="font-medium">{marketData.demandIndicators.searchVolume}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Booking Velocity</span>
                      <div className="flex items-center gap-2">
                        <Progress value={marketData.demandIndicators.bookingVelocity * 10} className="w-24" />
                        <span className="font-medium">{marketData.demandIndicators.bookingVelocity}/day</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Inquiry Rate</span>
                      <div className="flex items-center gap-2">
                        <Progress value={marketData.demandIndicators.inquiryRate * 4} className="w-24" />
                        <span className="font-medium">{marketData.demandIndicators.inquiryRate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cancellation Rate</span>
                      <div className="flex items-center gap-2">
                        <Progress value={marketData.demandIndicators.cancellationRate * 25} className="w-24" />
                        <span className="font-medium">{marketData.demandIndicators.cancellationRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Seasonal Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketData.seasonalTrends.map((trend) => (
                      <div key={trend.month} className="flex items-center justify-between">
                        <span className="font-medium w-12">{trend.month}</span>
                        <div className="flex items-center gap-4 flex-1 mx-4">
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Demand</div>
                            <Progress value={trend.demandIndex} className="h-2" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Price</div>
                            <Progress value={trend.priceIndex} className="h-2" />
                          </div>
                        </div>
                        <div className="text-sm text-right">
                          <div>{trend.demandIndex}%</div>
                          <div>{trend.priceIndex}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketData.events.map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                event.impact === 'high' ? "default" :
                                event.impact === 'medium' ? "secondary" : "outline"
                              }
                            >
                              {event.impact} impact
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              {event.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Auto-Apply Settings</Label>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Auto-Apply</Label>
                      <p className="text-sm text-gray-600">Automatically apply suggestions above confidence threshold</p>
                    </div>
                    <Switch checked={autoApplyEnabled} onCheckedChange={setAutoApplyEnabled} />
                  </div>

                  <div>
                    <Label>Confidence Threshold: {confidenceThreshold[0]}%</Label>
                    <Slider
                      value={confidenceThreshold}
                      onValueChange={setConfidenceThreshold}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Only apply suggestions with confidence above this threshold
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Price Change Limits</Label>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="max-increase">Maximum Price Increase</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="max-increase" type="number" defaultValue="25" className="flex-1" />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="max-decrease">Maximum Price Decrease</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="max-decrease" type="number" defaultValue="15" className="flex-1" />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Update Frequency</Label>
                <Select defaultValue="hourly">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Creation Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="Enter rule name"
                  defaultValue={selectedRule?.name}
                />
              </div>
              <div>
                <Label htmlFor="rule-priority">Priority</Label>
                <Select defaultValue={selectedRule?.priority?.toString() || "3"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([priority, config]) => (
                      <SelectItem key={priority} value={priority}>
                        {config.label} ({priority})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="rule-description">Description</Label>
              <Input
                id="rule-description"
                placeholder="Describe what this rule does"
                defaultValue={selectedRule?.description}
              />
            </div>

            <div>
              <Label className="text-base font-medium">Conditions</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-3 p-3 border rounded-lg">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Condition type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conditionTypes).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                      <SelectItem value="between">Between</SelectItem>
                      <SelectItem value="in">In list</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" />
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Actions</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Action type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage_increase">Percentage Increase</SelectItem>
                      <SelectItem value="percentage_decrease">Percentage Decrease</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="set_price">Set Price</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" type="number" />
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                {selectedRule ? 'Update Rule' : 'Create Rule'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRuleDialog(false);
                  setSelectedRule(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}