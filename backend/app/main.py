from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.settings import get_settings
from app.routers import auth, assessments, gis, reports, chat, rain_prediction, aquifer, groundwater, soil, weather, nasa_power
from app.db import engine, Base
from app import models  # noqa: F401  ensure models are imported for metadata
from app.middleware import RateLimiter, SecurityHeadersMiddleware
from sqlalchemy import text


settings = get_settings()

app = FastAPI(title=settings.app_name)

# Parse allowed origins from settings
allowed_origins = settings.allowed_origins.split(",") if settings.allowed_origins else []

# Add security middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimiter)

# Add CORS middleware with more secure settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Length", "X-Request-ID"],
    max_age=settings.cors_max_age,
)


@app.get("/")
def root():
    return {"status": "ok", "name": settings.app_name}


# Custom OPTIONS handler is no longer needed as the CORS middleware handles preflight requests properly


app.include_router(auth.router, prefix=settings.api_prefix, tags=["auth"])
app.include_router(assessments.router, prefix=settings.api_prefix, tags=["assessments"])
app.include_router(gis.router, prefix=settings.api_prefix, tags=["gis"])
app.include_router(reports.router, prefix=settings.api_prefix, tags=["reports"])
app.include_router(chat.router, prefix=settings.api_prefix, tags=["chat"])
app.include_router(rain_prediction.router, prefix=f"{settings.api_prefix}/rain-prediction", tags=["rain-prediction"])
app.include_router(aquifer.router, prefix=settings.api_prefix, tags=["aquifer"])
app.include_router(groundwater.router, prefix=f"{settings.api_prefix}/gamification", tags=["gamification"])
app.include_router(soil.router, prefix=settings.api_prefix, tags=["soil"])
app.include_router(weather.router, prefix=settings.api_prefix, tags=["weather"])
app.include_router(nasa_power.router, prefix=f"{settings.api_prefix}/nasa-power", tags=["nasa-power"])


@app.on_event("startup")
def on_startup():
    # For first-run convenience; production should use Alembic migrations.
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        # Lightweight, best-effort migrations for new columns (use Alembic in production)
        with engine.begin() as conn:
            try:
                # PostgreSQL (supports IF NOT EXISTS)
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
                print("🧩 Ensured users.location column exists (PostgreSQL)")
            except Exception:
                # SQLite fallback (no IF NOT EXISTS historically); ignore if already exists
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR(255);"))
                    print("🧩 Added users.location column (SQLite)")
                except Exception:
                    # Column likely already exists or backend doesn't support alter — ignore quietly
                    pass
    except Exception as e:
        print(f"⚠️  Database table creation failed: {e}")
        print("📝 The application will continue with mock data")


