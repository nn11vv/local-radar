import time
import logging
from datetime import datetime
from typing import Callable, Optional

from sqlalchemy.orm import Session

from config import GOOGLE_PLACES_API_KEY
from db.models import Lead
from db.session import get_session, init_db
from scraper.places_client import PlacesClient, CATEGORY_TYPES
from scraper.scorer import calculate_score

logger = logging.getLogger(__name__)

LOCATION = (38.3956, -0.4189)
RADIUS = 3000
ZONA = "San Juan Playa, Alicante"

# Fields that belong in the Lead model (excludes scoring-only fields like 'descripcion')
LEAD_FIELDS = {
    "place_id", "nombre", "direccion", "telefono", "website",
    "fotos_count", "resenas_count", "rating", "tiene_horarios",
    "categoria", "zona", "lat", "lng", "score",
}


def extract_details(raw: dict, categoria: str) -> dict:
    geometry = raw.get("geometry", {}).get("location", {})
    photos = raw.get("photos", [])
    editorial = raw.get("editorial_summary", {})

    return {
        "place_id": raw.get("place_id"),
        "nombre": raw.get("name", ""),
        "direccion": raw.get("formatted_address", ""),
        "telefono": raw.get("formatted_phone_number"),
        "website": raw.get("website"),
        "fotos_count": len(photos),
        "resenas_count": raw.get("user_ratings_total", 0),
        "rating": raw.get("rating"),
        "tiene_horarios": bool(raw.get("opening_hours")),
        "categoria": categoria,
        "zona": ZONA,
        "lat": geometry.get("lat"),
        "lng": geometry.get("lng"),
        # scoring-only, not persisted
        "descripcion": editorial.get("overview"),
    }


def upsert_lead(session: Session, data: dict) -> bool:
    """Returns True if inserted, False if updated."""
    lead_data = {k: v for k, v in data.items() if k in LEAD_FIELDS}

    existing = session.query(Lead).filter_by(place_id=data["place_id"]).first()

    if existing:
        for key, value in lead_data.items():
            if key not in ("place_id",):
                setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        return False

    session.add(Lead(**lead_data))
    return True


def run_scraper(
    on_progress: Optional[Callable[[str, int, int], None]] = None,
) -> int:
    init_db()
    client = PlacesClient(GOOGLE_PLACES_API_KEY)
    all_data: list[dict] = []
    total_inserted = 0
    total_estimated = len(CATEGORY_TYPES) * 60

    logger.info("Starting scraper — zone: %s, radius: %dm", ZONA, RADIUS)

    for categoria_es, place_type in CATEGORY_TYPES.items():
        if on_progress:
            on_progress(categoria_es, total_inserted, total_estimated)

        logger.info("[%s] Searching nearby places...", categoria_es)

        nearby = client.search_nearby(LOCATION, RADIUS, place_type)
        logger.info("[%s] Nearby search returned %d places", categoria_es, len(nearby))

        inserted = updated = errors = 0

        with get_session() as session:
            for place in nearby:
                place_id = place.get("place_id")
                if not place_id:
                    continue

                time.sleep(0.2)  # stay well under API rate limits

                raw = client.get_place_details(place_id)
                if not raw:
                    errors += 1
                    logger.warning("[%s] Could not fetch details for %s", categoria_es, place_id)
                    continue

                details = extract_details(raw, categoria_es)
                details["score"] = calculate_score(details)

                is_new = upsert_lead(session, details)
                all_data.append(details)

                if is_new:
                    inserted += 1
                else:
                    updated += 1

            session.commit()

        total_inserted += inserted
        if on_progress:
            on_progress(categoria_es, total_inserted, total_estimated)

        logger.info(
            "[%s] Done — %d inserted, %d updated, %d errors",
            categoria_es, inserted, updated, errors,
        )

    _print_summary(all_data)
    return total_inserted


def _print_summary(all_data: list[dict]):
    total = len(all_data)
    separator = "=" * 56

    print(f"\n{separator}")
    print(f"  SCRAPER COMPLETE")
    print(f"  Total processed: {total}")
    print(separator)

    if not all_data:
        return

    print("\n  Top 5 leads by score:\n")
    top5 = sorted(all_data, key=lambda x: x.get("score", 0), reverse=True)[:5]
    print(f"  {'nombre':<35} {'categoria':<20} {'score':>5} {'resenas':>7}")
    print(f"  {'-'*35} {'-'*20} {'-'*5} {'-'*7}")
    for r in top5:
        print(f"  {r.get('nombre',''):<35} {r.get('categoria',''):<20} {r.get('score',0):>5} {r.get('resenas_count',0):>7}")
    print(f"\n{separator}\n")
