import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'income', 'expense'
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let sql = '';
    const params: any[] = [];

    if (type === 'all' || type === 'income') {
      let incomeSql = `
        SELECT id, description, amount, source, reference, notes, created_by, created_at, 'income' as type
        FROM incomes
        WHERE 1=1
      `;

      if (fromDate) {
        incomeSql += ' AND DATE(created_at) >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        incomeSql += ' AND DATE(created_at) <= ?';
        params.push(toDate);
      }

      const incomes = await query(incomeSql, params);

      // Gastos
      let expenseSql = `
        SELECT id, description, amount, category, reference, notes, created_by, created_at, 'expense' as type
        FROM expenses
        WHERE 1=1
      `;

      const expenseParams: any[] = [];

      if (fromDate) {
        expenseSql += ' AND DATE(created_at) >= ?';
        expenseParams.push(fromDate);
      }

      if (toDate) {
        expenseSql += ' AND DATE(created_at) <= ?';
        expenseParams.push(toDate);
      }

      const expenses = await query(expenseSql, expenseParams);

      let records: any[] = [];

      if (type === 'all') {
        records = [...incomes, ...expenses];
      } else if (type === 'income') {
        records = incomes;
      } else {
        records = expenses;
      }

      records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        records: records.slice(0, limit),
        total: records.length
      });
    }

    return NextResponse.json({
      records: [],
      total: 0
    });
  } catch (error) {
    console.error('Error en GET /api/admin/finances:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de finanzas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // 'income' o 'expense'
      description,
      amount,
      source,
      category,
      reference,
      notes,
      created_by
    } = body;

    if (!type || !description || !amount || !created_by) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (type === 'income') {
      await query(
        `INSERT INTO incomes (description, amount, source, reference, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [description, amount, source || 'other', reference || null, notes || null, created_by]
      );
    } else if (type === 'expense') {
      await query(
        `INSERT INTO expenses (description, amount, category, reference, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [description, amount, category || 'other', reference || null, notes || null, created_by]
      );
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registro creado exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/admin/finances:', error);
    return NextResponse.json(
      { error: 'Error al crear registro' },
      { status: 500 }
    );
  }
}
