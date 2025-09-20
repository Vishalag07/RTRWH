@echo off
REM RTRWH - Rainwater Harvesting and Groundwater Management System
REM Setup script for Windows

echo 🌊 RTRWH - Rainwater Harvesting and Groundwater Management System
echo ==================================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/install/
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose is not available. Please install Docker Compose.
        pause
        exit /b 1
    )
)

echo [INFO] System requirements check completed

REM Setup environment file
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo [SUCCESS] Created .env file from .env.example
        echo [WARNING] Please edit .env file with your configuration before proceeding
    ) else (
        echo [ERROR] .env.example file not found
        pause
        exit /b 1
    )
) else (
    echo [WARNING] .env file already exists, skipping creation
)

REM Install Python dependencies
if exist backend\requirements.txt (
    echo [INFO] Installing Python dependencies...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo [SUCCESS] Python dependencies installed
)

REM Install Node.js dependencies
if exist frontend\package.json (
    echo [INFO] Installing Node.js dependencies...
    cd frontend
    npm install
    cd ..
    echo [SUCCESS] Node.js dependencies installed
)

REM Build Docker images
echo [INFO] Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    exit /b 1
)
echo [SUCCESS] Docker images built successfully

REM Start services
echo [INFO] Starting services...
echo [INFO] Starting database...
docker-compose up -d db

echo [INFO] Waiting for database to be ready...
timeout /t 15 /nobreak >nul

echo [INFO] Starting all services...
docker-compose up -d

echo [SUCCESS] Services started successfully

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

REM Check backend
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is healthy
) else (
    echo [WARNING] Backend health check failed
)

REM Check frontend
curl -f http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend is healthy
) else (
    echo [WARNING] Frontend health check failed
)

echo.
echo 🎉 RTRWH Setup Complete!
echo ========================
echo.
echo Access your application:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo   API Documentation: http://localhost:8000/docs
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Update services: docker-compose pull ^&^& docker-compose up -d
echo.
echo For development:
echo   Backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo   Frontend: cd frontend ^&^& npm run dev
echo.

echo [SUCCESS] Setup completed successfully!
pause
