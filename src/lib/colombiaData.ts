// Departamentos y ciudades de Colombia
export const colombiaData = {
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro', 'Caucasia'],
  'Arauca': ['Arauca', 'Tame', 'Saravena'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia'],
  'Bogotá D.C.': ['Bogotá'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'],
  'Caldas': ['Manizales', 'Villamaría', 'La Dorada', 'Chinchiná'],
  'Caquetá': ['Florencia', 'Puerto Rico', 'San Vicente del Caguán'],
  'Casanare': ['Yopal', 'Aguazul', 'Villanueva', 'Monterrey'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
  'Cesar': ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi'],
  'Chocó': ['Quibdó', 'Istmina', 'Condoto'],
  'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano'],
  'Cundinamarca': ['Soacha', 'Fusagasugá', 'Facatativá', 'Chía', 'Zipaquirá', 'Girardot', 'Mosquera', 'Madrid'],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Valle del Guamuez'],
  'Quindío': ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
  'Sucre': ['Sincelejo', 'Corozal', 'San Marcos'],
  'Tolima': ['Ibagué', 'Espinal', 'Girardot', 'Melgar'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño']
};

export const departments = Object.keys(colombiaData).sort();

export const getCitiesByDepartment = (department: string): string[] => {
  return colombiaData[department as keyof typeof colombiaData] || [];
};
