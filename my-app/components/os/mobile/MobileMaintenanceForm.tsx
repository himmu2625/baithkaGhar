'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Upload,
  X,
  Mic,
  MicOff,
  ChevronLeft,
  Send,
  Save,
  Zap,
  Droplets,
  Thermometer,
  Wifi,
  WifiOff,
  Clock,
  User,
  Phone
} from 'lucide-react';
import LoadingSpinner from '@/components/os/common/LoadingSpinner';
import { useRealtime } from '@/components/os/realtime/RealtimeProvider';

interface MaintenanceRequest {
  id?: string;
  roomId: string;
  roomNumber: string;
  category: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  title: string;
  description: string;
  location?: {
    specific: string;
    coordinates?: { lat: number; lng: number };
  };
  reportedBy: {
    name: string;
    role: string;
    contact: string;
  };
  assets?: string[];
  photos?: string[];
  audioNote?: string;
  safety?: {
    hazardLevel: number;
    requirements: string[];
    ppe: string[];
  };
  urgency?: {
    guestImpact: boolean;
    operationalImpact: boolean;
    safetyRisk: boolean;
  };
  estimatedCost?: number;
  preferredTime?: string;
  additionalNotes?: string;
}

export default function MobileMaintenanceForm({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MaintenanceRequest>({
    roomId: '',
    roomNumber: '',
    category: '',
    type: 'corrective',
    priority: 'medium',
    title: '',
    description: '',
    reportedBy: {
      name: '',
      role: '',
      contact: ''
    },
    assets: [],
    photos: [],
    safety: {
      hazardLevel: 1,
      requirements: [],
      ppe: []
    },
    urgency: {
      guestImpact: false,
      operationalImpact: false,
      safetyRisk: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMaintenanceAlert } = useRealtime();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    fetchRooms();
    checkOnlineStatus();
    requestLocationPermission();

    const interval = setInterval(checkOnlineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/os/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationEnabled(true);
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            }
          }));
        },
        () => setLocationEnabled(false)
      );
    }
  };

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const photoUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            photoUrls.push(e.target.result as string);
          }
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...photoUrls]
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setFormData(prev => ({ ...prev, audioNote: audioUrl }));

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const calculatePriority = () => {
    let priorityScore = 0;

    if (formData.urgency?.guestImpact) priorityScore += 2;
    if (formData.urgency?.operationalImpact) priorityScore += 2;
    if (formData.urgency?.safetyRisk) priorityScore += 3;
    if (formData.safety?.hazardLevel && formData.safety.hazardLevel > 3) priorityScore += 2;

    if (priorityScore >= 5) return 'emergency';
    if (priorityScore >= 3) return 'urgent';
    if (priorityScore >= 2) return 'high';
    return 'medium';
  };

  const handleNext = () => {
    if (currentStep === 2 && (formData.urgency?.safetyRisk || (formData.safety?.hazardLevel || 0) > 3)) {
      setShowSafetyDialog(true);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const calculatedPriority = calculatePriority();
      const requestData = {
        ...formData,
        priority: calculatedPriority,
        createdAt: new Date(),
        status: 'reported'
      };

      let response;
      if (isOnline) {
        response = await fetch('/api/os/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
      } else {
        const offlineRequests = JSON.parse(localStorage.getItem('offlineMaintenanceRequests') || '[]');
        offlineRequests.push({ ...requestData, id: crypto.randomUUID() });
        localStorage.setItem('offlineMaintenanceRequests', JSON.stringify(offlineRequests));
        response = { ok: true };
      }

      if (response.ok) {
        if (calculatedPriority === 'urgent' || calculatedPriority === 'emergency') {
          await sendMaintenanceAlert({
            roomId: formData.roomId,
            priority: calculatedPriority,
            type: formData.category,
            description: formData.description,
            reportedBy: formData.reportedBy.name
          });
        }

        onClose();
      }
    } catch (error) {
      console.error('Failed to submit maintenance request:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
        <p className="text-sm text-gray-600">Tell us about the issue</p>
      </div>

      <div>
        <Label htmlFor="room">Room *</Label>
        <Select
          value={formData.roomId}
          onValueChange={(value) => {
            const room = rooms.find((r: any) => r._id === value);
            setFormData(prev => ({
              ...prev,
              roomId: value,
              roomNumber: room?.number || ''
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room: any) => (
              <SelectItem key={room._id} value={room._id}>
                Room {room.number} - {room.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="appliances">Appliances</SelectItem>
            <SelectItem value="fixtures">Fixtures</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corrective">Repair Needed</SelectItem>
            <SelectItem value="preventive">Preventive Maintenance</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="inspection">Inspection Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Issue Title *</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the issue in detail..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="location">Specific Location</Label>
        <Input
          id="location"
          placeholder="e.g., Bathroom sink, Main door, etc."
          value={formData.location?.specific || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location, specific: e.target.value }
          }))}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Priority & Impact</h2>
        <p className="text-sm text-gray-600">Help us understand the urgency</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="guest-impact"
              checked={formData.urgency?.guestImpact}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  urgency: { ...prev.urgency, guestImpact: !!checked }
                }))
              }
            />
            <label htmlFor="guest-impact" className="text-sm">
              Affects guest experience
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="operational-impact"
              checked={formData.urgency?.operationalImpact}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  urgency: { ...prev.urgency, operationalImpact: !!checked }
                }))
              }
            />
            <label htmlFor="operational-impact" className="text-sm">
              Affects operations
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="safety-risk"
              checked={formData.urgency?.safetyRisk}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  urgency: { ...prev.urgency, safetyRisk: !!checked }
                }))
              }
            />
            <label htmlFor="safety-risk" className="text-sm">
              <AlertTriangle className="inline h-4 w-4 text-red-500 mr-1" />
              Safety risk involved
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Safety Level</CardTitle>
          <CardDescription>
            Rate the potential hazard level (1 = Low, 5 = Critical)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={[formData.safety?.hazardLevel || 1]}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    safety: { ...prev.safety, hazardLevel: value[0] }
                  }))
                }
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Urgent</span>
                <span>Critical</span>
              </div>
            </div>

            <div className="text-center">
              <Badge
                variant={
                  (formData.safety?.hazardLevel || 1) <= 2 ? 'secondary' :
                  (formData.safety?.hazardLevel || 1) <= 3 ? 'outline' :
                  (formData.safety?.hazardLevel || 1) <= 4 ? 'destructive' : 'destructive'
                }
              >
                Level {formData.safety?.hazardLevel || 1}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="estimated-cost">Estimated Cost (Optional)</Label>
        <Input
          id="estimated-cost"
          type="number"
          placeholder="0.00"
          value={formData.estimatedCost || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) }))}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Documentation</h2>
        <p className="text-sm text-gray-600">Add photos and audio notes</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Photos</CardTitle>
          <CardDescription>Take photos of the issue for better context</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photos
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={photo}
                      alt={`Issue photo ${index + 1}`}
                      width={120}
                      height={96}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          photos: prev.photos?.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Voice Note</CardTitle>
          <CardDescription>Record additional details verbally</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} variant="outline" className="flex-1">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="flex-1">
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {formData.audioNote && (
              <div className="p-3 bg-gray-50 rounded">
                <audio controls className="w-full">
                  <source src={formData.audioNote} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Reporter Information</h2>
        <p className="text-sm text-gray-600">Who is reporting this issue?</p>
      </div>

      <div>
        <Label htmlFor="reporter-name">Your Name *</Label>
        <Input
          id="reporter-name"
          placeholder="Full name"
          value={formData.reportedBy.name}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            reportedBy: { ...prev.reportedBy, name: e.target.value }
          }))}
        />
      </div>

      <div>
        <Label htmlFor="reporter-role">Role *</Label>
        <Select
          value={formData.reportedBy.role}
          onValueChange={(value) => setFormData(prev => ({
            ...prev,
            reportedBy: { ...prev.reportedBy, role: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="guest">Guest</SelectItem>
            <SelectItem value="housekeeping">Housekeeping Staff</SelectItem>
            <SelectItem value="front_desk">Front Desk</SelectItem>
            <SelectItem value="maintenance">Maintenance Staff</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reporter-contact">Contact Information</Label>
        <Input
          id="reporter-contact"
          placeholder="Phone number or email"
          value={formData.reportedBy.contact}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            reportedBy: { ...prev.reportedBy, contact: e.target.value }
          }))}
        />
      </div>

      <div>
        <Label htmlFor="preferred-time">Preferred Service Time</Label>
        <Select
          value={formData.preferredTime}
          onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="When should this be addressed?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asap">As soon as possible</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="this_week">This week</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="additional-notes">Additional Notes</Label>
        <Textarea
          id="additional-notes"
          placeholder="Any additional information..."
          value={formData.additionalNotes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
          rows={3}
        />
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">Calculated Priority</h4>
              <p className="text-sm text-orange-700 mt-1">
                Based on your inputs, this request will be classified as:{' '}
                <Badge variant={calculatePriority() === 'emergency' ? 'destructive' : 'secondary'}>
                  {calculatePriority().toUpperCase()}
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.roomId && formData.category && formData.title && formData.description;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return formData.reportedBy.name && formData.reportedBy.role;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Maintenance Request</h1>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {!isOnline && <WifiOff className="h-4 w-4 text-red-500" />}
          </div>
          <div className="w-8" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              Previous
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={!canProceed() || loading}
              className="flex-1"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4 mr-1" />}
              Submit Request
            </Button>
          )}
        </div>
      </div>

      {/* Safety Dialog */}
      <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Safety Alert
            </DialogTitle>
            <DialogDescription>
              You've indicated this issue involves safety risks. High-priority safety issues
              will be immediately escalated to management and emergency services if necessary.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSafetyDialog(false);
                setFormData(prev => ({
                  ...prev,
                  urgency: { ...prev.urgency, safetyRisk: false },
                  safety: { ...prev.safety, hazardLevel: 1 }
                }));
              }}
            >
              Revise Assessment
            </Button>
            <Button
              onClick={() => {
                setShowSafetyDialog(false);
                handleNext();
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Maintenance Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {calculatePriority() === 'emergency' ? (
                <span className="text-red-600 font-medium">
                  This emergency request will trigger immediate alerts to maintenance staff.
                </span>
              ) : calculatePriority() === 'urgent' ? (
                <span className="text-orange-600 font-medium">
                  This urgent request will be prioritized and assigned immediately.
                </span>
              ) : (
                'Your maintenance request will be submitted and assigned to appropriate staff.'
              )}
              {!isOnline && (
                <div className="mt-2 text-amber-600">
                  You're currently offline. The request will be saved locally and submitted
                  when connection is restored.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Submit Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}