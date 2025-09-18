
from fastapi import HTTPException, Query
from app.schemas import ScoreOut, BadgeOut, UserBadgeOut, LeaderboardEntryOut
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()

# In-memory mock stores for MVP
user_points = {}
user_badges = {}
leaderboard = []
badges = [
    {"id": 1, "name": "Water Saver", "description": "1 lakh L harvested"},
    {"id": 2, "name": "Recharge Hero", "description": "5 recharge pits implemented"},
    {"id": 3, "name": "Community Leader", "description": "Top 1% on leaderboard"},
]

@router.post("/gamification/award-points", response_model=ScoreOut)
async def award_points(user_id: int, points: int):
    now = datetime.utcnow()
    user_points[user_id] = user_points.get(user_id, 0) + points
    # Update leaderboard
    found = False
    for entry in leaderboard:
        if entry["user_id"] == user_id:
            entry["points"] = user_points[user_id]
            entry["updated_at"] = now
            found = True
            break
    if not found:
        leaderboard.append({"user_id": user_id, "points": user_points[user_id], "group": "community", "updated_at": now})
    return ScoreOut(user_id=user_id, points=user_points[user_id], updated_at=now)

@router.post("/gamification/award-badge", response_model=UserBadgeOut)
async def award_badge(user_id: int, badge_id: int):
    now = datetime.utcnow()
    badge = next((b for b in badges if b["id"] == badge_id), None)
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    user_badges.setdefault(user_id, []).append({"badge": badge, "awarded_at": now})
    return UserBadgeOut(badge=BadgeOut(**badge), awarded_at=now)

@router.get("/user-points", response_model=ScoreOut)
async def get_user_points(user_id: int = Query(..., description="User ID")):
    points = user_points.get(user_id, 0)
    return ScoreOut(user_id=user_id, points=points, updated_at=datetime.utcnow())

@router.get("/user-badges", response_model=list[UserBadgeOut])
async def get_user_badges(user_id: int = Query(..., description="User ID")):
    return [UserBadgeOut(badge=BadgeOut(**b["badge"]), awarded_at=b["awarded_at"]) for b in user_badges.get(user_id, [])]

@router.get("/leaderboard", response_model=list[LeaderboardEntryOut])
async def get_leaderboard(limit: int = Query(10, description="Number of top users")):
    # Return top N by points
    sorted_entries = sorted(leaderboard, key=lambda x: x["points"], reverse=True)[:limit]
    return [LeaderboardEntryOut(**entry) for entry in sorted_entries]
from fastapi import Body
# --- Recharge Structure Recommendation Endpoint ---
from pydantic import BaseModel

class StructureRecommendationRequest(BaseModel):
    roof_area_m2: float
    annual_rainfall_mm: float
    soil_type: str
    aquifer_depth_m: float

class StructureRecommendationResponse(BaseModel):
    recommendation: str
    suggested_dimensions: dict
    estimated_cost: float
    potential_recharge_liters_per_year: float


@router.post("/recommend-structure", response_model=StructureRecommendationResponse, tags=["groundwater"])
async def recommend_structure(
    req: StructureRecommendationRequest = Body(...)
):
    """
    Recommend recharge structure type and dimensions based on user input (MVP logic)
    """
    # Simple logic for MVP
    roof_area = req.roof_area_m2
    rainfall = req.annual_rainfall_mm
    soil = req.soil_type.lower()
    depth = req.aquifer_depth_m

    # Calculate potential recharge (runoff coefficient simplified)
    runoff_coeff = 0.8 if soil in ["sandy", "loamy"] else 0.6
    annual_recharge = roof_area * rainfall * runoff_coeff / 1000  # liters/year

    # Structure selection logic
    if depth > 20:
        rec = "Recharge Shaft"
        dims = {"diameter_m": 1.5, "depth_m": min(depth, 20)}
        cost = 45000
    elif 5 < depth <= 20:
        rec = "Recharge Pit"
        dims = {"length_m": 2, "width_m": 2, "depth_m": min(depth, 5)}
        cost = 25000
    else:
        rec = "Recharge Trench"
        dims = {"length_m": 5, "width_m": 1, "depth_m": min(depth, 2)}
        cost = 15000

    return StructureRecommendationResponse(
        recommendation=rec,
        suggested_dimensions=dims,
        estimated_cost=cost,
        potential_recharge_liters_per_year=round(annual_recharge, 2)
    )
