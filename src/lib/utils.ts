import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `#${timestamp}${random}`.slice(0, 10);
}

export function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getCategoryName(category: string): string {
  const categories: Record<string, string> = {
    'todos': 'Todos',
    'vitaminas': 'Vitaminas',
    'suplementos': 'Suplementos',
    'hierbas': 'Hierbas',
    'aceites': 'Aceites',
    'proteinas': 'Proteínas'
  };

  const key = normalizeCategoryKey(category);
  if (categories[key]) {
    return categories[key];
  }

  const cleaned = category.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return category;
  }

  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getUniqueCategoryKeys(items: Array<{ category: string }>): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];

  for (const item of items) {
    const key = normalizeCategoryKey(item.category);
    if (!key || key === 'todos' || seen.has(key)) {
      continue;
    }

    seen.add(key);
    categories.push(key);
  }

  return categories.sort((a, b) => getCategoryName(a).localeCompare(getCategoryName(b), 'es'));
}
