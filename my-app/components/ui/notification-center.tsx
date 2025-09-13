"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  Filter,
  Search,
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Settings,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'commission' | 'social';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  avatar?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  disabled?: boolean;
  badge?: string;
}

const NOTIFICATION_COLORS = {
  info: 'border-blue-200 bg-blue-50',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  error: 'border-red-200 bg-red-50',
  booking: 'border-purple-200 bg-purple-50',
  commission: 'border-green-200 bg-green-50',
  social: 'border-pink-200 bg-pink-50',
};

const NOTIFICATION_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  booking: Calendar,
  commission: DollarSign,
  social: Users,
};

// Notification Center Component
export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  className = '',
}: {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  className?: string;
}) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read) ||
      notification.type === filter;
    
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default: // newest
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    return NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Info;
  };

  const getNotificationColor = (type: string) => {
    return NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || NOTIFICATION_COLORS.info;
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl font-bold">
            <div className="relative">
              <Bell className="w-6 h-6 mr-2 text-blue-500" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
            Notifications
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="max-h-96 overflow-y-auto px-6">
          <AnimatePresence>
            {sortedNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              sortedNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-lg border mb-3 transition-all duration-200 cursor-pointer hover:shadow-sm",
                      getNotificationColor(notification.type),
                      !notification.read && "ring-2 ring-offset-1 ring-blue-200"
                    )}
                    onClick={() => !notification.read && onMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${!notification.read ? 'bg-white/70' : 'bg-white/40'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={cn(
                              "font-medium text-sm",
                              !notification.read ? "text-gray-900" : "text-gray-700"
                            )}>
                              {notification.title}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getPriorityBadgeColor(notification.priority))}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                          
                          <p className={cn(
                            "text-sm mb-2",
                            !notification.read ? "text-gray-700" : "text-gray-600"
                          )}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(notification.timestamp)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                            </div>
                            
                            {notification.actionUrl && notification.actionLabel && (
                              <Button variant="outline" size="sm" className="text-xs">
                                {notification.actionLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Actions Panel
export function QuickActionsPanel({
  actions,
  className = '',
}: {
  actions: QuickAction[];
  className?: string;
}) {
  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "p-4 rounded-xl text-left transition-all duration-200 group relative overflow-hidden",
              action.disabled 
                ? "opacity-50 cursor-not-allowed bg-gray-100" 
                : "hover:shadow-md active:scale-95 bg-gradient-to-br",
              action.color
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: action.disabled ? 1 : 1.02 }}
            whileTap={{ scale: action.disabled ? 1 : 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <action.icon className="w-5 h-5 text-white" />
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-white mb-1 group-hover:scale-105 transition-transform">
                  {action.title}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </div>
            
            {!action.disabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </motion.button>
        ))}
      </CardContent>
    </Card>
  );
}

// Combined Notification and Actions Dashboard
export function NotificationDashboard({
  notifications,
  quickActions,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  className = '',
}: {
  notifications: Notification[];
  quickActions: QuickAction[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <QuickActionsPanel actions={quickActions} />
      <NotificationCenter
        notifications={notifications}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDeleteNotification={onDeleteNotification}
      />
    </div>
  );
}

// Floating Notification Bell
export function FloatingNotificationBell({
  notificationCount,
  onClick,
  className = '',
}: {
  notificationCount: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50",
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="relative">
        <Bell className="w-6 h-6" />
        {notificationCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}