import os
import requests
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def generate_ai_summary(*, title, media_type, platform, director, status, rating, review):
    if not review or not review.strip():
        return ""

    if not GEMINI_API_KEY:
        return review[:180] + "..."

    prompt = f"""
You are generating a short review summary for a personal media tracker app.

Rules:
- Use ONLY the information provided.
- Do NOT add plot details or external knowledge.
- Keep it friendly, concise, and grounded in the user's notes.
- 2–3 sentences max.

Media Details:
Title: {title}
Type: {media_type}
Platform: {platform or "Not specified"}
Director: {director or "Not specified"}
Status: {status}
User Rating: {rating if rating is not None else "Not rated"}

User Notes:
\"\"\"{review}\"\"\"
"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(
            GEMINI_URL,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            json=payload,
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    except Exception as e:
        print(f"GEMINI REST ERROR: {e}")
        return review[:180] + "..."