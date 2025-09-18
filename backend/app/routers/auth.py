from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserOut, LoginRequest, UserUpdate
from app.security import create_access_token, hash_password, verify_password
from app.settings import get_settings
from app.security import get_current_user_email


router = APIRouter()


@router.post("/auth/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
	if db.query(User).filter(User.email == user.email).first():
		raise HTTPException(status_code=400, detail="Email already registered")
	u = User(email=user.email, name=user.name, password_hash=hash_password(user.password))
	db.add(u)
	db.commit()
	db.refresh(u)
	return u


@router.post("/auth/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
	user = db.query(User).filter(User.email == form_data.username).first()
	if not user:
		raise HTTPException(status_code=400, detail="Incorrect email or password")
	if not verify_password(form_data.password, user.password_hash):
		raise HTTPException(status_code=400, detail="Incorrect email or password")
	settings = get_settings()
	token = create_access_token(subject=user.email, expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
	return Token(access_token=token)


@router.post("/auth/login", response_model=Token)
def json_login(payload: LoginRequest, db: Session = Depends(get_db)):
	user = db.query(User).filter(User.email == payload.email).first()
	if not user:
		raise HTTPException(status_code=400, detail="Incorrect email or password")
	if not verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=400, detail="Incorrect email or password")
	settings = get_settings()
	token = create_access_token(subject=user.email, expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
	return Token(access_token=token)


@router.get("/auth/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
	user = db.query(User).filter(User.email == user_email).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")
	return user


@router.put("/auth/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
	user = db.query(User).filter(User.email == user_email).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")

	# Update allowed fields
	if payload.name is not None:
		user.name = payload.name
	if payload.email is not None:
		# prevent duplicate emails
		if db.query(User).filter(User.email == payload.email, User.id != user.id).first():
			raise HTTPException(status_code=400, detail="Email already in use")
		user.email = payload.email
	if payload.location is not None:
		user.location = payload.location

	db.add(user)
	db.commit()
	db.refresh(user)
	return user

