-- Script combinado para migrar a MySQL
-- Ejecutar en orden: schema-mysql.sql, auth-update.sql, admin-schema.sql

-- Primero: schema-mysql.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/schema-mysql.sql;

-- Segundo: auth-update.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/auth-update.sql;

-- Tercero: admin-schema.sql
SOURCE C:/xampp/htdocs/proyectos/Fitovida/mysql/admin-schema.sql;

SELECT '✓ MIGRACIÓN A MySQL COMPLETADA EXITOSAMENTE!' as mensaje;
