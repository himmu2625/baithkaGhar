"use client"

import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  Bed,
  Home,
  TrendingUp,
  Users,
  Star,
  Zap,
  Edit,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StayRuleCard } from "./StayRuleCard";
import { BookingWindowRuleCard } from "./BookingWindowRuleCard";

interface DynamicStayRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minStay: number;
  maxStay?: number;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface BookingWindowRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minAdvanceBooking: number;
  maxAdvanceBooking?: number;
  lastMinuteBooking: boolean;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface DynamicStayRulesConfig {
  enabled: boolean;
  minimumStayRules: DynamicStayRule[];
  bookingWindowRules: BookingWindowRule[];
  defaultRules: {
    minStay: number;
    maxStay?: number;
    minAdvanceBooking: number;
    maxAdvanceBooking?: number;
    lastMinuteBooking: boolean;
  };
}

interface DynamicStayRulesProps {
  propertyId: string;
  onSave?: () => void;
}

export function DynamicStayRules({ propertyId, onSave }: DynamicStayRulesProps) {
  const { toast } = useToast();

  // State management
  const [config, setConfig] = useState<DynamicStayRulesConfig>({
    enabled: false,
    minimumStayRules: [],
    bookingWindowRules: [],
    defaultRules: {
      minStay: 1,
      minAdvanceBooking: 0,
      lastMinuteBooking: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [propertyTitle, setPropertyTitle] = useState('');
  
  // UI state
  const [openAccordion, setOpenAccordion] = useState<string>('');
  const [editingStayRule, setEditingStayRule] = useState<DynamicStayRule | null>(null);
  const [editingWindowRule, setEditingWindowRule] = useState<BookingWindowRule | null>(null);
  const [isAddingStayRule, setIsAddingStayRule] = useState(false);
  const [isAddingWindowRule, setIsAddingWindowRule] = useState(false);

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/properties/${propertyId}/dynamic-stay-rules`);
        const data = await response.json();

        if (response.ok && data.success) {
          setConfig(data.dynamicStayRules);
          setPropertyTitle(data.propertyTitle);
        } else {
          throw new Error(data.error || 'Failed to fetch dynamic stay rules');
        }
      } catch (error) {
        console.error('Error fetching dynamic stay rules:', error);
        toast({
          title: "Error",
          description: "Failed to load dynamic stay rules",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchConfig();
    }
  }, [propertyId, toast]);

  // Save configuration
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/properties/${propertyId}/dynamic-stay-rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Dynamic stay rules updated successfully",
        });
        onSave?.();
      } else {
        throw new Error(data.error || 'Failed to update dynamic stay rules');
      }
    } catch (error) {
      console.error('Error saving dynamic stay rules:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save dynamic stay rules",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate default rule template
  const createDefaultStayRule = (): DynamicStayRule => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return {
      id: `rule-${Date.now()}`,
      name: 'New Minimum Stay Rule',
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(nextWeek, 'yyyy-MM-dd'),
      minStay: 2,
      triggerType: 'season',
      priority: 1,
      isActive: true,
      description: ''
    };
  };

  const createDefaultWindowRule = (): BookingWindowRule => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return {
      id: `rule-${Date.now()}`,
      name: 'New Booking Window Rule',
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(nextWeek, 'yyyy-MM-dd'),
      minAdvanceBooking: 1,
      lastMinuteBooking: false,
      triggerType: 'season',
      priority: 1,
      isActive: true,
      description: ''
    };
  };

  // Add new rule
  const addStayRule = () => {
    const newRule = createDefaultStayRule();
    setConfig(prev => ({
      ...prev,
      minimumStayRules: [...prev.minimumStayRules, newRule]
    }));
    setEditingStayRule(newRule);
    setIsAddingStayRule(true);
    setOpenAccordion('minimum-stay');
  };

  const addWindowRule = () => {
    const newRule = createDefaultWindowRule();
    setConfig(prev => ({
      ...prev,
      bookingWindowRules: [...prev.bookingWindowRules, newRule]
    }));
    setEditingWindowRule(newRule);
    setIsAddingWindowRule(true);
    setOpenAccordion('booking-window');
  };

  // Update rule
  const updateStayRule = (ruleId: string, updates: Partial<DynamicStayRule>) => {
    setConfig(prev => ({
      ...prev,
      minimumStayRules: prev.minimumStayRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  const updateWindowRule = (ruleId: string, updates: Partial<BookingWindowRule>) => {
    setConfig(prev => ({
      ...prev,
      bookingWindowRules: prev.bookingWindowRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  // Delete rule
  const deleteStayRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      minimumStayRules: prev.minimumStayRules.filter(rule => rule.id !== ruleId)
    }));
    if (editingStayRule?.id === ruleId) {
      setEditingStayRule(null);
    }
  };

  const deleteWindowRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      bookingWindowRules: prev.bookingWindowRules.filter(rule => rule.id !== ruleId)
    }));
    if (editingWindowRule?.id === ruleId) {
      setEditingWindowRule(null);
    }
  };

  // Duplicate rule
  const duplicateStayRule = (rule: DynamicStayRule) => {
    const newRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: rule.priority + 1
    };
    setConfig(prev => ({
      ...prev,
      minimumStayRules: [...prev.minimumStayRules, newRule]
    }));
  };

  const duplicateWindowRule = (rule: BookingWindowRule) => {
    const newRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: rule.priority + 1
    };
    setConfig(prev => ({
      ...prev,
      bookingWindowRules: [...prev.bookingWindowRules, newRule]
    }));
  };

  // Get trigger type badge color
  const getTriggerTypeBadge = (triggerType: string) => {
    const colors = {
      season: 'bg-blue-100 text-blue-800',
      demand: 'bg-green-100 text-green-800',
      occupancy: 'bg-yellow-100 text-yellow-800',
      event: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[triggerType as keyof typeof colors] || colors.custom;
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600';
    if (priority >= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Dynamic Stay & Booking Rules
          </h3>
          <p className="text-sm text-muted-foreground">
            Set flexible minimum stay and booking window rules based on season, demand, and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
          <Button onClick={handleSave} disabled={saving} className="ml-2">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Rules
              </>
            )}
          </Button>
        </div>
      </div>

      {!config.enabled && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Dynamic stay rules are disabled. Enable them to start creating custom rules.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Default Rules
          </CardTitle>
          <CardDescription>
            These rules apply when no specific dynamic rules match the booking dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Default Minimum Stay (nights)</Label>
              <Slider
                value={[config.defaultRules.minStay]}
                onValueChange={([value]) => setConfig(prev => ({
                  ...prev,
                  defaultRules: { ...prev.defaultRules, minStay: value }
                }))}
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-center">
                {config.defaultRules.minStay} night{config.defaultRules.minStay !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Advance Booking (days)</Label>
              <Slider
                value={[config.defaultRules.minAdvanceBooking]}
                onValueChange={([value]) => setConfig(prev => ({
                  ...prev,
                  defaultRules: { ...prev.defaultRules, minAdvanceBooking: value }
                }))}
                max={365}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-center">
                {config.defaultRules.minAdvanceBooking} day{config.defaultRules.minAdvanceBooking !== 1 ? 's' : ''} ahead
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allow Last-Minute Bookings</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={config.defaultRules.lastMinuteBooking}
                  onCheckedChange={(checked) => setConfig(prev => ({
                    ...prev,
                    defaultRules: { ...prev.defaultRules, lastMinuteBooking: checked }
                  }))}
                />
                <span className="text-sm text-muted-foreground">
                  {config.defaultRules.lastMinuteBooking ? 'Same-day bookings allowed' : 'Same-day bookings blocked'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Rules Accordion */}
      <Accordion 
        type="single" 
        value={openAccordion} 
        onValueChange={setOpenAccordion}
        className="space-y-2"
      >
        {/* Minimum Stay Rules */}
        <AccordionItem value="minimum-stay" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <Bed className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <h4 className="font-medium">Minimum Stay Rules</h4>
                  <p className="text-sm text-muted-foreground">
                    Set custom minimum/maximum stay requirements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {config.minimumStayRules.filter(r => r.isActive).length} active
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    addStayRule();
                  }}
                  disabled={!config.enabled}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {config.minimumStayRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No minimum stay rules configured</p>
                  <Button
                    variant="outline"
                    onClick={addStayRule}
                    className="mt-2"
                    disabled={!config.enabled}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.minimumStayRules.map((rule) => (
                    <StayRuleCard
                      key={rule.id}
                      rule={rule}
                      isEditing={editingStayRule?.id === rule.id}
                      onEdit={() => setEditingStayRule(rule)}
                      onSave={(updates: Partial<DynamicStayRule>) => {
                        updateStayRule(rule.id, updates);
                        setEditingStayRule(null);
                      }}
                      onCancel={() => setEditingStayRule(null)}
                      onDelete={() => deleteStayRule(rule.id)}
                      onDuplicate={() => duplicateStayRule(rule)}
                      onToggle={(isActive: boolean) => updateStayRule(rule.id, { isActive })}
                      getTriggerTypeBadge={getTriggerTypeBadge}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Booking Window Rules */}
        <AccordionItem value="booking-window" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <h4 className="font-medium">Booking Window Rules</h4>
                  <p className="text-sm text-muted-foreground">
                    Control advance booking requirements and restrictions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {config.bookingWindowRules.filter(r => r.isActive).length} active
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    addWindowRule();
                  }}
                  disabled={!config.enabled}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {config.bookingWindowRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No booking window rules configured</p>
                  <Button
                    variant="outline"
                    onClick={addWindowRule}
                    className="mt-2"
                    disabled={!config.enabled}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.bookingWindowRules.map((rule) => (
                    <BookingWindowRuleCard
                      key={rule.id}
                      rule={rule}
                      isEditing={editingWindowRule?.id === rule.id}
                      onEdit={() => setEditingWindowRule(rule)}
                      onSave={(updates: Partial<BookingWindowRule>) => {
                        updateWindowRule(rule.id, updates);
                        setEditingWindowRule(null);
                      }}
                      onCancel={() => setEditingWindowRule(null)}
                      onDelete={() => deleteWindowRule(rule.id)}
                      onDuplicate={() => duplicateWindowRule(rule)}
                      onToggle={(isActive: boolean) => updateWindowRule(rule.id, { isActive })}
                      getTriggerTypeBadge={getTriggerTypeBadge}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Info */}
      {config.enabled && (config.minimumStayRules.length > 0 || config.bookingWindowRules.length > 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Rules Priority System:</p>
                <p>When multiple rules overlap, the rule with the highest priority number takes precedence. Rules are processed in order: Season → Event → Demand → Occupancy → Custom.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 