# Autopatch Dashboard (Next.js + Tailwind)

Den befintliga Python-logiken för patchning är kvar (`main.py`, `Helper.py`, `PlaybookExecutor.py` osv).

Webblagret är nu byggt i **Next.js + TailwindCSS** och lägger till:

- manuell trigger av autopatch
- schemalagda patch-fönster (dag + tid)
- historik över körningar
- KPI-översikt (OK/FAILED/SKIPPED + success %)
- länkar till genererade rapporter (`reports/*.json`, `reports/*.xlsx`)

- FreeIPA-inloggning (session-cookie) med konfigurerbar endpoint
- hantering av service-konton för automation (t.ex. Ansible + Git)

## Lokalt (utan Docker)

```bash
cd dashboard
npm install
npm run dev
```

Öppna: `http://localhost:3000`

> API-routes kör Python-scriptet från repo-roten (`../main.py`), så körningen återanvänder samma patch-flöde som tidigare.


### FreeIPA

I dashboard-vyn **Get started** finns nu en FreeIPA-sektion där du kan:

- ange FreeIPA base URL och optional username-suffix
- logga in via FreeIPA (\`/login\`)
- registrera service-konton för automation

> Session-signering använder \`AUTOPATCH_SESSION_SECRET\` (sätt den i produktion).

## Docker

```bash
docker compose up --build
```

Öppna: `http://localhost:3000`

## Struktur

- `dashboard/src/app/page.tsx` – UI (Next.js App Router + Tailwind)
- `dashboard/src/app/api/*` – trigger/schedule endpoints
- `dashboard/src/lib/db.ts` – SQLite-lagring (`reports/autopatch_web.db`)
- `dashboard/src/lib/scheduler.ts` – intern scheduler loop
- `dashboard/src/lib/worker.js` – bakgrundsjobb som kör `python3 main.py`
