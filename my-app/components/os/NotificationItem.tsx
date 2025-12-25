'use client';

import {
  Calendar,
  CreditCard,
  DoorOpen,
  AlertTriangle,
  Info,
  Star,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItemProps {
  notification: {
    _id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    isRead: boolean;
    createdAt: string;
    link?: string;
    actionLabel?: string;
    actionUrl?: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function getTypeIcon(type: string) {
  const icons: Record<string, any> = {
    booking: Calendar,
    payment: CreditCard,
    room: DoorOpen,
    alert: AlertTriangle,
    system: Info,
    review: Star,
  };
  return icons[type] || Info;
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    booking: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    room: 'bg-purple-100 text-purple-600',
    alert: 'bg-red-100 text-red-600',
    system: 'bg-gray-100 text-gray-600',
    review: 'bg-yellow-100 text-yellow-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    urgent: 'border-l-4 border-l-red-500',
    high: 'border-l-4 border-l-orange-500',
    medium: 'border-l-4 border-l-blue-500',
    low: 'border-l-4 border-l-gray-300',
  };
  return colors[priority] || '';
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const Icon = getTypeIcon(notification.type);
  const typeColor = getTypeColor(notification.type);
  const priorityBorder = getPriorityColor(notification.priority);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
    if (notification.link) {
      onClose();
    }
  };

  const content = (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${priorityBorder} ${
        !notification.isRead ? 'bg-indigo-50/30' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm font-semibold text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5"></span>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {getRelativeTime(notification.createdAt)}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {notification.actionUrl && notification.actionLabel && (
                <Link
                  href={notification.actionUrl}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  {notification.actionLabel}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification._id);
                }}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.link && !notification.actionUrl) {
    return (
      <Link href={notification.link} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}
