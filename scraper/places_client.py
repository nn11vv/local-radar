import time
import logging

import googlemaps

logger = logging.getLogger(__name__)

CATEGORY_TYPES: dict[str, str] = {
    "restaurantes": "restaurant",
    "peluquerias": "hair_care",
    "tiendas_ropa": "clothing_store",
    "gimnasios": "gym",
    "clinicas_dentales": "dentist",
}

DETAIL_FIELDS = [
    "place_id",
    "name",
    "formatted_address",
    "formatted_phone_number",
    "website",
    "photo",
    "user_ratings_total",
    "rating",
    "opening_hours",
    "geometry",
    "editorial_summary",
]


class PlacesClient:
    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)

    def search_nearby(self, location: tuple, radius: int, place_type: str) -> list[dict]:
        results = []

        response = self.client.places_nearby(
            location=location,
            radius=radius,
            type=place_type,
        )
        results.extend(response.get("results", []))

        # next_page_token requires a 2s delay before use
        while "next_page_token" in response:
            time.sleep(2)
            response = self.client.places_nearby(
                location=location,
                radius=radius,
                type=place_type,
                page_token=response["next_page_token"],
            )
            results.extend(response.get("results", []))

        return results

    def get_place_details(self, place_id: str, retries: int = 3) -> dict | None:
        for attempt in range(retries):
            try:
                response = self.client.place(
                    place_id=place_id,
                    fields=DETAIL_FIELDS,
                )
                return response.get("result", {})
            except Exception as exc:
                logger.warning("Attempt %d/%d failed for %s: %s", attempt + 1, retries, place_id, exc)
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
        return None
