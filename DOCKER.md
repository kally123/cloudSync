# Docker Quick Reference Guide

## ⚠️ Security First!

Before running in production, **YOU MUST**:
1. Create a `.env` file from `.env.example`
2. Set `JWT_SECRET` to a strong random value (app will fail to start without it!)
3. Set `POSTGRES_PASSWORD` to a secure password

Generate a secure JWT secret:
```bash
openssl rand -base64 64
```

Example `.env` file:
```env
JWT_SECRET=your-generated-secret-here
POSTGRES_PASSWORD=your-secure-database-password
```

## Quick Start

### Production (Recommended)
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Development (with hot-reload)
```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Stop (Ctrl+C or in another terminal)
docker compose -f docker-compose.dev.yml down
```

## Common Commands

### Service Management
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart a service
docker compose restart backend

# View running containers
docker compose ps

# View logs
docker compose logs -f [service_name]
```

### Building
```bash
# Build images
docker compose build

# Rebuild without cache
docker compose build --no-cache

# Build specific service
docker compose build backend
```

### Data Management
```bash
# Remove all data (WARNING: destructive)
docker compose down -v

# Backup database
docker compose exec postgres pg_dump -U cloudsync cloudsync > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U cloudsync cloudsync
```

### Troubleshooting
```bash
# View service logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Access container shell
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec postgres psql -U cloudsync cloudsync

# Check service health
docker compose ps

# Inspect a service
docker compose exec backend env
```

## Environment Variables

Create a `.env` file in the project root:

```env
# JWT Secret (REQUIRED - change in production!)
JWT_SECRET=your-super-secret-jwt-key-here

# Database credentials
POSTGRES_DB=cloudsync
POSTGRES_USER=cloudsync
POSTGRES_PASSWORD=your-secure-password-here

# API URL for frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Port Mappings

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| Frontend | 3000 | 3000 | Next.js web application |
| Backend | 8080 | 8080 | Spring Boot API |
| PostgreSQL | 5432 | 5432 | Database |

## Volume Mappings

| Volume | Purpose | Path in Container |
|--------|---------|-------------------|
| postgres_data | Database data | /var/lib/postgresql/data |
| backend_storage | File uploads | /app/storage |
| backend_data | H2 database files | /app/data |

## Health Checks

All services have health checks configured:

- **PostgreSQL**: Ready to accept connections
- **Backend**: API documentation endpoint accessible
- **Frontend**: Web server responding

## Production Deployment Checklist

- [ ] Change JWT_SECRET in .env file
- [ ] Change POSTGRES_PASSWORD in .env file
- [ ] Configure reverse proxy (Nginx/Traefik)
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Review and adjust resource limits
- [ ] Configure firewall rules

## Development Workflow

1. Make code changes in `frontend/` or `backend/`
2. With dev compose: Changes are automatically detected
3. With prod compose: Rebuild the specific service
   ```bash
   docker compose build backend
   docker compose up -d backend
   ```

## Useful Tips

- Use `docker compose logs -f --tail=100 backend` to see last 100 lines
- Use `docker compose exec` to run commands in containers
- Use `docker compose down -v` to completely reset (loses all data!)
- Services depend on each other, so startup order is automatic
- Health checks ensure services are fully ready before dependents start
