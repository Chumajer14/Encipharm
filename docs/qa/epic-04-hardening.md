# QA - EPIC 4 Hardening, dashboards y navegacion por rol

Rama: `feature-epic-4-hardening-qa`  
Estado: cerrado para Development.  
Alcance: frontend web, reglas de sesion, rutas inexistentes, navegacion por rol, dashboards y pruebas automatizables sin migracion historica.

## Resultado ejecutivo

EPIC 4 queda cerrado para Development. El MVP web cuenta con cierre de sesion ante 401, pagina 404 real, estado 403 controlado para rutas protegidas por rol, dashboards con estados vacios explicitos y pruebas backend para validar jerarquia de roles.

La migracion de datos historicos se mantiene fuera de alcance por decision de sprint.

## Matriz de tickets

| Ticket | Resultado | Evidencia |
|--------|-----------|-----------|
| EV-040 | Completado | Evento global `enci:auth-expired` cierra sesion y fuerza login ante 401. |
| EV-041 | Completado | Ruta `*` renderiza pagina 404 con retorno contextual a login o dashboard. |
| EV-042 | Completado | Dashboard supervisor muestra textos vacios para rubro, region, etapa y estado. |
| EV-043 | Completado | Este documento define plan E2E, matriz funcional y criterios de ejecucion. |
| EV-044 | Completado | `ProtectedRoute` valida rol minimo antes de renderizar rutas privadas. |
| EV-045 | Completado | Checklist visual manual definido para dashboards vendedor y supervisor. |

## Controles implementados

### Sesion expirada

El cliente HTTP dispara `enci:auth-expired` cuando la API responde 401. `AuthProvider` escucha el evento, limpia la sesion Firebase y deja mensaje visible en login.

Validaciones:

- Token expirado en cualquier pantalla privada.
- Token invalido durante sincronizacion `/auth/login`.
- Estado final: usuario fuera de la app y mensaje claro.

### Navegacion por rol

El frontend replica la jerarquia backend:

```text
admin > supervisor > vendedor
```

`ProtectedRoute` recibe `minimumRole` y bloquea roles inferiores o desconocidos con pantalla 403 controlada. La API mantiene la autorizacion definitiva mediante `require_role`, por lo que el frontend solo evita navegacion incorrecta y estados visuales inconsistentes.

Validaciones:

- `admin` puede entrar a rutas de `supervisor` y `vendedor`.
- `supervisor` puede entrar a rutas de `vendedor`.
- `vendedor` no puede entrar a rutas `supervisor`.
- Rol desconocido queda bloqueado en frontend y backend.

### Dashboards

Dashboard vendedor consume `/dashboard/vendedor`. Dashboard supervisor y admin consumen `/dashboard/supervisor`. Las tarjetas numericas usan cero cuando no hay datos y los paneles agregados muestran texto vacio no ambiguo.

Validaciones visuales:

- Vendedor sin clientes: totales en cero y acciones rapidas visibles.
- Supervisor sin datos: paneles agregados muestran mensajes `Sin ...`.
- Supervisor con datos: rubro, region, etapa y estado listan clave y total.
- Admin renderiza vista agregada de supervisor.
- Mobile menor a 640 px no solapa header, filtros, tarjetas ni notices.

## Plan E2E recomendado

Automatizar con Playwright cuando existan credenciales o mocks estables de Firebase:

1. Login mockeado de vendedor, carga `/dashboard`, confirma consumo de metricas vendedor.
2. Login mockeado de supervisor, carga `/dashboard`, confirma metricas agregadas.
3. Forzar respuesta 401 en `/clientes`, verificar redireccion a login y mensaje de sesion expirada.
4. Navegar a ruta inexistente `/ruta-no-existe`, verificar pagina 404 y boton de retorno.
5. Inyectar rol `vendedor` y abrir una ruta protegida con `minimumRole="supervisor"`, verificar pantalla 403.
6. Inyectar rol desconocido, verificar que no se renderizan rutas privadas.
7. Validar dashboard supervisor sin datos con textos vacios visibles.
8. Validar viewport mobile `390x844` y desktop `1440x900` sin solapamientos.

## QA manual

| Caso | Rol | Resultado esperado |
|------|-----|--------------------|
| Login valido | vendedor | Dashboard vendedor visible. |
| Login valido | supervisor | Dashboard supervisor visible con agregados. |
| Login valido | admin | Dashboard supervisor visible con agregados. |
| Token expirado | cualquiera | Sesion cerrada, login visible, mensaje de expiracion. |
| Ruta inexistente autenticado | cualquiera | 404 con retorno a dashboard. |
| Ruta inexistente anonimo | ninguno | 404 con retorno a login. |
| Ruta de rol superior | vendedor | 403 controlado. |
| Dashboard sin datos | supervisor | Mensajes vacios explicitos, sin paneles ambiguos. |

## Comandos de verificacion

```bash
cd Backend
uv run pytest
```

```bash
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Riesgos residuales

- Firebase real debe validarse en ambiente UAT con dominios autorizados.
- E2E completo requiere estrategia de login mockeado o proyecto Firebase de pruebas.
- Migracion historica no forma parte del EPIC 4 y debe planificarse con archivos fuente definidos.
