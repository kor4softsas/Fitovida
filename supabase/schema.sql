-- =============================================
-- ESQUEMA DE BASE DE DATOS FITOVIDA - SUPABASE
-- =============================================
-- Ejecutar este SQL en el Editor SQL de Supabase
-- https://supabase.com/dashboard/project/TU_PROYECTO/sql

-- Eliminar tablas si existen (para recrear)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- =============================================
-- TABLA: products
-- =============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  original_price DECIMAL(12, 2),
  image VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,
  discount INTEGER,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);

-- =============================================
-- TABLA: orders
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(100), -- ID de Clerk
  
  -- Datos del cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_zip VARCHAR(20) NOT NULL,
  
  -- Pago
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'pse', 'transfer')),
  payment_id VARCHAR(255),
  payment_provider VARCHAR(20) CHECK (payment_provider IN ('stripe', 'wompi')),
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Notas
  notes TEXT,
  
  -- Montos (en COP)
  subtotal DECIMAL(12, 2) NOT NULL,
  shipping DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  discount_code VARCHAR(50),
  total DECIMAL(12, 2) NOT NULL,
  
  -- Cancelación
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para órdenes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- =============================================
-- TABLA: order_items
-- =============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para items de orden
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- =============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Productos: lectura pública
CREATE POLICY "Productos visibles para todos"
  ON products FOR SELECT
  USING (true);

-- Órdenes: solo el propietario puede ver sus órdenes
CREATE POLICY "Usuarios ven sus propias órdenes"
  ON orders FOR SELECT
  USING (true); -- Por ahora permitir todo, luego integrar con Clerk

CREATE POLICY "Usuarios pueden crear órdenes"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar sus órdenes"
  ON orders FOR UPDATE
  USING (true);

-- Items de orden: acceso basado en la orden padre
CREATE POLICY "Items de orden visibles"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Items de orden insertables"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- =============================================
-- DATOS INICIALES: Productos
-- =============================================
INSERT INTO products (name, description, price, original_price, image, category, featured, discount, rating, reviews, benefits) VALUES
-- Vitaminas
('Vitamina C 1000mg', 'Suplemento de Vitamina C de alta potencia para fortalecer el sistema inmunológico. Fórmula de liberación prolongada.', 45000, 55000, '/img/productos/vitamina-c.jpg', 'vitaminas', true, 18, 4.8, 234, ARRAY['Fortalece el sistema inmune', 'Antioxidante potente', 'Mejora absorción de hierro', 'Promueve piel saludable']),
('Complejo B Premium', 'Fórmula completa con todas las vitaminas del complejo B para energía y bienestar mental.', 52000, NULL, '/img/productos/complejo-b.jpg', 'vitaminas', true, NULL, 4.7, 189, ARRAY['Aumenta niveles de energía', 'Mejora función cognitiva', 'Reduce estrés y fatiga', 'Apoya metabolismo']),
('Vitamina D3 5000 UI', 'Vitamina D3 de alta absorción para huesos fuertes y sistema inmune saludable.', 38000, 45000, '/img/productos/vitamina-d.jpg', 'vitaminas', false, 15, 4.9, 312, ARRAY['Fortalece huesos y dientes', 'Mejora absorción de calcio', 'Apoya sistema inmune', 'Mejora estado de ánimo']),
('Multivitamínico Completo', 'Fórmula multivitamínica con minerales esenciales para toda la familia.', 68000, NULL, '/img/productos/multivitaminico.jpg', 'vitaminas', true, NULL, 4.6, 156, ARRAY['Nutrición completa', 'Energía durante el día', 'Fortalece defensas', 'Incluye minerales esenciales']),

-- Suplementos
('Omega 3 Fish Oil', 'Aceite de pescado purificado con EPA y DHA para salud cardiovascular y cerebral.', 75000, 89000, '/img/productos/omega3.jpg', 'suplementos', true, 16, 4.8, 278, ARRAY['Salud cardiovascular', 'Función cerebral', 'Reduce inflamación', 'Mejora visión']),
('Colágeno Hidrolizado', 'Colágeno tipo I y III hidrolizado para piel, cabello, uñas y articulaciones.', 82000, NULL, '/img/productos/colageno.jpg', 'suplementos', true, NULL, 4.9, 423, ARRAY['Piel más firme', 'Cabello más fuerte', 'Uñas saludables', 'Articulaciones flexibles']),
('Probióticos 50 Billones', 'Mezcla de 10 cepas probióticas para salud digestiva e inmunológica.', 65000, 75000, '/img/productos/probioticos.jpg', 'suplementos', false, 13, 4.7, 198, ARRAY['Mejora digestión', 'Flora intestinal saludable', 'Fortalece inmunidad', 'Reduce hinchazón']),
('Magnesio Citrato', 'Magnesio de alta absorción para músculos, nervios y sueño reparador.', 42000, NULL, '/img/productos/magnesio.jpg', 'suplementos', false, NULL, 4.6, 167, ARRAY['Relajación muscular', 'Mejora calidad del sueño', 'Reduce calambres', 'Apoya sistema nervioso']),

