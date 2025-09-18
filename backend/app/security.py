from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.settings import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user_email(token: str = Depends(oauth2_scheme)) -> str:
    # TEMPORARY: Disable authentication for development/testing
    # Skip token validation and return test user email
    try:
        # Try to decode token if it exists, but don't fail if it's invalid
        if token and token != "null" and token != "undefined":
            payload = decode_token(token)
            return payload.get("sub", "testuser@example.com")
    except:
        # If token is invalid or missing, return test user for development
        pass
    return "testuser@example.com"
