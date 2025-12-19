import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-float border backdrop-blur-md animate-in slide-in-from-right-full duration-300
                ${toast.type === 'success' 
                    ? 'bg-white/90 border-green-200 text-ink-main' 
                    : 'bg-red-50/90 border-red-200 text-red-800'}
            `}
          >
            {toast.type === 'success' ? (
                <CheckCircle size={18} className="text-apple-green" />
            ) : (
                <AlertCircle size={18} className="text-red-500" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button 
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:bg-black/5 rounded-full p-1"
            >
                <X size={14} className="opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};