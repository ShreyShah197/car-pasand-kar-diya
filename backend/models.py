from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from database import Base, engine
from datetime import datetime


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String)
    model = Column(String)
    variant = Column(String)
    price_lakh = Column(Float)
    fuel_type = Column(String)
    transmission = Column(String)
    seating = Column(Integer)
    mileage = Column(Float)
    safety_rating = Column(Float)
    body_type = Column(String)
    pros = Column(String)
    cons = Column(String)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    preferences = Column(JSON)
    shortlisted_car_ids = Column(JSON)


Base.metadata.create_all(bind=engine)
