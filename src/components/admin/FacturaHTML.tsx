
export default function FacturaHTML({ sale }: { sale: Sale }) {
  return (
    <div id="factura-html" style={{
      padding: 16,
      background: '#fff',
      color: '#222',
      width: 340,
      minHeight: 420,
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      border: '1px solid #eee',
      borderRadius: 8,
      boxShadow: '0 2px 8px #0001',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <img src="/img/logo.png" alt="Logo" width={38} height={38} style={{ objectFit: 'contain', borderRadius: 6, border: '1px solid #eee', background: '#fafafa' }} />
        <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a7f37', letterSpacing: 1 }}>Fitovida</div>
      </div>
      <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#333' }}>
        Factura #{sale.saleNumber}
      </div>
      <div style={{ marginBottom: 8, fontSize: 11 }}>
        <div><b>Cliente:</b> {sale.customerName} ({sale.customerDocument})</div>
        <div><b>Fecha:</b> {new Date(sale.date).toLocaleDateString()}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', fontSize: 11, padding: 2 }}>Producto</th>
            <th style={{ borderBottom: '1px solid #ddd', fontSize: 11, padding: 2 }}>Cant.</th>
            <th style={{ borderBottom: '1px solid #ddd', fontSize: 11, padding: 2 }}>Precio</th>
            <th style={{ borderBottom: '1px solid #ddd', fontSize: 11, padding: 2 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: 2 }}>{item.productName}</td>
              <td style={{ textAlign: 'center', padding: 2 }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: 2 }}>${item.unitPrice.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: 2 }}>${item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', fontSize: 12, marginTop: 8 }}>
        <div><b>Subtotal:</b> ${sale.subtotal.toLocaleString()}</div>
        <div><b>IVA:</b> ${sale.tax.toLocaleString()}</div>
        {sale.discount > 0 && <div style={{ color: '#1a7f37' }}><b>Descuento:</b> -${sale.discount.toLocaleString()}</div>}
        <div style={{ fontWeight: 'bold', fontSize: 15, marginTop: 4 }}><b>Total:</b> ${sale.total.toLocaleString()}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: '#888', marginTop: 16 }}>
        ¡Gracias por su compra!
      </div>
    </div>
  );
}
