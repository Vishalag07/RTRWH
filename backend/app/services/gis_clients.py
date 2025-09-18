from typing import Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.settings import get_settings


async def fetch_rainfall_annual_mm(lat: float, lon: float) -> float:
    """
    Example integration using OpenWeather historical/CLIM API or other open sources.
    Placeholder: returns a conservative 800 mm/year if API keys are missing.
    In production, integrate with gridded rainfall datasets (e.g., CHIRPS, IMD) preprocessed into tiles.
    """
    settings = get_settings()
    # Use Open-Meteo Climate API (free, no key) for climatology: monthly precip (mm)
    # Docs: https://open-meteo.com/
    url = f"https://climate-api.open-meteo.com/v1/climate?latitude={lat}&longitude={lon}&start_year=1991&end_year=2020&monthly=precipitation_sum"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            # precipitation_sum is 12 monthly values (mm); sum for annual
            series = (data.get("monthly") or {}).get("precipitation_sum") or []
            annual = float(sum(v for v in series if isinstance(v, (int, float))))
            return annual if annual > 0 else 800.0
    except Exception:
        return 800.0


async def fetch_groundwater_context(lat: float, lon: float, db: Optional[Session] = None) -> dict:
    """
    Join point to CGWB datasets or state water resources. For now returns defaults.
    Returns a dict with groundwater depth, aquifer type, and qualitative recharge potential.
    """
    # Query aquifer polygon intersecting point
    aquifer = None
    gw_depth = None
    if db is not None:
        try:
            q1 = db.execute(text(
                """
                SELECT aquifer_type, transmissivity_m2_per_day, storativity
                FROM aquifer_data
                WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(:lon,:lat),4326))
                LIMIT 1
                """
            ), {"lat": lat, "lon": lon}).mappings().first()
            if q1:
                aquifer = dict(q1)
        except Exception:
            aquifer = None

        try:
            q2 = db.execute(text(
                """
                SELECT depth_m
                FROM gw_depth_points
                ORDER BY geom <-> ST_SetSRID(ST_Point(:lon,:lat),4326)
                LIMIT 1
                """
            ), {"lat": lat, "lon": lon}).scalar()
            if isinstance(q2, (int, float)):
                gw_depth = float(q2)
        except Exception:
            gw_depth = None

    return {
        "gw_depth_m": gw_depth if gw_depth is not None else 8.0,
        "aquifer_type": (aquifer or {}).get("aquifer_type", "Alluvial/Unconfined"),
        "transmissivity_m2_per_day": (aquifer or {}).get("transmissivity_m2_per_day", 500),
        "storativity": (aquifer or {}).get("storativity", 0.12),
    }


