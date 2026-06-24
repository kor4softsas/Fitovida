-- Script combinado para migrar a MySQL
-- Ejecutar en orden: schema-mysql.sql, auth-update.sql, admin-schema.sql, 06-inventory-lots.sql

-- Primero: schema-mysql.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/schema-mysql.sql;

-- Segundo: auth-update.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/auth-update.sql;

-- Tercero: admin-schema.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/admin-schema.sql;

-- Cuarto: 06-inventory-lots.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/06-inventory-lots.sql;

SELECT '✓ MIGRACIÓN A MySQL COMPLETADA EXITOSAMENTE!' as mensaje;
