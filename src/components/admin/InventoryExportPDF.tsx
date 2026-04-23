import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { InventoryExportRow } from '@/lib/admin/inventory-export';

type CompanySettings = {
  company_name?: string;
  nit?: string;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  invoice_footer?: string | null;
};

type InventoryExportPDFProps = {
  rows: InventoryExportRow[];
  generatedAt: Date;
  settings?: CompanySettings;
  logoDataUrl?: string | null;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 42,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#10211b',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d7dedb'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14
  },
  logoBox: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: '#d7dedb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f6f8f7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: 'contain'
  },
  companyBlock: {
    flex: 1,
    gap: 2
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#012d1d'
  },
  companyMeta: {
    fontSize: 8.5,
    color: '#52605b',
    lineHeight: 1.35
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#012d1d'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 9,
    color: '#52605b'
  },
  summaryRow: {
    marginTop: 10,
    flexDirection: 'row'
  },
  summaryCard: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d7dedb',
    borderRadius: 8,
    backgroundColor: '#f6f8f7',
    marginRight: 10
  },
  summaryLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#52605b'
  },
  summaryValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 700,
    color: '#012d1d'
  },
  table: {
    borderWidth: 1,
    borderColor: '#d7dedb',
    borderRadius: 8,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#012d1d',
    color: '#ffffff'
  },
  tableHeaderCell: {
    paddingVertical: 7,
    paddingHorizontal: 5,
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e6e9e8'
  },
  tableCell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    fontSize: 7,
    color: '#10211b'
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d7dedb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 7.5,
    color: '#5e6a66'
  },
  pageNumber: {
    fontSize: 7.5,
    color: '#5e6a66'
  },
  muted: {
    color: '#5e6a66'
  }
});

const statusLabel: Record<InventoryExportRow['estadoVencimiento'], string> = {
  rojo: 'Rojo',
  amarillo: 'Amarillo',
  verde: 'Verde',
  vencido: 'Vencido',
  sin_fecha: 'Sin fecha'
};

function currency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
}

function text(value: string): string {
  return value && value.trim() ? value : '-';
}

export default function InventoryExportPDF({
  rows,
  generatedAt,
  settings,
  logoDataUrl
}: InventoryExportPDFProps) {
  const totalProducts = rows.length;
  const totalStock = rows.reduce((sum, row) => sum + row.stock, 0);
  const criticalCount = rows.filter((row) => row.estadoVencimiento === 'rojo' || row.estadoVencimiento === 'vencido').length;
  const companyName = settings?.company_name || 'Fitovida SAS';
  const nit = settings?.nit || '---';
  const addressParts = [settings?.address, settings?.city, settings?.department].filter(Boolean);
  const phone = settings?.phone ? `Tel: ${settings.phone}` : '';
  const email = settings?.email ? `Correo: ${settings.email}` : '';
  const footerText = settings?.invoice_footer || 'Documento generado automáticamente por el sistema de inventario.';

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
            </View>

            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.companyMeta}>NIT: {nit}</Text>
              {addressParts.length > 0 && <Text style={styles.companyMeta}>{addressParts.join(' - ')}</Text>}
              {phone && <Text style={styles.companyMeta}>{phone}</Text>}
              {email && <Text style={styles.companyMeta}>{email}</Text>}
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.title}>Reporte de Inventario</Text>
              <Text style={styles.subtitle}>{generatedAt.toLocaleString('es-CO')}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Productos</Text>
              <Text style={styles.summaryValue}>{totalProducts}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Stock total</Text>
              <Text style={styles.summaryValue}>{totalStock}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Vencimientos críticos</Text>
              <Text style={styles.summaryValue}>{criticalCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>ID</Text>
            <Text style={[styles.tableHeaderCell, { width: '24%' }]}>Nombre del producto</Text>
            <Text style={[styles.tableHeaderCell, { width: '13%' }]}>Precio</Text>
            <Text style={[styles.tableHeaderCell, { width: '9%' }]}>Stock</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Vencimiento</Text>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Estado</Text>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>INVIMA</Text>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Creación</Text>
          </View>

          {rows.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [{ backgroundColor: '#f9fbfa' }] : [])
              ]}
            >
              <Text style={[styles.tableCell, { width: '10%' }]}>{row.id}</Text>
              <Text style={[styles.tableCell, { width: '24%' }]}>{text(row.nombre)}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{currency(row.precio)}</Text>
              <Text style={[styles.tableCell, { width: '9%' }]}>{row.stock}</Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>{text(row.fechaVencimiento)}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{statusLabel[row.estadoVencimiento]}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{row.tieneInvima ? 'Sí' : 'No'}</Text>
              <Text style={[styles.tableCell, styles.muted, { width: '10%' }]}>{text(row.fechaCreacion)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerText}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  );
}
