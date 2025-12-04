import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Pago exitoso:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          orderNumber: paymentIntent.metadata.orderNumber,
        });

        // Actualizar la orden en la base de datos
        if (paymentIntent.metadata.orderNumber) {
          const { query } = await import('@/lib/db');
          await query(
            'UPDATE orders SET status = ?, payment_id = ? WHERE order_number = ?',
            ['confirmed', paymentIntent.id, paymentIntent.metadata.orderNumber]
          );
        }
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Pago fallido:', {
          id: paymentIntent.id,
          orderNumber: paymentIntent.metadata.orderNumber,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('🚫 Pago cancelado:', {
          id: paymentIntent.id,
          orderNumber: paymentIntent.metadata.orderNumber,
        });
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
