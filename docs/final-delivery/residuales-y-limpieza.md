# Residuales y limpieza

| Archivo | Linea/fragmento | Tipo de residual | Impacto | Accion tomada | Justificacion |
|---|---|---|---|---|---|
| `frontend/src/components/TemporaryRoleSwitcher.jsx` | `TEMPORAL - TEMPORAL`, `Vendedor`, `Administrador`, `Rol actual:` | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | La barra temporal de control de rol debe mantenerse durante esta etapa. |
| `frontend/src/auth/ProtectedRoute.jsx` | `VITE_ENABLE_TEMP_ROLE_SWITCHER`, `TemporaryRoleSwitcher` | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | Renderiza la barra temporal protegida por flag. |
| `Backend/app/api/auth.py` | `/auth/temporary-role`, `ENABLE_TEMPORARY_ROLE_SWITCHER` | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | Endpoint usado por la barra temporal; bloqueado fuera de development o con flag apagado. |
| `Backend/app/core/config.py` | `ENABLE_TEMPORARY_ROLE_SWITCHER` | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | Configuracion valida que no quede activa en produccion. |
| `Backend/app/core/readiness.py` | `temporary_role_switcher_disabled` | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | Readiness falla en ambientes desplegados si el switcher esta habilitado. |
| `docs/api/auth.md` | Endpoint temporal documentado | Residual autorizado temporalmente | Debe retirarse al cierre final manual | Sin cambios por instruccion del equipo | La documentacion advierte que es temporal y bloqueado fuera de development. |
| `frontend/src/pages/AsistenteEnci.jsx` | Leyenda visual de diagnostico RAG marcada temporal | Texto temporal visible | Medio: ruido de entrega para usuario final | Eliminada la leyenda visible | No forma parte de la barra protegida y no afecta contrato API. |
| `frontend/src/components/rag/ChatMessage.jsx` | Indicador visual temporal de origen RAG | Texto/indicador temporal visible | Medio: expone diagnostico tecnico al usuario final | Eliminado indicador visual | Se conserva `diagnostico` en API/historial como trazabilidad UAT. |
| `Backend/app/api/rag.py` | Comentario temporal sobre diagnostico | Comentario temporal | Bajo | Eliminado comentario | Se conserva `diagnostico` como trazabilidad UAT. |
| `Backend/app/models/rag.py` | Docstring marcaba el diagnostico como temporal | Nomenclatura inestable | Bajo | Actualizado a trazabilidad UAT | El campo existe en respuesta e historial. |
| `.gitignore` | Falta cobertura `vendedor-app` y backups | No versionado incompleto | Medio | Actualizado | Evita node_modules, dist, logs, backups y copias locales. |
| `Backend/.env.example`, `frontend/.env.example`, `vendedor-app/.env.example` | Placeholders `your-*`, localhost | Placeholder valido | Bajo | Sin cambios | Son ejemplos explicitos, no secretos reales. |
| `docs/rag-test-corpus/` | Corpus de prueba | Datos de prueba documentales | Bajo/medio | Sin cambios | Es evidencia/corpus de prueba, no dato productivo. |
| `frontend/node_modules`, `frontend/dist`, caches Python locales | Artefactos ignorados | Bajo si no se versionan | Sin cambios en commit | Estan ignorados y no se incluyen. |
