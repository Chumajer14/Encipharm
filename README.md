# Enci Ventas

Sistema de gestion de ventas y MiniCRM para Enci, desarrollado bajo metodologia Scrumban. El enfoque de esta version es **MVP web primero**, dejando para Fase 2 las capacidades de IA/RAG, Flutter, ERP SAP, Google Calendar, inteligencia competitiva avanzada y reportes extendidos.

## Objetivo

Construir una plataforma interna para el equipo comercial que permita gestionar clientes, interacciones, oportunidades, propuestas, usuarios y dashboards desde una solucion web.

## Alcance del MVP

Incluye las capacidades bloqueantes para operar el sistema:

- Autenticacion web con Firebase Auth y Google SSO.
- Validacion de ID Token/JWT en backend con Firebase Admin.
- CRM de clientes conectado a Firestore.
- Creacion, listado, busqueda, filtros, detalle, edicion y baja logica de clientes reales.
- Registro de usuarios autenticados en Firestore.
- Gestion base de usuarios y roles.
- Importacion CSV atomica para supervisores/admin.
- Interacciones comerciales.
- Pipeline de oportunidades.
- Propuestas basicas con estados, oportunidad obligatoria y calculos server-side.
- Dashboards vendedor/supervisor con metricas comerciales.
- Hardening de sesion, rutas 404/403 y navegacion por rol.
- Preview frontend preparado para Vercel.

Quedan fuera de esta fase:

- IA / RAG.
- Flutter nativo.
- ERP SAP.
- Google Calendar.
- Inteligencia competitiva avanzada.
- Reportes extendidos.
- Migracion de datos historicos.

## Stack tecnologico

- **Frontend web:** React + Vite.
- **Backend API:** FastAPI.
- **Base de datos:** Cloud Firestore.
- **Autenticacion:** Firebase Auth con Google SSO.
- **Autorizacion:** Bearer token validado con Firebase Admin.
- **Dependencias backend:** uv.
- **Infraestructura prevista backend:** GCP Cloud Run, Cloud Build, Artifact Registry.
- **Preview frontend:** Vercel para publicar la app web React/Vite de forma independiente.
- **Documentacion y despliegue:** README vivo, documentos en `docs/` y variables seguras fuera del repositorio.

## Estructura del repositorio

```text
/
|-- Backend/
|-- frontend/
|-- mobile/
|-- docs/
|-- .gitignore
`-- README.md
```

> Nota: `mobile/` queda reservado para Fase 2. Actualmente el MVP se concentra en la web.

## Flujo de autenticacion

1. El usuario entra al frontend y presiona `Login con Google`.
2. Firebase Auth abre el flujo Google SSO.
3. Firebase entrega un ID Token al frontend.
4. El frontend envia ese token al backend en el header:

```http
Authorization: Bearer <firebase-id-token>
```

5. FastAPI valida el token con Firebase Admin.
6. El backend crea o actualiza el usuario en la coleccion `users`.
7. La sesion queda autorizada para consumir endpoints protegidos.
8. Si la API responde `401`, el frontend cierra sesion y muestra mensaje de reingreso.

## Roles y navegacion

Jerarquia aplicada en backend y reforzada en frontend:

```text
admin > supervisor > vendedor
```

Reglas principales:

- `vendedor`: gestiona clientes, interacciones, oportunidades y propuestas propias.
- `supervisor`: consulta consolidado, opera sobre clientes/equipo y accede a dashboard supervisor.
- `admin`: hereda permisos de supervisor y puede administrar usuarios/roles.
- Rutas privadas sin sesion redirigen a `/login`.
- Rutas privadas con rol insuficiente muestran una pagina 403 controlada.
- Rutas inexistentes muestran una pagina 404 real.

## Endpoints implementados

### Salud

```http
GET /
GET /health
```

### Usuario autenticado

```http
GET /me
```

### Autenticacion

```http
POST /auth/login
POST /auth/register
PATCH /auth/temporary-role
```

`/auth/login` es el flujo usado por el frontend. `/auth/temporary-role` es un endpoint temporal para desarrollo, bloqueado con `APP_ENV=production`.

### Clientes

```http
GET /clientes
GET /clientes/{cliente_id}
POST /clientes
PATCH /clientes/{cliente_id}
DELETE /clientes/{cliente_id}
POST /clientes/import-csv
```

### Flujo comercial

```http
GET /interacciones
POST /interacciones
GET /oportunidades
POST /oportunidades
PATCH /oportunidades/{id}
GET /oportunidades/{id}/detalle
GET /propuestas
POST /propuestas
PATCH /propuestas/{id}
```

### Dashboard

```http
GET /dashboard/vendedor
GET /dashboard/supervisor
```

Todos los endpoints de negocio requieren `Authorization: Bearer <token>`.

## Variables de entorno

Cada proyecto debe tener su propio archivo `.env.example`. Los archivos `.env`, service accounts y credenciales reales no deben versionarse.

### Backend

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
CORS_ORIGIN_REGEX=
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
FIREBASE_WEB_API_KEY=your-firebase-api-key
FIREBASE_WEB_AUTH_DOMAIN=your-auth-domain
FIREBASE_WEB_STORAGE_BUCKET=your-storage-bucket
FIREBASE_WEB_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_WEB_APP_ID=your-app-id
FIREBASE_WEB_MEASUREMENT_ID=your-measurement-id
```

