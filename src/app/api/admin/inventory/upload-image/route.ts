import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (JPEG, PNG, WebP)' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen no debe exceder 5MB' },
        { status: 400 }
      );
    }

    // Crear nombre único para la imagen
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.type.split('/')[1];
    const filename = `product-${productId}-${timestamp}-${random}.${ext}`;

    // Ruta donde se guardará la imagen
    const uploadDir = join(process.cwd(), 'public', 'img', 'products');

    // Crear directorio si no existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Leer el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar el archivo
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Retornar la ruta relativa para usar en el navegador
    const imagePath = `/img/products/${filename}`;

    return NextResponse.json({
      success: true,
      imagePath,
      filename,
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/admin/inventory/upload-image:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
