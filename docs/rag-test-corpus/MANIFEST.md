# Corpus de prueba RAG Enci

Carpeta para cargar documentos desde el panel admin de Enci Chat.

Formatos aceptados por el backend:

- `.txt`
- `.pdf`
- `.docx`

## Contenido local del proyecto

Incluye documentación técnica, API, arquitectura, QA, sprints, hardening y guías del sistema Enci.

Rutas principales:

- `01_README.txt`
- `04_auth.txt`
- `05_clientes.txt`
- `06_comercial.txt`
- `07_dashboard.txt`
- `08_rag.txt`
- `09_users.txt`
- `12_auditoria-seguridad-defensiva-2026-05-19.txt`
- `14_epic-03-auditoria.txt`
- `15_epic-04-hardening.txt`
- `16_epic-05-uat-go-live.txt`
- `27_architecture.txt`
- `31_resumen-ejecutivo-tecnico-enci.txt`
- `32_resumen-ejecutivo-tecnico-enci.pdf`
- `33_frontend-demo-guide.pdf`
- `34_modelo_visual_design.txt`
- `35_modelo_visual_configuracion_usuarios.txt`
- `36_cierre-proyecto.txt`
- `37_evm-cierre-proyecto.txt`
- `38_semana-03.txt`
- `39_semana-04.txt`
- `40_semana-05.txt`

## Contenido externo oficial

Subcarpeta `internet/`.

Fuentes SAG extraidas para pruebas:

- `04_SAG_pecuaria.txt`: area pecuaria, sanidad animal, medicamentos veterinarios, alimentos animales.
- `05_SAG_peste_porcina_africana.txt`: PPA, signos, prevencion, riesgos para Chile.
- `06_SAG_brucelosis_bovina.txt`: brucelosis bovina, zoonosis, impactos productivos.
- `07_SAG_establecimientos_alimentacion_animal.txt`: comunicacion de inicio de actividades para alimentos animales.
- `08_SAG_ingreso_productos_origen_animal_vegetal.txt`: ingreso de productos vegetales/animales y declaracion jurada.
- `09_SAG_mascotas_animales_vegetales_protegidas.txt`: ingreso/salida de mascotas, CZE, CITES.

## Orden recomendado de carga

1. Cargar primero documentos pequenos `.txt`:
   - `08_rag.txt`
   - `04_auth.txt`
   - `05_clientes.txt`
   - `06_comercial.txt`
   - `09_users.txt`
2. Cargar corpus SAG:
   - `internet/*.txt`
3. Cargar documentos largos:
   - `12_auditoria-seguridad-defensiva-2026-05-19.txt`
   - `14_epic-03-auditoria.txt`
   - `31_resumen-ejecutivo-tecnico-enci.txt`
   - `36_cierre-proyecto.txt`
   - `37_evm-cierre-proyecto.txt`
   - `38_semana-03.txt`
   - `39_semana-04.txt`
   - `40_semana-05.txt`
4. Cargar PDFs al final:
   - `32_resumen-ejecutivo-tecnico-enci.pdf`
   - `33_frontend-demo-guide.pdf`

## Preguntas de prueba

Sistema interno:

- Que endpoints tiene el modulo RAG?
- Como se autentican los endpoints del backend?
- Que roles existen en Enci Ventas?
- Como funciona el flujo comercial de oportunidades y propuestas?
- Que reglas de seguridad tiene el sistema?
- Que incluye el hardening de seguridad?
- Como se despliega el frontend?
- Que pruebas de UAT estan definidas?

CRM interno:

- Dime todos los usuarios.
- Quienes son los vendedores?
- Cuantos clientes tenemos?
- Como va el pipeline?
- Que propuestas estan enviadas?
- Que oportunidades estan en negociacion?
- Que interacciones recientes existen?

Sanidad animal / SAG:

- Que es la peste porcina africana?
- La PPA afecta a personas?
- Que signos clinicos se observan en peste porcina africana?
- Por que no se deben ingresar productos carnicos de cerdo a Chile?
- Que es la brucelosis bovina?
- La brucelosis bovina es zoonosis?
- Que impactos productivos tiene la brucelosis bovina?
- Que empresas deben informar inicio de actividades de alimentos para animales al SAG?
- Que productos deben declararse al ingresar a Chile?
- Que certificado exige SAG para salida de mascotas?

Preguntas fuera de contexto esperadas:

- Cual es el precio actual del dolar?
- Que receta medica recomiendas para una persona?
- Quien gano el partido de ayer?

Estas deben responder con falta de informacion suficiente si no existe contexto interno aplicable.
