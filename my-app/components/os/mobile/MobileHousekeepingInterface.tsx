'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MapPin,
  Play,
  Pause,
  Square,
  ChevronLeft,
  Menu,
  Bell,
  User,
  RotateCcw,
  Star,
  MessageSquare,
  QrCode
} from 'lucide-react';
import StatusIndicator from '@/components/os/common/StatusIndicator';
import LoadingSpinner from '@/components/os/common/LoadingSpinner';
import { useRealtime } from '@/components/os/realtime/RealtimeProvider';

interface MobileTask {
  id: string;
  type: string;
  roomNumber: string;
  roomId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  description?: string;
  instructions: string[];
  checklist: Array<{
    id: string;
    item: string;
    completed: boolean;
    required: boolean;
  }>;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  photos?: string[];
  notes?: string;
  qualityCheck?: {
    rating: number;
    feedback: string;
  };
}

export default function MobileHousekeepingInterface() {
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [currentTask, setCurrentTask] = useState<MobileTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const { updateHousekeepingTask, housekeepingUpdates } = useRealtime();

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentTask) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentTask]);

  useEffect(() => {
    setNotifications(housekeepingUpdates.length);
  }, [housekeepingUpdates]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/os/housekeeping/mobile');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (task: MobileTask) => {
    setCurrentTask({ ...task, status: 'in_progress', startedAt: new Date() });
    setTimer(0);
    setIsTimerRunning(true);

    try {
      await updateHousekeepingTask(task.id, {
        status: 'in_progress',
        assignedTo: localStorage.getItem('userId') || 'current_user',
        roomId: task.roomId
      });

      await fetch(`/api/os/housekeeping/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          startedAt: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const pauseTask = async () => {
    if (!currentTask) return;

    setIsTimerRunning(false);
    const updatedTask = { ...currentTask, status: 'paused' as const, pausedAt: new Date() };
    setCurrentTask(updatedTask);

    try {
      await updateHousekeepingTask(currentTask.id, {
        status: 'paused'
      });

      await fetch(`/api/os/housekeeping/${currentTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paused',
          pausedAt: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to pause task:', error);
    }
  };

  const resumeTask = async () => {
    if (!currentTask) return;

    setIsTimerRunning(true);
    const updatedTask = { ...currentTask, status: 'in_progress' as const };
    setCurrentTask(updatedTask);

    try {
      await updateHousekeepingTask(currentTask.id, {
        status: 'in_progress'
      });

      await fetch(`/api/os/housekeeping/${currentTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress'
        })
      });
    } catch (error) {
      console.error('Failed to resume task:', error);
    }
  };

  const completeTask = async (qualityData: { rating: number; feedback: string; notes: string }) => {
    if (!currentTask) return;

    setIsTimerRunning(false);
    const updatedTask = {
      ...currentTask,
      status: 'completed' as const,
      completedAt: new Date(),
      qualityCheck: { rating: qualityData.rating, feedback: qualityData.feedback },
      notes: qualityData.notes
    };

    try {
      await updateHousekeepingTask(currentTask.id, {
        status: 'completed',
        completedAt: new Date(),
        notes: qualityData.notes
      });

      await fetch(`/api/os/housekeeping/${currentTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date(),
          qualityControl: {
            rating: qualityData.rating,
            feedback: qualityData.feedback
          },
          notes: qualityData.notes
        })
      });

      setTasks(prev => prev.map(t => t.id === currentTask.id ? updatedTask : t));
      setCurrentTask(null);
      setTimer(0);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const updateChecklist = (itemId: string, completed: boolean) => {
    if (!currentTask) return;

    const updatedTask = {
      ...currentTask,
      checklist: currentTask.checklist.map(item =>
        item.id === itemId ? { ...item, completed } : item
      )
    };
    setCurrentTask(updatedTask);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTasksByStatus = (status: string) => {
    switch (status) {
      case 'today':
        return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      default:
        return tasks;
    }
  };

  if (currentTask) {
    return <TaskExecutionView
      task={currentTask}
      timer={timer}
      isTimerRunning={isTimerRunning}
      onPause={pauseTask}
      onResume={resumeTask}
      onComplete={completeTask}
      onUpdateChecklist={updateChecklist}
      onBack={() => setCurrentTask(null)}
    />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Sheet open={showMenu} onOpenChange={setShowMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Scanner
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Sync Data
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">Housekeeping</h1>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>

        <div className="px-4 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">Active</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3">
        {getTasksByStatus(activeTab).map((task) => (
          <Card key={task.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      Room {task.roomNumber}
                    </Badge>
                    <StatusIndicator
                      status={task.priority}
                      type="priority"
                      className="text-xs"
                    />
                  </div>
                  <h3 className="font-medium text-sm">{task.type}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Est. {task.estimatedDuration}min
                  </p>
                </div>
                <StatusIndicator
                  status={task.status}
                  type="task"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Room {task.roomNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.estimatedDuration}m
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => startTask(task)}
                  disabled={task.status !== 'pending'}
                  className="h-8 px-3 text-xs"
                >
                  {task.status === 'pending' ? (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </>
                  ) : task.status === 'in_progress' ? (
                    'Resume'
                  ) : (
                    'View'
                  )}
                </Button>
              </div>

              {task.checklist.length > 0 && (
                <div className="mt-3">
                  <Progress
                    value={(task.checklist.filter(item => item.completed).length / task.checklist.length) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {task.checklist.filter(item => item.completed).length} of {task.checklist.length} items
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {getTasksByStatus(activeTab).length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tasks in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskExecutionView({
  task,
  timer,
  isTimerRunning,
  onPause,
  onResume,
  onComplete,
  onUpdateChecklist,
  onBack
}: {
  task: MobileTask;
  timer: number;
  isTimerRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: (qualityData: { rating: number; feedback: string; notes: string }) => void;
  onUpdateChecklist: (itemId: string, completed: boolean) => void;
  onBack: () => void;
}) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState({
    rating: 5,
    feedback: '',
    notes: ''
  });

  const completedItems = task.checklist.filter(item => item.completed).length;
  const totalItems = task.checklist.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const canComplete = task.checklist.filter(item => item.required && !item.completed).length === 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-semibold">Room {task.roomNumber}</h1>
            <p className="text-sm text-gray-600">{task.type}</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Timer */}
        <div className="px-4 pb-4">
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold mb-2">
              {formatTime(timer)}
            </div>
            <div className="flex justify-center gap-2">
              {task.status === 'paused' ? (
                <Button size="sm" onClick={onResume}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => setShowCompletion(true)}
                disabled={!canComplete}
              >
                <Square className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="p-4 space-y-6">
        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">
                {completedItems}/{totalItems}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Instructions */}
        {task.instructions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {task.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Switch
                    checked={item.completed}
                    onCheckedChange={(checked) => onUpdateChecklist(item.id, checked)}
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.item}
                    </p>
                    {item.required && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Please provide feedback for this task completion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Quality Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompletionData(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= completionData.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium">
                Feedback
              </Label>
              <Textarea
                id="feedback"
                placeholder="Any issues or observations..."
                value={completionData.feedback}
                onChange={(e) => setCompletionData(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional comments..."
                value={completionData.notes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletion(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              onComplete(completionData);
              setShowCompletion(false);
            }}>
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}