# Riesgos residuales finales

| Riesgo | Severidad | Estado | Mitigacion | Responsable | Dependencia | Bloquea entrega |
|---|---|---|---|---|---|---|
| Firebase real requiere credenciales cliente | S1 | Pendiente | Configurar env seguro | Cliente/PLM | Firebase Console | Si |
| Dominios autorizados Firebase | S1 | Pendiente | Agregar dominios web/PWA | Cliente | URL final | Si |
| CORS productivo requiere URL final | S1 | Pendiente | Declarar origenes reales | PLM | URL final | Si |
| RAG depende de DeepSeek API key | S2 | Pendiente | Secret backend | Cliente/PLM | Proveedor | Si salvo aprobacion |
| RAG depende de corpus real | S2 | Pendiente | Carga y UAT corpus | Cliente | Documentos | Si salvo aprobacion |
| GCS bucket produccion | S2 | Pendiente | Crear bucket/permisos | Cliente/PLM | GCP | Puede bloquear RAG docs |
| Chroma local no es storage productivo definitivo | S2 | Abierto | Persistencia controlada | PLM | Hosting | Si para RAG productivo |
| Firestore indices al escalar | S3 | Abierto | Monitorear errores de indice | Cliente/PLM | Volumen | No con plan |
| E2E login depende de estrategia Firebase | S3 | Abierto | Token real o mocks controlados | PLM | Cuentas | No con smoke |
| Flutter nativo externo no esta versionado aqui | S3 | Declarado | Gestionar como entregable externo | Equipo | Repo externo | No para este repo |
| PWA no sustituye automaticamente Flutter | S3 | Declarado | Mantener alcance separado | Equipo | Cliente | No |
| SAP/Calendar/WhatsApp/Mapas fuera de codigo real | S3 | Declarado fuera de alcance | No prometer | Equipo | Alcance futuro | No |
| Publicacion Play/App Store fuera de repo | S3 | Declarado fuera de alcance | Plan futuro | Cliente/Equipo | Stores | No |
| Go-live requiere UAT cliente | S1 | Pendiente | Ejecutar checklist | Cliente | Agenda UAT | Si |
| Costos RAG/Flutter adicionales | S3 | Pendiente comercial | Validar cierre contractual | Cliente/Equipo | Acuerdo | No tecnico |
| Barra temporal de test | S1 si queda activa en produccion | Autorizada temporalmente | Retiro manual ultimo paso | Equipo PLM | Decision equipo | Si para prod final |
