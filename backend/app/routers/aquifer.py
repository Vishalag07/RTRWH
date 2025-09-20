"""
Aquifer data API endpoints for groundwater and aquifer information
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import math

from app.db import get_db
from app.models import AquiferData
from app.schemas import (
    AquiferDataOut, AquiferDataCreate, AquiferDataResponse, LocationRequest
)
from app.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.get("/", response_model=List[AquiferDataOut])
async def get_all_aquifer_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all aquifer data with pagination
    """
    try:
        if db is None:
            # Return mock data when database is not available
            return [_get_mock_aquifer_data(28.6139, 77.2090)]  # Delhi coordinates
        
        aquifer_data = db.query(AquiferData).offset(skip).limit(limit).all()
        return aquifer_data
    except Exception as e:
        logger.error(f"Error fetching aquifer data: {e}")
        # Return mock data on error
        return [_get_mock_aquifer_data(28.6139, 77.2090)]


@router.get("/location", response_model=AquiferDataResponse)
async def get_aquifer_data_by_location(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get aquifer data for a specific location
    """
    try:
        # For now, we'll return mock data since we don't have real spatial queries set up
        # In a real implementation, you would use PostGIS spatial queries
        
        # Mock aquifer data based on location
        mock_aquifer = _get_mock_aquifer_data(latitude, longitude)
        
        return AquiferDataResponse(
            location={
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km
            },
            aquifer_data=mock_aquifer,
            nearest_aquifer=mock_aquifer,
            distance_km=0.0
        )
        
    except Exception as e:
        logger.error(f"Error fetching aquifer data for location: {e}")
        raise HTTPException(status_code=500, detail="Error fetching aquifer data")


@router.post("/", response_model=AquiferDataOut)
async def create_aquifer_data(
    aquifer_data: AquiferDataCreate,
    db: Session = Depends(get_db)
):
    """
    Create new aquifer data entry
    """
    try:
        if db is None:
            # Return mock data when database is not available
            return _get_mock_aquifer_data(28.6139, 77.2090)
        
        db_aquifer = AquiferData(
            aquifer_type=aquifer_data.aquifer_type,
            gw_depth_m=aquifer_data.gw_depth_m,
            transmissivity_m2_per_day=aquifer_data.transmissivity_m2_per_day,
            storativity=aquifer_data.storativity,
            geom=str(aquifer_data.geom)  # Convert to string for storage
        )
        
        db.add(db_aquifer)
        db.commit()
        db.refresh(db_aquifer)
        
        return db_aquifer
        
    except Exception as e:
        logger.error(f"Error creating aquifer data: {e}")
        if db:
            db.rollback()
        # Return mock data on error
        return _get_mock_aquifer_data(28.6139, 77.2090)


@router.get("/aquifer-depth")
async def get_aquifer_depth(
    lat: float,
    lon: float,
    db: Session = Depends(get_db)
):
    """
    Get aquifer depth for a specific location
    """
    try:
        # Generate mock aquifer depth based on location
        mock_aquifer = _get_mock_aquifer_data(lat, lon)
        
        return {
            "depth_m": mock_aquifer.gw_depth_m,
            "aquifer_type": mock_aquifer.aquifer_type,
            "location": {
                "latitude": lat,
                "longitude": lon
            },
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error fetching aquifer depth: {e}")
        raise HTTPException(status_code=500, detail="Error fetching aquifer depth")


@router.get("/info")
async def get_groundwater_info(
    lat: float,
    lon: float
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
            "last_updated": "2025-09-20"
        }
    return data


@router.get("/{aquifer_id}", response_model=AquiferDataOut)
async def get_aquifer_data_by_id(
    aquifer_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific aquifer data by ID
    """
    try:
        aquifer_data = db.query(AquiferData).filter(AquiferData.id == aquifer_id).first()
        
        if not aquifer_data:
            raise HTTPException(status_code=404, detail="Aquifer data not found")
        
        return aquifer_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching aquifer data by ID: {e}")
        raise HTTPException(status_code=500, detail="Error fetching aquifer data")


@router.get("/type/{aquifer_type}", response_model=List[AquiferDataOut])
async def get_aquifer_data_by_type(
    aquifer_type: str,
    db: Session = Depends(get_db)
):
    """
    Get aquifer data by type (confined, unconfined, etc.)
    """
    try:
        aquifer_data = db.query(AquiferData).filter(
            AquiferData.aquifer_type.ilike(f"%{aquifer_type}%")
        ).all()
        
        return aquifer_data
        
    except Exception as e:
        logger.error(f"Error fetching aquifer data by type: {e}")
        raise HTTPException(status_code=500, detail="Error fetching aquifer data")


def _get_mock_aquifer_data(latitude: float, longitude: float) -> AquiferDataOut:
    """
    Generate mock aquifer data based on location
    """
    # Simple mock data generation based on coordinates
    aquifer_types = ["confined", "unconfined", "semi-confined", "perched"]
    aquifer_type = aquifer_types[int(abs(latitude + longitude)) % len(aquifer_types)]
    
    # Mock depth based on location (deeper in some regions)
    base_depth = 10.0 + (abs(latitude) * 0.5) + (abs(longitude) * 0.3)
    depth_variation = (latitude + longitude) % 20.0
    
    return AquiferDataOut(
        id=1,
        aquifer_type=aquifer_type,
        gw_depth_m=round(base_depth + depth_variation, 2),
        transmissivity_m2_per_day=round(50.0 + (latitude % 100), 2),
        storativity=round(0.001 + (longitude % 0.01), 4),
        geom={
            "type": "MultiPolygon",
            "coordinates": [[[[longitude, latitude], [longitude + 0.01, latitude], 
                            [longitude + 0.01, latitude + 0.01], [longitude, latitude + 0.01], 
                            [longitude, latitude]]]]
        }
    )
