# RTRWH - Rainwater Harvesting and Groundwater Management System

A comprehensive web application for rainwater harvesting assessment, groundwater management, and environmental monitoring with 3D visualizations and real-time data integration.

## 🌟 Features

### Core Functionality
- **Rainwater Harvesting Assessment**: Complete evaluation of rainwater harvesting potential
- **Groundwater Management**: Real-time groundwater level monitoring and analysis
- **3D Aquifer Visualization**: Interactive 3D models of groundwater systems
- **2D Animation System**: Educational animations showing water flow processes
- **GIS Integration**: Interactive maps with soil type overlays and location-based data
- **Weather Integration**: NASA Power API integration for weather data
- **AI Chatbot**: Intelligent assistant for water management guidance

### Technical Features
- **Real-time Data**: Live groundwater data from multiple sources
- **Multi-language Support**: Support for 10+ Indian languages
- **Responsive Design**: Mobile-first responsive interface
- **Progressive Web App**: PWA capabilities for offline usage
- **Voice Assistant**: Voice-controlled interface
- **Gamification**: Achievement system and progress tracking

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL with PostGIS extension

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RTRWH
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT-based authentication
- **API**: RESTful API with automatic documentation
- **External APIs**: NASA Power, CGWB, OpenAI

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js with React Three Fiber
- **Maps**: Leaflet with React Leaflet
- **State Management**: Zustand
- **Animation**: Framer Motion

### Database Schema
- **Users**: Authentication and user management
- **Assessments**: Rainwater harvesting assessments
- **Groundwater Data**: Real-time groundwater monitoring
- **Soil Data**: Soil type and property information
- **Weather Data**: Historical and forecast weather data

## 📁 Project Structure

```
RTRWH/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── routers/        # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Custom middleware
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Multi-container setup
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=rtrwh
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/rtrwh

# Backend
SECRET_KEY=your-secret-key-here
API_V1_STR=/api/v1
DEBUG=true

# Frontend
VITE_API_BASE=http://localhost:8000/api
VITE_APP_NAME=RTRWH

# External APIs (Optional)
OPENAI_API_KEY=your-openai-api-key
NASA_POWER_API_KEY=your-nasa-power-api-key
```

### Docker Configuration

The application uses Docker Compose for orchestration:

- **Database**: PostgreSQL with PostGIS
- **Backend**: FastAPI with Python 3.11
- **Frontend**: React with Node.js 20
- **Networking**: Custom bridge network
- **Volumes**: Persistent data storage
- **Health Checks**: Automatic service health monitoring

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 API Documentation

The API documentation is automatically generated and available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

- `GET /api/v1/groundwater/info` - Get groundwater data
- `POST /api/v1/assessments/` - Create new assessment
- `GET /api/v1/weather/current` - Get current weather
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/soil/types` - Get soil type data

## 🚀 Deployment

### Production Deployment

1. **Update environment variables for production**
2. **Build and deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy (Nginx)**
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

### Cloud Deployment

The application is designed to be cloud-ready and can be deployed on:
- AWS (ECS, EKS, EC2)
- Google Cloud Platform (GKE, Cloud Run)
- Azure (Container Instances, AKS)
- DigitalOcean (App Platform, Droplets)

## 🔒 Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **CORS**: Configurable CORS policies
- **Rate Limiting**: API rate limiting
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **XSS Protection**: React's built-in XSS protection

## 📈 Performance

- **Frontend**: Code splitting and lazy loading
- **Backend**: Async/await for I/O operations
- **Database**: Optimized queries and indexing
- **Caching**: Redis caching (optional)
- **CDN**: Static asset delivery
- **Compression**: Gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Core rainwater harvesting assessment
- 3D groundwater visualization
- Real-time data integration
- Multi-language support
- PWA capabilities

## 🙏 Acknowledgments

- NASA Power API for weather data
- Central Ground Water Board (CGWB) for groundwater data
- OpenStreetMap for mapping data
- Three.js community for 3D graphics
- React and FastAPI communities

---

**Built with ❤️ for sustainable water management**