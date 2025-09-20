# 🌧️ RTRWH-AR Assessment Platform

A comprehensive full-stack application for on-spot assessment of **Rooftop Rainwater Harvesting (RTRWH)** and **Artificial Recharge (AR)** potential with premium UI, smooth animations, and enhanced security.

![RTRWH-AR Platform](https://img.shields.io/badge/Platform-RTRWH--AR-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.112.2-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

## 🚀 Features

### 🏠 **Assessment & Analysis**
- **Field Data Capture**: User location, dwellers, rooftop area, open space analysis
- **GIS Integration**: Real-time rainfall, aquifer, and groundwater depth data
- **Smart Calculators**: Runoff estimation, structure recommendations, sizing, costs, and benefits
- **AI-Powered Predictions**: LSTM-based rainfall forecasting with confidence scoring

### 🎨 **Premium User Experience**
- **3D Visualization**: Interactive aquifer and groundwater depth visualization using Three.js
- **Responsive Design**: Modern UI with dark/light mode toggle
- **Smooth Animations**: Framer Motion powered page transitions and micro-interactions
- **Multi-language Support**: 11 Indian languages including Hindi, Bengali, Gujarati, Tamil, Telugu, and more

### 📊 **Advanced Analytics**
- **Real-time Charts**: Interactive data visualization with Recharts
- **PDF Reports**: Downloadable assessment reports with detailed analysis
- **Gamification**: Points, badges, and leaderboard system
- **AI Chat Assistant**: OpenAI-powered chat for user guidance

### 🔒 **Enterprise Security**
- **JWT Authentication**: Secure user authentication and authorization
- **Rate Limiting**: API request throttling and abuse prevention
- **Security Headers**: CORS, CSP, HSTS, and other security measures
- **Data Validation**: Comprehensive input validation with Pydantic

## 🛠️ Tech Stack

### **Frontend**
- **React 18.3.1** with TypeScript - Modern UI framework
- **Vite 5.4.3** - Lightning-fast build tool
- **TailwindCSS 3.4.10** - Utility-first styling
- **Three.js 0.153.0** - 3D graphics and visualization
- **Framer Motion 11.0.17** - Advanced animations
- **Leaflet 1.9.4** - Interactive maps
- **Recharts 2.12.7** - Data visualization
- **i18next 25.4.1** - Internationalization

### **Backend**
- **FastAPI 0.112.2** - Modern Python web framework
- **SQLAlchemy 2.0.35** - Database ORM
- **PostgreSQL 16** with **PostGIS** - Spatial database
- **Pydantic 2.9.0** - Data validation
- **JWT Authentication** - Secure user management
- **Scikit-learn 1.3.0** - Machine learning algorithms

### **DevOps & Infrastructure**
- **Docker & Docker Compose** - Containerization
- **Multi-stage builds** - Optimized production images
- **Health checks** - Service monitoring
- **Volume persistence** - Data durability

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (recommended) or Python 3.13
- **Node.js 18+** and npm
- **Docker and Docker Compose** (optional, for containerized deployment)
- **Git**

### Option 1: Docker Deployment (Recommended)
```bash
# 1. Clone the repository
git clone <repository-url>
cd RTRWH

# 2. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker compose up -d --build

# 4. View logs
docker compose logs -f
```

### Option 2: Local Development Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd RTRWH

# 2. Backend setup
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install

# 4. Start backend (in one terminal)
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000

# 5. Start frontend (in another terminal)
cd frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000 (Docker) or http://localhost:5173 (Local)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (Docker only)

## 📁 Project Structure

```
RTRWH/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route-based pages
│   │   ├── services/       # API clients and services
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── locales/        # Internationalization files
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── routers/        # API endpoint definitions
│   │   ├── services/       # Business logic and algorithms
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Data validation schemas
│   │   ├── middleware/     # Custom middleware
│   │   └── security.py     # Authentication logic
│   ├── requirements.txt    # Backend dependencies
│   └── Dockerfile         # Backend container config
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # This file
```

## 🧮 Key Algorithms

### **Rainfall Prediction**
- **LSTM Neural Network** with 24-hour sequence input
- **Feature Engineering**: Temperature, humidity, pressure, wind, cloud cover
- **Confidence Scoring**: Weather pattern analysis
- **Fallback System**: Rule-based prediction when ML model unavailable

### **Hydrological Calculations**
```python
# Runoff estimation
runoff_liters = annual_rainfall_mm × roof_area_m2 × runoff_coefficient

# Structure recommendation algorithm
if groundwater_depth < 5m and open_space >= 20m²: recommend "trench"
elif roof_area < 120m²: recommend "pit"
elif roof_area >= 300m² and depth >= 10m: recommend "recharge_well"
else: recommend "shaft"
```

### **3D Visualization**
- **Real-time Water Animation**: Sine wave-based surface simulation
- **Performance Optimization**: LOD system, frustum culling, material optimization
- **Interactive Elements**: Hover effects, selection highlighting, tooltips

### **Cost-Benefit Analysis**
```python
# Economic calculations
capex = base_cost + (per_liter_cost × storage_liters / 1000)
opex = 0.02 × capex  # 2% annual maintenance
payback_years = capex / (water_savings_liters_per_year / 1000)
```

## 🔧 Development

### **Frontend Development**
```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run preview      # Preview production build
```

### **Backend Development**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Database Management**
```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "Description"
```

## 🧪 Testing

### **Run Test Suite**
```bash
# Test the complete application
pip install requests colorama
python test_app.py

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && python -m pytest
```

### **Test Coverage**
- ✅ Backend connectivity
- ✅ CORS configuration
- ✅ Security headers
- ✅ Rate limiting
- ✅ Authentication flow
- ✅ API endpoints
- ✅ Frontend components

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Python 3.13 Compatibility Issues**
```bash
# Error: numpy==1.24.3 not compatible with Python 3.13
# Solution: Updated requirements.txt with compatible versions
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

#### **Backend Import Errors**
```bash
# Error: Cannot import 'setuptools.build_meta'
# Solution: Upgrade build tools
pip install --upgrade pip setuptools wheel

# Error: ModuleNotFoundError for numpy/pandas
# Solution: Install with compatible versions
pip install "numpy>=1.26.0" "pandas>=2.1.0"
```

#### **Frontend Build Issues**
```bash
# Error: Node modules not found
# Solution: Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install

# Error: Vite build fails
# Solution: Check Node.js version (requires 18+)
node --version
npm --version

# Error: Dynamic import failed - port mismatch
# Solution: Clear cache and restart
cd frontend
Remove-Item -Recurse -Force dist, node_modules\.vite -ErrorAction SilentlyContinue
npm run dev

# Error: Port 3000 conflicts with Vite (uses 5173)
# Solution: Kill conflicting processes
netstat -ano | findstr :3000
taskkill /F /PID <PID_NUMBER>
```

#### **Docker Build Issues**
```bash
# Error: pip install timeout during Docker build
# Solution: Use optimized Dockerfile with retry logic
docker build --no-cache -t rtrwh-backend ./backend

# Error: Network timeout downloading packages
# Solution: Increase timeout and use retry logic
export PIP_TIMEOUT=300
export PIP_DEFAULT_TIMEOUT=300
docker compose build --no-cache

# Error: Build context too large
# Solution: Use .dockerignore to reduce context
# Check .dockerignore file exists in backend/

# Error: Multi-stage build fails
# Solution: Build with verbose output
docker build --progress=plain -t rtrwh-backend ./backend
```

#### **Database Connection Issues**
```bash
# Error: PostgreSQL connection failed
# Solution: Check Docker services
docker compose ps
docker compose logs db

# Error: Database not found
# Solution: Initialize database
docker compose exec backend alembic upgrade head
```

#### **Port Conflicts**
```bash
# Error: Port 8000 already in use
# Solution: Use different port
uvicorn app.main:app --reload --port 8001

# Error: Port 3000 already in use
# Solution: Use different port
npm run dev -- --port 3001
```

#### **API Connection Issues**
```bash
# Error: CORS policy blocks requests
# Solution: Check allowed origins in settings.py
# Update ALLOWED_ORIGINS with your frontend URL

# Error: Rate limit exceeded
# Solution: Wait or increase limits in settings.py
# Set RATE_LIMIT_REQUESTS to higher value
```

## 🌐 API Documentation

### **Core Endpoints**
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments` - List user assessments
- `GET /api/assessments/{id}` - Get specific assessment
- `POST /api/auth/login` - User authentication
- `GET /api/rain-prediction` - Rainfall forecasting
- `GET /api/gis/rainfall` - Historical rainfall data
- `GET /api/aquifer` - Aquifer information

### **Interactive Documentation**
Visit http://localhost:8000/docs for complete API documentation with interactive testing.

## 🔐 Security Features

- **JWT Authentication** with configurable expiration
- **Rate Limiting** (100 requests/minute per IP)
- **CORS Protection** with configurable origins
- **Security Headers** (CSP, HSTS, X-Frame-Options)
- **Input Validation** with Pydantic schemas
- **SQL Injection Protection** via SQLAlchemy ORM
- **Password Hashing** with bcrypt

## 🌍 Internationalization

Supported languages:
- **Hindi** (हिन्दी)
- **Bengali** (বাংলা)
- **Gujarati** (ગુજરાતી)
- **Kannada** (ಕನ್ನಡ)
- **Malayalam** (മലയാളം)
- **Marathi** (मराठी)
- **Odia** (ଓଡ଼ିଆ)
- **Punjabi** (ਪੰਜਾਬੀ)
- **Tamil** (தமிழ்)
- **Telugu** (తెలుగు)
- **English** (Default)

## 📊 Performance Optimization

### **Frontend**
- **Code Splitting** with lazy loading
- **Bundle Optimization** with vendor chunking
- **Asset Compression** (Brotli + Gzip)
- **3D Performance Modes** for low-end devices
- **Image Optimization** and lazy loading

### **Backend**
- **Database Indexing** for spatial queries
- **Connection Pooling** for PostgreSQL
- **Async/Await** for non-blocking operations
- **Caching Strategies** for external API calls
- **Response Compression** for large datasets

## 🚀 Deployment

### **Production Deployment**
```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Deploy to production
docker compose -f docker-compose.prod.yml up -d
```

### **Environment Variables**
```bash
# Database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=rtrwh

# API Keys
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
OPENWEATHER_API_KEY=your_openweather_key

# Security
SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure responsive design
- Test across multiple browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA POWER API** for weather and soil data
- **OpenWeather** for meteorological data
- **PostGIS** for spatial database capabilities
- **Three.js** community for 3D graphics
- **React** and **FastAPI** communities for excellent frameworks

## 📞 Support

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@rtrwh-platform.com

## 🔮 Roadmap

### **Upcoming Features**
- [ ] **Mobile App** (React Native)
- [ ] **Advanced ML Models** for better predictions
- [ ] **Real-time Monitoring** with IoT integration
- [ ] **Blockchain Integration** for data integrity
- [ ] **AR/VR Visualization** for immersive experience
- [ ] **Community Features** for knowledge sharing

### **Performance Improvements**
- [ ] **Edge Computing** for faster response times
- [ ] **CDN Integration** for global content delivery
- [ ] **Advanced Caching** strategies
- [ ] **Database Sharding** for scalability

---

<div align="center">

**Built with ❤️ for sustainable water management**

[🌐 Website](https://rtrwh-platform.com) • [📚 Documentation](https://docs.rtrwh-platform.com) • [🐛 Report Bug](https://github.com/your-org/RTRWH/issues) • [💡 Request Feature](https://github.com/your-org/RTRWH/issues)

</div>