'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminFeedbackType = 'success' | 'error' | 'warning' | 'info';

type AdminFeedbackMessage = {
  id: number;
  title?: string;
  message: string;
  type: AdminFeedbackType;
};

type AdminFeedbackContextValue = {
  pushMessage: (message: string, type?: AdminFeedbackType, title?: string) => number;
  pushConfirm: (message: string, onConfirm: () => void, title?: string) => void;
};

const AdminFeedbackContext = React.createContext<AdminFeedbackContextValue | null>(null);

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
};

function FeedbackToast({ message, onClose }: { message: AdminFeedbackMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  const iconByType = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <TriangleAlert className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  };

  const classByType = {
    success: 'bg-[#0f7a44] text-white border-[#0f7a44]',
    error: 'bg-[#ba1a1a] text-white border-[#ba1a1a]',
    warning: 'bg-[#b26a00] text-white border-[#b26a00]',
    info: 'bg-[#005236] text-white border-[#005236]'
  };

  return (
    <div className={cn('flex items-start gap-3 rounded-[1.25rem] border px-4 py-3 shadow-lg', classByType[message.type])}>
      <div className="mt-0.5">{iconByType[message.type]}</div>
      <div className="flex-1">
        {message.title && <p className="font-bold leading-tight">{message.title}</p>}
        <p className="text-sm opacity-95">{message.message}</p>
      </div>
      <button onClick={onClose} className="rounded-full p-1 transition hover:bg-white/15">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AdminFeedbackMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: 'Confirmación',
    message: '',
    onConfirm: null
  });

  const pushMessage = (message: string, type: AdminFeedbackType = 'info', title?: string) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    setMessages(prev => [...prev, { id, message, type, title }]);
    return id;
  };

  const pushConfirm = (message: string, onConfirm: () => void, title = 'Confirmación') => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm
    });
  };

  const removeMessage = (id: number) => {
    setMessages(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AdminFeedbackContext.Provider value={{ pushMessage, pushConfirm }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {messages.map(message => (
          <FeedbackToast key={message.id} message={message} onClose={() => removeMessage(message.id)} />
        ))}
      </div>

      {confirmState.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-[#e6e9e8] bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#012d1d]">{confirmState.title}</h3>
                <p className="mt-1 text-sm text-[#414844]">{confirmState.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmState({ open: false, title: 'Confirmación', message: '', onConfirm: null })}
                className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 font-semibold text-[#414844] transition hover:bg-[#f2f4f3]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm?.();
                  setConfirmState({ open: false, title: 'Confirmación', message: '', onConfirm: null });
                }}
                className="rounded-full bg-[#012d1d] px-4 py-2 font-semibold text-white transition hover:bg-[#005236]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const context = React.useContext(AdminFeedbackContext);
  if (!context) {
    throw new Error('useAdminFeedback debe usarse dentro de AdminFeedbackProvider');
  }
  return context;
}
