'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Singleton pattern para evitar múltiples instancias de Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!key) {
      console.error('Stripe publishable key no está configurada');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(key);
  }
  
  return stripePromise;
};

// Configuración de estilos para Stripe Elements que coincide con el diseño de Fitovida
export const stripeElementsOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a2e1a', // var(--foreground)
      fontFamily: '"Nunito", system-ui, sans-serif',
      '::placeholder': {
        color: '#5a7265', // var(--muted)
      },
      iconColor: '#5a9e6f', // var(--primary)
    },
    invalid: {
      color: '#ef4444', // red-500
      iconColor: '#ef4444',
    },
    complete: {
      color: '#5a9e6f', // var(--primary)
      iconColor: '#5a9e6f',
    },
  },
};

// Opciones de apariencia para Elements
export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#5a9e6f',
    colorBackground: '#ffffff',
    colorText: '#1a2e1a',
    colorDanger: '#ef4444',
    fontFamily: '"Nunito", system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '12px',
  },
  rules: {
    '.Input': {
      border: '1px solid #dce8df',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:focus': {
      border: '1px solid #5a9e6f',
      boxShadow: '0 0 0 3px rgba(90, 158, 111, 0.1)',
    },
    '.Label': {
      fontWeight: '500',
      marginBottom: '8px',
    },
  },
};
