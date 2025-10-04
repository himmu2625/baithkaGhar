"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function DynamicPricingPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  // New rule form state
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'multiplier',
    ruleType: 'weekend',
    condition: {
      dayOfWeek: [] as number[],
      dateRange: { start: null as Date | null, end: null as Date | null },
    },
    adjustment: {
      EP: 1.2,
      CP: 1.2,
      MAP: 1.2,
      AP: 1.2,
    },
    isActive: true,
    priority: 10,
  });

  useEffect(() => {
    fetchRules();
  }, [propertyId]);

  const fetchRules = async () => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/dynamic-pricing`);
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async () => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/dynamic-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      if (data.success) {
        setRules([...rules, data.rule]);
        setShowNewRuleForm(false);
        resetNewRuleForm();
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(
        `/api/admin/properties/${propertyId}/dynamic-pricing?ruleId=${ruleId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setRules(rules.filter(r => r._id !== ruleId));
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/dynamic-pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(rules.map(r => (r._id === ruleId ? { ...r, isActive } : r)));
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const resetNewRuleForm = () => {
    setNewRule({
      name: '',
      type: 'multiplier',
      ruleType: 'weekend',
      condition: {
        dayOfWeek: [],
        dateRange: { start: null, end: null },
      },
      adjustment: {
        EP: 1.2,
        CP: 1.2,
        MAP: 1.2,
        AP: 1.2,
      },
      isActive: true,
      priority: 10,
    });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dynamic Pricing Rules</h1>
          <p className="text-gray-600">Manage weekend, seasonal, and special pricing rules</p>
        </div>
        <Button onClick={() => setShowNewRuleForm(!showNewRuleForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* New Rule Form */}
      {showNewRuleForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Pricing Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Weekend Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Type</Label>
                <Select
                  value={newRule.ruleType}
                  onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="last_minute">Last Minute</SelectItem>
                    <SelectItem value="peak_period">Peak Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Adjustment Type</Label>
                <Select
                  value={newRule.type}
                  onValueChange={(value) => setNewRule({ ...newRule, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiplier">Multiplier</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>EP Adjustment</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newRule.adjustment.EP}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      adjustment: { ...newRule.adjustment, EP: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label>CP Adjustment</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newRule.adjustment.CP}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      adjustment: { ...newRule.adjustment, CP: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label>MAP Adjustment</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newRule.adjustment.MAP}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      adjustment: { ...newRule.adjustment, MAP: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label>AP Adjustment</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newRule.adjustment.AP}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      adjustment: { ...newRule.adjustment, AP: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={createRule}>Create Rule</Button>
              <Button variant="outline" onClick={() => setShowNewRuleForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Rules */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No pricing rules configured. Click "Add Rule" to create one.
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {rule.ruleType} · {rule.type} · Priority: {rule.priority}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => toggleRule(rule._id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">EP:</span> {rule.adjustment.EP}
                  </div>
                  <div>
                    <span className="font-medium">CP:</span> {rule.adjustment.CP}
                  </div>
                  <div>
                    <span className="font-medium">MAP:</span> {rule.adjustment.MAP}
                  </div>
                  <div>
                    <span className="font-medium">AP:</span> {rule.adjustment.AP}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
