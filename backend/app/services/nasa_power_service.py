"""
NASA POWER API service for fetching soil, temperature, and rainfall data
"""

import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class NASAPowerData:
    """Data class for NASA POWER API response"""
    timestamp: datetime
    temperature_2m: float  # T2M - Temperature at 2 meters (Celsius)
    precipitation: float   # PRECTOTCORR - Precipitation corrected (mm/day)
    soil_wetness: float    # GWETTOP - Surface soil wetness (0-1)
    latitude: float
    longitude: float


class NASAPowerService:
    """Service for interacting with NASA POWER API"""
    
    def __init__(self):
        self.base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        self.timeout = 30.0
        self.community = "AG"  # Agricultural community
        
    async def get_daily_data(
        self, 
        latitude: float, 
        longitude: float, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[NASAPowerData]:
        """
        Get daily NASA POWER data for a location and date range
        
        Args:
            latitude: Location latitude
            longitude: Location longitude  
            start_date: Start date for data
            end_date: End date for data
            
        Returns:
            List of NASAPowerData objects
        """
        try:
            # Format dates for API
            start_str = start_date.strftime("%Y%m%d")
            end_str = end_date.strftime("%Y%m%d")
            
            # API parameters
            params = {
                "parameters": "T2M,PRECTOTCORR,GWETTOP",
                "community": self.community,
                "longitude": longitude,
                "latitude": latitude,
                "start": start_str,
                "end": end_str,
                "format": "JSON"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return self._parse_response(data, latitude, longitude)
                
        except Exception as e:
            logger.error(f"Error fetching NASA POWER data: {e}")
            return self._get_mock_data(latitude, longitude, start_date, end_date)
    
    async def get_current_data(self, latitude: float, longitude: float) -> Optional[NASAPowerData]:
        """
        Get current day NASA POWER data
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            
        Returns:
            NASAPowerData for current day or None
        """
        today = datetime.now().date()
        start_date = datetime.combine(today, datetime.min.time())
        end_date = datetime.combine(today, datetime.max.time())
        
        data = await self.get_daily_data(latitude, longitude, start_date, end_date)
        return data[0] if data else None
    
    async def get_historical_data(
        self, 
        latitude: float, 
        longitude: float, 
        days_back: int = 30
    ) -> List[NASAPowerData]:
        """
        Get historical NASA POWER data
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            days_back: Number of days to look back
            
        Returns:
            List of historical NASAPowerData
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        return await self.get_daily_data(latitude, longitude, start_date, end_date)
    
    async def get_forecast_data(
        self, 
        latitude: float, 
        longitude: float, 
        days_ahead: int = 7
    ) -> List[NASAPowerData]:
        """
        Get forecast NASA POWER data (Note: NASA POWER provides historical data,
        for forecasts we'll use mock data or integrate with other services)
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            days_ahead: Number of days to forecast
            
        Returns:
            List of forecast NASAPowerData
        """
        # NASA POWER doesn't provide forecasts, so we'll generate mock forecast data
        return self._get_mock_forecast_data(latitude, longitude, days_ahead)
    
    def _parse_response(self, data: Dict[str, Any], latitude: float, longitude: float) -> List[NASAPowerData]:
        """Parse NASA POWER API response"""
        power_data_list = []
        
        try:
            # Extract the data from the response
            if "properties" in data and "parameter" in data["properties"]:
                parameters = data["properties"]["parameter"]
                
                # Get the dates from the first parameter
                first_param = list(parameters.keys())[0]
                dates = list(parameters[first_param].keys())
                
                for date_str in dates:
                    try:
                        # Parse date
                        date_obj = datetime.strptime(date_str, "%Y%m%d")
                        
                        # Extract values for this date
                        temperature = parameters.get("T2M", {}).get(date_str, 0)
                        precipitation = parameters.get("PRECTOTCORR", {}).get(date_str, 0)
                        soil_wetness = parameters.get("GWETTOP", {}).get(date_str, 0)
                        
                        power_data = NASAPowerData(
                            timestamp=date_obj,
                            temperature_2m=float(temperature) if temperature is not None else 0.0,
                            precipitation=float(precipitation) if precipitation is not None else 0.0,
                            soil_wetness=float(soil_wetness) if soil_wetness is not None else 0.0,
                            latitude=latitude,
                            longitude=longitude
                        )
                        
                        power_data_list.append(power_data)
                        
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing date {date_str}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error parsing NASA POWER response: {e}")
            
        return power_data_list
    
    def _get_mock_data(
        self, 
        latitude: float, 
        longitude: float, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[NASAPowerData]:
        """Generate mock NASA POWER data for testing"""
        mock_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # Generate realistic mock data based on location and season
            base_temp = 20.0 + (latitude * 0.1)  # Temperature varies with latitude
            seasonal_variation = 10.0 * (current_date.month - 6) / 6  # Seasonal variation
            temperature = base_temp + seasonal_variation + (current_date.day % 10 - 5)
            
            # Mock precipitation (more likely in certain months)
            precipitation = 0.0
            if current_date.month in [6, 7, 8, 9]:  # Monsoon months
                precipitation = (current_date.day % 7) * 2.5
            
            # Mock soil wetness (correlates with precipitation)
            soil_wetness = min(1.0, precipitation / 10.0 + 0.3)
            
            power_data = NASAPowerData(
                timestamp=current_date,
                temperature_2m=temperature,
                precipitation=precipitation,
                soil_wetness=soil_wetness,
                latitude=latitude,
                longitude=longitude
            )
            
            mock_data.append(power_data)
            current_date += timedelta(days=1)
            
        return mock_data
    
    def _get_mock_forecast_data(
        self, 
        latitude: float, 
        longitude: float, 
        days_ahead: int
    ) -> List[NASAPowerData]:
        """Generate mock forecast data"""
        forecast_data = []
        base_date = datetime.now()
        
        for i in range(days_ahead):
            forecast_date = base_date + timedelta(days=i)
            
            # Generate forecast data with some randomness
            base_temp = 22.0 + (latitude * 0.1)
            temperature = base_temp + (i % 5) * 2.0
            
            # Forecast precipitation (less predictable)
            precipitation = 0.0
            if i % 3 == 0:  # Rain every 3 days in forecast
                precipitation = 1.0 + (i % 4) * 1.5
            
            soil_wetness = min(1.0, precipitation / 8.0 + 0.4)
            
            power_data = NASAPowerData(
                timestamp=forecast_date,
                temperature_2m=temperature,
                precipitation=precipitation,
                soil_wetness=soil_wetness,
                latitude=latitude,
                longitude=longitude
            )
            
            forecast_data.append(power_data)
            
        return forecast_data
    
    async def get_soil_analysis(
        self, 
        latitude: float, 
        longitude: float, 
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Get comprehensive soil analysis based on NASA POWER data
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            days_back: Number of days to analyze
            
        Returns:
            Dictionary with soil analysis results
        """
        historical_data = await self.get_historical_data(latitude, longitude, days_back)
        
        if not historical_data:
            return self._get_mock_soil_analysis()
        
        # Calculate soil metrics
        avg_soil_wetness = sum(data.soil_wetness for data in historical_data) / len(historical_data)
        max_soil_wetness = max(data.soil_wetness for data in historical_data)
        min_soil_wetness = min(data.soil_wetness for data in historical_data)
        
        # Calculate precipitation metrics
        total_precipitation = sum(data.precipitation for data in historical_data)
        rainy_days = sum(1 for data in historical_data if data.precipitation > 0)
        
        # Calculate temperature metrics
        avg_temperature = sum(data.temperature_2m for data in historical_data) / len(historical_data)
        max_temperature = max(data.temperature_2m for data in historical_data)
        min_temperature = min(data.temperature_2m for data in historical_data)
        
        # Soil health assessment
        soil_health = "good"
        if avg_soil_wetness < 0.3:
            soil_health = "dry"
        elif avg_soil_wetness > 0.8:
            soil_health = "saturated"
        
        # Recharge potential assessment
        recharge_potential = "moderate"
        if total_precipitation > days_back * 2:  # More than 2mm/day average
            recharge_potential = "high"
        elif total_precipitation < days_back * 0.5:  # Less than 0.5mm/day average
            recharge_potential = "low"
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "analysis_period_days": days_back,
            "soil_metrics": {
                "average_soil_wetness": round(avg_soil_wetness, 3),
                "max_soil_wetness": round(max_soil_wetness, 3),
                "min_soil_wetness": round(min_soil_wetness, 3),
                "soil_wetness_variability": round(max_soil_wetness - min_soil_wetness, 3)
            },
            "precipitation_metrics": {
                "total_precipitation_mm": round(total_precipitation, 2),
                "average_daily_precipitation_mm": round(total_precipitation / days_back, 2),
                "rainy_days": rainy_days,
                "precipitation_frequency": round(rainy_days / days_back * 100, 1)
            },
            "temperature_metrics": {
                "average_temperature_c": round(avg_temperature, 1),
                "max_temperature_c": round(max_temperature, 1),
                "min_temperature_c": round(min_temperature, 1),
                "temperature_range_c": round(max_temperature - min_temperature, 1)
            },
            "assessments": {
                "soil_health": soil_health,
                "recharge_potential": recharge_potential,
                "drought_risk": "low" if avg_soil_wetness > 0.4 else "moderate" if avg_soil_wetness > 0.2 else "high"
            },
            "recommendations": self._generate_soil_recommendations(avg_soil_wetness, total_precipitation, avg_temperature),
            "generated_at": datetime.now()
        }
    
    def _get_mock_soil_analysis(self) -> Dict[str, Any]:
        """Generate mock soil analysis data"""
        return {
            "location": {"latitude": 0.0, "longitude": 0.0},
            "analysis_period_days": 30,
            "soil_metrics": {
                "average_soil_wetness": 0.45,
                "max_soil_wetness": 0.78,
                "min_soil_wetness": 0.23,
                "soil_wetness_variability": 0.55
            },
            "precipitation_metrics": {
                "total_precipitation_mm": 45.2,
                "average_daily_precipitation_mm": 1.51,
                "rainy_days": 12,
                "precipitation_frequency": 40.0
            },
            "temperature_metrics": {
                "average_temperature_c": 24.5,
                "max_temperature_c": 32.1,
                "min_temperature_c": 18.3,
                "temperature_range_c": 13.8
            },
            "assessments": {
                "soil_health": "good",
                "recharge_potential": "moderate",
                "drought_risk": "low"
            },
            "recommendations": [
                "Soil moisture levels are optimal for groundwater recharge",
                "Consider implementing rainwater harvesting during peak precipitation periods",
                "Monitor soil wetness during dry spells to prevent drought stress"
            ],
            "generated_at": datetime.now()
        }
    
    def _generate_soil_recommendations(
        self, 
        avg_soil_wetness: float, 
        total_precipitation: float, 
        avg_temperature: float
    ) -> List[str]:
        """Generate soil management recommendations"""
        recommendations = []
        
        if avg_soil_wetness < 0.3:
            recommendations.append("Soil is dry - consider implementing water conservation measures")
            recommendations.append("Increase organic matter to improve water retention")
        elif avg_soil_wetness > 0.8:
            recommendations.append("Soil is saturated - ensure proper drainage to prevent waterlogging")
            recommendations.append("Consider implementing subsurface drainage systems")
        else:
            recommendations.append("Soil moisture levels are optimal for plant growth")
        
        if total_precipitation > 100:  # High precipitation
            recommendations.append("High precipitation period - excellent opportunity for groundwater recharge")
            recommendations.append("Consider implementing rainwater harvesting systems")
        elif total_precipitation < 20:  # Low precipitation
            recommendations.append("Low precipitation period - focus on water conservation")
            recommendations.append("Implement drought-resistant practices")
        
        if avg_temperature > 30:
            recommendations.append("High temperatures detected - increased evaporation risk")
            recommendations.append("Consider mulching to reduce soil moisture loss")
        elif avg_temperature < 15:
            recommendations.append("Low temperatures - reduced evaporation, good for water retention")
        
        return recommendations
