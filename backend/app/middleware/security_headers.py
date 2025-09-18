from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.settings import get_settings

settings = get_settings()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy - can be customized based on application needs
        if settings.app_env == "production":
            response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'"
        
        # Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self), payment=()"
        
        return response