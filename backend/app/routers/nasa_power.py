"""
NASA POWER API endpoints for soil, temperature, and rainfall data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.schemas import (
    NASAPowerData, NASAPowerRequest, NASAPowerResponse,
    SoilAnalysisResponse, NASAPowerForecastRequest, NASAPowerForecastResponse
)
from app.services.nasa_power_service import NASAPowerService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize NASA POWER service
nasa_power_service = NASAPowerService()


@router.get("/data", response_model=NASAPowerResponse)
async def get_nasa_power_data(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    start_date: Optional[datetime] = Query(None, description="Start date for data"),
    end_date: Optional[datetime] = Query(None, description="End date for data"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to look back if dates not specified")
):
    """
    Get NASA POWER data for soil, temperature, and rainfall
    
    This endpoint fetches data from NASA's Prediction Of Worldwide Energy Resources (POWER) API
    including:
    - Temperature at 2 meters (T2M)
    - Precipitation corrected (PRECTOTCORR) 
    - Surface soil wetness (GWETTOP)
    """
    try:
        # Set default dates if not provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=days_back)
        
        # Fetch data from NASA POWER service
        power_data = await nasa_power_service.get_daily_data(
            latitude, longitude, start_date, end_date
        )
        
        # Convert to response format
        nasa_data = [
            NASAPowerData(
                timestamp=data.timestamp,
                temperature_2m=data.temperature_2m,
                precipitation=data.precipitation,
                soil_wetness=data.soil_wetness,
                latitude=data.latitude,
                longitude=data.longitude
            )
            for data in power_data
        ]
        
        return NASAPowerResponse(
            location={"latitude": latitude, "longitude": longitude},
            data=nasa_data,
            total_records=len(nasa_data),
            date_range={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error fetching NASA POWER data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching NASA POWER data: {str(e)}")


@router.get("/current", response_model=NASAPowerData)
async def get_current_nasa_power_data(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude")
):
    """
    Get current day NASA POWER data
    
    Returns the most recent available data for the specified location.
    """
    try:
        current_data = await nasa_power_service.get_current_data(latitude, longitude)
        
        if not current_data:
            raise HTTPException(status_code=404, detail="No current data available for this location")
        
        return NASAPowerData(
            timestamp=current_data.timestamp,
            temperature_2m=current_data.temperature_2m,
            precipitation=current_data.precipitation,
            soil_wetness=current_data.soil_wetness,
            latitude=current_data.latitude,
            longitude=current_data.longitude
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current NASA POWER data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching current data: {str(e)}")


@router.get("/historical", response_model=NASAPowerResponse)
async def get_historical_nasa_power_data(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to look back")
):
    """
    Get historical NASA POWER data
    
    Returns historical data for the specified number of days back from today.
    """
    try:
        historical_data = await nasa_power_service.get_historical_data(
            latitude, longitude, days_back
        )
        
        # Convert to response format
        nasa_data = [
            NASAPowerData(
                timestamp=data.timestamp,
                temperature_2m=data.temperature_2m,
                precipitation=data.precipitation,
                soil_wetness=data.soil_wetness,
                latitude=data.latitude,
                longitude=data.longitude
            )
            for data in historical_data
        ]
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        return NASAPowerResponse(
            location={"latitude": latitude, "longitude": longitude},
            data=nasa_data,
            total_records=len(nasa_data),
            date_range={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error fetching historical NASA POWER data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")


@router.get("/forecast", response_model=NASAPowerForecastResponse)
async def get_nasa_power_forecast(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_ahead: int = Query(7, ge=1, le=30, description="Number of days to forecast")
):
    """
    Get NASA POWER forecast data
    
    Note: NASA POWER API provides historical data only. This endpoint returns
    mock forecast data for demonstration purposes.
    """
    try:
        forecast_data = await nasa_power_service.get_forecast_data(
            latitude, longitude, days_ahead
        )
        
        # Convert to response format
        nasa_data = [
            NASAPowerData(
                timestamp=data.timestamp,
                temperature_2m=data.temperature_2m,
                precipitation=data.precipitation,
                soil_wetness=data.soil_wetness,
                latitude=data.latitude,
                longitude=data.longitude
            )
            for data in forecast_data
        ]
        
        return NASAPowerForecastResponse(
            location={"latitude": latitude, "longitude": longitude},
            forecast_data=nasa_data,
            forecast_days=days_ahead,
            note="NASA POWER API provides historical data only. This forecast uses mock data for demonstration.",
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error fetching NASA POWER forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching forecast: {str(e)}")


@router.get("/soil-analysis", response_model=SoilAnalysisResponse)
async def get_soil_analysis(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get comprehensive soil analysis based on NASA POWER data
    
    This endpoint analyzes soil wetness, precipitation, and temperature data
    to provide insights on:
    - Soil health assessment
    - Groundwater recharge potential
    - Drought risk assessment
    - Soil management recommendations
    """
    try:
        soil_analysis = await nasa_power_service.get_soil_analysis(
            latitude, longitude, days_back
        )
        
        return SoilAnalysisResponse(**soil_analysis)
        
    except Exception as e:
        logger.error(f"Error performing soil analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error performing soil analysis: {str(e)}")


