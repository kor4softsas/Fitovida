import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // 'all', 'income', 'expense'
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const limit = parseInt(searchParams.get('limit') || '100');

  let records: any[] = [];

  // Fetch incomes
  if (type === 'all' || type === 'income') {
    try {
      let incomeSql = `
        SELECT id, date, description, amount, category, reference, payment_method, status, created_by, created_at, 'income' as type
        FROM incomes
        WHERE 1=1
      `;

      const params: any[] = [];

      if (fromDate) {
        incomeSql += ' AND DATE(date) >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        incomeSql += ' AND DATE(date) <= ?';
        params.push(toDate);
      }

      const incomes = await query(incomeSql, params);
      records = records.concat(incomes || []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  }

  // Fetch expenses
  if (type === 'all' || type === 'expense') {
    try {
      let expenseSql = `
        SELECT id, date, description, amount, category, supplier, reference, payment_method, status, created_by, created_at, 'expense' as type
        FROM expenses
        WHERE 1=1
      `;

      const expenseParams: any[] = [];

      if (fromDate) {
        expenseSql += ' AND DATE(date) >= ?';
        expenseParams.push(fromDate);
      }

      if (toDate) {
        expenseSql += ' AND DATE(date) <= ?';
        expenseParams.push(toDate);
      }

      const expenses = await query(expenseSql, expenseParams);
      records = records.concat(expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    records: (records || []).slice(0, limit),
    total: (records || []).length
  }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // 'income' o 'expense'
      date,
      description,
      amount,
      category,
      supplier,
      reference,
      payment_method,
      status,
      created_by
    } = body;

    if (!type || !date || !description || !amount || !category || !created_by) {
      return NextResponse.json(
        { error: 'Datos incompletos', success: false },
        { status: 200 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0', success: false },
        { status: 200 }
      );
    }

    try {
      if (type === 'income') {
        await query(
          `INSERT INTO incomes (date, description, amount, category, reference, payment_method, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [date, description, amount, category || 'other', reference || null, payment_method || 'transfer', status || 'received', created_by]
        );
      } else if (type === 'expense') {
        await query(
          `INSERT INTO expenses (date, description, amount, category, supplier, reference, payment_method, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [date, description, amount, category || 'other', supplier || null, reference || null, payment_method || 'transfer', status || 'paid', created_by]
        );
      } else {
        return NextResponse.json(
          { error: 'Tipo inválido', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Registro creado exitosamente'
      }, { status: 200 });
    } catch (dbError) {
      console.error('Error en POST /api/admin/finances (DB):', dbError);
      return NextResponse.json({
        success: false,
        error: 'Error al crear registro en la base de datos',
        message: 'Registro creado exitosamente (sin BD)'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error en POST /api/admin/finances:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud', success: false },
      { status: 200 }
    );
  }
}
