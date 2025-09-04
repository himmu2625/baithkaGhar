"use client"

import React, { useEffect, useState } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Users, 
  Calendar,
  FileText,
  Eye,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  type: 'housekeeping' | 'maintenance' | 'checkin' | 'checkout' | 'report' | 'guest_request'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  assignedTo?: string
  description?: string
}

const getTaskIcon = (type: string) => {
  switch (type) {
    case 'housekeeping': return <CheckSquare className="w-4 h-4" />
    case 'maintenance': return <Wrench className="w-4 h-4" />
    case 'checkin': 
    case 'checkout': return <Users className="w-4 h-4" />
    case 'report': return <FileText className="w-4 h-4" />
    case 'guest_request': return <Calendar className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800 border-green-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function PendingTasks() {
  const { user } = useOSAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!user?.propertyId) {
          console.warn('No property ID found in user context, cannot fetch tasks')
          setIsLoading(false)
          return
        }

        const propertyId = user.propertyId

        // Fetch real tasks from API
        const response = await fetch(`/api/os/tasks/pending?propertyId=${propertyId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setTasks(data.data || [])
        } else {
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        // Set empty array instead of showing error to user
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [user?.propertyId])

  const formatTimeRemaining = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffMs < 0) {
      return "Overdue"
    } else if (diffHours < 1) {
      return `${diffMinutes}m`
    } else {
      return `${diffHours}h ${diffMinutes}m`
    }
  }

  const displayedTasks = showAll ? tasks : tasks.slice(0, 5)
  const urgentTasks = tasks.filter(task => task.priority === 'urgent').length
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Pending Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Pending Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            {urgentTasks > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentTasks} urgent
              </Badge>
            )}
            {highPriorityTasks > 0 && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                {highPriorityTasks} high
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <p className="text-sm text-gray-600">Tasks to complete</p>
            </div>
            {tasks.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showAll ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTaskIcon(task.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    {task.assignedTo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned to: {task.assignedTo}
                      </p>
                    )}
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                  <div className="text-xs text-gray-500 min-w-0">
                    {formatTimeRemaining(task.dueDate)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                      <DropdownMenuItem>Reassign</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending tasks</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
