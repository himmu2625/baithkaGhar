'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar, CheckCircle2, Clock, MapPin, Plus, Star, Timer, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HousekeepingTask {
  _id: string;
  taskCode: string;
  title: string;
  description: string;
  taskType: 'cleaning' | 'inspection' | 'maintenance' | 'setup' | 'inventory_check' | 'deep_cleaning' | 'sanitization' | 'laundry' | 'restocking';
  taskCategory: 'routine' | 'checkout_cleaning' | 'checkin_preparation' | 'maintenance_support' | 'special_request' | 'emergency' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'scheduled' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'delayed' | 'failed' | 'requires_inspection';

  scheduling: {
    scheduledDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    actualStartTime?: Date;
    actualEndTime?: Date;
  };

  assignment: {
    assignedTo?: {
      _id: string;
      name: string;
      email: string;
    };
    assignedBy: {
      _id: string;
      name: string;
    };
  };

  roomId?: {
    _id: string;
    roomNumber: string;
    floor: number;
  };

  progress: {
    percentComplete: number;
    checklistItems?: Array<{
      item: string;
      completed: boolean;
      completedAt?: Date;
    }>;
  };

  estimatedDuration: number;
  actualDuration?: number;

  qualityControl: {
    requiresInspection: boolean;
    inspectionScore?: number;
    approvedBy?: {
      _id: string;
      name: string;
    };
  };
}

interface TaskStatistics {
  tasks: {
    total: number;
    today: number;
    pending: number;
    inProgress: number;
    completed: number;
    delayed: number;
    cancelled: number;
    avgCompletionTime: number;
  };
  staff: {
    totalAssigned: number;
    workload: Array<{
      staffName: string;
      activeTasks: number;
      urgentTasks: number;
    }>;
  };
  rooms: {
    totalRooms: number;
    clean: number;
    dirty: number;
    inProgress: number;
    inspected: number;
    maintenanceRequired: number;
  };
}

interface HousekeepingDashboardProps {
  propertyId: string;
  staffId: string;
  tasks: HousekeepingTask[];
  onTaskComplete: (taskId: string) => void;
}

