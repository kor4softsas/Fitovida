import { NextRequest, NextResponse } from 'next/server';
import { mapWompiStatusToOrderStatus } from '@/lib/wompi';

// Webhook para recibir notificaciones de Wompi sobre cambios en transacciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Wompi envía eventos con esta estructura
    const { event, data, signature, timestamp } = body;

    // En producción, deberías verificar la firma
    // Por ahora en sandbox, procesamos directamente
    console.log('📥 Wompi webhook recibido:', {
      event,
      transactionId: data?.transaction?.id,
      status: data?.transaction?.status,
      reference: data?.transaction?.reference,
    });

    // Manejar diferentes tipos de eventos
    switch (event) {
      case 'transaction.updated': {
        const transaction = data?.transaction;
        if (!transaction) break;

        const status = transaction.status;
        const reference = transaction.reference;
        const orderStatus = mapWompiStatusToOrderStatus(status);

        console.log(`💳 Transacción ${reference}:`, {
          wompiStatus: status,
          orderStatus,
          amount: transaction.amount_in_cents / 100,
        });

        // En producción, aquí actualizarías la base de datos
        // Por ahora, el cliente actualiza localStorage cuando regresa del banco
        
        if (status === 'APPROVED') {
          console.log('✅ Pago PSE aprobado:', reference);
          // Enviar email de confirmación, actualizar inventario, etc.
        } else if (status === 'DECLINED' || status === 'ERROR') {
          console.log('❌ Pago PSE rechazado:', reference);
        }

        break;
      }

      case 'nequi_token.updated': {
        // Para pagos con Nequi (si lo implementas después)
        console.log('Nequi token updated:', data);
        break;
      }

      default:
        console.log(`Evento Wompi no manejado: ${event}`);
    }

    // Wompi espera un 200 OK para confirmar recepción
    return NextResponse.json({ 
      received: true,
      event,
    });
  } catch (error) {
    console.error('Error processing Wompi webhook:', error);
    // Aún así retornamos 200 para que Wompi no reintente
    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    );
  }
}

// Wompi también puede enviar GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'Wompi webhook endpoint ready' 
  });
}
