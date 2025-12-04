-- =============================================
-- MIGRACIÓN: Agregar tabla de direcciones de usuario
-- =============================================
-- Ejecutar este script si ya tienes la base de datos creada
-- y solo necesitas agregar la funcionalidad de direcciones
-- =============================================

-- Crear tabla de direcciones si no existe
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL, -- ID de Clerk
  
  -- Información de la dirección
  label VARCHAR(100) NOT NULL, -- Ej: Casa, Oficina, Trabajo
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  instructions TEXT, -- Instrucciones de entrega opcionales
  
  -- Control
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_phone CHECK (phone ~* '^\d{7,}$'),
  UNIQUE(user_id, label) -- No permitir etiquetas duplicadas por usuario
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(is_default) WHERE is_default = true;

-- Trigger para updated_at (si no existe la función, crearla)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para garantizar solo una dirección predeterminada
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para dirección predeterminada única
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON user_addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Habilitar RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Crear políticas (permisivas para desarrollo)
DROP POLICY IF EXISTS "user_addresses_select_own" ON user_addresses;
CREATE POLICY "user_addresses_select_own"
  ON user_addresses FOR SELECT
  USING (true); -- TODO: user_id = auth.jwt() ->> 'sub'

DROP POLICY IF EXISTS "user_addresses_insert_own" ON user_addresses;
CREATE POLICY "user_addresses_insert_own"
  ON user_addresses FOR INSERT
  WITH CHECK (true); -- TODO: user_id = auth.jwt() ->> 'sub'

DROP POLICY IF EXISTS "user_addresses_update_own" ON user_addresses;
CREATE POLICY "user_addresses_update_own"
  ON user_addresses FOR UPDATE
  USING (true); -- TODO: user_id = auth.jwt() ->> 'sub'

DROP POLICY IF EXISTS "user_addresses_delete_own" ON user_addresses;
CREATE POLICY "user_addresses_delete_own"
  ON user_addresses FOR DELETE
  USING (true); -- TODO: user_id = auth.jwt() ->> 'sub'

-- Actualizar tabla orders para incluir departamento si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'shipping_department'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_department VARCHAR(100);
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE user_addresses IS 'Direcciones de envío guardadas por usuarios autenticados con Clerk';
COMMENT ON COLUMN user_addresses.label IS 'Etiqueta descriptiva de la dirección (Casa, Oficina, etc.)';
COMMENT ON COLUMN user_addresses.is_default IS 'Indica si esta es la dirección predeterminada del usuario';

-- Verificar
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_addresses'
ORDER BY ordinal_position;

SELECT 'Migración completada exitosamente!' as resultado;