export default function HousekeepingDashboard({ propertyId, staffId, tasks: initialTasks, onTaskComplete }: HousekeepingDashboardProps) {
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'cleaning' as const,
    taskCategory: 'routine' as const,
    priority: 'medium' as const,
    roomId: '',
    estimatedDuration: 30,
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:00',
  });

  useEffect(() => {
    fetchHousekeepingData();
  }, [propertyId, staffId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter]);

  const fetchHousekeepingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/housekeeping?propertyId=${propertyId}&staffId=${staffId}&includeStats=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch housekeeping data');
      }

      const data = await response.json();
      setTasks(data.data.tasks);
      setStatistics(data.data.statistics);
    } catch (error) {
      console.error('Error fetching housekeeping data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load housekeeping data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Sort by priority and scheduled time
    filtered.sort((a, b) => {
      const priorityOrder = { emergency: 5, urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.scheduling.scheduledDate).getTime() - new Date(b.scheduling.scheduledDate).getTime();
    });

    setFilteredTasks(filtered);
  };

  const updateTaskStatus = async (taskId: string, status: string, updates?: any) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/housekeeping/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const data = await response.json();
      const updatedTask = data.data.task;

      setTasks(prev => prev.map(task => task._id === taskId ? updatedTask : task));

      if (status === 'completed') {
        onTaskComplete(taskId);
      }

      toast({
        title: 'Success',
        description: `Task ${status === 'completed' ? 'completed' : 'updated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/os/housekeeping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          propertyId,
          staffId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      setTasks(prev => [...prev, data.data.task]);
      setShowCreateDialog(false);
      resetNewTaskForm();

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      taskType: 'cleaning',
      taskCategory: 'routine',
      priority: 'medium',
      roomId: '',
      estimatedDuration: 30,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledStartTime: '09:00',
      scheduledEndTime: '10:00',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
      emergency: 'bg-red-600',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-gray-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      paused: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      delayed: 'bg-purple-500',
      failed: 'bg-red-600',
      requires_inspection: 'bg-indigo-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getTaskTypeIcon = (type: string) => {
    const icons = {
      cleaning: '🧹',
      inspection: '🔍',
      maintenance: '🔧',
      setup: '⚙️',
      inventory_check: '📋',
      deep_cleaning: '🧽',
      sanitization: '🧴',
      laundry: '👕',
      restocking: '📦',
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getTodaysTasks = () => {
    const today = new Date().toDateString();
    return tasks.filter(task => new Date(task.scheduling.scheduledDate).toDateString() === today);
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      const scheduledEnd = new Date(task.scheduling.scheduledDate);
      const [hours, minutes] = task.scheduling.scheduledEndTime.split(':');
      scheduledEnd.setHours(parseInt(hours), parseInt(minutes));
      return now > scheduledEnd && !['completed', 'cancelled'].includes(task.status);
    });
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Housekeeping Dashboard</h1>
          <p className="text-gray-600">Manage housekeeping tasks and schedules</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Housekeeping Task</DialogTitle>
              <DialogDescription>
                Create a new housekeeping task for your property.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select
                    value={newTask.taskType}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, taskType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="setup">Setup</SelectItem>
                      <SelectItem value="inventory_check">Inventory Check</SelectItem>
                      <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="sanitization">Sanitization</SelectItem>
                      <SelectItem value="laundry">Laundry</SelectItem>
                      <SelectItem value="restocking">Restocking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taskCategory">Category</Label>
                  <Select
                    value={newTask.taskCategory}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, taskCategory: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="checkout_cleaning">Checkout Cleaning</SelectItem>
                      <SelectItem value="checkin_preparation">Check-in Preparation</SelectItem>
                      <SelectItem value="maintenance_support">Maintenance Support</SelectItem>
                      <SelectItem value="special_request">Special Request</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedDuration">Duration (min)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="5"
                    value={newTask.estimatedDuration}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={newTask.scheduledDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newTask.scheduledStartTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newTask.scheduledEndTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, scheduledEndTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createTask} disabled={!newTask.title || !newTask.description}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Today's Tasks</p>
                  <p className="text-2xl font-bold">{statistics.tasks.today}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{statistics.tasks.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{statistics.tasks.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold">{getOverdueTasks().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-2xl">{getTaskTypeIcon(task.taskType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`${getStatusColor(task.status)} text-white`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {task.roomId && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>Room {task.roomId.roomNumber}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{task.scheduling.scheduledStartTime} - {task.scheduling.scheduledEndTime}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Timer className="h-4 w-4" />
                              <span>{task.estimatedDuration}min</span>
                            </div>
                          </div>

                          {task.progress.percentComplete > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{task.progress.percentComplete}%</span>
                              </div>
                              <Progress value={task.progress.percentComplete} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {task.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task._id, 'in_progress', { actualStartTime: new Date() })}
                          >
                            Start
                          </Button>
                        )}

                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task._id, 'completed', {
                              actualEndTime: new Date(),
                              actualDuration: task.estimatedDuration // Could calculate based on actual time
                            })}
                          >
                            Complete
                          </Button>
                        )}

                        {task.status === 'completed' && task.qualityControl.requiresInspection && !task.qualityControl.approvedBy && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTask(task)}
                          >
                            Inspect
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskDialog(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks ({getTodaysTasks().length})</CardTitle>
              <CardDescription>
                Tasks scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {getTodaysTasks().map((task) => (
                    <div key={task._id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <span>{getTaskTypeIcon(task.taskType)}</span>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-600">
                            {task.scheduling.scheduledStartTime} - {task.scheduling.scheduledEndTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                          {task.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(task.status)} text-white`}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {getTodaysTasks().length === 0 && (
                    <p className="text-gray-500 text-center py-8">No tasks scheduled for today</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Overdue Tasks ({getOverdueTasks().length})</span>
              </CardTitle>
              <CardDescription>
                Tasks that are past their scheduled completion time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {getOverdueTasks().map((task) => (
                    <div key={task._id} className="flex justify-between items-center p-3 border rounded border-red-200 bg-red-50">
                      <div className="flex items-center space-x-3">
                        <span>{getTaskTypeIcon(task.taskType)}</span>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-red-600">
                            Due: {new Date(task.scheduling.scheduledDate).toLocaleDateString()} {task.scheduling.scheduledEndTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">Overdue</Badge>
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task._id, task.status === 'assigned' ? 'in_progress' : 'completed')}
                        >
                          {task.status === 'assigned' ? 'Start' : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {getOverdueTasks().length === 0 && (
                    <p className="text-gray-500 text-center py-8">No overdue tasks</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Tasks</span>
                    <span className="font-semibold">{statistics.tasks.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">
                      {statistics.tasks.total > 0 ? Math.round((statistics.tasks.completed / statistics.tasks.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Completion Time</span>
                    <span className="font-semibold">{statistics.tasks.avgCompletionTime}min</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Room Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Clean Rooms</span>
                    <Badge className="bg-green-500 text-white">{statistics.rooms.clean}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dirty Rooms</span>
                    <Badge className="bg-red-500 text-white">{statistics.rooms.dirty}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>In Progress</span>
                    <Badge className="bg-yellow-500 text-white">{statistics.rooms.inProgress}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Needs Maintenance</span>
                    <Badge className="bg-orange-500 text-white">{statistics.rooms.maintenanceRequired}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTaskTypeIcon(selectedTask.taskType)}</span>
                <div>
                  <h3 className="font-medium text-lg">{selectedTask.title}</h3>
                  <p className="text-sm text-gray-600">{selectedTask.taskCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={`${getStatusColor(selectedTask.status)} text-white mt-1`}>
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} text-white mt-1`}>
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedTask.description}</p>
              </div>

              {selectedTask.progress.checklistItems && selectedTask.progress.checklistItems.length > 0 && (
                <div>
                  <Label>Checklist</Label>
                  <div className="space-y-2 mt-1">
                    {selectedTask.progress.checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          readOnly
                          className="rounded"
                        />
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.qualityControl.inspectionScore && (
                <div>
                  <Label>Quality Score</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{selectedTask.qualityControl.inspectionScore}/10</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}