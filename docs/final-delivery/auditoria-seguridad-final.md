# Auditoria seguridad final

| Hallazgo | Severidad | Evidencia | Accion tomada | Riesgo residual | Recomendacion post-entrega |
|---|---|---|---|---|---|
| Secretos reales | Critica | Busqueda local no encontro `.env` reales ni service accounts versionados | `.gitignore` reforzado | Bajo si equipo respeta flujo | Validar CI/GitHub secret scanning. |
| Firestore directo | Alta | `firestore.rules` deny-all | Sin cambios | Bajo | Mantener backend como unica via datos negocio. |
| Firebase Admin | Alta | `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_SERVICE_ACCOUNT_JSON` | Sin cambios | Medio por configuracion cliente | Usar secrets manager/env vars. |
| CORS | Alta | `Settings.validate_security_settings` bloquea `*` en produccion | Sin cambios | Medio hasta URL final | Declarar solo dominios finales. |
| Swagger/OpenAPI | Media | `openapi_url=None if production` | Sin cambios | Bajo | Verificar `APP_ENV=production` en go-live. |
| Headers seguridad | Media | `main.py` agrega CSP, X-Frame, nosniff, Referrer | Sin cambios | Bajo | Validar con scanner externo. |
| Rate limit general | Media | `InMemoryRateLimitMiddleware` | Sin cambios | Medio en multiinstancia | Evaluar Redis/servicio compartido si escala. |
| Payload limit | Media | `RequestSizeLimitMiddleware`, upload RAG 20 MB | Sin cambios | Bajo | Ajustar por ambiente. |
| CSV injection | Media | CSV valida columnas, encoding, tamano, duplicados | Sin cambios | Bajo/medio | Probar archivos cliente. |
| Autorizacion por rol | Alta | `require_role`, ownership en servicios | Sin cambios | Medio hasta UAT real | Probar matriz de roles. |
| Usuario inactivo | Alta | `upsert_authenticated_user` bloquea `activo=false` | Sin cambios | Bajo | Validar con cuenta real. |
| Errores | Media | Handlers centralizados | Sin cambios | Bajo | Revisar logs productivos. |
| RAG DeepSeek key | Alta | Solo backend usa `DEEPSEEK_API_KEY` | Sin cambios | Medio por env cliente | Nunca exponer como `VITE_*`. |
| RAG documentos | Alta | Upload/reindex/list docs admin | Sin cambios | Medio por corpus | Revisar datos sensibles del corpus. |
| Barra temporal rol | Media/Alta | `TemporaryRoleSwitcher` y `/auth/temporary-role` | Sin cambios autorizado | Alto si se habilita en produccion | Retirar manualmente antes de entrega productiva final; mantener `ENABLE_TEMPORARY_ROLE_SWITCHER=false`. |
| PWA audit | Media | `npm audit` detecto `protobufjs` moderado | `npm audit fix` en `vendedor-app` | Bajo | Mantener audits antes de deploy. |

## Confirmacion

No se versionaron secretos, `.env` reales, service accounts, llaves Firebase, tokens, Chroma DB local ni storage documental local.
