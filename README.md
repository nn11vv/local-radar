# local-radar

Prospección comercial automatizada: identifica negocios locales sin presencia digital en Alicante para ofrecerles servicios de posicionamiento.

## Stack actual

- **Scraper**: Python + Google Places API
- **DB**: PostgreSQL en Railway
- **Próximo**: FastAPI (backend) + Next.js (dashboard)

## Estructura

```
local-radar/
├── scraper/
│   ├── places_client.py   # Wrapper Google Places API
│   ├── scorer.py          # Lógica de score de oportunidad
│   └── runner.py          # Orquestación principal
├── db/
│   ├── models.py          # Modelos SQLAlchemy
│   └── session.py         # Conexión y sesiones DB
├── config.py              # Variables de entorno
├── main.py                # Punto de entrada
├── requirements.txt
└── .env.example
```

---

## 1. Setup Railway (PostgreSQL)

### 1.1 Crear cuenta

Ir a [railway.app](https://railway.app) → **Start a New Project** → autenticarse con GitHub.

### 1.2 Crear proyecto y agregar PostgreSQL

1. En el dashboard, clic en **New Project**
2. Seleccionar **Empty Project**
3. Clic en **+ New** → **Database** → **Add PostgreSQL**
4. Railway crea la instancia automáticamente (tarda ~30 segundos)

### 1.3 Obtener DATABASE_URL

1. Clic sobre el servicio PostgreSQL recién creado
2. Ir a la pestaña **Variables**
3. Copiar el valor de `DATABASE_URL`

   Formato esperado:
   ```
   postgresql://postgres:<password>@<host>.railway.app:<port>/<db>
   ```

---

## 2. Google Places API Key

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto (o usar uno existente)
3. Activar **Places API** en *APIs & Services → Library*
4. Ir a *APIs & Services → Credentials* → **Create Credentials → API Key**
5. (Recomendado) Restringir la key a la IP de tu máquina o solo a Places API

---

## 3. Configurar el proyecto

### 3.1 Clonar e instalar dependencias

```bash
git clone <repo>
cd local-radar

python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3.2 Crear el .env

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
GOOGLE_PLACES_API_KEY=AIza...
DATABASE_URL=postgresql://postgres:pass@host.railway.app:5432/railway
```

---

## 4. Correr el scraper

```bash
python main.py
```

Output esperado:

```
10:23:01 [INFO] Starting scraper — zone: San Juan Playa, Alicante, radius: 3000m
10:23:02 [INFO] [restaurantes] Searching nearby places...
10:23:04 [INFO] [restaurantes] Nearby search returned 18 places
...
========================================================
  SCRAPER COMPLETE
  Total processed: 87
========================================================

  Top 5 leads by score:

              nombre    categoria  score  website  resenas
  Peluquería Sol Mar  peluquerias     8     None        2
         Gym Fitness     gimnasios     7     None        3
  ...
```

### Comportamiento de upsert

- Si `place_id` ya existe en DB → actualiza datos pero **preserva** `estado_contacto` y `notas`
- Si es nuevo → inserta con `estado_contacto = sin_contactar`

---

## 5. Score de oportunidad (0–10)

| Condición | Puntos |
|-----------|--------|
| Sin website | +3 |
| Menos de 5 reseñas | +2 |
| Menos de 3 fotos | +1 |
| Rating < 3.5 con más de 10 reseñas | +1 |
| Menos de 3 campos completos (tel, horarios, descripción) | +1 |

---

## 6. Backend (FastAPI)

```bash
uvicorn api.main:app --reload --port 8000
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/leads` | Lista leads (filtros: `categoria`, `zona`, `estado`, `score_min`, `score_max`, `page`, `page_size`) |
| GET | `/api/leads/{id}` | Lead por ID |
| PATCH | `/api/leads/{id}` | Actualiza `estado_contacto` y/o `notas` |
| GET | `/api/leads/export/csv` | Descarga CSV (mismos filtros que GET /api/leads) |
| GET | `/api/stats` | Métricas generales del dashboard |

CORS habilitado para `localhost:3000` y `*.vercel.app`.

---

## 7. Modelo de datos — tabla `leads`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `place_id` | string | Unique, índice |
| `nombre` | string | |
| `direccion` | string | |
| `telefono` | string? | |
| `website` | string? | |
| `fotos_count` | integer | Máx 10 (límite API) |
| `resenas_count` | integer | Total reseñas |
| `rating` | float? | |
| `tiene_horarios` | boolean | |
| `categoria` | string | |
| `zona` | string | |
| `lat` / `lng` | float | Para mapa del dashboard |
| `score` | integer | 0–10 |
| `estado_contacto` | enum | `sin_contactar` \| `contactado` \| `en_negociacion` \| `cerrado` \| `descartado` |
| `notas` | text? | Campo libre |
| `created_at` | timestamp | |
| `updated_at` | timestamp | Auto-actualiza |

---

## Frontend

Dashboard Next.js en `frontend/`.

### Instalar

```bash
cd frontend
npm install
```

### Configurar

```bash
cp .env.local.example .env.local
```

Editar `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### Correr

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige a `/dashboard`.

### Páginas

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Métricas, gráficos y top 5 leads |
| `/dashboard/leads` | Tabla completa con filtros, edición y exportar CSV |
| `/dashboard/mapa` | Mapa Google Maps con markers por score |
