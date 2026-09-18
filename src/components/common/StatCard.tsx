import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  variant?: 'emerald' | 'blue' | 'amber' | 'neutral' | 'slate';
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'emerald',
  badge,
  onClick,
  className,
}) => {
  const iconColorVariants = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-slate-800/90 dark:bg-slate-900',
        onClick && 'cursor-pointer hover:border-emerald-500/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 truncate">
              {title}
            </p>
            {badge && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {value}
          </div>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
            iconColorVariants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold text-xs',
                trend.isNeutral
                  ? 'text-slate-600 dark:text-slate-400'
                  : trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {trend.isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend?.label && <span className="text-slate-400 dark:text-slate-500 truncate">({trend.label})</span>}
        </div>
      )}
    </div>
  );
};
