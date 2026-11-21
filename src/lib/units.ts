import { PantryUnit, RecipeBaseUnit, RecipeIngredient } from "@/types/pantry";

export type UnitFamily = "mass" | "volume" | "count";

export function getUnitFamily(unit: PantryUnit): UnitFamily {
  if (unit === "g" || unit === "kg") return "mass";
  if (unit === "ml" || unit === "L") return "volume";
  return "count";
}

export function toBaseUnit(quantity: number, unit: PantryUnit): { value: number; baseUnit: RecipeBaseUnit } {
  if (unit === "kg") return { value: quantity * 1000, baseUnit: "g" };
  if (unit === "g") return { value: quantity, baseUnit: "g" };
  if (unit === "L") return { value: quantity * 1000, baseUnit: "ml" };
  if (unit === "ml") return { value: quantity, baseUnit: "ml" };
  return { value: quantity, baseUnit: "unidades" };
}

export function fromBaseToPreferred(value: number, baseUnit: RecipeBaseUnit): { quantity: number; unit: PantryUnit } {
  if (baseUnit === "g" && value >= 1000) {
    return { quantity: roundClean(value / 1000), unit: "kg" };
  }
  if (baseUnit === "ml" && value >= 1000) {
    return { quantity: roundClean(value / 1000), unit: "L" };
  }
  return { quantity: roundClean(value), unit: baseUnit };
}

export function roundClean(num: number): number {
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? rounded : Math.round(num * 10) / 10;
}

export function formatNumber(num: number): string {
  const clean = roundClean(num);
  return clean % 1 === 0 ? String(clean) : clean.toFixed(1).replace(/\.0$/, "");
}

export function formatQuantityWithUnit(quantity: number, unit: PantryUnit): string {
  const cleanQty = formatNumber(quantity);
  if (unit === "unidades") {
    return `${cleanQty} ${roundClean(quantity) === 1 ? "unidad" : "unidades"}`;
  }
  return `${cleanQty} ${unit}`;
}

export function formatIngredientQuantity(
  quantity: number,
  unit: RecipeBaseUnit,
  ingredient?: Pick<RecipeIngredient, "name" | "singularLabel" | "pluralLabel">
): string {
  if (unit === "unidades") {
    const cleanNum = roundClean(quantity);
    const numStr = formatNumber(cleanNum);
    if (ingredient?.singularLabel && ingredient?.pluralLabel) {
      return `${numStr} ${cleanNum === 1 ? ingredient.singularLabel : ingredient.pluralLabel}`;
    }
    const label = ingredient ? ingredient.name.toLowerCase() : cleanNum === 1 ? "unidad" : "unidades";
    return `${numStr} ${label}`;
  }

  const preferred = fromBaseToPreferred(quantity, unit);
  const qtyStr = `${formatNumber(preferred.quantity)} ${preferred.unit}`;
  return ingredient ? `${qtyStr} de ${ingredient.name}` : qtyStr;
}

export function formatMissingPhrase(
  missingQuantity: number,
  unit: RecipeBaseUnit,
  ingredient: Pick<RecipeIngredient, "name" | "singularLabel" | "pluralLabel">
): string {
  const cleanNum = roundClean(missingQuantity);
  const verb = unit === "unidades" && cleanNum === 1 ? "Te falta" : "Te faltan";
  return `${verb} ${formatIngredientQuantity(cleanNum, unit, ingredient)}`;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripSpanishPlural(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("es") && !word.endsWith("tes") && !word.endsWith("ces")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s")) {
    return word.slice(0, -1);
  }
  return word;
}

export function normalizeCanonical(text: string): string {
  const norm = normalizeText(text);
  return norm
    .split(" ")
    .map((w) => stripSpanishPlural(w))
    .join(" ");
}

export function ingredientMatchesPantryName(
  pantryName: string,
  ingredient: Pick<RecipeIngredient, "name" | "canonicalKey" | "aliases">
): boolean {
  const pNorm = normalizeText(pantryName);
  const pCanon = normalizeCanonical(pantryName);
  if (!pNorm) return false;

  const candidates = [
    ingredient.canonicalKey,
    ingredient.name,
    ...(ingredient.aliases ?? []),
  ];

  for (const candidate of candidates) {
    const cNorm = normalizeText(candidate);
    const cCanon = normalizeCanonical(candidate);
    if (pNorm === cNorm || pCanon === cCanon) {
      return true;
    }
    // Permitir coincidencia cuando el nombre de despensa especifica variedad (ej. "pechuga de pollo" vs "pollo")
    // evitando falsos positivos muy cortos
    if (cCanon.length >= 4 && pCanon.split(" ").includes(cCanon)) {
      return true;
    }
    if (pCanon.length >= 4 && cCanon.split(" ").includes(pCanon)) {
      return true;
    }
  }

  return false;
}
