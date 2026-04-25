# Sprint 02 — EPIC 2: CRM, Usuarios y Datos Base

**Fecha:** 24 de abril 2026  
**Estado:** EN PROCESO (FALTA: 
                            Pantallas de login y sesióN: Frontend, 
                            Gestión de usuarios y roles: Backend,
                            Dashboard vendedor,
                            Importacion CSV)

**Rama:** `feature/auth-users` → mergeada a `main`

#OBJETIVO
Desarrollar la base del frontend del sistema, implementando el módulo CRM de clientes con búsqueda, navegación básica y formularios, utilizando datos simulados (mock) para validar el flujo antes de la integración con backend.

# TAREAS COMPLETADAS

| Ticket | Descripción                                                                  | Estado |
| ------ | ---------------------------------------------------------------------------- | ------ |
| EV-011 | Creación frontend con React + Vite                                           | ✅      |
| EV-012 | Estructura base del proyecto (`src/components`, `pages`, `data`, `services`) | ✅      |
| EV-013 | Implementación de datos mock (`mockClientes.js`)                             | ✅      |
| EV-014 | Pantalla CRM clientes con listado y búsqueda                                 | ✅      |
| EV-015 | Implementación de estilos base (App.css, index.css)                          | ✅      |
| EV-016 | Configuración de navegación con `react-router-dom`                           | ✅      |
| EV-017 | Pantalla formulario “Crear Cliente”                                          | ✅      |


## ARCHIVOS CREADOS

frontend/
├── src/
│   ├── data/
│   │   └── mockClientes.js
│   ├── pages/
│   │   ├── Clientes.jsx
│   │   ├── CrearCliente.jsx
│   │   
│   ├── components/
│   ├── services/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js

## Resultado

Frontend ejecutandose correctamente 
PARA PROBAR, ESTAR EN LA CARPETA "cd frontend" luego en terminal usar "npm run dev"
Se visualizará:
-Visualización de clientes (MOCK UP/ DATOS PRUEBAS)
-Búsqueda 
-Navegación entre pantallas
-Formulario de creación de cliente (mock)
