"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Upload, Search, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Basic Loading Spinner
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn("inline-block", className)}
    >
      <Loader2 className={cn("text-blue-500", sizeClasses[size])} />
    </motion.div>
  );
}

// Pulse Loading Animation
export function PulseLoader({ 
  className = '',
  color = 'blue' 
}: { 
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn("w-2 h-2 rounded-full", colorClasses[color])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Skeleton Loading Components
export function SkeletonLoader({ 
  className = '',
  rows = 1,
  height = 'h-4'
}: { 
  className?: string;
  rows?: number;
  height?: string;
}) {
  return (
    <div className={cn("animate-pulse space-y-2", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={cn("bg-gray-200 rounded", height)} />
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ 
  className = '',
  showHeader = true,
  showFooter = false,
  contentRows = 3
}: {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  contentRows?: number;
}) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      {showHeader && (
        <CardHeader className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="animate-pulse">
        <div className="space-y-3">
          {Array.from({ length: contentRows }, (_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded" />
          ))}
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </CardContent>
      {showFooter && (
        <div className="px-6 pb-6 animate-pulse">
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        </div>
      )}
    </Card>
  );
}

// Progress Loading Bar
export function ProgressLoader({ 
  progress,
  label,
  showPercentage = true,
  className = '',
  color = 'blue'
}: {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-pink-600',
    red: 'from-red-500 to-pink-600',
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-500">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={cn("h-2 rounded-full bg-gradient-to-r", colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// Loading Button States
export function LoadingButton({ 
  loading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  [key: string]: any;
}) {
  return (
    <Button
      disabled={loading}
      className={cn(
        "relative transition-all duration-200",
        loading && "cursor-not-allowed opacity-70",
        className
      )}
      variant={variant}
      size={size}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <LoadingSpinner size="sm" />
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}

// Full Screen Loading Overlay
export function LoadingOverlay({ 
  visible = false,
  message = 'Loading...',
  progress,
  onCancel,
  className = ''
}: {
  visible?: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4"
      >
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
          
          {progress !== undefined && (
            <ProgressLoader progress={progress} showPercentage />
          )}
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="mt-4">
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Shimmer Effect Component
export function ShimmerEffect({ 
  className = '',
  width = '100%',
  height = '20px'
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-gray-200 rounded", className)}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Loading State for Different Actions
export function ActionLoader({ 
  action,
  className = '' 
}: { 
  action: 'uploading' | 'downloading' | 'searching' | 'connecting' | 'processing';
  className?: string;
}) {
  const configs = {
    uploading: { icon: Upload, text: 'Uploading...', color: 'text-blue-500' },
    downloading: { icon: Download, text: 'Downloading...', color: 'text-green-500' },
    searching: { icon: Search, text: 'Searching...', color: 'text-purple-500' },
    connecting: { icon: Wifi, text: 'Connecting...', color: 'text-orange-500' },
    processing: { icon: RefreshCw, text: 'Processing...', color: 'text-indigo-500' },
  };

  const config = configs[action];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <motion.div
        animate={{ rotate: action === 'processing' ? 360 : 0 }}
        transition={{
          duration: action === 'processing' ? 1 : 0,
          repeat: action === 'processing' ? Infinity : 0,
          ease: "linear",
        }}
      >
        <Icon className={cn("w-5 h-5", config.color)} />
      </motion.div>
      <span className="text-sm font-medium text-gray-700">{config.text}</span>
      <PulseLoader color={action === 'uploading' ? 'blue' : 'green'} />
    </div>
  );
}

// Network Status Loader
export function NetworkStatusLoader({ 
  isOnline = true,
  className = '' 
}: {
  isOnline?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium",
        isOnline 
          ? "bg-green-100 text-green-800" 
          : "bg-red-100 text-red-800",
        className
      )}
    >
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span>{isOnline ? 'Connected' : 'Offline'}</span>
      {!isOnline && <PulseLoader color="red" />}
    </motion.div>
  );
}

// Table Loading State
export function TableSkeleton({ 
  rows = 5,
  columns = 4,
  className = '' 
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid gap-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="h-6 bg-gray-300 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4 animate-pulse" 
          style={{ 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            animationDelay: `${rowIndex * 100}ms`
          }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List Item Skeleton
export function ListSkeleton({ 
  items = 5,
  showAvatar = true,
  className = '' 
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }, (_, index) => (
        <div 
          key={index} 
          className="flex items-center space-x-3 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {showAvatar && (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}