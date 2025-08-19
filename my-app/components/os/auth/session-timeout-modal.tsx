'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({ 
  isOpen, 
  timeLeft, 
  onExtend, 
  onLogout 
}: SessionTimeoutModalProps) {
  const [isExtending, setIsExtending] = useState(false);

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await onExtend();
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Session Timeout Warning
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your session will expire soon for security reasons
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your session will expire in <strong>{formatTime(timeLeft)}</strong>. 
              Please extend your session or save your work.
            </AlertDescription>
          </Alert>

          {/* Time Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-gray-500">
              Time remaining before automatic logout
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleExtend}
              disabled={isExtending}
              className="w-full h-12 text-base font-medium"
            >
              {isExtending ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extending Session...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Extend Session (30 minutes)</span>
                </div>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full h-12 text-base font-medium"
            >
              <div className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Sign Out Now</span>
              </div>
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Security Feature</p>
                <p className="text-blue-700">
                  Automatic session timeout helps protect your account and sensitive data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 