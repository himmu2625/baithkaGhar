"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  Briefcase, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Star,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface RegistrationFormData {
  agencyName: string;
  licenseNumber: string;
  panNumber: string;
  gstNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  website: string;
  socialHandles: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  yearsInBusiness: number;
  teamSize: number;
  annualTurnover: number;
  specialties: string[];
  targetMarkets: string[];
  commissionExpectations: {
    preferredType: 'percentage' | 'fixed' | 'tiered';
    expectedRate: number;
    minimumBookingValue: number;
  };
  documents: {
    license?: File;
    gstCertificate?: File;
    panCard?: File;
    addressProof?: File;
    businessRegistration?: File;
    bankStatement?: File;
  };
}

interface LoginFormData {
  email: string;
  password: string;
}

const SPECIALTIES = [
  'Domestic Travel',
  'International Travel',
  'Luxury Travel',
  'Budget Travel',
  'Corporate Travel',
  'Leisure Travel',
  'Adventure Travel',
  'Cultural Tours',
  'Honeymoon Packages',
  'Group Tours',
  'Business Travel',
  'Educational Tours'
];

const TARGET_MARKETS = [
  'North India',
  'South India',
  'East India',
  'West India',
  'Central India',
  'International',
  'Luxury Market',
  'Budget Market',
  'Corporate Market',
  'Leisure Market'
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Competitive Commissions",
    description: "Earn up to 30% commission on every booking with our tiered structure",
    color: "text-green-600"
  },
  {
    icon: Globe,
    title: "Exclusive Access",
    description: "Access to thousands of unique properties across India and international destinations",
    color: "text-blue-600"
  },
  {
    icon: Shield,
    title: "Professional Support",
    description: "24/7 dedicated support for you and your clients with account managers",
    color: "text-purple-600"
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Real-time availability and instant confirmation for your clients",
    color: "text-orange-600"
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Detailed dashboard with booking analytics and commission tracking",
    color: "text-indigo-600"
  },
  {
    icon: Award,
    title: "Recognition Program",
    description: "Tier-based benefits with Silver, Gold, and Platinum agent levels",
    color: "text-pink-600"
  }
];

const TESTIMONIALS = [
  {
    name: "Rajesh Kumar",
    agency: "Kumar Travels",
    location: "Mumbai",
    rating: 5,
    text: "Baithaka Ghar has transformed our business. The commission structure is excellent and the support team is always helpful.",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    name: "Priya Sharma",
    agency: "Sharma Tours & Travels",
    location: "Delhi",
    rating: 5,
    text: "Our clients love the unique properties available. The booking process is seamless and commissions are paid on time.",
    image: "https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    name: "Amit Patel",
    agency: "Patel Travel Solutions",
    location: "Bangalore",
    rating: 5,
    text: "The analytics dashboard helps us track performance and optimize our offerings. Highly recommended partnership!",
    image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400"
  }
];

