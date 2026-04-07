# Architettura: Skeleton Applicazione Factorial PWA

## Context

Factorial PWA e una PWA privata per "Erboristerie d'Italia" (~8 dipendenti, 2 negozi) che sostituisce Factorial HR. Il PRD e completo (PRD.md). Questo documento definisce lo **skeleton del progetto**: alberatura directory, file di configurazione, comandi di inizializzazione. **Nessun codice applicativo** viene scritto in questa fase — solo struttura e configurazione.

### Scoperte chiave da context7 (documentazione aggiornata)
- **Supabase SSR**: il nuovo pattern usa `getAll()`/`setAll()` per i cookie (NON il vecchio `get/set/remove`). Il middleware DEVE chiamare `auth.getUser()` subito dopo `createServerClient` e restituire l'oggetto `supabaseResponse` intatto.
- **shadcn/ui + Tailwind v4**: usa `@import "tailwindcss"`, `@import "shadcn/tailwind.css"`, direttiva `@theme inline`, colori in formato **OKLCh** (non HSL). La configurazione e in `components.json`.
- **Next.js 15**: Server Components sono il default, `'use client'` esplicito per i Client Components. Server Actions con `'use server'`.

---

## Fase 1: Comandi di Inizializzazione

Eseguire in ordine:

```bash
# 1. Creare progetto Next.js 15 nella directory esistente
cd /home/thomas/Factorial_PWA
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm --skip-install

# 2. Installare dipendenze base
pnpm install

# 3. Dipendenze runtime
pnpm add @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query @tanstack/react-query-devtools zod date-fns @react-pdf/renderer lucide-react

# 4. PWA
pnpm add @ducanh2912/next-pwa

# 5. Dev dependencies
pnpm add -D supabase @types/node prettier prettier-plugin-tailwindcss

# 6. Inizializzare shadcn/ui (Tailwind v4, CSS variables, lucide icons)
pnpm dlx shadcn@latest init

# 7. Aggiungere componenti shadcn necessari
pnpm dlx shadcn@latest add button input label card dialog sheet dropdown-menu \
  select checkbox table badge avatar separator tooltip popover calendar command \
  scroll-area tabs alert-dialog sonner skeleton switch textarea

# 8. Inizializzare Supabase locale
pnpm supabase init

# 9. Generare tipi DB (dopo le migrazioni)
pnpm supabase gen types typescript --local > src/types/database.ts
```

---

## Fase 2: Alberatura Directory Completa

Architettura **feature-based** — ogni dominio (turni, assenze, calendario, ecc.) ha i propri componenti, hook, query, azioni, schemi e tipi.

