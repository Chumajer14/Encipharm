from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


AUDIT_COLLECTION = "audit_logs"


def record_audit_event(
    db,
    *,
    user: dict[str, Any],
    action: str,
    resource: str,
    resource_id: str | None,
    result: str = "success",
    metadata: dict[str, Any] | None = None,
) -> None:
    """Persist a lightweight immutable audit event for critical backend changes."""
    event_id = str(uuid4())
    db.collection(AUDIT_COLLECTION).document(event_id).set({
        "id": event_id,
        "userUid": user.get("uid"),
        "userRole": user.get("rol"),
        "action": action,
        "resource": resource,
        "resourceId": resource_id,
        "result": result,
        "metadata": metadata or {},
        "createdAt": datetime.now(timezone.utc),
    })
