"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  notifications?: number;
  quickActions?: Array<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
  onLogout?: () => void;
}

export function ModernDashboardLayout({
  children,
  title,
  subtitle,
  user,
  notifications = 0,
  quickActions = [],
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/60 border-gray-200/60 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <div className="hidden lg:flex items-center space-x-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    className="text-xs"
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.role}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {onLogout && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLogout}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Search */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 p-4 z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}

// Quick Actions Panel Component
export function QuickActionsPanel({ 
  actions,
  className = ''
}: { 
  actions: Array<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    color?: string;
  }>;
  className?: string;
}) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onClick}
            className="w-full p-4 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg group-hover:scale-110 transition-transform duration-200",
                action.color || "bg-blue-100 text-blue-600"
              )}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </CardContent>
    </Card>
  );
}

// Notification Center Component
export function NotificationCenter({ 
  notifications,
  className = ''
}: {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
  }>;
  className?: string;
}) {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
          <Badge variant="secondary">{notifications.filter(n => !n.read).length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border transition-colors duration-200 cursor-pointer hover:shadow-sm",
                getNotificationColor(notification.type),
                !notification.read && "ring-2 ring-offset-1 ring-blue-200"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-sm text-gray-900">
                  {notification.title}
                </h4>
                <span className="text-xs text-gray-500">
                  {notification.time}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {notification.message}
              </p>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}