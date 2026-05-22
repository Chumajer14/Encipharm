from fastapi import APIRouter, Depends

from app.core.auth import require_role
from app.models.competencia import CompetitionRepositoryResponse
from app.services.competencia import get_competition_repository
from app.services.firestore import get_db


router = APIRouter(prefix="/competencia", tags=["Competencia"])


@router.get("/repository", response_model=CompetitionRepositoryResponse)
async def read_competition_repository(
    _: dict = Depends(require_role("supervisor")),
):
    db = get_db()
    return get_competition_repository(db)
