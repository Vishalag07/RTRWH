# RTRWH Deployment Guide

This guide covers various deployment scenarios for the RTRWH (Rainwater Harvesting and Groundwater Management System) application.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Basic knowledge of command line

### One-Command Setup
```bash
# Clone the repository
git clone <repository-url>
cd RTRWH

# Run setup script
./setup.sh  # Linux/Mac
# or
setup.bat   # Windows
```

## 🐳 Docker Deployment

### Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏗️ Local Development Setup

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)
1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name rtrwh-cluster
   ```

2. **Create Task Definition**
   - Use the provided `aws-task-definition.json`
   - Update environment variables
   - Configure resource limits

3. **Create Service**
   ```bash
   aws ecs create-service \
     --cluster rtrwh-cluster \
     --service-name rtrwh-service \
     --task-definition rtrwh-task \
     --desired-count 1
   ```

#### Using EKS (Elastic Kubernetes Service)
1. **Create EKS Cluster**
   ```bash
   eksctl create cluster --name rtrwh-cluster --region us-west-2
   ```

2. **Deploy with Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

### Google Cloud Platform

#### Using Cloud Run
1. **Build and push images**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/rtrwh-backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/rtrwh-frontend
   ```

2. **Deploy services**
   ```bash
   gcloud run deploy rtrwh-backend --image gcr.io/PROJECT_ID/rtrwh-backend
   gcloud run deploy rtrwh-frontend --image gcr.io/PROJECT_ID/rtrwh-frontend
   ```

#### Using GKE (Google Kubernetes Engine)
1. **Create GKE cluster**
   ```bash
   gcloud container clusters create rtrwh-cluster --zone us-central1-a
   ```

2. **Deploy application**
   ```bash
   kubectl apply -f k8s/
   ```

### Azure Deployment

#### Using Container Instances
1. **Create resource group**
   ```bash
   az group create --name rtrwh-rg --location eastus
   ```

2. **Deploy containers**
   ```bash
   az container create \
     --resource-group rtrwh-rg \
     --name rtrwh-backend \
     --image your-registry/rtrwh-backend \
     --ports 8000
   ```

#### Using AKS (Azure Kubernetes Service)
1. **Create AKS cluster**
   ```bash
   az aks create --resource-group rtrwh-rg --name rtrwh-cluster
   ```

2. **Deploy application**
   ```bash
   kubectl apply -f k8s/
   ```

## 🔧 Configuration

### Environment Variables

#### Required Variables
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=rtrwh
DATABASE_URL=postgresql+psycopg://user:password@host:port/db

# Backend
SECRET_KEY=your-secret-key-here
API_V1_STR=/api/v1
DEBUG=false

# Frontend
VITE_API_BASE=https://your-api-domain.com/api
VITE_APP_NAME=RTRWH
```

#### Optional Variables
```bash
# External APIs
OPENAI_API_KEY=your-openai-key
NASA_POWER_API_KEY=your-nasa-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (for caching)
REDIS_URL=redis://your-redis-host:6379/0
```

### SSL/TLS Configuration

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration
sudo nano /etc/nginx/sites-available/rtrwh
```

#### Using Cloudflare
1. Add your domain to Cloudflare
2. Enable SSL/TLS encryption
3. Configure DNS records
4. Update environment variables

## 📊 Monitoring and Logging

### Application Monitoring
- **Health Checks**: Built-in health endpoints
- **Metrics**: Prometheus metrics (optional)
- **Logging**: Structured logging with JSON format

### Database Monitoring
- **Connection Pooling**: Configured in SQLAlchemy
- **Query Monitoring**: Enable slow query logging
- **Backup**: Automated daily backups

### Infrastructure Monitoring
- **Resource Usage**: CPU, Memory, Disk
- **Network**: Traffic and latency monitoring
- **Security**: Intrusion detection and logging

## 🔒 Security Considerations

### Application Security
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation
- **CORS**: Configurable CORS policies
- **Rate Limiting**: API rate limiting

### Infrastructure Security
- **Network Security**: VPC and security groups
- **SSL/TLS**: End-to-end encryption
- **Secrets Management**: Environment variables
- **Firewall**: Restrictive firewall rules
- **Updates**: Regular security updates

### Data Security
- **Encryption**: Data encryption at rest and in transit
- **Backup**: Encrypted backups
- **Access Control**: Database access restrictions
- **Audit Logging**: Comprehensive audit trails

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose logs db

# Test database connection
docker-compose exec backend python -c "from app.db import engine; print(engine.execute('SELECT 1').fetchone())"
```

#### Frontend Build Issues
```bash
# Clear npm cache
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Backend Import Issues
```bash
# Check Python path
cd backend
python -c "import sys; print(sys.path)"

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Performance Issues

#### High Memory Usage
- Increase container memory limits
- Optimize database queries
- Enable Redis caching
- Implement connection pooling

#### Slow Response Times
- Enable gzip compression
- Optimize static assets
- Use CDN for static files
- Implement database indexing

### Log Analysis
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View database logs
docker-compose logs -f db

# Search for errors
docker-compose logs | grep -i error
```

## 📈 Scaling

### Horizontal Scaling
- **Load Balancer**: Configure load balancer
- **Multiple Instances**: Run multiple container instances
- **Database Replication**: Set up read replicas
- **Caching**: Implement Redis clustering

### Vertical Scaling
- **Resource Limits**: Increase CPU and memory
- **Database Optimization**: Optimize database configuration
- **Connection Pooling**: Configure connection pools
- **Caching**: Implement application-level caching

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U postgres rtrwh > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U postgres rtrwh < backup.sql
```

### Application Backup
```bash
# Backup application data
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/ logs/

# Backup configuration
cp .env .env.backup
```

### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Frequency**: Daily
4. **Testing**: Monthly recovery tests

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and README.md
- **Issues**: Create GitHub issues
- **Community**: Join our community forum
- **Professional Support**: Contact our support team

### Useful Commands
```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Update services
docker-compose pull
docker-compose up -d
```

---

**For additional support, please refer to the main README.md or contact the development team.**
