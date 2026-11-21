"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { FALSE_DOORS, PLAN_PRICING } from "@/data/plans";
import { FalseDoorFeatureId, PlanTier } from "@/types/pantry";

interface UpgradeModalProps {
  featureId: FalseDoorFeatureId | null;
  onClose: () => void;
}

export function UpgradeModal({ featureId, onClose }: UpgradeModalProps) {
  const initialPlan: PlanTier = featureId ? FALSE_DOORS[featureId].plan : "PLUS";
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(initialPlan);
  const [email, setEmail] = useState("");
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!featureId) return null;

  const feature = FALSE_DOORS[featureId];
  const plan = PLAN_PRICING[selectedPlan];
  const isFamily = plan.tier === "FAMILY";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Ingresa un correo electrónico válido para reservar tu 50% de descuento.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          feature: feature.title,
          plan: plan.tier,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "No pudimos guardar tu correo. Intenta de nuevo.");
      } else {
        setSuccessMsg(
          data.message || "¡Listo! Ya estás en la lista de acceso anticipado con 50% de descuento."
        );
        setEmail("");
      }
    } catch {
      setErrorMsg("Error de conexión. Verifica tu red e intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div
          className={`relative px-6 pt-6 pb-5 text-white ${
            isFamily
              ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700"
              : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide uppercase">
            {isFamily ? <Users className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
            Función {plan.tier} · Acceso Anticipado
          </div>

          <h2 id="upgrade-modal-title" className="mt-3 text-xl sm:text-2xl font-extrabold leading-tight">
            {feature.title}
          </h2>
          <p className="mt-1.5 text-sm text-white/90 leading-relaxed">{feature.description}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Plan Switcher: Plus vs Family */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSelectedPlan("PLUS")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                !isFamily
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              Plan Plus · $3.99/mes
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan("FAMILY")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                isFamily
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Plan Family · $5.99/mes
            </button>
          </div>

          {/* Pricing Cards (Monthly & Annual clearly shown) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-500">{plan.tagline}</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[11px] font-extrabold text-amber-800">
                50% dto. Acceso Anticipado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                  billingCycle === "monthly"
                    ? isFamily
                      ? "border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500"
                      : "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Plan Mensual
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{plan.monthlyPrice}</p>
                <p className="text-[11px] text-slate-500">Precio regular sugerido</p>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`relative rounded-xl border p-3 text-left transition cursor-pointer ${
                  billingCycle === "annual"
                    ? isFamily
                      ? "border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500"
                      : "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                  Recomendado
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Plan Anual
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{plan.annualPrice}</p>
                <p className="text-[11px] text-emerald-700 font-medium">{plan.annualSavingsLabel}</p>
              </button>
            </div>
          </div>

          {/* Feature & Plan Benefits */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Qué desbloqueas con {plan.name}
            </p>
            <ul className="space-y-2">
              {plan.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span
                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
                      isFamily
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Early Access Waitlist Form */}
          {successMsg ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-900">{successMsg}</p>
              <p className="text-xs text-emerald-700">
                Te avisaremos apenas activemos <strong>{feature.shortLabel}</strong> en PantryPilot.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                Volver a mi despensa
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-900">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Estamos por lanzar esta función. Únete hoy y asegura un{" "}
                  <strong>50% de descuento</strong> al lanzamiento.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60 ${
                    isFamily
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Quiero 50% de descuento"
                  )}
                </button>
              </div>

              {errorMsg && <p className="text-xs font-medium text-rose-600">{errorMsg}</p>}

              <p className="text-[11px] text-center text-slate-400">
                Sin spam ni tarjeta requerida. Solo te avisaremos cuando tu acceso anticipado esté listo.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
