import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_PASSWORD: process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT SET',
    DEMO_MODE: process.env.DEMO_MODE,
  });
}
