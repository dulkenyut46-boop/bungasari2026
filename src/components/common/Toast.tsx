import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900',
    error: 'border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900',
    info: 'border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border p-4 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className={`flex items-center gap-3 ${borders[toast.type]} rounded-xl`}>
        {icons[toast.type]}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {toast.message}
        </p>
      </div>
    </div>
  );
};
