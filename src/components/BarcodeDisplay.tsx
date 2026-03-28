'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13';
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  className?: string;
}

/**
 * Componente que renderiza un código de barras 1D
 * Usa jsbarcode para generar el SVG
 */
export function BarcodeDisplay({
  value,
  format = 'CODE128',
  width = 2,
  height = 50,
  displayValue = true,
  text,
  className = '',
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!barcodeRef.current || !value) return;

    try {
      JsBarcode(barcodeRef.current, value, {
        format,
        width,
        height,
        displayValue,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 10,
      });
    } catch (error) {
      console.error('Error generando código de barras:', error);
    }
  }, [value, format, width, height, displayValue]);

  if (!value) {
    return <div className={className}>No barcode data</div>;
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg ref={barcodeRef} className="w-full h-auto" />
      {text && <p className="text-xs text-gray-600">{text}</p>}
    </div>
  );
}
