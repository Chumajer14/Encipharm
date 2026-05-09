# Auditoria QA y Seguridad EPIC 3

Fecha: 2026-05-08  
Rama: `feature-epic-3-flujo-comercial`  
Alcance: EPIC 1, EPIC 2 y EPIC 3 del MVP Encipharm Ventas.

## A. Resumen ejecutivo

Estado general: estable para Development con observaciones. La API FastAPI centraliza autenticacion, autorizacion por rol y control de propiedad; el frontend usa Firebase Auth solo para identidad y consume la API con ID token. La suite backend cubre permisos base, CSV, hardening y flujo comercial; el frontend compila y no tiene hallazgos de ESLint.

Estado EPIC 3: aprobado con observaciones. Interacciones, oportunidades, propuestas y dashboard supervisor existen y funcionan a nivel tecnico. Se corrigieron brechas de duplicados CSV, asociacion de propuestas a oportunidades no visibles, reglas Firestore versionadas y manejo de errores/doble accion en cambios de estado.

Principales riesgos residuales:
- No hay pruebas automatizadas frontend/E2E configuradas.
- No se pudo validar login real con Firebase ni flujos manuales en navegador con usuarios reales.
- Las consultas Firestore se filtran en memoria; sirve para MVP, pero requiere indices/consultas server-side antes de escalar.
- Las propuestas aun pueden existir sin oportunidad asociada porque el modelo actual lo permite.

Recomendacion final: cerrar EPIC 3 en Development como aprobado con observaciones, crear pruebas E2E antes de producción y mantener Firestore cerrado a clientes directos.

## B. Checklist de validacion

| Area | Estado | Evidencia | Observacion |
|---|---|---|---|
| EPIC 1 arquitectura/base | Aprobado | FastAPI, React/Vite, Firebase Admin, docs API | Sin CI visible en esta auditoria local |
| EPIC 1 autenticacion | Aprobado con obs. | `get_current_user`, `/auth/login`, Firebase ID token | Login real requiere ambiente Firebase |
| EPIC 1 reglas de datos | Aprobado con parche | `firestore.rules` deny-all | API debe ser unica via Firestore |
| EPIC 2 CRM | Aprobado | CRUD cliente, filtros, validaciones, tests | Duplicado por email controlado en CSV, no en alta manual |
| EPIC 2 roles | Aprobado | `require_role`, tests permisos | Frontend no oculta todos los accesos por rol, backend bloquea |
| EPIC 2 CSV | Aprobado con parche | validacion atomica, limites, encoding, columnas, formulas | Sin UI visible de importacion en frontend actual |
| EPIC 2 dashboards | Aprobado | `/dashboard/vendedor`, `/dashboard/supervisor` | Consultas en memoria para MVP |
| EPIC 3 interacciones | Aprobado | validacion cliente visible, tipo, fecha, resumen | Falta E2E |
| EPIC 3 Kanban | Aprobado con parche | estados tipados y PATCH protegido | No hay drag and drop, usa select |
| EPIC 3 propuestas | Aprobado con obs. | calculo server-side, estados tipados | Oportunidad opcional por modelo actual |
| Seguridad frontend | Aprobado con obs. | tokens en memoria, sin localStorage | Hay mensajes en consola no sensibles |
| Seguridad backend | Aprobado con parche | roles, propiedad, rate limit, size limit | Falta validacion deploy de reglas |

## C. Matriz de pruebas manuales

