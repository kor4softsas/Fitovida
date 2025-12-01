import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderNumber, customerEmail, customerName } = body;

    // Debug: Ver el monto recibido
    console.log('Stripe API - Monto recibido:', amount, 'Tipo:', typeof amount);

    // Validaciones
    if (!amount || amount < 2000) {
      return NextResponse.json(
        { error: `El monto mínimo es $2,000 COP. Recibido: ${amount}` },
        { status: 400 }
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Número de orden requerido' },
        { status: 400 }
      );
    }

    // Crear PaymentIntent en Stripe
    // IMPORTANTE: Para COP, Stripe espera el monto multiplicado por 100
    // Ejemplo: $90,000 COP debe enviarse como 9000000
    // Esto es porque Stripe trata COP como moneda con 2 decimales
    const stripeAmount = Math.round(amount * 100);
    
    console.log('Stripe API - Monto para Stripe:', stripeAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: 'cop',
      metadata: {
        orderNumber,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        originalAmount: amount.toString(), // Guardar monto original para referencia
      },
      description: `Pedido Fitovida #${orderNumber}`,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
