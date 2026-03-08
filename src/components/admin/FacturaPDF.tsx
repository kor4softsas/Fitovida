import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Sale } from '@/types/admin';

const styles = StyleSheet.create({
  page: { padding: 24 },
  section: { marginBottom: 12 },
  title: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: 'bold' },
  value: { fontSize: 12, marginBottom: 4 },
  table: { display: 'table', width: 'auto', marginTop: 12 },
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, fontSize: 10, padding: 4, borderBottom: '1 solid #eee' },
});

export const FacturaPDF = ({ sale }: { sale: Sale }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Factura #{sale.saleNumber}</Text>
        <Text style={styles.label}>Cliente:</Text>
        <Text style={styles.value}>{sale.customerName} ({sale.customerDocument})</Text>
        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>{sale.date.toLocaleDateString()}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Productos:</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Producto</Text>
            <Text style={styles.tableCell}>Cantidad</Text>
            <Text style={styles.tableCell}>Precio</Text>
            <Text style={styles.tableCell}>Total</Text>
          </View>
          {sale.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{item.productName}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>${item.unitPrice.toLocaleString()}</Text>
              <Text style={styles.tableCell}>${(item.unitPrice * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Subtotal: ${sale.subtotal.toLocaleString()}</Text>
        <Text style={styles.label}>IVA: ${sale.tax.toLocaleString()}</Text>
        <Text style={styles.label}>Descuento: ${sale.discount.toLocaleString()}</Text>
        <Text style={styles.label}>Total: ${sale.total.toLocaleString()}</Text>
      </View>
    </Page>
  </Document>
);
