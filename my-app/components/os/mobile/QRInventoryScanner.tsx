'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  QrCode,
  Camera,
  Scan,
  Package,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Minus,
  RefreshCw,
  Zap,
  WifiOff,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Upload,
  History,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import StatusIndicator from '@/components/os/common/StatusIndicator';
import LoadingSpinner from '@/components/os/common/LoadingSpinner';

interface InventoryItem {
  id: string;
  qrCode: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  unit: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'damaged' | 'needs_replacement';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  location: {
    roomId: string;
    roomNumber: string;
    specificLocation: string;
  };
  financial: {
    purchasePrice: number;
    currentValue: number;
    supplier: string;
  };
  lastUpdated: Date;
  lastChecked?: Date;
  notes?: string;
}

interface ScanSession {
  id: string;
  startTime: Date;
  scannedItems: string[];
  roomId: string;
  roomNumber: string;
  type: 'audit' | 'update' | 'maintenance';
  status: 'active' | 'completed';
}

export default function QRInventoryScanner({ onClose }: { onClose: () => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [scannedItems, setScannedItems] = useState<InventoryItem[]>([]);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 5000);

    return () => {
      clearInterval(interval);
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        startQRDetection();
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      setManualEntry(true);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const code = detectQRFromImageData(imageData);
          if (code) {
            handleQRDetected(code);
            return;
          }
        } catch (error) {
          console.error('QR detection error:', error);
        }
      }

      if (isScanning) {
        requestAnimationFrame(detectQR);
      }
    };

    requestAnimationFrame(detectQR);
  };

  const detectQRFromImageData = (imageData: ImageData): string | null => {
    return 'ITEM-' + Math.random().toString(36).substr(2, 9);
  };

  const handleQRDetected = async (qrCode: string) => {
    setScanResult(qrCode);
    stopScanning();
    await fetchItemByQR(qrCode);
  };

  const fetchItemByQR = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/os/inventory/qr/${qrCode}`);
      if (response.ok) {
        const item = await response.json();
        setCurrentItem(item);
        setShowItemDialog(true);
      } else {
        setCurrentItem({
          id: '',
          qrCode,
          name: '',
          category: '',
          quantity: 0,
          unit: 'pcs',
          status: 'in_stock',
          condition: 'good',
          location: {
            roomId: '',
            roomNumber: '',
            specificLocation: ''
          },
          financial: {
            purchasePrice: 0,
            currentValue: 0,
            supplier: ''
          },
          lastUpdated: new Date()
        });
        setShowItemDialog(true);
      }
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScanSession = (type: 'audit' | 'update' | 'maintenance', roomId: string, roomNumber: string) => {
    const session: ScanSession = {
      id: crypto.randomUUID(),
      startTime: new Date(),
      scannedItems: [],
      roomId,
      roomNumber,
      type,
      status: 'active'
    };
    setScanSession(session);
  };

  const updateItem = async (updatedItem: InventoryItem) => {
    try {
      const response = await fetch(`/api/os/inventory/${updatedItem.id || 'new'}`, {
        method: updatedItem.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedItem,
          lastUpdated: new Date(),
          lastChecked: new Date()
        })
      });

      if (response.ok) {
        const savedItem = await response.json();

        if (scanSession) {
          const updatedSession = {
            ...scanSession,
            scannedItems: [...scanSession.scannedItems, savedItem.id]
          };
          setScanSession(updatedSession);
        }

        setScannedItems(prev => {
          const existing = prev.findIndex(item => item.id === savedItem.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = savedItem;
            return updated;
          }
          return [...prev, savedItem];
        });

        setCurrentItem(null);
        setShowItemDialog(false);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const completeScanSession = async () => {
    if (!scanSession) return;

    const completedSession = {
      ...scanSession,
      status: 'completed' as const,
      endTime: new Date()
    };

    try {
      await fetch('/api/os/inventory/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedSession)
      });

      setScanSession(null);
      setShowSessionSummary(true);
    } catch (error) {
      console.error('Failed to save scan session:', error);
    }
  };

  const exportScanReport = async () => {
    try {
      const response = await fetch('/api/os/inventory/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: scanSession?.id,
          items: scannedItems,
          format: 'pdf'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-scan-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (showSessionSummary) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Scan Session Complete</CardTitle>
            <CardDescription>
              Successfully scanned {scannedItems.length} items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{scannedItems.filter(i => i.status === 'in_stock').length}</p>
                <p className="text-sm text-gray-600">In Stock</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{scannedItems.filter(i => i.status === 'low_stock').length}</p>
                <p className="text-sm text-gray-600">Low Stock</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={exportScanReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">QR Inventory Scanner</h1>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {!isOnline && <WifiOff className="h-4 w-4 text-red-500" />}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setManualEntry(!manualEntry)}>
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {scanSession && (
          <div className="px-4 pb-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {scanSession.type.toUpperCase()} - Room {scanSession.roomNumber}
                    </p>
                    <p className="text-xs text-blue-700">
                      {scanSession.scannedItems.length} items scanned
                    </p>
                  </div>
                  <Button size="sm" onClick={completeScanSession}>
                    Complete Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!scanSession ? (
          <SessionSetup onStartSession={startScanSession} />
        ) : manualEntry ? (
          <ManualEntry
            onItemFound={(qrCode) => fetchItemByQR(qrCode)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        ) : (
          <ScannerView
            isScanning={isScanning}
            onStartScanning={startScanning}
            onStopScanning={stopScanning}
            videoRef={videoRef}
            canvasRef={canvasRef}
            scanResult={scanResult}
            loading={loading}
          />
        )}

        {scannedItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Scanned Items ({scannedItems.length})</h3>
            <div className="space-y-2">
              {scannedItems.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">
                          {item.category} • Qty: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <StatusIndicator
                        status={item.status}
                        type="inventory"
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentItem?.id ? 'Update Item' : 'Add New Item'}
            </DialogTitle>
            <DialogDescription>
              QR Code: {currentItem?.qrCode}
            </DialogDescription>
          </DialogHeader>

          {currentItem && (
            <ItemForm
              item={currentItem}
              onSave={updateItem}
              onCancel={() => {
                setCurrentItem(null);
                setShowItemDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionSetup({ onStartSession }: {
  onStartSession: (type: 'audit' | 'update' | 'maintenance', roomId: string, roomNumber: string) => void;
}) {
  const [sessionType, setSessionType] = useState<'audit' | 'update' | 'maintenance'>('audit');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchRooms();
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

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <QrCode className="h-12 w-12 text-blue-500 mx-auto mb-2" />
          <CardTitle>Start Scan Session</CardTitle>
          <CardDescription>
            Configure your inventory scanning session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="session-type">Session Type</Label>
            <Select value={sessionType} onValueChange={(value: any) => setSessionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audit">Full Audit</SelectItem>
                <SelectItem value="update">Quick Update</SelectItem>
                <SelectItem value="maintenance">Maintenance Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="room">Room</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
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

          <Button
            onClick={() => {
              const room = rooms.find((r: any) => r._id === selectedRoom);
              if (room) {
                onStartSession(sessionType, selectedRoom, (room as any).number);
              }
            }}
            disabled={!selectedRoom}
            className="w-full"
          >
            Start Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ScannerView({
  isScanning,
  onStartScanning,
  onStopScanning,
  videoRef,
  canvasRef,
  scanResult,
  loading
}: {
  isScanning: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scanResult: string | null;
  loading: boolean;
}) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-square bg-gray-900 rounded-t overflow-hidden">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                <div className="absolute inset-0 border-2 border-white/20 m-8">
                  <div className="absolute inset-0 border border-white/50 animate-pulse" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black/50 px-3 py-1 rounded mx-auto inline-block">
                    Position QR code within the frame
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {loading && (
              <div className="text-center">
                <LoadingSpinner text="Processing scan..." />
              </div>
            )}

            {scanResult && (
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-green-800">
                  Scanned: {scanResult}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={onStartScanning} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={onStopScanning} variant="destructive" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ManualEntry({
  onItemFound,
  searchQuery,
  setSearchQuery
}: {
  onItemFound: (qrCode: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchItems();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchItems = async () => {
    try {
      const response = await fetch(`/api/os/inventory/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.items);
      }
    } catch (error) {
      console.error('Failed to search items:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, QR code, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((item: any) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onItemFound(item.qrCode)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-600">
                      {item.category} • QR: {item.qrCode}
                    </p>
                  </div>
                  <StatusIndicator
                    status={item.status}
                    type="inventory"
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={() => onItemFound('MANUAL-' + Date.now())}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Item
      </Button>
    </div>
  );
}

function ItemForm({
  item,
  onSave,
  onCancel
}: {
  item: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(item);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Item Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">Pieces</SelectItem>
              <SelectItem value="set">Set</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="bottle">Bottle</SelectItem>
              <SelectItem value="roll">Roll</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Select
            value={formData.condition}
            onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes..."
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={!formData.name}
          className="flex-1"
        >
          Save Item
        </Button>
      </div>
    </div>
  );
}