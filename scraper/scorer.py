def calculate_score(details: dict) -> int:
    score = 0

    # No website → +3
    if not details.get("website"):
        score += 3

    # Less than 5 reviews → +2
    if details.get("resenas_count", 0) < 5:
        score += 2

    # No photos or less than 3 → +1
    if details.get("fotos_count", 0) < 3:
        score += 1

    # Rating < 3.5 with more than 10 reviews → +1 (poor reputation, needs help)
    rating = details.get("rating")
    resenas = details.get("resenas_count", 0)
    if rating is not None and rating < 3.5 and resenas > 10:
        score += 1

    # Less than 3 fields complete among: phone, hours, description → +1
    filled = sum([
        bool(details.get("telefono")),
        bool(details.get("tiene_horarios")),
        bool(details.get("descripcion")),
    ])
    if filled < 3:
        score += 1

    return min(score, 10)
