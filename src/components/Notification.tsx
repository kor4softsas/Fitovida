'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

function NotificationItem({ message, type = 'success', onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300",
        type === 'success' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Global notification container
export default function NotificationContainer() {
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);
  const cart = useCartStore((state) => state.cart);
  const prevCartLength = useState(cart.length)[0];

  useEffect(() => {
    if (cart.length > prevCartLength) {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message: 'Producto agregado al carrito', type: 'success' }]);
    }
  }, [cart.length, prevCartLength]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
