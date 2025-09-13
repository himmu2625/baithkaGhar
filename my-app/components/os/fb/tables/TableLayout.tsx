'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Phone, 
  Edit, 
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: 'square' | 'circle' | 'rectangle';
  position: { x: number; y: number };
  rotation: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  isActive: boolean;
  section: string;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    partySize: number;
    startTime: string;
    totalAmount: number;
  };
  reservation?: {
    id: string;
    customerName: string;
    partySize: number;
    reservationTime: string;
    phone: string;
  };
}

interface TableSection {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface TableLayoutProps {
  tables: Table[];
  sections: TableSection[];
  isEditMode: boolean;
  showCapacity: boolean;
  showStatus: boolean;
  onTablePositionChange: (tableId: string, position: { x: number; y: number }) => void;
  onTableStatusChange: (tableId: string, status: string) => void;
}

interface DragState {
  isDragging: boolean;
  tableId: string | null;
  startPos: { x: number; y: number };
  offset: { x: number; y: number };
}

export function TableLayout({
  tables,
  sections,
  isEditMode,
  showCapacity,
  showStatus,
  onTablePositionChange,
  onTableStatusChange,
}: TableLayoutProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tableId: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });
  
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTableColor = (table: Table) => {
    switch (table.status) {
      case 'available': return '#10B981'; // green
      case 'occupied': return '#EF4444'; // red
      case 'reserved': return '#F59E0B'; // yellow
      case 'cleaning': return '#3B82F6'; // blue
      case 'maintenance': return '#6B7280'; // gray
      default: return '#9CA3AF';
    }
  };

  const getSectionColor = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.color || '#9CA3AF';
  };

  const getTableSize = (capacity: number, shape: string) => {
    const baseSize = Math.max(60, Math.min(120, capacity * 15));
    
    switch (shape) {
      case 'rectangle':
        return { width: baseSize * 1.5, height: baseSize * 0.8 };
      case 'circle':
        return { width: baseSize, height: baseSize };
      case 'square':
      default:
        return { width: baseSize, height: baseSize };
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    if (!isEditMode) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      tableId: table.id,
      startPos: { x: clientX, y: clientY },
      offset: {
        x: clientX - table.position.x,
        y: clientY - table.position.y,
      },
    });

    setSelectedTable(table.id);
  }, [isEditMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.tableId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const newPosition = {
      x: Math.max(0, Math.min(rect.width - 100, clientX - dragState.offset.x)),
      y: Math.max(0, Math.min(rect.height - 100, clientY - dragState.offset.y)),
    };

    onTablePositionChange(dragState.tableId, newPosition);
  }, [dragState, onTablePositionChange]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        tableId: null,
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
      });
    }
  }, [dragState.isDragging]);

  const handleTableClick = (table: Table) => {
    if (!isEditMode) {
      setSelectedTable(selectedTable === table.id ? null : table.id);
    }
  };

  const renderTableShape = (table: Table) => {
    const size = getTableSize(table.capacity, table.shape);
    const color = getTableColor(table);
    const isSelected = selectedTable === table.id;
    
    const commonProps = {
      fill: color,
      stroke: isSelected ? '#1F2937' : getSectionColor(table.section),
      strokeWidth: isSelected ? 3 : 2,
      opacity: table.isActive ? 1 : 0.5,
    };

    switch (table.shape) {
      case 'circle':
        return (
          <ellipse
            cx={size.width / 2}
            cy={size.height / 2}
            rx={size.width / 2}
            ry={size.height / 2}
            {...commonProps}
          />
        );
      case 'rectangle':
        return (
          <rect
            width={size.width}
            height={size.height}
            rx={8}
            {...commonProps}
          />
        );
      case 'square':
      default:
        return (
          <rect
            width={size.width}
            height={size.height}
            rx={8}
            {...commonProps}
          />
        );
    }
  };

  const renderTableContent = (table: Table) => {
    const size = getTableSize(table.capacity, table.shape);
    
    return (
      <g>
        {/* Table Name */}
        <text
          x={size.width / 2}
          y={size.height / 2 - 8}
          textAnchor="middle"
          className="text-xs font-semibold fill-white"
        >
          {table.name}
        </text>
        
        {/* Capacity */}
        {showCapacity && (
          <text
            x={size.width / 2}
            y={size.height / 2 + 8}
            textAnchor="middle"
            className="text-xs fill-white"
          >
            {table.capacity} seats
          </text>
        )}
        
        {/* Status indicator */}
        {showStatus && (
          <circle
            cx={size.width - 8}
            cy={8}
            r={4}
            fill="white"
            stroke={getTableColor(table)}
            strokeWidth={2}
          />
        )}
        
        {/* Occupied indicator */}
        {table.currentOrder && (
          <circle
            cx={8}
            cy={8}
            r={4}
            fill="#DC2626"
            className="animate-pulse"
          />
        )}
        
        {/* Reserved indicator */}
        {table.reservation && (
          <circle
            cx={8}
            cy={size.height - 8}
            r={4}
            fill="#F59E0B"
          />
        )}
      </g>
    );
  };

  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Floor Plan Canvas */}
      <div className="relative">
        <div
          ref={containerRef}
          className="relative w-full h-96 bg-gradient-to-br from-slate-50 to-gray-100 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden backdrop-blur-sm"
          style={{ minHeight: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="absolute inset-0 w-full h-full">
            {/* Grid lines for edit mode */}
            {isEditMode && (
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                </pattern>
              </defs>
            )}
            {isEditMode && <rect width="100%" height="100%" fill="url(#grid)" />}
            
            {/* Tables */}
            {tables.map((table) => {
              const size = getTableSize(table.capacity, table.shape);
              
              return (
                <TooltipProvider key={table.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <g
                            transform={`translate(${table.position.x}, ${table.position.y}) rotate(${table.rotation}, ${size.width / 2}, ${size.height / 2})`}
                            className={`cursor-pointer transition-transform hover:scale-105 ${
                              isEditMode ? 'cursor-move' : ''
                            } ${dragState.isDragging && dragState.tableId === table.id ? 'opacity-75' : ''}`}
                            onMouseDown={(e) => handleMouseDown(e, table)}
                            onClick={() => handleTableClick(table)}
                          >
                            {renderTableShape(table)}
                            {renderTableContent(table)}
                          </g>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => onTableStatusChange(table.id, 'available')}
                            disabled={table.status === 'available'}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Available
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => onTableStatusChange(table.id, 'occupied')}
                            disabled={table.status === 'occupied'}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Mark Occupied
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => onTableStatusChange(table.id, 'cleaning')}
                            disabled={table.status === 'cleaning'}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Mark for Cleaning
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => onTableStatusChange(table.id, 'maintenance')}
                            disabled={table.status === 'maintenance'}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Mark Maintenance
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2">
                        <div className="font-semibold">{table.name}</div>
                        <div className="text-sm">
                          <div>Capacity: {table.capacity} people</div>
                          <div>Status: {table.status}</div>
                          <div>Section: {sections.find(s => s.id === table.section)?.name}</div>
                          {table.currentOrder && (
                            <div className="mt-2 pt-2 border-t">
                              <div>Order: {table.currentOrder.orderNumber}</div>
                              <div>Customer: {table.currentOrder.customerName}</div>
                              <div>Duration: {getTimeElapsed(table.currentOrder.startTime)}</div>
                              <div>Amount: ₹{table.currentOrder.totalAmount}</div>
                            </div>
                          )}
                          {table.reservation && (
                            <div className="mt-2 pt-2 border-t">
                              <div>Reserved for: {table.reservation.customerName}</div>
                              <div>Time: {new Date(table.reservation.reservationTime).toLocaleTimeString()}</div>
                              <div>Party: {table.reservation.partySize} people</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </svg>
          
          {/* Edit mode instructions */}
          {isEditMode && (
            <div className="absolute top-4 left-4 bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm border-0 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1 rounded bg-blue-500/20">
                  <Edit className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-semibold text-blue-800">Edit Mode Active</div>
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Drag tables to move them</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Right-click for options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Click to select tables</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Details Panel */}
      {selectedTable && !isEditMode && (
        <Card className="mt-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="pt-6">
            {(() => {
              const table = tables.find(t => t.id === selectedTable);
              if (!table) return null;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{table.name}</h3>
                      <p className="text-gray-600">
                        {table.capacity} seats • {sections.find(s => s.id === table.section)?.name}
                      </p>
                    </div>
                    <Badge className={
                      table.status === 'available' ? 'bg-green-100 text-green-800' :
                      table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      table.status === 'cleaning' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {table.status}
                    </Badge>
                  </div>

                  {table.currentOrder && (
                    <div className="p-4 bg-gradient-to-br from-red-50 to-pink-100 border-0 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-red-800 flex items-center space-x-2">
                          <div className="p-1 rounded bg-red-500/20">
                            <Users className="w-4 h-4 text-red-600" />
                          </div>
                          <span>Current Order</span>
                        </h4>
                        <Badge variant="outline" className="bg-red-100 text-red-600 border-red-200">
                          {table.currentOrder.orderNumber}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Customer:</span>
                          <span className="font-medium">{table.currentOrder.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Party Size:</span>
                          <span>{table.currentOrder.partySize} people</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{getTimeElapsed(table.currentOrder.startTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">₹{table.currentOrder.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline" className="bg-white/60 hover:bg-white/80 backdrop-blur-sm">
                          <Edit className="w-4 h-4 mr-1" />
                          View Order
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                          onClick={() => onTableStatusChange(table.id, 'cleaning')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete Order
                        </Button>
                      </div>
                    </div>
                  )}

                  {table.reservation && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-yellow-800">Reservation</h4>
                        <Badge variant="outline" className="text-yellow-600">
                          {new Date(table.reservation.reservationTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Customer:</span>
                          <span className="font-medium">{table.reservation.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Party Size:</span>
                          <span>{table.reservation.partySize} people</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span>{table.reservation.phone}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-1" />
                          Call Customer
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onTableStatusChange(table.id, 'occupied')}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Seat Customer
                        </Button>
                      </div>
                    </div>
                  )}

                  {table.status === 'available' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Available Table</h4>
                      <p className="text-sm text-green-700 mb-3">
                        This table is ready for new customers.
                      </p>
                      <div className="flex space-x-2">
                        <Button size="sm">
                          <Users className="w-4 h-4 mr-1" />
                          Seat Customers
                        </Button>
                        <Button size="sm" variant="outline">
                          <Clock className="w-4 h-4 mr-1" />
                          Make Reservation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}