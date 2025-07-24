"use client"

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Calendar as CalendarIcon,
  Edit,
  Save,
  X,
  Trash2,
  Copy,
  Clock,
  TrendingUp,
  Users,
  Star,
  Zap,
  AlertTriangle,
} from "lucide-react";

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

interface BookingWindowRuleCardProps {
  rule: BookingWindowRule;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<BookingWindowRule>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggle: (isActive: boolean) => void;
  getTriggerTypeBadge: (triggerType: string) => string;
  getPriorityColor: (priority: number) => string;
}

export function BookingWindowRuleCard({
  rule,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onToggle,
  getTriggerTypeBadge,
  getPriorityColor
}: BookingWindowRuleCardProps) {
  const [editData, setEditData] = useState<BookingWindowRule>(rule);

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData(rule);
    onCancel();
  };

  if (isEditing) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Rule Name and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={editData.triggerType}
                  onValueChange={(value: any) => setEditData(prev => ({ 
                    ...prev, 
                    triggerType: value,
                    triggerCondition: {} // Reset condition when type changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="season">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Season-based
                      </div>
                    </SelectItem>
                    <SelectItem value="demand">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Demand-based
                      </div>
                    </SelectItem>
                    <SelectItem value="occupancy">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Occupancy-based
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Event-based
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Custom
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.startDate ? format(new Date(editData.startDate), 'PPP') : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editData.startDate ? new Date(editData.startDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditData(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.endDate ? format(new Date(editData.endDate), 'PPP') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editData.endDate ? new Date(editData.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditData(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                        }
                      }}
                      disabled={(date) => editData.startDate ? date < new Date(editData.startDate) : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Booking Window Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Advance Booking (days)</Label>
                <Slider
                  value={[editData.minAdvanceBooking]}
                  onValueChange={([value]) => setEditData(prev => ({ ...prev, minAdvanceBooking: value }))}
                  max={365}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  {editData.minAdvanceBooking === 0 ? 'Same-day allowed' : `${editData.minAdvanceBooking} day${editData.minAdvanceBooking !== 1 ? 's' : ''} ahead`}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Maximum Advance Booking (optional)</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editData.maxAdvanceBooking !== undefined}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEditData(prev => ({ ...prev, maxAdvanceBooking: Math.max(prev.minAdvanceBooking + 30, 90) }));
                      } else {
                        setEditData(prev => ({ ...prev, maxAdvanceBooking: undefined }));
                      }
                    }}
                  />
                  {editData.maxAdvanceBooking !== undefined && (
                    <div className="flex-1">
                      <Slider
                        value={[editData.maxAdvanceBooking]}
                        onValueChange={([value]) => setEditData(prev => ({ ...prev, maxAdvanceBooking: value }))}
                        max={365}
                        min={editData.minAdvanceBooking + 1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center mt-1">
                        {editData.maxAdvanceBooking} days ahead max
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Last Minute Booking */}
            <div className="space-y-2">
              <Label>Last-Minute Booking Policy</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editData.lastMinuteBooking}
                  onCheckedChange={(checked) => setEditData(prev => ({ ...prev, lastMinuteBooking: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {editData.lastMinuteBooking ? 'Allow same-day bookings' : 'Block same-day bookings'}
                </span>
              </div>
              {editData.lastMinuteBooking && editData.minAdvanceBooking > 0 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs text-yellow-700">
                    Note: Last-minute bookings enabled but minimum advance booking is {editData.minAdvanceBooking} days
                  </span>
                </div>
              )}
            </div>

            {/* Trigger Condition */}
            {editData.triggerType === 'occupancy' && (
              <div className="space-y-2">
                <Label>Occupancy Threshold (%)</Label>
                <Slider
                  value={[editData.triggerCondition?.occupancyThreshold || 80]}
                  onValueChange={([value]) => setEditData(prev => ({
                    ...prev,
                    triggerCondition: { ...prev.triggerCondition, occupancyThreshold: value }
                  }))}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  Apply when occupancy is above {editData.triggerCondition?.occupancyThreshold || 80}%
                </div>
              </div>
            )}

            {editData.triggerType === 'demand' && (
              <div className="space-y-2">
                <Label>Demand Level</Label>
                <Select
                  value={editData.triggerCondition?.demandLevel || 'medium'}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setEditData(prev => ({
                    ...prev,
                    triggerCondition: { ...prev.triggerCondition, demandLevel: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Demand</SelectItem>
                    <SelectItem value="medium">Medium Demand</SelectItem>
                    <SelectItem value="high">High Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {editData.triggerType === 'event' && (
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Input
                  value={editData.triggerCondition?.eventType || ''}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    triggerCondition: { ...prev.triggerCondition, eventType: e.target.value }
                  }))}
                  placeholder="e.g., Festival, Conference, Holiday"
                />
              </div>
            )}

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Slider
                  value={[editData.priority]}
                  onValueChange={([value]) => setEditData(prev => ({ ...prev, priority: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  Priority {editData.priority} (higher = more important)
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rule Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={editData.isActive}
                    onCheckedChange={(checked) => setEditData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add notes about this booking window rule..."
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all ${rule.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h5 className="font-medium">{rule.name}</h5>
              <Badge className={getTriggerTypeBadge(rule.triggerType)}>
                {rule.triggerType}
              </Badge>
              {!rule.isActive && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  Inactive
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date Range</p>
                <p className="font-medium">
                  {format(new Date(rule.startDate), 'MMM dd, yyyy')} - {format(new Date(rule.endDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Advance Booking</p>
                <p className="font-medium">
                  {rule.minAdvanceBooking === 0 ? 'Same-day OK' : `${rule.minAdvanceBooking}+ days`}
                  {rule.maxAdvanceBooking && ` • Max: ${rule.maxAdvanceBooking} days`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last-Minute</p>
                <p className={`font-medium ${rule.lastMinuteBooking ? 'text-green-600' : 'text-red-600'}`}>
                  {rule.lastMinuteBooking ? 'Allowed' : 'Blocked'}
                </p>
              </div>
            </div>

            {rule.description && (
              <p className="text-sm text-muted-foreground mt-2">{rule.description}</p>
            )}

            {/* Trigger Condition Details */}
            {rule.triggerCondition && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {rule.triggerType === 'occupancy' && `Applies when occupancy > ${rule.triggerCondition.occupancyThreshold}%`}
                  {rule.triggerType === 'demand' && `Applies during ${rule.triggerCondition.demandLevel} demand periods`}
                  {rule.triggerType === 'event' && `Applies during: ${rule.triggerCondition.eventType}`}
                </p>
              </div>
            )}

            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Priority: <span className={getPriorityColor(rule.priority)}>Level {rule.priority}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Switch
              checked={rule.isActive}
              onCheckedChange={onToggle}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 