@router.get("/temperature/summary")
async def get_temperature_summary(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get temperature summary from NASA POWER data
    """
    try:
        historical_data = await nasa_power_service.get_historical_data(
            latitude, longitude, days_back
        )
        
        if not historical_data:
            raise HTTPException(status_code=404, detail="No temperature data available")
        
        temperatures = [data.temperature_2m for data in historical_data]
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "analysis_period_days": days_back,
            "temperature_summary": {
                "average_temperature_c": round(sum(temperatures) / len(temperatures), 1),
                "max_temperature_c": round(max(temperatures), 1),
                "min_temperature_c": round(min(temperatures), 1),
                "temperature_range_c": round(max(temperatures) - min(temperatures), 1),
                "temperature_variability": round(max(temperatures) - min(temperatures), 1)
            },
            "temperature_trends": {
                "hot_days": sum(1 for temp in temperatures if temp > 30),
                "cold_days": sum(1 for temp in temperatures if temp < 15),
                "comfortable_days": sum(1 for temp in temperatures if 15 <= temp <= 30)
            },
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting temperature summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting temperature summary: {str(e)}")


@router.get("/precipitation/summary")
async def get_precipitation_summary(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get precipitation summary from NASA POWER data
    """
    try:
        historical_data = await nasa_power_service.get_historical_data(
            latitude, longitude, days_back
        )
        
        if not historical_data:
            raise HTTPException(status_code=404, detail="No precipitation data available")
        
        precipitations = [data.precipitation for data in historical_data]
        rainy_days = [data for data in historical_data if data.precipitation > 0]
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "analysis_period_days": days_back,
            "precipitation_summary": {
                "total_precipitation_mm": round(sum(precipitations), 2),
                "average_daily_precipitation_mm": round(sum(precipitations) / len(precipitations), 2),
                "max_daily_precipitation_mm": round(max(precipitations), 2),
                "rainy_days": len(rainy_days),
                "precipitation_frequency_percent": round(len(rainy_days) / len(precipitations) * 100, 1)
            },
            "precipitation_patterns": {
                "light_rain_days": sum(1 for p in precipitations if 0 < p <= 5),
                "moderate_rain_days": sum(1 for p in precipitations if 5 < p <= 15),
                "heavy_rain_days": sum(1 for p in precipitations if p > 15),
                "dry_days": sum(1 for p in precipitations if p == 0)
            },
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting precipitation summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting precipitation summary: {str(e)}")


@router.get("/soil-wetness/summary")
async def get_soil_wetness_summary(
    latitude: float = Query(..., ge=-90, le=90, description="Location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Location longitude"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get soil wetness summary from NASA POWER data
    """
    try:
        historical_data = await nasa_power_service.get_historical_data(
            latitude, longitude, days_back
        )
        
        if not historical_data:
            raise HTTPException(status_code=404, detail="No soil wetness data available")
        
        soil_wetness_values = [data.soil_wetness for data in historical_data]
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "analysis_period_days": days_back,
            "soil_wetness_summary": {
                "average_soil_wetness": round(sum(soil_wetness_values) / len(soil_wetness_values), 3),
                "max_soil_wetness": round(max(soil_wetness_values), 3),
                "min_soil_wetness": round(min(soil_wetness_values), 3),
                "soil_wetness_variability": round(max(soil_wetness_values) - min(soil_wetness_values), 3)
            },
            "soil_conditions": {
                "dry_days": sum(1 for sw in soil_wetness_values if sw < 0.3),
                "optimal_days": sum(1 for sw in soil_wetness_values if 0.3 <= sw <= 0.7),
                "saturated_days": sum(1 for sw in soil_wetness_values if sw > 0.7)
            },
            "soil_health_assessment": {
                "overall_condition": "good" if 0.3 <= sum(soil_wetness_values) / len(soil_wetness_values) <= 0.7 else "needs_attention",
                "drought_risk": "low" if sum(soil_wetness_values) / len(soil_wetness_values) > 0.4 else "moderate" if sum(soil_wetness_values) / len(soil_wetness_values) > 0.2 else "high"
            },
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting soil wetness summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting soil wetness summary: {str(e)}")


@router.get("/api-status")
async def get_nasa_power_api_status():
    """
    Get NASA POWER API status and information
    """
    try:
        return {
            "api_name": "NASA POWER API",
            "description": "NASA's Prediction Of Worldwide Energy Resources API",
            "base_url": "https://power.larc.nasa.gov/api/temporal/daily/point",
            "status": "active",
            "available_parameters": {
                "T2M": "Temperature at 2 meters (Celsius)",
                "PRECTOTCORR": "Precipitation corrected (mm/day)",
                "GWETTOP": "Surface soil wetness (0-1)"
            },
            "data_availability": {
                "historical_data": "Available",
                "forecast_data": "Not available (uses mock data)",
                "real_time_data": "Available with 1-2 day delay"
            },
            "rate_limits": "No official rate limits documented",
            "documentation_url": "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting NASA POWER API status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting API status: {str(e)}")
