# Script para validar configuracion de Fitovida

Write-Host "Validando configuracion de Fitovida..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar MySQL
Write-Host "1. Verificando MySQL..." -ForegroundColor Yellow
try {
  & "C:\xampp\mysql\bin\mysql" -u root -e "SELECT VERSION();"
  Write-Host "OK - MySQL esta corriendo" -ForegroundColor Green
} catch {
  Write-Host "ERROR - MySQL NO esta corriendo" -ForegroundColor Red
  exit 1
}

# 2. Verificar usuario admin
Write-Host ""
Write-Host "2. Verificando usuario admin..." -ForegroundColor Yellow
$adminUser = & "C:\xampp\mysql\bin\mysql" -u root -e "USE fitovida; SELECT email FROM users WHERE email='admin@fitovida.com';" 2>$null | Select-Object -Last 1
if ($adminUser -eq "admin@fitovida.com") {
  Write-Host "OK - Usuario admin@fitovida.com existe" -ForegroundColor Green
} else {
  Write-Host "ERROR - Usuario admin NO existe" -ForegroundColor Red
}

# 3. Verificar .env.local
Write-Host ""
Write-Host "3. Verificando .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
  Write-Host "OK - Archivo .env.local existe" -ForegroundColor Green
} else {
  Write-Host "ERROR - Archivo .env.local NO existe" -ForegroundColor Red
}

# 4. Verificar Node running
Write-Host ""
Write-Host "4. Verificando Node.js..." -ForegroundColor Yellow
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*next*"}
if ($nodeProcess) {
  Write-Host "OK - Servidor Next.js esta corriendo" -ForegroundColor Green
} else {
  Write-Host "ADVERTENCIA - Servidor Next.js NO esta corriendo" -ForegroundColor Yellow
  Write-Host "   Ejecutar: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Validacion completada!" -ForegroundColor Green
