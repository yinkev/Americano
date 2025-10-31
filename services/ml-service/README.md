# ML Prediction Service

FastAPI microservice providing ML-powered struggle prediction and behavioral analytics for Americano.

## Local Development (No Cost - Everything Runs on Your Machine)

### First Time Setup

#### 1. Clone and Navigate
```bash
cd services/ml-service
```

#### 2. Create Virtual Environment
```bash
python -m venv venv
```

#### 3. Activate Virtual Environment
- **macOS/Linux:**
```bash
source venv/bin/activate
```

- **Windows (PowerShell):**
```bash
.\venv\Scripts\Activate.ps1
```

- **Windows (Command Prompt):**
```bash
venv\Scripts\activate
```

#### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

#### 6. Generate Prisma Client
```bash
prisma generate
```

### Running the Service

#### Option 1: Full Stack (Recommended for Development)
Run from the root directory to start both Next.js and FastAPI:
```bash
npm run dev
```

This will start:
- Next.js on http://localhost:3000
- FastAPI on http://localhost:8000

Next.js automatically proxies API traffic to the ML service when the
`ML_SERVICE_URL` environment variable is set (see below).

#### Option 2: ML Service Only
```bash
cd services/ml-service
source venv/bin/activate  # or your platform's activation command
uvicorn app.main:app --reload --port 8000
```

#### Option 3: Using npm scripts
```bash
npm run dev:ml-only
```

### Running with Next.js (`next dev`)

To exercise the mock endpoints from the web application, run the ML service
and `next dev` side-by-side:

1. **Terminal A – FastAPI**
   ```bash
   cd services/ml-service
   source venv/bin/activate  # optional but recommended
   uvicorn app.main:app --reload --port 8000
   ```

2. **Terminal B – Next.js**
   ```bash
   cd apps/web
   ML_SERVICE_URL=http://localhost:8000 next dev
   ```

   Alternatively, create or update `apps/web/.env.local`:
   ```bash
   ML_SERVICE_URL=http://localhost:8000
   ```
   and simply run `next dev`.

When `ML_SERVICE_URL` is defined, the Next.js API routes proxy requests to the
FastAPI instance. Remove or change this variable to switch back to any future
live endpoints.

## Service Endpoints

### Interactive API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

### Health Check
```bash
curl http://localhost:8000/health
```

### Core Endpoints
See the interactive API documentation at `/docs` for full endpoint details and request/response schemas.

## Architecture

### Service Details
- **Port:** 8000 (local development)
- **Framework:** FastAPI
- **Database:** PostgreSQL (shared with Next.js app)
- **Python Version:** 3.11+
- **CORS Configuration:** Allows localhost:3000 and localhost:3000

### Project Structure
```
services/ml-service/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── routes/              # API route handlers
│   ├── models/              # Pydantic models (request/response schemas)
│   ├── services/            # Business logic and ML services
│   └── config.py            # Configuration management
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Key Features

### Struggle Prediction
ML models that identify students at risk of struggle based on behavioral patterns and learning data.

### Behavioral Analytics
Real-time analysis of student engagement patterns and learning behaviors.

### Intervention Recommendations
Evidence-based recommendations for educational interventions based on prediction models.

### Performance Tracking
Continuous monitoring of model performance and prediction accuracy.

## Database

The ML service shares the same PostgreSQL database as the Next.js application. Ensure the database is running and accessible via the connection string in your `.env` file.

### Prisma Integration
- Prisma Client is used for database queries
- Database schema is shared with the web application
- Migrations are managed from the web app

```bash
# Generate Prisma Client after schema changes
prisma generate

# View database (from apps/web)
cd apps/web
npx prisma studio
```

## Development Workflow

### 1. Starting Development
```bash
# From root
npm run dev

# Or just ML service
npm run dev:ml-only
```

### 2. Making Changes
- Edit files in `services/ml-service/app/`
- FastAPI will auto-reload on changes (--reload flag)
- Check API at http://localhost:8000/docs

### 3. Testing
```bash
cd services/ml-service
source venv/bin/activate
pytest
```

### 4. Debugging
- **VSCode:** Use the "FastAPI" launch configuration in Debug menu
- **Console Logs:** FastAPI logs print to terminal where uvicorn is running
- **Interactive Docs:** Use http://localhost:8000/docs to test endpoints

## Troubleshooting

### Virtual Environment Issues
**Problem:** `command not found: python` or wrong Python version
```bash
# Check Python version
python --version  # Should be 3.11 or higher

# If using pyenv
pyenv install 3.11.0
pyenv local 3.11.0
```

### Port Already in Use
**Problem:** `Address already in use: ('127.0.0.1', 8000)`
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Database Connection Failed
**Problem:** `psycopg2.OperationalError: could not connect to server`
```bash
# Verify database is running
# Update DATABASE_URL in .env
# Check connection string format: postgresql://user:password@localhost:5432/dbname
```

### Module Import Errors
**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Prisma Generation Issues
**Problem:** `error: Error validating datasource ... the environment variable DATABASE_URL is not set`
```bash
# Ensure .env file exists with DATABASE_URL
cat .env | grep DATABASE_URL

# If using .env, ensure it's loaded
export $(cat .env | xargs)
prisma generate
```

## Environment Variables

Required environment variables (see `.env.example`):

```
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev

# FastAPI Configuration
FASTAPI_ENV=development
DEBUG=true

# Optional: External Services
# OPENAI_API_KEY=...
# GEMINI_API_KEY=...
```

## Performance Tips

### Development Setup
- Use `--reload` flag for auto-restart on code changes
- Disable in production with `--reload` removed
- For large projects, use `--reload-dirs` to limit watch scope

### Database
- Keep database indexes optimized
- Use connection pooling in production
- Monitor query performance with slowlog

## Common Commands

```bash
# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Generate Prisma Client
prisma generate

# Start dev server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
black .

# Lint code
flake8

# Type checking
mypy .
```

## Next Steps

1. Read the [Integration Guide](../../apps/web/src/ml/INTEGRATION_GUIDE.md) for how the ML service integrates with the web app
2. Review the [API Documentation](http://localhost:8000/docs) after starting the service
3. Check the [main.py](./app/main.py) file to understand the service structure
4. Look at [example_usage.py](../../apps/web/src/ml/example_usage.py) for usage patterns

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review environment variables (ensure .env is configured)
3. Check that database is running and accessible
4. Verify Python version is 3.11+
5. Ensure virtual environment is activated

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Prisma Python Client](https://prisma-client-py.readthedocs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Created for Americano Epic 5: Behavioral Twin Engine**
