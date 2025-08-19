'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TwoFactorAuthProps {
  onSuccess: () => void;
  onBack: () => void;
  propertyId: string;
  username: string;
}

type AuthMethod = 'sms' | 'email' | 'authenticator';

export function TwoFactorAuth({ onSuccess, onBack, propertyId, username }: TwoFactorAuthProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('sms');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit code
      if (code.length === 6) {
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimeLeft(30);
      setCanResend(false);
      setCode('');
      setError('');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method: AuthMethod) => {
    switch (method) {
      case 'sms':
        return <Smartphone className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'authenticator':
        return <Key className="w-5 h-5" />;
    }
  };

  const getMethodDescription = (method: AuthMethod) => {
    switch (method) {
      case 'sms':
        return 'We\'ll send a 6-digit code to your registered phone number';
      case 'email':
        return 'We\'ll send a 6-digit code to your registered email address';
      case 'authenticator':
        return 'Enter the 6-digit code from your authenticator app';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600">
            Verify your identity to continue
          </p>
        </div>

        {/* 2FA Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Security Verification
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose your verification method
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Verification Method
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(['sms', 'email', 'authenticator'] as AuthMethod[]).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={authMethod === method ? 'default' : 'outline'}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                    onClick={() => setAuthMethod(method)}
                  >
                    {getMethodIcon(method)}
                    <span className="text-xs capitalize">{method}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Method Description */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {getMethodDescription(authMethod)}
              </p>
            </div>

            {/* Code Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                    if (error) setError('');
                  }}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Code</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Resend Code */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              {canResend ? (
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {timeLeft} seconds
                </p>
              )}
            </div>

            {/* Back Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Enhanced Security</p>
              <p className="text-blue-700">
                Two-factor authentication adds an extra layer of security to protect your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 