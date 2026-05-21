import csv
import io
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from api.deps import get_db
from api.schemas import LeadOut, LeadUpdate, VALID_ESTADOS
from db.models import Lead

router = APIRouter()


def _apply_filters(query, categoria, zona, estado, score_min, score_max):
    if categoria:
        query = query.filter(Lead.categoria == categoria)
    if zona:
        query = query.filter(Lead.zona == zona)
    if estado:
        query = query.filter(Lead.estado_contacto == estado)
    if score_min is not None:
        query = query.filter(Lead.score >= score_min)
    if score_max is not None:
        query = query.filter(Lead.score <= score_max)
    return query


def _validate_estado(estado: Optional[str]):
    if estado and estado not in VALID_ESTADOS:
        raise HTTPException(status_code=400, detail=f"estado inválido. Valores: {sorted(VALID_ESTADOS)}")


@router.get("/leads")
def list_leads(
    categoria: Optional[str] = None,
    zona: Optional[str] = None,
    estado: Optional[str] = None,
    score_min: Optional[int] = None,
    score_max: Optional[int] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    _validate_estado(estado)
    query = db.query(Lead)
    query = _apply_filters(query, categoria, zona, estado, score_min, score_max)
    total = query.count()
    results = (
        query.order_by(Lead.score.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [LeadOut.model_validate(r) for r in results],
    }


# Ruta estática ANTES de /{lead_id} para evitar conflicto de rutas
@router.get("/leads/export/csv")
def export_leads_csv(
    categoria: Optional[str] = None,
    zona: Optional[str] = None,
    estado: Optional[str] = None,
    score_min: Optional[int] = None,
    score_max: Optional[int] = None,
    db: Session = Depends(get_db),
):
    _validate_estado(estado)
    query = db.query(Lead)
    query = _apply_filters(query, categoria, zona, estado, score_min, score_max)
    leads = query.order_by(Lead.score.desc()).all()

    fields = [
        "id", "place_id", "nombre", "direccion", "telefono", "website",
        "fotos_count", "resenas_count", "rating", "tiene_horarios",
        "categoria", "zona", "lat", "lng", "score", "estado_contacto",
        "notas", "created_at", "updated_at",
    ]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    for lead in leads:
        writer.writerow([getattr(lead, f) for f in fields])

    output.seek(0)
    filename = f"leads_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/leads/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == str(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: UUID, body: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == str(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")

    if body.estado_contacto is not None:
        lead.estado_contacto = body.estado_contacto
    if body.notas is not None:
        lead.notas = body.notas

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return lead
