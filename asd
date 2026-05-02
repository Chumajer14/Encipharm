warning: in the working copy of 'Backend/app/core/auth.py', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'Backend/app/main.py', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'Backend/app/models/user.py', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'Backend/pyproject.toml', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'Backend/tests/test_api_smoke.py', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'Backend/uv.lock', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/sprints/sprint-02.md', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/Backend/app/core/auth.py b/Backend/app/core/auth.py[m
[1mindex 11e35c3..6dd10c9 100644[m
[1m--- a/Backend/app/core/auth.py[m
[1m+++ b/Backend/app/core/auth.py[m
[36m@@ -1,6 +1,7 @@[m
 from fastapi import Depends, HTTPException, status[m
 from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials[m
 from app.services.firebase import verify_token[m
[32m+[m[32mfrom app.services.firestore import get_db[m
 [m
 security = HTTPBearer()[m
 [m
[36m@@ -18,10 +19,9 @@[m [masync def get_current_user([m
             headers={"WWW-Authenticate": "Bearer"},[m
         )[m
 [m
[31m-async def require_role(required_role: str):[m
[32m+[m[32mdef require_role(required_role: str):[m
     async def role_checker(user: dict = Depends(get_current_user)) -> dict:[m
[31m-        from google.cloud import firestore[m
[31m-        db = firestore.Client()[m
[32m+[m[32m        db = get_db()[m
         user_doc = db.collection("users").document(user["uid"]).get()[m
         if not user_doc.exists:[m
             raise HTTPException([m
[36m@@ -40,4 +40,4 @@[m [masync def require_role(required_role: str):[m
                 detail="No tienes permisos para esta acción"[m
             )[m
         return {**user, **user_data}[m
[31m-    return role_checker[m
\ No newline at end of file[m
[32m+[m[32m    return role_checker[m
[1mdiff --git a/Backend/app/main.py b/Backend/app/main.py[m
[1mindex 328a29c..a8a426a 100644[m
[1m--- a/Backend/app/main.py[m
[1m+++ b/Backend/app/main.py[m
[36m@@ -4,6 +4,9 @@[m [mfrom app.core.config import get_settings[m
 from app.core.auth import get_current_user[m
 from app.services.firebase import init_firebase[m
 from app.api.auth import router as auth_router[m
[32m+[m[32mfrom app.api.clientes import router as clientes_router[m
[32m+[m[32mfrom app.api.dashboard import router as dashboard_router[m
[32m+[m[32mfrom app.api.users import router as users_router[m
 [m
 settings = get_settings()[m
 [m
[36m@@ -23,6 +26,9 @@[m [mapp.add_middleware([m
 )[m
 [m
 app.include_router(auth_router)[m
[32m+[m[32mapp.include_router(clientes_router)[m
[32m+[m[32mapp.include_router(dashboard_router)[m
[32m+[m[32mapp.include_router(users_router)[m
 [m
 @app.get("/")[m
 def root():[m
[36m@@ -38,4 +44,4 @@[m [masync def get_me(user: dict = Depends(get_current_user)):[m
         "uid": user.get("uid"),[m
         "email": user.get("email"),[m
         "message": "Token válido ✅"[m
[31m-    }[m
\ No newline at end of file[m
[32m+[m[32m    }[m
[1mdiff --git a/Backend/app/models/user.py b/Backend/app/models/user.py[m
[1mindex e8224a8..03021d0 100644[m
[1m--- a/Backend/app/models/user.py[m
[1m+++ b/Backend/app/models/user.py[m
[36m@@ -1,16 +1,30 @@[m
[31m-from pydantic import BaseModel, ConfigDict, EmailStr[m
[32m+[m[32mfrom pydantic import BaseModel, ConfigDict, EmailStr, Field[m
 from typing import Optional[m
[32m+[m[32mfrom typing import Literal[m
 from datetime import datetime[m
 [m
[32m+[m[32mUserRole = Literal["admin", "supervisor", "vendedor"][m
[32m+[m
 class UserBase(BaseModel):[m
     email: EmailStr[m
[31m-    nombre: str[m
[31m-    rol: str = "vendedor"[m
[32m+[m[32m    nombre: str = Field(min_length=1)[m
[32m+[m[32m    rol: UserRole = "vendedor"[m
     activo: bool = True[m
 [m
 class UserCreate(UserBase):[m
     uid: str[m
 [m
[32m+[m[32mclass UserUpdate(BaseModel):[m
[32m+[m[32m    nombre: Optional[str] = Field(default=None, min_length=1)[m
[32m+[m[32m    rol: Optional[UserRole] = None[m
[32m+[m[32m    activo: Optional[bool] = None[m
[32m+[m
[32m+[m[32mclass UserRoleUpdate(BaseModel):[m
[32m+[m[32m    rol: UserRole[m
[32m+[m
[32m+[m[32mclass UserStatusUpdate(BaseModel):[m
[32m+[m[32m    activo: bool[m
[32m+[m
 class UserResponse(UserBase):[m
     model_config = ConfigDict(from_attributes=True)[m
 [m
[1mdiff --git a/Backend/pyproject.toml b/Backend/pyproject.toml[m
[1mindex bdf37d2..b955d21 100644[m
[1m--- a/Backend/pyproject.toml[m
[1m+++ b/Backend/pyproject.toml[m
[36m@@ -13,5 +13,6 @@[m [mdependencies = [[m
     "pydantic-settings>=2.14.0",[m
     "pytest>=9.0.2",[m
     "python-dotenv>=1.2.2",[m
[32m+[m[32m    "python-multipart>=0.0.21",[m
     "uvicorn[standard]>=0.46.0",[m
 ][m
[1mdiff --git a/Backend/tests/test_api_smoke.py b/Backend/tests/test_api_smoke.py[m
[1mindex 32a1b36..575a510 100644[m
[1m--- a/Backend/tests/test_api_smoke.py[m
[1m+++ b/Backend/tests/test_api_smoke.py[m
[36m@@ -42,9 +42,9 @@[m [mdef test_auth_endpoints_require_bearer_token(monkeypatch):[m
     assert register_response.status_code in (401, 403)[m
 [m
 [m
[31m-def test_clientes_module_is_still_pending(monkeypatch):[m
[32m+[m[32mdef test_clientes_module_requires_bearer_token(monkeypatch):[m
     client = build_client(monkeypatch)[m
 [m
     response = client.get("/clientes")[m
 [m
[31m-    assert response.status_code == 404[m
[32m+[m[32m    assert response.status_code in (401, 403)[m
[1mdiff --git a/Backend/uv.lock b/Backend/uv.lock[m
[1mindex f2c5d86..3e93a24 100644[m
[1m--- a/Backend/uv.lock[m
[1m+++ b/Backend/uv.lock[m
[36m@@ -51,6 +51,7 @@[m [mdependencies = [[m
     { name = "pydantic-settings" },[m
     { name = "pytest" },[m
     { name = "python-dotenv" },[m
[32m+[m[32m    { name = "python-multipart" },[m
     { name = "uvicorn", extra = ["standard"] },[m
 ][m
 [m
[36m@@ -64,6 +65,7 @@[m [mrequires-dist = [[m
     { name = "pydantic-settings", specifier = ">=2.14.0" },[m
     { name = "pytest", specifier = ">=9.0.2" },[m
     { name = "python-dotenv", specifier = ">=1.2.2" },[m
[32m+[m[32m    { name = "python-multipart", specifier = ">=0.0.21" },[m
     { name = "uvicorn", extras = ["standard"], specifier = ">=0.46.0" },[m
 ][m
 [m
[36m@@ -928,6 +930,15 @@[m [mwheels = [[m
     { url = "https://files.pythonhosted.org/packages/0b/d7/1959b9648791274998a9c3526f6d0ec8fd2233e4d4acce81bbae76b44b2a/python_dotenv-1.2.2-py3-none-any.whl", hash = "sha256:1d8214789a24de455a8b8bd8ae6fe3c6b69a5e3d64aa8a8e5d68e694bbcb285a", size = 22101, upload-time = "2026-03-01T16:00:25.09Z" },[m
 ][m
 [m
[32m+[m[32m[[package]][m
[32m+[m[32mname = "python-multipart"[m
[32m+[m[32mversion = "0.0.27"[m
[32m+[m[32msource = { registry = "https://pypi.org/simple" }[m
[32m+[m[32msdist = { url = "https://files.pythonhosted.org/packages/69/9b/f23807317a113dc36e74e75eb265a02dd1a4d9082abc3c1064acd22997c4/python_multipart-0.0.27.tar.gz", hash = "sha256:9870a6a8c5a20a5bf4f07c017bd1489006ff8836cff097b6933355ee2b49b602", size = 44043, upload-time = "2026-04-27T10:51:26.649Z" }[m
[32m+[m[32mwheels = [[m
[32m+[m[32m    { url = "https://files.pythonhosted.org/packages/99/78/4126abcbdbd3c559d43e0db7f7b9173fc6befe45d39a2856cc0b8ec2a5a6/python_multipart-0.0.27-py3-none-any.whl", hash = "sha256:6fccfad17a27334bd0193681b369f476eda3409f17381a2d65aa7df3f7275645", size = 29254, upload-time = "2026-04-27T10:51:24.997Z" },[m
[32m+[m[32m][m
[32m+[m
 [[package]][m
 name = "pyyaml"[m
 version = "6.0.3"[m
[1mdiff --git a/docs/sprints/sprint-02.md b/docs/sprints/sprint-02.md[m
[1mindex 511062b..7543b17 100644[m
[1m--- a/docs/sprints/sprint-02.md[m
[1m+++ b/docs/s