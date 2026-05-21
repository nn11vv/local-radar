import threading
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from fastapi import APIRouter

router = APIRouter(prefix="/scraper", tags=["scraper"])


@dataclass
class ScraperState:
    status: str = "idle"
    job_id: Optional[str] = None
    categoria_actual: Optional[str] = None
    procesados: int = 0
    total_estimado: int = 0
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    leads_nuevos: int = 0


_state = ScraperState()
_lock = threading.Lock()


def _run_in_thread(job_id: str) -> None:
    from scraper.runner import run_scraper

    def on_progress(categoria_actual: str, procesados: int, total_estimado: int) -> None:
        with _lock:
            if _state.job_id == job_id:
                _state.categoria_actual = categoria_actual
                _state.procesados = procesados
                _state.total_estimado = total_estimado

    try:
        leads_nuevos = run_scraper(on_progress=on_progress)
        with _lock:
            if _state.job_id == job_id:
                _state.status = "completed"
                _state.finished_at = datetime.utcnow()
                _state.leads_nuevos = leads_nuevos or 0
    except Exception:
        with _lock:
            if _state.job_id == job_id:
                _state.status = "error"
                _state.finished_at = datetime.utcnow()


@router.post("/run")
def start_scraper():
    global _state
    with _lock:
        if _state.status == "running":
            return {"status": "already_running"}

        job_id = str(uuid.uuid4())
        _state = ScraperState(
            status="running",
            job_id=job_id,
            started_at=datetime.utcnow(),
            total_estimado=300,
        )

    thread = threading.Thread(target=_run_in_thread, args=(job_id,), daemon=True)
    thread.start()

    return {"status": "running", "job_id": job_id}


@router.get("/status")
def get_status():
    with _lock:
        return {
            "status": _state.status,
            "progress": {
                "categoria_actual": _state.categoria_actual,
                "procesados": _state.procesados,
                "total_estimado": _state.total_estimado,
            },
            "started_at": _state.started_at,
            "finished_at": _state.finished_at,
            "leads_nuevos": _state.leads_nuevos,
        }
