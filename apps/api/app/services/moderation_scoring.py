def suggest_ai_risk_label(kind: str, details: str | None) -> str:
    text = (details or "").lower()
    if kind == "factual_error" or "inconsistent" in text or "error" in text:
        return "needs_factual_review"
    if kind == "duplicate" or "repeat" in text:
        return "possible_duplicate"
    if kind in {"spam", "abuse"}:
        return f"possible_{kind}"
    return "needs_moderator_review"
