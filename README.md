# Encipharm Ventas

Sistema de gestion de ventas y MiniCRM para Encipharm, desarrollado como proyecto de equipo bajo metodologia Scrumban.
El enfoque de esta version es **MVP web primero**, dejando para Fase 2 las capacidades de IA, Flutter, ERP SAP, Google Calendar e inteligencia competitiva avanzada.

## Objetivo

Construir una plataforma interna para el equipo comercial que permita gestionar clientes, interacciones, oportunidades, propuestas, usuarios y dashboard supervisor en una sola solucion web.

## Alcance del MVP

Incluye solo las capacidades bloqueantes para operar el sistema:

- Autenticacion.
- CRM de clientes.
- Registro de interacciones y visitas web.
- Pipeline de oportunidades.
- Propuestas comerciales basicas.
- Importacion CSV de clientes.
- Gestion de usuarios y roles.
- Dashboard del vendedor y del supervisor.

Quedan fuera de esta fase:

- IA / RAG.
- Flutter.
- ERP SAP.
- Google Calendar.
- Inteligencia competitiva avanzada.
- Reportes extendidos.

## Stack tecnologico

- **Frontend web:** React + Vite.
- **Backend API:** FastAPI.
- **Base de datos:** Firestore.
- **Autenticacion:** Firebase Auth con Google SSO.
- **Infraestructura prevista:** GCP Cloud Run, Cloud Build, Artifact Registry.
- **Documentacion y despliegue:** README vivo y variables seguras en Secret Manager.

## Estructura del repositorio

```text
/
├── Backend/
├── frontend/
├── mobile/
├── docs/
├── .gitignore
└── README.md
```

> Nota: `mobile/` queda reservado para Fase 2. Actualmente el MVP se concentra en la web.

## Requisitos

- Python 3.12 o superior.
- Node.js 20 o superior.
- Firebase CLI.
- Docker y Docker Compose cuando se agreguen los archivos de despliegue correspondientes.

## Variables de entorno

Cada proyecto debe tener su propio archivo `.env.example`. Los archivos `.env` y credenciales reales no deben versionarse.

### Backend

```env
APP_NAME=Encipharm Ventas API
APP_ENV=development
APP_VERSION=1.0.0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
```

### Frontend

```env
VITE_APP_NAME=Encipharm Ventas
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Instalacion local

### Backend

```bash
cd Backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

Con esto, el backend queda disponible en `http://localhost:8000` y el frontend en `http://localhost:5173`.

## Verificacion

```bash
cd frontend
npm run lint
npm run build
npm test
```

```bash
cd Backend
uv sync
uv run pytest
```

## Convenciones de trabajo

- Trabajar con ramas por feature.
- Abrir Pull Request antes de mergear.
- Mantener lint, build y tests limpios.
- Actualizar documentacion si cambia un endpoint o flujo.
- Seguir la definicion de Done del proyecto.

## Flujo del proyecto

- **Daily interno:** 15 minutos.
- **Replenishment:** semanal.
- **Revision ejecutiva:** cada 2 semanas.
- **Retrospectiva:** al cierre de cada ciclo.

## Roadmap general

### Ciclo 1

Definicion de alcance, arquitectura base y setup tecnico.

### Ciclo 2

CRM, autenticacion, roles y datos base.

### Ciclo 3

Interacciones, pipeline y propuestas basicas.

### Ciclo 4

Migracion, dashboards, hardening y QA.

### Ciclo 5

UAT, correcciones, documentacion y salida.

## Definition of Done

Un ticket se considera completo solo si:

- El codigo esta en la rama correspondiente.
- Existe PR aprobado.
- Los tests pasan.
- QA valida la funcionalidad.
- Los criterios de aceptacion se cumplen.
- La documentacion queda actualizada si aplica.

## Riesgos principales

- El alcance debe mantenerse acotado para cumplir el plazo.
- La integracion con ERP SAP puede diferirse si falta informacion tecnica.
- La migracion depende de la calidad de los archivos Excel/CSV.
- Flutter y las capacidades avanzadas quedan para Fase 2.

## Estado actual

- EPIC 1: base tecnica, Firebase Auth/JWT y estructura backend.
- EPIC 2: CRM web iniciado con datos mock; falta login web, roles, integracion con backend, importacion CSV y dashboard.
