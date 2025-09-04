'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, MapPin, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
  assignedTo?: string;
  location?: string;
  duration?: number;
}

interface EventTimelineProps {
  eventTitle: string;
  eventDate: Date;
  items: TimelineItem[];
  onItemUpdate?: (itemId: string, status: TimelineItem['status']) => void;
}

export default function EventTimeline({ 
  eventTitle, 
  eventDate, 
  items, 
  onItemUpdate 
}: EventTimelineProps) {
  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'upcoming': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`);
    const timeB = new Date(`2000-01-01 ${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{eventTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {items.filter(item => item.status === 'completed').length} / {items.length} Complete
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${item.status === 'completed' ? 'bg-green-100' : 
                    item.status === 'in-progress' ? 'bg-blue-100' :
                    item.status === 'delayed' ? 'bg-red-100' : 'bg-gray-100'}
                `}>
                  {getStatusIcon(item.status)}
                </div>
                {index < sortedItems.length - 1 && (
                  <div className="w-0.5 h-12 bg-border mt-2"></div>
                )}
              </div>

              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.time}</span>
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {item.assignedTo && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.assignedTo}
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.duration} min
                    </div>
                  )}
                </div>

                {item.status !== 'completed' && onItemUpdate && (
                  <div className="flex gap-2">
                    {item.status === 'upcoming' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onItemUpdate(item.id, 'in-progress')}
                      >
                        Start Task
                      </Button>
                    )}
                    {item.status === 'in-progress' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => onItemUpdate(item.id, 'completed')}
                        >
                          Mark Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onItemUpdate(item.id, 'delayed')}
                        >
                          Mark Delayed
                        </Button>
                      </>
                    )}
                    {item.status === 'delayed' && (
                      <Button 
                        size="sm"
                        onClick={() => onItemUpdate(item.id, 'in-progress')}
                      >
                        Resume Task
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {items.filter(item => item.status === 'completed').length}
              </div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {items.filter(item => item.status === 'in-progress').length}
              </div>
              <div className="text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">
                {items.filter(item => item.status === 'upcoming').length}
              </div>
              <div className="text-muted-foreground">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {items.filter(item => item.status === 'delayed').length}
              </div>
              <div className="text-muted-foreground">Delayed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}