"""
Weather data service for fetching weather information from OpenWeatherMap API
"""

import httpx
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from app.schemas import WeatherData
from app.settings import get_settings
from app.services.nasa_power_service import NASAPowerService

logger = logging.getLogger(__name__)
settings = get_settings()


class WeatherService:
    def __init__(self):
        self.openweather_api_key = settings.openweather_api_key
        self.weather_api_key = settings.weather_api_key
        self.accuweather_api_key = settings.accuweather_api_key
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.timeout = 30.0
        self.nasa_power_service = NASAPowerService()

    async def get_current_weather(self, latitude: float, longitude: float) -> Optional[WeatherData]:
        """Get current weather data for a location"""
        if not self.openweather_api_key:
            logger.warning("OpenWeather API key not found, using mock data")
            return self._get_mock_weather_data()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/weather"
                params = {
                    "lat": latitude,
                    "lon": longitude,
                    "appid": self.openweather_api_key,
                    "units": "metric"
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                return self._parse_weather_data(data)

        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return self._get_mock_weather_data()

    async def get_forecast(self, latitude: float, longitude: float, days: int = 7) -> list[WeatherData]:
        """Get weather forecast for a location"""
        if not self.openweather_api_key:
            logger.warning("OpenWeather API key not found, using mock data")
            return self._get_mock_forecast_data(days)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/forecast"
                params = {
                    "lat": latitude,
                    "lon": longitude,
                    "appid": self.openweather_api_key,
                    "units": "metric"
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                return self._parse_forecast_data(data, days)

        except Exception as e:
            logger.error(f"Error fetching forecast data: {e}")
            return self._get_mock_forecast_data(days)

    def _parse_weather_data(self, data: Dict[str, Any]) -> WeatherData:
        """Parse OpenWeatherMap API response into WeatherData"""
        return WeatherData(
            timestamp=datetime.fromtimestamp(data["dt"]),
            temperature=data["main"]["temp"],
            humidity=data["main"]["humidity"],
            pressure=data["main"]["pressure"],
            wind_speed=data["wind"]["speed"],
            wind_direction=data["wind"].get("deg", 0),
            cloud_cover=data["clouds"]["all"],
            precipitation=data["rain"].get("1h", 0) if "rain" in data else 0,
            precipitation_probability=0  # Not available in current weather API
        )

    def _parse_forecast_data(self, data: Dict[str, Any], days: int) -> list[WeatherData]:
        """Parse OpenWeatherMap forecast response into list of WeatherData"""
        forecast_list = []
        
        for item in data["list"][:days * 8]:  # 8 forecasts per day (3-hour intervals)
            weather_data = WeatherData(
                timestamp=datetime.fromtimestamp(item["dt"]),
                temperature=item["main"]["temp"],
                humidity=item["main"]["humidity"],
                pressure=item["main"]["pressure"],
                wind_speed=item["wind"]["speed"],
                wind_direction=item["wind"].get("deg", 0),
                cloud_cover=item["clouds"]["all"],
                precipitation=item["rain"].get("3h", 0) if "rain" in item else 0,
                precipitation_probability=item.get("pop", 0) * 100
            )
            forecast_list.append(weather_data)

        return forecast_list

    def _get_mock_weather_data(self) -> WeatherData:
        """Generate mock weather data for testing"""
        return WeatherData(
            timestamp=datetime.now(),
            temperature=25.5,
            humidity=65.0,
            pressure=1013.25,
            wind_speed=3.2,
            wind_direction=180.0,
            cloud_cover=40.0,
            precipitation=0.0,
            precipitation_probability=20.0
        )

    def _get_mock_forecast_data(self, days: int) -> list[WeatherData]:
        """Generate mock forecast data for testing"""
        forecast_list = []
        base_time = datetime.now()
        
        for i in range(days * 8):  # 8 forecasts per day
            timestamp = base_time + timedelta(hours=i * 3)
            
            # Simulate some rain in the forecast
            precipitation = 0.0
            if i % 12 == 0:  # Rain every 36 hours
                precipitation = 2.5 + (i % 3) * 1.5
            
            weather_data = WeatherData(
                timestamp=timestamp,
                temperature=20.0 + (i % 24) * 0.5,  # Daily temperature variation
                humidity=60.0 + (i % 10) * 2,
                pressure=1013.25 + (i % 5) * 0.5,
                wind_speed=2.0 + (i % 8) * 0.5,
                wind_direction=(i * 45) % 360,
                cloud_cover=30.0 + (i % 20) * 2,
                precipitation=precipitation,
                precipitation_probability=20.0 + (i % 5) * 10
            )
            forecast_list.append(weather_data)

        return forecast_list

    async def get_historical_weather(self, latitude: float, longitude: float, days_back: int = 30) -> list[WeatherData]:
        """Get historical weather data (mock implementation)"""
        # In a real implementation, you would use a historical weather API
        # For now, we'll generate mock historical data
        historical_data = []
        base_time = datetime.now() - timedelta(days=days_back)
        
        for i in range(days_back * 24):  # Hourly data
            timestamp = base_time + timedelta(hours=i)
            
            # Simulate historical rainfall patterns
            precipitation = 0.0
            if i % 48 == 0:  # Rain every 2 days
                precipitation = 1.0 + (i % 5) * 0.5
            
            weather_data = WeatherData(
                timestamp=timestamp,
                temperature=22.0 + (i % 24) * 0.3,
                humidity=55.0 + (i % 15) * 2,
                pressure=1013.0 + (i % 10) * 0.2,
                wind_speed=1.5 + (i % 6) * 0.3,
                wind_direction=(i * 30) % 360,
                cloud_cover=25.0 + (i % 12) * 3,
                precipitation=precipitation,
                precipitation_probability=15.0 + (i % 8) * 5
            )
            historical_data.append(weather_data)

        return historical_data

    async def get_nasa_power_data(self, latitude: float, longitude: float, days_back: int = 30) -> list[Dict[str, Any]]:
        """Get NASA POWER data for soil, temperature, and rainfall"""
        try:
            nasa_data = await self.nasa_power_service.get_historical_data(latitude, longitude, days_back)
            
            # Convert to dictionary format for easier use
            power_data = []
            for data in nasa_data:
                power_data.append({
                    "timestamp": data.timestamp,
                    "temperature_2m": data.temperature_2m,
                    "precipitation": data.precipitation,
                    "soil_wetness": data.soil_wetness,
                    "latitude": data.latitude,
                    "longitude": data.longitude
                })
            
            return power_data
            
        except Exception as e:
            logger.error(f"Error fetching NASA POWER data: {e}")
            return []

    async def get_enhanced_weather_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get enhanced weather data combining OpenWeather and NASA POWER data"""
        try:
            # Get current weather from OpenWeather
            current_weather = await self.get_current_weather(latitude, longitude)
            
            # Get NASA POWER data for the last 7 days
            nasa_data = await self.get_nasa_power_data(latitude, longitude, 7)
            
            # Get soil analysis
            soil_analysis = await self.nasa_power_service.get_soil_analysis(latitude, longitude, 30)
            
            enhanced_data = {
                "current_weather": current_weather,
                "nasa_power_data": nasa_data,
                "soil_analysis": soil_analysis,
                "data_sources": {
                    "weather": "OpenWeatherMap API",
                    "soil_temperature_precipitation": "NASA POWER API"
                },
                "generated_at": datetime.now()
            }
            
            return enhanced_data
            
        except Exception as e:
            logger.error(f"Error getting enhanced weather data: {e}")
            return {
                "current_weather": None,
                "nasa_power_data": [],
                "soil_analysis": None,
                "error": str(e),
                "generated_at": datetime.now()
            }

    async def get_rainfall_harvest_analysis(self, latitude: float, longitude: float, roof_area_m2: float) -> Dict[str, Any]:
        """Get rainfall analysis for rainwater harvesting using NASA POWER data"""
        try:
            # Get historical precipitation data
            nasa_data = await self.get_nasa_power_data(latitude, longitude, 30)
            
            if not nasa_data:
                return {"error": "No precipitation data available"}
            
            # Calculate rainfall metrics
            total_precipitation = sum(day["precipitation"] for day in nasa_data)
            rainy_days = sum(1 for day in nasa_data if day["precipitation"] > 0)
            max_daily_rainfall = max(day["precipitation"] for day in nasa_data)
            
            # Calculate potential harvest (assuming 80% runoff coefficient)
            runoff_coefficient = 0.8
            potential_harvest_liters = (total_precipitation / 1000) * roof_area_m2 * runoff_coefficient * 1000
            
            # Calculate monthly averages
            monthly_avg = total_precipitation / 30
            
            # Generate recommendations
            recommendations = []
            if monthly_avg > 5:
                recommendations.append("High rainfall area - excellent for rainwater harvesting")
            elif monthly_avg > 2:
                recommendations.append("Moderate rainfall - good potential for rainwater harvesting")
            else:
                recommendations.append("Low rainfall area - consider water conservation measures")
            
            if max_daily_rainfall > 20:
                recommendations.append("Heavy rainfall events detected - ensure adequate storage capacity")
            
            return {
                "location": {"latitude": latitude, "longitude": longitude},
                "roof_area_m2": roof_area_m2,
                "analysis_period_days": 30,
                "rainfall_metrics": {
                    "total_precipitation_mm": round(total_precipitation, 2),
                    "average_daily_precipitation_mm": round(total_precipitation / 30, 2),
                    "rainy_days": rainy_days,
                    "max_daily_rainfall_mm": round(max_daily_rainfall, 2),
                    "precipitation_frequency_percent": round(rainy_days / 30 * 100, 1)
                },
                "harvest_potential": {
                    "potential_monthly_harvest_liters": round(potential_harvest_liters, 0),
                    "potential_daily_harvest_liters": round(potential_harvest_liters / 30, 0),
                    "runoff_coefficient": runoff_coefficient
                },
                "recommendations": recommendations,
                "data_source": "NASA POWER API",
                "generated_at": datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Error getting rainfall harvest analysis: {e}")
            return {"error": f"Error analyzing rainfall data: {str(e)}"}

    async def get_soil_moisture_analysis(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get soil moisture analysis using NASA POWER data"""
        try:
            soil_analysis = await self.nasa_power_service.get_soil_analysis(latitude, longitude, 30)
            return soil_analysis
            
        except Exception as e:
            logger.error(f"Error getting soil moisture analysis: {e}")
            return {"error": f"Error analyzing soil moisture: {str(e)}"}
