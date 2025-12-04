#!/bin/bash

# ============================================
# Script de Instalación PostgreSQL para VPS
# Fitovida - Base de datos
# ============================================

echo "🚀 Instalación de PostgreSQL para Fitovida"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Por favor ejecuta como root: sudo bash install-postgresql.sh${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Ejecutando como root${NC}"

# Paso 1: Actualizar sistema
echo -e "\n${YELLOW}📦 Actualizando sistema...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# Paso 2: Instalar PostgreSQL
echo -e "\n${YELLOW}🐘 Instalando PostgreSQL...${NC}"
apt install postgresql postgresql-contrib -y
echo -e "${GREEN}✓ PostgreSQL instalado${NC}"

# Paso 3: Iniciar y habilitar servicio
systemctl start postgresql
systemctl enable postgresql
echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"

# Paso 4: Solicitar datos
echo -e "\n${YELLOW}🔐 Configuración de credenciales${NC}"
read -p "Ingresa el password para el usuario de la BD: " DB_PASSWORD

# Paso 5: Crear base de datos y usuario
echo -e "\n${YELLOW}🗄️  Creando base de datos y usuario...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE fitovida;
CREATE USER fitovida_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE fitovida TO fitovida_user;
\c fitovida
GRANT ALL ON SCHEMA public TO fitovida_user;
EOF
echo -e "${GREEN}✓ Base de datos 'fitovida' creada${NC}"
echo -e "${GREEN}✓ Usuario 'fitovida_user' creado${NC}"

# Paso 6: Configurar acceso remoto
echo -e "\n${YELLOW}🌐 Configurando acceso remoto...${NC}"

# Detectar versión de PostgreSQL
PG_VERSION=$(ls /etc/postgresql/ | head -n 1)
PG_CONF_DIR="/etc/postgresql/$PG_VERSION/main"

# Backup de configuraciones
cp "$PG_CONF_DIR/postgresql.conf" "$PG_CONF_DIR/postgresql.conf.backup"
cp "$PG_CONF_DIR/pg_hba.conf" "$PG_CONF_DIR/pg_hba.conf.backup"

# Configurar listen_addresses
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"

# Agregar regla de acceso
echo "host    fitovida    fitovida_user    0.0.0.0/0    md5" >> "$PG_CONF_DIR/pg_hba.conf"

echo -e "${GREEN}✓ Configuración de acceso remoto aplicada${NC}"

# Paso 7: Configurar firewall
echo -e "\n${YELLOW}🔥 Configurando firewall...${NC}"
ufw allow 5432/tcp
ufw reload
echo -e "${GREEN}✓ Puerto 5432 abierto en firewall${NC}"

# Paso 8: Reiniciar PostgreSQL
echo -e "\n${YELLOW}🔄 Reiniciando PostgreSQL...${NC}"
systemctl restart postgresql
echo -e "${GREEN}✓ PostgreSQL reiniciado${NC}"

# Obtener IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

# Paso 9: Mostrar resumen
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Información de conexión:${NC}"
echo ""
echo "  Base de datos: fitovida"
echo "  Usuario:       fitovida_user"
echo "  Password:      $DB_PASSWORD"
echo "  Host:          $SERVER_IP"
echo "  Puerto:        5432"
echo ""
echo -e "${YELLOW}🔗 String de conexión:${NC}"
echo ""
echo "  postgresql://fitovida_user:$DB_PASSWORD@$SERVER_IP:5432/fitovida"
echo ""
echo -e "${YELLOW}📝 Variables para .env.local:${NC}"
echo ""
echo "  DATABASE_URL=\"postgresql://fitovida_user:$DB_PASSWORD@$SERVER_IP:5432/fitovida\""
echo "  DB_HOST=\"$SERVER_IP\""
echo "  DB_USER=\"fitovida_user\""
echo "  DB_PASSWORD=\"$DB_PASSWORD\""
echo "  DB_NAME=\"fitovida\""
echo "  DB_PORT=\"5432\""
echo ""
echo -e "${YELLOW}📄 Próximos pasos:${NC}"
echo ""
echo "  1. Sube tu archivo schema.sql al servidor:"
echo "     scp supabase/schema.sql root@$SERVER_IP:/tmp/"
echo ""
echo "  2. Ejecuta el schema:"
echo "     sudo -u postgres psql -d fitovida -f /tmp/schema.sql"
echo ""
echo "  3. Verifica la instalación:"
echo "     psql -h $SERVER_IP -U fitovida_user -d fitovida"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  - Guarda el password en un lugar seguro"
echo "  - Backups creados en: $PG_CONF_DIR/*.backup"
echo "  - Para ver logs: journalctl -u postgresql"
echo ""
