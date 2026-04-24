# Encipharm Ventas

Sistema de gestión de ventas y MiniCRM para Encipharm, desarrollado como proyecto de equipo bajo metodología Scrumban.  
El enfoque de esta versión es **MVP web primero**, dejando para Fase 2 las capacidades de IA, Flutter, ERP SAP, Google Calendar e inteligencia competitiva avanzada.

## Objetivo

Construir una plataforma interna para el equipo comercial que permita gestionar clientes, interacciones, oportunidades, propuestas, usuarios y dashboard supervisor en una sola solución web.

## Alcance del MVP

Incluye solo las capacidades bloqueantes para operar el sistema:

- Autenticación.
- CRM de clientes.
- Registro de interacciones y visitas web.
- Pipeline de oportunidades.
- Propuestas comerciales básicas.
- Importación CSV de clientes.
- Gestión de usuarios y roles.
- Dashboard del vendedor y del supervisor.

Quedan fuera de esta fase:

- IA / RAG.
- Flutter.
- ERP SAP.
- Google Calendar.
- Inteligencia competitiva avanzada.
- Reportes extendidos.

## Stack tecnológico

- **Frontend web:** Vue 3 + Vite + Pinia.
- **Backend API:** FastAPI.
- **Base de datos:** Firestore.
- **Autenticación:** Firebase Auth con Google SSO.
- **Infraestructura:** GCP Cloud Run, Cloud Build, Artifact Registry.
- **Documentación y despliegue:** README vivo y variables seguras en Secret Manager.

## Estructura del repositorio

```text
/
├─ backend/
├─ frontend/
├─ mobile/
├─ docs/
├─ .gitignore
├─ README.md
└─ cloudbuild.yaml
```

## Requisitos

- Python 3.12 o superior.
- Node.js 20 o superior.
- Flutter 3.x para Fase 2.
- Docker y Docker Compose.
- Firebase CLI.

## Variables de entorno

Cada proyecto debe tener su propio archivo `.env.example`.

### backend/.env.example

```env
APP_NAME=Encipharm Ventas API
APP_ENV=development
APP_PORT=8000

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"

GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
CORS_ORIGINS=http://localhost:3000
```

### frontend/.env.example

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

## Instalación local

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Desarrollo con Docker

```bash
docker-compose up --build
```

Con esto, el backend debería quedar disponible en `http://localhost:8000` y el frontend en `http://localhost:3000`.

## Convenciones de trabajo

- Trabajar con ramas por feature.
- Abrir Pull Request antes de mergear.
- Mantener lint y tests limpios.
- Actualizar documentación si cambia un endpoint o flujo.
- Seguir la definición de Done del proyecto.

## Flujo del proyecto

- **Daily interno:** 15 minutos.
- **Replenishment:** semanal.
- **Revisión ejecutiva:** cada 2 semanas.
- **Retrospectiva:** al cierre de cada ciclo.

## Roadmap general

### Ciclo 1
Definición de alcance, arquitectura base y setup técnico.

### Ciclo 2
CRM, autenticación, roles y datos base.

### Ciclo 3
Interacciones, pipeline y propuestas básicas.

### Ciclo 4
Migración, dashboards, hardening y QA.

### Ciclo 5
UAT, correcciones, documentación y salida.

## Definition of Done

Un ticket se considera completo solo si:

- El código está en la rama correspondiente.
- Existe PR aprobado.
- Los tests pasan.
- QA valida la funcionalidad.
- Los criterios de aceptación se cumplen.
- La documentación queda actualizada si aplica.

## Riesgos principales

- El alcance debe mantenerse acotado para cumplir el plazo.
- La integración con ERP SAP puede diferirse si falta información técnica.
- La migración depende de la calidad de los archivos Excel/CSV.
- Flutter y las capacidades avanzadas quedan para Fase 2.

## Contacto del equipo

Proyecto académico del grupo PLM para Gestión de Proyectos Informáticos.  
Repositorio y documentación en desarrollo continuo.