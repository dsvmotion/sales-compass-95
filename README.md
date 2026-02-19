# Sales Compass 95

App de gestión de ventas para equipos comerciales. Incluye prospección de farmacias (mapas, búsqueda, filtros geográficos), operaciones (pedidos WooCommerce, documentos) y autenticación con Supabase.

## Stack

- **Frontend:** Vite, React 18, TypeScript
- **UI:** shadcn-ui, Tailwind CSS, Lucide icons
- **Backend / BBDD:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Mapas:** Google Maps API (@react-google-maps/api)
- **Estado / datos:** TanStack Query (React Query), React Hook Form + Zod

## Requisitos

- Node.js 18+ y npm
- Cuenta Supabase y proyecto configurado
- Claves de Google Maps (Maps JavaScript API, Places API) si usas prospección

## Instalación

```bash
# Clonar y entrar al proyecto
git clone <URL_DEL_REPO>
cd sales-compass-95

# Instalar dependencias
npm install

# Variables de entorno: crear .env.local en la raíz con:
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
# VITE_GOOGLE_MAPS_API_KEY=tu_api_key  (opcional, para mapas/places)
```

## Scripts

| Script        | Descripción                    |
|---------------|--------------------------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción          |
| `npm run build:dev` | Build en modo development   |
| `npm run preview` | Previsualizar build         |
| `npm run lint` | ESLint                       |
| `npm run test` | Tests (Vitest)               |
| `npm run test:watch` | Tests en modo watch     |

## Estructura del proyecto

```
sales-compass-95/
├── public/                 # Assets estáticos
│   ├── robots.txt
│   └── placeholder.svg
├── src/
│   ├── components/         # Componentes React
│   │   ├── ui/             # Componentes shadcn-ui (button, card, dialog, etc.)
│   │   ├── auth/           # ProtectedRoute, UserMenu
│   │   ├── prospecting/    # PharmacySidebar, ProspectingMap, PharmacyDetailPanel, etc.
│   │   ├── operations/     # OperationsTable, OperationsFiltersBar, PharmacyOperationsDetail
│   │   ├── Header.tsx, NavLink.tsx, SalesMap.tsx, PharmacyGoogleMap.tsx, StatCard.tsx
│   ├── contexts/           # AuthContext (Supabase Auth)
│   ├── hooks/              # usePharmacies, useProspectingSearch, useSavePharmacies,
│   │                       # usePharmacyOperations, useWooCommerceOrders, useGeographyOptions, etc.
│   ├── integrations/
│   │   └── supabase/       # client.ts, types.ts (generados/ligados a Supabase)
│   ├── pages/              # Index, Login, Signup, PharmacyProspecting, PharmacyOperations, NotFound
│   ├── types/              # sale.ts, pharmacy.ts, operations.ts
│   ├── lib/utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── config.toml         # Configuración del proyecto Supabase
│   ├── migrations/         # SQL: pharmacies, geography_*, pharmacy_order_documents, storage, RLS
│   └── functions/          # Edge Functions: woocommerce-orders, woocommerce-orders-detailed,
│                          # google-places-pharmacies, populate-geography
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## Supabase

- **Tablas:** `pharmacies`, `geography_countries`, `geography_provinces`, `geography_cities`, `pharmacy_order_documents`
- **Storage:** bucket `pharmacy-documents` (facturas/recibos)
- **Edge Functions:** WooCommerce orders (y detailed), Google Places pharmacies, populate geography
- **Auth:** Email/password; RLS habilitado en tablas y storage

Aplicar migraciones con Supabase CLI desde la raíz:

```bash
supabase db push
```

## Desarrollo local

1. Configura `.env.local` con `VITE_SUPABASE_*` y opcionalmente `VITE_GOOGLE_MAPS_API_KEY`.
2. `npm run dev` y abre la URL que indique Vite (por defecto puerto 8080).
3. Para probar Edge Functions en local: `supabase functions serve` (y ajustar URLs si es necesario).

## Licencia

Privado / uso interno.
