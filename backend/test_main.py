"""
Tests for the Car Pasand Kar Diya FastAPI app.
Run with:  pytest test_main.py -v -s
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from database import SessionLocal, Base, engine
from models import Car, Session


# ── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create tables and seed test cars once for the whole test module."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    # Clear old test data
    db.query(Car).delete()
    db.query(Session).delete()
    db.commit()

    # Seed a small set of cars for testing
    test_cars = [
        Car(
            id=1, make="Maruti Suzuki", model="Swift", variant="ZXi+",
            price_lakh=8.70, fuel_type="Petrol", transmission="AMT",
            seating=5, mileage=22.56, safety_rating=3.0,
            body_type="Hatchback",
            pros="Great mileage, Strong resale value",
            cons="Tight rear seat, Basic safety",
        ),
        Car(
            id=2, make="Hyundai", model="Creta", variant="SX(O) Turbo DCT",
            price_lakh=20.15, fuel_type="Petrol", transmission="DCT",
            seating=5, mileage=17.0, safety_rating=5.0,
            body_type="SUV",
            pros="Feature-loaded with ADAS, Smooth turbo-DCT",
            cons="Expensive top variants, Average ground clearance",
        ),
        Car(
            id=3, make="Honda", model="City", variant="ZX CVT",
            price_lakh=14.70, fuel_type="Petrol", transmission="CVT",
            seating=5, mileage=18.4, safety_rating=4.0,
            body_type="Sedan",
            pros="Refined engine, Spacious rear seat",
            cons="Higher price, No sunroof in base",
        ),
        Car(
            id=4, make="Tata", model="Nexon EV", variant="Empowered+ LR",
            price_lakh=17.50, fuel_type="Electric", transmission="Automatic",
            seating=5, mileage=325.0, safety_rating=5.0,
            body_type="SUV",
            pros="Affordable long-range EV, 5-star safety",
            cons="Sparse fast-charging infra, Smaller boot",
        ),
        Car(
            id=5, make="Maruti Suzuki", model="Ertiga", variant="ZXi+ AT",
            price_lakh=12.80, fuel_type="Petrol", transmission="Automatic",
            seating=7, mileage=20.51, safety_rating=3.0,
            body_type="MPV",
            pros="Best value 7-seater, Easy city driving",
            cons="Third row for kids only, Underpowered when loaded",
        ),
    ]

    db.add_all(test_cars)
    db.commit()
    db.close()

    print("\n" + "=" * 60)
    print("DATABASE SEEDED — 5 test cars ready")
    print("=" * 60)

    yield


@pytest.fixture()
def client():
    """Return a TestClient for the FastAPI app."""
    return TestClient(app)


# ── 1. Health Check ───────────────────────────────────────────────────

def test_health_check(client):
    print("\n🧪 TEST: Health Check ...", end=" ")
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    print("✅ PASSED — status: ok")


# ── 2. Get All Cars ──────────────────────────────────────────────────

def test_get_all_cars(client):
    print("\n🧪 TEST: Get All Cars ...", end=" ")
    res = client.get("/api/cars")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 5
    print(f"✅ PASSED — returned {len(data)} cars")


# ── 3. Filter by Body Type ───────────────────────────────────────────

def test_filter_by_body_type_suv(client):
    print("\n🧪 TEST: Filter by body_type=SUV ...", end=" ")
    res = client.get("/api/cars", params={"body_type": "SUV"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert all(car["body_type"] == "SUV" for car in data)
    models = [c["model"] for c in data]
    print(f"✅ PASSED — {len(data)} SUVs found: {models}")


def test_filter_by_body_type_sedan(client):
    print("\n🧪 TEST: Filter by body_type=Sedan ...", end=" ")
    res = client.get("/api/cars", params={"body_type": "Sedan"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["model"] == "City"
    print(f"✅ PASSED — 1 Sedan found: {data[0]['make']} {data[0]['model']}")


def test_filter_by_body_type_no_results(client):
    print("\n🧪 TEST: Filter by body_type=Convertible (no results) ...", end=" ")
    res = client.get("/api/cars", params={"body_type": "Convertible"})
    assert res.status_code == 200
    assert res.json() == []
    print("✅ PASSED — empty list returned")


# ── 4. Filter by Budget ──────────────────────────────────────────────

def test_filter_by_budget_10(client):
    print("\n🧪 TEST: Filter by budget=10L ...", end=" ")
    res = client.get("/api/cars", params={"budget": 10.0})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["model"] == "Swift"
    print(f"✅ PASSED — 1 car under ₹10L: {data[0]['model']} (₹{data[0]['price_lakh']}L)")


def test_filter_by_budget_15(client):
    print("\n🧪 TEST: Filter by budget=15L ...", end=" ")
    res = client.get("/api/cars", params={"budget": 15.0})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3
    models = {car["model"] for car in data}
    assert models == {"Swift", "Ertiga", "City"}
    print(f"✅ PASSED — 3 cars under ₹15L: {sorted(models)}")


def test_combined_filters(client):
    print("\n🧪 TEST: Combined filter budget=25L + body_type=SUV ...", end=" ")
    res = client.get("/api/cars", params={"budget": 25.0, "body_type": "SUV"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert all(car["body_type"] == "SUV" for car in data)
    models = [c["model"] for c in data]
    print(f"✅ PASSED — {len(data)} SUVs under ₹25L: {models}")


# ── 5. Create Session ────────────────────────────────────────────────

def test_create_session_empty(client):
    print("\n🧪 TEST: Create session (empty prefs) ...", end=" ")
    res = client.post("/api/session", json={})
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["preferences"] == {}
    assert data["shortlisted_car_ids"] == []
    assert data["created_at"] is not None
    print(f"✅ PASSED — session created: {data['id'][:8]}...")


def test_create_session_with_preferences(client):
    prefs = {"budget": 15, "fuel_type": "Petrol", "body_type": "Hatchback"}
    print("\n🧪 TEST: Create session with preferences ...", end=" ")
    res = client.post("/api/session", json={"preferences": prefs})
    assert res.status_code == 200
    data = res.json()
    assert data["preferences"] == prefs
    print(f"✅ PASSED — prefs saved: {prefs}")


# ── 6. Update Session ────────────────────────────────────────────────

def test_update_session_preferences(client):
    print("\n🧪 TEST: Update session preferences ...", end=" ")
    create_res = client.post("/api/session", json={})
    session_id = create_res.json()["id"]

    new_prefs = {"budget": 20, "fuel_type": "Diesel"}
    res = client.patch(f"/api/session/{session_id}", json={"preferences": new_prefs})
    assert res.status_code == 200
    assert res.json()["preferences"] == new_prefs
    print(f"✅ PASSED — updated prefs for {session_id[:8]}...")


def test_update_session_shortlisted(client):
    print("\n🧪 TEST: Update session shortlisted_car_ids ...", end=" ")
    create_res = client.post("/api/session", json={})
    session_id = create_res.json()["id"]

    res = client.patch(
        f"/api/session/{session_id}",
        json={"shortlisted_car_ids": [1, 3, 5]},
    )
    assert res.status_code == 200
    assert res.json()["shortlisted_car_ids"] == [1, 3, 5]
    print(f"✅ PASSED — shortlisted [1, 3, 5] for {session_id[:8]}...")


def test_update_session_not_found(client):
    print("\n🧪 TEST: Update non-existent session (expect 404) ...", end=" ")
    res = client.patch("/api/session/nonexistent-id", json={"preferences": {}})
    assert res.status_code == 404
    print("✅ PASSED — got 404 as expected")


# ── 7. Chat Endpoint (Real Gemini Call) ───────────────────────────────

def test_chat_endpoint_real_gemini(client):
    """
    Makes a REAL call to Gemini 2.5 Pro.
    Requires a valid GEMINI_API_KEY in .env.
    """
    print("\n🧪 TEST: Chat endpoint (REAL Gemini 2.5 Pro call) ...", end=" ")

    create_res = client.post(
        "/api/session",
        json={"preferences": {"budget": 20, "body_type": "SUV", "fuel_type": "Petrol"}},
    )
    session_id = create_res.json()["id"]

    res = client.post(
        "/api/chat",
        json={
            "session_id": session_id,
            "message": "I want a safe SUV under 20 lakhs with good mileage",
        },
    )

    assert res.status_code == 200
    data = res.json()

    assert "shortlisted_car_ids" in data
    assert isinstance(data["shortlisted_car_ids"], list)
    assert len(data["shortlisted_car_ids"]) == 3
    assert all(isinstance(cid, int) for cid in data["shortlisted_car_ids"])

    assert "reasoning" in data
    assert len(data["reasoning"]) > 0

    print(f"✅ PASSED — Gemini picked car IDs: {data['shortlisted_car_ids']}")
    print(f"   💬 Reasoning: {data['reasoning'][:120]}...")


def test_chat_session_not_found(client):
    print("\n🧪 TEST: Chat with non-existent session (expect 404) ...", end=" ")
    res = client.post(
        "/api/chat",
        json={"session_id": "fake-session-id", "message": "hello"},
    )
    assert res.status_code == 404
    print("✅ PASSED — got 404 as expected")


# ── 8. Shortlist Endpoint ────────────────────────────────────────────

def test_get_shortlisted_cars(client):
    print("\n🧪 TEST: GET /api/cars/shortlist?ids=1,3 ...", end=" ")
    res = client.get("/api/cars/shortlist", params={"ids": "1,3"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    models = {car["model"] for car in data}
    assert models == {"Swift", "City"}
    print(f"✅ PASSED — returned {sorted(models)}")


def test_get_shortlisted_cars_invalid_ids(client):
    print("\n🧪 TEST: Shortlist with invalid ids (expect 400) ...", end=" ")
    res = client.get("/api/cars/shortlist", params={"ids": "a,b,c"})
    assert res.status_code == 400
    print("✅ PASSED — got 400 as expected")
