'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, AlertCircle, Loader2, Instagram, Youtube, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    tiktok: string;
    facebook: string;
    twitter: string;
    blog: string;
    other: string;
  };
  followerCount: number;
  primaryPlatform: string;
  collaborationType: string;
  profileImage: string;
  bio: string;
  motivation: string;
  niche: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  averageEngagement: number;
  previousBrandCollabs: string;
}

const ApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      blog: '',
      other: ''
    },
    followerCount: 0,
    primaryPlatform: '',
    collaborationType: 'affiliate',
    profileImage: '',
    bio: '',
    motivation: '',
    niche: '',
    location: {
      city: '',
      state: '',
      country: 'India'
    },
    averageEngagement: 0,
    previousBrandCollabs: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.primaryPlatform) newErrors.primaryPlatform = 'Primary platform is required';
    if (formData.followerCount < 0) newErrors.followerCount = 'Follower count must be positive';
    
    // At least one social link required
    const hasValidSocialLink = Object.values(formData.socialLinks).some(link => 
      link.trim() && (link.includes('http') || link.includes('www') || link.includes('@'))
    );
    if (!hasValidSocialLink) {
      newErrors.socialLinks = 'At least one valid social media link is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const submissionData = {
        ...formData,
        utmSource: urlParams.get('utm_source') || 'direct',
        utmMedium: urlParams.get('utm_medium') || 'website',
        utmCampaign: urlParams.get('utm_campaign') || 'partner-page'
      };

      const response = await fetch('/api/influencer-applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        toast.success('Application submitted successfully!');
        
        // Scroll to success message
        setTimeout(() => {
          document.getElementById('success-message')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        if (response.status === 409) {
          toast.error(`An application with this email already exists (Status: ${result.existingStatus})`);
        } else {
          toast.error(result.error || 'Failed to submit application');
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card id="success-message" className="p-8 md:p-12 text-center border-0 bg-gradient-to-br from-gray-50 to-teal-50">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-darkGreen/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-darkGreen" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Application Submitted Successfully! 🎉
            </h3>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thank you for your interest in partnering with Baithaka Ghar. Our team will review 
              your application and get back to you within 3-5 business days.
            </p>
            
            <div className="bg-white rounded-xl p-6 text-left max-w-md mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-darkGreen rounded-full"></div>
                  We'll review your profile and content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-darkGreen rounded-full"></div>
                  You'll receive an email with our decision
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-darkGreen rounded-full"></div>
                  If approved, we'll send partnership details
                </li>
              </ul>
            </div>
            
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-darkGreen hover:bg-darkGreen/90 text-white"
            >
              Return to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
          Apply to Become a{' '}
          <span className="text-darkGreen">
            Partner
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Fill out this form to join our influencer program. We welcome creators of all sizes 
          who are passionate about travel and authentic storytelling.
        </p>
      </div>

      <Card className="p-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={errors.fullName ? 'border-red-500' : ''}
                  placeholder="Your full name"
                />
                {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <Label htmlFor="niche">Content Niche</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => handleInputChange('niche', e.target.value)}
                  placeholder="e.g., Travel, Lifestyle, Food"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => handleInputChange('location.city', e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) => handleInputChange('location.state', e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.location.country}
                  onChange={(e) => handleInputChange('location.country', e.target.value)}
                  placeholder="India"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Social Media Presence *</h3>
            {errors.socialLinks && <p className="text-sm text-red-500">{errors.socialLinks}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram Profile
                </Label>
                <Input
                  id="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              <div>
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube Channel
                </Label>
                <Input
                  id="youtube"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div>
                <Label htmlFor="blog" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Blog/Website
                </Label>
                <Input
                  id="blog"
                  value={formData.socialLinks.blog}
                  onChange={(e) => handleInputChange('socialLinks.blog', e.target.value)}
                  placeholder="https://yourblog.com"
                />
              </div>

              <div>
                <Label htmlFor="other">Other Platform</Label>
                <Input
                  id="other"
                  value={formData.socialLinks.other}
                  onChange={(e) => handleInputChange('socialLinks.other', e.target.value)}
                  placeholder="TikTok, Facebook, etc."
                />
              </div>
            </div>
          </div>

          {/* Platform Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Platform Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="primaryPlatform">Primary Platform *</Label>
                <Select 
                  value={formData.primaryPlatform} 
                  onValueChange={(value) => handleInputChange('primaryPlatform', value)}
                >
                  <SelectTrigger className={errors.primaryPlatform ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="blog">Blog/Website</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.primaryPlatform && <p className="text-sm text-red-500 mt-1">{errors.primaryPlatform}</p>}
              </div>

              <div>
                <Label htmlFor="followerCount">Follower Count *</Label>
                <Input
                  id="followerCount"
                  type="number"
                  value={formData.followerCount}
                  onChange={(e) => handleInputChange('followerCount', parseInt(e.target.value) || 0)}
                  className={errors.followerCount ? 'border-red-500' : ''}
                  placeholder="10000"
                  min="0"
                />
                {errors.followerCount && <p className="text-sm text-red-500 mt-1">{errors.followerCount}</p>}
              </div>

              <div>
                <Label htmlFor="engagement">Average Engagement %</Label>
                <Input
                  id="engagement"
                  type="number"
                  value={formData.averageEngagement}
                  onChange={(e) => handleInputChange('averageEngagement', parseFloat(e.target.value) || 0)}
                  placeholder="5.2"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="collaborationType">Preferred Collaboration Type</Label>
              <Select 
                value={formData.collaborationType} 
                onValueChange={(value) => handleInputChange('collaborationType', value)}
              >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="affiliate">Affiliate Commission</SelectItem>
                   <SelectItem value="paid">Paid Partnership</SelectItem>
                   <SelectItem value="barter">Barter (Free Stays)</SelectItem>
                   <SelectItem value="mixed">Mixed (Commission + Barter)</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          {/* Content & Experience */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">About You</h3>
            
            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself and your content style..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
            </div>

            <div>
              <Label htmlFor="motivation">Why do you want to partner with us? (Optional)</Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) => handleInputChange('motivation', e.target.value)}
                placeholder="Share your motivation for joining our partnership program..."
                className="min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.motivation.length}/1000 characters</p>
            </div>

            <div>
              <Label htmlFor="previousCollabs">Previous Brand Collaborations (Optional)</Label>
              <Textarea
                id="previousCollabs"
                value={formData.previousBrandCollabs}
                onChange={(e) => handleInputChange('previousBrandCollabs', e.target.value)}
                placeholder="List some brands you've worked with previously..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.previousBrandCollabs.length}/500 characters</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-darkGreen hover:bg-darkGreen/90 text-white font-semibold py-4 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              By submitting this form, you agree to our terms and conditions. 
              We typically respond within 3-5 business days.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ApplicationForm; 