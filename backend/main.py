import os
import json
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

import google.generativeai as genai

from database import get_db
from models import Car, Session

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Car Pasand Kar Diya API")

# ── CORS ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Schemas ──────────────────────────────────────────────────
class SessionCreate(BaseModel):
    preferences: Optional[dict] = None


class SessionUpdate(BaseModel):
    preferences: Optional[dict] = None
    shortlisted_car_ids: Optional[list] = None


class ChatRequest(BaseModel):
    session_id: str
    message: str


# ── Health ────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok"}


# ── 1) GET /api/cars — list cars with optional filters ────────────────
@app.get("/api/cars")
def get_cars(
    budget: Optional[float] = Query(None, description="Max price in lakhs"),
    fuel_type: Optional[str] = Query(None),
    body_type: Optional[str] = Query(None),
    db: DBSession = Depends(get_db),
):
    query = db.query(Car)

    if budget is not None:
        query = query.filter(Car.price_lakh <= budget)
    if fuel_type is not None:
        query = query.filter(Car.fuel_type.ilike(fuel_type))
    if body_type is not None:
        query = query.filter(Car.body_type.ilike(body_type))

    cars = query.all()
    return [_car_to_dict(c) for c in cars]


# ── 6) GET /api/cars/shortlist — return specific cars by ids ─────────
@app.get("/api/cars/shortlist")
def get_shortlisted_cars(
    ids: str = Query(..., description="Comma-separated car IDs"),
    db: DBSession = Depends(get_db),
):
    try:
        car_ids = [int(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids must be comma-separated integers")

    cars = db.query(Car).filter(Car.id.in_(car_ids)).all()
    return [_car_to_dict(c) for c in cars]


# ── 2) POST /api/session — create a new session ─────────────────────
@app.post("/api/session")
def create_session(body: SessionCreate, db: DBSession = Depends(get_db)):
    new_session = Session(
        id=str(uuid.uuid4()),
        preferences=body.preferences or {},
        shortlisted_car_ids=[],
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return _session_to_dict(new_session)


# ── 3) PATCH /api/session/{id} — update preferences ─────────────────
@app.patch("/api/session/{session_id}")
def update_session(
    session_id: str,
    body: SessionUpdate,
    db: DBSession = Depends(get_db),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if body.preferences is not None:
        session.preferences = body.preferences
    if body.shortlisted_car_ids is not None:
        session.shortlisted_car_ids = body.shortlisted_car_ids

    db.commit()
    db.refresh(session)
    return _session_to_dict(session)


# ── 4) POST /api/chat — Gemini picks top 3 cars ─────────────────────
@app.post("/api/chat")
def chat(body: ChatRequest, db: DBSession = Depends(get_db)):
    # Fetch session
    session = db.query(Session).filter(Session.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch all cars as context
    cars = db.query(Car).all()
    cars_context = json.dumps([_car_to_dict(c) for c in cars], indent=2)

    preferences_context = json.dumps(session.preferences or {}, indent=2)

    prompt = f"""You are an expert Indian car advisor. 
The user has the following preferences:
{preferences_context}

Here is the full catalogue of available cars (JSON):
{cars_context}

User message: {body.message}

Based on the user's message, preferences, and the car catalogue, recommend exactly 3 cars.

You MUST respond with ONLY valid JSON in this exact format, no extra text:
{{
  "shortlisted_car_ids": [<id1>, <id2>, <id3>],
  "reasoning": "<brief explanation for each pick>"
}}"""

    model = genai.GenerativeModel("gemini-2.5-pro")
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )

    # Parse the JSON response
    try:
        result = json.loads(response.text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Gemini returned invalid JSON")

    # Update session with shortlisted car ids
    shortlisted_ids = result.get("shortlisted_car_ids", [])
    session.shortlisted_car_ids = shortlisted_ids
    db.commit()

    return result


# ── Helpers ───────────────────────────────────────────────────────────
def _car_to_dict(car: Car) -> dict:
    return {
        "id": car.id,
        "make": car.make,
        "model": car.model,
        "variant": car.variant,
        "price_lakh": car.price_lakh,
        "fuel_type": car.fuel_type,
        "transmission": car.transmission,
        "seating": car.seating,
        "mileage": car.mileage,
        "safety_rating": car.safety_rating,
        "body_type": car.body_type,
        "pros": car.pros,
        "cons": car.cons,
    }


def _session_to_dict(session: Session) -> dict:
    return {
        "id": session.id,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "preferences": session.preferences,
        "shortlisted_car_ids": session.shortlisted_car_ids,
    }
