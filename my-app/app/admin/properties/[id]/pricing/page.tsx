"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Calendar as CalendarIcon,
  TrendingUp, 
  Settings,
  History,
  Gift,
  Ban,
  Info,
  Lightbulb,
  Eye,
  Save,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  BarChart3,
  Clock,
  Users,
  Plus
} from "lucide-react";
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { PricingCalendar } from '@/components/ui/pricing-calendar';
import { PropertyPromotionsManager } from '@/components/admin/promotions/PropertyPromotionsManager';

interface Property {
  _id: string;
  name: string;
  title: string;
  location: string;
  basePrice: number;
  currency: string;
  totalHotelRooms: string;
  maxGuests: number;
  propertyUnits?: Array<{
    unitTypeName: string;
    unitTypeCode: string;
    count: number;
    pricing: {
      price: string;
      pricePerWeek: string;
      pricePerMonth: string;
    };
  }>;
  categories?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    maxGuests: number;
    amenities?: string[];
  }>;
  dynamicPricing?: {
    enabled: boolean;
    factors: {
      seasonality: { enabled: boolean; multiplier: number; };
      demand: { enabled: boolean; multiplier: number; };
      lastMinute: { enabled: boolean; multiplier: number; };
      events: { enabled: boolean; multiplier: number; };
    };
  };
}

interface PricingRule {
  id: string;
  name: string;
  type: 'seasonal' | 'demand' | 'event' | 'custom';
  dateRange: { start: Date; end: Date; };
  multiplier: number;
  isActive: boolean;
  description: string;
}

interface BlockedDate {
  date: Date;
  reason: string;
  type: 'maintenance' | 'personal' | 'event' | 'other';
}

interface AIcSuggestion {
  field: string;
  current: number;
  suggested: number;
  confidence: number;
  reason: string;
  impact: string;
}

interface LivePreview {
  selectedDate: Date;
  basePrice: number;
  appliedRules: PricingRule[];
  finalPrice: number;
  discounts: any[];
  occupancyRate: number;
  demandLevel: 'low' | 'medium' | 'high';
}

