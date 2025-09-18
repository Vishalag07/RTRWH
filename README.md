## RTRWH-AR Assessment Platform

Full-stack application for on-spot assessment of Rooftop Rainwater Harvesting (RTRWH) and Artificial Recharge (AR) potential with premium UI, smooth animations, and enhanced security.

### Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts + i18next + Framer Motion
- Backend: FastAPI (Python), SQLAlchemy, PostGIS (PostgreSQL), JWT Auth, Security Middleware
- Database: PostgreSQL with PostGIS
- Deploy: Docker + GitHub Actions

### Quick Start (Docker)
1. Copy `.env.example` to `.env` and review values
2. Build & start
```
docker compose up -d --build
```
3. Open:
   - API: http://localhost:8000/docs
   - Web: http://localhost:5173

### Structure
```
frontend/      # React app
backend/       # FastAPI app
shared/        # Shared assets/config (if any)
docker-compose.yml
```

### High-level Features
- Field data capture: user, location, dwellers, rooftop area, open space
- GIS integrations: rainfall, aquifer, groundwater depth
- Calculators: runoff, structure recommendation, sizing, costs, benefit
- Outputs: charts, summary, downloadable PDF report
- Auth: JWT login, saved assessments, shareable links
- Premium UI: Dark/light mode toggle, smooth page transitions, consistent theming
- Enhanced Security: Proper CORS configuration, security headers, rate limiting

### Notes
- This repository includes seed endpoints and domain utilities with extensive comments for hydrology/GIS logic.
- Replace API keys and datasets as needed for your region and cloud provider.

### Testing
Run the test script to verify the application's functionality:

```bash
pip install requests colorama
python test_app.py
```

This will test:
- Backend connectivity
- CORS configuration
- Security headers
- Rate limiting
- Open the frontend in your browser

### Premium Components
The application includes premium styled components:

- Button: Multiple variants and sizes with animations
- Card: Themed cards with motion effects
- Input: Various styles with validation states
- LoadingSpinner: Multiple animation types
- PageTransition: Smooth transitions between routes