-- Naturales
('Cúrcuma con Pimienta Negra', 'Extracto de cúrcuma potenciado con piperina para máxima absorción antiinflamatoria.', 48000, 58000, '/img/productos/curcuma.jpg', 'naturales', true, 17, 4.8, 289, ARRAY['Antiinflamatorio natural', 'Antioxidante potente', 'Mejora digestión', 'Apoya articulaciones']),
('Ashwagandha Orgánica', 'Adaptógeno ayurvédico para reducir estrés, ansiedad y mejorar energía.', 55000, NULL, '/img/productos/ashwagandha.jpg', 'naturales', true, NULL, 4.7, 234, ARRAY['Reduce estrés', 'Mejora energía', 'Equilibrio hormonal', 'Mejor concentración']),
('Moringa en Polvo', 'Superalimento orgánico rico en nutrientes, vitaminas y antioxidantes.', 35000, 42000, '/img/productos/moringa.jpg', 'naturales', false, 17, 4.5, 145, ARRAY['Nutrientes esenciales', 'Energía natural', 'Desintoxicante', 'Antiinflamatorio']),
('Espirulina Premium', 'Alga azul-verde orgánica, fuente completa de proteínas y nutrientes.', 58000, NULL, '/img/productos/espirulina.jpg', 'naturales', false, NULL, 4.6, 178, ARRAY['Proteína completa', 'Hierro natural', 'Desintoxicante', 'Energía sostenida']),

-- Proteínas
('Proteína Whey Isolate', 'Proteína de suero aislada de alta pureza, baja en carbohidratos y grasas.', 185000, 210000, '/img/productos/whey-protein.jpg', 'proteinas', true, 12, 4.9, 456, ARRAY['Rápida absorción', '25g proteína por porción', 'Bajo en grasa', 'Ideal post-entrenamiento']),
('Proteína Vegana Orgánica', 'Mezcla de proteínas vegetales (guisante, arroz, cáñamo) para dietas veganas.', 165000, NULL, '/img/productos/proteina-vegana.jpg', 'proteinas', true, NULL, 4.7, 234, ARRAY['100% vegetal', '22g proteína', 'Sin lácteos', 'Fácil digestión']),
('Caseína Micelar', 'Proteína de liberación lenta ideal para consumir antes de dormir.', 175000, 195000, '/img/productos/caseina.jpg', 'proteinas', false, 10, 4.6, 167, ARRAY['Liberación lenta', 'Recuperación nocturna', 'Alto en BCAA', 'Saciante']),

-- Energía
('Pre-Workout Extreme', 'Fórmula pre-entrenamiento con cafeína, beta-alanina y creatina para máximo rendimiento.', 95000, 115000, '/img/productos/preworkout.jpg', 'energia', true, 17, 4.8, 312, ARRAY['Explosión de energía', 'Mayor enfoque mental', 'Mejor rendimiento', 'Retrasa fatiga']),
('BCAA 2:1:1', 'Aminoácidos de cadena ramificada para recuperación muscular y resistencia.', 78000, NULL, '/img/productos/bcaa.jpg', 'energia', false, NULL, 4.7, 198, ARRAY['Recuperación muscular', 'Reduce fatiga', 'Preserva músculo', 'Hidratación mejorada']),
('Creatina Monohidrato', 'Creatina pura micronizada para fuerza, potencia y masa muscular.', 68000, 78000, '/img/productos/creatina.jpg', 'energia', true, 13, 4.9, 389, ARRAY['Mayor fuerza', 'Más potencia', 'Recuperación rápida', 'Masa muscular']);

-- Verificar datos insertados
SELECT COUNT(*) as total_productos FROM products;
