import { ExpiryInfo } from "@/types/pantry";

export function evaluateExpiry(bestBefore?: string): ExpiryInfo {
  if (!bestBefore) {
    return {
      status: "none",
      label: "Sin fecha",
      detail: "Sin fecha registrada",
      daysRemaining: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = bestBefore.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return {
      status: "none",
      label: "Sin fecha",
      detail: "Fecha inválida",
      daysRemaining: null,
    };
  }

  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining);
    return {
      status: "red",
      label: "Prioridad hoy",
      detail: absDays === 1 ? "Pasó ayer" : `Pasó hace ${absDays} días`,
      daysRemaining,
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "red",
      label: "Prioridad hoy",
      detail: "Fecha preferente hoy",
      daysRemaining: 0,
    };
  }

  if (daysRemaining === 1) {
    return {
      status: "red",
      label: "Prioridad hoy",
      detail: "Vence mañana",
      daysRemaining: 1,
    };
  }

  if (daysRemaining <= 4) {
    return {
      status: "yellow",
      label: "Usar pronto",
      detail: `En ${daysRemaining} días`,
      daysRemaining,
    };
  }

  return {
    status: "green",
    label: "En fecha",
    detail: `En ${daysRemaining} días`,
    daysRemaining,
  };
}

export function formatShortDate(isoDate?: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
