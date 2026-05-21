from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from db.models import EstadoContacto

VALID_ESTADOS = {e.value for e in EstadoContacto}


class LeadOut(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    place_id: str
    nombre: str
    direccion: str
    telefono: Optional[str]
    website: Optional[str]
    fotos_count: int
    resenas_count: int
    rating: Optional[float]
    tiene_horarios: bool
    categoria: str
    zona: str
    lat: Optional[float]
    lng: Optional[float]
    score: int
    estado_contacto: str
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime


class LeadUpdate(BaseModel):
    estado_contacto: Optional[str] = None
    notas: Optional[str] = None

    @field_validator("estado_contacto")
    @classmethod
    def validate_estado(cls, v):
        if v is not None and v not in VALID_ESTADOS:
            raise ValueError(f"estado_contacto debe ser uno de: {sorted(VALID_ESTADOS)}")
        return v


class StatsOut(BaseModel):
    total_leads: int
    score_promedio: float
    por_categoria: dict[str, int]
    por_estado: dict[str, int]
    por_zona: dict[str, int]
    top_leads: list[LeadOut]
