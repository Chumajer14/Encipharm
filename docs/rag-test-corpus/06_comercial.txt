# API - Flujo comercial EPIC 3

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## Permisos

| Recurso | Roles |
|---------|-------|
| Interacciones | `admin`, `supervisor`, `vendedor` |
| Oportunidades | `admin`, `supervisor`, `vendedor` |
| Propuestas | `admin`, `supervisor`, `vendedor` |

Los vendedores solo operan registros asociados a sus propios clientes. Supervisores y administradores pueden consultar el consolidado.
En propuestas, el `supervisor` tiene lectura y aprobacion; no crea propuestas ni modifica montos, titulos o notas. `admin` mantiene control administrativo completo.

## Interacciones

### GET `/interacciones`

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `clienteId` | string opcional, max 128 | Filtra por cliente |
| `limit` | entero opcional, 1-500 | Limita resultados; default 100 |

### POST `/interacciones`

```json
{
  "clienteId": "cliente-1",
  "tipo": "visita",
  "fecha": "2026-05-05T10:00:00Z",
  "resumen": "Visita comercial inicial",
  "resultado": "Cliente interesado",
  "proximaAccion": "Enviar propuesta"
}
```

Tipos validos: `llamada`, `visita`, `correo`, `reunion`.

## Oportunidades

### GET `/oportunidades`

Lista oportunidades visibles para el usuario.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `clienteId` | string opcional, max 128 | Filtra por cliente |
| `etapa` | string opcional | Filtra por etapa |
| `limit` | entero opcional, 1-500 | Limita resultados; default 100 |

### POST `/oportunidades`

```json
{
  "clienteId": "cliente-1",
  "titulo": "Venta anual avicola",
  "etapa": "nuevo",
  "valorEstimado": 500000,
  "probabilidad": 20,
  "descripcion": "Oportunidad inicial"
}
```

Etapas canonicas: `nuevo`, `contactado`, `cotizacion`, `negociacion`, `ganado`, `perdido`.

Alias aceptados desde la terminologia del cliente:

| Cliente | Canonico API |
|---------|--------------|
| `Prospecto`, `Prospeccion` | `nuevo` |
| `Calificado`, `Calificacion` | `contactado` |
| `Propuesta`, `Propuesta enviada` | `cotizacion` |
| `Negociacion` | `negociacion` |
| `Cerrado ganado` | `ganado` |
| `Cerrado perdido` | `perdido` |

### PATCH `/oportunidades/{oportunidad_id}`

Actualiza parcialmente etapa, titulo, valor, probabilidad o descripcion.

La interfaz web expone alta y edicion de oportunidades desde `Pipeline & Funnels`, usando `POST /oportunidades` y `PATCH /oportunidades/{oportunidad_id}`. En edicion, el cliente asociado se mantiene fijo para preservar trazabilidad.

### GET `/oportunidades/{oportunidad_id}/detalle`

Retorna la oportunidad visible para el usuario con:

- `interacciones`: ultimas interacciones del cliente asociado.
- `propuestas`: propuestas vinculadas directamente a la oportunidad.

## Propuestas

### GET `/propuestas`

Lista propuestas visibles para el usuario.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `clienteId` | string opcional, max 128 | Filtra por cliente |
| `oportunidadId` | string opcional, max 128 | Filtra por oportunidad |
| `estado` | string opcional | Filtra por estado |
| `limit` | entero opcional, 1-500 | Limita resultados; default 100 |

### POST `/propuestas`

`oportunidadId` es obligatorio. La oportunidad debe ser visible para el usuario autenticado y pertenecer al mismo cliente indicado en `clienteId`.

```json
{
  "clienteId": "cliente-1",
  "oportunidadId": "oportunidad-1",
  "titulo": "Propuesta anual",
  "montoNeto": 100000,
  "descuentoPct": 10,
  "estado": "borrador",
  "notas": "Valida por 15 dias"
}
```

Estados canonicos: `borrador`, `enviada`, `aceptada`, `rechazada`.

Alias aceptados desde la terminologia del cliente:

| Cliente | Canonico API |
|---------|--------------|
| `En negociacion` | `enviada` |
| `Ganada` | `aceptada` |
| `Perdida` | `rechazada` |

La API calcula:

- `montoDescuento`
- `montoTotal`

### PATCH `/propuestas/{propuesta_id}`

Actualiza parcialmente titulo, monto, descuento, estado o notas. Si cambia monto o descuento, recalcula totales.

Reglas por rol:

- `vendedor`: puede modificar propuestas propias.
- `supervisor`: solo puede aprobar cambiando `estado` a `aceptada` o usando alias `Ganada`.
- `admin`: puede modificar cualquier propuesta.

## Validaciones defensivas

- Campos de texto tienen largos maximos.
- Campos de texto no pueden iniciar con `=`, `+`, `-` o `@`.
- Montos aceptan maximo `1.000.000.000`.
- Probabilidad acepta rango 0-100.
- Toda propuesta debe asociarse a una oportunidad existente y visible.
- Una propuesta no puede asociarse a una oportunidad de otro cliente.

## Auditoria

Las altas y cambios criticos de interacciones, oportunidades y propuestas escriben eventos tecnicos en `audit_logs` con usuario, rol, accion, recurso, resultado y timestamp.