"""
Groundwater depth level API endpoints
"""


from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
import logging

from app.db import get_db
from app.models import GWDepthPoint
from app.schemas import (
    GWDepthPointOut, GWDepthPointCreate, GWDepthResponse, LocationRequest
)
from app.settings import get_settings
@router.get("/groundwater", tags=["groundwater"])
async def get_groundwater_info(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Fetch groundwater and aquifer info for a given lat/lon (mocked for MVP)
    """
    # Mock dataset keyed by (lat, lon)
    mock_data = {
        (12.9716, 77.5946): {
            "location": "Bengaluru Urban",
            "groundwater_level_m": 12.5,
            "aquifer_type": "Unconfined Aquifer",
            "borewells_connected": 154,
            "last_updated": "2025-09-01"
        },
        (28.6139, 77.2090): {
            "location": "New Delhi",
            "groundwater_level_m": 22.1,
            "aquifer_type": "Confined Aquifer",
            "borewells_connected": 320,
            "last_updated": "2025-08-20"
        },
    }
    key = (round(lat, 4), round(lon, 4))
    data = mock_data.get(key)
    if not data:
        data = {
            "location": "Unknown",
            "groundwater_level_m": 18.2,
            "aquifer_type": "Confined Aquifer",
            "borewells_connected": 75,
            "last_updated": str(date.today())
        }
    return data



logger = logging.getLogger(__name__)
settings = get_settings()

# --- New endpoint for groundwater & aquifer info (mock) ---
@router.get("/groundwater", tags=["groundwater"])
async def get_groundwater_info(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Fetch groundwater and aquifer info for a given lat/lon (mocked for MVP)
    """
    # Mock dataset keyed by (lat, lon)
    mock_data = {
        (12.9716, 77.5946): {
            "location": "Bengaluru Urban",
            "groundwater_level_m": 12.5,
            "aquifer_type": "Unconfined Aquifer",
            "borewells_connected": 154,
            "last_updated": "2025-09-01"
        },
        (28.6139, 77.2090): {
            "location": "New Delhi",
            "groundwater_level_m": 22.1,
            "aquifer_type": "Confined Aquifer",
            "borewells_connected": 320,
            "last_updated": "2025-08-20"
        },
    }
    key = (round(lat, 4), round(lon, 4))
    data = mock_data.get(key)
    if not data:
        data = {
            "location": "Unknown",
            "groundwater_level_m": 18.2,
            "aquifer_type": "Confined Aquifer",
            "borewells_connected": 75,
            "last_updated": str(date.today())
        }
    return data


@router.get("/", response_model=List[GWDepthPointOut])
async def get_all_gw_depth_points(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all groundwater depth points with pagination
    """
    try:
        gw_points = db.query(GWDepthPoint).offset(skip).limit(limit).all()
        return gw_points
    except Exception as e:
        logger.error(f"Error fetching groundwater depth points: {e}")
        raise HTTPException(status_code=500, detail="Error fetching groundwater depth points")


@router.get("/location", response_model=GWDepthResponse)
async def get_gw_depth_by_location(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get groundwater depth data for a specific location
    """
    try:
        # For now, we'll return mock data since we don't have real spatial queries set up
        # In a real implementation, you would use PostGIS spatial queries
        
        # Generate mock groundwater depth points
        mock_points = _generate_mock_gw_depth_points(latitude, longitude, radius_km)
        
        # Calculate average and latest depth
        depths = [point.depth_m for point in mock_points]
        average_depth = sum(depths) / len(depths) if depths else None
        latest_depth = max(mock_points, key=lambda x: x.obs_date).depth_m if mock_points else None
        
        return GWDepthResponse(
            location={
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km
            },
            gw_depth_points=mock_points,
            average_depth_m=round(average_depth, 2) if average_depth else None,
            latest_depth_m=round(latest_depth, 2) if latest_depth else None
        )
        
    except Exception as e:
        logger.error(f"Error fetching groundwater depth for location: {e}")
        raise HTTPException(status_code=500, detail="Error fetching groundwater depth data")


@router.post("/", response_model=GWDepthPointOut)
async def create_gw_depth_point(
    gw_point: GWDepthPointCreate,
    db: Session = Depends(get_db)
):
    """
    Create new groundwater depth measurement
    """
    try:
        db_gw_point = GWDepthPoint(
            depth_m=gw_point.depth_m,
            obs_date=gw_point.obs_date or datetime.utcnow(),
            geom=str(gw_point.geom)  # Convert to string for storage
        )
        
        db.add(db_gw_point)
        db.commit()
        db.refresh(db_gw_point)
        
        return db_gw_point
        
    except Exception as e:
        logger.error(f"Error creating groundwater depth point: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating groundwater depth point")


@router.get("/{point_id}", response_model=GWDepthPointOut)
async def get_gw_depth_point_by_id(
    point_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific groundwater depth point by ID
    """
    try:
        gw_point = db.query(GWDepthPoint).filter(GWDepthPoint.id == point_id).first()
        
        if not gw_point:
            raise HTTPException(status_code=404, detail="Groundwater depth point not found")
        
        return gw_point
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching groundwater depth point by ID: {e}")
        raise HTTPException(status_code=500, detail="Error fetching groundwater depth point")


@router.get("/recent/{days}", response_model=List[GWDepthPointOut])
async def get_recent_gw_depth_points(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get recent groundwater depth measurements
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        gw_points = db.query(GWDepthPoint).filter(
            GWDepthPoint.obs_date >= cutoff_date
        ).order_by(GWDepthPoint.obs_date.desc()).all()
        
        return gw_points
        
    except Exception as e:
        logger.error(f"Error fetching recent groundwater depth points: {e}")
        raise HTTPException(status_code=500, detail="Error fetching recent groundwater depth points")


@router.get("/trends/location")
async def get_gw_depth_trends(
    latitude: float,
    longitude: float,
    months: int = 12,
    db: Session = Depends(get_db)
):
    """
    Get groundwater depth trends for a location over time
    """
    try:
        # For now, return mock trend data
        # In a real implementation, you would query actual historical data
        
        mock_trends = _generate_mock_trend_data(latitude, longitude, months)
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "period_months": months,
            "trends": mock_trends,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error fetching groundwater depth trends: {e}")
        raise HTTPException(status_code=500, detail="Error fetching groundwater depth trends")


def _generate_mock_gw_depth_points(latitude: float, longitude: float, radius_km: float) -> List[GWDepthPointOut]:
    """
    Generate mock groundwater depth points for a location
    """
    import random
    
    points = []
    base_date = datetime.utcnow()
    
    # Generate 3-8 mock points within the radius
    num_points = random.randint(3, 8)
    
    for i in range(num_points):
        # Generate random offset within radius
        offset_lat = (random.random() - 0.5) * (radius_km / 111.0)  # Rough km to degrees
        offset_lon = (random.random() - 0.5) * (radius_km / (111.0 * abs(latitude)))
        
        point_lat = latitude + offset_lat
        point_lon = longitude + offset_lon
        
        # Generate depth based on location and time
        base_depth = 8.0 + (abs(latitude) * 0.3) + (abs(longitude) * 0.2)
        seasonal_variation = 2.0 * (i % 4)  # Simulate seasonal variation
        depth = base_depth + seasonal_variation + random.uniform(-1.0, 1.0)
        
        # Generate observation date (within last 2 years)
        days_ago = random.randint(0, 730)
        obs_date = base_date - timedelta(days=days_ago)
        
        points.append(GWDepthPointOut(
            id=i + 1,
            depth_m=round(depth, 2),
            obs_date=obs_date,
            geom={
                "type": "Point",
                "coordinates": [point_lon, point_lat]
            }
        ))
    
    return points


def _generate_mock_trend_data(latitude: float, longitude: float, months: int) -> List[dict]:
    """
    Generate mock trend data for groundwater depth over time
    """
    import random
    
    trends = []
    base_date = datetime.utcnow()
    base_depth = 10.0 + (abs(latitude) * 0.2)
    
    for i in range(months):
        month_date = base_date - timedelta(days=i * 30)
        
        # Simulate seasonal variation and long-term trend
        seasonal_factor = 2.0 * (i % 12) / 12.0  # Seasonal cycle
        trend_factor = i * 0.1  # Slight long-term trend
        random_factor = random.uniform(-0.5, 0.5)
        
        depth = base_depth + seasonal_factor + trend_factor + random_factor
        
        trends.append({
            "month": month_date.strftime("%Y-%m"),
            "average_depth_m": round(depth, 2),
            "min_depth_m": round(depth - 1.0, 2),
            "max_depth_m": round(depth + 1.0, 2),
            "measurement_count": random.randint(5, 15)
        })
    
    return trends
