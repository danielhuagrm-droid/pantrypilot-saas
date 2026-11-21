"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { evaluateAllRecipes } from "@/lib/recipe-engine";
import { formatIngredientQuantity } from "@/lib/units";
import {
  EvaluatedRecipe,
  FalseDoorFeatureId,
  PantryItem,
  Recipe,
} from "@/types/pantry";

interface RecipesViewProps {
  recipes: Recipe[];
  pantry: PantryItem[];
  servings: number;
  onServingsChange: (servings: number) => void;
  maxPrepTime: number | null;
  onMaxPrepTimeChange: (minutes: number | null) => void;
  prioritizeExpiring: boolean;
  onPrioritizeExpiringChange: (val: boolean) => void;
  onSendMissingToShopping: (evaluated: EvaluatedRecipe) => void;
  onMarkCooked: (evaluated: EvaluatedRecipe) => void;
  onOpenFalseDoor: (featureId: FalseDoorFeatureId) => void;
}

const TIME_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Cualquier tiempo", value: null },
  { label: "≤ 15 min", value: 15 },
  { label: "≤ 25 min", value: 25 },
  { label: "≤ 35 min", value: 35 },
];

export function RecipesView({
  recipes,
  pantry,
  servings,
  onServingsChange,
  maxPrepTime,
  onMaxPrepTimeChange,
  prioritizeExpiring,
  onPrioritizeExpiringChange,
  onSendMissingToShopping,
  onMarkCooked,
  onOpenFalseDoor,
}: RecipesViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [onlyReady, setOnlyReady] = useState(false);

  const evaluatedRecipes = useMemo(
    () =>
      evaluateAllRecipes(recipes, pantry, {
        servings,
        maxPrepTime,
        prioritizeExpiring,
      }),
    [recipes, pantry, servings, maxPrepTime, prioritizeExpiring]
  );

  const displayedRecipes = useMemo(
    () => (onlyReady ? evaluatedRecipes.filter((r) => r.isReady) : evaluatedRecipes),
    [evaluatedRecipes, onlyReady]
  );

  const readyCount = evaluatedRecipes.filter((r) => r.isReady).length;
  const selectedEvaluation = evaluatedRecipes.find((e) => e.recipe.id === selectedRecipeId) ?? null;

  return (
    <div className="space-y-5">
      {/* False Door Banner: Planificador semanal automático (PLUS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 p-4 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold">
                Planificador semanal automático
              </h2>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                PLUS
              </span>
            </div>
            <p className="mt-0.5 text-xs text-emerald-50">
              Genera tu menú de toda la semana priorizando tu refrigerador y minimizando tus compras.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenFalseDoor("weekly_planner")}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-emerald-700 shadow-xs hover:bg-emerald-50 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Probar planificador
        </button>
      </div>

      {/* Controls Card: Servings, Max Time, Prioritize Expiring */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Servings Stepper */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                Número de personas
              </p>
              <p className="text-[11px] text-slate-500">Escala cantidades exactas</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
                aria-label="Reducir personas"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:text-emerald-700 transition cursor-pointer disabled:opacity-40"
                disabled={servings <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-extrabold text-slate-900">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => onServingsChange(Math.min(8, servings + 1))}
                aria-label="Aumentar personas"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:text-emerald-700 transition cursor-pointer disabled:opacity-40"
                disabled={servings >= 8}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Max Prep Time */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              Tiempo máximo disponible
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((opt) => {
                const active = maxPrepTime === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onMaxPrepTimeChange(opt.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prioritize Expiring Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
            <div className="md:text-right">
              <p className="text-xs font-bold text-slate-800">Priorizar por vencer</p>
              <p className="text-[11px] text-slate-500">Sube recetas con alertas</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prioritizeExpiring}
              onClick={() => onPrioritizeExpiringChange(!prioritizeExpiring)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                prioritizeExpiring ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition-transform ${
                  prioritizeExpiring ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Summary & Quick Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {readyCount} {readyCount === 1 ? "lista para cocinar" : "listas para cocinar"}
            </span>
            <span className="text-slate-500">
              Verificación estricta de cantidades sobre {evaluatedRecipes.length} recetas
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOnlyReady((prev) => !prev)}
            className={`rounded-lg border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              onlyReady
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {onlyReady ? "Mostrando solo 100% viables" : "Solo listas para cocinar"}
          </button>
        </div>
      </section>

      {/* Recipes Grid */}
      {displayedRecipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
          <ChefHat className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">
            No hay recetas que cumplan con este filtro ahora mismo
          </p>
          <p className="text-xs text-slate-500">
            Prueba quitando el filtro de solo 100% viables o aumentando el tiempo disponible para ver
            qué te falta comprar.
          </p>
          <button
            type="button"
            onClick={() => {
              setOnlyReady(false);
              onMaxPrepTimeChange(null);
            }}
            className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
          >
            Ver todas las recetas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayedRecipes.map((evalItem) => {
            const { recipe, isReady, missingIngredients, expiringMatches, completionPercent } =
              evalItem;

            return (
              <article
                key={recipe.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
                  isReady ? "border-emerald-300/90 ring-1 ring-emerald-500/15" : "border-slate-200/80"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Lista para cocinar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          {missingIngredients.length === 1
                            ? "Falta 1 ingrediente"
                            : `Faltan ${missingIngredients.length} ingredientes`}
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {recipe.category}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {recipe.prepTimeMinutes} min
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {recipe.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Expiring Ingredients Rescued */}
                  {expiringMatches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {expiringMatches.map((m) => (
                        <span
                          key={m.name}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                            m.status === "red"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          <Flame className="h-3 w-3" />
                          Aprovecha {m.name} ({m.label})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Strict Coverage Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">
                        Para {servings} {servings === 1 ? "persona" : "personas"} ·{" "}
                        {evalItem.matchedCount}/{evalItem.totalIngredients} completos
                      </span>
                      <span
                        className={`font-extrabold ${
                          isReady ? "text-emerald-700" : "text-slate-700"
                        }`}
                      >
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isReady
                            ? "bg-emerald-500"
                            : completionPercent >= 60
                              ? "bg-amber-400"
                              : "bg-slate-400"
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Strict Missing Details */}
                  {!isReady ? (
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
                        Lo que te falta exactamente:
                      </p>
                      <ul className="space-y-1">
                        {missingIngredients.map((miss) => (
                          <li
                            key={miss.ingredient.canonicalKey}
                            className="flex items-start justify-between gap-2 text-xs text-slate-800"
                          >
                            <span className="font-semibold text-rose-700">
                              • {miss.missingMessage}
                            </span>
                            {miss.availableQuantity > 0 && !miss.unitMismatch && (
                              <span className="shrink-0 text-[11px] text-slate-500">
                                (tienes{" "}
                                {formatIngredientQuantity(
                                  miss.availableQuantity,
                                  miss.unit,
                                  miss.ingredient
                                )}
                                )
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-800">
                      Tienes las cantidades exactas de todos los ingredientes para {servings}{" "}
                      {servings === 1 ? "persona" : "personas"}.
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Utensils className="h-3.5 w-3.5" />
                    Ver pasos e ingredientes
                  </button>

                  {!isReady ? (
                    <button
                      type="button"
                      onClick={() => onSendMissingToShopping(evalItem)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Enviar faltantes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkCooked(evalItem)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ya la cociné
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedEvaluation && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedRecipeId(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-xs px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {selectedEvaluation.recipe.category}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {selectedEvaluation.recipe.prepTimeMinutes} min · {selectedEvaluation.servings}{" "}
                    {selectedEvaluation.servings === 1 ? "persona" : "personas"}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  {selectedEvaluation.recipe.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipeId(null)}
                aria-label="Cerrar receta"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-slate-600">{selectedEvaluation.recipe.description}</p>

              {/* Scaled Ingredient Verification List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ingredientes exactos (para {selectedEvaluation.servings}{" "}
                  {selectedEvaluation.servings === 1 ? "persona" : "personas"})
                </h4>
                <ul className="space-y-2">
                  {selectedEvaluation.ingredientEvaluations.map((ev) => (
                    <li
                      key={ev.ingredient.canonicalKey}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${
                        ev.isAvailable
                          ? "border-emerald-200/80 bg-emerald-50/40"
                          : "border-amber-200/80 bg-amber-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {ev.isAvailable ? (
                          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">
                            {formatIngredientQuantity(
                              ev.requiredQuantity,
                              ev.unit,
                              ev.ingredient
                            )}
                          </p>
                          {!ev.isAvailable && ev.missingMessage && (
                            <p className="text-xs font-semibold text-rose-700 mt-0.5">
                              {ev.missingMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {ev.isAvailable
                          ? "En despensa"
                          : ev.availableQuantity > 0
                            ? `Tienes ${formatIngredientQuantity(
                                ev.availableQuantity,
                                ev.unit,
                                ev.ingredient
                              )}`
                            : "No tienes"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparation Steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Preparación paso a paso
                </h4>
                <ol className="space-y-2.5">
                  {selectedEvaluation.recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer Action */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                {!selectedEvaluation.isReady ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSendMissingToShopping(selectedEvaluation);
                      setSelectedRecipeId(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Enviar {selectedEvaluation.missingIngredients.length} faltantes a Lista de Compras
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkCooked(selectedEvaluation);
                      setSelectedRecipeId(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como cocinada (descontar de despensa)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
