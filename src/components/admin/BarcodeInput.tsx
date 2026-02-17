'use client';

import { useState, useEffect, useRef } from 'react';
import { Scan, X, Check, AlertCircle, Camera } from 'lucide-react';

type ScanButtonState = 'idle' | 'scanning' | 'success' | 'error';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (barcode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Componente de input para códigos de barras
 * Soporta entrada manual y lectores físicos (que funcionan como teclados virtuales)
 * 
 * Características:
 * - Detección automática de lectura desde dispositivo físico
 * - Debouncing para evitar lecturas duplicadas
 * - Feedback visual de lectura exitosa/fallida
 * - Auto-focus para lectores plug-and-play
 * - Botón manual para activar el modo de escaneo
 */
export default function BarcodeInput({
  value,
  onChange,
  onScan,
  placeholder = 'Escanea o ingresa el código de barras',
  disabled = false,
  autoFocus = true
}: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<boolean | null>(null);
  const [scanButtonState, setScanButtonState] = useState<ScanButtonState>('idle');
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const lastInputTimeRef = useRef<number>(0);

  // Constantes para detección de lector
  const SCAN_SPEED_THRESHOLD = 50; // ms entre caracteres para detectar lector
  const DEBOUNCE_TIME = 300; // ms para evitar lecturas duplicadas

  useEffect(() => {
    // Mantener focus para lectores plug-and-play
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastInputTimeRef.current;

    // Detectar si es un lector de código de barras (entrada rápida)
    if (timeDiff < SCAN_SPEED_THRESHOLD && newValue.length > value.length) {
      setIsScanning(true);
    }

    lastInputTimeRef.current = currentTime;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Detectar Enter (común cuando el lector termina de leer)
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      handleScan();
    }
  };

  const handleScan = () => {
    if (!value.trim()) return;

    setIsScanning(false);

    // Clear previous timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Callback de escaneo exitoso
    if (onScan) {
      onScan(value.trim());
    }

    // Mostrar feedback de éxito
    setScanSuccess(true);

    // Limpiar feedback después de 2 segundos
    scanTimeoutRef.current = setTimeout(() => {
      setScanSuccess(null);
    }, 2000);
  };

  const handleBlur = () => {
    // Si se pierde el foco durante un escaneo, completarlo
    if (isScanning && value.trim()) {
      handleScan();
    }
  };

  // Función para activar el modo de escaneo manualmente
  const handleScanButtonClick = () => {
    if (scanButtonState === 'scanning') return; // Ya está escaneando
    
    // Limpiar valor anterior si hay error
    if (scanButtonState === 'error') {
      onChange('');
      setScanSuccess(null);
    }

    // Cambiar a estado de escaneo
    setScanButtonState('scanning');
    setIsScanning(true);
    
    // Focus en el input para recibir la lectura del dispositivo
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Simulación: después de 3 segundos, simular éxito o permitir que el usuario escanee
    // En producción real, esto se activaría cuando el lector físico envíe datos
    const simulationTimeout = setTimeout(() => {
      if (value.trim()) {
        // Si hay un valor, marcarlo como exitoso
        setScanButtonState('success');
        setIsScanning(false);
        setScanSuccess(true);
        
        if (onScan) {
          onScan(value.trim());
        }

        // Resetear después de 2 segundos
        setTimeout(() => {
          setScanButtonState('idle');
          setScanSuccess(null);
        }, 2000);
      } else {
        // Si no hay valor después de 5 segundos, marcar como error
        setTimeout(() => {
          if (!value.trim() && scanButtonState === 'scanning') {
            setScanButtonState('error');
            setIsScanning(false);
            setScanSuccess(false);
          }
        }, 2000);
      }
    }, 100);

    // Limpiar timeout al desmontar
    return () => clearTimeout(simulationTimeout);
  };

  // Monitorear cambios en el valor durante el modo de escaneo
  useEffect(() => {
    if (scanButtonState === 'scanning' && value.trim().length >= 8) {
      // Auto-completar cuando se detecta un código válido
      setScanButtonState('success');
      setIsScanning(false);
      setScanSuccess(true);
      
      if (onScan) {
        onScan(value.trim());
      }

      // Resetear después de 2 segundos
      const resetTimeout = setTimeout(() => {
        setScanButtonState('idle');
        setScanSuccess(null);
      }, 2000);

      return () => clearTimeout(resetTimeout);
    }
  }, [value, scanButtonState, onScan]);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Botón de Escaneo */}
      <button
        type="button"
        onClick={handleScanButtonClick}
        disabled={disabled || scanButtonState === 'scanning'}
        className={`
          w-full px-4 py-3 rounded-lg font-medium
          flex items-center justify-center gap-2
          transition-all duration-200
          disabled:cursor-not-allowed
          ${
            scanButtonState === 'idle'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : scanButtonState === 'scanning'
              ? 'bg-blue-500 text-white cursor-wait'
              : scanButtonState === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }
        `}
      >
        {scanButtonState === 'idle' && (
          <>
            <Camera size={20} />
            Escanear
          </>
        )}
        {scanButtonState === 'scanning' && (
          <>
            <Scan size={20} className="animate-pulse" />
            Escaneando...
          </>
        )}
        {scanButtonState === 'success' && (
          <>
            <Check size={20} />
            Escaneado
          </>
        )}
        {scanButtonState === 'error' && (
          <>
            <AlertCircle size={20} />
            Reintentar
          </>
        )}
      </button>

      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isScanning ? (
              <Scan className="text-blue-500 animate-pulse" size={20} />
            ) : scanSuccess === true ? (
              <Check className="text-emerald-500" size={20} />
            ) : scanSuccess === false ? (
              <AlertCircle className="text-red-500" size={20} />
            ) : (
              <Scan className="text-gray-400" size={20} />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-10 py-2 border rounded-lg
              focus:ring-2 focus:ring-emerald-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${isScanning ? 'border-blue-500 bg-blue-50' : ''}
              ${scanSuccess === true ? 'border-emerald-500 bg-emerald-50' : ''}
              ${scanSuccess === false ? 'border-red-500 bg-red-50' : ''}
              ${!isScanning && scanSuccess === null ? 'border-gray-300' : ''}
              transition-colors duration-200
            `}
          />

          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setScanSuccess(null);
                setScanButtonState('idle');
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Indicadores de estado */}
        <div className="mt-1 min-h-[20px]">
          {isScanning && scanButtonState === 'scanning' && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-pulse"></span>
              Esperando lectura del dispositivo...
            </p>
          )}
          {scanSuccess === true && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <Check size={12} />
              Código escaneado correctamente
            </p>
          )}
          {scanSuccess === false && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} />
              Error al escanear código
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook personalizado para manejar lectores de código de barras a nivel global
 * Útil para capturar escaneos en cualquier parte de la aplicación
 */
export function useBarcodeScanner(callback: (barcode: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const barcodeBuffer = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isListening) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      // Si pasa mucho tiempo entre teclas, limpiar buffer
      if (timeDiff > 100) {
        barcodeBuffer.current = '';
      }

      lastKeyTimeRef.current = currentTime;

      // Detectar Enter (fin de escaneo)
      if (e.key === 'Enter' && barcodeBuffer.current.length > 0) {
        e.preventDefault();
        callback(barcodeBuffer.current);
        barcodeBuffer.current = '';
        return;
      }

      // Acumular caracteres
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [isListening, callback]);

  return { isListening, setIsListening };
}

/**
 * Validación de formatos de código de barras
 */
export const validateBarcodeFormat = (barcode: string): {
  isValid: boolean;
  format: string | null;
  message: string;
} => {
  const cleaned = barcode.trim();

  // EAN-13 (13 dígitos)
  if (/^\d{13}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'EAN-13',
      message: 'Código EAN-13 válido'
    };
  }

  // UPC-A (12 dígitos)
  if (/^\d{12}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'UPC-A',
      message: 'Código UPC-A válido'
    };
  }

  // EAN-8 (8 dígitos)
  if (/^\d{8}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'EAN-8',
      message: 'Código EAN-8 válido'
    };
  }

  // Code128 (alfanumérico)
  if (/^[A-Za-z0-9\-_]{4,}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'Code128',
      message: 'Código Code128 válido'
    };
  }

  // Código personalizado (mínimo 3 caracteres)
  if (cleaned.length >= 3) {
    return {
      isValid: true,
      format: 'Custom',
      message: 'Código personalizado válido'
    };
  }

  return {
    isValid: false,
    format: null,
    message: 'Formato de código de barras no válido'
  };
};
