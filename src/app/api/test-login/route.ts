import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[TEST-LOGIN] POST request recibido');
  return NextResponse.json({ 
    message: 'POST /api/test-login funciona',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'GET /api/test-login funciona' 
  });
}
