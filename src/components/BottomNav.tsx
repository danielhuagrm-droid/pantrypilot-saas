"use client";

import { ChefHat, Package, ShoppingCart } from "lucide-react";
import { AppTab } from "@/types/pantry";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  pantryCount: number;
  readyRecipesCount: number;
  pendingShoppingCount: number;
}

export function BottomNav({
  activeTab,
  onTabChange,
  pantryCount,
  readyRecipesCount,
  pendingShoppingCount,
}: BottomNavProps) {
  const items: {
    id: AppTab;
    label: string;
    icon: typeof Package;
    badge?: number;
    badgeTone?: string;
  }[] = [
    {
      id: "despensa",
      label: "Mi Despensa",
      icon: Package,
      badge: pantryCount > 0 ? pantryCount : undefined,
      badgeTone: "bg-slate-200 text-slate-700",
    },
    {
      id: "recetas",
      label: "Recetas",
      icon: ChefHat,
      badge: readyRecipesCount > 0 ? readyRecipesCount : undefined,
      badgeTone: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "compras",
      label: "Compras",
      icon: ShoppingCart,
      badge: pendingShoppingCount > 0 ? pendingShoppingCount : undefined,
      badgeTone: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors cursor-pointer ${
                isActive
                  ? "text-emerald-700 bg-emerald-50/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.4]" : "stroke-[1.9]"}`} />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${item.badgeTone}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
