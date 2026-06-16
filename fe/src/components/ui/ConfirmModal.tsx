import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4">
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${type === 'danger' ? 'bg-red-100 text-red-600' : 
              type === 'warning' ? 'bg-orange-100 text-orange-600' :
              type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }
          `}>
            {type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 px-2">{message}</p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors shadow-sm
              ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
                type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' :
                type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
