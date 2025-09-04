'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Send, 
  Eye,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ContractTerms {
  cancellationPolicy: string;
  paymentSchedule: string;
  refundPolicy: string;
  forceEventPolicy: string;
  liabilityClause: string;
  additionalTerms: string;
}

interface Contract {
  id: string;
  eventTitle: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  eventDate: Date;
  venue: string;
  startTime: string;
  endTime: string;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentDueDate: Date;
  terms: ContractTerms;
  status: 'draft' | 'sent' | 'signed' | 'cancelled';
  createdAt: Date;
  signedAt?: Date;
  specialRequirements?: string;
}

interface ContractGeneratorProps {
  eventData?: Partial<Contract>;
  onSave?: (contract: Contract) => void;
  onSend?: (contract: Contract) => void;
}

export default function ContractGenerator({ 
  eventData, 
  onSave, 
  onSend 
}: ContractGeneratorProps) {
  const [contract, setContract] = useState<Partial<Contract>>(eventData || {
    eventTitle: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    eventDate: new Date(),
    venue: '',
    startTime: '18:00',
    endTime: '23:00',
    guests: 50,
    totalAmount: 0,
    depositAmount: 0,
    remainingAmount: 0,
    paymentDueDate: new Date(),
    terms: {
      cancellationPolicy: 'Cancellations made more than 30 days prior to the event date will receive a full refund minus a $200 administrative fee. Cancellations made 15-30 days prior will receive a 50% refund. Cancellations made less than 15 days prior are non-refundable.',
      paymentSchedule: 'A deposit of 50% is required to secure your booking. The remaining balance is due 7 days prior to the event date.',
      refundPolicy: 'Refunds will be processed within 14 business days of cancellation. Refund amounts are subject to the cancellation policy outlined above.',
      forceEventPolicy: 'In the event of circumstances beyond our control (force majeure), including but not limited to natural disasters, government restrictions, or other unforeseeable events, we will work with you to reschedule or provide appropriate compensation.',
      liabilityClause: 'The venue and event organizers are not liable for any loss, damage, or injury to persons or property during the event. Clients are responsible for obtaining appropriate insurance coverage.',
      additionalTerms: 'All decorations must be removed by the end of the event. No confetti, glitter, or permanent decorations are permitted without prior approval.'
    },
    status: 'draft',
    createdAt: new Date()
  });

  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [previewMode, setPreviewMode] = useState(false);

  const contractTemplates = {
    standard: 'Standard Event Contract',
    wedding: 'Wedding Event Contract',
    corporate: 'Corporate Event Contract',
    birthday: 'Birthday Party Contract'
  };

  const updateDepositAmount = (totalAmount: number, depositPercentage: number = 50) => {
    const deposit = (totalAmount * depositPercentage) / 100;
    const remaining = totalAmount - deposit;
    
    setContract(prev => ({
      ...prev,
      totalAmount,
      depositAmount: deposit,
      remainingAmount: remaining
    }));
  };

  const handleSave = () => {
    if (contract.eventTitle && contract.clientName) {
      onSave?.(contract as Contract);
    }
  };

  const handleSend = () => {
    if (contract.eventTitle && contract.clientName && contract.clientEmail) {
      const updatedContract = { ...contract, status: 'sent' as const };
      setContract(updatedContract);
      onSend?.(updatedContract as Contract);
    }
  };

  const ContractPreview = () => (
    <div className="space-y-6 p-6 bg-white text-black font-serif">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">EVENT CONTRACT</h1>
        <p className="text-lg">{contractTemplates[selectedTemplate as keyof typeof contractTemplates]}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3">CLIENT INFORMATION</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {contract.clientName}</p>
            <p><strong>Email:</strong> {contract.clientEmail}</p>
            <p><strong>Phone:</strong> {contract.clientPhone}</p>
            <p><strong>Address:</strong> {contract.clientAddress}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3">EVENT DETAILS</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Event:</strong> {contract.eventTitle}</p>
            <p><strong>Date:</strong> {contract.eventDate?.toLocaleDateString()}</p>
            <p><strong>Time:</strong> {contract.startTime} - {contract.endTime}</p>
            <p><strong>Venue:</strong> {contract.venue}</p>
            <p><strong>Guests:</strong> {contract.guests}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">FINANCIAL TERMS</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p><strong>Total Amount:</strong></p>
            <p className="text-lg font-bold text-green-600">${contract.totalAmount?.toFixed(2)}</p>
          </div>
          <div>
            <p><strong>Deposit Required:</strong></p>
            <p className="text-lg font-bold">${contract.depositAmount?.toFixed(2)}</p>
          </div>
          <div>
            <p><strong>Balance Due:</strong></p>
            <p className="text-lg font-bold">${contract.remainingAmount?.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-sm mt-2">
          <strong>Payment Due Date:</strong> {contract.paymentDueDate?.toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-bold mb-2">CANCELLATION POLICY</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.cancellationPolicy}</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">PAYMENT SCHEDULE</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.paymentSchedule}</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">REFUND POLICY</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.refundPolicy}</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">FORCE MAJEURE</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.forceEventPolicy}</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">LIABILITY</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.liabilityClause}</p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ADDITIONAL TERMS</h3>
          <p className="text-sm whitespace-pre-wrap">{contract.terms?.additionalTerms}</p>
        </div>

        {contract.specialRequirements && (
          <div>
            <h3 className="font-bold mb-2">SPECIAL REQUIREMENTS</h3>
            <p className="text-sm whitespace-pre-wrap">{contract.specialRequirements}</p>
          </div>
        )}
      </div>

      <div className="border-t pt-4 mt-8">
        <p className="text-xs text-gray-600">
          Contract generated on {new Date().toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <div className="border-t border-black w-48 mt-8"></div>
            <p className="text-sm mt-1">Client Signature / Date</p>
          </div>
          <div>
            <div className="border-t border-black w-48 mt-8"></div>
            <p className="text-sm mt-1">Venue Representative / Date</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Contract Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Edit Contract
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Contract
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ContractPreview />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Event Contract Generator
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Contract
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="template">Contract Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contractTemplates).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="event-details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="event-details">Event Details</TabsTrigger>
          <TabsTrigger value="client-info">Client Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="event-details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    value={contract.eventTitle || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, eventTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={contract.venue || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, venue: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={contract.eventDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, eventDate: new Date(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={contract.startTime || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={contract.endTime || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={contract.guests || ''}
                  onChange={(e) => setContract(prev => ({ ...prev, guests: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  placeholder="Any special requirements or requests for the event..."
                  value={contract.specialRequirements || ''}
                  onChange={(e) => setContract(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientName">Full Name</Label>
                <Input
                  id="clientName"
                  value={contract.clientName || ''}
                  onChange={(e) => setContract(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientEmail">Email Address</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={contract.clientEmail || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, clientEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Phone Number</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={contract.clientPhone || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, clientPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientAddress">Address</Label>
                <Textarea
                  id="clientAddress"
                  placeholder="Client's full address..."
                  value={contract.clientAddress || ''}
                  onChange={(e) => setContract(prev => ({ ...prev, clientAddress: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Total Event Cost</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={contract.totalAmount || ''}
                    onChange={(e) => updateDepositAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentDueDate">Final Payment Due</Label>
                  <Input
                    id="paymentDueDate"
                    type="date"
                    value={contract.paymentDueDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, paymentDueDate: new Date(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Deposit Amount (50%)</Label>
                  <Input
                    value={`$${contract.depositAmount?.toFixed(2) || '0.00'}`}
                    disabled
                  />
                </div>
                <div>
                  <Label>Remaining Balance</Label>
                  <Input
                    value={`$${contract.remainingAmount?.toFixed(2) || '0.00'}`}
                    disabled
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Payment Schedule</h4>
                    <p className="text-sm text-yellow-700">
                      50% deposit required to secure booking. Remaining balance due 7 days before event.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={contract.terms?.cancellationPolicy || ''}
                  onChange={(e) => setContract(prev => ({
                    ...prev,
                    terms: { ...prev.terms!, cancellationPolicy: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="paymentSchedule">Payment Schedule</Label>
                <Textarea
                  id="paymentSchedule"
                  value={contract.terms?.paymentSchedule || ''}
                  onChange={(e) => setContract(prev => ({
                    ...prev,
                    terms: { ...prev.terms!, paymentSchedule: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="liabilityClause">Liability Clause</Label>
                <Textarea
                  id="liabilityClause"
                  value={contract.terms?.liabilityClause || ''}
                  onChange={(e) => setContract(prev => ({
                    ...prev,
                    terms: { ...prev.terms!, liabilityClause: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="additionalTerms">Additional Terms</Label>
                <Textarea
                  id="additionalTerms"
                  value={contract.terms?.additionalTerms || ''}
                  onChange={(e) => setContract(prev => ({
                    ...prev,
                    terms: { ...prev.terms!, additionalTerms: e.target.value }
                  }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}