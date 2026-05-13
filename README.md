# Enci Ventas

Sistema de gestion de ventas y MiniCRM para Enci, desarrollado bajo metodologia Scrumban.
El enfoque de esta version es **MVP web primero**, dejando para Fase 2 las capacidades de IA/RAG, Flutter, ERP SAP, Google Calendar, inteligencia competitiva avanzada y reportes extendidos.

## Objetivo

Construir una plataforma interna para el equipo comercial que permita gestionar clientes, interacciones, oportunidades, propuestas, usuarios y dashboard supervisor desde una solucion web.

## Alcance del MVP

Incluye las capacidades bloqueantes para operar el sistema:

- Autenticacion web con Firebase Auth y Google SSO.
- Validacion de ID Token/JWT en backend con Firebase Admin.
- CRM de clientes conectado a Firestore.
- Creacion, listado, busqueda, filtros, detalle, edicion y eliminacion de clientes reales.
- Registro de usuarios autenticados en Firestore.
- Gestion base de usuarios y roles.
- Base tecnica para dashboard vendedor/supervisor.
- Base tecnica para importacion CSV y validaciones futuras.
- Interacciones comerciales.
- Pipeline de oportunidades.
- Propuestas basicas con estados y calculos.

Quedan fuera de esta fase:

- IA / RAG.
- Flutter nativo.
- ERP SAP.
- Google Calendar.
- Inteligencia competitiva avanzada.
- Reportes extendidos.

## Stack tecnologico

- **Frontend web:** React + Vite.
- **Backend API:** FastAPI.
- **Base de datos:** Cloud Firestore.
- **Autenticacion:** Firebase Auth con Google SSO.
- **Autorizacion:** Bearer token validado con Firebase Admin.
- **Infraestructura prevista:** GCP Cloud Run, Cloud Build, Artifact Registry.
- **Documentacion y despliegue:** README vivo y variables seguras fuera del repositorio.

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

## Flujo de clientes

La pantalla `CRM Clientes` ya no usa datos mock como fuente principal.
Los clientes se leen y escriben mediante API protegida:

- `GET /clientes`: lista clientes visibles para el usuario autenticado.
- `GET /clientes/{cliente_id}`: consulta un cliente visible para el usuario.
- `POST /clientes`: crea un cliente en Firestore.
- `PATCH /clientes/{cliente_id}`: actualiza un cliente visible para el usuario.
- `DELETE /clientes/{cliente_id}`: da de baja logicamente un cliente visible para el usuario.

Cada cliente queda almacenado en la coleccion `clientes` con:

- `nombre`
- `empresa`
- `email`
- `telefono`
- `rubro`
- `region`
- `estado`
- `vendedorUid`
- `createdAt`
- `updatedAt`

Regla funcional aplicada en backend:

- `vendedor`: ve los clientes asociados a su `vendedorUid`.
- `supervisor` y `admin`: pueden ver todos los clientes.

## Endpoints implementados

### Salud

```http
GET /health
```

Verifica que la API este activa.

### Usuario autenticado

```http
GET /me
```

Valida el token y retorna datos basicos del usuario autenticado.

### Autenticacion

```http
POST /auth/login
POST /auth/register
```

Ambos endpoints validan el token Firebase y sincronizan el usuario en Firestore.
`/auth/login` es el flujo usado por el frontend.

### Clientes

```http
GET /clientes
POST /clientes
```

Ambos requieren `Authorization: Bearer <token>`.

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

Todos requieren `Authorization: Bearer <token>`.

## Variables de entorno

Cada proyecto debe tener su propio archivo `.env.example`.
Los archivos `.env`, service accounts y credenciales reales no deben versionarse.

### Backend

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
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
```

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

Con esto, el backend queda disponible en `http://localhost:8000`.
La consola definitiva de pruebas esta en `http://localhost:8000/docs`.
El frontend web, si se requiere para revisar navegacion de usuario, queda en `http://127.0.0.1:5173`.

## Consola de testing y verificacion

La ruta principal para testing y presentacion es:

```text
http://localhost:8000/docs
```

Esta consola incluye:

- Login con Google desde Firebase Auth.
- Obtencion de ID Token Firebase.
- Aplicacion automatica del token al esquema `HTTPBearer`.
- Uso del boton `Authorize` de Swagger con el token precargado.
- Pruebas de endpoints protegidos con respuestas reales de API.

## QA tecnica local

Comandos tecnicos usados para validar la integracion durante desarrollo:

```bash
cd frontend
npm test
npm run lint
npm run build
```

```bash
cd Backend
uv run pytest
```

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
- El formulario `Nuevo Cliente` vuelve al CRM despues de guardar.
- `POST /interacciones` registra llamadas, visitas, correos y reuniones.
- `POST /oportunidades` crea oportunidades y `PATCH /oportunidades/{id}` cambia etapa.
- `POST /propuestas` exige oportunidad asociada, calcula descuento y monto total.

## Convenciones de trabajo

- Trabajar con ramas por feature.
- Abrir Pull Request antes de mergear.
- Mantener lint, build y tests limpios.
- Actualizar documentacion si cambia un endpoint o flujo.
- Seguir la definicion de Done del proyecto.

## Roadmap general

### Ciclo 1

Definicion de alcance, arquitectura base y setup tecnico.

### Ciclo 2

CRM, autenticacion, roles y datos base.

### Ciclo 3

Interacciones, pipeline y propuestas basicas.

### Ciclo 4

Dashboards, hardening y QA. La migracion de datos queda diferida.

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
- La migracion de datos historicos queda diferida hasta definir archivos fuente y reglas de limpieza.
- Flutter y las capacidades avanzadas quedan para Fase 2.
- Las credenciales Firebase Admin no deben exponerse ni versionarse.

## Estado actual

- EPIC 1: base tecnica, Firebase Auth/JWT y estructura backend completada.
- EPIC 2: cerrado funcionalmente para MVP web con login, sesion, CRM Firestore, busqueda/filtros, detalle, edicion, eliminacion, roles/permisos, importacion CSV backend y dashboard vendedor/supervisor.
- EPIC 3: cerrado para Development con interacciones, oportunidades/pipeline, propuestas vinculadas a oportunidad, detalle comercial y dashboard supervisor.
- EPIC 4: cerrado para Development con hardening de sesion, 404/403 controlados, navegacion por rol, estados vacios en dashboards y plan QA/E2E documentado. Migracion fuera de alcance por ahora.
- Pendiente MVP: UAT, ajustes finales y go-live.
