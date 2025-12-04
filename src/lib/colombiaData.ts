// Configuración de ubicación para Fitovida
// Por ahora solo hacemos envíos a Cali, Valle del Cauca

export const AVAILABLE_DEPARTMENT = 'Valle del Cauca';
export const AVAILABLE_CITY = 'Cali';

// Estructura mantenida para compatibilidad futura
export const colombiaData = {
  'Valle del Cauca': ['Cali']
};

export const departments = Object.keys(colombiaData);

export const getCitiesByDepartment = (department: string): string[] => {
  return colombiaData[department as keyof typeof colombiaData] || [];
};

// Helper para validar ubicación
export const isValidLocation = (department: string, city: string): boolean => {
  return department === AVAILABLE_DEPARTMENT && city === AVAILABLE_CITY;
};
