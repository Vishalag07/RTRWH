"""
Soil type data API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.db import get_db
from app.models import SoilType
from app.schemas import (
    SoilTypeOut, SoilTypeCreate, SoilTypeResponse, LocationRequest
)
from app.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.get("/", response_model=List[SoilTypeOut])
async def get_all_soil_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all soil type data with pagination
    """
    try:
        soil_data = db.query(SoilType).offset(skip).limit(limit).all()
        return soil_data
    except Exception as e:
        logger.error(f"Error fetching soil type data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching soil type data")


@router.get("/location", response_model=SoilTypeResponse)
async def get_soil_data_by_location(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get soil type data for a specific location
    """
    try:
        # For now, we'll return mock data since we don't have real spatial queries set up
        # In a real implementation, you would use PostGIS spatial queries or external APIs
        
        # Generate mock soil data based on location
        mock_soil = _get_mock_soil_data(latitude, longitude)
        
        return SoilTypeResponse(
            location={
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km
            },
            soil_data=mock_soil,
            nearest_soil=mock_soil,
            distance_km=0.0
        )
        
    except Exception as e:
        logger.error(f"Error fetching soil data for location: {e}")
        raise HTTPException(status_code=500, detail="Error fetching soil data")


@router.post("/", response_model=SoilTypeOut)
async def create_soil_data(
    soil_data: SoilTypeCreate,
    db: Session = Depends(get_db)
):
    """
    Create new soil type data entry
    """
    try:
        db_soil = SoilType(
            soil_type=soil_data.soil_type,
            permeability=soil_data.permeability,
            infiltration_rate=soil_data.infiltration_rate,
            water_holding_capacity=soil_data.water_holding_capacity,
            geom=str(soil_data.geom)  # Convert to string for storage
        )
        
        db.add(db_soil)
        db.commit()
        db.refresh(db_soil)
        
        return db_soil
        
    except Exception as e:
        logger.error(f"Error creating soil data: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating soil data")


@router.get("/{soil_id}", response_model=SoilTypeOut)
async def get_soil_data_by_id(
    soil_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific soil type data by ID
    """
    try:
        soil_data = db.query(SoilType).filter(SoilType.id == soil_id).first()
        
        if not soil_data:
            raise HTTPException(status_code=404, detail="Soil data not found")
        
        return soil_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching soil data by ID: {e}")
        raise HTTPException(status_code=500, detail="Error fetching soil data")


@router.get("/type/{soil_type}", response_model=List[SoilTypeOut])
async def get_soil_data_by_type(
    soil_type: str,
    db: Session = Depends(get_db)
):
    """
    Get soil data by type (clay, sand, loam, etc.)
    """
    try:
        soil_data = db.query(SoilType).filter(
            SoilType.soil_type.ilike(f"%{soil_type}%")
        ).all()
        
        return soil_data
        
    except Exception as e:
        logger.error(f"Error fetching soil data by type: {e}")
        raise HTTPException(status_code=500, detail="Error fetching soil data")


@router.get("/infiltration/rate")
async def get_infiltration_rates():
    """
    Get typical infiltration rates for different soil types
    """
    try:
        infiltration_rates = {
            "sand": {"min": 20.0, "max": 50.0, "typical": 35.0},
            "sandy_loam": {"min": 10.0, "max": 25.0, "typical": 17.5},
            "loam": {"min": 5.0, "max": 15.0, "typical": 10.0},
            "silt_loam": {"min": 2.5, "max": 8.0, "typical": 5.25},
            "clay_loam": {"min": 1.0, "max": 4.0, "typical": 2.5},
            "clay": {"min": 0.1, "max": 1.0, "typical": 0.55},
            "silty_clay": {"min": 0.05, "max": 0.5, "typical": 0.275},
            "sandy_clay": {"min": 0.1, "max": 2.0, "typical": 1.05}
        }
        
        return {
            "infiltration_rates_mm_per_hour": infiltration_rates,
            "description": "Typical infiltration rates for different soil types",
            "source": "USDA Soil Survey Manual"
        }
        
    except Exception as e:
        logger.error(f"Error fetching infiltration rates: {e}")
        raise HTTPException(status_code=500, detail="Error fetching infiltration rates")


@router.get("/permeability/rates")
async def get_permeability_rates():
    """
    Get typical permeability rates for different soil types
    """
    try:
        permeability_rates = {
            "sand": {"min": 10.0, "max": 100.0, "typical": 55.0},
            "sandy_loam": {"min": 5.0, "max": 20.0, "typical": 12.5},
            "loam": {"min": 1.0, "max": 10.0, "typical": 5.5},
            "silt_loam": {"min": 0.5, "max": 5.0, "typical": 2.75},
            "clay_loam": {"min": 0.1, "max": 2.0, "typical": 1.05},
            "clay": {"min": 0.01, "max": 0.5, "typical": 0.255},
            "silty_clay": {"min": 0.005, "max": 0.1, "typical": 0.0525},
            "sandy_clay": {"min": 0.01, "max": 1.0, "typical": 0.505}
        }
        
        return {
            "permeability_rates_cm_per_hour": permeability_rates,
            "description": "Typical permeability rates for different soil types",
            "source": "USDA Soil Survey Manual"
        }
        
    except Exception as e:
        logger.error(f"Error fetching permeability rates: {e}")
        raise HTTPException(status_code=500, detail="Error fetching permeability rates")


@router.get("/water-holding/capacity")
async def get_water_holding_capacity():
    """
    Get typical water holding capacity for different soil types
    """
    try:
        water_holding_capacity = {
            "sand": {"min": 50.0, "max": 100.0, "typical": 75.0},
            "sandy_loam": {"min": 100.0, "max": 150.0, "typical": 125.0},
            "loam": {"min": 150.0, "max": 200.0, "typical": 175.0},
            "silt_loam": {"min": 200.0, "max": 250.0, "typical": 225.0},
            "clay_loam": {"min": 200.0, "max": 300.0, "typical": 250.0},
            "clay": {"min": 250.0, "max": 400.0, "typical": 325.0},
            "silty_clay": {"min": 300.0, "max": 450.0, "typical": 375.0},
            "sandy_clay": {"min": 200.0, "max": 350.0, "typical": 275.0}
        }
        
        return {
            "water_holding_capacity_mm": water_holding_capacity,
            "description": "Typical water holding capacity for different soil types",
            "source": "USDA Soil Survey Manual"
        }
        
    except Exception as e:
        logger.error(f"Error fetching water holding capacity: {e}")
        raise HTTPException(status_code=500, detail="Error fetching water holding capacity")


def _get_mock_soil_data(latitude: float, longitude: float) -> SoilTypeOut:
    """
    Generate mock soil data based on location
    """
    # Simple mock data generation based on coordinates
    soil_types = [
        "sand", "sandy_loam", "loam", "silt_loam", 
        "clay_loam", "clay", "silty_clay", "sandy_clay"
    ]
    soil_type = soil_types[int(abs(latitude + longitude)) % len(soil_types)]
    
    # Mock properties based on soil type
    soil_properties = {
        "sand": {"permeability": 55.0, "infiltration": 35.0, "water_capacity": 75.0},
        "sandy_loam": {"permeability": 12.5, "infiltration": 17.5, "water_capacity": 125.0},
        "loam": {"permeability": 5.5, "infiltration": 10.0, "water_capacity": 175.0},
        "silt_loam": {"permeability": 2.75, "infiltration": 5.25, "water_capacity": 225.0},
        "clay_loam": {"permeability": 1.05, "infiltration": 2.5, "water_capacity": 250.0},
        "clay": {"permeability": 0.255, "infiltration": 0.55, "water_capacity": 325.0},
        "silty_clay": {"permeability": 0.0525, "infiltration": 0.275, "water_capacity": 375.0},
        "sandy_clay": {"permeability": 0.505, "infiltration": 1.05, "water_capacity": 275.0}
    }
    
    props = soil_properties.get(soil_type, soil_properties["loam"])
    
    return SoilTypeOut(
        id=1,
        soil_type=soil_type,
        permeability=props["permeability"],
        infiltration_rate=props["infiltration"],
        water_holding_capacity=props["water_capacity"],
        geom={
            "type": "MultiPolygon",
            "coordinates": [[[[longitude, latitude], [longitude + 0.01, latitude], 
                            [longitude + 0.01, latitude + 0.01], [longitude, latitude + 0.01], 
                            [longitude, latitude]]]]
        }
    )