export default function TravelAgentPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [registrationData, setRegistrationData] = useState<RegistrationFormData>({
    agencyName: '',
    licenseNumber: '',
    panNumber: '',
    gstNumber: '',
    contactPersonName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    website: '',
    socialHandles: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    yearsInBusiness: 0,
    teamSize: 0,
    annualTurnover: 0,
    specialties: [],
    targetMarkets: [],
    commissionExpectations: {
      preferredType: 'percentage',
      expectedRate: 0,
      minimumBookingValue: 0
    },
    documents: {}
  });

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const steps = [
    { id: 1, title: 'Agency Information', icon: Building },
    { id: 2, title: 'Contact Details', icon: Users },
    { id: 3, title: 'Business Profile', icon: Briefcase },
    { id: 4, title: 'Commission & Documents', icon: DollarSign }
  ];

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (registrationData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add all form data
      Object.entries(registrationData).forEach(([key, value]) => {
        if (key === 'documents') {
          Object.entries(value).forEach(([docKey, docValue]) => {
            if (docValue instanceof File) {
              formData.append(`documents.${docKey}`, docValue);
            }
          });
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue instanceof File) {
              formData.append(`${key}.${subKey}`, subValue);
            } else if (subValue !== undefined && subValue !== null) {
              formData.append(`${key}.${subKey}`, String(subValue));
            }
          });
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            formData.append(key, String(item));
          });
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch('/api/travel-agents/register', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Application Submitted",
          description: "Your travel agent application has been submitted successfully. We'll review it and get back to you soon."
        });
        // Reset form
        setRegistrationData({
          agencyName: '',
          licenseNumber: '',
          panNumber: '',
          gstNumber: '',
          contactPersonName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          website: '',
          socialHandles: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          yearsInBusiness: 0,
          teamSize: 0,
          annualTurnover: 0,
          specialties: [],
          targetMarkets: [],
          commissionExpectations: {
            preferredType: 'percentage',
            expectedRate: 0,
            minimumBookingValue: 0
          },
          documents: {}
        });
        setCurrentStep(1);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to submit application",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/travel-agents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to your dashboard..."
        });
        // Redirect to dashboard
        window.location.href = '/travel-agent/dashboard';
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setRegistrationData(prev => ({
        ...prev,
        [parent]: typeof prev[parent as keyof RegistrationFormData] === 'object' && prev[parent as keyof RegistrationFormData] !== null
          ? {
              ...prev[parent as keyof RegistrationFormData] as object,
              [child]: value
            }
          : { [child]: value }
      }));
    } else {
      setRegistrationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setRegistrationData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleTargetMarketToggle = (market: string) => {
    setRegistrationData(prev => ({
      ...prev,
      targetMarkets: prev.targetMarkets.includes(market)
        ? prev.targetMarkets.filter(m => m !== market)
        : [...prev.targetMarkets, market]
    }));
  };

  const handleFileUpload = (field: string, file: File) => {
    setRegistrationData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(registrationData.agencyName && registrationData.licenseNumber && registrationData.panNumber);
      case 2:
        return !!(registrationData.contactPersonName && registrationData.email && registrationData.phone && registrationData.password);
      case 3:
        return !!(registrationData.address && registrationData.city && registrationData.state && registrationData.pincode);
      case 4:
        return !!(registrationData.commissionExpectations.preferredType && registrationData.commissionExpectations.expectedRate > 0);
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="agencyName">Agency Name *</Label>
          <Input
            id="agencyName"
            value={registrationData.agencyName}
            onChange={(e) => handleInputChange('agencyName', e.target.value)}
            placeholder="Enter your agency name"
          />
        </div>
        <div>
          <Label htmlFor="licenseNumber">License Number *</Label>
          <Input
            id="licenseNumber"
            value={registrationData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            placeholder="Travel agency license number"
          />
        </div>
        <div>
          <Label htmlFor="panNumber">PAN Number *</Label>
          <Input
            id="panNumber"
            value={registrationData.panNumber}
            onChange={(e) => handleInputChange('panNumber', e.target.value)}
            placeholder="PAN card number"
          />
        </div>
        <div>
          <Label htmlFor="gstNumber">GST Number</Label>
          <Input
            id="gstNumber"
            value={registrationData.gstNumber}
            onChange={(e) => handleInputChange('gstNumber', e.target.value)}
            placeholder="GST registration number (optional)"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPersonName">Contact Person Name *</Label>
          <Input
            id="contactPersonName"
            value={registrationData.contactPersonName}
            onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
            placeholder="Primary contact person"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={registrationData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Business email address"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={registrationData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Business phone number"
          />
        </div>
        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={registrationData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={registrationData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            value={registrationData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>
        <div>
          <Label htmlFor="socialHandles">Social Media Handles (Optional)</Label>
          <Input
            id="socialHandles"
            value={registrationData.socialHandles}
            onChange={(e) => handleInputChange('socialHandles', e.target.value)}
            placeholder="Instagram, Facebook, etc."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="address">Business Address *</Label>
          <Textarea
            id="address"
            value={registrationData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Complete business address"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={registrationData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={registrationData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="State"
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            value={registrationData.pincode}
            onChange={(e) => handleInputChange('pincode', e.target.value)}
            placeholder="Pincode"
          />
        </div>
        <div>
          <Label htmlFor="yearsInBusiness">Years in Business</Label>
          <Input
            id="yearsInBusiness"
            type="number"
            value={registrationData.yearsInBusiness || ''}
            onChange={(e) => handleInputChange('yearsInBusiness', parseInt(e.target.value) || 0)}
            placeholder="Number of years"
          />
        </div>
        <div>
          <Label htmlFor="teamSize">Team Size</Label>
          <Input
            id="teamSize"
            type="number"
            value={registrationData.teamSize || ''}
            onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value) || 0)}
            placeholder="Number of employees"
          />
        </div>
        <div>
          <Label htmlFor="annualTurnover">Annual Turnover (₹)</Label>
          <Input
            id="annualTurnover"
            type="number"
            value={registrationData.annualTurnover || ''}
            onChange={(e) => handleInputChange('annualTurnover', parseInt(e.target.value) || 0)}
            placeholder="Annual turnover in INR"
          />
        </div>
      </div>

      <div>
        <Label>Specialties</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {SPECIALTIES.map((specialty) => (
            <div key={specialty} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={specialty}
                checked={registrationData.specialties.includes(specialty)}
                onChange={() => handleSpecialtyToggle(specialty)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Target Markets</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {TARGET_MARKETS.map((market) => (
            <div key={market} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={market}
                checked={registrationData.targetMarkets.includes(market)}
                onChange={() => handleTargetMarketToggle(market)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={market} className="text-sm">{market}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="commissionType">Commission Type *</Label>
          <Select 
            value={registrationData.commissionExpectations.preferredType} 
            onValueChange={(value) => handleInputChange('commissionExpectations.preferredType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select commission type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="tiered">Tiered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expectedRate">
            Expected Rate * ({registrationData.commissionExpectations.preferredType === 'percentage' ? '%' : '₹'})
          </Label>
          <Input
            id="expectedRate"
            type="number"
            value={registrationData.commissionExpectations.expectedRate}
            onChange={(e) => handleInputChange('commissionExpectations.expectedRate', parseFloat(e.target.value) || 0)}
            placeholder={`Enter expected ${registrationData.commissionExpectations.preferredType === 'percentage' ? 'percentage' : 'amount'}`}
          />
        </div>
        <div>
          <Label htmlFor="minimumBookingValue">Minimum Booking Value (₹)</Label>
          <Input
            id="minimumBookingValue"
            type="number"
            value={registrationData.commissionExpectations.minimumBookingValue}
            onChange={(e) => handleInputChange('commissionExpectations.minimumBookingValue', parseInt(e.target.value) || 0)}
            placeholder="Minimum booking value"
          />
        </div>
      </div>

      <div>
        <Label>Documents (Optional)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {[
            { key: 'license', label: 'Travel License' },
            { key: 'gstCertificate', label: 'GST Certificate' },
            { key: 'panCard', label: 'PAN Card' },
            { key: 'addressProof', label: 'Address Proof' },
            { key: 'businessRegistration', label: 'Business Registration' },
            { key: 'bankStatement', label: 'Bank Statement' }
          ].map((doc) => (
            <div key={doc.key} className="space-y-2">
              <Label htmlFor={doc.key}>{doc.label}</Label>
              <Input
                id={doc.key}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(doc.key, file);
                  }
                }}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-lightBg">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-darkGreen via-mediumGreen to-lightGreen">
        <div className="absolute inset-0 bg-darkGreen opacity-80"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-lightYellow">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg"
            >
              Partner with Baithaka Ghar
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-lightGreen"
            >
              Join our network of travel agents and unlock exclusive benefits, competitive commissions, and professional support
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                className="bg-darkGreen text-lightYellow hover:bg-mediumGreen shadow-lg"
                onClick={() => document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Become a Partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="border-lightGreen text-lightYellow hover:bg-lightGreen/10 hover:text-darkGreen">
                    Agent Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-lightBg border-lightGreen">
                  <DialogHeader>
                    <DialogTitle className="text-darkGreen">Travel Agent Login</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="loginEmail" className="text-darkGreen">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                        className="border-lightGreen focus:ring-darkGreen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginPassword" className="text-darkGreen">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        required
                        className="border-lightGreen focus:ring-darkGreen"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-darkGreen text-lightYellow hover:bg-mediumGreen" disabled={loading}>
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-lightBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-darkGreen mb-4">Why Partner With Us?</h2>
            <p className="text-xl text-grayText max-w-3xl mx-auto">
              Join thousands of successful travel agents who have grown their business with Baithaka Ghar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full bg-white border border-lightGreen rounded-xl hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Icon className={`h-12 w-12 mx-auto mb-4 ${benefit.color}`} />
                      <h3 className="text-xl font-semibold mb-3 text-darkGreen">{benefit.title}</h3>
                      <p className="text-grayText">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-lightGreen/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-darkGreen mb-4">Success Stories</h2>
            <p className="text-xl text-grayText">Hear from our successful travel agent partners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white border border-lightGreen rounded-xl shadow hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={50}
                        height={50}
                        className="rounded-full mr-4 border-2 border-lightGreen"
                      />
                      <div>
                        <h4 className="font-semibold text-darkGreen">{testimonial.name}</h4>
                        <p className="text-sm text-grayText">{testimonial.agency}</p>
                        <p className="text-xs text-lightGreen">{testimonial.location}</p>
                      </div>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-grayText italic">"{testimonial.text}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registration" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-darkGreen mb-4">Become a Travel Agent Partner</h2>
              <p className="text-xl text-grayText">
                Join our network and start earning competitive commissions
              </p>
            </div>

            <Card className="bg-lightBg border border-lightGreen rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-darkGreen">
                  <Building className="h-6 w-6" />
                  Travel Agent Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = currentStep === step.id;
                      const isCompleted = currentStep > step.id;
                      return (
                        <div key={step.id} className="flex items-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200
                            ${isActive ? 'border-darkGreen bg-darkGreen text-lightYellow' :
                              isCompleted ? 'border-mediumGreen bg-mediumGreen text-lightYellow' :
                                'border-lightGreen bg-white text-lightGreen'}`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-4 transition-colors duration-200
                              ${isCompleted ? 'bg-mediumGreen' : 'bg-lightGreen'}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {steps.map((step) => (
                      <span
                        key={step.id}
                        className={`text-sm transition-colors duration-200
                          ${currentStep === step.id ? 'text-darkGreen font-medium' : 'text-lightGreen'}`}
                      >
                        {step.title}
                      </span>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRegistrationSubmit}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-lightGreen text-darkGreen hover:bg-lightGreen/10"
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        className="bg-darkGreen text-lightYellow hover:bg-mediumGreen"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!validateStep(currentStep)}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-darkGreen text-lightYellow hover:bg-mediumGreen"
                        disabled={loading || !validateStep(currentStep)}
                      >
                        {loading ? "Submitting..." : "Submit Application"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
} 