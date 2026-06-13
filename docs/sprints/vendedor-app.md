# Sprint 02 – Aplicación Móvil Vendedor (PWA)

## Resumen

Durante este sprint se desarrolló una aplicación PWA para vendedores, integrada con la infraestructura existente de Encipharm Ventas. La aplicación utiliza autenticación mediante Google Firebase Authentication y sincroniza información con el backend FastAPI utilizado por el Dashboard Comercial.

El objetivo principal fue validar el flujo completo vendedor → backend → dashboard, permitiendo registrar oportunidades comerciales desde dispositivos móviles.

---

# Funcionalidades Implementadas

## Autenticación Firebase

* Integración con Firebase Authentication.
* Inicio de sesión mediante cuenta Google.
* Obtención de Firebase ID Token.
* Envío del token al endpoint:

```http
POST /auth/login
```

* Validación de permisos mediante backend FastAPI.
* Persistencia de sesión.

## Navegación Base

Se implementó la navegación principal de la aplicación:

* Inicio
* Nueva Cotización
* Pipeline
* Proyección
* Configuración

## Configuración

* Visualización del usuario autenticado.
* Visualización del correo autenticado.
* Estado de sincronización.
* Cierre de sesión.

## Nueva Cotización

Permite registrar oportunidades comerciales mediante:

* Cliente
* Producto
* Monto
* Probabilidad
* Etapa comercial
* Comentarios

Al guardar:

1. Se almacena localmente mediante Dexie.
2. Se crea una oportunidad en el backend.
3. La información queda disponible para el Dashboard Comercial.

## Integración Backend

Se integró la aplicación con:

```http
POST /auth/login
GET /clientes
POST /oportunidades
```

utilizando el mismo backend empleado por la aplicación Dashboard.

## Sincronización Dashboard

Validación exitosa del flujo:

```text
App Vendedor
    ↓
Firebase Auth
    ↓
Backend FastAPI
    ↓
Firestore
    ↓
Dashboard Comercial
```

Las oportunidades creadas desde la aplicación móvil ya aparecen reflejadas dentro del Pipeline del Dashboard.

---

# Problemas Resueltos

## Error Firebase Login

Problema:

```text
400 Bad Request
/auth/login
```

Causa:

* Configuración CORS incompleta.
* Puerto local no autorizado.

Solución:

* Inclusión de puertos 5174 y 5175 en configuración CORS.
* Reinicio de FastAPI.

## Error "Failed to Fetch"

Causa:

* Preflight OPTIONS bloqueado.

Solución:

* Ajuste de configuración CORS del backend.

## Error Login.js

Causa:

* Uso incorrecto de JSX en archivo .js.

Solución:

* Migración a Login.jsx.

---

# Pendientes Técnicos

## Despliegue

Pendiente desplegar la aplicación vendedor en Vercel.

Actividades:

* Crear proyecto Vercel.
* Configurar Root Directory.
* Configurar variables de entorno.
* Validar autenticación en producción.

## Variables de Entorno

Configurar:

```env
VITE_API_BASE_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Pipeline

Revisar:

* Actualización de etapas.
* Edición de oportunidades.
* Cambio de estado desde aplicación móvil.

## Proyección

Validar:

* Fórmulas comerciales.
* Cálculo de probabilidad.
* Proyección ponderada.
* Consistencia con Dashboard.

## Clientes

Pendiente:

* Relacionar clientes reales de Firestore.
* Eliminar identificador temporal:

```js
clienteId: "legacy-cliente"
```

## UX Mobile

Pendiente aproximar interfaz al wireframe entregado por el cliente:

* Tarjetas rápidas.
* Indicador de sincronización.
* Dashboard móvil.
* Historial comercial.

## PWA

Pendiente validar:

* Instalación Android.
* Instalación iOS.
* Funcionamiento offline.
* Sincronización al recuperar conexión.

---

# Estado Actual

## Completado

* Firebase Authentication
* Integración Backend
* Sincronización Dashboard
* Nueva Cotización
* Navegación Base
* Configuración
* Pipeline conectado

## En Progreso

* Proyección
* Experiencia móvil
* Despliegue Vercel

## Pendiente

* Fórmulas comerciales
* Clientes reales
* PWA final
* Publicación producción
* QA final