```
Factorial_PWA/
├── .env.example                              # Template variabili ambiente
├── .env.local                                # Variabili locali (gitignored)
├── next.config.ts                            # PWA + images Supabase
├── components.json                           # shadcn/ui config
├── playwright.config.ts                      # E2E tests (futuro)
├── public/
│   ├── manifest.json                         # PWA manifest (verde #16a34a)
│   └── icons/
│       ├── icon-192.png                      # Placeholder
│       └── icon-512.png                      # Placeholder
│
├── supabase/
│   ├── config.toml                           # Auto-generato da supabase init
│   ├── seed.sql                              # 2 negozi, 5 tipi assenza, 2 turni default
│   └── migrations/
│       ├── 00001_create_profiles.sql
│       ├── 00002_create_workplaces.sql
│       ├── 00003_create_employee_workplaces.sql
│       ├── 00004_create_shift_templates.sql
│       ├── 00005_create_shift_weeks.sql
│       ├── 00006_create_shifts.sql
│       ├── 00007_create_absence_types.sql
│       ├── 00008_create_absences.sql
│       ├── 00009_create_rls_policies.sql     # RLS + is_manager()
│       ├── 00010_create_storage_bucket.sql   # avatars bucket
│       └── 00011_enable_realtime.sql         # Realtime su shifts, shift_weeks, absences
│
└── src/
    ├── middleware.ts                          # Supabase session refresh + RBAC
    │
    ├── app/
    │   ├── globals.css                       # Tailwind v4 + OKLCh CSS vars (palette verde)
    │   ├── layout.tsx                        # Root: <html lang="it">, fonts, providers
    │   ├── not-found.tsx                     # 404 custom
    │   │
    │   ├── (auth)/                           # Route group PUBBLICHE (no sidebar)
    │   │   ├── layout.tsx                    # Layout centrato card
    │   │   ├── login/
    │   │   │   ├── page.tsx                  # SC: renders LoginForm
    │   │   │   └── _components/
    │   │   │       └── login-form.tsx        # CC: email + password
    │   │   ├── registrazione/
    │   │   │   ├── page.tsx
    │   │   │   └── _components/
    │   │   │       └── registration-form.tsx # CC: email, pwd (min 12), nome, telefono
    │   │   └── reset-password/
    │   │       ├── page.tsx
    │   │       └── _components/
    │   │           └── reset-password-form.tsx
    │   │
    │   ├── (dashboard)/                      # Route group PROTETTE (con sidebar)
    │   │   ├── layout.tsx                    # SC: fetch profilo, sidebar + <main>
    │   │   │
    │   │   ├── page.tsx                      # Home — entry point
    │   │   ├── _home/                        # Feature: Home
    │   │   │   ├── _components/
    │   │   │   │   ├── greeting-card.tsx     # CC: saluto orario + avatar
    │   │   │   │   ├── today-shift-card.tsx  # SC: turno di oggi
    │   │   │   │   └── who-is-working.tsx    # CC: chi sta lavorando ora (realtime)
    │   │   │   ├── queries.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── turni/                        # Feature: Turni (griglia settimanale)
    │   │   │   ├── page.tsx                  # SC: fetch settimana, render griglia
    │   │   │   ├── actions.ts               # Server Actions: createShift, publishWeek, ecc.
    │   │   │   ├── queries.ts               # TanStack: useWeekShifts, useShiftTemplates
    │   │   │   ├── mutations.ts             # TanStack mutations
    │   │   │   ├── schema.ts                # Zod: shiftSchema, templateSchema
    │   │   │   ├── store.ts                 # Zustand: selezione celle
    │   │   │   ├── types.ts                 # ShiftCell, WeekGrid, CoverageData
    │   │   │   ├── utils.ts                 # calculateHours, buildGrid, getWeekDates
    │   │   │   └── _components/
    │   │   │       ├── shift-grid.tsx        # CC: CSS Grid principale
    │   │   │       ├── shift-cell.tsx        # CC: cella singola colorata
    │   │   │       ├── employee-row.tsx      # CC: avatar + nome + ore
    │   │   │       ├── coverage-row.tsx      # CC: X/Y assegnati per giorno
    │   │   │       ├── week-navigator.tsx    # CC: frecce + "Questa settimana"
    │   │   │       ├── mini-calendar.tsx     # CC: mese con settimane numerate (W16, W17...)
    │   │   │       ├── shift-toolbar.tsx     # CC: barra azioni selezione
    │   │   │       ├── shift-template-picker.tsx  # CC: popup turni salvati
    │   │   │       ├── plan-shift-panel.tsx  # CC: Sheet pianifica da zero
    │   │   │       ├── add-menu.tsx          # CC: pulsante "+" dropdown (3 opzioni)
    │   │   │       ├── workplace-filter.tsx  # CC: filtro negozio
    │   │   │       ├── employee-filter.tsx   # CC: filtro dipendente
    │   │   │       ├── add-employees-dialog.tsx
    │   │   │       ├── week-status-badge.tsx # CC: "Bozza" / "Pubblicato"
    │   │   │       └── absence-from-shifts-dialog.tsx  # CC: giustificativo da turni
    │   │   │
    │   │   ├── assenze/                     # Feature: Assenze
    │   │   │   ├── page.tsx                 # SC: layout due colonne
    │   │   │   ├── actions.ts               # createAbsence, deleteAbsence
    │   │   │   ├── queries.ts               # useAbsences, useAbsenceTypes
    │   │   │   ├── mutations.ts
    │   │   │   ├── schema.ts                # Zod: absenceSchema
    │   │   │   ├── types.ts
    │   │   │   └── _components/
    │   │   │       ├── absence-page-layout.tsx   # CC: split sinistra/destra
    │   │   │       ├── annual-calendar.tsx        # CC: 12 mini-calendari
    │   │   │       ├── absence-history.tsx        # CC: storico cronologico
    │   │   │       ├── absence-form-dialog.tsx    # CC: form condiviso (usato anche da turni)
    │   │   │       └── absence-type-badge.tsx
    │   │   │
    │   │   ├── calendario/                  # Feature: Calendario mensile
    │   │   │   ├── page.tsx
    │   │   │   ├── queries.ts
    │   │   │   ├── types.ts
    │   │   │   └── _components/
    │   │   │       ├── monthly-calendar.tsx  # CC: griglia LUN-DOM
    │   │   │       ├── absence-bar.tsx       # CC: striscia colorata
    │   │   │       ├── calendar-filters.tsx
    │   │   │       └── calendar-navigator.tsx
    │   │   │
    │   │   ├── persone/                     # Feature: Persone (anagrafica)
    │   │   │   ├── page.tsx
    │   │   │   ├── actions.ts               # updateEmployeeWorkplace
    │   │   │   ├── queries.ts               # useEmployees
    │   │   │   ├── mutations.ts
    │   │   │   ├── schema.ts
    │   │   │   ├── types.ts
    │   │   │   └── _components/
    │   │   │       ├── employees-table.tsx
    │   │   │       ├── workplace-filter.tsx
    │   │   │       └── manage-employee-dialog.tsx  # Solo manager
    │   │   │
    │   │   ├── profilo/                     # Feature: Profilo utente
    │   │   │   ├── page.tsx                 # Redirect al proprio profilo
    │   │   │   ├── [id]/
    │   │   │   │   └── page.tsx             # SC: profilo per ID
    │   │   │   ├── actions.ts               # updateProfile, uploadAvatar
    │   │   │   ├── queries.ts
    │   │   │   ├── mutations.ts
    │   │   │   ├── schema.ts
    │   │   │   ├── types.ts
    │   │   │   └── _components/
    │   │   │       ├── profile-header.tsx    # Avatar grande + nome + ruolo
    │   │   │       ├── work-details-form.tsx
    │   │   │       ├── personal-details-form.tsx
    │   │   │       └── avatar-upload.tsx
    │   │   │
    │   │   ├── preferenze/                  # Feature: Preferenze
    │   │   │   ├── page.tsx
    │   │   │   ├── actions.ts               # changePassword
    │   │   │   ├── schema.ts                # min 12 caratteri
    │   │   │   └── _components/
    │   │   │       └── change-password-form.tsx
    │   │   │
    │   │   └── export/                      # Feature: Export PDF (solo manager)
    │   │       ├── page.tsx
    │   │       ├── actions.ts               # generatePdfData
    │   │       ├── queries.ts
    │   │       ├── schema.ts
    │   │       ├── types.ts
    │   │       └── _components/
    │   │           ├── export-form.tsx       # Selezione dipendenti + date
    │   │           └── export-preview.tsx
    │   │
    │   └── api/
    │       └── export/
    │           └── pdf/
    │               └── route.ts             # POST: genera PDF binario
    │
    ├── components/
    │   ├── ui/                              # shadcn/ui (auto-generati, non modificare)
    │   ├── layout/
    │   │   ├── sidebar.tsx                  # CC: sidebar, nav differenziata per ruolo
    │   │   ├── sidebar-nav-item.tsx         # CC: link con icona lucide + stato attivo
    │   │   ├── sidebar-user-menu.tsx        # CC: avatar + nome + Preferenze/Esci
    │   │   └── page-header.tsx              # SC: titolo pagina riutilizzabile
    │   └── shared/
    │       ├── role-gate.tsx                # CC: mostra children solo se ruolo corretto
    │       ├── loading-spinner.tsx          # CC: fallback Suspense
    │       ├── empty-state.tsx              # CC: icona + messaggio
    │       ├── error-boundary.tsx           # CC: catch errori + retry
    │       └── confirm-dialog.tsx           # CC: "Sei sicuro?"
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                    # createBrowserClient() — Client Components
    │   │   ├── server.ts                    # createServerClient() con cookies() getAll/setAll
    │   │   ├── admin.ts                     # SERVICE_ROLE_KEY — solo server
    │   │   └── middleware.ts                # updateSession() helper per middleware.ts
    │   ├── pdf/
    │   │   ├── factorial-template.tsx        # @react-pdf Document (formato Factorial)
    │   │   ├── pdf-styles.ts
    │   │   └── pdf-utils.ts
    │   ├── utils.ts                         # cn() + helper generici
    │   ├── constants.ts                     # RUOLI, COLORI_TURNI, NAV_ITEMS, NEGOZI
    │   └── date-utils.ts                    # Wrapper date-fns con locale IT
    │
    ├── hooks/
    │   ├── use-auth.ts                      # useAuth(): user, profile, role, isManager
    │   ├── use-realtime.ts                  # Subscription Supabase -> invalidazione TanStack
    │   └── use-debounce.ts
    │
    ├── providers/
    │   ├── query-provider.tsx               # CC: QueryClientProvider + DevTools
    │   └── auth-provider.tsx                # CC: AuthContext + onAuthStateChange
    │
    ├── stores/
    │   ├── ui-store.ts                      # Zustand: sidebarOpen
    │   └── shift-selection-store.ts         # Zustand: celle selezionate nella griglia turni
    │
    └── types/
        ├── database.ts                      # Auto-generato da supabase gen types
        ├── supabase.ts                      # Re-export: Tables<'profiles'>, ecc.
        └── index.ts                         # Tipi dominio condivisi: UserRole, Profile, Workplace
```

