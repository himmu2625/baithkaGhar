"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Tag, X, Check, Percent, DollarSign } from "lucide-react";

interface CouponInputProps {
  bookingAmount: number;
  propertyId: string;
  onCouponApplied: (discount: {
    code: string;
    amount: number;
    originalAmount: number;
    finalAmount: number;
    savings: number;
    couponName?: string;
    couponDescription?: string;
  }) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
  className?: string;
}

interface AppliedCoupon {
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount";
  value: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  savings: number;
}

export function CouponInput({
  bookingAmount,
  propertyId,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  className,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          bookingAmount: bookingAmount,
          propertyId: propertyId,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        const appliedCouponData: AppliedCoupon = {
          code: data.coupon.code,
          name: data.coupon.name,
          description: data.coupon.description,
          type: data.coupon.type,
          value: data.coupon.value,
          discountAmount: data.discount.amount,
          originalAmount: data.discount.originalAmount,
          finalAmount: data.discount.finalAmount,
          savings: data.discount.savings,
        };

        setAppliedCoupon(appliedCouponData);
        
        onCouponApplied({
          code: data.coupon.code,
          amount: data.discount.amount,
          originalAmount: data.discount.originalAmount,
          finalAmount: data.discount.finalAmount,
          savings: data.discount.savings,
          couponName: data.coupon.name,
          couponDescription: data.coupon.description,
        });

        toast({
          title: "Coupon Applied!",
          description: `You saved ₹${data.discount.savings.toFixed(2)} with "${data.coupon.name}"`,
        });

        setCouponCode("");
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.error || "This coupon is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    onCouponRemoved();
    toast({
      title: "Coupon Removed",
      description: "Coupon discount has been removed from your booking",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateCoupon();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={className}>
      {!appliedCoupon ? (
        <Card className="border-dashed border-2 border-lightGreen/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-lightGreen" />
              <span className="font-medium text-sm">Have a coupon code?</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={disabled || isValidating}
                className="flex-1"
              />
              <Button
                onClick={validateCoupon}
                disabled={disabled || isValidating || !couponCode.trim()}
                className="bg-lightGreen hover:bg-lightGreen/90 text-darkGreen"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green-800">
                      {appliedCoupon.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {appliedCoupon.code}
                    </Badge>
                  </div>
                  {appliedCoupon.description && (
                    <p className="text-sm text-green-700 mb-2">
                      {appliedCoupon.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      {appliedCoupon.type === "percentage" ? (
                        <Percent className="h-3 w-3" />
                      ) : (
                        <DollarSign className="h-3 w-3" />
                      )}
                      <span>
                        {appliedCoupon.type === "percentage" 
                          ? `${appliedCoupon.value}% off`
                          : `₹${appliedCoupon.value} off`
                        }
                      </span>
                    </div>
                    <div className="font-semibold text-green-800">
                      You save {formatCurrency(appliedCoupon.savings)}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeCoupon}
                disabled={disabled}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 