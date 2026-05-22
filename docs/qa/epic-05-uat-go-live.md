# QA - EPIC 5 UAT, documentacion y go-live

Rama: `feature/epic-5-uat-go-live`  
Estado: en desarrollo.  
Alcance: UAT funcional, readiness backend, documentacion operativa, smoke test y salida controlada sin cambios de frontend.

## Resultado esperado

EPIC 5 prepara el MVP para validacion con usuarios reales y posterior salida productiva. El foco es evidenciar que el backend, Firebase, roles, datos base y flujos comerciales funcionan en ambiente objetivo antes de abrir el sistema.

## Readiness backend

El endpoint `GET /readiness` entrega un reporte no sensible para revisar condiciones minimas de UAT/go-live:

- `firebase_project_id`: confirma que `FIREBASE_PROJECT_ID` no usa placeholder.
- `google_application_credentials`: confirma que el archivo de credenciales existe y no usa placeholder.
- `cors_origins`: confirma que existe al menos un origen permitido.
- `cors_deployed_origins`: en `uat`, `staging` o `production`, bloquea origenes `localhost` o `127.0.0.1`.

Respuesta esperada antes de UAT:

```json
{
  "status": "ready",
  "env": "uat",
  "version": "1.0.0",
  "checks": [
    {
      "nombre": "firebase_project_id",
      "estado": "ok",
      "detalle": "FIREBASE_PROJECT_ID debe apuntar al proyecto Firebase del ambiente."
    }
  ]
}
```

`checks` contiene todas las validaciones ejecutadas; todos los elementos deben estar en `estado=ok`.

## Checklist UAT por rol

| Caso | Rol | Resultado esperado | Estado |
|------|-----|--------------------|--------|
| Login Google real | vendedor | Sesion iniciada y usuario sincronizado en Firestore | Pendiente |
| Dashboard vendedor | vendedor | Metricas propias visibles sin error API | Pendiente |
| CRM clientes | vendedor | Lista solo clientes asignados | Pendiente |
| Crear cliente | vendedor | Cliente guardado con vendedor asignado | Pendiente |
| Registrar interaccion | vendedor | Interaccion vinculada al cliente visible | Pendiente |
| Crear oportunidad | vendedor | Oportunidad creada en etapa inicial | Pendiente |
| Crear propuesta | vendedor | Monto total calculado en backend | Pendiente |
| Dashboard supervisor | supervisor | Metricas agregadas visibles | Pendiente |
| Revision de propuestas | supervisor | Puede leer y aprobar propuestas segun permisos | Pendiente |
| Importacion CSV | admin | Endpoint acepta archivo valido y rechaza duplicados | Pendiente |
| Usuarios y roles | admin | Puede listar usuarios y ajustar rol operativo | Pendiente |
| Ruta sin permiso | vendedor | Backend responde 403 para acciones restringidas | Pendiente |

## Smoke test post despliegue

Ejecutar despues de cada despliegue UAT o productivo:

```bash
curl https://api.example.com/health
curl https://api.example.com/readiness
```

Validar:

- `/health` retorna `status=ok`.
- `/readiness` retorna `status=ready`.
- `/docs` carga la consola de pruebas.
- Login Google real obtiene token.
- `GET /me` responde usuario autenticado.
- `GET /clientes` responde segun rol.

## Matriz de defectos UAT

| Severidad | Definicion | Decision de salida |
|-----------|------------|--------------------|
| S1 Bloqueante | Impide login, acceso al sistema o perdida/corrupcion de datos | No salir |
| S2 Alta | Impide flujo comercial critico con workaround limitado | No salir sin aprobacion formal |
| S3 Media | Afecta productividad, existe workaround claro | Puede salir con plan de correccion |
| S4 Baja | Texto, documentacion o ajuste menor sin impacto operativo | Puede salir |

## Runbook go-live

1. Congelar cambios no criticos en la rama de salida.
2. Confirmar variables del ambiente productivo.
3. Ejecutar `uv run pytest` en backend.
4. Desplegar backend.
5. Ejecutar smoke test post despliegue.
6. Validar login real con usuario `admin`.
7. Validar lectura de clientes con usuario `vendedor`.
8. Registrar hora de salida, version y responsable.

## Rollback

Aplicar rollback cuando aparezca un S1 o S2 sin mitigacion:

- Revertir al ultimo despliegue estable del backend.
- Confirmar `/health` y `/readiness`.
- Bloquear nuevas pruebas UAT hasta confirmar estabilidad.
- Registrar defecto, hora de rollback y decision de reintento.

## Riesgos residuales

- Credenciales Firebase reales deben validarse fuera del repositorio.
- UAT depende de usuarios reales o cuentas de prueba autorizadas.
- La migracion historica sigue fuera de alcance hasta recibir fuente de datos aprobada.
- E2E automatizado queda pendiente hasta definir estrategia estable de login.
