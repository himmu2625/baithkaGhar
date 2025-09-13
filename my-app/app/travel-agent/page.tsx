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
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyType: 'individual' | 'agency' | 'corporate' | 'tour_operator';
  licenseNumber: string;
  gstNumber: string;
  panNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessDetails: {
    website: string;
    socialHandles: string;
    yearsInBusiness: number;
    teamSize: number;
    annualTurnover: number;
    specialties: string[];
    targetMarkets: string[];
  };
  commissionExpectations: {
    preferredType: 'percentage' | 'fixed' | 'tiered';
    expectedRate: number;
    minimumBookingValue: number;
  };
  profilePicture?: File;
  companyLogo?: File;
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
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyType: 'individual',
    licenseNumber: '',
    gstNumber: '',
    panNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    businessDetails: {
      website: '',
      socialHandles: '',
      yearsInBusiness: 0,
      teamSize: 0,
      annualTurnover: 0,
      specialties: [],
      targetMarkets: []
    },
    commissionExpectations: {
      preferredType: 'percentage',
      expectedRate: 0,
      minimumBookingValue: 0
    },
    profilePicture: undefined,
    companyLogo: undefined,
    documents: {}
  });

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const steps = [
    { id: 1, title: 'Personal & Business Info', icon: Building },
    { id: 2, title: 'Contact & Account', icon: Users },
    { id: 3, title: 'Address & Profile', icon: Briefcase },
    { id: 4, title: 'Commission & Documents', icon: DollarSign }
  ];

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
  };

  const validatePAN = (pan: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const validateGST = (gst: string) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
  };

  const validatePincode = (pincode: string) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be PDF, JPEG, PNG, or JPG format' };
    }
    
    return { valid: true };
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!validateEmail(registrationData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(registrationData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number",
        variant: "destructive"
      });
      return;
    }

    if (!validatePassword(registrationData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
        variant: "destructive"
      });
      return;
    }
    
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (registrationData.panNumber && !validatePAN(registrationData.panNumber)) {
      toast({
        title: "Invalid PAN Number",
        description: "Please enter a valid PAN number (e.g., ABCDE1234F)",
        variant: "destructive"
      });
      return;
    }

    if (registrationData.gstNumber && !validateGST(registrationData.gstNumber)) {
      toast({
        title: "Invalid GST Number",
        description: "Please enter a valid GST number",
        variant: "destructive"
      });
      return;
    }

    if (!validatePincode(registrationData.address.pincode)) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive"
      });
      return;
    }

    if (registrationData.commissionExpectations.preferredType === 'percentage' && 
        (registrationData.commissionExpectations.expectedRate <= 0 || registrationData.commissionExpectations.expectedRate > 30)) {
      toast({
        title: "Invalid Commission Rate",
        description: "Commission percentage must be between 1% and 30%",
        variant: "destructive"
      });
      return;
    }

    // Validate uploaded files
    for (const [key, file] of Object.entries(registrationData.documents)) {
      if (file instanceof File) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast({
            title: "Invalid File",
            description: `${key}: ${validation.error}`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', registrationData.name);
      formData.append('email', registrationData.email);
      formData.append('phone', registrationData.phone);
      formData.append('password', registrationData.password);
      formData.append('companyName', registrationData.companyName);
      formData.append('companyType', registrationData.companyType);
      formData.append('licenseNumber', registrationData.licenseNumber);
      formData.append('gstNumber', registrationData.gstNumber);
      formData.append('panNumber', registrationData.panNumber);
      
      // Add nested address object as JSON
      formData.append('address', JSON.stringify(registrationData.address));
      
      // Add nested businessDetails object as JSON
      formData.append('businessDetails', JSON.stringify(registrationData.businessDetails));
      
      // Add nested commissionExpectations object as JSON
      formData.append('commissionExpectations', JSON.stringify(registrationData.commissionExpectations));
      
      // Add profile pictures
      if (registrationData.profilePicture) {
        formData.append('profilePicture', registrationData.profilePicture);
      }
      if (registrationData.companyLogo) {
        formData.append('companyLogo', registrationData.companyLogo);
      }
      
      // Add documents
      Object.entries(registrationData.documents).forEach(([key, file]) => {
        if (file instanceof File) {
          formData.append(`documents_${key}`, file);
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
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          companyName: '',
          companyType: 'individual',
          licenseNumber: '',
          gstNumber: '',
          panNumber: '',
          address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          },
          businessDetails: {
            website: '',
            socialHandles: '',
            yearsInBusiness: 0,
            teamSize: 0,
            annualTurnover: 0,
            specialties: [],
            targetMarkets: []
          },
          commissionExpectations: {
            preferredType: 'percentage',
            expectedRate: 0,
            minimumBookingValue: 0
          },
          profilePicture: undefined,
          companyLogo: undefined,
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
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setRegistrationData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof RegistrationFormData] as object,
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setRegistrationData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof RegistrationFormData] as object,
            [child]: {
              ...(prev[parent as keyof RegistrationFormData] as any)[child],
              [grandchild]: value
            }
          }
        }));
      }
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
      businessDetails: {
        ...prev.businessDetails,
        specialties: prev.businessDetails.specialties.includes(specialty)
          ? prev.businessDetails.specialties.filter(s => s !== specialty)
          : [...prev.businessDetails.specialties, specialty]
      }
    }));
  };

  const handleTargetMarketToggle = (market: string) => {
    setRegistrationData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        targetMarkets: prev.businessDetails.targetMarkets.includes(market)
          ? prev.businessDetails.targetMarkets.filter(m => m !== market)
          : [...prev.businessDetails.targetMarkets, market]
      }
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
        return !!(registrationData.name && registrationData.companyType);
      case 2:
        return !!(registrationData.name && registrationData.email && registrationData.phone && registrationData.password);
      case 3:
        return !!(registrationData.address.street && registrationData.address.city && registrationData.address.state && registrationData.address.pincode);
      case 4:
        return !!(registrationData.commissionExpectations.preferredType && registrationData.commissionExpectations.expectedRate > 0);
      default:
        return true;
    }
  };

  const renderStep1 = () => {
    const isBusinessEntity = ['agency', 'corporate', 'tour_operator'].includes(registrationData.companyType);
    const isIndividual = registrationData.companyType === 'individual';
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={registrationData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <Label htmlFor="companyName">{isIndividual ? 'Business Name (Optional)' : 'Company Name *'}</Label>
            <Input
              id="companyName"
              value={registrationData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder={isIndividual ? "Your business name or leave blank" : "Enter your company name"}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="companyType">Type of Travel Agent *</Label>
            <select
              id="companyType"
              value={registrationData.companyType}
              onChange={(e) => handleInputChange('companyType', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="individual">Individual Travel Agent</option>
              <option value="agency">Travel Agency</option>
              <option value="corporate">Corporate Travel</option>
              <option value="tour_operator">Tour Operator</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              {isIndividual 
                ? "Perfect for freelance travel agents or individuals. No formal business registration required."
                : "For registered businesses with formal documentation."}
            </p>
          </div>
          
          {/* Business Credentials - Optional for individuals */}
          <div className="md:col-span-2">
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">
                Business Credentials {isIndividual ? '(All Optional)' : '(Recommended)'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">
                    License Number {isBusinessEntity ? '(Recommended)' : '(Optional)'}
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={registrationData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder={isIndividual ? "If you have any travel license" : "Travel agency license number"}
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">
                    PAN Number {isBusinessEntity ? '(Recommended)' : '(Optional)'}
                  </Label>
                  <Input
                    id="panNumber"
                    value={registrationData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="PAN card number"
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    value={registrationData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="GST registration number"
                  />
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                {isIndividual 
                  ? "💡 Individual agents can register without any business documents. These fields help us verify your experience but are completely optional."
                  : "💡 While not mandatory, having business credentials helps with faster approval and higher commission rates."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={registrationData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Your contact email address"
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
            value={registrationData.businessDetails.website}
            onChange={(e) => handleInputChange('businessDetails.website', e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>
        <div>
          <Label htmlFor="socialHandles">Social Media Handles (Optional)</Label>
          <Input
            id="socialHandles"
            value={registrationData.businessDetails.socialHandles}
            onChange={(e) => handleInputChange('businessDetails.socialHandles', e.target.value)}
            placeholder="Instagram, Facebook, etc."
          />
        </div>
      </div>
      
      {/* Profile Pictures Section */}
      <div className="border-t pt-6 mt-6">
        <h4 className="font-medium mb-4">Profile Pictures (Optional but Recommended)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Picture */}
          <div>
            <Label htmlFor="profilePicture">Your Profile Picture</Label>
            <div className="mt-2">
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRegistrationData(prev => ({ ...prev, profilePicture: file }));
                  }
                }}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload your professional photo (JPG, PNG, max 5MB)
              </p>
              {registrationData.profilePicture && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(registrationData.profilePicture)}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <p className="text-sm text-green-600 mt-1">✓ Picture uploaded</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Company Logo - only for business entities */}
          {['agency', 'corporate', 'tour_operator'].includes(registrationData.companyType) && (
            <div>
              <Label htmlFor="companyLogo">Company Logo</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="companyLogo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRegistrationData(prev => ({ ...prev, companyLogo: file }));
                    }
                  }}
                  className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Upload your company logo (JPG, PNG, max 5MB)
                </p>
                {registrationData.companyLogo && (
                  <div className="mt-3">
                    <img
                      src={URL.createObjectURL(registrationData.companyLogo)}
                      alt="Logo preview"
                      className="w-24 h-16 object-contain border-2 border-gray-200 rounded bg-white p-2"
                    />
                    <p className="text-sm text-green-600 mt-1">✓ Logo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-blue-600 mt-4">
          📸 Adding pictures helps build trust with clients and increases approval chances by up to 40%
        </p>
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
            value={registrationData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            placeholder="Complete business address"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={registrationData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={registrationData.address.state}
            onChange={(e) => handleInputChange('address.state', e.target.value)}
            placeholder="State"
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            value={registrationData.address.pincode}
            onChange={(e) => handleInputChange('address.pincode', e.target.value)}
            placeholder="Pincode"
          />
        </div>
        <div>
          <Label htmlFor="yearsInBusiness">Years in Business</Label>
          <Input
            id="yearsInBusiness"
            type="number"
            value={registrationData.businessDetails.yearsInBusiness || ''}
            onChange={(e) => handleInputChange('businessDetails.yearsInBusiness', parseInt(e.target.value) || 0)}
            placeholder="Number of years"
          />
        </div>
        <div>
          <Label htmlFor="teamSize">Team Size</Label>
          <Input
            id="teamSize"
            type="number"
            value={registrationData.businessDetails.teamSize || ''}
            onChange={(e) => handleInputChange('businessDetails.teamSize', parseInt(e.target.value) || 0)}
            placeholder="Number of employees"
          />
        </div>
        <div>
          <Label htmlFor="annualTurnover">Annual Turnover (₹)</Label>
          <Input
            id="annualTurnover"
            type="number"
            value={registrationData.businessDetails.annualTurnover || ''}
            onChange={(e) => handleInputChange('businessDetails.annualTurnover', parseInt(e.target.value) || 0)}
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
                checked={registrationData.businessDetails.specialties.includes(specialty)}
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
                checked={registrationData.businessDetails.targetMarkets.includes(market)}
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