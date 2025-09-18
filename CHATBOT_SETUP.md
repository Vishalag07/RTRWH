# RTRWH AI Features Setup Instructions

## Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **OpenWeatherMap API Key**: Get your API key from [OpenWeatherMap](https://openweathermap.org/api)
3. **Docker and Docker Compose**: Make sure you have Docker installed

## Environment Setup

Create a `.env` file in the project root with the following content:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=rtrwh

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# OpenWeatherMap Configuration
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Application Configuration
APP_NAME=RTRWH
API_PREFIX=/api
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend Configuration
VITE_API_BASE=http://localhost:8000/api
```

**Important**: Replace the API keys with your actual keys:
- `your_openai_api_key_here` - Your OpenAI API key
- `your_openweather_api_key_here` - Your OpenWeatherMap API key

## Running the Application

1. **Build and start all services**:
   ```bash
   docker-compose build
   docker-compose up
   ```

2. **Access the application**:
   - Frontend (React): http://localhost:3000
   - Backend API: http://localhost:8000
   - Chat page: http://localhost:3000/chat
   - Rain Prediction Dashboard: http://localhost:3000/predict

## API Endpoints

### Chat Endpoints

- **POST** `/api/chat` - Non-streaming chat endpoint
- **POST** `/api/chat/stream` - Streaming chat endpoint (SSE)
- **GET** `/api/chat/health` - Health check

### Rain Prediction Endpoints

- **POST** `/api/rain-prediction/predict` - Generate AI rain prediction
- **GET** `/api/rain-prediction/alerts` - Get active alerts for location
- **POST** `/api/rain-prediction/predictions/{id}/summary` - Create post-rainfall summary
- **GET** `/api/rain-prediction/weather/current` - Get current weather
- **GET** `/api/rain-prediction/weather/forecast` - Get weather forecast
- **POST** `/api/rain-prediction/train-model` - Train prediction model

### Testing with curl

```bash
# Test non-streaming endpoint
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'

# Test streaming endpoint
curl -X POST "http://localhost:8000/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about rainwater harvesting"}' \
  --no-buffer
```

## Features

### Backend (FastAPI)
- ✅ OpenAI GPT-4o-mini integration
- ✅ Server-Sent Events (SSE) for streaming responses
- ✅ Non-streaming fallback mode
- ✅ Pydantic validation
- ✅ Error handling
- ✅ CORS enabled for frontend communication
- ✅ **NEW**: AI-powered rain prediction system
- ✅ **NEW**: OpenWeatherMap API integration
- ✅ **NEW**: LSTM-based rainfall forecasting
- ✅ **NEW**: Intelligent action alerts system
- ✅ **NEW**: Harvest volume calculations
- ✅ **NEW**: Post-rainfall summary reports

### Frontend (React + Vite + Tailwind)
- ✅ Real-time chat interface
- ✅ Streaming response display with typing effect
- ✅ Auto-scroll to latest messages
- ✅ Clean, responsive UI
- ✅ Multi-language support
- ✅ Clear chat functionality
- ✅ **NEW**: Rain prediction dashboard
- ✅ **NEW**: Interactive weather charts
- ✅ **NEW**: Action alerts display
- ✅ **NEW**: Harvest calculations visualization
- ✅ **NEW**: GPS location detection

### Docker
- ✅ Multi-service setup with docker-compose
- ✅ Backend service on port 8000
- ✅ Frontend service on port 3000
- ✅ Database service with PostGIS
- ✅ Environment variable configuration

## Troubleshooting

1. **OpenAI API errors**: Make sure your API key is valid and has credits
2. **CORS errors**: Check that `ALLOWED_ORIGINS` includes your frontend URL
3. **Connection errors**: Ensure all services are running with `docker-compose ps`
4. **Build errors**: Try `docker-compose build --no-cache` to rebuild from scratch

## Development

To run in development mode:

```bash
# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev
```

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for sensitive data in production
- Consider rate limiting for production deployments
- Implement proper authentication for production use
