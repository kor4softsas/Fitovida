import { NextResponse } from 'next/server';
import { getWompiBaseUrl } from '@/lib/wompi';

// Obtener lista de bancos disponibles para PSE desde Wompi
export async function GET() {
  try {
    const baseUrl = getWompiBaseUrl();
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Wompi public key no configurada' },
        { status: 500 }
      );
    }

    // Obtener lista de instituciones financieras (bancos) para PSE
    const response = await fetch(
      `${baseUrl}/pse/financial_institutions`,
      {
        headers: {
          'Authorization': `Bearer ${publicKey}`,
        },
        // Cache por 1 hora ya que la lista de bancos no cambia frecuentemente
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error('Error fetching banks:', await response.text());
      return NextResponse.json(
        { error: 'Error obteniendo lista de bancos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      banks: data.data || [],
    });
  } catch (error) {
    console.error('Error fetching PSE banks:', error);
    return NextResponse.json(
      { error: 'Error al obtener bancos' },
      { status: 500 }
    );
  }
}