| ID | Modulo | Caso | Precondicion | Pasos | Esperado | Obtenido | Estado | Severidad | Observacion | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| QA-001 | Auth | Login correcto | Firebase configurado, usuario activo | Entrar `/login`, iniciar Google | Dashboard carga | No ejecutado manual | Bloqueado | Critica | Requiere credenciales | Video/screenshot |
| QA-002 | Auth | Login incorrecto/inactivo | Usuario `activo=false` | Login con usuario inactivo | 403 y logout | Cubierto por test backend | Aprobado parcial | Critica | `test_inactive_user_cannot_login` | Log pytest |
| QA-003 | Auth | Logout | Sesion activa | Click Cerrar sesion | vuelve a login y limpia estado | No ejecutado manual | Bloqueado | Alta | Requiere navegador | Screenshot |
| QA-004 | Rutas | Acceso sin sesion | Sin token | Abrir `/clientes` | redireccion `/login` | Revisado en codigo | Aprobado parcial | Critica | `ProtectedRoute` | Screenshot |
| QA-005 | Roles | Vendedor | Usuario vendedor | Abrir clientes/dashboard | Solo datos propios | Cubierto backend | Aprobado parcial | Critica | Faltan datos reales | Respuesta API |
| QA-006 | Roles | Supervisor | Usuario supervisor | Abrir dashboard supervisor | Consolidado | Cubierto backend | Aprobado parcial | Alta | Requiere usuario real | Screenshot |
| QA-007 | CRM | Crear cliente | Sesion vendedor | Completar formulario valido | Cliente creado | Backend/build OK | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-008 | CRM | Buscar cliente | Clientes existentes | Buscar mayus/minus/espacios | Filtra sin romper | Revisado en codigo | Aprobado parcial | Media | Filtro frontend | Screenshot |
| QA-009 | CRM | Filtrar cliente | Clientes por estado | Seleccionar estado | Lista consistente | Revisado en codigo | Aprobado parcial | Media | Filtro exacto estado | Screenshot |
| QA-010 | CSV | Importar valido | Supervisor | Subir CSV valido | Inserta filas | Tests parse/import | Aprobado parcial | Alta | UI no visible | Resultado API |
| QA-011 | CSV | Importar invalido | Supervisor | CSV columnas/encoding malo | Error claro sin escritura | Tests backend | Aprobado | Alta | 400/413 | Log pytest |
| QA-012 | Interacciones | Crear interaccion | Cliente visible | Completar formulario | Registro asociado | Tests backend | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-013 | Oportunidades | Crear oportunidad | Cliente visible | Crear con monto/probabilidad | Tarjeta aparece | Tests backend | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-014 | Kanban | Mover oportunidad | Oportunidad visible | Cambiar etapa | PATCH y UI actualizada | Tests + parche UI | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-015 | Propuestas | Crear propuesta | Cliente visible | Crear con monto/descuento | Total calculado | Tests backend | Aprobado | Alta | Calculo server-side | Respuesta API |
| QA-016 | Propuestas | Cambiar estado | Propuesta visible | Cambiar estado | PATCH y UI actualizada | Tests + parche UI | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-017 | Dashboard vendedor | Datos propios | Usuario vendedor | Abrir dashboard | Totales propios | Tests backend | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-018 | Dashboard supervisor | Consolidado | Usuario supervisor | Abrir dashboard | Totales globales | Tests backend | Aprobado parcial | Alta | Manual pendiente | Screenshot |
| QA-019 | Seguridad | Acceso indebido URL | Vendedor | Abrir cliente ajeno por ID | 403 | Tests backend | Aprobado | Critica | `_ensure_cliente_access` | Respuesta API |
| QA-020 | Seguridad | Modificar dato ajeno | Vendedor | PATCH oportunidad/propuesta ajena | 403 | Tests backend | Aprobado | Critica | incluye propuesta-oportunidad | Log pytest |
| QA-021 | Seguridad | XSS/script en texto | Sesion activa | Enviar `<script>` en textos | Render como texto o rechazo segun campo | React escapa; backend limita | Aprobado parcial | Alta | Falta E2E visual | Screenshot |
| QA-022 | Resiliencia | API caida/datos vacios | Backend caido o colecciones vacias | Abrir modulos | Mensaje error/empty state | Revisado en codigo | Aprobado parcial | Media | Manual pendiente | Screenshot |

## D. Bugs encontrados

