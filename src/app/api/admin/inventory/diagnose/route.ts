import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

/**
 * Endpoint de diagnóstico - verifica el estado de las tablas e integridad de datos
 */
export async function GET(request: NextRequest) {
  try {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      database: 'fitovida',
      checks: {}
    };

    // Verificar tabla products
    try {
      const productsCount = await queryOne(
        'SELECT COUNT(*) as count FROM products'
      );
      checks.checks.products = {
        exists: true,
        count: productsCount?.count || 0
      };
    } catch (err) {
      checks.checks.products = {
        exists: false,
        error: (err as Error).message
      };
    }

    // Verificar tabla inventory_products
    try {
      const inventoryCount = await queryOne(
        'SELECT COUNT(*) as count FROM inventory_products'
      );
      checks.checks.inventory_products = {
        exists: true,
        count: inventoryCount?.count || 0
      };
    } catch (err) {
      checks.checks.inventory_products = {
        exists: false,
        error: (err as Error).message
      };
    }

    // Verificar si existe el campo 'image' en inventory_products
    try {
      const hasImage = await queryOne(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'fitovida' 
         AND TABLE_NAME = 'inventory_products' 
         AND COLUMN_NAME = 'image'`
      );
      checks.checks.image_column = {
        exists: !!hasImage,
        message: hasImage 
          ? 'Campo image existe en inventory_products' 
          : 'Campo image NO existe - necesita migrar BD'
      };
    } catch (err) {
      checks.checks.image_column = {
        error: (err as Error).message
      };
    }

    // Verificar estructura de inventory_products
    try {
      const columns = await query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'fitovida' 
         AND TABLE_NAME = 'inventory_products'
         ORDER BY ORDINAL_POSITION`
      );
      checks.checks.inventory_columns = columns.map((c: any) => ({
        name: c.COLUMN_NAME,
        type: c.COLUMN_TYPE,
        nullable: c.IS_NULLABLE === 'YES'
      }));
    } catch (err) {
      checks.checks.inventory_columns = {
        error: (err as Error).message
      };
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/diagnose:', error);
    return NextResponse.json(
      {
        error: 'Error en diagnóstico',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