### Frontend

```env
VITE_APP_NAME=Enci Ventas
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_ENABLE_TEMP_ROLE_SWITCHER=false
```

`VITE_ENABLE_TEMP_ROLE_SWITCHER=true` habilita un selector visual de rol solo durante desarrollo local. Debe permanecer desactivado para previews, UAT y produccion.

Para publicar el frontend en Vercel, configurar el proyecto con Root Directory = `frontend` y cargar las mismas variables `VITE_*` en Preview/Production. `VITE_API_BASE_URL` debe apuntar a una API publica HTTPS; `localhost` solo sirve para desarrollo local. Guia detallada: `docs/deploy-vercel-frontend.md`.

## Instalacion local

### Backend

```bash
cd Backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Con esto, el backend queda disponible en `http://localhost:8000`, la consola de pruebas en `http://localhost:8000/docs` y el frontend en `http://127.0.0.1:5173`.

## QA tecnica local

```bash
cd Backend
uv run pytest
```

```bash
cd frontend
npm.cmd run lint
npm.cmd run build
```

Resultado de cierre EPIC 4:

- Backend: `38 passed`.
- Frontend lint: exitoso.
- Frontend build: exitoso.

Checklist funcional:

- Login Google abre popup y autentica contra Firebase.
- El frontend obtiene ID Token y llama a `/auth/login`.
- El backend valida el token con Firebase Admin.
- El usuario queda creado o actualizado en `users`.
- La ruta del CRM queda protegida.
- `GET /clientes` lista clientes reales desde Firestore.
- `GET /clientes/{cliente_id}` consulta detalle de cliente.
- `POST /clientes` guarda clientes nuevos en Firestore.
- `PATCH /clientes/{cliente_id}` edita clientes.
- `DELETE /clientes/{cliente_id}` da de baja clientes sin perdida irreversible.
- `POST /interacciones` registra llamadas, visitas, correos y reuniones.
- `POST /oportunidades` crea oportunidades y `PATCH /oportunidades/{id}` cambia etapa.
- `POST /propuestas` exige oportunidad asociada, calcula descuento y monto total.
- Token expirado por respuesta `401` cierra sesion y vuelve al login.
- Ruta inexistente muestra 404 con retorno al flujo principal.
- Rol insuficiente muestra 403 antes de renderizar contenido privado.

## Roadmap general

| Ciclo | Alcance | Estado |
|-------|---------|--------|
| Ciclo 1 | Definicion de alcance, arquitectura base y setup tecnico | Cerrado |
| Ciclo 2 | CRM, autenticacion, roles y datos base | Cerrado |
| Ciclo 3 | Interacciones, pipeline y propuestas basicas | Cerrado Development |
| Ciclo 4 | Dashboards, hardening y QA | Cerrado Development |
| Ciclo 5 | UAT, correcciones, documentacion y salida | Pendiente |

## Riesgos principales

- El alcance debe mantenerse acotado para cumplir el plazo.
- Firebase real debe validarse en UAT con dominios autorizados.
- La integracion con ERP SAP puede diferirse si falta informacion tecnica.
- La migracion de datos historicos queda diferida hasta definir archivos fuente y reglas de limpieza.
- Flutter y las capacidades avanzadas quedan para Fase 2.
- Las credenciales Firebase Admin no deben exponerse ni versionarse.

## Estado actual

- EPIC 1: base tecnica, Firebase Auth/JWT y estructura backend completada.
- EPIC 2: cerrado funcionalmente para MVP web con login, sesion, CRM Firestore, busqueda/filtros, detalle, edicion, eliminacion, roles/permisos, importacion CSV backend y dashboard vendedor/supervisor.
- EPIC 3: cerrado para Development con interacciones, oportunidades/pipeline, propuestas vinculadas a oportunidad, detalle comercial y dashboard supervisor.
- EPIC 4: cerrado para Development con hardening de sesion, 404/403 controlados, navegacion por rol, estados vacios en dashboards y plan QA/E2E documentado.
- Pendiente MVP: EPIC 5, UAT, ajustes finales y go-live.

## Documentacion clave

- `docs/README.md`: indice documental.
- `docs/estado-proyecto.md`: estado consolidado del MVP.
- `docs/architecture.md`: arquitectura del monorepo y roles.
- `docs/setup.md`: setup local y comandos de verificacion.
- `docs/qa/epic-04-hardening.md`: cierre QA del EPIC 4.
- `docs/evm/semana-04.md`: reporte semanal de cierre EPIC 4.
