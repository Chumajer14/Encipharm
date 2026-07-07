# Cumplimiento entrega final

| Documento | Criterio | Evidencia repo | Estado | Riesgo | Correccion aplicada |
|---|---|---|---|---|---|
| ANEXO-A Inventario Tecnico | Inventario repo | `docs/final-delivery/inventario-final-repositorio.md` | Cumple | Bajo | Creado. |
| ANEXO-B Arquitectura | Flujos y componentes | `docs/final-delivery/arquitectura-final-verificada.md` | Cumple | Bajo | Creado. |
| ANEXO-C Endpoints | Matriz API | `docs/final-delivery/endpoints-finales-verificados.md` | Cumple | Bajo | Creado. |
| ANEXO-D Modelo Firestore | Usuarios/clientes/comercial/RAG | `Backend/app/services/*`, modelos | Cumple parcial | Medio | Documentar validacion cliente. |
| ANEXO-E Plan UAT | Casos y salida | `docs/final-delivery/checklist-uat-go-live-final.md` | Cumple | Medio | Creado. |
| ANEXO-F Runbook | Operacion y soporte | README, deploy docs, checklist | Cumple parcial | Medio | Consolidado en final-delivery. |
| ANEXO-G Trazabilidad | Criterios y evidencia | Matrices finales | Cumple | Bajo | Creado. |
| DOC-01 Cierre | Criterios aceptacion | README y checklist UAT | Cumple | Medio | UAT cliente pendiente. |
| DOC-02 Resumen ejecutivo | Estado tecnico | `resumen-ejecutivo-entrega-final.md` | Cumple | Bajo | Creado. |
| DOC-03 Instalacion local | Backend/frontend/PWA | README y `.env.example` | Cumple parcial | Medio | `uv` no disponible localmente en auditoria. |
| DOC-04 Variables entorno | `.env.example` | Backend/frontend/PWA examples | Cumple | Alto si se suben secretos | `.gitignore` reforzado. |
| DOC-05 Despliegue | Vercel/backend/Firebase | `docs/deploy-*`, README | Cumple parcial | Medio | Dominios finales cliente pendientes. |
| DOC-06 Usuario final | CRM y PWA | Frontend/PWA | Cumple parcial | Medio | UAT cliente pendiente. |
| DOC-07 Operacion rapida | Smoke/readiness | `tools/smoke_crm_web.py`, `/readiness` | Cumple | Medio | Requiere ambiente publicado. |
| DOC-08 Roles permisos | Roles backend | `require_role`, servicios | Cumple | Bajo | Sin cambios. |
| DOC-09 Usuarios | Admin usuarios | `Backend/app/api/users.py` | Cumple | Bajo | Sin cambios. |
| DOC-10 CSV | Importacion | `Backend/app/services/clientes.py` | Cumple | Bajo | Sin cambios. |
| DOC-11 Swagger/API | OpenAPI no prod | `Backend/app/main.py` | Cumple | Bajo | Sin cambios. |
| DOC-12 Asistencia | RAG parcial | `/rag/*` | Cumple parcial | Medio | Alcance ajustado. |
| DOC-13 Troubleshooting | Errores API | `docs/troubleshooting/api-errors.md` | Cumple | Bajo | Sin cambios. |
| DOC-14 QA | Lint/build/audit | Resultados finales | Cumple parcial | Medio | Backend bloqueado por tooling local. |
| DOC-15 Seguridad | Hardening | Auditoria final | Cumple | Medio | Creado. |
| DOC-16 RAG | RAG parcial | Validacion RAG final | Cumple parcial | Medio | Creado. |
| DOC-17 App vendedor Flutter | Flutter externo/PWA repo | `vendedor-app/` | Entregable externo | Medio | README aclara alcance. |
| DOC-18 Continuidad | Backup/rollback | Checklist UAT | Cumple parcial | Medio | Depende cliente. |
| DOC-19 Exclusiones | Fuera de alcance | README, riesgos | Cumple | Bajo | Actualizado. |
