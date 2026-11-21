"use client";

import { Leaf } from "lucide-react";
import { FREE_PLAN_MAX_ITEMS } from "@/lib/storage";
import { AppTab, FalseDoorFeatureId } from "@/types/pantry";

interface HeaderProps {
  activeCount: number;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  readyRecipesCount: number;
  pendingShoppingCount: number;
  onOpenFalseDoor: (featureId: FalseDoorFeatureId) => void;
}

export function Header({
  activeCount,
  activeTab,
  onTabChange,
  readyRecipesCount,
  pendingShoppingCount,
  onOpenFalseDoor,
}: HeaderProps) {
  const usagePercent = Math.min(100, Math.round((activeCount / FREE_PLAN_MAX_ITEMS) * 100));
  const isNearLimit = activeCount >= 42;
  const isAtLimit = activeCount >= FREE_PLAN_MAX_ITEMS;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/20">
              <Leaf className="h-5 w-5" />
            </div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              PantryPilot
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center rounded-2xl bg-slate-100 p-1 gap-1 shrink-0"
          >
            <button
              type="button"
              onClick={() => onTabChange("despensa")}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "despensa"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mi Despensa
            </button>
            <button
              type="button"
              onClick={() => onTabChange("recetas")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "recetas"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Recetas</span>
              {readyRecipesCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[11px] font-bold text-emerald-700">
                  {readyRecipesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onTabChange("compras")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "compras"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Lista de Compras</span>
              {pendingShoppingCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800">
                  {pendingShoppingCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right: Compact Free Plan & Limit Pill */}
          <button
            type="button"
            onClick={() => onOpenFalseDoor(isAtLimit ? "unlimited_items" : "plan_overview")}
            title="Ver planes Plus y Family"
            className={`group flex shrink-0 flex-col items-end rounded-xl border px-3 py-1.5 transition cursor-pointer ${
              isAtLimit
                ? "border-rose-300 bg-rose-50 hover:bg-rose-100/80"
                : isNearLimit
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/60"
                  : "border-slate-200 bg-slate-50/90 hover:border-emerald-300 hover:bg-emerald-50/60"
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold leading-none whitespace-nowrap">
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">
                Free
              </span>
              <span className="text-slate-300">·</span>
              <span
                className={
                  isAtLimit
                    ? "text-rose-600"
                    : isNearLimit
                      ? "text-amber-700"
                      : "text-emerald-700"
                }
              >
                {activeCount}
                <span className="text-slate-400 font-semibold">/{FREE_PLAN_MAX_ITEMS}</span>
              </span>
            </span>
            <div className="mt-1.5 h-1.5 w-full min-w-[72px] overflow-hidden rounded-full bg-slate-200/90">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isAtLimit
                    ? "bg-rose-500"
                    : isNearLimit
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
