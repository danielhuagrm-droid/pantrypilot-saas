import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const LEADS_FILE = path.join(process.cwd(), "leads.csv");
const CSV_HEADER = "correo,funcion_clicada,plan,fecha\n";

function escapeCsvCell(value: string): string {
  const sanitized = value.replace(/\r?\n/g, " ").trim();
  if (sanitized.includes(",") || sanitized.includes('"')) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const feature = typeof body?.feature === "string" ? body.feature.trim() : "";
    const plan = typeof body?.plan === "string" ? body.plan.trim().toUpperCase() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Por favor ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!feature || !plan) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos de la función o plan seleccionado." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const row = `${escapeCsvCell(email)},${escapeCsvCell(feature)},${escapeCsvCell(plan)},${escapeCsvCell(timestamp)}\n`;

    try {
      await fs.access(LEADS_FILE);
    } catch {
      await fs.writeFile(LEADS_FILE, CSV_HEADER, "utf8");
    }

    await fs.appendFile(LEADS_FILE, row, "utf8");

    return NextResponse.json({
      ok: true,
      message: "¡Listo! Te reservamos tu 50% de descuento en la lista de acceso anticipado.",
    });
  } catch (error) {
    console.error("Error guardando lead en leads.csv:", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos registrar tu correo en este momento. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
