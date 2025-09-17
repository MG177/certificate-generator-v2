'use client';

import { CheckCircle, Clock, XCircle, AlertCircle, Mail } from 'lucide-react';
import { EmailStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EmailStatusIndicatorProps {
  status: EmailStatus;
  lastSent?: Date;
  retryCount?: number;
  error?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  not_sent: {
    icon: Mail,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    label: 'Not Sent',
    description: 'Email has not been sent yet',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    label: 'Pending',
    description: 'Email is being processed',
  },
  sent: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Sent',
    description: 'Email was sent successfully',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Failed',
    description: 'Email sending failed',
  },
  bounced: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Bounced',
    description: 'Email was rejected by recipient server',
  },
};

export function EmailStatusIndicator({
  status,
  lastSent,
  retryCount = 0,
  error,
  showDetails = false,
  size = 'md',
  className,
}: EmailStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const formatLastSent = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          config.bgColor
        )}
      >
        <Icon className={cn(sizeClasses[size], config.color)} />
      </div>

      {showDetails && (
        <div className="flex flex-col">
          <span className={cn('text-sm font-medium', config.color)}>
            {config.label}
          </span>
          {lastSent && (
            <span className="text-xs text-gray-500">
              {formatLastSent(lastSent)}
            </span>
          )}
          {retryCount > 0 && (
            <span className="text-xs text-gray-500">Retry {retryCount}</span>
          )}
          {error && status === 'failed' && (
            <span
              className="text-xs text-red-500 truncate max-w-32"
              title={error}
            >
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface EmailStatusBadgeProps {
  status: EmailStatus;
  className?: string;
}

export function EmailStatusBadge({ status, className }: EmailStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <config.icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}

interface EmailStatusTooltipProps {
  status: EmailStatus;
  lastSent?: Date;
  retryCount?: number;
  error?: string;
  children: React.ReactNode;
}

export function EmailStatusTooltip({
  status,
  lastSent,
  retryCount = 0,
  error,
  children,
}: EmailStatusTooltipProps) {
  const config = statusConfig[status];

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{config.label}</div>
      <div className="text-xs text-gray-300">{config.description}</div>
      {lastSent && (
        <div className="text-xs text-gray-300">
          Last sent: {lastSent.toLocaleString()}
        </div>
      )}
      {retryCount > 0 && (
        <div className="text-xs text-gray-300">
          Retry attempts: {retryCount}
        </div>
      )}
      {error && status === 'failed' && (
        <div className="text-xs text-red-300 max-w-48 break-words">
          Error: {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {tooltipContent}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
