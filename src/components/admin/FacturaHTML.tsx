'use client';

import { useEffect, useState } from 'react';
import type { Sale } from '@/types/admin';

interface CompanySettings {
  company_name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  website: string;
  tax_rate: number;
  terms_and_conditions: string;
  invoice_footer: string;
  dian_resolution: string;
  dian_range_from: number;
  dian_range_to: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v);

export default function FacturaHTML({ sale }: { sale: Sale }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => null);
  }, []);

  const fecha = new Date(sale.date);
  const fechaStr = fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const taxRate = settings?.tax_rate ?? 19;

  const wrapStyle: React.CSSProperties = {
    padding: 24,
    background: '#fff',
    color: '#111',
    width: 620,
    minHeight: 800,
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    border: '1px solid #ccc',
    borderRadius: 4,
    boxSizing: 'border-box',
  };

  return (
    <div id="factura-html" style={wrapStyle}>
      {/* ===== ENCABEZADO ===== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #167c3c',
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        {/* Logo + datos empresa */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <img
              src="/img/logo.png"
              alt="Logo"
              width={48}
              height={48}
              style={{ objectFit: 'contain', borderRadius: 4 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#167c3c' }}>
                {settings?.company_name || 'Fitovida SAS'}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>
                NIT: {settings?.nit || '---'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
            {(settings?.address || settings?.city || settings?.department) && (
              <div>
                {[settings?.address, settings?.city, settings?.department].filter(Boolean).join(', ')}
              </div>
            )}
            {(settings?.phone || settings?.email) && (
              <div>
                {settings?.phone && <span>Tel: {settings.phone}</span>}
                {settings?.phone && settings?.email && <span> | </span>}
                {settings?.email && <span>{settings.email}</span>}
              </div>
            )}
            {settings?.website && <div>{settings.website}</div>}
          </div>
        </div>

        {/* Caja FACTURA DIAN */}
        <div
          style={{
            border: '2px solid #167c3c',
            borderRadius: 4,
            padding: '8px 14px',
            textAlign: 'center',
            minWidth: 185,
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#167c3c', letterSpacing: 1 }}>
            FACTURA DE VENTA
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>
            {(sale as any).invoiceNumber || sale.saleNumber}
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
            Fecha: {fechaStr}
          </div>
          <div style={{ fontSize: 10, color: '#555' }}>Hora: {horaStr}</div>
          {settings?.dian_resolution && (
            <div
              style={{
                fontSize: 9,
                color: '#888',
                marginTop: 4,
                borderTop: '1px dashed #ccc',
                paddingTop: 4,
              }}
            >
              Resolución DIAN: {settings.dian_resolution}
              <br />
              Rango autorizado: {settings.dian_range_from} – {settings.dian_range_to}
            </div>
          )}
        </div>
      </div>

      {/* ===== DATOS CLIENTE ===== */}
      <div
        style={{
          background: '#f5f5f5',
          borderRadius: 4,
          padding: '8px 12px',
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#167c3c', marginBottom: 4, fontSize: 11 }}>
          DATOS DEL CLIENTE / ADQUIRENTE
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
            fontSize: 10,
          }}
        >
          <div>
            <b>Nombre / Razón Social:</b> {sale.customerName}
          </div>
          <div>
            <b>NIT / C.C.:</b> {sale.customerDocument || '222222222222'}
          </div>
          <div>
            <b>Correo:</b> {sale.customerEmail || '—'}
          </div>
          <div>
            <b>Teléfono:</b> {sale.customerPhone || '—'}
          </div>
        </div>
      </div>

      {/* ===== TABLA DE ÍTEMS ===== */}
      <table
        style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}
      >
        <thead>
          <tr style={{ background: '#167c3c', color: '#fff' }}>
            <th style={{ padding: '5px 6px', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '5px 6px', textAlign: 'center', width: 50 }}>Cant.</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>P. Unitario</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 55 }}>%IVA</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>Subtotal</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, idx) => {
              const ivaPct =
                item.tax > 0 && item.subtotal > 0
                  ? Math.round((item.tax / item.subtotal) * 100)
                  : taxRate;
              return (
                <tr
                  key={item.id}
                  style={{
                    background: idx % 2 === 0 ? '#fafafa' : '#fff',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <td style={{ padding: '4px 6px' }}>{item.productName}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{ivaPct}%</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.subtotal)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {fmt(item.total)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={6}
                style={{ padding: 8, textAlign: 'center', color: '#999' }}
              >
                Sin ítems registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== TOTALES ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <table style={{ fontSize: 11, minWidth: 240, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 8px', color: '#555' }}>Subtotal (base gravable):</td>
              <td style={{ padding: '2px 8px', textAlign: 'right' }}>{fmt(sale.subtotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 8px', color: '#555' }}>
                IVA ({taxRate}%):
              </td>
              <td style={{ padding: '2px 8px', textAlign: 'right' }}>{fmt(sale.tax)}</td>
            </tr>
            {sale.discount > 0 && (
              <tr>
                <td style={{ padding: '2px 8px', color: '#167c3c' }}>Descuento:</td>
                <td style={{ padding: '2px 8px', textAlign: 'right', color: '#167c3c' }}>
                  -{fmt(sale.discount)}
                </td>
              </tr>
            )}
            <tr style={{ borderTop: '2px solid #167c3c' }}>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: 13 }}>TOTAL A PAGAR:</td>
              <td
                style={{
                  padding: '4px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: '#167c3c',
                }}
              >
                {fmt(sale.total)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: '2px 8px', fontSize: 9, color: '#888' }}>
                Forma de pago:{' '}
                {
                  ({
                    cash: 'Efectivo',
                    card: 'Tarjeta débito/crédito',
                    transfer: 'Transferencia bancaria',
                    pse: 'PSE',
                    wompi: 'Wompi',
                  } as Record<string, string>)[sale.paymentMethod] || sale.paymentMethod
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== PIE DE PÁGINA ===== */}
      <div
        style={{
          borderTop: '1px solid #ddd',
          paddingTop: 10,
          fontSize: 9,
          color: '#666',
          display: 'flex',
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <b>Términos y Condiciones:</b>
          <br />
          {settings?.terms_and_conditions || 'Según normativa vigente.'}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <b>Notas:</b>
          <br />
          {settings?.invoice_footer || 'Gracias por su compra.'}
        </div>
      </div>

      {/* ===== CUFE ===== */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 8,
          borderTop: '1px dashed #ccc',
          fontSize: 8,
          color: '#aaa',
          textAlign: 'center',
        }}
      >
        <div>
          Factura Electrónica de Venta —{' '}
          {settings?.company_name || 'Fitovida SAS'} — NIT: {settings?.nit || ''}
        </div>
        <div>
          Este documento es la representación gráfica de la Factura Electrónica de Venta
        </div>
        <div>CUFE: {sale.id || '—'}</div>
      </div>
    </div>
  );
}
