#!/bin/bash

# ============================================
# Script para desplegar Schema en VPS
# Fitovida - Configuración de Base de Datos
# ============================================

echo "📤 Desplegando schema en VPS"
echo "=============================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Solicitar datos
read -p "IP del VPS: " VPS_IP
read -p "Usuario SSH (ej: root): " SSH_USER
read -p "Password de PostgreSQL: " DB_PASSWORD

echo -e "\n${YELLOW}1️⃣  Copiando schema.sql al VPS...${NC}"
scp supabase/schema.sql ${SSH_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✓ Schema copiado${NC}"

echo -e "\n${YELLOW}2️⃣  Ejecutando schema en PostgreSQL...${NC}"
ssh ${SSH_USER}@${VPS_IP} "PGPASSWORD='$DB_PASSWORD' psql -h localhost -U fitovida_user -d fitovida -f /tmp/schema.sql"
echo -e "${GREEN}✓ Schema ejecutado${NC}"

echo -e "\n${YELLOW}3️⃣  Verificando instalación...${NC}"
ssh ${SSH_USER}@${VPS_IP} "PGPASSWORD='$DB_PASSWORD' psql -h localhost -U fitovida_user -d fitovida -c 'SELECT COUNT(*) as total_productos FROM products;'"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SCHEMA DESPLEGADO EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}🔗 Actualiza tu .env.local con:${NC}"
echo ""
echo "DATABASE_URL=\"postgresql://fitovida_user:$DB_PASSWORD@$VPS_IP:5432/fitovida\""
echo ""
