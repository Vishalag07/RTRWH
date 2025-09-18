from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.settings import get_settings
import time
from collections import defaultdict
import threading

settings = get_settings()

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_counts = defaultdict(list)
        self.lock = threading.Lock()

    async def dispatch(self, request: Request, call_next):
        if not settings.enable_rate_limit:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for certain paths if needed
        if request.url.path == "/" or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi"):
            return await call_next(request)

        # Check if client has exceeded rate limit
        with self.lock:
            # Clean up old timestamps
            current_time = time.time()
            self.request_counts[client_ip] = [timestamp for timestamp in self.request_counts[client_ip] 
                                            if current_time - timestamp < settings.rate_limit_timeframe]
            
            # Check if rate limit exceeded
            if len(self.request_counts[client_ip]) >= settings.rate_limit_requests:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Please try again later.",
                        "retry_after": settings.rate_limit_timeframe
                    },
                    headers={
                        "Retry-After": str(settings.rate_limit_timeframe)
                    }
                )
            
            # Add current request timestamp
            self.request_counts[client_ip].append(current_time)

        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers to response
        remaining = settings.rate_limit_requests - len(self.request_counts[client_ip])
        response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(current_time + settings.rate_limit_timeframe))
        
        return response