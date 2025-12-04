# Instalación de Base de Datos en VPS Hostinger

## Opción 1: PostgreSQL (Recomendado - Compatible con tu schema actual)

### Paso 1: Conectar al VPS por SSH

```bash
ssh root@tu-ip-del-vps
# O si tienes usuario no-root:
ssh usuario@tu-ip-del-vps
```

### Paso 2: Actualizar el sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### Paso 3: Instalar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Verificar que está corriendo
sudo systemctl status postgresql

# Habilitar para que inicie automáticamente
sudo systemctl enable postgresql
```

### Paso 4: Configurar PostgreSQL

```bash
# Acceder a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
```

```sql
-- Crear base de datos para Fitovida
CREATE DATABASE fitovida;

-- Crear usuario
CREATE USER fitovida_user WITH ENCRYPTED PASSWORD 'tu_password_seguro_aqui';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE fitovida TO fitovida_user;

-- Salir
\q
```

### Paso 5: Configurar acceso remoto (para conectar desde tu app)

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Buscar la línea listen_addresses y cambiar a:
listen_addresses = '*'

# Guardar: Ctrl+O, Enter, Ctrl+X
```

```bash
# Editar pg_hba.conf para permitir conexiones
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Agregar al final:
host    fitovida    fitovida_user    0.0.0.0/0    md5

# Guardar y salir
```

```bash
# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Paso 6: Configurar Firewall

```bash
# Permitir PostgreSQL en el firewall
sudo ufw allow 5432/tcp
sudo ufw reload
```

### Paso 7: Ejecutar tu schema

```bash
# Copiar tu archivo schema.sql al servidor (desde tu PC local)
scp /home/kamdevo/Desktop/coding/Fitovida/supabase/schema.sql root@tu-ip:/tmp/

# En el VPS, ejecutar el schema
sudo -u postgres psql -d fitovida -f /tmp/schema.sql
```

### Paso 8: String de conexión para tu app

```bash
postgresql://fitovida_user:tu_password@tu-ip-vps:5432/fitovida
```

---

## Opción 2: MySQL (Alternativa más común)

### Paso 1-2: Igual que arriba (SSH y actualizar)

### Paso 3: Instalar MySQL

```bash
sudo apt install mysql-server -y

# Asegurar instalación
sudo mysql_secure_installation
```

Responde:
- Remove anonymous users? **Yes**
- Disallow root login remotely? **Yes** 
- Remove test database? **Yes**
- Reload privilege tables? **Yes**

### Paso 4: Configurar MySQL

```bash
# Acceder a MySQL
sudo mysql

# Dentro de MySQL:
```

```sql
-- Crear base de datos
CREATE DATABASE fitovida;

-- Crear usuario
CREATE USER 'fitovida_user'@'%' IDENTIFIED BY 'tu_password_seguro';

-- Dar permisos
GRANT ALL PRIVILEGES ON fitovida.* TO 'fitovida_user'@'%';
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

### Paso 5: Permitir conexiones remotas

```bash
# Editar configuración de MySQL
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Buscar bind-address y cambiar a:
bind-address = 0.0.0.0

# Guardar y salir
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

### Paso 6: Firewall

```bash
sudo ufw allow 3306/tcp
sudo ufw reload
```

### Paso 7: Convertir schema para MySQL

**NOTA:** Tu schema.sql está escrito para PostgreSQL. Para MySQL necesitas convertirlo.

Diferencias principales:
- `SERIAL` → `INT AUTO_INCREMENT`
- `UUID` → `CHAR(36)` o `BINARY(16)`
- `TEXT[]` (arrays) → Necesita tabla separada o JSON
- `gen_random_uuid()` → `UUID()`

### String de conexión para MySQL:

```bash
mysql://fitovida_user:tu_password@tu-ip-vps:3306/fitovida
```

---

## Opción 3: Usar Supabase (MÁS FÁCIL - Sin gestionar servidor)

**Ventaja:** Tu schema ya está listo, no necesitas gestionar el servidor de DB

1. Ve a [supabase.com](https://supabase.com)
2. Crea cuenta gratuita
3. Crea nuevo proyecto "Fitovida"
4. En SQL Editor, pega tu `schema.sql` completo
5. Ejecuta
6. Copia las credenciales de "Project Settings → API"

Variables de entorno:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Ventajas Supabase:**
- ✅ No gestionas servidor
- ✅ Backups automáticos
- ✅ Panel de administración
- ✅ APIs REST automáticas
- ✅ Realtime subscriptions
- ✅ Storage de archivos
- ✅ Gratis hasta 500MB

---

## Conectar Next.js a tu Base de Datos

### Para PostgreSQL en VPS:

```bash
npm install pg
```

Crear `/src/lib/db.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST, // IP de tu VPS
  port: 5432,
  database: 'fitovida',
  user: 'fitovida_user',
  password: process.env.DB_PASSWORD,
  ssl: false, // true si configuras SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
```

Variables en `.env.local`:

```bash
DB_HOST=tu-ip-vps
DB_PASSWORD=tu_password_seguro
DATABASE_URL=postgresql://fitovida_user:tu_password@tu-ip-vps:5432/fitovida
```

### Ejemplo de uso en API Route:

```typescript
// src/app/api/products/route.ts
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM products WHERE featured = true');
    return Response.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
```

---

## Seguridad Adicional

### 1. Configurar SSL para PostgreSQL (Opcional pero recomendado)

```bash
# Generar certificados
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text \
  -out /var/lib/postgresql/14/main/server.crt \
  -keyout /var/lib/postgresql/14/main/server.key

# Ajustar permisos
sudo chmod 600 /var/lib/postgresql/14/main/server.key
sudo chown postgres:postgres /var/lib/postgresql/14/main/server.*

# Editar postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Descomentar y cambiar:
ssl = on
ssl_cert_file = '/var/lib/postgresql/14/main/server.crt'
ssl_key_file = '/var/lib/postgresql/14/main/server.key'

# Reiniciar
sudo systemctl restart postgresql
```

### 2. Usar variables de entorno seguras

```bash
# En tu VPS donde está Next.js
nano .env.local

# Agregar:
DATABASE_URL="postgresql://fitovida_user:password@localhost:5432/fitovida"
```

### 3. Firewall más restrictivo

```bash
# Solo permitir tu IP específica (si es fija)
sudo ufw allow from TU_IP_FIJA to any port 5432

# O solo localhost si Next.js está en el mismo servidor
# No abrir puerto externo en ese caso
```

---

## Resumen de Opciones

| Opción | Dificultad | Costo | Control | Mantenimiento |
|--------|-----------|-------|---------|---------------|
| **Supabase** | ⭐ Fácil | Gratis/Bajo | Medio | Ninguno |
| **PostgreSQL VPS** | ⭐⭐⭐ Media | VPS existente | Total | Alto |
| **MySQL VPS** | ⭐⭐ Media | VPS existente | Total | Alto |

## Mi recomendación:

1. **Para empezar rápido:** Usa Supabase (tu schema ya está listo)
2. **Para producción seria:** PostgreSQL en VPS (tienes control total)
3. **Si prefieres MySQL:** Necesitas adaptar el schema

¿Qué opción prefieres? Te ayudo con los pasos específicos.
