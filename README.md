# PantryPilot — MVP (Fase 1)

**"From Grocery Receipt to Weekly Meals"** · Gestor inteligente de despensa y comidas, 100% en español, mobile-first y preparado como PWA.

## Características implementadas

- **Persistencia local inmediata (`localStorage`)**: Sin registro obligatorio. Incluye contador visible y límite gratuito de **50 productos activos**.
- **Mi Despensa por zonas**:
  - Filtros por **Refrigerador**, **Congelador** y **Alacena**.
  - Registro manual rápido (nombre, cantidad, unidad `g`, `ml`, `unidades`, `kg`, `L`, ubicación y fecha de consumo preferente opcional) + botones de **agregado rápido** con ingredientes comunes.
  - Etiquetas visuales tipo **semáforo** (verde: *En fecha*, amarillo: *Usar pronto*, rojo: *Prioridad hoy*).
  - Aviso discreto al pie aclarando que las fechas son de consumo preferente/calidad y no garantizan seguridad alimentaria.
- **Motor de Recetas Estricto (`src/data/recipes.json` + `src/lib/recipe-engine.ts`)**:
  - 15 recetas prácticas con cantidades exactas (`g`, `ml`, `unidades`), tiempo de preparación y porciones base.
  - Escala cantidades automáticamente según el **número de personas**, filtra por **tiempo máximo disponible** y prioriza ingredientes **próximos a vencer**.
  - **Verificación estricta de cantidades**: convierte `kg ↔ g` y `L ↔ ml`; si tienes 2 huevos y la receta pide 6, **no** la marca como lista para cocinar e indica exactamente `"Te faltan 4 huevos"`.
  - Ordena primero las recetas **100% viables** y las que aprovechan alimentos por vencer.
- **Lista de Compras**:
  - Botón en cada receta para enviar **solo los ingredientes y cantidades faltantes**.
  - Checkboxes de compra y botón rápido **"Mover a mi despensa"** al marcar un producto como comprado.
- **Validación con "Puertas Falsas" (Planes Plus `$3.99/mes` o `$29.99/año` y Family `$5.99/mes` o `$49.99/año`)**:
  - *Escanear recibo de supermercado (OCR)* (`PLUS`)
  - *Planificador semanal automático* (`PLUS`)
  - *Estadísticas de ahorro y desperdicio* (`PLUS`)
  - *Compartir despensa con mi hogar (hasta 5 personas)* (`FAMILY`)
  - Modal con precios mensuales/anuales y formulario de acceso anticipado con 50% de descuento conectado a `POST /api/leads`, que guarda `correo,funcion_clicada,plan,fecha` en `leads.csv`.


*(En Windows PowerShell con política de scripts restringida, puedes usar `npm.cmd run dev`.)*

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
