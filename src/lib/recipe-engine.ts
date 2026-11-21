import { evaluateExpiry } from "@/lib/expiry";
import {
  formatIngredientQuantity,
  formatMissingPhrase,
  getUnitFamily,
  ingredientMatchesPantryName,
  roundClean,
  toBaseUnit,
} from "@/lib/units";
import {
  EvaluatedRecipe,
  ExpiryStatus,
  IngredientEvaluation,
  PantryItem,
  PantryUnit,
  Recipe,
} from "@/types/pantry";

export interface RecipeFilterOptions {
  servings: number;
  maxPrepTime: number | null; // null = sin límite
  prioritizeExpiring: boolean;
}

const EPSILON = 0.001;

function scaleIngredientQuantity(baseQty: number, baseServings: number, targetServings: number, unit: "g" | "ml" | "unidades"): number {
  const raw = (baseQty / baseServings) * targetServings;
  if (unit === "unidades") {
    // Escalar de forma práctica: si es casi entero, redondear a entero; si no, a 0.5
    const halfRounded = Math.round(raw * 2) / 2;
    return Math.max(0.5, halfRounded);
  }
  return Math.max(1, Math.round(raw));
}

function pickHighestUrgency(items: PantryItem[]): ExpiryStatus {
  let highest: ExpiryStatus = "none";
  for (const item of items) {
    const { status } = evaluateExpiry(item.bestBefore);
    if (status === "red") return "red";
    if (status === "yellow") highest = "yellow";
    else if (status === "green" && highest === "none") highest = "green";
  }
  return highest;
}

export function evaluateRecipeStrict(
  recipe: Recipe,
  pantry: PantryItem[],
  servings: number
): EvaluatedRecipe {
  const evaluations: IngredientEvaluation[] = [];
  const expiringMatches: EvaluatedRecipe["expiringMatches"] = [];
  let urgencyScore = 0;

  for (const ing of recipe.ingredients) {
    const requiredQuantity = scaleIngredientQuantity(
      ing.quantity,
      recipe.baseServings,
      servings,
      ing.unit
    );
    const reqFamily = getUnitFamily(ing.unit);

    const matchedItems = pantry.filter((item) =>
      ingredientMatchesPantryName(item.name, ing)
    );

    let availableInBase = 0;
    let mismatchedPantryUnit: PantryUnit | undefined;

    for (const item of matchedItems) {
      if (getUnitFamily(item.unit) === reqFamily) {
        const converted = toBaseUnit(item.quantity, item.unit);
        availableInBase += converted.value;
      } else {
        mismatchedPantryUnit = item.unit;
      }
    }

    availableInBase = roundClean(availableInBase);
    const unitMismatch = availableInBase <= 0 && Boolean(mismatchedPantryUnit);
    const isAvailable = availableInBase + EPSILON >= requiredQuantity;
    const missingQuantity = isAvailable
      ? 0
      : roundClean(Math.max(0, requiredQuantity - availableInBase));

    let missingMessage: string | null = null;
    if (!isAvailable) {
      if (unitMismatch && mismatchedPantryUnit) {
        missingMessage = `Necesitas ${formatIngredientQuantity(
          requiredQuantity,
          ing.unit,
          ing
        )} (en tu despensa está en ${mismatchedPantryUnit})`;
      } else {
        missingMessage = formatMissingPhrase(missingQuantity, ing.unit, ing);
      }
    }

    const urgencyStatus = matchedItems.length > 0 ? pickHighestUrgency(matchedItems) : "none";

    if (availableInBase > 0 && (urgencyStatus === "red" || urgencyStatus === "yellow")) {
      const label = urgencyStatus === "red" ? "Prioridad hoy" : "Usar pronto";
      expiringMatches.push({
        name: ing.name,
        status: urgencyStatus,
        label,
      });
      urgencyScore += urgencyStatus === "red" ? 10 : 4;
    }

    evaluations.push({
      ingredient: ing,
      requiredQuantity,
      availableQuantity: availableInBase,
      missingQuantity,
      unit: ing.unit,
      isAvailable,
      unitMismatch,
      mismatchedPantryUnit,
      missingMessage,
      matchedPantryItems: matchedItems,
      urgencyStatus,
    });
  }

  const matchedCount = evaluations.filter((e) => e.isAvailable).length;
  const totalIngredients = evaluations.length;
  const isReady = matchedCount === totalIngredients;
  const missingIngredients = evaluations.filter((e) => !e.isAvailable);

  // Porcentaje ponderado: cuenta disponibilidad parcial real pero nunca llega a 100% si falta algo
  const rawPercent =
    evaluations.reduce((acc, e) => {
      if (e.isAvailable) return acc + 1;
      if (e.requiredQuantity <= 0) return acc;
      return acc + Math.min(0.95, e.availableQuantity / e.requiredQuantity);
    }, 0) / totalIngredients;

  const completionPercent = isReady ? 100 : Math.min(99, Math.round(rawPercent * 100));

  return {
    recipe,
    servings,
    isReady,
    completionPercent,
    matchedCount,
    totalIngredients,
    missingIngredients,
    ingredientEvaluations: evaluations,
    expiringMatches,
    urgencyScore,
  };
}

