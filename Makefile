# RTRWH - Rainwater Harvesting and Groundwater Management System
# Makefile for development and deployment

.PHONY: help install dev build test clean docker-build docker-up docker-down docker-logs

# Default target
help: ## Show this help message
	@echo "RTRWH - Rainwater Harvesting and Groundwater Management System"
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev: ## Start development servers
	@echo "Starting development servers..."
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	sleep 10
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	cd frontend && npm run dev

dev-backend: ## Start only backend development server
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start only frontend development server
	cd frontend && npm run dev

# Testing commands
test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && pytest
	@echo "Running frontend tests..."
	cd frontend && npm test

test-backend: ## Run backend tests only
	cd backend && pytest

test-frontend: ## Run frontend tests only
	cd frontend && npm test

# Build commands
build: ## Build both frontend and backend
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Building backend..."
	cd backend && python -m py_compile app/main.py

build-frontend: ## Build frontend only
	cd frontend && npm run build

build-backend: ## Build backend only
	cd backend && python -m py_compile app/main.py

# Docker commands
docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start all services with Docker Compose
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## Show logs from all services
	docker-compose logs -f

docker-logs-backend: ## Show backend logs
	docker-compose logs -f backend

docker-logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

docker-logs-db: ## Show database logs
	docker-compose logs -f db

# Production commands
prod-build: ## Build production images
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

# Database commands
db-migrate: ## Run database migrations
	cd backend && alembic upgrade head

db-reset: ## Reset database (WARNING: This will delete all data)
	docker-compose down -v
	docker-compose up -d db
	sleep 10
	cd backend && alembic upgrade head

db-shell: ## Connect to database shell
	docker-compose exec db psql -U postgres -d rtrwh

# Utility commands
clean: ## Clean up temporary files and caches
	@echo "Cleaning up..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	cd frontend && rm -rf node_modules/.cache
	cd frontend && rm -rf dist

clean-docker: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Setup commands
setup: ## Initial setup for new environment
	@echo "Setting up RTRWH environment..."
	cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@echo "Then run 'make install' to install dependencies"

setup-dev: ## Setup development environment
	make setup
	make install
	make docker-up
	@echo "Development environment ready!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Health check commands
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:8000/health && echo "Backend: OK" || echo "Backend: FAIL"
	@curl -f http://localhost:5173 && echo "Frontend: OK" || echo "Frontend: FAIL"

# Backup and restore commands
backup-db: ## Backup database
	docker-compose exec db pg_dump -U postgres rtrwh > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database from backup (usage: make restore-db BACKUP_FILE=backup.sql)
	docker-compose exec -T db psql -U postgres rtrwh < $(BACKUP_FILE)

# Monitoring commands
monitor: ## Monitor system resources
	docker stats

# Security commands
security-scan: ## Run security scan
	cd backend && safety check
	cd frontend && npm audit

# Documentation commands
docs: ## Generate documentation
	cd backend && python -m pydoc -w app
	@echo "Documentation generated in backend/"

# Linting commands
lint: ## Run linting on all code
	cd backend && flake8 app/
	cd frontend && npm run lint

lint-fix: ## Fix linting issues
	cd backend && black app/
	cd frontend && npm run lint:fix
