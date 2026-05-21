import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class EstadoContacto(str, enum.Enum):
    sin_contactar = "sin_contactar"
    contactado = "contactado"
    en_negociacion = "en_negociacion"
    cerrado = "cerrado"
    descartado = "descartado"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    place_id = Column(String, unique=True, nullable=False, index=True)
    nombre = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    website = Column(String, nullable=True)
    fotos_count = Column(Integer, default=0)
    resenas_count = Column(Integer, default=0)
    rating = Column(Float, nullable=True)
    tiene_horarios = Column(Boolean, default=False)
    categoria = Column(String, nullable=False)
    zona = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    score = Column(Integer, default=0)
    estado_contacto = Column(
        Enum(EstadoContacto, name="estadocontacto"),
        default=EstadoContacto.sin_contactar,
        nullable=False,
    )
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
