"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  PackagePlus,
  Plus,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { inferLocationForIngredient } from "@/data/quick-add";
import { formatQuantityWithUnit, normalizeCanonical, roundClean } from "@/lib/units";
import {
  FalseDoorFeatureId,
  PantryLocation,
  PantryUnit,
  ShoppingItem,
} from "@/types/pantry";

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onTogglePurchased: (id: string) => void;
  onAddManual: (item: { name: string; quantity: number; unit: PantryUnit }) => void;
  onRemoveItem: (id: string) => void;
  onMoveToPantry: (item: ShoppingItem, location: PantryLocation) => void;
  onMoveAllPurchasedToPantry: () => void;
  onClearPurchased: () => void;
  onOpenFalseDoor: (featureId: FalseDoorFeatureId) => void;
}

const UNITS: PantryUnit[] = ["unidades", "g", "kg", "ml", "L"];

export function ShoppingListView({
  items,
  onTogglePurchased,
  onAddManual,
  onRemoveItem,
  onMoveToPantry,
  onMoveAllPurchasedToPantry,
  onClearPurchased,
  onOpenFalseDoor,
}: ShoppingListViewProps) {
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualUnit, setManualUnit] = useState<PantryUnit>("unidades");
  const [locationOverrides, setLocationOverrides] = useState<Record<string, PantryLocation>>({});

  const pendingItems = items.filter((i) => !i.purchased);
  const purchasedItems = items.filter((i) => i.purchased);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualName.trim();
    const parsed = Number(manualQty);
    if (!trimmed || Number.isNaN(parsed) || parsed <= 0) return;

    onAddManual({
      name: trimmed,
      quantity: roundClean(parsed),
      unit: manualUnit,
    });
    setManualName("");
    setManualQty("1");
  }

  function getSelectedLocation(item: ShoppingItem): PantryLocation {
    return locationOverrides[item.id] ?? item.suggestedLocation ?? inferLocationForIngredient(item.name);
  }

  return (
    <div className="space-y-5">
      {/* Header + Family False Door */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Lista de Compras</h2>
          <p className="text-xs text-slate-500">
            Marca lo que compres en el súper y muévelo a tu despensa con un clic.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenFalseDoor("family_sharing")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
        >
          <Users className="h-4 w-4 text-indigo-600" />
          <span>Compartir lista con mi hogar</span>
          <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
            FAMILY
          </span>
        </button>
      </div>

      {/* Quick Manual Add */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
      >
        <input
          type="text"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="Agregar producto a la lista (ej. Huevos, Leche)..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0.1"
            step="any"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            className="w-20 rounded-xl border border-slate-300 px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
          <select
            value={manualUnit}
            onChange={(e) => setManualUnit(e.target.value as PantryUnit)}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </form>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Tu lista de compras está vacía</h3>
            <p className="text-sm text-slate-500">
              Desde la pestaña <strong>Recetas</strong>, presiona{" "}
              <em>“Enviar faltantes”</em> en cualquier receta para añadir automáticamente solo las
              cantidades exactas que necesitas comprar.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pending Section */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Por comprar ({pendingItems.length})
              </h3>
            </div>

            {pendingItems.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center text-xs font-semibold text-emerald-800">
                ¡Excelente! Ya marcaste todos los productos como comprados. Muévelos a tu despensa abajo.
              </div>
            ) : (
              <ul className="space-y-2">
                {pendingItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs transition hover:border-slate-300"
                  >
                    <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => onTogglePurchased(item.id)}
                        className="h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-700">
                            {formatQuantityWithUnit(item.quantity, item.unit)}
                          </span>
                          {item.sourceRecipe && (
                            <span className="truncate text-[11px] text-slate-400">
                              · Para: {item.sourceRecipe}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Purchased Section with Quick "Mover a mi despensa" */}
          {purchasedItems.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Comprados ({purchasedItems.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onMoveAllPurchasedToPantry}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    Mover todos a mi despensa
                  </button>
                  <button
                    type="button"
                    onClick={onClearPurchased}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/70 transition cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {purchasedItems.map((item) => {
                  const chosenLoc = getSelectedLocation(item);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onTogglePurchased(item.id)}
                          aria-label={`Desmarcar ${item.name}`}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-500 line-through truncate">
                            {item.name}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {formatQuantityWithUnit(item.quantity, item.unit)}
                          </p>
                        </div>
                      </div>

                      {/* Quick Move to Pantry Controls */}
                      <div className="flex items-center gap-2 sm:shrink-0 pl-8 sm:pl-0">
                        <select
                          aria-label={`Zona para ${item.name}`}
                          value={chosenLoc}
                          onChange={(e) =>
                            setLocationOverrides((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as PantryLocation,
                            }))
                          }
                          className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="refrigerador">Refrigerador</option>
                          <option value="congelador">Congelador</option>
                          <option value="alacena">Alacena</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => onMoveToPantry(item, chosenLoc)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                        >
                          <span>Mover a mi despensa</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function createManualShoppingItem(input: {
  name: string;
  quantity: number;
  unit: PantryUnit;
}): Omit<ShoppingItem, "id" | "createdAt"> {
  return {
    name: input.name,
    canonicalKey: normalizeCanonical(input.name),
    quantity: input.quantity,
    unit: input.unit,
    purchased: false,
    suggestedLocation: inferLocationForIngredient(input.name),
  };
}
