# NASA POWER API Integration

This document describes the integration of NASA's Prediction Of Worldwide Energy Resources (POWER) API into the RTRWH (Rainwater Harvesting) project.

## Overview

The NASA POWER API provides access to meteorological and solar data, including:
- **Temperature at 2 meters (T2M)**: Air temperature at 2 meters above surface in Celsius
- **Precipitation Corrected (PRECTOTCORR)**: Total precipitation including rainfall in mm/day
- **Surface Soil Wetness (GWETTOP)**: Soil moisture in top 0-5 cm layer (0-1 scale)

## API Endpoints

### NASA POWER Direct Endpoints

All NASA POWER endpoints are available under `/api/nasa-power/`:

#### 1. Get NASA POWER Data
```
GET /api/nasa-power/data
```
**Parameters:**
- `latitude` (float): Location latitude (-90 to 90)
- `longitude` (float): Location longitude (-180 to 180)
- `start_date` (optional): Start date for data
- `end_date` (optional): End date for data
- `days_back` (int, default=30): Number of days to look back if dates not specified

**Example:**
```
GET /api/nasa-power/data?latitude=28.6139&longitude=77.2090&days_back=7
```

#### 2. Get Current NASA POWER Data
```
GET /api/nasa-power/current
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude

#### 3. Get Historical NASA POWER Data
```
GET /api/nasa-power/historical
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude
- `days_back` (int, default=30): Number of days to look back

#### 4. Get NASA POWER Forecast (Mock Data)
```
GET /api/nasa-power/forecast
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude
- `days_ahead` (int, default=7): Number of days to forecast

**Note:** NASA POWER API provides historical data only. This endpoint returns mock forecast data.

#### 5. Get Soil Analysis
```
GET /api/nasa-power/soil-analysis
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude
- `days_back` (int, default=30): Number of days to analyze

**Returns comprehensive soil analysis including:**
- Soil wetness metrics
- Precipitation metrics
- Temperature metrics
- Soil health assessments
- Management recommendations

#### 6. Get Temperature Summary
```
GET /api/nasa-power/temperature/summary
```

#### 7. Get Precipitation Summary
```
GET /api/nasa-power/precipitation/summary
```

#### 8. Get Soil Wetness Summary
```
GET /api/nasa-power/soil-wetness/summary
```

#### 9. Get API Status
```
GET /api/nasa-power/api-status
```

### Enhanced Weather Endpoints

The existing weather endpoints have been enhanced with NASA POWER data:

#### 1. Enhanced Weather Data
```
GET /api/weather/enhanced
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude

**Returns combined data from:**
- OpenWeatherMap API (current weather)
- NASA POWER API (soil, temperature, precipitation)

#### 2. Rainfall Harvest Analysis
```
GET /api/weather/rainfall-harvest-analysis
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude
- `roof_area_m2` (float): Roof area in square meters

**Returns:**
- Rainfall metrics
- Harvest potential calculations
- Recommendations for rainwater harvesting

#### 3. Soil Moisture Analysis
```
GET /api/weather/soil-moisture-analysis
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude

#### 4. NASA POWER Data via Weather Service
```
GET /api/weather/nasa-power-data
```
**Parameters:**
- `latitude` (float): Location latitude
- `longitude` (float): Location longitude
- `days_back` (int, default=30): Number of days to look back

## Data Models

### NASAPowerData
```json
{
  "timestamp": "2024-01-15T00:00:00",
  "temperature_2m": 25.5,
  "precipitation": 2.3,
  "soil_wetness": 0.65,
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

### Soil Analysis Response
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
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
    "Consider implementing rainwater harvesting during peak precipitation periods"
  ],
  "generated_at": "2024-01-15T10:30:00"
}
```

## Usage Examples

### 1. Get Soil Analysis for a Location
```python
import httpx

async def get_soil_analysis(lat: float, lon: float):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/nasa-power/soil-analysis",
            params={"latitude": lat, "longitude": lon, "days_back": 30}
        )
        return response.json()
```

### 2. Get Rainfall Harvest Analysis
```python
async def get_harvest_analysis(lat: float, lon: float, roof_area: float):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/weather/rainfall-harvest-analysis",
            params={
                "latitude": lat, 
                "longitude": lon, 
                "roof_area_m2": roof_area
            }
        )
        return response.json()
```

### 3. Get Enhanced Weather Data
```python
async def get_enhanced_weather(lat: float, lon: float):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/weather/enhanced",
            params={"latitude": lat, "longitude": lon}
        )
        return response.json()
```

## Error Handling

The API includes comprehensive error handling:

- **404**: No data available for the location
- **500**: Internal server error or API service unavailable
- **Validation errors**: Invalid parameters (latitude/longitude out of range)

## Mock Data

When the NASA POWER API is unavailable or for testing purposes, the service automatically falls back to mock data that:
- Generates realistic values based on location and season
- Maintains the same data structure as real API responses
- Provides consistent behavior for development and testing

## Rate Limits

NASA POWER API doesn't have documented rate limits, but the service includes:
- 30-second timeout for API requests
- Automatic fallback to mock data on errors
- Comprehensive logging for monitoring

## Data Sources

- **Weather Data**: OpenWeatherMap API
- **Soil, Temperature, Precipitation**: NASA POWER API
- **Fallback Data**: Mock data generation

## Integration Benefits

1. **Comprehensive Data**: Combines weather and soil data for better analysis
2. **Rainwater Harvesting**: Specific analysis for rainwater harvesting potential
3. **Soil Health**: Detailed soil moisture and health assessments
4. **Reliability**: Automatic fallback to mock data ensures service availability
5. **Scalability**: Async implementation supports high concurrent usage

## Future Enhancements

1. **Caching**: Implement Redis caching for frequently requested data
2. **Real-time Updates**: WebSocket support for real-time data updates
3. **Data Visualization**: Enhanced charts and graphs for data presentation
4. **Machine Learning**: Predictive models for soil moisture and rainfall
5. **Historical Trends**: Long-term trend analysis and forecasting

## API Documentation

The complete API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

All endpoints include detailed descriptions, parameter validation, and example responses.
