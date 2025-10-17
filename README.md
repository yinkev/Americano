# Americano - AI-Powered Medical Education Platform

An adaptive learning platform for medical students powered by AI, behavioral analytics, and personalized interventions.

## Quick Start: One Command to Rule Them All

```bash
npm run dev
```

This single command starts:
- Next.js frontend on http://localhost:3000
- FastAPI ML service on http://localhost:8000

That's it! No cost, everything runs locally on your machine.

## Full Setup (First Time Only)

### Prerequisites

Verify you have the required versions installed:

```bash
node --version    # Should be 20.0.0 or higher
npm --version     # Should be 10.0.0 or higher
python --version  # Should be 3.11.0 or higher
```

### 1. Install Node Dependencies

```bash
npm install
```

This installs the root-level scripts and prepares the monorepo.

### 2. Setup Web Application

```bash
cd apps/web

# Install web app dependencies
npm install

# Setup Prisma (database schema client)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Optional: Seed database with sample data
npm run seed
```

### 3. Setup ML Service

```bash
cd ../../services/ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# .\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt

# Setup environment file
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client for Python
prisma generate
```

### 4. Return to Root

```bash
cd ../../
```

## Running Services

### Development Mode (Recommended)

```bash
npm run dev
```

**This starts both services simultaneously:**
- Next.js: http://localhost:3000
- FastAPI: http://localhost:8000 (API Docs: http://localhost:8000/docs)

### Individual Services

**Next.js Only:**
```bash
npm run dev:web-only
```

**ML Service Only:**
```bash
npm run dev:ml-only
```

## Checking Service Status

Verify both services are running:

```bash
npm run health-check
```

Expected output:
```
Checking Next.js...
✓ Next.js running
Checking FastAPI...
✓ FastAPI running
```

## Project Structure

```
Americano-epic5/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/           # App Router pages and API routes
│       │   ├── components/    # React components
│       │   ├── lib/           # Utilities and helpers
│       │   └── ml/            # ML model implementations
│       ├── prisma/
│       │   └── schema.prisma  # Database schema
│       └── package.json       # Web app dependencies
│
├── services/
│   ├── ml-service/            # FastAPI ML service
│   │   ├── app/
│   │   │   ├── main.py       # FastAPI app entry point
│   │   │   ├── routes/       # API routes
│   │   │   ├── models/       # Pydantic schemas
│   │   │   └── services/     # Business logic
│   │   ├── requirements.txt  # Python dependencies
│   │   └── README.md         # ML service setup guide
│   │
│   ├── ocr-service/          # OCR document processing
│   └── chatmock/             # ChatMock API wrapper
│
├── scripts/                  # Setup and utility scripts
├── docs/                     # Project documentation
├── package.json             # Root monorepo configuration
└── README.md               # This file
```

## Key Features

### 1. Adaptive Learning
- AI-powered content recommendations
- Real-time learning progress tracking
- Personalized study paths

### 2. Behavioral Analytics
- Struggle prediction and early intervention
- Learning pattern analysis
- Predictive modeling using ML

### 3. Multi-Modal Content
- PDF document processing with OCR
- Interactive study sessions
- Spaced repetition scheduling

### 4. Medical Education Focus
- Board exam (USMLE/COMLEX) preparation
- High-yield concept identification
- Clinical reasoning practice

## Technology Stack

### Frontend
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form

### Backend
- **Runtime:** Node.js 20+
- **Database:** PostgreSQL with Prisma ORM
- **API Style:** REST + Server Actions
- **Auth:** Supabase

### ML Service
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **ML Libraries:** scikit-learn, numpy, pandas
- **Database Client:** Prisma Python Client

### DevOps
- **Container:** Docker (optional)
- **Process Manager:** concurrently (local dev)
- **Code Quality:** Biome linter/formatter
- **Testing:** Jest (TypeScript), pytest (Python)

## API Documentation

### Interactive API Explorer
After starting the ML service, visit: http://localhost:8000/docs

This provides an interactive Swagger UI where you can:
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser

### API Routes

**Frontend API Routes** (Next.js):
- http://localhost:3000/api/*

**ML Service Routes** (FastAPI):
- http://localhost:8000/health - Service health check
- http://localhost:8000/docs - Interactive API documentation
- http://localhost:8000/redoc - Alternative API documentation

## Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/my-feature
```

### 3. Make Changes
- Edit files in `apps/web/src/` or `services/ml-service/app/`
- Changes hot-reload automatically
- Check http://localhost:3000 and http://localhost:8000/docs

### 4. Test Your Changes
```bash
# Web app tests
cd apps/web
npm test

# ML service tests
cd services/ml-service
pytest
```

### 5. Commit and Push
```bash
git add .
git commit -m "feat: description of your changes"
git push origin feature/my-feature
```

## Database Management

### View Database in UI
```bash
cd apps/web
npx prisma studio
```

Opens http://localhost:5555 - a GUI for browsing and editing database data.

### Run Migrations
```bash
cd apps/web
npx prisma migrate dev
```

### Reset Database (Development Only)
```bash
cd apps/web
npx prisma migrate reset
```

## Troubleshooting

### Port Conflicts

**Error:** `Address already in use`

```bash
# Find process on port 3000 (Next.js)
lsof -i :3000
kill -9 <PID>

# Find process on port 8000 (FastAPI)
lsof -i :8000
kill -9 <PID>

# Then restart
npm run dev
```

### Python Virtual Environment Not Activating

```bash
# Verify venv exists
ls services/ml-service/venv

# Manually activate before running service
source services/ml-service/venv/bin/activate
cd services/ml-service
uvicorn app.main:app --reload --port 8000
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
# Check .env file has correct DATABASE_URL
cat apps/web/.env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Dependencies Missing

```bash
# Node dependencies
npm install

# Web app dependencies
cd apps/web && npm install && cd ../..

# Python dependencies
cd services/ml-service
source venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

### Web App (.env files in apps/web/)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AI APIs
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```

### ML Service (.env file in services/ml-service/)

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev

# FastAPI Configuration
FASTAPI_ENV=development
DEBUG=true
```

See `.env.example` files in each directory for complete templates.

## Common Commands

### Root Level

```bash
npm run dev              # Start both services
npm run dev:web-only    # Start only Next.js
npm run dev:ml-only     # Start only FastAPI
npm run health-check    # Check service status
npm run setup           # Full setup (runs all setup scripts)
```

### Web App (apps/web/)

```bash
npm run dev             # Start Next.js
npm run build           # Build for production
npm test                # Run tests
npm run lint            # Check code style
npm run lint:fix        # Fix code style issues
npx prisma studio      # Open database UI
```

### ML Service (services/ml-service/)

```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000  # Start service
pytest                  # Run tests
black .                # Format code
flake8                 # Lint code
mypy .                 # Type checking
```

## Git Workflow

### Current Branch: feature/epic-5-behavioral-twin

This branch contains implementations for Epic 5: Behavioral Twin Engine with advanced analytics.

### Branching Strategy

```
main (stable production)
  └── feature/epic-5-behavioral-twin (current)
      ├── task/behavioral-analytics
      ├── task/struggle-prediction
      └── task/intervention-engine
```

## Production Deployment

### Build for Production

```bash
# Web app
cd apps/web
npm run build
npm start

# ML service (using gunicorn or similar)
cd services/ml-service
source venv/bin/activate
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

### Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up

# Or individual services
docker build -f Dockerfile.web -t americano-web .
docker build -f Dockerfile.ml -t americano-ml .
```

## Contributing

### Code Quality Standards

- **Formatting:** Biome (TypeScript), black (Python)
- **Linting:** Biome (TypeScript), flake8 (Python)
- **Type Checking:** TypeScript, mypy (Python)
- **Testing:** Jest (TypeScript), pytest (Python)

### Before Committing

```bash
# Fix all formatting and linting issues
npm run lint:fix          # Web app
cd services/ml-service && black . && flake8
```

## Support & Documentation

- **Setup Issues:** See "Troubleshooting" section above
- **API Questions:** Visit http://localhost:8000/docs after starting ML service
- **Feature Documentation:** See docs/ directory
- **Architecture:** See AGENTS.MD and CLAUDE.MD

## License

Proprietary - Americano Learning Platform

---

**Questions?**

1. Check the [Web App README](./apps/web/README.md)
2. Check the [ML Service README](./services/ml-service/README.md)
3. Review setup scripts in [scripts/](./scripts/) directory
4. See project documentation in [docs/](./docs/) directory

**Happy learning! 🚀**