export function evaluateAllRecipes(
  recipes: Recipe[],
  pantry: PantryItem[],
  options: RecipeFilterOptions
): EvaluatedRecipe[] {
  const filtered = options.maxPrepTime
    ? recipes.filter((r) => r.prepTimeMinutes <= options.maxPrepTime!)
    : recipes;

  const evaluated = filtered.map((recipe) =>
    evaluateRecipeStrict(recipe, pantry, options.servings)
  );

  return evaluated.sort((a, b) => {
    // 1. Siempre primero las 100% viables ("Listas para cocinar")
    if (a.isReady !== b.isReady) {
      return a.isReady ? -1 : 1;
    }

    // 2. Si priorizamos próximos a vencer, subir recetas que aprovechen alimentos en rojo/amarillo
    if (options.prioritizeExpiring && a.urgencyScore !== b.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }

    // 3. Mayor porcentaje de cobertura / menos ingredientes faltantes
    if (a.missingIngredients.length !== b.missingIngredients.length) {
      return a.missingIngredients.length - b.missingIngredients.length;
    }

    if (a.completionPercent !== b.completionPercent) {
      return b.completionPercent - a.completionPercent;
    }

    // 4. Desempate por urgencia aunque el toggle esté apagado o por menor tiempo
    if (a.urgencyScore !== b.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }

    return a.recipe.prepTimeMinutes - b.recipe.prepTimeMinutes;
  });
}

export function deductRecipeFromPantry(
  evaluated: EvaluatedRecipe,
  pantry: PantryItem[]
): PantryItem[] {
  const updated = pantry.map((item) => ({ ...item }));

  for (const ingEval of evaluated.ingredientEvaluations) {
    let remainingToDeduct = ingEval.requiredQuantity;
    const reqFamily = getUnitFamily(ingEval.unit);

    // Ordenar coincidencias para consumir primero las que vencen antes
    const matchingIndices = updated
      .map((item, idx) => ({ item, idx }))
      .filter(
        ({ item }) =>
          ingredientMatchesPantryName(item.name, ingEval.ingredient) &&
          getUnitFamily(item.unit) === reqFamily &&
          item.quantity > 0
      )
      .sort((a, b) => {
        const da = evaluateExpiry(a.item.bestBefore).daysRemaining ?? 9999;
        const db = evaluateExpiry(b.item.bestBefore).daysRemaining ?? 9999;
        return da - db;
      });

    for (const { idx } of matchingIndices) {
      if (remainingToDeduct <= EPSILON) break;
      const item = updated[idx];
      const itemBase = toBaseUnit(item.quantity, item.unit).value;

      if (itemBase <= remainingToDeduct + EPSILON) {
        remainingToDeduct -= itemBase;
        item.quantity = 0;
      } else {
        const newBase = itemBase - remainingToDeduct;
        remainingToDeduct = 0;
        if (item.unit === "kg" || item.unit === "L") {
          item.quantity = roundClean(newBase / 1000);
        } else {
          item.quantity = roundClean(newBase);
        }
      }
    }
  }

  return updated.filter((item) => item.quantity > EPSILON);
}
