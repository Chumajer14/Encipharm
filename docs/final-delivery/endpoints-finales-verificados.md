# Endpoints finales verificados

| Metodo | Ruta | Router | Rol minimo | Payload | Respuesta | Estado | Evidencia | Prueba recomendada |
|---|---|---|---|---|---|---|---|---|
| GET | `/` | `main.py` | Publico | No | Mensaje API | Existe | `Backend/app/main.py` | Smoke HTTP. |
| GET | `/health` | `main.py` | Publico | No | `status=ok` | Existe | `Backend/app/main.py` | Smoke HTTP. |
| GET | `/readiness` | `main.py` | Publico | No | Readiness checks | Existe | `core/readiness.py` | Validar env UAT. |
| GET | `/me` | `main.py` | Autenticado | Bearer | Usuario actual | Existe | `get_current_user` | Token Firebase real. |
| POST | `/auth/login` | `auth.py` | Autenticado | Bearer | Usuario sincronizado | Existe | `upsert_authenticated_user` | Login Google. |
| POST | `/auth/register` | `auth.py` | Autenticado | Bearer | Usuario sincronizado | Existe | `upsert_authenticated_user` | Registro/login. |
| PATCH | `/auth/temporary-role` | `auth.py` | Autenticado dev | `{rol}` | Usuario actualizado | Residual autorizado - no tocar | `ENABLE_TEMPORARY_ROLE_SWITCHER` | Solo development; apagar UAT/prod. |
| GET | `/clientes` | `clientes.py` | vendedor | Query filtros | Lista clientes | Existe | `list_clientes` | Vendedor limitado a propios. |
| POST | `/clientes` | `clientes.py` | vendedor | `ClienteCreate` | Cliente | Existe | `create_cliente` | Crear cliente. |
| GET | `/clientes/{id}` | `clientes.py` | vendedor | No | Cliente | Existe | `_ensure_cliente_access` | 403 vendedor ajeno. |
| PATCH | `/clientes/{id}` | `clientes.py` | vendedor | `ClienteUpdate` | Cliente | Existe | `update_cliente` | Editar. |
| DELETE | `/clientes/{id}` | `clientes.py` | vendedor | No | 204 | Existe | Baja logica `deletedAt` | Validar no borrado fisico. |
| POST | `/clientes/import-csv` | `clientes.py` | admin | Multipart CSV | Resultado importacion | Existe | `parse_clientes_csv` | CSV tamano/encoding/duplicados. |
| GET | `/interacciones` | `comercial.py` | vendedor | Query | Lista | Existe | `list_interactions` | Alcance por rol. |
| POST | `/interacciones` | `comercial.py` | vendedor | `InteractionCreate` | Interaccion | Existe | `create_interaction` | Cliente visible. |
| GET | `/oportunidades` | `comercial.py` | vendedor | Query | Lista | Existe | `list_opportunities` | Filtros. |
| POST | `/oportunidades` | `comercial.py` | vendedor | `OpportunityCreate` | Oportunidad | Existe | `create_opportunity` | Cliente visible. |
| PATCH | `/oportunidades/{id}` | `comercial.py` | vendedor | `OpportunityUpdate` | Oportunidad | Existe | `update_opportunity` | Propiedad. |
| GET | `/oportunidades/{id}/detalle` | `comercial.py` | vendedor | No | Detalle | Existe | `get_opportunity_detail` | Incluye interacciones/propuestas. |
| GET | `/propuestas` | `comercial.py` | vendedor | Query | Lista | Existe | `list_proposals` | Filtros. |
| POST | `/propuestas` | `comercial.py` | vendedor | `ProposalCreate` | Propuesta | Existe | `create_proposal` | Supervisor no crea. |
| PATCH | `/propuestas/{id}` | `comercial.py` | vendedor | `ProposalUpdate` | Propuesta | Existe | `update_proposal` | Calculo monto server-side. |
| GET | `/dashboard/vendedor` | `dashboard.py` | vendedor | No | Dashboard | Existe | `build_dashboard` | Token vendedor. |
| GET | `/dashboard/supervisor` | `dashboard.py` | supervisor | No | Dashboard | Existe | `require_role("supervisor")` | Token supervisor/admin. |
| GET | `/users/` | `users.py` | supervisor | Query | Lista usuarios | Existe | `list_users` | Supervisor/admin. |
| GET | `/users/{uid}` | `users.py` | supervisor | No | Usuario | Existe | `get_user_or_404` | Supervisor/admin. |
| PATCH | `/users/me/preferences` | `users.py` | autenticado | Preferencias | Usuario | Existe | `get_current_user` | Tema/idioma. |
| PATCH | `/users/{uid}` | `users.py` | admin | `UserUpdate` | Usuario | Existe | `update_user` | Admin. |
| PATCH | `/users/{uid}/role` | `users.py` | admin | `{rol}` | Usuario | Existe | `UserRoleUpdate` | Admin. |
| PATCH | `/users/{uid}/status` | `users.py` | admin | `{activo}` | Usuario | Existe | `UserStatusUpdate` | Admin. |
| GET | `/competencia/repository` | `competencia.py` | vendedor | No | Repositorio competencia | Existe | `competencia.py` | Token valido. |
| POST | `/rag/chat` | `rag.py` | vendedor | `RagChatRequest` | Respuesta RAG | Existe parcial | DeepSeek/Chroma/env | Token y corpus. |
| GET | `/rag/conversations` | `rag.py` | vendedor | `limit` | Historial usuario | Existe | `list_conversations` | Usuario propio. |
| POST | `/rag/documents/upload` | `rag.py` | admin | Multipart doc | Upload/index | Existe parcial | `validate_document_file` | Admin y 20 MB. |
| POST | `/rag/documents/reindex` | `rag.py` | admin | No | Chunks | Existe parcial | `reindex_documents` | Admin y storage. |
| GET | `/rag/documents` | `rag.py` | admin | No | Docs RAG | Existe | `list_documents` | Admin. |
| GET | `/docs` | `docs.py` | Publico no prod recomendado | No | Consola pruebas | Existe | `Backend/app/docs.py` | No exponer produccion. |
| GET | `/docs/guia-presentacion-frontend.pdf` | `docs.py` | Publico no prod recomendado | No | PDF | Existe | `static/guias` | Validar 200. |
| GET | `/openapi.json` | FastAPI | Solo no production | No | OpenAPI | Condicionado | `openapi_url=None if production` | Validar APP_ENV. |
