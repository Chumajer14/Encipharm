import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, HTMLResponse

from app.core.config import get_settings

router = APIRouter(tags=["Testing"])

GUIDE_PATH = Path(__file__).resolve().parent / "static" / "guias" / "frontend-demo-guide.pdf"


def _firebase_web_config() -> dict[str, str | None]:
    settings = get_settings()
    return {
        "apiKey": settings.FIREBASE_WEB_API_KEY,
        "authDomain": settings.FIREBASE_WEB_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_WEB_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_WEB_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_WEB_APP_ID,
        "measurementId": settings.FIREBASE_WEB_MEASUREMENT_ID,
    }


@router.get("/docs", include_in_schema=False)
async def testing_docs():
    settings = get_settings()
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No encontrado")
    firebase_config = json.dumps(_firebase_web_config())
    return HTMLResponse(f"""
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Enci API - Consola de pruebas</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      :root {{
        color-scheme: dark;
        font-family: Arial, sans-serif;
      }}
      body {{
        background: #0f172a;
        margin: 0;
      }}
      .topbar {{
        background: #020617;
        border-bottom: 1px solid #1e293b;
        color: #f8fafc;
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr auto;
        padding: 18px 24px;
      }}
      .topbar h1 {{
        font-size: 22px;
        margin: 0 0 6px;
      }}
      .topbar p {{
        color: #94a3b8;
        margin: 0;
      }}
      .auth-panel {{
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 340px;
      }}
      .actions {{
        display: flex;
        gap: 8px;
      }}
      .guide-link {{
        align-items: center;
        background: #38bdf8;
        border-radius: 8px;
        color: #020617;
        display: inline-flex;
        font-weight: 800;
        padding: 10px 14px;
        text-decoration: none;
      }}
      button {{
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 800;
        padding: 10px 14px;
      }}
      .primary {{
        background: #22c55e;
        color: #020617;
      }}
      .secondary {{
        background: transparent;
        border: 1px solid #334155;
        color: #e2e8f0;
      }}
      .status {{
        border-radius: 8px;
        color: #cbd5e1;
        font-size: 13px;
        max-width: 560px;
        padding: 8px 10px;
        text-align: right;
      }}
      .status.ok {{
        background: #052e24;
        color: #bbf7d0;
      }}
      .status.error {{
        background: #450a0a;
        color: #fecaca;
      }}
      .help {{
        background: #111827;
        border-bottom: 1px solid #1f2937;
        color: #cbd5e1;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, 1fr);
        padding: 14px 24px;
      }}
      .help strong {{
        color: #f8fafc;
        display: block;
        margin-bottom: 4px;
      }}
      #swagger-ui {{
        background: #f8fafc;
        min-height: calc(100vh - 170px);
      }}
      @media (max-width: 860px) {{
        .topbar,
        .help {{
          grid-template-columns: 1fr;
        }}
        .auth-panel {{
          align-items: flex-start;
          min-width: 0;
        }}
        .status {{
          text-align: left;
        }}
      }}
    </style>
  </head>
  <body>
    <header class="topbar">
      <section>
        <h1>Enci API - Consola de pruebas</h1>
        <p>Login con Google, autorizacion automatica y pruebas de endpoints protegidos.</p>
      </section>
      <section class="auth-panel">
        <div class="actions">
          <button class="primary" id="loginButton">Login con Google</button>
          <button class="secondary" id="logoutButton">Cerrar sesion</button>
          <a class="guide-link" href="/docs/guia-presentacion-frontend.pdf" target="_blank" rel="noopener">Guia PDF</a>
        </div>
        <div class="status" id="authStatus">Sin sesion activa. Inicia sesion para autorizar Swagger.</div>
      </section>
    </header>

    <section class="help">
      <div><strong>1. Login</strong>Presiona Login con Google y el token se aplicara al esquema HTTPBearer.</div>
      <div><strong>2. Authorize</strong>El boton Authorize queda precargado automaticamente con el token Firebase.</div>
      <div><strong>3. Pruebas</strong>Ejecuta `/me`, `/clientes`, `/dashboard` y `/users` desde esta consola.</div>
    </section>

    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script type="module">
      import {{ initializeApp }} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
      import {{
        getAuth,
        GoogleAuthProvider,
        onAuthStateChanged,
        signInWithPopup,
        signOut
      }} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

      const firebaseConfig = {firebase_config};
      const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
      const isConfigured = requiredKeys.every((key) => firebaseConfig[key]);
      const status = document.getElementById("authStatus");
      const loginButton = document.getElementById("loginButton");
      const logoutButton = document.getElementById("logoutButton");
      let swaggerUi;
      let auth;

      function setStatus(message, type = "") {{
        status.textContent = message;
        status.className = `status ${{type}}`.trim();
      }}

      function saveToken(token) {{
        if (token) {{
          sessionStorage.setItem("enciFirebaseToken", token);
          swaggerUi?.preauthorizeApiKey("HTTPBearer", token);
        }} else {{
          sessionStorage.removeItem("enciFirebaseToken");
        }}
      }}

      swaggerUi = SwaggerUIBundle({{
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: false,
        requestInterceptor: (request) => {{
          const token = sessionStorage.getItem("enciFirebaseToken");
          if (token) {{
            request.headers.Authorization = `Bearer ${{token}}`;
          }}
          return request;
        }},
        onComplete: () => {{
          const token = sessionStorage.getItem("enciFirebaseToken");
          if (token) {{
            swaggerUi.preauthorizeApiKey("HTTPBearer", token);
          }}
        }},
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
      }});

      window.ui = swaggerUi;

      if (!isConfigured) {{
        loginButton.disabled = true;
        setStatus("Falta configurar FIREBASE_WEB_* en Backend/.env para activar login en /docs.", "error");
      }} else {{
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({{ prompt: "select_account" }});

        loginButton.addEventListener("click", async () => {{
          try {{
            setStatus("Abriendo Google Sign-In...");
            const result = await signInWithPopup(auth, provider);
            const token = await result.user.getIdToken();
            saveToken(token);
            setStatus(`Autorizado como ${{result.user.email}}. Token aplicado a Swagger.`, "ok");
          }} catch (error) {{
            setStatus(`No se pudo iniciar sesion: ${{error.message}}`, "error");
          }}
        }});

        logoutButton.addEventListener("click", async () => {{
          await signOut(auth);
          saveToken("");
          setStatus("Sesion cerrada. El token fue eliminado.", "");
        }});

        onAuthStateChanged(auth, async (user) => {{
          if (!user) {{
            return;
          }}
          const token = await user.getIdToken();
          saveToken(token);
          setStatus(`Autorizado como ${{user.email}}. Token aplicado a Swagger.`, "ok");
        }});
      }}
    </script>
  </body>
</html>
""")


@router.get("/docs/guia-presentacion-frontend.pdf", include_in_schema=False)
async def frontend_demo_guide():
    settings = get_settings()
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No encontrado")
    return FileResponse(
        GUIDE_PATH,
        media_type="application/pdf",
        filename="guia-presentacion-frontend-enci.pdf",
    )
