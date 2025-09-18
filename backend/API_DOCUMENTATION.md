# API Documentation

This document describes the new APIs for aquifer data, groundwater depth level, soil type, and enhanced weather data.

## Environment Configuration

All API keys can be configured in the `.env` file. If no `.env` file exists, the APIs will use mock data for testing.

### Required Environment Variables

```env
# Weather APIs
OPENWEATHER_API_KEY=your-openweather-api-key
WEATHER_API_KEY=your-weather-api-key
ACCUWEATHER_API_KEY=your-accuweather-api-key

# Aquifer and Groundwater Data APIs
USGS_API_KEY=your-usgs-api-key
GROUNDWATER_API_KEY=your-groundwater-api-key

# Soil Data APIs
SOILGRIDS_API_KEY=your-soilgrids-api-key
NASA_SOIL_API_KEY=your-nasa-soil-api-key
```

## API Endpoints

### 1. Aquifer Data API (`/api/aquifer/`)

#### Get All Aquifer Data
```
GET /api/aquifer/
```
Returns paginated list of all aquifer data.

#### Get Aquifer Data by Location
```
GET /api/aquifer/location?latitude=28.6139&longitude=77.2090&radius_km=5.0
```
Returns aquifer data for a specific location.

**Response:**
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "radius_km": 5.0
  },
  "aquifer_data": {
    "id": 1,
    "aquifer_type": "unconfined",
    "gw_depth_m": 15.5,
    "transmissivity_m2_per_day": 75.0,
    "storativity": 0.0015,
    "geom": {...}
  },
  "nearest_aquifer": {...},
  "distance_km": 0.0
}
```

#### Create Aquifer Data
```
POST /api/aquifer/
```
Creates new aquifer data entry.

#### Get Aquifer Data by Type
```
GET /api/aquifer/type/{aquifer_type}
```
Returns aquifer data filtered by type (confined, unconfined, etc.).

### 2. Groundwater Depth API (`/api/groundwater/`)

#### Get All Groundwater Depth Points
```
GET /api/groundwater/
```
Returns paginated list of all groundwater depth measurements.

#### Get Groundwater Depth by Location
```
GET /api/groundwater/location?latitude=28.6139&longitude=77.2090&radius_km=5.0
```
Returns groundwater depth data for a specific location.

**Response:**
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "radius_km": 5.0
  },
  "gw_depth_points": [
    {
      "id": 1,
      "depth_m": 12.5,
      "obs_date": "2024-01-15T10:30:00",
      "geom": {...}
    }
  ],
  "average_depth_m": 13.2,
  "latest_depth_m": 12.5
}
```

#### Create Groundwater Depth Point
```
POST /api/groundwater/
```
Creates new groundwater depth measurement.

#### Get Recent Measurements
```
GET /api/groundwater/recent/{days}
```
Returns recent groundwater depth measurements (default: 30 days).

#### Get Groundwater Depth Trends
```
GET /api/groundwater/trends/location?latitude=28.6139&longitude=77.2090&months=12
```
Returns groundwater depth trends over time.

### 3. Soil Type API (`/api/soil/`)

#### Get All Soil Types
```
GET /api/soil/
```
Returns paginated list of all soil type data.

#### Get Soil Data by Location
```
GET /api/soil/location?latitude=28.6139&longitude=77.2090&radius_km=5.0
```
Returns soil type data for a specific location.

**Response:**
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "radius_km": 5.0
  },
  "soil_data": {
    "id": 1,
    "soil_type": "loam",
    "permeability": 5.5,
    "infiltration_rate": 10.0,
    "water_holding_capacity": 175.0,
    "geom": {...}
  },
  "nearest_soil": {...},
  "distance_km": 0.0
}
```

#### Create Soil Data
```
POST /api/soil/
```
Creates new soil type data entry.

#### Get Soil Data by Type
```
GET /api/soil/type/{soil_type}
```
Returns soil data filtered by type (clay, sand, loam, etc.).

#### Get Infiltration Rates
```
GET /api/soil/infiltration/rate
```
Returns typical infiltration rates for different soil types.

#### Get Permeability Rates
```
GET /api/soil/permeability/rates
```
Returns typical permeability rates for different soil types.

#### Get Water Holding Capacity
```
GET /api/soil/water-holding/capacity
```
Returns typical water holding capacity for different soil types.

### 4. Enhanced Weather API (`/api/weather/`)

#### Get Current Weather
```
GET /api/weather/current?latitude=28.6139&longitude=77.2090
```
Returns current weather data for a location.

#### Get Weather Forecast
```
GET /api/weather/forecast?latitude=28.6139&longitude=77.2090&days=7
```
Returns weather forecast for a location.

#### Get Historical Weather
```
GET /api/weather/historical?latitude=28.6139&longitude=77.2090&days_back=30
```
Returns historical weather data for a location.

#### Get Weather Alerts
```
GET /api/weather/alerts?latitude=28.6139&longitude=77.2090
```
Returns weather alerts and warnings for a location.

#### Get Rainfall Summary
```
GET /api/weather/rainfall/summary?latitude=28.6139&longitude=77.2090&days=7
```
Returns rainfall summary for a location.

#### Get Optimal Harvesting Conditions
```
GET /api/weather/conditions/optimal?latitude=28.6139&longitude=77.2090
```
Returns optimal rainwater harvesting conditions for a location.

#### Get API Status
```
GET /api/weather/api-status
```
Returns status of weather API services.

## Data Models

### Aquifer Data
- `aquifer_type`: Type of aquifer (confined, unconfined, semi-confined, perched)
- `gw_depth_m`: Groundwater depth in meters
- `transmissivity_m2_per_day`: Transmissivity in m²/day
- `storativity`: Storativity coefficient (0-1)

### Groundwater Depth
- `depth_m`: Groundwater depth in meters
- `obs_date`: Observation date
- `geom`: Geometric data (Point)

### Soil Type
- `soil_type`: Type of soil (sand, clay, loam, etc.)
- `permeability`: Permeability in cm/hour
- `infiltration_rate`: Infiltration rate in mm/hour
- `water_holding_capacity`: Water holding capacity in mm

### Weather Data
- `temperature`: Temperature in Celsius
- `humidity`: Humidity percentage (0-100)
- `pressure`: Atmospheric pressure in hPa
- `wind_speed`: Wind speed in m/s
- `wind_direction`: Wind direction in degrees (0-360)
- `cloud_cover`: Cloud cover percentage (0-100)
- `precipitation`: Precipitation in mm
- `precipitation_probability`: Precipitation probability percentage (0-100)

## Mock Data

When API keys are not configured, the system uses mock data for testing:

- **Aquifer Data**: Generated based on location coordinates
- **Groundwater Depth**: Simulated with seasonal variations
- **Soil Type**: Determined by location-based algorithms
- **Weather Data**: Realistic mock data with temporal variations

## Error Handling

All APIs return appropriate HTTP status codes:
- `200`: Success
- `404`: Resource not found
- `500`: Internal server error

Error responses include detailed error messages for debugging.

## Testing

Run the test script to verify all APIs:
```bash
cd backend
python test_apis.py
```

## Notes

- All APIs support CORS for frontend integration
- Geographic data uses WGS84 (EPSG:4326) coordinate system
- Time data is in UTC format
- Mock data is generated deterministically based on coordinates for consistency
