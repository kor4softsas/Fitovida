import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const data = await request.json();
    await connection.beginTransaction();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO products (name, description, price, category, stock, image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [data.name, data.description || '', data.salePrice || 0, data.category || '', data.currentStock || 0, data.image || '']
    );
    const productId = result.insertId;

    await connection.execute(
      `INSERT INTO inventory_products 
       (product_id, sku, barcode, current_stock, min_stock, max_stock, unit_cost, tax_rate, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        data.sku || null,
        data.barcode || null,
        data.currentStock || 0,
        data.minStock || 5,
        data.maxStock || null,
        data.unitCost || 0,
        data.taxRate || 19,
        data.supplier || null,
        data.status || 'active'
      ]
    );

    await connection.commit();
    
    return NextResponse.json({ success: true, productId });
  } catch (error) {
    await connection.rollback();
    console.error('Error in POST /api/admin/inventory/product:', error);
    return NextResponse.json({ error: 'Error agregando el producto.' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const data = await request.json();
    const productId = data.id || data.product_id;
    if (!productId || productId === 'new') {
      throw new Error('Invalid product ID');
    }

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE products 
       SET name=?, description=?, price=?, category=?, stock=?, image=?, updated_at=NOW()
       WHERE id=?`,
       [data.name, data.description || '', data.salePrice || 0, data.category || '', data.currentStock || 0, data.image || '', productId]
    );

    await connection.execute(
      `UPDATE inventory_products 
       SET sku=?, barcode=?, current_stock=?, min_stock=?, max_stock=?, unit_cost=?, tax_rate=?, supplier=?, status=?
       WHERE product_id=?`,
      [
        data.sku || null,
        data.barcode || null,
        data.currentStock || 0,
        data.minStock || 5,
        data.maxStock || null,
        data.unitCost || 0,
        data.taxRate || 19,
        data.supplier || null,
        data.status || 'active',
        productId
      ]
    );

    await connection.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error in PUT /api/admin/inventory/product:', error);
    return NextResponse.json({ error: 'Error actualizando el producto.' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) return NextResponse.json({ error: 'IDs faltantes' }, { status: 400 });

    const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length === 0) return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });

    const placeholders = ids.map(() => '?').join(',');

    await connection.beginTransaction();

    await connection.execute(`DELETE FROM inventory_products WHERE product_id IN (${placeholders})`, ids);
    await connection.execute(`DELETE FROM products WHERE id IN (${placeholders})`, ids);

    await connection.commit();
    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error in DELETE /api/admin/inventory/product:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json({ error: 'No se puede eliminar porque algunos productos seleccionados tienen movimientos o pedidos asociados. Puedes marcarlos como INACTIVOS en su lugar.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar productos' }, { status: 500 });
  } finally {
    connection.release();
  }
}
