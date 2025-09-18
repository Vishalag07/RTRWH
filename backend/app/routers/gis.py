from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.gis_clients import fetch_rainfall_annual_mm, fetch_groundwater_context


router = APIRouter()


@router.get("/gis/rainfall")
async def get_rainfall(lat: float = Query(...), lon: float = Query(...)):
    return {"annual_rainfall_mm": await fetch_rainfall_annual_mm(lat, lon)}


@router.get("/gis/groundwater")
async def get_groundwater(lat: float = Query(...), lon: float = Query(...), db: Session = Depends(get_db)):
    return await fetch_groundwater_context(lat, lon, db)


@router.get("/gis/aquifer")
async def get_aquifer(lat: float = Query(...), lon: float = Query(...), db: Session = Depends(get_db)):
    ctx = await fetch_groundwater_context(lat, lon, db)
    return {
        "aquifer_type": ctx.get("aquifer_type"),
        "transmissivity_m2_per_day": ctx.get("transmissivity_m2_per_day"),
        "storativity": ctx.get("storativity"),
    }


@router.get("/gis/gw-depth")
async def get_gw_depth(lat: float = Query(...), lon: float = Query(...), db: Session = Depends(get_db)):
    ctx = await fetch_groundwater_context(lat, lon, db)
    return {"gw_depth_m": ctx.get("gw_depth_m")}


