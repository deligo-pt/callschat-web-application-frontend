'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type {
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
} from '@/types/feedback.types';
import {
  Clock,
  Eye,
  Wrench,
  CheckCircle2,
  Archive,
  RotateCcw,
  Bug,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
  Flame,
  ArrowDown,
  Minus,
  ArrowUp,
} from 'lucide-react';

// =============================================================================
// Status Badge
// =============================================================================

interface StatusConfig {
  label: string;
  classes: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIGS: Record<FeedbackStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: Clock,
  },
  REVIEWING: {
    label: 'Reviewing',
    classes: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: Eye,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    classes: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: Wrench,
  },
  RESOLVED: {
    label: 'Resolved',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: CheckCircle2,
  },
  CLOSED: {
    label: 'Closed',
    classes: 'bg-slate-100 text-slate-600 border-slate-200/80',
    icon: Archive,
  },
  REOPENED: {
    label: 'Reopened',
    classes: 'bg-orange-50 text-orange-700 border-orange-200/80',
    icon: RotateCcw,
  },
};

export function FeedbackStatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: FeedbackStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const config = STATUS_CONFIGS[status] || {
    label: status,
    classes: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}

// =============================================================================
// Priority Badge
// =============================================================================

interface PriorityConfig {
  label: string;
  classes: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIORITY_CONFIGS: Record<FeedbackPriority, PriorityConfig> = {
  LOW: {
    label: 'Low',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: ArrowDown,
  },
  MEDIUM: {
    label: 'Medium',
    classes: 'bg-blue-50 text-blue-700 border-blue-200/70',
    icon: Minus,
  },
  HIGH: {
    label: 'High',
    classes: 'bg-amber-50 text-amber-700 border-amber-200/70',
    icon: ArrowUp,
  },
  CRITICAL: {
    label: 'Critical',
    classes: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
    icon: Flame,
  },
};

export function FeedbackPriorityBadge({
  priority,
  className,
  showIcon = true,
}: {
  priority: FeedbackPriority;
  className?: string;
  showIcon?: boolean;
}) {
  const config = PRIORITY_CONFIGS[priority] || PRIORITY_CONFIGS.MEDIUM;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}

// =============================================================================
// Type Badge
// =============================================================================

interface TypeConfig {
  label: string;
  classes: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TYPE_CONFIGS: Record<FeedbackType, TypeConfig> = {
  BUG: {
    label: 'Bug Report',
    classes: 'bg-rose-50 text-rose-700 border-rose-200/70',
    icon: Bug,
  },
  IMPROVEMENT: {
    label: 'Improvement',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    icon: Lightbulb,
  },
  REPORT: {
    label: 'Report',
    classes: 'bg-amber-50 text-amber-700 border-amber-200/70',
    icon: ShieldAlert,
  },
  OTHER: {
    label: 'General',
    classes: 'bg-slate-50 text-slate-700 border-slate-200/70',
    icon: HelpCircle,
  },
};

export function FeedbackTypeBadge({
  type,
  className,
  showIcon = true,
}: {
  type: FeedbackType;
  className?: string;
  showIcon?: boolean;
}) {
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.BUG;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
