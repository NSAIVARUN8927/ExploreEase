from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Float, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")

class SavedPlace(Base):
    __tablename__ = "saved_places"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    place_name = Column(String(255), nullable=False)
    city = Column(String(120), nullable=False)
    category = Column(String(100), nullable=True)
    latitude = Column(String(40), nullable=True)
    longitude = Column(String(40), nullable=True)
    osm_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="saved_places")
    __table_args__ = (UniqueConstraint("user_id", "osm_id", name="uq_user_saved_osm"),)


class SavedTrip(Base):
    __tablename__ = "saved_trips"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    city = Column(String(120), nullable=False)
    days = Column(Integer, nullable=False)
    budget = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    itinerary = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", backref="saved_trips")
