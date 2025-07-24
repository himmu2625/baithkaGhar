"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Bell,
  BellRing,
  Mail,
  Smartphone,
  TrendingDown,
  Calendar,
  Target,
  Zap,
  Settings,
  Check,
  X,
  AlertTriangle,
  Info,
  Star,
  Clock
} from "lucide-react";

interface PriceAlert {
  id: string;
  propertyId: string;
  propertyName: string;
  targetPrice: number;
  currentPrice: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  alertType: 'price_drop' | 'specific_price' | 'percentage_drop';
  alertValue: number; // percentage or specific price
  isActive: boolean;
  notificationMethods: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  expiryDate: Date;
  createdAt: Date;
}

interface PriceAlertButtonProps {
  propertyId: string;
  propertyName: string;
  currentPrice: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  className?: string;
}

export default function PriceAlertButton({
  propertyId,
  propertyName,
  currentPrice,
  checkIn,
  checkOut,
  guests,
  rooms,
  className = ""
}: PriceAlertButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'preferences' | 'confirmation'>('setup');

  // Alert configuration state
  const [alertType, setAlertType] = useState<'price_drop' | 'specific_price' | 'percentage_drop'>('percentage_drop');
  const [alertValue, setAlertValue] = useState<number>(10);
  const [targetPrice, setTargetPrice] = useState<number>(Math.round(currentPrice * 0.9));
  const [notificationMethods, setNotificationMethods] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
  const [expiryDays, setExpiryDays] = useState<number>(30);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchExistingAlerts();
    }
  }, [isOpen, session, propertyId]);

  useEffect(() => {
    if (alertType === 'percentage_drop') {
      setTargetPrice(Math.round(currentPrice * (1 - alertValue / 100)));
    }
  }, [alertType, alertValue, currentPrice]);

  const fetchExistingAlerts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAlerts: PriceAlert[] = [
        {
          id: '1',
          propertyId,
          propertyName,
          targetPrice: Math.round(currentPrice * 0.85),
          currentPrice,
          checkIn,
          checkOut,
          guests,
          rooms,
          alertType: 'percentage_drop',
          alertValue: 15,
          isActive: true,
          notificationMethods: { email: true, sms: false, push: true },
          frequency: 'immediate',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];

      setExistingAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching existing alerts:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please log in to set up price alerts",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const alertData = {
        propertyId,
        propertyName,
        targetPrice,
        currentPrice,
        checkIn,
        checkOut,
        guests,
        rooms,
        alertType,
        alertValue,
        notificationMethods,
        frequency,
        expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      };

      // Mock API call - replace with actual implementation
      console.log('Creating price alert:', alertData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Price Alert Created!",
        description: `You'll be notified when the price ${
          alertType === 'percentage_drop' ? `drops by ${alertValue}%` :
          alertType === 'specific_price' ? `reaches ₹${targetPrice.toLocaleString()}` :
          'drops'
        }`,
      });

      setStep('confirmation');
      await fetchExistingAlerts();

    } catch (error) {
      console.error('Error creating price alert:', error);
      toast({
        title: "Error",
        description: "Failed to create price alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      // Mock API call
      console.log('Deleting alert:', alertId);
      
      setExistingAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert Deleted",
        description: "Price alert has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const getAlertDescription = () => {
    switch (alertType) {
      case 'percentage_drop':
        return `Alert when price drops by ${alertValue}% (to ₹${targetPrice.toLocaleString()})`;
      case 'specific_price':
        return `Alert when price reaches ₹${targetPrice.toLocaleString()}`;
      case 'price_drop':
        return 'Alert on any price drop';
      default:
        return '';
    }
  };

  const getPotentialSavings = () => {
    return currentPrice - targetPrice;
  };

  // Don't show if user is not logged in
  if (!session?.user) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className={className} disabled>
            <Bell className="h-4 w-4 mr-2" />
            Price Alert
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Login to set up price alerts</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={existingAlerts.length > 0 ? "default" : "outline"} 
            className={`${className} ${existingAlerts.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            {existingAlerts.length > 0 ? (
              <BellRing className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {existingAlerts.length > 0 ? `${existingAlerts.length} Alert${existingAlerts.length > 1 ? 's' : ''}` : 'Set Price Alert'}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Price Alerts for {propertyName}
            </DialogTitle>
            <DialogDescription>
              Get notified when prices drop for your selected dates: {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')}
            </DialogDescription>
          </DialogHeader>

          {/* Existing Alerts */}
          {existingAlerts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Your Active Alerts</h4>
              {existingAlerts.map((alert) => (
                <div key={alert.id} className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-600 text-white">Active</Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {format(alert.createdAt, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="font-medium">
                        {alert.alertType === 'percentage_drop' && `${alert.alertValue}% price drop`}
                        {alert.alertType === 'specific_price' && `Price reaches ₹${alert.targetPrice.toLocaleString()}`}
                        {alert.alertType === 'price_drop' && 'Any price drop'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Target: ₹{alert.targetPrice.toLocaleString()} (currently ₹{alert.currentPrice.toLocaleString()})
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Frequency: {alert.frequency}</span>
                        <span>Expires: {format(alert.expiryDate, 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-1">
                          {alert.notificationMethods.email && <Mail className="h-3 w-3" />}
                          {alert.notificationMethods.sms && <Smartphone className="h-3 w-3" />}
                          {alert.notificationMethods.push && <Bell className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Current Price</span>
                </div>
                <p className="text-2xl font-bold text-green-900">₹{currentPrice.toLocaleString()}</p>
                <p className="text-sm text-green-700">per night for your dates</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Alert Type</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        alertType === 'percentage_drop' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAlertType('percentage_drop')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Percentage Drop</h4>
                          <p className="text-sm text-muted-foreground">Alert when price drops by a specific percentage</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {alertType === 'percentage_drop' && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      </div>
                      {alertType === 'percentage_drop' && (
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            type="number"
                            value={alertValue}
                            onChange={(e) => setAlertValue(Number(e.target.value))}
                            className="w-20"
                            min="1"
                            max="50"
                          />
                          <span>% drop (to ₹{targetPrice.toLocaleString()})</span>
                        </div>
                      )}
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        alertType === 'specific_price' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAlertType('specific_price')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Target Price</h4>
                          <p className="text-sm text-muted-foreground">Alert when price reaches a specific amount</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {alertType === 'specific_price' && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      </div>
                      {alertType === 'specific_price' && (
                        <div className="mt-3 flex items-center gap-2">
                          <span>₹</span>
                          <Input
                            type="number"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(Number(e.target.value))}
                            className="w-32"
                            min="1000"
                            max={currentPrice}
                          />
                          <span>or lower</span>
                        </div>
                      )}
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        alertType === 'price_drop' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAlertType('price_drop')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Any Price Drop</h4>
                          <p className="text-sm text-muted-foreground">Alert on any price reduction</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {alertType === 'price_drop' && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {getPotentialSavings() > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Potential Savings</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      ₹{getPotentialSavings().toLocaleString()} per night
                    </p>
                    <p className="text-sm text-green-700">
                      ₹{(getPotentialSavings() * ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()} total for your stay
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep('preferences')}>
                  Continue
                  <Settings className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Notification Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">{session.user.email}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationMethods.email}
                      onCheckedChange={(checked) => 
                        setNotificationMethods(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">Requires phone number verification</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationMethods.sms}
                      onCheckedChange={(checked) => 
                        setNotificationMethods(prev => ({ ...prev, sms: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Browser notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationMethods.push}
                      onCheckedChange={(checked) => 
                        setNotificationMethods(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Notification Frequency</Label>
                  <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiry">Alert Expires In</Label>
                  <Select value={expiryDays.toString()} onValueChange={(value) => setExpiryDays(Number(value))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('setup')}>
                  Back
                </Button>
                <Button onClick={handleCreateAlert} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Alert'}
                  <Zap className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800">Price Alert Created!</h3>
                <p className="text-muted-foreground mt-2">
                  {getAlertDescription()}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-left space-y-1">
                  <li className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    We'll monitor prices for your selected dates
                  </li>
                  <li className="flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    You'll receive notifications when your criteria are met
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    Manage your alerts anytime from your profile
                  </li>
                </ul>
              </div>

              <Button onClick={() => setIsOpen(false)} className="w-full">
                Got it!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 