// Helper to format date as string key
const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export default function EnhancedPropertyPricingPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('base-price');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AIcSuggestion[]>([]);
  const [dynamicPricing, setDynamicPricing] = useState<any>(null);

  // Room category state
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string | null>(null);
  const [roomCategories, setRoomCategories] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    count: number;
    maxGuests: number;
  }>>([]);

  // Live preview state
  const [livePreview, setLivePreview] = useState<LivePreview>({
    selectedDate: new Date(),
    basePrice: 0,
    appliedRules: [],
    finalPrice: 0,
    discounts: [],
    occupancyRate: 0,
    demandLevel: 'medium'
  });

  // UI state
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [seasonalDialogOpen, setSeasonalDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    dateRange: { start: new Date(), end: new Date() },
    multiplier: 1,
    isActive: true,
  });

  // Demand-Based Pricing state
  const [demandDialogOpen, setDemandDialogOpen] = useState(false);
  const [editingDemandRule, setEditingDemandRule] = useState<PricingRule | null>(null);
  const [demandRuleForm, setDemandRuleForm] = useState({
    name: '',
    description: '',
    dateRange: { start: new Date(), end: new Date() },
    multiplier: 1,
    isActive: true,
  });
  function openAddDemandRule() {
    setEditingDemandRule(null);
    setDemandRuleForm({
      name: '',
      description: '',
      dateRange: { start: new Date(), end: new Date() },
      multiplier: 1,
      isActive: true,
    });
    setDemandDialogOpen(true);
  }
  function openEditDemandRule(rule: PricingRule) {
    setEditingDemandRule(rule);
    setDemandRuleForm({
      name: rule.name,
      description: rule.description,
      dateRange: rule.dateRange,
      multiplier: rule.multiplier,
      isActive: rule.isActive,
    });
    setDemandDialogOpen(true);
  }
  
  // Add event-based rule state and open/edit functions
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEventRule, setEditingEventRule] = useState<PricingRule | null>(null);
  const [eventRuleForm, setEventRuleForm] = useState({
    name: '',
    description: '',
    dateRange: { start: new Date(), end: new Date() },
    multiplier: 1,
    isActive: true,
  });
  function openAddEventRule() {
    setEditingEventRule(null);
    setEventRuleForm({
      name: '',
      description: '',
      dateRange: { start: new Date(), end: new Date() },
      multiplier: 1,
      isActive: true,
    });
    setEventDialogOpen(true);
  }
  function openEditEventRule(rule: PricingRule) {
    setEditingEventRule(rule);
    setEventRuleForm({
      name: rule.name,
      description: rule.description,
      dateRange: rule.dateRange,
      multiplier: rule.multiplier,
      isActive: rule.isActive,
    });
    setEventDialogOpen(true);
  }

  // Add state for direct pricing
  const [directPricingData, setDirectPricingData] = useState<{[key: string]: number}>({});
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [customPriceForm, setCustomPriceForm] = useState({
    dates: [] as Date[],
    price: 0,
    reason: 'custom'
  });
  const [directPricingDialogOpen, setDirectPricingDialogOpen] = useState(false);

  // Blocked dates state
  const [selectedBlockDates, setSelectedBlockDates] = useState<Date[]>([]);
  const [isBlockRangeMode, setIsBlockRangeMode] = useState(false);
  const [blockDateForm, setBlockDateForm] = useState({
    dates: [] as Date[],
    reason: '',
    categoryId: '',
    editIndex: -1
  });
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyData();
      fetchPricingData();
      fetchAISuggestions();
    }
  }, [propertyId]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      console.log('Fetching property data for ID:', propertyId);
      
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Property data received:', data);

      if (data && data._id) {
        setProperty(data);
        const basePrice = data.basePrice || 0;
        setLivePreview(prev => ({
          ...prev,
          basePrice: basePrice,
          finalPrice: basePrice
        }));
        console.log('Property set successfully, base price:', basePrice);
        
        // Process room categories
        let categories: Array<{
          id: string;
          name: string;
          description?: string;
          price: number;
          count: number;
          maxGuests: number;
        }> = [];

        if (data.propertyUnits && Array.isArray(data.propertyUnits) && data.propertyUnits.length > 0) {
          // Convert propertyUnits to categories
          categories = data.propertyUnits.map((unit: any) => ({
            id: unit.unitTypeCode || `unit-${Math.random().toString(36).substr(2, 9)}`,
            name: unit.unitTypeName || "Standard Room",
            description: `${unit.unitTypeName} with ${unit.count} available rooms`,
            price: parseFloat(unit.pricing?.price) || basePrice || 0,
            count: unit.count || 1,
            maxGuests: 3 // Default, could be made configurable
          }));
        } else if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          // Use existing categories
          categories = data.categories.map((cat: any) => ({
            id: cat.id || cat._id || `cat-${Math.random().toString(36).substr(2, 9)}`,
            name: cat.name || "Standard Room",
            description: cat.description || "",
            price: cat.price || basePrice || 0,
            count: cat.count || 1,
            maxGuests: cat.maxGuests || 3
          }));
        } else {
          // Create default categories if none exist
          categories = [
            {
              id: 'standard',
              name: 'Standard Room',
              description: 'Comfortable standard room with essential amenities',
              price: basePrice || 2500,
              count: parseInt(data.totalHotelRooms) || 1,
              maxGuests: 3
            }
          ];
        }

        setRoomCategories(categories);
        
        // Set the first category as selected by default
        if (categories.length > 0) {
          setSelectedRoomCategory(categories[0].id);
        }
      } else {
        throw new Error("Invalid property data received");
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load property data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      console.log('Fetching pricing data for property ID:', propertyId);
      
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch pricing data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Pricing data received:', data);
      
      if (data.dynamicPricing) {
        // Ensure availabilityControl is properly initialized
        if (!data.dynamicPricing.availabilityControl) {
          data.dynamicPricing.availabilityControl = {
            enabled: false,
            blockedDates: []
          };
        }
        
        // Ensure blockedDates is always an array
        if (!Array.isArray(data.dynamicPricing.availabilityControl.blockedDates)) {
          data.dynamicPricing.availabilityControl.blockedDates = [];
        }
        
        // Ensure directPricing is properly initialized
        if (!data.dynamicPricing.directPricing) {
          data.dynamicPricing.directPricing = {
            enabled: false,
            customPrices: []
          };
        }
        
        // Ensure customPrices is always an array
        if (!Array.isArray(data.dynamicPricing.directPricing.customPrices)) {
          data.dynamicPricing.directPricing.customPrices = [];
        }
        
        setDynamicPricing(data.dynamicPricing);
        console.log('Blocked dates loaded:', data.dynamicPricing.availabilityControl.blockedDates);
      } else {
        // Initialize with default structure if no dynamic pricing exists
        const defaultDynamicPricing = {
          enabled: false,
          basePrice: data.basePrice || 0,
          minPrice: 0,
          maxPrice: 0,
          directPricing: {
            enabled: false,
            customPrices: []
          },
          availabilityControl: {
            enabled: false,
            blockedDates: []
          }
        };
        setDynamicPricing(defaultDynamicPricing);
        console.log('Initialized default dynamic pricing structure');
      }
      
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch pricing data",
        variant: "destructive"
      });
      
      // Set a minimal fallback structure to prevent crashes
      setDynamicPricing({
        enabled: false,
        basePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        directPricing: { enabled: false, customPrices: [] },
        availabilityControl: { enabled: false, blockedDates: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    try {
      // Try to fetch real AI suggestions first
      try {
        const response = await fetch(`/api/admin/properties/${propertyId}/ai-pricing-suggestions`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suggestions) {
            setAISuggestions(data.suggestions);
          } else {
            // No suggestions available
            setAISuggestions([]);
          }
        } else {
          // API not available or no suggestions
          setAISuggestions([]);
        }
      } catch (error) {
        console.log('AI suggestions API not available');
        setAISuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
  };

  // Update live preview when property data changes
  useEffect(() => {
    if (property) {
      console.log('Recalculating live preview for date:', livePreview.selectedDate);
      
      // Get base price from selected room category or fallback to property base price
      const selectedCategory = roomCategories.find(c => c.id === selectedRoomCategory);
      const basePrice = selectedCategory?.price || property.basePrice || 0;
      let finalPrice = basePrice;
      const appliedRules: PricingRule[] = [];
      
      // Check for custom pricing first (direct pricing takes priority)
      const customPrices = dynamicPricing?.directPricing?.customPrices || [];
      const dateKey = formatDateKey(livePreview.selectedDate);
      const customPrice = customPrices.find((cp: any) => {
        if (!cp.isActive) return false;
        
        // For single date pricing (startDate equals endDate)
        if (cp.startDate === cp.endDate) {
          return dateKey === cp.startDate;
        }
        
        // For range pricing (startDate different from endDate)
        return cp.startDate <= dateKey && cp.endDate >= dateKey;
      });
      
      if (customPrice) {
        finalPrice = customPrice.price;
        console.log('Custom price applied:', customPrice.price);
      } else {
        // Apply pricing rules if no custom price
        pricingRules.forEach(rule => {
          if (rule.isActive && 
              livePreview.selectedDate >= rule.dateRange.start && 
              livePreview.selectedDate <= rule.dateRange.end) {
            finalPrice *= rule.multiplier;
            appliedRules.push(rule);
          }
        });
      }
      
      setLivePreview(prev => ({
        ...prev,
        basePrice: basePrice,
        finalPrice: Math.round(finalPrice),
        appliedRules,
        occupancyRate: 0, // Remove mock data
        demandLevel: 'low' // Remove mock data
      }));
      
      console.log('Live preview updated:', {
        basePrice: basePrice,
        finalPrice: Math.round(finalPrice),
        appliedRules: appliedRules.length,
        hasCustomPrice: !!customPrice,
        selectedCategory: selectedCategory?.name
      });
    }
  }, [property, pricingRules, livePreview.selectedDate, dynamicPricing, selectedRoomCategory, roomCategories]);

  // Calculate live preview
  const calculateLivePreview = useMemo(() => {
    if (!property) return livePreview;

    let finalPrice = property.basePrice || 0;
    const appliedRules: PricingRule[] = [];

    // Check for custom pricing first (direct pricing takes priority)
    const customPrices = dynamicPricing?.directPricing?.customPrices || [];
    const dateKey = formatDateKey(livePreview.selectedDate);
    const customPrice = customPrices.find((cp: any) => {
      if (!cp.isActive) return false;
      
      // For single date pricing (startDate equals endDate)
      if (cp.startDate === cp.endDate) {
        return dateKey === cp.startDate;
      }
      
      // For range pricing (startDate different from endDate)
      return cp.startDate <= dateKey && cp.endDate >= dateKey;
    });

    if (customPrice) {
      finalPrice = customPrice.price;
    } else {
      // Apply pricing rules if no custom price
    pricingRules.forEach(rule => {
      if (rule.isActive && 
          livePreview.selectedDate >= rule.dateRange.start && 
          livePreview.selectedDate <= rule.dateRange.end) {
        finalPrice *= rule.multiplier;
        appliedRules.push(rule);
      }
    });
    }

    return {
      ...livePreview,
      basePrice: property.basePrice || 0,
      finalPrice: Math.round(finalPrice),
      appliedRules
    };
  }, [property, pricingRules, livePreview.selectedDate, dynamicPricing]);

  // Generate calendar heatmap data
  const calendarHeatmapData = useMemo(() => {
    const startDate = startOfMonth(calendarMonth);
    const endDate = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(date => {
      let price = property?.basePrice || 0;
      let intensity = 'low';
      const applicableRules: PricingRule[] = [];
      let hasCustomPrice = false;

      // Check for custom pricing first
      const customPrices = dynamicPricing?.directPricing?.customPrices || [];
      const dateKey = formatDateKey(date);
      const customPrice = customPrices.find((cp: any) => {
        if (!cp.isActive) return false;
        
        // For single date pricing (startDate equals endDate)
        if (cp.startDate === cp.endDate) {
          return dateKey === cp.startDate;
        }
        
        // For range pricing (startDate different from endDate)
        return cp.startDate <= dateKey && cp.endDate >= dateKey;
      });

      if (customPrice) {
        price = customPrice.price;
        hasCustomPrice = true;
        intensity = 'custom'; // Special intensity for custom prices
      } else {
        // Apply pricing rules if no custom price
      pricingRules.forEach(rule => {
        if (rule.isActive && date >= rule.dateRange.start && date <= rule.dateRange.end) {
          price *= rule.multiplier;
          applicableRules.push(rule);
        }
      });

      // Determine intensity based on price difference
      const priceRatio = price / (property?.basePrice || 1);
      if (priceRatio >= 1.5) intensity = 'very-high';
      else if (priceRatio >= 1.3) intensity = 'high';
      else if (priceRatio >= 1.1) intensity = 'medium';
      else intensity = 'low';
      }

      const isBlocked = blockedDates.some(blocked => 
        format(blocked.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      return {
        date,
        price: Math.round(price),
        intensity,
        appliedRules: applicableRules,
        isBlocked,
        hasCustomPrice
      };
    });
  }, [property, pricingRules, blockedDates, calendarMonth, dynamicPricing]);

  const InfoTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  const AISuggestionChip = ({ suggestion }: { suggestion: AIcSuggestion }) => (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full text-xs cursor-pointer hover:shadow-md transition-shadow">
          <Brain className="h-3 w-3 text-purple-600" />
          <span className="text-purple-700 font-medium">
            AI: ₹{suggestion.suggested.toLocaleString()}
          </span>
          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
          <span className="text-purple-600">{Math.round(suggestion.confidence * 100)}%</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="space-y-2">
          <div className="font-medium">AI Recommendation</div>
          <div className="text-sm">{suggestion.reason}</div>
          <div className="text-xs text-green-600 font-medium">{suggestion.impact}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );

  function openAddSeasonalRule() {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      dateRange: { start: new Date(), end: new Date() },
      multiplier: 1,
      isActive: true,
    });
    setSeasonalDialogOpen(true);
  }
  function openEditSeasonalRule(rule: PricingRule) {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      dateRange: rule.dateRange,
      multiplier: rule.multiplier,
      isActive: rule.isActive,
    });
    setSeasonalDialogOpen(true);
  }
  function saveSeasonalRule() {
    let newRules;
    if (editingRule) {
      newRules = pricingRules.map(r => r.id === editingRule.id ? { ...editingRule, ...ruleForm } : r);
    } else {
      newRules = [
        ...pricingRules,
        {
          id: Math.random().toString(36).slice(2),
          type: 'seasonal' as const,
          ...ruleForm,
        },
      ];
    }
    setSeasonalDialogOpen(false);
    syncRulesToBackend(newRules);
  }
  function deleteSeasonalRule(id: string) {
    const newRules = pricingRules.filter(r => r.id !== id);
    syncRulesToBackend(newRules);
  }
  function toggleSeasonalRuleActive(id: string) {
    const newRules = pricingRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    syncRulesToBackend(newRules);
  }
  // Repeat for demand and event rules
  function saveDemandRule() {
    let newRules;
    if (editingDemandRule) {
      newRules = pricingRules.map(r => r.id === editingDemandRule.id ? { ...editingDemandRule, ...demandRuleForm } : r);
    } else {
      newRules = [
        ...pricingRules,
        {
          id: Math.random().toString(36).slice(2),
          type: 'demand' as const,
          ...demandRuleForm,
        },
      ];
    }
    setDemandDialogOpen(false);
    syncRulesToBackend(newRules);
  }
  function deleteDemandRule(id: string) {
    const newRules = pricingRules.filter(r => r.id !== id);
    syncRulesToBackend(newRules);
  }
  function toggleDemandRuleActive(id: string) {
    const newRules = pricingRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    syncRulesToBackend(newRules);
  }
  function saveEventRule() {
    let newRules;
    if (editingEventRule) {
      newRules = pricingRules.map(r => r.id === editingEventRule.id ? { ...editingEventRule, ...eventRuleForm } : r);
    } else {
      newRules = [
        ...pricingRules,
        {
          id: Math.random().toString(36).slice(2),
          type: 'event' as const,
          ...eventRuleForm,
        },
      ];
    }
    setEventDialogOpen(false);
    syncRulesToBackend(newRules);
  }
  function deleteEventRule(id: string) {
    const newRules = pricingRules.filter(r => r.id !== id);
    syncRulesToBackend(newRules);
  }
  function toggleEventRuleActive(id: string) {
    const newRules = pricingRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    syncRulesToBackend(newRules);
  }

  // Add syncRulesToBackend function
  async function syncRulesToBackend(newRules: PricingRule[]) {
    setLoadingRules(true);
    try {
      const newDynamicPricing = {
        ...dynamicPricing,
        dynamicStayRules: {
          ...(dynamicPricing?.dynamicStayRules || {}),
          minimumStayRules: newRules
        }
      };
      const res = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: newDynamicPricing })
      });
      if (!res.ok) throw new Error('Failed to update rules');
      const data = await res.json();
      setDynamicPricing(data.dynamicPricing);
      setPricingRules(data.dynamicPricing?.dynamicStayRules?.minimumStayRules || []);
      toast({ title: 'Success', description: 'Rules updated successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingRules(false);
    }
  }

  // Helper to normalize custom price objects before sending to backend
  function normalizeCustomPrices(customPrices: any[]): any[] {
    return customPrices.map(cp => {
      const start = typeof cp.startDate === 'string' ? new Date(cp.startDate) : cp.startDate;
      let end = typeof cp.endDate === 'string' ? new Date(cp.endDate) : cp.endDate;
      // If start and end are the same day, set end to start + 1 day
      if (formatDateKey(start) === formatDateKey(end)) {
        end = addDays(start, 1);
      }
      return {
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
        price: Math.max(1, Number(cp.price)),
        reason: ['event', 'holiday', 'custom', 'demand_control'].includes(cp.reason) ? cp.reason : 'custom',
        isActive: typeof cp.isActive === 'boolean' ? cp.isActive : true
      };
    });
  }

  // Helper to get a fully populated dynamicPricing object
  function getFullDynamicPricing(partial: any, property: any): any {
    return {
      enabled: partial?.enabled ?? false,
      basePrice: partial?.basePrice ?? (property?.basePrice || 0),
      minPrice: partial?.minPrice ?? 0,
      maxPrice: partial?.maxPrice ?? 0,
      // Only include seasonal rates if they actually exist
      seasonalRates: partial?.seasonalRates,
      // Only include weekly rates if they actually exist
      weeklyRates: partial?.weeklyRates,
      // Only include demand pricing if it actually exists
      demandPricing: partial?.demandPricing,
      competitionSensitivity: partial?.competitionSensitivity,
      // Only include advance booking discounts if they actually exist
      advanceBookingDiscounts: partial?.advanceBookingDiscounts,
      // Only include event pricing if it actually exists
      eventPricing: partial?.eventPricing,
      lastMinutePremium: partial?.lastMinutePremium,
      // Only include auto pricing if it actually exists
      autoPricing: partial?.autoPricing,
      directPricing: partial?.directPricing,
      // Only include availability control if it actually exists
      availabilityControl: partial?.availabilityControl,
      // Only include dynamic stay rules if they actually exist
      dynamicStayRules: partial?.dynamicStayRules
    };
  }

  // Update syncDirectPricingToBackend to always send a full dynamicPricing object
  async function syncDirectPricingToBackend(customPrices: any[]) {
    setLoadingRules(true);
    try {
      const normalized = normalizeCustomPrices(customPrices);
      const newDynamicPricing = getFullDynamicPricing({
        ...dynamicPricing,
        directPricing: {
          enabled: true,
          customPrices: normalized
        }
      }, property);
      const res = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: newDynamicPricing })
      });
      if (!res.ok) throw new Error('Failed to update direct pricing');
      const data = await res.json();
      setDynamicPricing(data.dynamicPricing);
      toast({ title: 'Success', description: 'Direct pricing updated successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingRules(false);
    }
  }

  // Function to save custom price
  function saveCustomPrice() {
    const currentCustomPrices = dynamicPricing?.directPricing?.customPrices || [];
    let newCustomPrices = [...currentCustomPrices];
    
    if (customPriceForm.dates.length === 0) return;
    
    // For date ranges or multiple dates
    if (isRangeMode && customPriceForm.dates.length > 1) {
      const startDate = customPriceForm.dates[0];
      const endDate = customPriceForm.dates[customPriceForm.dates.length - 1];
      
      // Remove any existing overlapping prices
      newCustomPrices = newCustomPrices.filter((cp: any) => {
        const cpStart = new Date(cp.startDate);
        const cpEnd = new Date(cp.endDate);
        return !(cpStart <= endDate && cpEnd > startDate);
      });
      
      // Add new range price - use inclusive end date
      newCustomPrices.push({
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(endDate), // Keep end date inclusive
        price: customPriceForm.price,
        reason: customPriceForm.reason,
        isActive: true
      });
    } else {
      // For single dates
      customPriceForm.dates.forEach(date => {
        const dateStr = formatDateKey(date);
        
        // Remove existing price for this date
        newCustomPrices = newCustomPrices.filter((cp: any) => 
          !(cp.startDate <= dateStr && cp.endDate > dateStr)
        );
        
        // Add new price - for single date, use the same date for start and end
        newCustomPrices.push({
          startDate: dateStr,
          endDate: dateStr, // Single date, so start and end are the same
          price: customPriceForm.price,
          reason: customPriceForm.reason,
          isActive: true
        });
      });
    }
    
    // Call backend sync once with all changes
    syncDirectPricingToBackend(newCustomPrices);
    setDirectPricingDialogOpen(false);
    setSelectedDates([]);
    setCustomPriceForm(prev => ({ ...prev, dates: [], price: 0 }));
  }

  // Function to delete custom price
  function deleteCustomPrice(startDate: string, endDate: string) {
    const currentCustomPrices = dynamicPricing?.directPricing?.customPrices || [];
    const newCustomPrices = currentCustomPrices.filter((cp: any) => 
      !(cp.startDate === startDate && cp.endDate === endDate)
    );
    syncDirectPricingToBackend(newCustomPrices);
  }

  // Function to get custom price for a specific date
  function getCustomPriceForDate(date: Date) {
    const customPrices = dynamicPricing?.directPricing?.customPrices || [];
    const dateKey = formatDateKey(date);
    return customPrices.find((cp: any) => {
      if (!cp.isActive) return false;
      
      // For single date pricing (startDate equals endDate)
      if (cp.startDate === cp.endDate) {
        return dateKey === cp.startDate;
      }
      
      // For range pricing (startDate different from endDate)
      return cp.startDate <= dateKey && cp.endDate >= dateKey;
    });
  }

  // Function to toggle custom price active status
  function toggleCustomPriceActive(startDate: string, endDate: string) {
    const currentCustomPrices = dynamicPricing?.directPricing?.customPrices || [];
    const newCustomPrices = currentCustomPrices.map((cp: any) => 
      (cp.startDate === startDate && cp.endDate === endDate) 
        ? { ...cp, isActive: !cp.isActive }
        : cp
    );
    syncDirectPricingToBackend(newCustomPrices);
  }

  // Function to save all changes to the backend
  const handleSaveChanges = async () => {
    if (!property || !propertyId) return;
    
    try {
      setSaving(true);
      
      // First, check if there are any pending direct pricing changes and save them
      if (customPriceForm.dates.length > 0 && customPriceForm.price > 0) {
        console.log('Auto-saving pending direct pricing changes...');
        
        const currentCustomPrices = dynamicPricing?.directPricing?.customPrices || [];
        let newCustomPrices = [...currentCustomPrices];
        
        // For date ranges or multiple dates
        if (isRangeMode && customPriceForm.dates.length > 1) {
          const startDate = customPriceForm.dates[0];
          const endDate = customPriceForm.dates[customPriceForm.dates.length - 1];
          
          // Remove any existing overlapping prices
          newCustomPrices = newCustomPrices.filter((cp: any) => {
            const cpStart = new Date(cp.startDate);
            const cpEnd = new Date(cp.endDate);
            return !(cpStart <= endDate && cpEnd > startDate);
          });
          
          // Add new range price - use inclusive end date
          newCustomPrices.push({
            startDate: formatDateKey(startDate),
            endDate: formatDateKey(endDate), // Keep end date inclusive
            price: customPriceForm.price,
            reason: customPriceForm.reason,
            isActive: true
          });
        } else {
          // For single dates
          customPriceForm.dates.forEach(date => {
            const dateStr = formatDateKey(date);
            
            // Remove existing price for this date
            newCustomPrices = newCustomPrices.filter((cp: any) => 
              !(cp.startDate <= dateStr && cp.endDate > dateStr)
            );
            
            // Add new price - for single date, use the same date for start and end
            newCustomPrices.push({
              startDate: dateStr,
              endDate: dateStr, // Single date, so start and end are the same
              price: customPriceForm.price,
              reason: customPriceForm.reason,
              isActive: true
            });
          });
        }
        
        // Update the dynamicPricing state with the new custom prices
        const updatedDynamicPricing = {
          ...dynamicPricing,
          directPricing: {
            enabled: true,
            customPrices: newCustomPrices
          }
        };
        setDynamicPricing(updatedDynamicPricing);
        
        // Clear the pending changes
        setSelectedDates([]);
        setCustomPriceForm(prev => ({ ...prev, dates: [], price: 0 }));
      }
      
      // Save property base data
      const propertyResponse = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrice: property.basePrice,
          currency: property.currency,
          // Save room category changes as propertyUnits
          propertyUnits: roomCategories.map(category => ({
            unitTypeName: category.name,
            unitTypeCode: category.id,
            count: category.count,
            pricing: {
              price: category.price.toString(),
              pricePerWeek: (category.price * 7).toString(),
              pricePerMonth: (category.price * 30).toString()
            }
          }))
        })
      });
      
      if (!propertyResponse.ok) {
        throw new Error('Failed to save property data');
      }
      
      // Save dynamic pricing data if it exists
      if (dynamicPricing) {
        // Ensure we have the latest dynamic pricing data with any direct pricing changes
        const updatedDynamicPricing = getFullDynamicPricing(dynamicPricing, property);
        
        const pricingResponse = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dynamicPricing: updatedDynamicPricing })
        });
        
        if (!pricingResponse.ok) {
          throw new Error('Failed to save dynamic pricing data');
        }
        
        // Update local state with saved data
        const savedData = await pricingResponse.json();
        if (savedData.dynamicPricing) {
          setDynamicPricing(savedData.dynamicPricing);
        }
      }
      
      toast({
        title: "Success",
        description: "All pricing changes have been saved successfully",
      });
      
      // Refresh data to ensure consistency
      await fetchPropertyData();
      await fetchPricingData();
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Blocked dates functions
  const getBlockedDatesForCategory = (categoryId: string) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates || !Array.isArray(dynamicPricing.availabilityControl.blockedDates)) {
      console.log('No blocked dates available or invalid structure');
      return [];
    }
    
    const allBlockedDates = dynamicPricing.availabilityControl.blockedDates;
    console.log('All blocked dates:', allBlockedDates);
    console.log('Filtering for category:', categoryId);
    
    const filtered = allBlockedDates.filter((blocked: any) => {
      // Check if this blocked date applies to the category
      const matchesCategory = !blocked.categoryId || blocked.categoryId === categoryId;
      const isActive = blocked.isActive !== false; // Default to true if not specified
      
      console.log('Blocked date:', blocked, 'matches category:', matchesCategory, 'is active:', isActive);
      
      return isActive && matchesCategory;
    });
    
    console.log('Filtered blocked dates for category:', filtered);
    return filtered;
  };

  const isDateBlocked = (date: Date, categoryId: string) => {
    return getBlockedDatesForCategory(categoryId).some((blocked: any) => {
      const startDate = new Date(blocked.startDate);
      const endDate = new Date(blocked.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const toggleBlockedDateActive = async (index: number, checked: boolean) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return;
    
    try {
      setSaving(true);
      
      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.map((blocked: any, i: number) =>
            i === index ? { ...blocked, isActive: checked } : blocked
          )
        }
      };
      
      // Save to database
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: updatedDynamicPricing })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update blocked date status');
      }
      
      const data = await response.json();
      setDynamicPricing(data.dynamicPricing);
      
      toast({
        title: "Success",
        description: `Blocked date ${checked ? 'activated' : 'deactivated'} successfully`
      });
      
    } catch (error) {
      console.error('Error updating blocked date:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update blocked date",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBlockedDate = async (index: number) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return;
    
    try {
      setSaving(true);
      
      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.filter((_: any, i: number) => i !== index)
        }
      };
      
      // Save to database
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: updatedDynamicPricing })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blocked date');
      }
      
      const data = await response.json();
      setDynamicPricing(data.dynamicPricing);
      
      toast({
        title: "Success",
        description: "Blocked date deleted successfully"
      });
      
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete blocked date",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveBlockedDates = async () => {
    if (!dynamicPricing || blockDateForm.dates.length === 0) return;
    
    try {
      setSaving(true);
      
      const startDate = blockDateForm.dates[0];
      const endDate = blockDateForm.dates[blockDateForm.dates.length - 1];
      const newBlockedDate = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reason: blockDateForm.reason,
        isActive: true,
        categoryId: blockDateForm.categoryId
      };
      
      console.log('Creating new blocked date:', newBlockedDate);
      
      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          enabled: true,
          blockedDates: blockDateForm.editIndex >= 0
            ? dynamicPricing.availabilityControl?.blockedDates?.map((blocked: any, i: number) =>
                i === blockDateForm.editIndex ? newBlockedDate : blocked
              ) || [newBlockedDate]
            : [...(dynamicPricing.availabilityControl?.blockedDates || []), newBlockedDate]
        }
      };
      
      console.log('Updated dynamic pricing to save:', updatedDynamicPricing);
      
      // Save to database
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: updatedDynamicPricing })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to save blocked dates');
      }
      
      const data = await response.json();
      console.log('Response from API:', data);
      
      // Update local state with the response from server
      setDynamicPricing(data.dynamicPricing);
      
      // Clear selections and form
      setSelectedBlockDates([]);
      setBlockDateDialogOpen(false);
      setBlockDateForm({
        dates: [],
        reason: '',
        categoryId: '',
        editIndex: -1
      });
      
      // Force refresh of pricing data to ensure consistency
      await fetchPricingData();
      
      toast({
        title: "Success",
        description: `${blockDateForm.dates.length} date${blockDateForm.dates.length > 1 ? 's have' : ' has'} been blocked successfully`
      });
      
    } catch (error) {
      console.error('Error saving blocked dates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save blocked dates",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const unblockDates = async (dates: Date[]) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return;
    
    try {
      setSaving(true);
      
      const datesToUnblock = dates.map(date => format(date, 'yyyy-MM-dd'));
      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.filter((blocked: any) => {
            const blockedStart = format(new Date(blocked.startDate), 'yyyy-MM-dd');
            const blockedEnd = format(new Date(blocked.endDate), 'yyyy-MM-dd');
            return !datesToUnblock.some(date => date >= blockedStart && date <= blockedEnd);
          })
        }
      };
      
      // Save to database
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicPricing: updatedDynamicPricing })
      });
      
      if (!response.ok) {
        throw new Error('Failed to unblock dates');
      }
      
      const data = await response.json();
      setDynamicPricing(data.dynamicPricing);
      setSelectedBlockDates([]);
      
      toast({
        title: "Success",
        description: "Selected dates have been unblocked successfully"
      });
      
    } catch (error) {
      console.error('Error unblocking dates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unblock dates",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingRules) return <div className="flex justify-center items-center min-h-[300px]"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  if (!property && !loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl">⚠️</div>
            <h3 className="text-lg font-semibold">Failed to Load Property</h3>
            <p className="text-muted-foreground">Unable to fetch property data. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Main container */}
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl min-h-screen flex flex-col">
        {/* Header, AI Suggestions, and divider (single instance) */}
        <div className="flex flex-col gap-2 mb-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">Pricing Management</h1>
              <div className="text-xl font-semibold text-gray-900 truncate max-w-full">
                {property?.title || property?.name || 'Loading...'}
              </div>
              <div className="text-gray-500 text-base truncate max-w-full">
                {property?.location || 'Loading location...'}
            </div>
            {property && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>Base Price: ₹{property.basePrice?.toLocaleString() || '0'}</span>
                  <span>•</span>
                  <span>{property.totalHotelRooms} rooms</span>
                  <span>•</span>
                  <span>Max {property.maxGuests} guests</span>
              </div>
            )}
          </div>
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
            <Button variant="outline" onClick={() => setShowAISuggestions(!showAISuggestions)}>
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </Button>
            <Button variant="outline" onClick={fetchPricingData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Current property data:', property);
                  console.log('Current live preview:', livePreview);
                  console.log('Current pricing rules:', pricingRules);
                }}
              >
                Debug
              </Button>
              <Button onClick={handleSaveChanges} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
          {/* AI Suggestions Alert at top for visibility */}
        {showAISuggestions && aiSuggestions.length > 0 && (
            <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mt-4">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <AlertDescription>
                <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-medium text-purple-800">AI has {aiSuggestions.length} pricing suggestions</span>
                  <span className="text-purple-600 ml-2">
                    Potential revenue increase: +₹{aiSuggestions.reduce((sum, s) => sum + (s.suggested - s.current), 0).toLocaleString()}/night
                  </span>
                </div>
                <Button variant="outline" size="sm" className="border-purple-200">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply All
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
          <div className="border-b border-gray-200 mb-6" />
        </div>
        {/* Responsive main grid with stable layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 w-full max-w-full flex-1 items-start">
          {/* Main Content (single instance) */}
          <div className="min-w-0 w-full max-w-full flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 w-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="overflow-x-auto whitespace-nowrap w-full max-w-full gap-1 mb-4">
                <TabsTrigger value="base-price" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Base Price
                </TabsTrigger>
                <TabsTrigger value="dynamic-rules" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Dynamic Rules
                </TabsTrigger>
                <TabsTrigger value="direct-pricing" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Direct Pricing
                </TabsTrigger>
                <TabsTrigger value="blocked-dates" className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Blocked Dates
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Promotions
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Base Price Tab */}
              <TabsContent value="base-price" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                        Room Category Pricing
                        <InfoTooltip content="Set base prices for each room category in your property" />
                    </CardTitle>
                      <div className="text-sm text-muted-foreground mt-2">
                        Configure pricing for each room category. Dynamic pricing and direct pricing will be applied per category.
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {/* Global Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <InfoTooltip content="All prices will be displayed in this currency" />
                          </div>
                          <Select 
                            value={property?.currency || 'INR'}
                            onValueChange={(value) => {
                                if (property) {
                                setProperty({ ...property, currency: value });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                              <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                              <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="taxRate">Tax Rate (%)</Label>
                            <InfoTooltip content="Tax rate applied to all bookings" />
                          </div>
                          <Input
                            id="taxRate"
                            type="number"
                            placeholder="18"
                            step="0.1"
                          />
                        </div>
                      </div>

                      {/* Room Categories */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Room Categories ({roomCategories.length})
                          </h4>
                        
                        <Accordion type="single" collapsible className="space-y-2">
                          {roomCategories.map((category) => (
                            <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                              <AccordionTrigger className="hover:no-underline px-4">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                                    <div className="text-left">
                                      <div className="font-medium">{category.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {category.count} rooms • ₹{category.price.toLocaleString()}/night
                            </div>
                          </div>
                        </div>
                                  <Badge variant="outline" className="mr-8">
                                    ₹{category.price.toLocaleString()}
                                  </Badge>
                      </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                                      <Label>Base Price per Night</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                            <Input
                              type="number"
                                          value={category.price}
                                          onChange={(e) => {
                                            const newPrice = parseFloat(e.target.value) || 0;
                                            setRoomCategories(prev => prev.map(cat => 
                                              cat.id === category.id ? { ...cat, price: newPrice } : cat
                                            ));
                                          }}
                              className="pl-8"
                                          placeholder="5000"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                                      <Label>Available Rooms</Label>
                            <Input
                              type="number"
                                        value={category.count}
                                        onChange={(e) => {
                                          const newCount = parseInt(e.target.value) || 1;
                                          setRoomCategories(prev => prev.map(cat => 
                                            cat.id === category.id ? { ...cat, count: newCount } : cat
                                          ));
                                        }}
                                        placeholder="1"
                                        min="1"
                                      />
                        </div>
                        
                        <div className="space-y-2">
                                      <Label>Max Guests</Label>
                          <Input
                            type="number"
                                        value={category.maxGuests}
                                        onChange={(e) => {
                                          const newMaxGuests = parseInt(e.target.value) || 3;
                                          setRoomCategories(prev => prev.map(cat => 
                                            cat.id === category.id ? { ...cat, maxGuests: newMaxGuests } : cat
                                          ));
                                        }}
                                        placeholder="3"
                                        min="1"
                          />
                        </div>
                      </div>
                                  
                                  {category.description && (
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                                        {category.description}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => setSelectedRoomCategory(category.id)}
                                      variant={selectedRoomCategory === category.id ? "default" : "outline"}
                                    >
                                      {selectedRoomCategory === category.id ? 'Selected' : 'Select for Pricing'}
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        
                        {roomCategories.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                            <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <div className="font-medium">No room categories found</div>
                            <div className="text-sm text-muted-foreground">
                              Room categories will be loaded from property configuration
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Selected Category for Pricing Rules</h4>
                        {selectedRoomCategory ? (
                          <div className="text-sm text-blue-700">
                            Currently configuring: <strong>{roomCategories.find(c => c.id === selectedRoomCategory)?.name}</strong>
                            <br />
                            Dynamic pricing and direct pricing rules will apply to this category.
                          </div>
                        ) : (
                          <div className="text-sm text-blue-700">
                            Select a room category above to configure its pricing rules in other tabs.
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dynamic Rules Tab */}
              <TabsContent value="dynamic-rules" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Dynamic Pricing Rules
                      <InfoTooltip content="Automated rules that adjust your base price based on various factors" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-4">
                      <AccordionItem value="seasonal" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <CalendarIcon className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Seasonal Pricing</div>
                              <div className="text-sm text-muted-foreground">Adjust prices based on seasons and holidays</div>
                            </div>
                            <Badge variant="outline" className="ml-auto">2 Active</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div className="space-y-4">
                            {pricingRules.filter(rule => rule.type === 'seasonal').map(rule => (
                              <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                      <h4 className="font-medium break-words max-w-xs">{rule.name}</h4>
                                      <p className="text-sm text-muted-foreground break-words max-w-xs">{rule.description}</p>
                                  </div>
                                    <div className="flex gap-2 items-center">
                                      <Switch checked={rule.isActive} onCheckedChange={() => toggleSeasonalRuleActive(rule.id)} />
                                      <Button size="sm" variant="outline" onClick={() => openEditSeasonalRule(rule)}>
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => deleteSeasonalRule(rule.id)}>
                                        Delete
                                      </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Multiplier:</span>
                                    <span className="ml-2 font-medium">{rule.multiplier}x</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Period:</span>
                                    <span className="ml-2 font-medium">
                                      {format(rule.dateRange.start, 'MMM dd')} - {format(rule.dateRange.end, 'MMM dd')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Impact:</span>
                                    <span className="ml-2 font-medium text-green-600">
                                      +₹{Math.round((property?.basePrice || 0) * (rule.multiplier - 1)).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                              <Button variant="outline" className="w-full" onClick={openAddSeasonalRule}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Seasonal Rule
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="demand" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Demand-Based Pricing</div>
                              <div className="text-sm text-muted-foreground">Automatic adjustments based on booking patterns</div>
                            </div>
                            <Badge variant="outline" className="ml-auto">1 Active</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <div className="space-y-4">
                              {pricingRules.filter(rule => rule.type === 'demand').map(rule => (
                                <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium break-words max-w-xs">{rule.name}</h4>
                                      <p className="text-sm text-muted-foreground break-words max-w-xs">{rule.description}</p>
                          </div>
                                    <div className="flex gap-2 items-center">
                                      <Switch checked={rule.isActive} onCheckedChange={() => toggleDemandRuleActive(rule.id)} />
                                      <Button size="sm" variant="outline" onClick={() => openEditDemandRule(rule)}>
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => deleteDemandRule(rule.id)}>
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Multiplier:</span>
                                      <span className="ml-2 font-medium">{rule.multiplier}x</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Period:</span>
                                      <span className="ml-2 font-medium">
                                        {format(rule.dateRange.start, 'MMM dd')} - {format(rule.dateRange.end, 'MMM dd')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Impact:</span>
                                      <span className="ml-2 font-medium text-green-600">
                                        +₹{Math.round((property?.basePrice || 0) * (rule.multiplier - 1)).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Button variant="outline" className="w-full" onClick={openAddDemandRule}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Demand-Based Rule
                              </Button>
                            </div>
                            {/* Modal for add/edit demand rule */}
                            <Dialog open={demandDialogOpen} onOpenChange={setDemandDialogOpen}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{editingDemandRule ? 'Edit Demand-Based Rule' : 'Add Demand-Based Rule'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Rule Name"
                                    value={demandRuleForm.name}
                                    onChange={e => setDemandRuleForm(f => ({ ...f, name: e.target.value }))}
                                  />
                                  <Input
                                    placeholder="Description"
                                    value={demandRuleForm.description}
                                    onChange={e => setDemandRuleForm(f => ({ ...f, description: e.target.value }))}
                                  />
                                  <div className="flex gap-2">
                                    <DatePicker
                                      date={demandRuleForm.dateRange.start}
                                      onSelect={(date: Date | undefined) => setDemandRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, start: date || new Date() } }))}
                                      placeholder="Start Date"
                                    />
                                    <DatePicker
                                      date={demandRuleForm.dateRange.end}
                                      onSelect={(date: Date | undefined) => setDemandRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, end: date || new Date() } }))}
                                      placeholder="End Date"
                                    />
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="Multiplier"
                                    value={demandRuleForm.multiplier}
                                    onChange={e => setDemandRuleForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Switch checked={demandRuleForm.isActive} onCheckedChange={v => setDemandRuleForm(f => ({ ...f, isActive: v }))} />
                                    <span>Active</span>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDemandDialogOpen(false)}>Cancel</Button>
                                  <Button onClick={saveDemandRule}>{editingDemandRule ? 'Save Changes' : 'Add Rule'}</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="events" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Event-Based Pricing</div>
                              <div className="text-sm text-muted-foreground">Price adjustments for local events and holidays</div>
                            </div>
                            <Badge variant="outline" className="ml-auto">3 Upcoming</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <div className="space-y-4">
                              {pricingRules.filter(rule => rule.type === 'event').map(rule => (
                                <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium break-words max-w-xs">{rule.name}</h4>
                                      <p className="text-sm text-muted-foreground break-words max-w-xs">{rule.description}</p>
                          </div>
                                    <div className="flex gap-2 items-center">
                                      <Switch checked={rule.isActive} onCheckedChange={() => toggleEventRuleActive(rule.id)} />
                                      <Button size="sm" variant="outline" onClick={() => openEditEventRule(rule)}>
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => deleteEventRule(rule.id)}>
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Multiplier:</span>
                                      <span className="ml-2 font-medium">{rule.multiplier}x</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Period:</span>
                                      <span className="ml-2 font-medium">
                                        {format(rule.dateRange.start, 'MMM dd')} - {format(rule.dateRange.end, 'MMM dd')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Impact:</span>
                                      <span className="ml-2 font-medium text-green-600">
                                        +₹{Math.round((property?.basePrice || 0) * (rule.multiplier - 1)).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Button variant="outline" className="w-full" onClick={openAddEventRule}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Event-Based Rule
                              </Button>
                            </div>
                            {/* Modal for add/edit event rule */}
                            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{editingEventRule ? 'Edit Event-Based Rule' : 'Add Event-Based Rule'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Rule Name"
                                    value={eventRuleForm.name}
                                    onChange={e => setEventRuleForm(f => ({ ...f, name: e.target.value }))}
                                  />
                                  <Input
                                    placeholder="Description"
                                    value={eventRuleForm.description}
                                    onChange={e => setEventRuleForm(f => ({ ...f, description: e.target.value }))}
                                  />
                                  <div className="flex gap-2">
                                    <DatePicker
                                      date={eventRuleForm.dateRange.start}
                                      onSelect={(date: Date | undefined) => setEventRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, start: date || new Date() } }))}
                                      placeholder="Start Date"
                                    />
                                    <DatePicker
                                      date={eventRuleForm.dateRange.end}
                                      onSelect={(date: Date | undefined) => setEventRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, end: date || new Date() } }))}
                                      placeholder="End Date"
                                    />
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="Multiplier"
                                    value={eventRuleForm.multiplier}
                                    onChange={e => setEventRuleForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Switch checked={eventRuleForm.isActive} onCheckedChange={v => setEventRuleForm(f => ({ ...f, isActive: v }))} />
                                    <span>Active</span>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                                  <Button onClick={saveEventRule}>{editingEventRule ? 'Save Changes' : 'Add Rule'}</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

                {/* Direct Pricing Tab */}
              <TabsContent value="direct-pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        Direct Date Pricing
                        <InfoTooltip content="Set custom prices for specific dates or date ranges per room category" />
                      </CardTitle>
                      
                      {/* Room Category Selection */}
                      {selectedRoomCategory ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              Configuring: {roomCategories.find(c => c.id === selectedRoomCategory)?.name}
                            </span>
                            <Badge variant="outline">
                              ₹{roomCategories.find(c => c.id === selectedRoomCategory)?.price.toLocaleString()}/night
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('base-price')}
                          >
                            Change Category
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab before configuring direct pricing.
                            <Button 
                              variant="link" 
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab('base-price')}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {selectedRoomCategory && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={isRangeMode} 
                              onCheckedChange={setIsRangeMode}
                            />
                            <Label className="text-sm">Range Selection Mode</Label>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const selectedCategory = roomCategories.find(c => c.id === selectedRoomCategory);
                              setCustomPriceForm({ 
                                dates: [], 
                                price: selectedCategory?.price || 0, 
                                reason: 'custom' 
                              });
                              setDirectPricingDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Price
                          </Button>
                        </div>
                      )}
                  </CardHeader>
                    <CardContent className="space-y-6">
                      {selectedRoomCategory ? (
                        <>
                          {/* Calendar View */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-3">Calendar View</h4>
                              <div className="border rounded-lg p-4">
                                <PricingCalendar
                                  basePrice={roomCategories.find(c => c.id === selectedRoomCategory)?.price || 0}
                                  customPrices={dynamicPricing?.directPricing?.customPrices || []}
                                  seasonalRules={pricingRules.map((rule: any) => ({
                                    id: rule.id,
                                    name: rule.name,
                                    startDate: rule.dateRange?.start ? format(rule.dateRange.start, 'yyyy-MM-dd') : '',
                                    endDate: rule.dateRange?.end ? format(rule.dateRange.end, 'yyyy-MM-dd') : '',
                                    multiplier: rule.multiplier,
                                    isActive: rule.isActive
                                  }))}
                                  mode={isRangeMode ? 'range' : 'multiple'}
                                  selectedDates={selectedDates}
                                  onDateSelect={(dates) => {
                                    setSelectedDates(dates);
                                    // Only open custom price dialog when range selection is complete
                                    if (isRangeMode && dates.length === 2) {
                                      // Ensure dates are sorted (earlier date first)
                                      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
                                      setSelectedDates(sortedDates);
                                      setCustomPriceForm(prev => ({ ...prev, dates: sortedDates }));
                                      setDirectPricingDialogOpen(true);
                                    } else if (!isRangeMode && dates.length > 0) {
                                      // For multiple selection mode, open dialog immediately
                                      setCustomPriceForm(prev => ({ ...prev, dates: dates }));
                                      setDirectPricingDialogOpen(true);
                                    }
                                  }}
                                  minDate={new Date(2025, 6, 24)} // July 24, 2025
                                  showPrices={true}
                                  blockedDates={getBlockedDatesForCategory(selectedRoomCategory).map((blocked: any) => {
                                    // Ensure proper date format for calendar
                                    const startDate = typeof blocked.startDate === 'string' ? blocked.startDate : format(blocked.startDate, 'yyyy-MM-dd');
                                    const endDate = typeof blocked.endDate === 'string' ? blocked.endDate : format(blocked.endDate, 'yyyy-MM-dd');
                                    
                                    return {
                                      ...blocked,
                                      startDate,
                                      endDate,
                                      isActive: blocked.isActive !== false // Ensure it's treated as active by default
                                    };
                                  })}
                                  variant="pricing"
                                />
                              </div>
                            </div>
                            
                            {/* Custom Prices List */}
                            <div>
                              <h4 className="font-medium mb-3">Custom Price Overrides ({(dynamicPricing?.directPricing?.customPrices || []).length})</h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {(dynamicPricing?.directPricing?.customPrices || []).map((customPrice: any, index: number) => {
                                  const startDate = new Date(customPrice.startDate);
                                  const endDate = new Date(customPrice.endDate);
                                  const isSingleDay = formatDateKey(startDate) === formatDateKey(endDate);
                                  
                                  return (
                                    <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${customPrice.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {isSingleDay 
                                            ? format(startDate, 'MMM dd, yyyy')
                                            : `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
                                          }
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          ₹{customPrice.price.toLocaleString()} • {customPrice.reason.replace('_', ' ')}
                                          {!customPrice.isActive && ' • Inactive'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {customPrice.price > (property?.basePrice || 0) ? '+' : ''}₹{(customPrice.price - (property?.basePrice || 0)).toLocaleString()} vs base
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch 
                                          checked={customPrice.isActive} 
                                          onCheckedChange={() => toggleCustomPriceActive(customPrice.startDate, customPrice.endDate)}
                                        />
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            const dates = isSingleDay 
                                              ? [startDate]
                                              : eachDayOfInterval({ start: startDate, end: endDate });
                                            setCustomPriceForm({
                                              dates: dates,
                                              price: customPrice.price,
                                              reason: customPrice.reason
                                            });
                                            setSelectedDates(dates);
                                            if (!isSingleDay) setIsRangeMode(true);
                                            setDirectPricingDialogOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => deleteCustomPrice(customPrice.startDate, customPrice.endDate)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {(!dynamicPricing?.directPricing?.customPrices || dynamicPricing.directPricing.customPrices.length === 0) && (
                                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <div className="font-medium">No custom prices set</div>
                                    <div className="text-sm">Click on calendar dates to add custom pricing</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Selected Dates Info */}
                          {selectedDates.length > 0 && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-2">
                                Selected: {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''}
                              </h5>
                              <div className="text-sm text-blue-700">
                                {selectedDates.length === 1 
                                  ? format(selectedDates[0], 'MMM dd, yyyy')
                                  : `${format(selectedDates[0], 'MMM dd')} - ${format(selectedDates[selectedDates.length - 1], 'MMM dd, yyyy')}`
                                }
                              </div>
                              
                              {/* Range selection feedback */}
                              {isRangeMode && selectedDates.length === 1 && (
                                <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                                  <div className="font-medium">Range Selection Mode</div>
                                  <div>Click on another date to complete the range selection</div>
                                </div>
                              )}
                              
                              {/* Only show Set Custom Price button when range is complete or in multiple mode */}
                              {(!isRangeMode || selectedDates.length === 2) && (
                                <Button 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => {
                                    // Ensure dates are sorted for range mode
                                    const sortedDates = isRangeMode && selectedDates.length === 2 
                                      ? selectedDates.sort((a, b) => a.getTime() - b.getTime())
                                      : selectedDates;
                                    setCustomPriceForm(prev => ({ ...prev, dates: sortedDates }));
                                    setDirectPricingDialogOpen(true);
                                  }}
                                >
                                  Set Custom Price
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab before configuring direct pricing.
                            <Button 
                              variant="link" 
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab('base-price')}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>
                  
                  {/* Custom Price Dialog */}
                  <Dialog open={directPricingDialogOpen} onOpenChange={setDirectPricingDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Custom Price</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Selected Dates</Label>
                          <div className="text-sm text-muted-foreground">
                            {customPriceForm.dates.length === 1 
                              ? format(customPriceForm.dates[0], 'MMM dd, yyyy')
                              : customPriceForm.dates.length > 1
                                ? `${format(customPriceForm.dates[0], 'MMM dd')} - ${format(customPriceForm.dates[customPriceForm.dates.length - 1], 'MMM dd, yyyy')} (${customPriceForm.dates.length} days)`
                                : 'No dates selected'
                            }
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="customPrice">Custom Price per Night</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                            <Input
                              id="customPrice"
                              type="number"
                              value={customPriceForm.price}
                              onChange={(e) => setCustomPriceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              className="pl-8"
                              placeholder="Enter custom price"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason</Label>
                          <Select 
                            value={customPriceForm.reason} 
                            onValueChange={(value) => setCustomPriceForm(prev => ({ ...prev, reason: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom Pricing</SelectItem>
                              <SelectItem value="event">Event Pricing</SelectItem>
                              <SelectItem value="holiday">Holiday Pricing</SelectItem>
                              <SelectItem value="demand_control">Demand Control</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Base Price:</span>
                              <span>₹{(property?.basePrice || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Custom Price:</span>
                              <span>₹{customPriceForm.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Difference:</span>
                              <span>
                                {customPriceForm.price > (property?.basePrice || 0) ? '+' : ''}
                                ₹{(customPriceForm.price - (property?.basePrice || 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDirectPricingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveCustomPrice} disabled={customPriceForm.dates.length === 0 || customPriceForm.price <= 0}>
                          Save Custom Price
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </TabsContent>

              <TabsContent value="blocked-dates" className="space-y-6">
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        Blocked Dates Management
                        <InfoTooltip content="Block specific dates for maintenance, personal use, or availability control per room category" />
                      </CardTitle>
                      
                      {/* Room Category Selection */}
                      {selectedRoomCategory ? (
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900">
                              Configuring: {roomCategories.find(c => c.id === selectedRoomCategory)?.name}
                            </span>
                            <Badge variant="outline">
                              {roomCategories.find(c => c.id === selectedRoomCategory)?.count} rooms
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('base-price')}
                          >
                            Change Category
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab before configuring blocked dates.
                            <Button 
                              variant="link" 
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab('base-price')}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardHeader>
                  <CardContent>
                      {selectedRoomCategory ? (
                        <>
                          {/* Block Date Controls */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Block Dates Calendar</h4>
                                <p className="text-sm text-muted-foreground">
                                  Click on dates to block them for the selected room category
                                </p>
                    </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsBlockRangeMode(!isBlockRangeMode)}
                                >
                                  {isBlockRangeMode ? 'Range Mode' : 'Single Date'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBlockDates([])}
                                  disabled={selectedBlockDates.length === 0}
                                >
                                  Clear Selection
                                </Button>
                              </div>
                            </div>

                            {/* Blocked Dates Calendar */}
                            <div className="border rounded-lg p-4 bg-white">
                              <PricingCalendar
                                basePrice={roomCategories.find(c => c.id === selectedRoomCategory)?.price || 0}
                                customPrices={[]} // Not showing prices for blocked dates
                                seasonalRules={[]}
                                mode={isBlockRangeMode ? "range" : "multiple"}
                                selectedDates={selectedBlockDates}
                                onDateSelect={(dates) => {
                                  console.log('Calendar date selection changed:', dates);
                                  setSelectedBlockDates(dates);
                                }}
                                minDate={new Date()}
                                showPrices={false}
                                blockedDates={getBlockedDatesForCategory(selectedRoomCategory).map((blocked: any) => {
                                  // Ensure proper date format for calendar
                                  const startDate = typeof blocked.startDate === 'string' ? blocked.startDate : format(blocked.startDate, 'yyyy-MM-dd');
                                  const endDate = typeof blocked.endDate === 'string' ? blocked.endDate : format(blocked.endDate, 'yyyy-MM-dd');
                                  
                                  return {
                                    ...blocked,
                                    startDate,
                                    endDate,
                                    isActive: blocked.isActive !== false // Ensure it's treated as active by default
                                  };
                                })}
                                variant="blocking"
                                className="w-full"
                              />
                            </div>

                            {/* Selected Dates Info */}
                            {selectedBlockDates.length > 0 && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h5 className="font-medium text-red-900 mb-2">
                                  Selected: {selectedBlockDates.length} date{selectedBlockDates.length > 1 ? 's' : ''}
                                </h5>
                                <div className="text-sm text-red-700 mb-3">
                                  {selectedBlockDates.length === 1 
                                    ? format(selectedBlockDates[0], 'MMM dd, yyyy')
                                    : `${format(selectedBlockDates[0], 'MMM dd')} - ${format(selectedBlockDates[selectedBlockDates.length - 1], 'MMM dd, yyyy')}`
                                  }
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => {
                                      console.log('Opening block dialog for category:', selectedRoomCategory);
                                      console.log('Selected dates to block:', selectedBlockDates);
                                      setBlockDateForm(prev => ({ 
                                        ...prev, 
                                        dates: selectedBlockDates,
                                        categoryId: selectedRoomCategory 
                                      }));
                                      setBlockDateDialogOpen(true);
                                    }}
                                  >
                                    Block These Dates
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => unblockDates(selectedBlockDates)}
                                    disabled={!selectedBlockDates.some(date => isDateBlocked(date, selectedRoomCategory))}
                                  >
                                    Unblock These Dates
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                                <span>Available</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Blocked</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                <span>Past Dates</span>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-6" />

                          {/* Existing Blocked Dates List */}
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <Ban className="h-4 w-4 text-red-600" />
                              Active Blocked Periods ({getBlockedDatesForCategory(selectedRoomCategory).length})
                            </h4>
                            
                            <div className="space-y-3">
                              {getBlockedDatesForCategory(selectedRoomCategory).map((blockedPeriod: any, index: number) => {
                                const isRange = blockedPeriod.startDate !== blockedPeriod.endDate;
                                const startDate = new Date(blockedPeriod.startDate);
                                const endDate = new Date(blockedPeriod.endDate);
                                
                                return (
                                  <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-red-900">
                                          {isRange 
                                            ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
                                            : format(startDate, 'MMM dd, yyyy')
                                          }
                                        </div>
                                        <div className="text-sm text-red-700 mt-1">
                                          <span className="capitalize">{blockedPeriod.reason}</span>
                                          {isRange && (
                                            <span className="ml-2">
                                              ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Switch 
                                          checked={blockedPeriod.isActive} 
                                          onCheckedChange={(checked) => toggleBlockedDateActive(index, checked)}
                                        />
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            const dates = [];
                                            const currentDate = new Date(blockedPeriod.startDate);
                                            const endDate = new Date(blockedPeriod.endDate);
                                            
                                            while (currentDate <= endDate) {
                                              dates.push(new Date(currentDate));
                                              currentDate.setDate(currentDate.getDate() + 1);
                                            }
                                            
                                            setBlockDateForm({
                                              dates,
                                              reason: blockedPeriod.reason,
                                              categoryId: selectedRoomCategory,
                                              editIndex: index
                                            });
                                            setBlockDateDialogOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => deleteBlockedDate(index)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {getBlockedDatesForCategory(selectedRoomCategory).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                                  <Ban className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <div className="font-medium">No blocked dates</div>
                                  <div className="text-sm">Click on calendar dates to block them</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab before configuring blocked dates.
                            <Button 
                              variant="link" 
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab('base-price')}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>
                  
                  {/* Block Date Dialog */}
                  <Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {blockDateForm.editIndex !== undefined ? 'Edit' : 'Block'} Dates
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Selected Dates</Label>
                          <div className="text-sm text-muted-foreground">
                            {blockDateForm.dates.length === 1 
                              ? format(blockDateForm.dates[0], 'MMM dd, yyyy')
                              : blockDateForm.dates.length > 1
                                ? `${format(blockDateForm.dates[0], 'MMM dd')} - ${format(blockDateForm.dates[blockDateForm.dates.length - 1], 'MMM dd, yyyy')} (${blockDateForm.dates.length} days)`
                                : 'No dates selected'
                            }
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="blockReason">Reason for Blocking</Label>
                          <Select 
                            value={blockDateForm.reason} 
                            onValueChange={(value) => setBlockDateForm(prev => ({ ...prev, reason: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="personal">Personal Use</SelectItem>
                              <SelectItem value="demand_control">Demand Control</SelectItem>
                              <SelectItem value="event">Event Conflict</SelectItem>
                              <SelectItem value="renovation">Renovation</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <div className="text-sm text-yellow-800">
                            <div className="font-medium mb-1">Impact:</div>
                            <div>• Room Category: {roomCategories.find(c => c.id === selectedRoomCategory)?.name}</div>
                            <div>• Affected Rooms: {roomCategories.find(c => c.id === selectedRoomCategory)?.count}</div>
                            <div>• Duration: {blockDateForm.dates.length} day{blockDateForm.dates.length > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockDateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={saveBlockedDates} 
                          disabled={blockDateForm.dates.length === 0 || !blockDateForm.reason}
                        >
                          {blockDateForm.editIndex !== undefined ? 'Update' : 'Block'} Dates
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </TabsContent>

              <TabsContent value="promotions" className="space-y-6">
                <PropertyPromotionsManager propertyId={propertyId} property={property} />
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Pricing history and analytics coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          </div>
          {/* Sidebar: wider, smaller font, less padding */}
          <div className="w-full max-w-full mt-6 lg:mt-0 lg:w-[340px]">
            <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col gap-3 pb-6 lg:pb-0 max-w-full">
              {/* Live Preview Card - smaller font, wider container */}
              <Card className="max-w-full">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 whitespace-normal break-words max-w-full text-base">
                  <Eye className="h-5 w-5 text-purple-600" />
                    <span className="truncate max-w-[70%]">Live Preview</span>
                  <InfoTooltip content="See how your pricing changes affect the final price in real-time" />
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-3 max-w-full text-[15px]">
                  {/* Selected Room Category */}
                  {selectedRoomCategory && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Room Category</Label>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-medium text-blue-900">
                          {roomCategories.find(c => c.id === selectedRoomCategory)?.name}
                        </div>
                        <div className="text-blue-700">
                          {roomCategories.find(c => c.id === selectedRoomCategory)?.count} rooms available
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground break-words max-w-full">Preview Date</Label>
                  <Calendar
                    mode="single"
                    selected={livePreview.selectedDate}
                    onSelect={(date) => date && setLivePreview(prev => ({ ...prev, selectedDate: date }))}
                      className="rounded-md border max-w-full"
                  />
                </div>
                <Separator />
                  <div className="space-y-2 max-w-full">
                    <div className="flex justify-between items-center max-w-full">
                      <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {selectedRoomCategory ? 'Category Price:' : 'Base Price:'}
                      </span>
                      <span className="font-medium truncate max-w-[40%] text-base">₹{calculateLivePreview.basePrice.toLocaleString()}</span>
                  </div>
                  {calculateLivePreview.appliedRules.map(rule => (
                      <div key={rule.id} className="flex justify-between items-center text-xs max-w-full">
                        <span className="text-muted-foreground truncate max-w-[60%]">{rule.name}:</span>
                        <span className="text-blue-600 truncate max-w-[40%]">×{rule.multiplier}</span>
                    </div>
                  ))}
                  <Separator />
                    <div className="flex justify-between items-center max-w-full">
                      <span className="font-medium truncate max-w-[60%] text-xs">Final Price:</span>
                      <span className="text-xl font-bold text-green-600 truncate max-w-[40%]">₹{calculateLivePreview.finalPrice.toLocaleString()}</span>
                  </div>
                  {calculateLivePreview.finalPrice !== calculateLivePreview.basePrice && (
                      <div className="text-center max-w-full">
                        <Badge variant="outline" className="bg-green-50 text-green-700 whitespace-normal break-words max-w-full text-xs">
                        +{Math.round(((calculateLivePreview.finalPrice / calculateLivePreview.basePrice) - 1) * 100)}% from base
                      </Badge>
                    </div>
                  )}
                </div>
                <Separator />
                  <div className="space-y-1 max-w-full">
                    <div className="flex items-center gap-2 text-xs max-w-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground truncate max-w-[60%]">Active Rules:</span>
                      <span className="font-medium truncate max-w-[40%]">{calculateLivePreview.appliedRules.length}</span>
                  </div>
                    <div className="flex items-center gap-2 text-xs max-w-full">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-muted-foreground truncate max-w-[60%]">Custom Prices:</span>
                      <span className="font-medium truncate max-w-[40%]">{(dynamicPricing?.directPricing?.customPrices || []).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
              {/* Quick Actions - smaller font, wider container */}
              <Card className="max-w-full">
              <CardHeader>
                  <CardTitle className="text-xs truncate max-w-full">Quick Actions</CardTitle>
              </CardHeader>
                <CardContent className="space-y-1 max-w-full">
                  <Button variant="outline" size="sm" className="w-full justify-start truncate max-w-full text-xs">
                  <Clock className="h-4 w-4 mr-2" />
                    <span className="truncate">Apply Weekend Premium</span>
                </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start truncate max-w-full text-xs">
                  <Sparkles className="h-4 w-4 mr-2" />
                    <span className="truncate">Copy from Similar Property</span>
                </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start truncate max-w-full text-xs">
                  <BarChart3 className="h-4 w-4 mr-2" />
                    <span className="truncate">View Analytics</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      {/* Modal for add/edit rule */}
      <Dialog open={seasonalDialogOpen} onOpenChange={setSeasonalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Seasonal Rule' : 'Add Seasonal Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Rule Name"
              value={ruleForm.name}
              onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Description"
              value={ruleForm.description}
              onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <DatePicker
                date={ruleForm.dateRange.start}
                onSelect={(date: Date | undefined) => setRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, start: date || new Date() } }))}
                placeholder="Start Date"
              />
              <DatePicker
                date={ruleForm.dateRange.end}
                onSelect={(date: Date | undefined) => setRuleForm(f => ({ ...f, dateRange: { ...f.dateRange, end: date || new Date() } }))}
                placeholder="End Date"
              />
            </div>
            <Input
              type="number"
              placeholder="Multiplier"
              value={ruleForm.multiplier}
              onChange={e => setRuleForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))}
            />
            <div className="flex items-center gap-2">
              <Switch checked={ruleForm.isActive} onCheckedChange={v => setRuleForm(f => ({ ...f, isActive: v }))} />
              <span>Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonalDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSeasonalRule}>{editingRule ? 'Save Changes' : 'Add Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 