# Checklist UAT / Go-live final

| Area | Criterio | Severidad si falla | Estado | Responsable |
|---|---|---|---|---|
| Variables | `.env` reales configuradas fuera de Git | S1 | Pendiente cliente/PLM | PLM/Cliente |
| Firebase | `FIREBASE_PROJECT_ID` real | S1 | Pendiente ambiente | Cliente |
| Firebase | Service account segura en backend | S1 | Pendiente ambiente | Cliente/PLM |
| Firebase Auth | Dominios web y PWA autorizados | S1 | Pendiente cliente | Cliente |
| CORS | Origenes finales sin `*` ni localhost en prod | S1 | Pendiente URL final | PLM |
| Backend | `/health` OK | S1 | Requiere ambiente | PLM |
| Backend | `/readiness status=ready` | S1 | Requiere ambiente | PLM |
| Frontend | Login Google web | S1 | Requiere Firebase real | Cliente/PLM |
| Frontend | CRM clientes CRUD y baja logica | S1 | Preparado | PLM/Cliente |
| Frontend | Dashboards por rol | S2 | Preparado | PLM/Cliente |
| Barra temporal | Mantener durante preparacion | S3 | Autorizada | Equipo PLM |
| Barra temporal | Retiro manual antes de entrega productiva final | S1 si queda activa en produccion | Pendiente manual | Equipo PLM |
| App vendedor | Login Firebase y rutas principales | S2 | Preparado | PLM/Cliente |
| App vendedor | `/ia-rag` redirige a `/enci-chat` | S3 | Implementado | PLM |
| RAG | DeepSeek key configurada backend | S2 | Pendiente cliente | Cliente/PLM |
| RAG | Corpus documental real cargado | S2 | Pendiente cliente | Cliente |
| RAG | Upload/reindex admin | S1 | Implementado | PLM |
| Usuarios | Cuentas reales y roles asignados | S1 | Pendiente cliente | Cliente |
| Datos base | Clientes/oportunidades semilla reales | S2 | Pendiente cliente | Cliente |
| Smoke | Smoke test publicado | S1 | Requiere URL/token | PLM |
| Rollback | Version anterior identificada | S2 | Pendiente deploy | PLM |
| Firma | Aprobacion UAT cliente | S1 | Pendiente | Cliente |

## Criterios de salida

- S1 bloquea salida.
- S2 bloquea salida salvo aprobacion formal.
- S3 puede salir con plan.
- S4 puede salir.

La barra temporal de test no fue retirada por esta auditoria. Queda como residual autorizado y debe retirarse manualmente en el ultimo paso previo a una entrega productiva final.
