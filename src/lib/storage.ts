import { PantryItem, ShoppingItem } from "@/types/pantry";

export const FREE_PLAN_MAX_ITEMS = 50;

const PANTRY_STORAGE_KEY = "pantrypilot_pantry_v1";
const SHOPPING_STORAGE_KEY = "pantrypilot_shopping_v1";

export function loadPantryFromStorage(): PantryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PANTRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePantryToStorage(items: PantryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadShoppingFromStorage(): ShoppingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHOPPING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveShoppingToStorage(items: ShoppingItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
