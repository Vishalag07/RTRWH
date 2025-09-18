"""
Enhanced Weather API endpoints with multiple data sources
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.db import get_db
from app.schemas import WeatherData, LocationRequest
from app.services.weather_service import WeatherService
from app.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

# Initialize weather service
weather_service = WeatherService()


@router.get("/current", response_model=WeatherData)
async def get_current_weather(
    latitude: float,
    longitude: float
):
    """
    Get current weather data for a location
    """
    try:
        weather_data = await weather_service.get_current_weather(latitude, longitude)
        if not weather_data:
            raise HTTPException(status_code=500, detail="Unable to fetch weather data")
        
        return weather_data
        
    except Exception as e:
        logger.error(f"Error getting current weather: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting weather: {str(e)}")


@router.get("/forecast")
async def get_weather_forecast(
    latitude: float,
    longitude: float,
    days: int = 7
):
    """
    Get weather forecast for a location
    """
    try:
        forecast_data = await weather_service.get_forecast(latitude, longitude, days)
        return {
            "forecast": forecast_data,
            "days": days,
            "location": {"latitude": latitude, "longitude": longitude},
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting forecast: {str(e)}")


@router.get("/historical")
async def get_historical_weather(
    latitude: float,
    longitude: float,
    days_back: int = 30
):
    """
    Get historical weather data for a location
    """
    try:
        historical_data = await weather_service.get_historical_weather(
            latitude, longitude, days_back
        )
        
        return {
            "historical_data": historical_data,
            "days_back": days_back,
            "location": {"latitude": latitude, "longitude": longitude},
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting historical weather: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting historical weather: {str(e)}")


@router.get("/alerts")
async def get_weather_alerts(
    latitude: float,
    longitude: float
):
    """
    Get weather alerts and warnings for a location
    """
    try:
        # Get current weather to determine if alerts are needed
        current_weather = await weather_service.get_current_weather(latitude, longitude)
        
        alerts = []
        
        if current_weather:
            # Generate alerts based on current conditions
            if current_weather.precipitation > 10.0:
                alerts.append({
                    "type": "heavy_rain",
                    "severity": "moderate",
                    "message": "Heavy rainfall detected. Consider rainwater harvesting opportunities.",
                    "timestamp": current_weather.timestamp
                })
            
            if current_weather.wind_speed > 15.0:
                alerts.append({
                    "type": "high_wind",
                    "severity": "low",
                    "message": "High wind conditions. Secure rainwater collection equipment.",
                    "timestamp": current_weather.timestamp
                })
            
            if current_weather.temperature > 35.0:
                alerts.append({
                    "type": "heat_wave",
                    "severity": "moderate",
                    "message": "High temperature detected. Increased water demand expected.",
                    "timestamp": current_weather.timestamp
                })
        
        return {
            "alerts": alerts,
            "alert_count": len(alerts),
            "location": {"latitude": latitude, "longitude": longitude},
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting weather alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting weather alerts: {str(e)}")


@router.get("/rainfall/summary")
async def get_rainfall_summary(
    latitude: float,
    longitude: float,
    days: int = 7
):
    """
    Get rainfall summary for a location
    """
    try:
        # Get forecast data
        forecast_data = await weather_service.get_forecast(latitude, longitude, days)
        
        # Calculate rainfall summary
        total_rainfall = sum(weather.precipitation for weather in forecast_data)
        rainy_days = sum(1 for weather in forecast_data if weather.precipitation > 0)
        max_daily_rainfall = max((weather.precipitation for weather in forecast_data), default=0)
        
        # Get historical data for comparison
        historical_data = await weather_service.get_historical_weather(latitude, longitude, days)
        historical_avg = sum(weather.precipitation for weather in historical_data) / len(historical_data) if historical_data else 0
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "period_days": days,
            "total_rainfall_mm": round(total_rainfall, 2),
            "rainy_days": rainy_days,
            "max_daily_rainfall_mm": round(max_daily_rainfall, 2),
            "average_daily_rainfall_mm": round(total_rainfall / days, 2),
            "historical_average_mm": round(historical_avg, 2),
            "rainfall_trend": "above_average" if total_rainfall > historical_avg * days else "below_average",
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting rainfall summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting rainfall summary: {str(e)}")


@router.get("/conditions/optimal")
async def get_optimal_harvesting_conditions(
    latitude: float,
    longitude: float
):
    """
    Get optimal rainwater harvesting conditions for a location
    """
    try:
        # Get current weather and forecast
        current_weather = await weather_service.get_current_weather(latitude, longitude)
        forecast_data = await weather_service.get_forecast(latitude, longitude, 3)
        
        if not current_weather:
            raise HTTPException(status_code=500, detail="Unable to fetch weather data")
        
        # Analyze conditions
        conditions = {
            "current_conditions": {
                "temperature": current_weather.temperature,
                "humidity": current_weather.humidity,
                "precipitation": current_weather.precipitation,
                "wind_speed": current_weather.wind_speed
            },
            "harvesting_recommendation": "optimal",
            "reasons": [],
            "forecast_conditions": []
        }
        
        # Check current conditions
        if current_weather.precipitation > 0:
            conditions["harvesting_recommendation"] = "excellent"
            conditions["reasons"].append("Currently raining - ideal for harvesting")
        elif current_weather.humidity > 80:
            conditions["harvesting_recommendation"] = "good"
            conditions["reasons"].append("High humidity - rain likely soon")
        elif current_weather.temperature < 5:
            conditions["harvesting_recommendation"] = "poor"
            conditions["reasons"].append("Low temperature - risk of freezing")
        else:
            conditions["harvesting_recommendation"] = "fair"
            conditions["reasons"].append("No immediate rain expected")
        
        # Check wind conditions
        if current_weather.wind_speed > 20:
            conditions["reasons"].append("High wind - secure collection equipment")
        
        # Analyze forecast
        for i, weather in enumerate(forecast_data[:3]):  # Next 3 days
            day_conditions = {
                "day": i + 1,
                "date": weather.timestamp.strftime("%Y-%m-%d"),
                "precipitation_mm": weather.precipitation,
                "recommendation": "harvest" if weather.precipitation > 2 else "prepare"
            }
            conditions["forecast_conditions"].append(day_conditions)
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "conditions": conditions,
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting optimal harvesting conditions: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting harvesting conditions: {str(e)}")


@router.get("/api-status")
async def get_weather_api_status():
    """
    Get status of weather API services
    """
    try:
        api_status = {
            "openweather_api": {
                "available": bool(settings.openweather_api_key),
                "status": "active" if settings.openweather_api_key else "inactive"
            },
            "weather_api": {
                "available": bool(settings.weather_api_key),
                "status": "active" if settings.weather_api_key else "inactive"
            },
            "accuweather_api": {
                "available": bool(settings.accuweather_api_key),
                "status": "active" if settings.accuweather_api_key else "inactive"
            }
        }
        
        active_apis = sum(1 for api in api_status.values() if api["available"])
        
        return {
            "api_status": api_status,
            "active_apis": active_apis,
            "total_apis": len(api_status),
            "fallback_mode": active_apis == 0,
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting weather API status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting API status: {str(e)}")


@router.get("/enhanced")
async def get_enhanced_weather_data(
    latitude: float,
    longitude: float
):
    """
    Get enhanced weather data combining OpenWeather and NASA POWER data
    """
    try:
        enhanced_data = await weather_service.get_enhanced_weather_data(latitude, longitude)
        return enhanced_data
        
    except Exception as e:
        logger.error(f"Error getting enhanced weather data: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting enhanced weather data: {str(e)}")


@router.get("/rainfall-harvest-analysis")
async def get_rainfall_harvest_analysis(
    latitude: float,
    longitude: float,
    roof_area_m2: float
):
    """
    Get rainfall analysis for rainwater harvesting using NASA POWER data
    """
    try:
        analysis = await weather_service.get_rainfall_harvest_analysis(
            latitude, longitude, roof_area_m2
        )
        return analysis
        
    except Exception as e:
        logger.error(f"Error getting rainfall harvest analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting rainfall analysis: {str(e)}")


@router.get("/soil-moisture-analysis")
async def get_soil_moisture_analysis(
    latitude: float,
    longitude: float
):
    """
    Get soil moisture analysis using NASA POWER data
    """
    try:
        analysis = await weather_service.get_soil_moisture_analysis(latitude, longitude)
        return analysis
        
    except Exception as e:
        logger.error(f"Error getting soil moisture analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting soil moisture analysis: {str(e)}")


@router.get("/nasa-power-data")
async def get_nasa_power_data(
    latitude: float,
    longitude: float,
    days_back: int = 30
):
    """
    Get NASA POWER data for soil, temperature, and rainfall
    """
    try:
        nasa_data = await weather_service.get_nasa_power_data(latitude, longitude, days_back)
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "data": nasa_data,
            "total_records": len(nasa_data),
            "days_back": days_back,
            "data_source": "NASA POWER API",
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting NASA POWER data: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting NASA POWER data: {str(e)}")