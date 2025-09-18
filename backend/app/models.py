
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from geoalchemy2 import Geometry
from app.db import Base

# --- Gamification Models ---
class Score(Base):
    __tablename__ = "scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))

class UserBadge(Base):
    __tablename__ = "user_badges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id: Mapped[int] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    group: Mapped[str] = mapped_column(String(100), default="community")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="user")


class RainfallRecord(Base):
    __tablename__ = "rainfall_records"
    __table_args__ = (UniqueConstraint("source", "year", "month", "cell_id", name="uq_rainfall_source_cell_month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(100), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    rainfall_mm: Mapped[float] = mapped_column(Float)
    cell_id: Mapped[str] = mapped_column(String(64), index=True)
    centroid: Mapped[str] = mapped_column(Geometry(geometry_type="POINT", srid=4326))


class AquiferData(Base):
    __tablename__ = "aquifer_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    aquifer_type: Mapped[str] = mapped_column(String(100), index=True)
    gw_depth_m: Mapped[float] = mapped_column(Float)  # Groundwater depth
    transmissivity_m2_per_day: Mapped[float] = mapped_column(Float)
    storativity: Mapped[float] = mapped_column(Float)
    geom: Mapped[str] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326))


class GWDepthPoint(Base):
    __tablename__ = "gw_depth_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    depth_m: Mapped[float] = mapped_column(Float)
    obs_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    geom: Mapped[str] = mapped_column(Geometry(geometry_type="POINT", srid=4326))


class SoilType(Base):
    __tablename__ = "soil_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    soil_type: Mapped[str] = mapped_column(String(100), index=True)
    permeability: Mapped[float] = mapped_column(Float)  # cm/hour
    infiltration_rate: Mapped[float] = mapped_column(Float)  # mm/hour
    water_holding_capacity: Mapped[float] = mapped_column(Float)  # mm
    geom: Mapped[str] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326))


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Input fields
    user_name: Mapped[str] = mapped_column(String(255))
    location_desc: Mapped[str] = mapped_column(String(512))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    num_dwellers: Mapped[int] = mapped_column(Integer)
    rooftop_area_m2: Mapped[float] = mapped_column(Float)
    open_space_area_m2: Mapped[float] = mapped_column(Float)

    # Results snapshot JSON for reproducibility
    results: Mapped[dict] = mapped_column(JSON)

    user: Mapped[User | None] = relationship("User", back_populates="assessments")


