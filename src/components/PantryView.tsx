"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  BarChart3,
  Calendar,
  Camera,
  Check,
  Edit3,
  Info,
  Minus,
  Plus,
  Refrigerator,
  Search,
  Snowflake,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { QUICK_ADD_PRESETS, formatOffsetDate } from "@/data/quick-add";
import { evaluateExpiry, formatShortDate } from "@/lib/expiry";
import { FREE_PLAN_MAX_ITEMS } from "@/lib/storage";
import { formatQuantityWithUnit, roundClean } from "@/lib/units";
import {
  FalseDoorFeatureId,
  PantryItem,
  PantryLocation,
  PantryUnit,
} from "@/types/pantry";

interface PantryViewProps {
  items: PantryItem[];
  onAddItem: (item: Omit<PantryItem, "id" | "createdAt">) => boolean;
  onUpdateItem: (id: string, updates: Partial<Omit<PantryItem, "id" | "createdAt">>) => void;
  onDeleteItem: (id: string) => void;
  onLoadDemo: () => void;
  onOpenFalseDoor: (featureId: FalseDoorFeatureId) => void;
}

const LOCATION_META: Record<
  PantryLocation,
  { label: string; icon: typeof Refrigerator; badgeClass: string }
> = {
  refrigerador: {
    label: "Refrigerador",
    icon: Refrigerator,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  congelador: {
    label: "Congelador",
    icon: Snowflake,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  alacena: {
    label: "Alacena",
    icon: Archive,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

const UNITS: { value: PantryUnit; label: string }[] = [
  { value: "unidades", label: "unidades" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
];

function getStepForUnit(unit: PantryUnit): number {
  if (unit === "g" || unit === "ml") return 50;
  if (unit === "kg" || unit === "L") return 0.25;
  return 1;
}

export function PantryView({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onLoadDemo,
  onOpenFalseDoor,
}: PantryViewProps) {
  const [selectedZone, setSelectedZone] = useState<PantryLocation | "todos">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<PantryUnit>("unidades");
  const [location, setLocation] = useState<PantryLocation>("refrigerador");
  const [bestBefore, setBestBefore] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState<PantryUnit>("unidades");
  const [editLocation, setEditLocation] = useState<PantryLocation>("refrigerador");
  const [editBestBefore, setEditBestBefore] = useState("");

  const isAtLimit = items.length >= FREE_PLAN_MAX_ITEMS;

  const zoneCounts = useMemo(() => {
    return {
      todos: items.length,
      refrigerador: items.filter((i) => i.location === "refrigerador").length,
      congelador: items.filter((i) => i.location === "congelador").length,
      alacena: items.filter((i) => i.location === "alacena").length,
    };
  }, [items]);

  const trafficCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;
    for (const item of items) {
      const { status } = evaluateExpiry(item.bestBefore);
      if (status === "red") red++;
      else if (status === "yellow") yellow++;
      else if (status === "green") green++;
    }
    return { red, yellow, green };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((item) => {
        if (selectedZone !== "todos" && item.location !== selectedZone) return false;
        if (q && !item.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        // Ordenar por urgencia (rojo -> amarillo -> verde -> sin fecha) y luego por días restantes
        const ea = evaluateExpiry(a.bestBefore);
        const eb = evaluateExpiry(b.bestBefore);
        const rank = { red: 0, yellow: 1, green: 2, none: 3 };
        if (rank[ea.status] !== rank[eb.status]) {
          return rank[ea.status] - rank[eb.status];
        }
        const da = ea.daysRemaining ?? 9999;
        const db = eb.daysRemaining ?? 9999;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name, "es");
      });
  }, [items, selectedZone, searchQuery]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedQty = Number(quantity);
    if (!trimmedName || Number.isNaN(parsedQty) || parsedQty <= 0) return;

    const added = onAddItem({
      name: trimmedName,
      quantity: roundClean(parsedQty),
      unit,
      location,
      bestBefore: bestBefore || undefined,
    });

    if (added) {
      setName("");
      setQuantity("1");
      setBestBefore("");
    }
  }

  function handleQuickAdd(preset: (typeof QUICK_ADD_PRESETS)[number]) {
    onAddItem({
      name: preset.name,
      quantity: preset.quantity,
      unit: preset.unit,
      location: preset.location,
      bestBefore:
        preset.defaultDaysToExpiry !== undefined
          ? formatOffsetDate(preset.defaultDaysToExpiry)
          : undefined,
    });
  }

  function startEdit(item: PantryItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditLocation(item.location);
    setEditBestBefore(item.bestBefore ?? "");
  }

  function saveEdit(id: string) {
    const parsedQty = Number(editQty);
    if (!editName.trim() || Number.isNaN(parsedQty) || parsedQty <= 0) return;
    onUpdateItem(id, {
      name: editName.trim(),
      quantity: roundClean(parsedQty),
      unit: editUnit,
      location: editLocation,
      bestBefore: editBestBefore || undefined,
    });
    setEditingId(null);
  }

  function adjustQuantity(item: PantryItem, deltaSign: 1 | -1) {
    const step = getStepForUnit(item.unit);
    const nextQty = roundClean(item.quantity + deltaSign * step);
    if (nextQty <= 0) {
      onDeleteItem(item.id);
    } else {
      onUpdateItem(item.id, { quantity: nextQty });
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Action & Status Strip */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Traffic light summary */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Estado de tu despensa</h2>
            <span className="text-xs font-medium text-slate-500">
              {items.length} de {FREE_PLAN_MAX_ITEMS} productos
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-lg font-extrabold text-rose-700">{trafficCounts.red}</span>
              </div>
              <p className="text-[10px] font-semibold text-rose-700/90 mt-0.5">Prioridad hoy</p>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-lg font-extrabold text-amber-800">{trafficCounts.yellow}</span>
              </div>
              <p className="text-[10px] font-semibold text-amber-800/90 mt-0.5">Usar pronto</p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-lg font-extrabold text-emerald-700">{trafficCounts.green}</span>
              </div>
              <p className="text-[10px] font-semibold text-emerald-700/90 mt-0.5">En fecha</p>
            </div>
          </div>
        </div>

        {/* Natural False Doors: OCR + Stats + Family */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onOpenFalseDoor("ocr_receipt")}
            className="group flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 p-3.5 text-left shadow-xs hover:border-emerald-400 hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Camera className="h-4 w-4" />
              </div>
              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                PLUS
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xs font-bold text-slate-900 leading-snug">
                Escanear recibo de supermercado (OCR)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Carga tu compra en segundos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenFalseDoor("waste_stats")}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-xs hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                PLUS
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xs font-bold text-slate-900 leading-snug">
                Estadísticas de ahorro y desperdicio
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Mide tu dinero salvado</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenFalseDoor("family_sharing")}
            className="group flex flex-col justify-between rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-3.5 text-left shadow-xs hover:border-indigo-400 hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="h-4 w-4" />
              </div>
              <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                FAMILY
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xs font-bold text-slate-900 leading-snug">
                Compartir despensa con mi hogar
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Hasta 5 personas en vivo</p>
            </div>
          </button>
        </div>
      </div>

      {/* Limit reached banner */}
      {isAtLimit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold">
                Alcanzaste el límite gratuito de {FREE_PLAN_MAX_ITEMS} productos activos
              </p>
              <p className="text-xs text-rose-700">
                Elimina un producto agotado o desbloquea despensa ilimitada con PantryPilot Plus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenFalseDoor("unlimited_items")}
            className="shrink-0 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Ver Plan Plus
          </button>
        </div>
      )}

      {/* Quick Manual Entry + Quick-Add Chips */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Registro rápido de productos</h2>
              <p className="text-[11px] text-slate-500">
                Agrega manualmente o toca un ingrediente común
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {showForm ? "Ocultar formulario" : "Mostrar formulario"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleManualSubmit} className="p-4 space-y-3 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Name */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Producto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Huevos, Leche, Pollo..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2 sm:col-span-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Unidad
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as PantryUnit)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ubicación
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as PantryLocation)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="refrigerador">Refrigerador</option>
                  <option value="congelador">Congelador</option>
                  <option value="alacena">Alacena</option>
                </select>
              </div>

              {/* Best before date */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Consumo preferente <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={bestBefore}
                  onChange={(e) => setBestBefore(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-500">
                Tip: Si el producto ya existe en la misma zona y unidad, sumaremos la cantidad.
              </p>
              <button
                type="submit"
                disabled={isAtLimit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Agregar a mi despensa
              </button>
            </div>
          </form>
        )}

        {/* Quick-Add Common Ingredients */}
        <div className="bg-slate-50/70 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Agregado rápido (ingredientes comunes)
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap">
            {QUICK_ADD_PRESETS.slice(0, 14).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleQuickAdd(preset)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
              >
                <Plus className="h-3 w-3 text-emerald-600" />
                <span>{preset.name}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {formatQuantityWithUnit(preset.quantity, preset.unit)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Zone Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { id: "todos", label: "Todos", count: zoneCounts.todos },
              { id: "refrigerador", label: "Refrigerador", count: zoneCounts.refrigerador },
              { id: "congelador", label: "Congelador", count: zoneCounts.congelador },
              { id: "alacena", label: "Alacena", count: zoneCounts.alacena },
            ] as const
          ).map((zone) => {
            const active = selectedZone === zone.id;
            const ZoneIcon =
              zone.id === "todos" ? null : LOCATION_META[zone.id].icon;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {ZoneIcon && <ZoneIcon className="h-3.5 w-3.5" />}
                <span>{zone.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {zone.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en despensa..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Pantry Items Grid / Empty State */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Refrigerator className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Tu despensa está lista para despegar</h3>
            <p className="text-sm text-slate-500">
              Agrega tus ingredientes arriba con un toque o carga una despensa de ejemplo para probar
              el motor estricto de recetas y los semáforos de frescura al instante.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Cargar despensa de ejemplo (12 productos)
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No hay productos en esta zona o búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedZone("todos");
              setSearchQuery("");
            }}
            className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const expiry = evaluateExpiry(item.bestBefore);
            const locMeta = LOCATION_META[item.location];
            const LocIcon = locMeta.icon;
            const isEditing = editingId === item.id;

            const trafficBadgeClass =
              expiry.status === "red"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : expiry.status === "yellow"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : expiry.status === "green"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200";

            const dotClass =
              expiry.status === "red"
                ? "bg-rose-500"
                : expiry.status === "yellow"
                  ? "bg-amber-500"
                  : expiry.status === "green"
                    ? "bg-emerald-500"
                    : "bg-slate-400";

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-emerald-500 bg-white p-4 shadow-sm space-y-2.5"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-semibold text-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                    />
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value as PantryUnit)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value as PantryLocation)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    >
                      <option value="refrigerador">Refrigerador</option>
                      <option value="congelador">Congelador</option>
                      <option value="alacena">Alacena</option>
                    </select>
                    <input
                      type="date"
                      value={editBestBefore}
                      onChange={(e) => setEditBestBefore(e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Guardar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <article
                key={item.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition hover:shadow-sm ${
                  expiry.status === "red"
                    ? "border-rose-200/90"
                    : expiry.status === "yellow"
                      ? "border-amber-200/90"
                      : "border-slate-200/80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${locMeta.badgeClass}`}
                        >
                          <LocIcon className="h-3 w-3" />
                          {locMeta.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${trafficBadgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                          {expiry.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label={`Editar ${item.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.bestBefore && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>
                        Preferente: <strong className="text-slate-700">{formatShortDate(item.bestBefore)}</strong>{" "}
                        · {expiry.detail}
                      </span>
                    </p>
                  )}
                </div>

                {/* Quantity Stepper */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatQuantityWithUnit(item.quantity, item.unit)}
                  </span>
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item, -1)}
                      aria-label={`Disminuir cantidad de ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item, 1)}
                      aria-label={`Aumentar cantidad de ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-emerald-700 hover:shadow-xs transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Discreet Best-Before / Food Safety Disclaimer */}
      <footer className="rounded-2xl border border-slate-200/80 bg-slate-100/70 px-4 py-3 flex items-start gap-2.5 text-slate-500">
        <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="font-semibold text-slate-600">Nota sobre fechas de consumo:</strong>{" "}
          Las etiquetas de semáforo se basan en fechas de <em>consumo preferente / calidad</em>{" "}
          ingresadas por ti para ayudarte a priorizar ingredientes y reducir desperdicios. No
          garantizan seguridad alimentaria; revisa siempre el olor, textura y estado de cada alimento
          antes de consumirlo.
        </p>
      </footer>
    </div>
  );
}