| ID | Modulo | Descripcion | Reproduccion | Esperado | Actual previo | Severidad | Impacto | Causa | Archivo | Solucion | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BUG-001 | Propuestas | Propuesta podia vincular oportunidad no visible si el ID era manipulado y el cliente coincidia | POST `/propuestas` con `oportunidadId` ajeno | 403 | Permitido en datos inconsistentes | Alta | Relacion comercial cruzada | Falta `_visible_by_user` | `Backend/app/services/comercial.py` | Validar visibilidad de oportunidad | Corregido |
| BUG-002 | CSV | Importacion no detectaba emails duplicados | CSV con mismo email en dos filas | Error y cero escrituras | Duplicaba clientes | Media | CRM y metricas inconsistentes | Sin validacion duplicados | `Backend/app/services/clientes.py` | Deteccion atomica por email | Corregido |
| BUG-003 | CSV | Importacion no detectaba email existente | CSV con email ya registrado | Error y cero escrituras nuevas | Duplicaba cliente | Media | CRM duplicado | Sin consulta previa | `Backend/app/services/clientes.py` | Comparar con clientes activos | Corregido |
| BUG-004 | Kanban | Error de red en cambio de etapa quedaba silencioso | Cortar API y cambiar etapa | Mensaje error y control bloqueado | Promesa no capturada | Media | UI desincronizada | Falta try/catch | `frontend/src/pages/Oportunidades.jsx` | Manejo error + updatingId | Corregido |
| BUG-005 | Propuestas | Error de red en cambio de estado quedaba silencioso | Cortar API y cambiar estado | Mensaje error y control bloqueado | Promesa no capturada | Media | UI desincronizada | Falta try/catch | `frontend/src/pages/Propuestas.jsx` | Manejo error + updatingId | Corregido |
| BUG-006 | Detalle oportunidad | Cambios de etapa/estado no manejaban errores | Cortar API en detalle | Mensaje error | Promesa no capturada | Media | Operacion ambigua | Falta try/catch | `frontend/src/pages/OportunidadDetalle.jsx` | Manejo error + disabled | Corregido |

## E. Brechas de seguridad

| Brecha | Donde ocurre | Impacto | Riesgo | Evidencia | Recomendacion | Parche | Prueba |
|---|---|---|---|---|---|---|---|
| Firestore sin reglas versionadas | Repo raiz | Despliegue accidental abierto | Critico | No existia `firestore.rules` | Versionar reglas cerradas | `allow read, write: if false` | Revisar deploy Firebase |
| Asociacion cruzada propuesta-oportunidad | Servicio comercial | Datos comerciales ajenos vinculados | Alto | `create_proposal` no llamaba `_visible_by_user` | Validar oportunidad visible | Parche aplicado | `test_seller_cannot_link_proposal_to_other_seller_opportunity` |
| Duplicados CSV | Importacion clientes | Corrupcion logica de CRM | Medio | Sin set de emails | Validacion atomica | Parche aplicado | tests duplicados CSV |
| Confianza en frontend para navegacion | Rutas React | Acceso visual por URL | Medio | `ProtectedRoute` solo auth, no rol | Mantener bloqueo backend, ocultar enlaces por rol en siguiente hardening | Pendiente | E2E por rol |
| Token expirado sin refresh proactivo | Auth frontend | Errores 401 hasta relogin | Medio | Token se guarda en estado tras `getIdToken()` inicial | Obtener token fresco por request o interceptor | Pendiente | Test sesion expirada |
| Consultas en memoria | Servicios list/dashboard | Exposicion operacional/rendimiento | Medio | `.stream()` y filtro local | Migrar a consultas Firestore con indices | Pendiente EPIC 4 | Prueba carga |

## F. Parches de codigo

| Archivo | Problema | Cambio aplicado | Prueba |
|---|---|---|---|
| `Backend/app/services/clientes.py` | CSV aceptaba duplicados | Validacion por email dentro del archivo y contra CRM antes de escribir | `uv run pytest` |
| `Backend/app/services/comercial.py` | Propuesta podia vincular oportunidad no visible | Validacion `_visible_by_user` antes de aceptar `oportunidadId` | `uv run pytest` |
| `Backend/tests/test_clientes_permissions.py` | Cobertura incompleta CSV | Tests de duplicado interno y existente | `uv run pytest` |
| `Backend/tests/test_comercial_flow.py` | Cobertura incompleta relacion propuesta-oportunidad | Test 403 con oportunidad ajena | `uv run pytest` |
| `frontend/src/pages/Oportunidades.jsx` | Cambio etapa sin manejo de error/doble accion | `saving`, `updatingId`, `try/catch` | `npm.cmd run build`, `npm.cmd run lint` |
| `frontend/src/pages/Propuestas.jsx` | Cambio estado sin manejo de error/doble accion | `saving`, `updatingId`, `try/catch` | `npm.cmd run build`, `npm.cmd run lint` |
| `frontend/src/pages/OportunidadDetalle.jsx` | Updates silenciosos | Estados de update y errores visibles | `npm.cmd run build`, `npm.cmd run lint` |
| `firestore.rules` | Reglas no versionadas | Denegacion total de acceso directo cliente | Revision manual deploy |
| `firebase.json` | Reglas no enlazadas | Configuracion de reglas Firestore | Revision manual deploy |
| `docs/qa/hardening-seguridad.md` | Documentacion desactualizada | Hardening actualizado | Revision docs |

