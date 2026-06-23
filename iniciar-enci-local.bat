@echo off
setlocal

rem Inicia todos los servicios de Enci solo en la interfaz local.
set "ROOT=%~dp0"
set "BACKEND=%ROOT%Backend"
set "FRONTEND=%ROOT%frontend"
set "VENDEDOR_APP=%ROOT%vendedor-app"

rem Valida las instalaciones locales antes de abrir procesos independientes.
where uv >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encontro uv en PATH.
    echo Instala uv y ejecuta: cd Backend ^&^& uv sync
    pause
    exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
    echo [ERROR] Faltan las dependencias de frontend.
    echo Ejecuta: cd frontend ^&^& npm install
    pause
    exit /b 1
)

if not exist "%VENDEDOR_APP%\node_modules" (
    echo [ERROR] Faltan las dependencias de vendedor-app.
    echo Ejecuta: cd vendedor-app ^&^& npm install
    pause
    exit /b 1
)

echo Iniciando backend en http://127.0.0.1:8000...
start "Enci - Backend" /D "%BACKEND%" cmd.exe /k "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Iniciando frontend en http://127.0.0.1:5173...
start "Enci - Frontend" /D "%FRONTEND%" cmd.exe /k "npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo Iniciando app vendedor en http://127.0.0.1:5174...
start "Enci - App vendedor" /D "%VENDEDOR_APP%" cmd.exe /k "npm.cmd run dev -- --host 127.0.0.1 --port 5174"

rem Da tiempo al arranque inicial y abre ambas aplicaciones en el navegador predeterminado.
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173"
start "" "http://127.0.0.1:5174"

echo Servicios locales iniciados. Cierra sus tres ventanas para detenerlos.
endlocal
