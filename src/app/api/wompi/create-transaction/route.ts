import { NextRequest, NextResponse } from 'next/server';
import { 
  getWompiBaseUrl, 
  generateIntegritySignature, 
  generateTransactionReference,
  copToCents 
} from '@/lib/wompi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      bankCode,
      personType, // '0' para natural, '1' para jurídica
      documentType,
      documentNumber,
    } = body;

    // Validaciones
    if (!amount || amount < 2000) {
      return NextResponse.json(
        { error: 'El monto mínimo es $2,000 COP' },
        { status: 400 }
      );
    }

    if (!bankCode || !personType || !documentType || !documentNumber) {
      return NextResponse.json(
        { error: 'Faltan datos bancarios requeridos' },
        { status: 400 }
      );
    }

    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
      return NextResponse.json(
        { error: 'Claves de Wompi no configuradas' },
        { status: 500 }
      );
    }

    const baseUrl = getWompiBaseUrl();
    const reference = orderNumber || generateTransactionReference();
    const amountInCents = copToCents(amount);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?provider=wompi&ref=${reference}`;

    // Generar firma de integridad
    const signature = await generateIntegritySignature(reference, amountInCents, 'COP');

    // Primero, obtener token de aceptación (requerido por Wompi)
    const acceptanceResponse = await fetch(`${baseUrl}/merchants/${publicKey}`);
    const merchantData = await acceptanceResponse.json();
    const acceptanceToken = merchantData.data?.presigned_acceptance?.acceptance_token;

    if (!acceptanceToken) {
      console.error('No se pudo obtener acceptance token');
      return NextResponse.json(
        { error: 'Error de configuración con Wompi' },
        { status: 500 }
      );
    }

    // Crear transacción PSE
    const transactionPayload = {
      acceptance_token: acceptanceToken,
      amount_in_cents: amountInCents,
      currency: 'COP',
      signature: signature,
      customer_email: customerEmail,
      reference: reference,
      payment_method: {
        type: 'PSE',
        user_type: personType, // 0 = natural, 1 = jurídica
        user_legal_id_type: documentType,
        user_legal_id: documentNumber,
        financial_institution_code: bankCode,
        payment_description: `Pedido Fitovida #${orderNumber}`,
      },
      redirect_url: redirectUrl,
      customer_data: {
        phone_number: customerPhone,
        full_name: customerName,
      },
    };

    const transactionResponse = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionPayload),
    });

    const transactionData = await transactionResponse.json();

    if (!transactionResponse.ok) {
      console.error('Error creating PSE transaction:', transactionData);
      return NextResponse.json(
        { 
          error: transactionData.error?.reason || 'Error al crear transacción PSE',
          details: transactionData 
        },
        { status: transactionResponse.status }
      );
    }

    // La respuesta incluye la URL del banco para redirigir al usuario
    const paymentUrl = transactionData.data?.payment_method?.extra?.async_payment_url;
    const transactionId = transactionData.data?.id;

    return NextResponse.json({
      success: true,
      transactionId,
      reference,
      paymentUrl, // URL para redirigir al usuario al banco
      status: transactionData.data?.status,
    });
  } catch (error) {
    console.error('Error creating PSE transaction:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago PSE' },
      { status: 500 }
    );
  }
}
