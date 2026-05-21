from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.deps import get_db
from api.schemas import LeadOut, StatsOut
from db.models import Lead

router = APIRouter()


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Lead.id)).scalar() or 0
    avg_score = db.query(func.avg(Lead.score)).scalar() or 0.0

    por_categoria = {
        row[0]: row[1]
        for row in db.query(Lead.categoria, func.count(Lead.id))
        .group_by(Lead.categoria)
        .all()
    }

    por_estado = {
        (row[0].value if hasattr(row[0], "value") else str(row[0])): row[1]
        for row in db.query(Lead.estado_contacto, func.count(Lead.id))
        .group_by(Lead.estado_contacto)
        .all()
    }

    por_zona = {
        row[0]: row[1]
        for row in db.query(Lead.zona, func.count(Lead.id))
        .group_by(Lead.zona)
        .all()
    }

    top_leads = db.query(Lead).order_by(Lead.score.desc()).limit(5).all()

    return StatsOut(
        total_leads=total,
        score_promedio=round(float(avg_score), 2),
        por_categoria=por_categoria,
        por_estado=por_estado,
        por_zona=por_zona,
        top_leads=[LeadOut.model_validate(l) for l in top_leads],
    )
