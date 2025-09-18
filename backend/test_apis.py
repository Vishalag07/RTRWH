"""
Test script for the new APIs
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.routers.aquifer import _get_mock_aquifer_data
from app.routers.groundwater import _generate_mock_gw_depth_points
from app.routers.soil import _get_mock_soil_data
from app.services.weather_service import WeatherService


async def test_apis():
    """Test the new APIs"""
    print("Testing new APIs...")
    
    # Test coordinates
    lat, lon = 28.6139, 77.2090  # Delhi, India
    
    print(f"\n1. Testing Aquifer API for location: {lat}, {lon}")
    try:
        aquifer_data = _get_mock_aquifer_data(lat, lon)
        print(f"   ✓ Aquifer Type: {aquifer_data.aquifer_type}")
        print(f"   ✓ Groundwater Depth: {aquifer_data.gw_depth_m}m")
        print(f"   ✓ Transmissivity: {aquifer_data.transmissivity_m2_per_day} m²/day")
        print(f"   ✓ Storativity: {aquifer_data.storativity}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print(f"\n2. Testing Groundwater API for location: {lat}, {lon}")
    try:
        gw_points = _generate_mock_gw_depth_points(lat, lon, 5.0)
        print(f"   ✓ Generated {len(gw_points)} groundwater depth points")
        if gw_points:
            avg_depth = sum(p.depth_m for p in gw_points) / len(gw_points)
            print(f"   ✓ Average depth: {avg_depth:.2f}m")
            print(f"   ✓ Depth range: {min(p.depth_m for p in gw_points):.2f}m - {max(p.depth_m for p in gw_points):.2f}m")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print(f"\n3. Testing Soil API for location: {lat}, {lon}")
    try:
        soil_data = _get_mock_soil_data(lat, lon)
        print(f"   ✓ Soil Type: {soil_data.soil_type}")
        print(f"   ✓ Permeability: {soil_data.permeability} cm/hour")
        print(f"   ✓ Infiltration Rate: {soil_data.infiltration_rate} mm/hour")
        print(f"   ✓ Water Holding Capacity: {soil_data.water_holding_capacity} mm")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print(f"\n4. Testing Weather Service for location: {lat}, {lon}")
    try:
        weather_service = WeatherService()
        current_weather = await weather_service.get_current_weather(lat, lon)
        if current_weather:
            print(f"   ✓ Temperature: {current_weather.temperature}°C")
            print(f"   ✓ Humidity: {current_weather.humidity}%")
            print(f"   ✓ Precipitation: {current_weather.precipitation}mm")
            print(f"   ✓ Wind Speed: {current_weather.wind_speed} m/s")
        else:
            print("   ✓ Weather service using mock data (no API key)")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print(f"\n5. Testing Weather Forecast for location: {lat}, {lon}")
    try:
        forecast = await weather_service.get_forecast(lat, lon, 3)
        print(f"   ✓ Generated {len(forecast)} forecast points")
        if forecast:
            total_rain = sum(w.precipitation for w in forecast)
            print(f"   ✓ Total predicted rainfall (3 days): {total_rain:.2f}mm")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n✓ All API tests completed!")


if __name__ == "__main__":
    asyncio.run(test_apis())
