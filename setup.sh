#!/bin/bash

# RTRWH - Rainwater Harvesting and Groundwater Management System
# Setup script for new installations

set -e

echo "🌊 RTRWH - Rainwater Harvesting and Groundwater Management System"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Node.js (for local development)
    if ! command_exists node; then
        print_warning "Node.js is not installed. This is required for local development."
        echo "Visit: https://nodejs.org/"
    fi
    
    # Check Python (for local development)
    if ! command_exists python3; then
        print_warning "Python 3 is not installed. This is required for local development."
        echo "Visit: https://python.org/"
    fi
    
    print_success "System requirements check completed"
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please edit .env file with your configuration before proceeding"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        if command_exists python3; then
            cd backend
            python3 -m venv venv
            source venv/bin/activate
            pip install --upgrade pip
            pip install -r requirements.txt
            cd ..
            print_success "Python dependencies installed"
        else
            print_warning "Python not found, skipping Python dependencies"
        fi
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Installing Node.js dependencies..."
        if command_exists npm; then
            cd frontend
            npm install
            cd ..
            print_success "Node.js dependencies installed"
        else
            print_warning "npm not found, skipping Node.js dependencies"
        fi
    fi
}

# Build Docker images
build_docker() {
    print_status "Building Docker images..."
    
    if docker-compose build; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start database first
    print_status "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 15
    
    # Start all services
    print_status "Starting all services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait a bit for services to start
    sleep 10
    
    # Check backend
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:5173 >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
}

# Show access information
show_access_info() {
    echo ""
    echo "🎉 RTRWH Setup Complete!"
    echo "========================"
    echo ""
    echo "Access your application:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend API: http://localhost:8000"
    echo "  API Documentation: http://localhost:8000/docs"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update services: docker-compose pull && docker-compose up -d"
    echo ""
    echo "For development:"
    echo "  Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    echo "  Frontend: cd frontend && npm run dev"
    echo ""
}

# Main setup function
main() {
    echo "Starting RTRWH setup..."
    echo ""
    
    check_requirements
    setup_env
    install_dependencies
    build_docker
    start_services
    check_health
    show_access_info
    
    print_success "Setup completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "RTRWH Setup Script"
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --dev          Setup for development (install local dependencies)"
        echo "  --prod         Setup for production"
        echo "  --docker-only  Only setup Docker services"
        echo ""
        exit 0
        ;;
    --dev)
        print_status "Setting up development environment..."
        check_requirements
        setup_env
        install_dependencies
        print_success "Development environment setup complete!"
        echo "Run 'make dev' to start development servers"
        ;;
    --prod)
        print_status "Setting up production environment..."
        check_requirements
        setup_env
        build_docker
        start_services
        check_health
        show_access_info
        ;;
    --docker-only)
        print_status "Setting up Docker services only..."
        check_requirements
        setup_env
        build_docker
        start_services
        check_health
        show_access_info
        ;;
    *)
        main
        ;;
esac
