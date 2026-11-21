import { FalseDoorFeatureId, PlanTier } from "@/types/pantry";

export interface PlanPricing {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  annualSavingsLabel: string;
  accentBg: string;
  accentText: string;
  badgeClasses: string;
  highlights: string[];
}

export interface FalseDoorConfig {
  id: FalseDoorFeatureId;
  title: string;
  shortLabel: string;
  plan: PlanTier;
  headline: string;
  description: string;
  featureBullets: string[];
}

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  PLUS: {
    tier: "PLUS",
    name: "PantryPilot Plus",
    tagline: "Automatiza tu despensa y ahorra cada semana sin esfuerzo",
    monthlyPrice: "$3.99/mes",
    annualPrice: "$29.99/año",
    annualSavingsLabel: "Ahorra 37% con el plan anual",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-700",
    badgeClasses: "bg-emerald-100 text-emerald-800 border-emerald-200",
    highlights: [
      "Productos ilimitados en tu despensa (sin límite de 50)",
      "Escaneo de recibos de supermercado con OCR en segundos",
      "Planificador semanal automático con tus ingredientes reales",
      "Estadísticas de ahorro en dinero y reducción de desperdicio",
      "Sincronización en la nube entre móvil y computadora",
    ],
  },
  FAMILY: {
    tier: "FAMILY",
    name: "PantryPilot Family",
    tagline: "Despensa compartida en tiempo real para todo el hogar",
    monthlyPrice: "$5.99/mes",
    annualPrice: "$49.99/año",
    annualSavingsLabel: "Ahorra 30% con el plan anual",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-700",
    badgeClasses: "bg-indigo-100 text-indigo-800 border-indigo-200",
    highlights: [
      "Todo lo incluido en el Plan Plus",
      "Comparte tu despensa y lista de compras hasta con 5 personas",
      "Actualizaciones en tiempo real cuando alguien compra o cocina",
      "Alertas compartidas de productos con prioridad hoy",
      "Roles simples para organizar compras sin duplicar gastos",
    ],
  },
};

export const FALSE_DOORS: Record<FalseDoorFeatureId, FalseDoorConfig> = {
  ocr_receipt: {
    id: "ocr_receipt",
    title: "Escanear recibo de supermercado (OCR)",
    shortLabel: "Escanear recibo (OCR)",
    plan: "PLUS",
    headline: "Carga tu compra completa en 5 segundos",
    description:
      "Toma una foto a tu ticket o factura del supermercado y PantryPilot detectará productos, cantidades y ubicaciones automáticamente.",
    featureBullets: [
      "Reconoce productos y cantidades directamente desde el ticket",
      "Asigna zona sugerida (Refrigerador, Congelador, Alacena)",
      "Estima fechas de consumo preferente para avisarte a tiempo",
    ],
  },
  weekly_planner: {
    id: "weekly_planner",
    title: "Planificador semanal automático",
    shortLabel: "Planificador semanal automático",
    plan: "PLUS",
    headline: "Genera tu menú de lunes a domingo con un clic",
    description:
      "Crea un plan semanal equilibrado que primero consume lo que está por vencer y arma una lista de compras mínima para completar la semana.",
    featureBullets: [
      "Organiza almuerzos y cenas según el tiempo que tienes cada día",
      "Prioriza ingredientes en rojo y amarillo para cero desperdicio",
      "Calcula exactamente qué falta comprar para toda la semana",
    ],
  },
  waste_stats: {
    id: "waste_stats",
    title: "Estadísticas de ahorro y desperdicio",
    shortLabel: "Estadísticas de ahorro y desperdicio",
    plan: "PLUS",
    headline: "Descubre cuánto dinero y comida salvas cada mes",
    description:
      "Visualiza tu racha sin desperdicio, los alimentos que más rescatas a tiempo y el ahorro mensual estimado en tu presupuesto del súper.",
    featureBullets: [
      "Estimación mensual de ahorro en dinero al cocinar lo que ya tienes",
      "Seguimiento de ingredientes rescatados antes de vencer",
      "Alertas inteligentes de hábitos de compra repetitivos",
    ],
  },
  family_sharing: {
    id: "family_sharing",
    title: "Compartir despensa con mi hogar (hasta 5 personas)",
    shortLabel: "Compartir despensa con mi hogar",
    plan: "FAMILY",
    headline: "Todos en casa saben qué hay y qué falta comprar",
    description:
      "Invita hasta a 5 integrantes de tu hogar para mantener una despensa viva y una lista de compras sincronizada al instante.",
    featureBullets: [
      "Hasta 5 miembros conectados a la misma despensa y lista de compras",
      "Evita comprar leche o huevos dos veces el mismo día",
      "Sincronización instantánea desde cualquier celular",
    ],
  },
  unlimited_items: {
    id: "unlimited_items",
    title: "Desbloquear despensa ilimitada (+50 productos)",
    shortLabel: "Despensa ilimitada",
    plan: "PLUS",
    headline: "Lleva el control total sin límite de 50 productos",
    description:
      "Alcanzaste el límite gratuito de 50 productos activos. Con PantryPilot Plus puedes registrar toda tu cocina, escanear recibos y planificar tu semana.",
    featureBullets: [
      "Espacio ilimitado en Refrigerador, Congelador y Alacena",
      "Escaneo de recibos OCR y planificador semanal automático",
      "Respaldo automático en la nube en todos tus dispositivos",
    ],
  },
  plan_overview: {
    id: "plan_overview",
    title: "Mejora a PantryPilot Plus o Family",
    shortLabel: "Planes Plus / Family",
    plan: "PLUS",
    headline: "Elige el plan ideal para tu cocina o tu hogar",
    description:
      "Desbloquea productos ilimitados, escaneo de recibos OCR, planificador semanal automático y despensa compartida con acceso anticipado.",
    featureBullets: [
      "Sin límite de 50 productos activos en tu despensa",
      "Escaneo de recibos OCR y planificador semanal automático",
      "Opción Family para compartir despensa hasta con 5 personas",
    ],
  },
};
