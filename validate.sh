#!/bin/bash
# Script para validar que todo está configurado correctamente

echo "🔍 Validando configuración de Fitovida..."
echo ""

# 1. Verificar MySQL
echo "1️⃣  Verificando MySQL..."
mysql -u root -e "SELECT VERSION();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ MySQL está corriendo"
else
  echo "❌ MySQL NO está corriendo"
  exit 1
fi

# 2. Verificar BD Fitovida existe
echo ""
echo "2️⃣  Verificando base de datos fitovida..."
mysql -u root -e "USE fitovida; SELECT COUNT(*) as tablas_totales FROM information_schema.tables WHERE table_schema='fitovida';" 2>/dev/null | tail -1

# 3. Verificar usuario admin
echo ""
echo "3️⃣  Verificando usuario admin..."
ADMIN_USER=$(mysql -u root -e "USE fitovida; SELECT email FROM users WHERE email='admin@fitovida.com';" 2>/dev/null | tail -1)
if [ "$ADMIN_USER" = "admin@fitovida.com" ]; then
  echo "✅ Usuario admin@fitovida.com existe"
else
  echo "❌ Usuario admin NO existe"
fi

# 4. Verificar .env.local
echo ""
echo "4️⃣  Verificando .env.local..."
if [ -f ".env.local" ]; then
  echo "✅ Archivo .env.local existe"
  echo "   DEMO_MODE: $(grep DEMO_MODE .env.local)"
  echo "   DB_HOST: $(grep DB_HOST .env.local)"
else
  echo "❌ Archivo .env.local NO existe"
fi

# 5. Verificar Node running
echo ""
echo "5️⃣  Verificando Node.js..."
if pgrep -f "next dev" > /dev/null; then
  echo "✅ Servidor Next.js está corriendo"
else
  echo "⚠️  Servidor Next.js NO está corriendo"
  echo "   Ejecutar: npm run dev"
fi

echo ""
echo "✨ Validación completada!"
