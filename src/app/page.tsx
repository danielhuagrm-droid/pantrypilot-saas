"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import recipesData from "@/data/recipes.json";
import { getDemoPantryItems, inferLocationForIngredient } from "@/data/quick-add";
import { deductRecipeFromPantry, evaluateAllRecipes } from "@/lib/recipe-engine";
import {
  FREE_PLAN_MAX_ITEMS,
  createId,
  loadPantryFromStorage,
  loadShoppingFromStorage,
  savePantryToStorage,
  saveShoppingToStorage,
} from "@/lib/storage";
import {
  fromBaseToPreferred,
  getUnitFamily,
  normalizeCanonical,
  roundClean,
  toBaseUnit,
} from "@/lib/units";
import {
  AppTab,
  EvaluatedRecipe,
  FalseDoorFeatureId,
  PantryItem,
  PantryLocation,
  PantryUnit,
  Recipe,
  ShoppingItem,
} from "@/types/pantry";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { PantryView } from "@/components/PantryView";
import { RecipesView } from "@/components/RecipesView";
import { ShoppingListView, createManualShoppingItem } from "@/components/ShoppingListView";
import { UpgradeModal } from "@/components/UpgradeModal";

const RECIPES = recipesData as Recipe[];

interface ToastState {
  message: string;
  tone: "success" | "warning";
}

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("despensa");

  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // Recipe filter state (shared so header/bottom-nav ready badge stays synced!)
  const [servings, setServings] = useState(2);
  const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
  const [prioritizeExpiring, setPrioritizeExpiring] = useState(true);

  // Upgrade False Door modal state
  const [activeFalseDoor, setActiveFalseDoor] = useState<FalseDoorFeatureId | null>(null);

  // Toast notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: "success" | "warning" = "success") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial localStorage hydration
  useEffect(() => {
    setPantry(loadPantryFromStorage());
    setShoppingList(loadShoppingFromStorage());
    setHydrated(true);
  }, []);

  // Persist pantry
  useEffect(() => {
    if (hydrated) {
      savePantryToStorage(pantry);
    }
  }, [pantry, hydrated]);

  // Persist shopping list
  useEffect(() => {
    if (hydrated) {
      saveShoppingToStorage(shoppingList);
    }
  }, [shoppingList, hydrated]);

  const readyRecipesCount = useMemo(() => {
    const evaluated = evaluateAllRecipes(RECIPES, pantry, {
      servings,
      maxPrepTime,
      prioritizeExpiring,
    });
    return evaluated.filter((r) => r.isReady).length;
  }, [pantry, servings, maxPrepTime, prioritizeExpiring]);

  const pendingShoppingCount = useMemo(
    () => shoppingList.filter((i) => !i.purchased).length,
    [shoppingList]
  );

  // Pantry Actions
  const handleAddPantryItem = useCallback(
    (newItem: Omit<PantryItem, "id" | "createdAt">): boolean => {
      const canonNew = normalizeCanonical(newItem.name);
      const existingIdx = pantry.findIndex(
        (item) =>
          normalizeCanonical(item.name) === canonNew &&
          item.location === newItem.location &&
          item.unit === newItem.unit
      );

      if (existingIdx !== -1) {
        const updated = [...pantry];
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          quantity: roundClean(existing.quantity + newItem.quantity),
          bestBefore: newItem.bestBefore ?? existing.bestBefore,
        };
        setPantry(updated);
        showToast(`Cantidad sumada a ${newItem.name} en tu despensa.`);
        return true;
      }

      if (pantry.length >= FREE_PLAN_MAX_ITEMS) {
        showToast(
          `Alcanzaste el límite de ${FREE_PLAN_MAX_ITEMS} productos del Plan Free.`,
          "warning"
        );
        setActiveFalseDoor("unlimited_items");
        return false;
      }

      setPantry([
        {
          ...newItem,
          id: createId(),
          createdAt: new Date().toISOString(),
        },
        ...pantry,
      ]);
      showToast(`${newItem.name} agregado a tu despensa.`);
      return true;
    },
    [pantry, showToast]
  );

  const handleUpdatePantryItem = useCallback(
    (id: string, updates: Partial<Omit<PantryItem, "id" | "createdAt">>) => {
      setPantry((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    },
    []
  );

  const handleDeletePantryItem = useCallback(
    (id: string) => {
      setPantry((prev) => prev.filter((item) => item.id !== id));
      showToast("Producto eliminado de tu despensa.");
    },
    [showToast]
  );

  const handleLoadDemoPantry = useCallback(() => {
    const demo = getDemoPantryItems().map((item) => ({
      ...item,
      id: createId(),
      createdAt: new Date().toISOString(),
    }));
    setPantry(demo);
    showToast("Despensa de ejemplo cargada (incluye alertas de consumo y 2 huevos para probar).");
  }, [showToast]);

  // Recipe Actions
  const handleSendMissingToShopping = useCallback(
    (evaluated: EvaluatedRecipe) => {
      if (evaluated.missingIngredients.length === 0) return;

      const next = [...shoppingList];
      let addedCount = 0;

      for (const miss of evaluated.missingIngredients) {
        const neededBase = miss.unitMismatch ? miss.requiredQuantity : miss.missingQuantity;
        if (neededBase <= 0) continue;

        const preferred = fromBaseToPreferred(neededBase, miss.unit);
        const canon = normalizeCanonical(miss.ingredient.canonicalKey || miss.ingredient.name);
        const reqFamily = getUnitFamily(preferred.unit);

        const existingIdx = next.findIndex(
          (s) =>
            !s.purchased &&
            normalizeCanonical(s.canonicalKey || s.name) === canon &&
            getUnitFamily(s.unit) === reqFamily
        );

        if (existingIdx !== -1) {
          const existing = next[existingIdx];
          const totalBase =
            toBaseUnit(existing.quantity, existing.unit).value + neededBase;
          const mergedUnit = fromBaseToPreferred(totalBase, miss.unit);
          const sources = existing.sourceRecipe
            ? existing.sourceRecipe.includes(evaluated.recipe.name)
              ? existing.sourceRecipe
              : `${existing.sourceRecipe}, ${evaluated.recipe.name}`
            : evaluated.recipe.name;

          next[existingIdx] = {
            ...existing,
            quantity: mergedUnit.quantity,
            unit: mergedUnit.unit,
            sourceRecipe: sources,
          };
        } else {
          next.unshift({
            id: createId(),
            name: miss.ingredient.name,
            canonicalKey: canon,
            quantity: preferred.quantity,
            unit: preferred.unit,
            purchased: false,
            sourceRecipe: evaluated.recipe.name,
            suggestedLocation: inferLocationForIngredient(miss.ingredient.name),
            createdAt: new Date().toISOString(),
          });
        }
        addedCount++;
      }

      setShoppingList(next);
      showToast(
        `Se ${addedCount === 1 ? "envió 1 faltante" : `enviaron ${addedCount} faltantes`} de "${evaluated.recipe.name}" a Lista de Compras.`
      );
    },
    [shoppingList, showToast]
  );

  const handleMarkRecipeCooked = useCallback(
    (evaluated: EvaluatedRecipe) => {
      setPantry((prev) => deductRecipeFromPantry(evaluated, prev));
      showToast(`¡Buen provecho! Descontamos los ingredientes de "${evaluated.recipe.name}".`);
    },
    [showToast]
  );

  // Shopping List Actions
  const handleToggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item))
    );
  }, []);

  const handleAddManualShopping = useCallback(
    (input: { name: string; quantity: number; unit: PantryUnit }) => {
      const prepared = createManualShoppingItem(input);
      setShoppingList((prev) => [
        {
          ...prepared,
          id: createId(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast(`${input.name} añadido a tu lista de compras.`);
    },
    [showToast]
  );

  const handleRemoveShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleMoveShoppingItemToPantry = useCallback(
    (item: ShoppingItem, location: PantryLocation) => {
      const ok = handleAddPantryItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location,
      });
      if (ok) {
        setShoppingList((prev) => prev.filter((s) => s.id !== item.id));
        showToast(`${item.name} movido a tu despensa.`);
      }
    },
    [handleAddPantryItem, showToast]
  );

  const handleMoveAllPurchasedToPantry = useCallback(() => {
    const purchased = shoppingList.filter((i) => i.purchased);
    if (purchased.length === 0) return;

    const nextPantry = [...pantry];
    const movedIds: string[] = [];
    let stoppedByLimit = false;

    for (const sItem of purchased) {
      const canon = normalizeCanonical(sItem.name);
      const existingIdx = nextPantry.findIndex(
        (p) =>
          normalizeCanonical(p.name) === canon &&
          p.location === sItem.suggestedLocation &&
          p.unit === sItem.unit
      );

      if (existingIdx !== -1) {
        nextPantry[existingIdx] = {
          ...nextPantry[existingIdx],
          quantity: roundClean(nextPantry[existingIdx].quantity + sItem.quantity),
        };
        movedIds.push(sItem.id);
      } else if (nextPantry.length < FREE_PLAN_MAX_ITEMS) {
        nextPantry.unshift({
          id: createId(),
          name: sItem.name,
          quantity: sItem.quantity,
          unit: sItem.unit,
          location: sItem.suggestedLocation,
          createdAt: new Date().toISOString(),
        });
        movedIds.push(sItem.id);
      } else {
        stoppedByLimit = true;
        break;
      }
    }

    if (movedIds.length > 0) {
      setPantry(nextPantry);
      setShoppingList((prev) => prev.filter((s) => !movedIds.includes(s.id)));
      showToast(
        `${movedIds.length} ${movedIds.length === 1 ? "producto movido" : "productos movidos"} a tu despensa.`
      );
    }

    if (stoppedByLimit) {
      showToast(`Límite de ${FREE_PLAN_MAX_ITEMS} productos alcanzado.`, "warning");
      setActiveFalseDoor("unlimited_items");
    }
  }, [pantry, shoppingList, showToast]);

  const handleClearPurchased = useCallback(() => {
    setShoppingList((prev) => prev.filter((i) => !i.purchased));
    showToast("Productos comprados limpiados de la lista.");
  }, [showToast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f7]">
      <Header
        activeCount={pantry.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        readyRecipesCount={readyRecipesCount}
        pendingShoppingCount={pendingShoppingCount}
        onOpenFalseDoor={setActiveFalseDoor}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-12">
        {!hydrated ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 rounded-2xl bg-slate-200/70" />
            <div className="h-44 rounded-2xl bg-slate-200/70" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="h-32 rounded-2xl bg-slate-200/70" />
              <div className="h-32 rounded-2xl bg-slate-200/70" />
              <div className="h-32 rounded-2xl bg-slate-200/70" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === "despensa" && (
              <PantryView
                items={pantry}
                onAddItem={handleAddPantryItem}
                onUpdateItem={handleUpdatePantryItem}
                onDeleteItem={handleDeletePantryItem}
                onLoadDemo={handleLoadDemoPantry}
                onOpenFalseDoor={setActiveFalseDoor}
              />
            )}

            {activeTab === "recetas" && (
              <RecipesView
                recipes={RECIPES}
                pantry={pantry}
                servings={servings}
                onServingsChange={setServings}
                maxPrepTime={maxPrepTime}
                onMaxPrepTimeChange={setMaxPrepTime}
                prioritizeExpiring={prioritizeExpiring}
                onPrioritizeExpiringChange={setPrioritizeExpiring}
                onSendMissingToShopping={handleSendMissingToShopping}
                onMarkCooked={handleMarkRecipeCooked}
                onOpenFalseDoor={setActiveFalseDoor}
              />
            )}

            {activeTab === "compras" && (
              <ShoppingListView
                items={shoppingList}
                onTogglePurchased={handleToggleShoppingItem}
                onAddManual={handleAddManualShopping}
                onRemoveItem={handleRemoveShoppingItem}
                onMoveToPantry={handleMoveShoppingItemToPantry}
                onMoveAllPurchasedToPantry={handleMoveAllPurchasedToPantry}
                onClearPurchased={handleClearPurchased}
                onOpenFalseDoor={setActiveFalseDoor}
              />
            )}
          </>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pantryCount={pantry.length}
        readyRecipesCount={readyRecipesCount}
        pendingShoppingCount={pendingShoppingCount}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-lg border max-w-[92vw] ${
            toast.tone === "warning"
              ? "bg-amber-900 text-amber-50 border-amber-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          {toast.tone === "warning" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-300" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* False Door Upgrade / Early Access Modal */}
      {activeFalseDoor && (
        <UpgradeModal
          key={activeFalseDoor}
          featureId={activeFalseDoor}
          onClose={() => setActiveFalseDoor(null)}
        />
      )}
    </div>
  );
}
