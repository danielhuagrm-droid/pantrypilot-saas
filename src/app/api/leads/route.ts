import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY.");
      return NextResponse.json(
        { ok: false, error: "Configuración del servidor incompleta. Intenta más tarde." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawFeature = body?.funcion_pro ?? body?.feature;
    const funcionPro = typeof rawFeature === "string" ? rawFeature.trim() : "";
    const plan = typeof body?.plan === "string" ? body.plan.trim().toUpperCase() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Por favor ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!funcionPro || !plan) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos de la función o plan seleccionado." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.from("leads").insert([
      {
        email,
        funcion_pro: funcionPro,
        plan,
      },
    ]);

    if (error) {
      console.error("Error guardando lead en Supabase:", error);
      return NextResponse.json(
        { ok: false, error: "No pudimos registrar tu correo en este momento. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "¡Listo! Te reservamos tu 50% de descuento en la lista de acceso anticipado.",
    });
  } catch (error) {
    console.error("Error inesperado en /api/leads:", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos registrar tu correo en este momento. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
