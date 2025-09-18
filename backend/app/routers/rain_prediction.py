"""
Rain prediction API endpoints for AI-powered rainfall forecasting and action alerts
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.schemas import (
    PredictionRequest, PredictionResponse, PostRainfallSummary,
    WeatherData, RainPrediction, HarvestCalculation, ActionAlert
)
from app.services.weather_service import WeatherService
from app.services.rain_prediction_service import RainPredictionService
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
weather_service = WeatherService()
rain_prediction_service = RainPredictionService()
alert_service = AlertService()


@router.post("/predict", response_model=PredictionResponse)
async def predict_rainfall(request: PredictionRequest):
    """
    Generate AI-powered rain prediction with action alerts
    """
    try:
        logger.info(f"Generating prediction for location: {request.latitude}, {request.longitude}")
        
        # Get current weather data
        current_weather = await weather_service.get_current_weather(
            request.latitude, request.longitude
        )
        
        if not current_weather:
            logger.warning("Unable to fetch weather data, using mock data")
            # Create mock weather data if service fails
            current_weather = WeatherData(
                timestamp=datetime.now(),
                temperature=25.0,
                humidity=65.0,
                pressure=1013.25,
                wind_speed=3.2,
                wind_direction=180.0,
                cloud_cover=40.0,
                precipitation=0.0,
                precipitation_probability=20.0
            )
        
        # Get rain predictions
        rain_predictions = await rain_prediction_service.predict_rainfall(
            request.latitude, request.longitude, request.forecast_days
        )
        
        # Calculate harvest potential
        harvest_calculation = _calculate_harvest_potential(
            request, rain_predictions
        )
        
        # Generate action alerts
        action_alerts = alert_service.generate_alerts(
            rain_predictions, harvest_calculation, current_weather,
            {"latitude": request.latitude, "longitude": request.longitude}
        )
        
        # Get location info
        location_info = await _get_location_info(request.latitude, request.longitude)
        
        response = PredictionResponse(
            location=location_info,
            weather_data=current_weather,
            rain_predictions=rain_predictions,
            harvest_calculations=harvest_calculation,
            action_alerts=action_alerts,
            generated_at=datetime.now()
        )
        
        logger.info(f"Successfully generated prediction with {len(rain_predictions)} forecasts and {len(action_alerts)} alerts")
        return response
        
    except Exception as e:
        logger.error(f"Error generating rain prediction: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")


@router.get("/predict/{prediction_id}")
async def get_prediction(prediction_id: str):
    """
    Get a specific prediction by ID (placeholder for future implementation)
    """
    # This would typically fetch from database
    return {"message": f"Prediction {prediction_id} not found", "status": "not_implemented"}


@router.post("/predictions/{prediction_id}/summary", response_model=PostRainfallSummary)
async def create_post_rainfall_summary(
    prediction_id: str,
    actual_rainfall_mm: float,
    harvested_liters: float,
    overflow_liters: float = 0.0,
    recharge_liters: float = 0.0,
    period_start: datetime = None,
    period_end: datetime = None
):
    """
    Create post-rainfall summary report
    """
    try:
        if period_start is None:
            period_start = datetime.now() - timedelta(days=1)
        if period_end is None:
            period_end = datetime.now()
        
        # Get original prediction (in real implementation, fetch from database)
        # For now, we'll use mock data
        predicted_rainfall_mm = actual_rainfall_mm * 0.9  # Mock prediction
        
        # Calculate accuracy and efficiency
        accuracy = max(0, 100 - abs(actual_rainfall_mm - predicted_rainfall_mm) / max(actual_rainfall_mm, 1) * 100)
        total_rainfall_liters = actual_rainfall_mm * 1000  # Convert mm to liters per m²
        efficiency = (harvested_liters / total_rainfall_liters * 100) if total_rainfall_liters > 0 else 0
        
        return PostRainfallSummary(
            rainfall_period_start=period_start,
            rainfall_period_end=period_end,
            actual_rainfall_mm=actual_rainfall_mm,
            predicted_rainfall_mm=predicted_rainfall_mm,
            accuracy_percentage=round(accuracy, 1),
            harvested_liters=harvested_liters,
            overflow_liters=overflow_liters,
            recharge_liters=recharge_liters,
            efficiency_percentage=round(efficiency, 1)
        )
        
    except Exception as e:
        logger.error(f"Error creating post-rainfall summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating summary: {str(e)}")


@router.get("/alerts")
async def get_active_alerts(latitude: float, longitude: float):
    """
    Get active alerts for a location
    """
    try:
        # Get current weather and generate alerts
        current_weather = await weather_service.get_current_weather(latitude, longitude)
        if not current_weather:
            raise HTTPException(status_code=500, detail="Unable to fetch weather data")
        
        # Get recent predictions
        rain_predictions = await rain_prediction_service.predict_rainfall(
            latitude, longitude, 7
        )
        
        # Mock harvest calculation for alerts
        harvest_calculation = HarvestCalculation(
            roof_area_m2=100.0,
            runoff_coefficient=0.8,
            tank_capacity_liters=5000.0,
            current_tank_level_liters=2000.0,
            predicted_harvest_liters=3000.0,
            overflow_risk=True,
            overflow_liters=500.0
        )
        
        # Generate alerts
        alerts = alert_service.generate_alerts(
            rain_predictions, harvest_calculation, current_weather,
            {"latitude": latitude, "longitude": longitude}
        )
        
        return {
            "alerts": alerts,
            "count": len(alerts),
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting alerts: {str(e)}")


@router.post("/train-model")
async def train_prediction_model(
    background_tasks: BackgroundTasks,
    latitude: float,
    longitude: float
):
    """
    Train the rain prediction model with historical data
    """
    try:
        # Add training task to background
        background_tasks.add_task(
            rain_prediction_service.train_model,
            latitude, longitude
        )
        
        return {
            "message": "Model training started",
            "status": "training",
            "location": {"latitude": latitude, "longitude": longitude}
        }
        
    except Exception as e:
        logger.error(f"Error starting model training: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting training: {str(e)}")


@router.get("/weather/current")
async def get_current_weather(latitude: float, longitude: float):
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


@router.get("/weather/forecast")
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
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting forecast: {str(e)}")


def _calculate_harvest_potential(
    request: PredictionRequest, 
    rain_predictions: List[RainPrediction]
) -> HarvestCalculation:
    """Calculate potential harvest based on predictions"""
    
    # Get total predicted rainfall (24-hour prediction)
    total_rainfall = 0.0
    for pred in rain_predictions:
        if pred.forecast_hours == 24:
            total_rainfall = pred.predicted_rainfall
            break
    
    # Calculate harvest potential
    runoff_coefficient = 0.8  # Standard coefficient for rooftops
    predicted_harvest_liters = total_rainfall * request.roof_area_m2 * runoff_coefficient
    
    # Check for overflow
    overflow_risk = predicted_harvest_liters > request.tank_capacity_liters
    overflow_liters = max(0, predicted_harvest_liters - request.tank_capacity_liters)
    
    return HarvestCalculation(
        roof_area_m2=request.roof_area_m2,
        runoff_coefficient=runoff_coefficient,
        tank_capacity_liters=request.tank_capacity_liters,
        current_tank_level_liters=request.current_tank_level_liters,
        predicted_harvest_liters=predicted_harvest_liters,
        overflow_risk=overflow_risk,
        overflow_liters=overflow_liters
    )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for rain prediction service
    """
    try:
        # Test weather service
        weather_status = "available"
        try:
            test_weather = await weather_service.get_current_weather(28.6139, 77.2090)
            if not test_weather:
                weather_status = "mock_data"
        except Exception:
            weather_status = "error"
        
        # Test prediction service
        prediction_status = "available"
        try:
            test_predictions = await rain_prediction_service.predict_rainfall(28.6139, 77.2090, 1)
            if not test_predictions:
                prediction_status = "error"
        except Exception:
            prediction_status = "error"
        
        return {
            "status": "healthy",
            "service": "rain-prediction",
            "weather_service": weather_status,
            "prediction_service": prediction_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "service": "rain-prediction",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


async def _get_location_info(latitude: float, longitude: float) -> Dict[str, Any]:
    """Get location information (mock implementation)"""
    # In a real implementation, this would use a geocoding service
    return {
        "latitude": latitude,
        "longitude": longitude,
        "city": "Unknown City",
        "country": "Unknown Country",
        "timezone": "UTC"
    }
