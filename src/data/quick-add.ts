import { PantryLocation, PantryUnit } from "@/types/pantry";

export interface QuickAddPreset {
  name: string;
  quantity: number;
  unit: PantryUnit;
  location: PantryLocation;
  defaultDaysToExpiry?: number;
}

export const QUICK_ADD_PRESETS: QuickAddPreset[] = [
  { name: "Huevos", quantity: 6, unit: "unidades", location: "refrigerador", defaultDaysToExpiry: 10 },
  { name: "Leche", quantity: 1, unit: "L", location: "refrigerador", defaultDaysToExpiry: 5 },
  { name: "Pollo", quantity: 500, unit: "g", location: "refrigerador", defaultDaysToExpiry: 2 },
  { name: "Espinaca", quantity: 150, unit: "g", location: "refrigerador", defaultDaysToExpiry: 2 },
  { name: "Queso", quantity: 200, unit: "g", location: "refrigerador", defaultDaysToExpiry: 7 },
  { name: "Mantequilla", quantity: 200, unit: "g", location: "refrigerador", defaultDaysToExpiry: 20 },
  { name: "Tomate", quantity: 4, unit: "unidades", location: "refrigerador", defaultDaysToExpiry: 4 },
  { name: "Zanahoria", quantity: 4, unit: "unidades", location: "refrigerador", defaultDaysToExpiry: 8 },
  { name: "Pimiento", quantity: 2, unit: "unidades", location: "refrigerador", defaultDaysToExpiry: 5 },
  { name: "Limón", quantity: 3, unit: "unidades", location: "refrigerador", defaultDaysToExpiry: 10 },
  { name: "Arroz", quantity: 1, unit: "kg", location: "alacena", defaultDaysToExpiry: 180 },
  { name: "Pasta", quantity: 500, unit: "g", location: "alacena", defaultDaysToExpiry: 180 },
  { name: "Aceite de oliva", quantity: 500, unit: "ml", location: "alacena", defaultDaysToExpiry: 180 },
  { name: "Salsa de tomate", quantity: 500, unit: "ml", location: "alacena", defaultDaysToExpiry: 90 },
  { name: "Atún en lata", quantity: 160, unit: "g", location: "alacena", defaultDaysToExpiry: 365 },
  { name: "Avena", quantity: 500, unit: "g", location: "alacena", defaultDaysToExpiry: 120 },
  { name: "Pan de molde", quantity: 12, unit: "unidades", location: "alacena", defaultDaysToExpiry: 4 },
  { name: "Papa", quantity: 1, unit: "kg", location: "alacena", defaultDaysToExpiry: 14 },
  { name: "Cebolla", quantity: 3, unit: "unidades", location: "alacena", defaultDaysToExpiry: 14 },
  { name: "Ajo", quantity: 6, unit: "unidades", location: "alacena", defaultDaysToExpiry: 21 },
  { name: "Plátano", quantity: 3, unit: "unidades", location: "alacena", defaultDaysToExpiry: 3 },
  { name: "Frijoles cocidos", quantity: 400, unit: "g", location: "alacena", defaultDaysToExpiry: 180 },
];

export function formatOffsetDate(daysFromToday: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDemoPantryItems(): {
  name: string;
  quantity: number;
  unit: PantryUnit;
  location: PantryLocation;
  bestBefore?: string;
}[] {
  return [
    { name: "Huevos", quantity: 2, unit: "unidades", location: "refrigerador", bestBefore: formatOffsetDate(4) },
    { name: "Espinaca", quantity: 120, unit: "g", location: "refrigerador", bestBefore: formatOffsetDate(0) },
    { name: "Queso", quantity: 180, unit: "g", location: "refrigerador", bestBefore: formatOffsetDate(3) },
    { name: "Leche", quantity: 1, unit: "L", location: "refrigerador", bestBefore: formatOffsetDate(2) },
    { name: "Mantequilla", quantity: 150, unit: "g", location: "refrigerador", bestBefore: formatOffsetDate(15) },
    { name: "Pollo", quantity: 400, unit: "g", location: "congelador", bestBefore: formatOffsetDate(25) },
    { name: "Avena", quantity: 500, unit: "g", location: "alacena", bestBefore: formatOffsetDate(90) },
    { name: "Plátano", quantity: 2, unit: "unidades", location: "alacena", bestBefore: formatOffsetDate(1) },
    { name: "Pan de molde", quantity: 8, unit: "unidades", location: "alacena", bestBefore: formatOffsetDate(2) },
    { name: "Papa", quantity: 600, unit: "g", location: "alacena", bestBefore: formatOffsetDate(10) },
    { name: "Cebolla", quantity: 2, unit: "unidades", location: "alacena", bestBefore: formatOffsetDate(12) },
    { name: "Aceite de oliva", quantity: 500, unit: "ml", location: "alacena", bestBefore: formatOffsetDate(180) },
  ];
}

export function inferLocationForIngredient(name: string): PantryLocation {
  const lower = name.toLowerCase();
  const preset = QUICK_ADD_PRESETS.find(
    (p) => p.name.toLowerCase() === lower || lower.includes(p.name.toLowerCase())
  );
  if (preset) return preset.location;

  if (
    lower.includes("pollo") ||
    lower.includes("carne") ||
    lower.includes("pescado") ||
    lower.includes("leche") ||
    lower.includes("queso") ||
    lower.includes("huevo") ||
    lower.includes("yogur") ||
    lower.includes("espinaca") ||
    lower.includes("tomate") ||
    lower.includes("zanahoria") ||
    lower.includes("pimiento") ||
    lower.includes("mantequilla")
  ) {
    return "refrigerador";
  }

  if (lower.includes("congelad") || lower.includes("helad")) {
    return "congelador";
  }

  return "alacena";
}