## G. Pruebas automatizadas

Ejecutadas:
- Backend: `uv run pytest` en `Backend` -> 31 passed.
- Frontend build: `npm.cmd run build` en `frontend` -> passed.
- Frontend lint: `npm.cmd run lint` en `frontend` -> passed.
- Dependencias frontend: `npm.cmd audit --audit-level=moderate` -> 0 vulnerabilities.

Propuestas para implementar:
- `frontend/src/pages/__tests__/Login.test.jsx`: render de login y estado Firebase no configurado.
- `frontend/src/auth/__tests__/ProtectedRoute.test.jsx`: redireccion sin sesion.
- `frontend/src/pages/__tests__/Clientes.test.jsx`: busqueda, filtros y empty state.
- `frontend/src/pages/__tests__/Interacciones.test.jsx`: validacion de cliente/fecha/resumen y doble submit.
- `frontend/src/pages/__tests__/Oportunidades.test.jsx`: render Kanban y error al cambiar etapa.
- `frontend/src/pages/__tests__/Propuestas.test.jsx`: validacion monto/descuento y error al cambiar estado.
- `e2e/epic-03.spec.ts`: login mockeado, vendedor vs supervisor, CRUD cliente, interaccion, oportunidad, propuesta y dashboard.

Stack sugerido: Vitest + React Testing Library para unit/integration y Playwright para E2E. No se instalaron librerias nuevas porque el proyecto no tenia framework frontend de tests configurado.

## H. Recomendaciones de hardening

Critico:
- Desplegar `firestore.rules` cerradas o reglas equivalentes antes de exponer Firebase a clientes.
- Validar manualmente usuarios reales vendedor/supervisor/admin contra rutas y endpoints.

Alto:
- Implementar token fresco por request o manejo global de 401 con logout/redireccion.
- Ocultar/segmentar acciones frontend por rol, manteniendo backend como control obligatorio.
- Agregar pruebas E2E de acceso indebido por URL y manipulacion de IDs.

Medio:
- Migrar filtros de Firestore desde memoria a consultas por `vendedorUid`, `clienteId`, `estado`, `etapa`.
- Agregar control de duplicados tambien en alta manual de clientes si email debe ser unico.
- Agregar loading/error states uniformes en todas las pantallas.

Bajo:
- Normalizar textos con tildes en `clienteForm.js`; se observan caracteres mojibake en regex.
- Reducir `console.error` en produccion o centralizar logger no sensible.
- Agregar pagina 404 real en vez de redirigir todo a dashboard.

## I. Definition of Done EPIC 3

| Criterio | Estado | Evidencia |
|---|---|---|
| Codigo en rama correspondiente | Aprobado | `feature-epic-3-flujo-comercial` |
| Tests sin errores criticos | Aprobado | 31 backend passed, build/lint frontend passed |
| QA Development | Aprobado parcial | Auditoria tecnica local; manual real pendiente |
| Documentacion actualizada | Aprobado | `docs/qa/hardening-seguridad.md`, este reporte |
| Sin bugs criticos abiertos | Aprobado | No quedan criticos detectados en codigo |
| Sin vulnerabilidades criticas abiertas | Aprobado parcial | `npm audit` 0; reglas Firestore agregadas; backend deps sin audit especializado |
| Roles y permisos | Aprobado | Backend valida rol/propiedad |
| Cliente-oportunidad-propuesta | Aprobado con obs. | Relacion validada; propuesta permite oportunidad opcional |
| Dashboard supervisor consistente | Aprobado parcial | Tests agregados; validacion visual pendiente |

Veredicto final: EPIC 3 aprobado con observaciones. Puede pasar a EPIC 4 si antes se validan flujos manuales con usuarios reales y se priorizan pruebas E2E/hardening de sesion.
