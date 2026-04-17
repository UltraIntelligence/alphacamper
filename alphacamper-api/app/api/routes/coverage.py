from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.coverage import CoverageRepository
from app.schemas.coverage import CoverageSummaryResponse

router = APIRouter()


@router.get("", response_model=CoverageSummaryResponse)
def get_coverage_summary(
    response: Response,
    db: Session = Depends(get_db),
) -> CoverageSummaryResponse:
    response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
    repo = CoverageRepository(db)
    return CoverageSummaryResponse(
        totals=repo.overall_summary(),
        providers=repo.provider_rows(),
        regions=repo.region_rows(),
    )