---

## Fase 3: File di Configurazione Essenziali

### 3.1 `next.config.ts`
- Wrappare con `withPWA` da `@ducanh2912/next-pwa`
- `dest: "public"`, `disable: process.env.NODE_ENV === "development"`
- `images.remotePatterns` per il dominio Supabase Storage

### 3.2 `src/middleware.ts` (critico per RBAC)
Pattern da context7 (documentazione aggiornata Supabase SSR):
```
1. createServerClient con getAll()/setAll() sui cookie della request
2. SUBITO dopo: await supabase.auth.getUser()
3. Se non autenticato e rotta protetta -> redirect /login
4. Se rotta manager-only (export, api/export) e role !== 'manager' -> redirect /
5. Restituire supabaseResponse INTATTO (critico per mantenere la sessione)
```
Rotte pubbliche: `/login`, `/registrazione`, `/reset-password`
Rotte manager-only: `/export`, `/api/export/pdf`
Matcher: escludi `_next/static`, `_next/image`, `favicon.ico`, assets statici

### 3.3 `src/app/globals.css` (Tailwind v4 + palette verde)
Pattern da context7 per shadcn + Tailwind v4:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Mappatura CSS vars -> Tailwind */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... tutte le variabili shadcn standard ... */
}

:root {
  /* Palette verde PRD convertita in OKLCh */
  --primary: oklch(0.55 0.16 145);       /* #16a34a green-600 */
  --primary-foreground: oklch(1 0 0);     /* bianco */
  --accent: oklch(0.75 0.17 75);          /* #f59e0b amber-500 */
  --destructive: oklch(0.63 0.24 25);     /* #ef4444 red-500 */
  /* ... resto palette dal PRD sezione 5.1 ... */
}
```

### 3.4 `src/lib/supabase/server.ts`
Pattern aggiornato da context7:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        } catch { /* ignorabile se middleware gestisce il refresh */ }
      },
    },
  })
}
```

