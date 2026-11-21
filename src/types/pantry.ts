export type PantryLocation = "refrigerador" | "congelador" | "alacena";

export type PantryUnit = "g" | "ml" | "unidades" | "kg" | "L";

export type RecipeBaseUnit = "g" | "ml" | "unidades";

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: PantryUnit;
  location: PantryLocation;
  bestBefore?: string; // ISO date YYYY-MM-DD (opcional)
  createdAt: string;
}

export type ExpiryStatus = "red" | "yellow" | "green" | "none";

export interface ExpiryInfo {
  status: ExpiryStatus;
  label: string;
  detail: string;
  daysRemaining: number | null;
}

export interface RecipeIngredient {
  name: string;
  canonicalKey: string;
  aliases?: string[];
  quantity: number;
  unit: RecipeBaseUnit;
  singularLabel?: string;
  pluralLabel?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: "Desayuno" | "Almuerzo" | "Cena" | "Rápida";
  prepTimeMinutes: number;
  baseServings: number;
  difficulty: "Fácil" | "Media";
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface IngredientEvaluation {
  ingredient: RecipeIngredient;
  requiredQuantity: number;
  availableQuantity: number;
  missingQuantity: number;
  unit: RecipeBaseUnit;
  isAvailable: boolean;
  unitMismatch: boolean;
  mismatchedPantryUnit?: PantryUnit;
  missingMessage: string | null;
  matchedPantryItems: PantryItem[];
  urgencyStatus: ExpiryStatus;
}

export interface EvaluatedRecipe {
  recipe: Recipe;
  servings: number;
  isReady: boolean;
  completionPercent: number;
  matchedCount: number;
  totalIngredients: number;
  missingIngredients: IngredientEvaluation[];
  ingredientEvaluations: IngredientEvaluation[];
  expiringMatches: {
    name: string;
    status: "red" | "yellow";
    label: string;
  }[];
  urgencyScore: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  canonicalKey: string;
  quantity: number;
  unit: PantryUnit;
  purchased: boolean;
  sourceRecipe?: string;
  suggestedLocation: PantryLocation;
  createdAt: string;
}

export type AppTab = "despensa" | "recetas" | "compras";

export type PlanTier = "PLUS" | "FAMILY";

export type FalseDoorFeatureId =
  | "ocr_receipt"
  | "weekly_planner"
  | "waste_stats"
  | "family_sharing"
  | "unlimited_items"
  | "plan_overview";
