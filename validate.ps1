# Script para validar configuración de Fitovida
# Uso: .\validate.ps1

Write-Host "🔍 Validando configuración de Fitovida..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar MySQL
Write-Host "1️⃣  Verificando MySQL..." -ForegroundColor Yellow
try {
  & "C:\xampp\mysql\bin\mysql" -u root -e "SELECT VERSION();" > $null 2>&1
  Write-Host "✅ MySQL está corriendo" -ForegroundColor Green
} catch {
  Write-Host "❌ MySQL NO está corriendo" -ForegroundColor Red
  exit 1
}

# 2. Verificar BD Fitovida
Write-Host ""
Write-Host "2️⃣  Verificando base de datos fitovida..." -ForegroundColor Yellow
$result = & "C:\xampp\mysql\bin\mysql" -u root -e "USE fitovida; SELECT COUNT(*) as tablas FROM information_schema.tables WHERE table_schema='fitovida';" 2>$null | Select-Object -Last 1
Write-Host "   Tablas encontradas: $result" -ForegroundColor Green

# 3. Verificar usuario admin
Write-Host ""
Write-Host "3️⃣  Verificando usuario admin..." -ForegroundColor Yellow
$adminUser = & "C:\xampp\mysql\bin\mysql" -u root -e "USE fitovida; SELECT email FROM users WHERE email='admin@fitovida.com';" 2>$null | Select-Object -Last 1
if ($adminUser -eq "admin@fitovida.com") {
  Write-Host "✅ Usuario admin@fitovida.com existe" -ForegroundColor Green
} else {
  Write-Host "❌ Usuario admin NO existe" -ForegroundColor Red
}

# 4. Verificar .env.local
Write-Host ""
Write-Host "4️⃣  Verificando .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
  Write-Host "✅ Archivo .env.local existe" -ForegroundColor Green
  $demoMode = Select-String -Path ".env.local" -Pattern "DEMO_MODE" | ForEach-Object { $_.Line }
  $dbHost = Select-String -Path ".env.local" -Pattern "DB_HOST" | ForEach-Object { $_.Line }
  Write-Host "   $demoMode" -ForegroundColor Cyan
  Write-Host "   $dbHost" -ForegroundColor Cyan
} else {
  Write-Host "❌ Archivo .env.local NO existe" -ForegroundColor Red
}

# 5. Verificar Node running
Write-Host ""
Write-Host "5️⃣  Verificando Node.js..." -ForegroundColor Yellow
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcess) {
  Write-Host "✅ Servidor Next.js está corriendo (PID: $($nodeProcess.Id))" -ForegroundColor Green
} else {
  Write-Host "⚠️  Servidor Next.js NO está corriendo" -ForegroundColor Yellow
  Write-Host "   Ejecutar: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Validación completada!" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   Email: admin@fitovida.com" -ForegroundColor Gray
Write-Host "   Contraseña: demo123" -ForegroundColor Gray
Write-Host "   URL: http://192.168.110.151:3000/login" -ForegroundColor Gray