### 3.5 `components.json` (shadcn)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 3.6 `.env.example`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3.7 `public/manifest.json`
```json
{
  "name": "Erboristerie d'Italia - Gestione Turni",
  "short_name": "Turni",
  "theme_color": "#16a34a",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Fase 4: Decisioni Architetturali

### Feature folder vs Shared — regola di promozione
| Se usato in... | Posizione |
|----------------|-----------|
| 1 sola feature | Dentro la feature (`turni/_components/`) |
| 2+ features | Promosso a `components/shared/` o `hooks/` |
| Tutta l'app | `components/layout/` o `lib/` |

### Flusso dati standard
```
page.tsx (SC) -> fetch dati via lib/supabase/server.ts
  -> passa come props a _components/ (CC con 'use client')
  -> CC usa TanStack Query per refetch/mutations
  -> useRealtimeSubscription() ascolta Supabase channels -> invalida cache TanStack
  -> Zustand SOLO per stato UI effimero (selezione celle, sidebar)
```

### Convenzioni nomi file
- File: **kebab-case** (`shift-grid.tsx`, `use-auth.ts`)
- Componenti: **PascalCase** (`ShiftGrid`)
- Hook: **camelCase** con prefisso `use` (`useWeekShifts`)
- Server Actions: **camelCase** verbo-first (`createShift`, `publishWeek`)
- Schemi Zod: **camelCase** con suffisso `Schema` (`shiftSchema`)
- Max **200-400 righe** per file

### Caso speciale: absence-form-dialog
Il dialog per aggiungere giustificativi e in `assenze/_components/absence-form-dialog.tsx` ed e importato ANCHE da `turni/_components/absence-from-shifts-dialog.tsx`. Resta nella feature `assenze` perche e strettamente accoppiato al dominio assenze.

---

## File Critici da Creare/Modificare

| File | Scopo |
|------|-------|
| `src/middleware.ts` | Auth + RBAC (il piu critico) |
| `src/app/globals.css` | Palette verde OKLCh per shadcn/Tailwind v4 |
| `src/lib/supabase/server.ts` | Server client con nuovo pattern getAll/setAll |
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/middleware.ts` | Helper updateSession per middleware |
| `src/app/layout.tsx` | Root layout con providers |
| `src/providers/query-provider.tsx` | TanStack QueryClientProvider |
| `src/providers/auth-provider.tsx` | Auth context |
| `next.config.ts` | PWA + images config |
| `components.json` | shadcn config |

---

## Verifica Post-Skeleton

- [ ] `pnpm dev` parte senza errori su `http://localhost:3000`
- [ ] `/login` usa il layout auth (centrato, senza sidebar)
- [ ] `/(dashboard)` redirige a `/login` se non autenticato
- [ ] `pnpm build` produce manifest PWA + service worker
- [ ] I componenti shadcn si importano senza errori
- [ ] La palette verde e attiva (pulsanti verdi, non default)
- [ ] `pnpm tsc --noEmit` passa con zero errori
- [ ] `pnpm supabase db reset` esegue tutte le migrazioni + seed
