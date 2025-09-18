from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Assessment, User
from app.schemas import AssessmentInput, AssessmentOut, AssessmentResult, RunoffResult, StructureDesign, CostBenefit
from app.security import get_current_user_email
from app.services.calculators import (
    estimate_runoff_liters,
    recommend_structure_type,
    suggest_dimensions,
    estimate_costs,
    estimate_benefit,
)
from app.services.gis_clients import fetch_rainfall_annual_mm, fetch_groundwater_context


router = APIRouter()


@router.post("/assessments", response_model=AssessmentOut)
async def create_assessment(payload: AssessmentInput, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
    print(f"📝 Creating assessment for user: {user_email}")
    user = db.query(User).filter(User.email == user_email).first()
    
    # Create test user if it doesn't exist
    if not user and user_email == "testuser@example.com":
        from app.security import hash_password
        test_user = User(
            email="testuser@example.com",
            name="Test User",
            password_hash=hash_password("testpassword123")
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        user = test_user
        print(f"👤 Created test user with ID: {user.id}")
    else:
        print(f"👤 User found: {user.id if user else 'None'}")

    annual_mm = await fetch_rainfall_annual_mm(payload.latitude, payload.longitude)
    # Basic coefficient; in frontend we could refine by roof material
    runoff_coeff = 0.85
    runoff_liters = estimate_runoff_liters(annual_mm, payload.rooftop_area_m2, runoff_coeff)

    aquifer = await fetch_groundwater_context(payload.latitude, payload.longitude, db)
    struct_type = payload.preferred_structure or recommend_structure_type(payload.rooftop_area_m2, payload.open_space_area_m2, aquifer["gw_depth_m"])
    dims, effective_storage, notes = suggest_dimensions(struct_type, runoff_liters * 0.25)  # store at least a design storm fraction of annual
    capex, opex = estimate_costs(struct_type, effective_storage)
    benefit_lpy = estimate_benefit(runoff_liters)
    payback_years = capex / max(1.0, (benefit_lpy / 1000))  # assume 1 currency per KL saved placeholder

    results = AssessmentResult(
        runoff=RunoffResult(annual_rainfall_mm=annual_mm, runoff_coefficient=runoff_coeff, annual_runoff_volume_liters=runoff_liters),
        structure=StructureDesign(structure_type=struct_type, dimensions=dims, storage_volume_liters=effective_storage, notes=notes),
        cost=CostBenefit(capex_currency=capex, opex_currency_per_year=opex, water_savings_liters_per_year=benefit_lpy, payback_years=payback_years),
        aquifer=aquifer,
        recharge_potential_liters=min(runoff_liters, effective_storage * 12),  # simplistic monthly emptying assumption
    )

    assessment = Assessment(
        user_id=user.id if user else None,
        user_name=payload.user_name,
        location_desc=payload.location_desc,
        latitude=payload.latitude,
        longitude=payload.longitude,
        num_dwellers=payload.num_dwellers,
        rooftop_area_m2=payload.rooftop_area_m2,
        open_space_area_m2=payload.open_space_area_m2,
        results=results.model_dump(),
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    print(f"✅ Assessment created with ID: {assessment.id}")
    print(f"📍 Location: {assessment.location_desc} ({assessment.latitude}, {assessment.longitude})")

    return AssessmentOut(
        id=assessment.id,
        created_at=assessment.created_at,
        latitude=assessment.latitude,
        longitude=assessment.longitude,
        inputs=payload,
        results=results,
    )


@router.get("/assessments", response_model=list[AssessmentOut])
def list_assessments(db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == user_email).first()
    rows = db.query(Assessment).filter(Assessment.user_id == (user.id if user else None)).order_by(Assessment.created_at.desc()).all()
    out: list[AssessmentOut] = []
    for a in rows:
        out.append(AssessmentOut(
            id=a.id,
            created_at=a.created_at,
            latitude=a.latitude,
            longitude=a.longitude,
            inputs={
                "user_name": a.user_name,
                "location_desc": a.location_desc,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "num_dwellers": a.num_dwellers,
                "rooftop_area_m2": a.rooftop_area_m2,
                "open_space_area_m2": a.open_space_area_m2,
            },
            results=a.results,
        ))
    return out


@router.get("/assessments/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: int, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == user_email).first()
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a or (user and a.user_id != user.id):
        raise HTTPException(status_code=404, detail="Assessment not found")
    return AssessmentOut(
        id=a.id,
        created_at=a.created_at,
        latitude=a.latitude,
        longitude=a.longitude,
        inputs={
            "user_name": a.user_name,
            "location_desc": a.location_desc,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "num_dwellers": a.num_dwellers,
            "rooftop_area_m2": a.rooftop_area_m2,
            "open_space_area_m2": a.open_space_area_m2,
        },
        results=a.results,
    )


