# Americano Quick Start Guide

Get both the Next.js frontend and FastAPI ML service running with just a few commands.

## TL;DR (2 minutes)

```bash
# First time setup (5 minutes)
bash scripts/setup.sh

# Start development
npm run dev

# Done! Visit:
# - Frontend: http://localhost:3000
# - API Docs: http://localhost:8000/docs
```

## Prerequisites

```bash
node --version   # Should be 20.0.0+
python --version # Should be 3.11.0+
```

If you don't have these, install them first:
- [Node.js](https://nodejs.org) - Download LTS version (20+)
- [Python](https://www.python.org) - Download 3.11 or higher

## Initial Setup (Do This Once)

### Option A: Automated Setup (Recommended)

Run the setup script that handles everything:

```bash
bash scripts/setup.sh
```

This will:
1. Check your Node.js and Python versions
2. Install all Node dependencies
3. Setup the web app and database
4. Create Python virtual environment
5. Install Python dependencies
6. Generate Prisma Client

That's it!

### Option B: Manual Setup

If the script doesn't work, do this manually:

**Step 1: Install root dependencies**
```bash
npm install
```

**Step 2: Setup web app**
```bash
cd apps/web
npm install
npx prisma generate
npx prisma migrate dev
cd ../..
```

**Step 3: Setup ML service**
```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
prisma generate
cd ../..
```

## Start Development

### One Command to Rule Them All

```bash
npm run dev
```

This starts both services simultaneously:
- Next.js on http://localhost:3000
- FastAPI on http://localhost:8000

### Start Individual Services

**Just Next.js:**
```bash
npm run dev:web-only
```

**Just FastAPI:**
```bash
npm run dev:ml-only
```

## Verify Everything Works

```bash
npm run health-check
```

Expected output:
```
=== Americano Services Health Check ===

Checking Next.js on http://localhost:3000...
✓ Next.js is running

Checking FastAPI on http://localhost:8000...
✓ FastAPI is running

=== All services running! ===

Frontend:    http://localhost:3000
Backend API: http://localhost:8000
API Docs:    http://localhost:8000/docs
```

## What Now?

### Explore the Application

1. **Frontend:** http://localhost:3000
   - Explore the Next.js app
   - Create an account and try features

2. **API Documentation:** http://localhost:8000/docs
   - Interactive Swagger UI
   - Test endpoints directly
   - See request/response schemas

3. **Database GUI:**
   ```bash
   cd apps/web
   npx prisma studio
   ```
   Opens http://localhost:5555 - browse database data

### Make Changes

The services auto-reload on file changes:

**Frontend code:** `apps/web/src/**/*`
- Changes appear in http://localhost:3000 instantly

**API code:** `services/ml-service/app/**/*`
- Changes appear in http://localhost:8000 within 1 second

### Common Development Tasks

**Run tests:**
```bash
# Web app tests
cd apps/web && npm test

# ML service tests
cd services/ml-service && pytest
```

**Format code:**
```bash
# Web app formatting
cd apps/web && npm run lint:fix

# ML service formatting
cd services/ml-service && black .
```

**Database operations:**
```bash
cd apps/web

# Create new migration
npx prisma migrate dev --name add_new_table

# Reset database (careful!)
npx prisma migrate reset

# Open database GUI
npx prisma studio
```

## Troubleshooting

### "Port 3000 already in use"

```bash
# Kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Try again
npm run dev
```

### "ModuleNotFoundError" in Python

```bash
cd services/ml-service
source venv/bin/activate  # Make sure this is active!
pip install -r requirements.txt
```

### "DATABASE_URL not set"

```bash
# Check environment file exists
cat apps/web/.env.local

# If missing, create it:
cp apps/web/.env.example apps/web/.env.local
# Edit with your database credentials
```

### Python virtual environment won't activate

**macOS/Linux:**
```bash
cd services/ml-service
source venv/bin/activate  # Not ./ venv/bin/activate
echo $VIRTUAL_ENV  # Should show path to venv
```

**Windows (PowerShell):**
```bash
cd services/ml-service
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```bash
cd services/ml-service
venv\Scripts\activate.bat
```

## VS Code Integration

The project includes VS Code configuration for debugging both services:

1. Install recommended extensions: `Ctrl+Shift+X` → Search for "Americano" or install from `.vscode/extensions.json`

2. Run Full Stack Debugger:
   - Press `F5` or go to Run → Start Debugging
   - Select "Full Stack Development"
   - Sets breakpoints in both TypeScript and Python

3. View breakpoint hits in both services simultaneously

## Project Structure

```
Americano-epic5/
├── apps/web/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Pages and API routes
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
│   ├── package.json
│   └── prisma/schema.prisma  # Database schema
│
├── services/
│   └── ml-service/           # FastAPI backend
│       ├── app/
│       │   ├── main.py       # App entry point
│       │   ├── routes/       # API endpoints
│       │   └── services/     # Business logic
│       ├── requirements.txt
│       └── .env              # Config file
│
├── scripts/                  # Setup scripts
├── package.json             # Root configuration
├── README.md                # Full documentation
└── QUICK_START.md          # This file
```

## Environment Variables

### Web App (.env.local in apps/web/)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev

# Supabase (if using auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# APIs (optional)
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### ML Service (.env in services/ml-service/)

```env
# Must match web app
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev

# Development
DEBUG=true
FASTAPI_ENV=development
```

## Key Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both services |
| `npm run dev:web-only` | Start just Next.js |
| `npm run dev:ml-only` | Start just FastAPI |
| `npm run health-check` | Check service status |
| `bash scripts/setup.sh` | Full initial setup |
| `bash scripts/setup-ml.sh` | Just ML service setup |
| `npx prisma studio` | Database GUI (from apps/web) |
| `npm test` | Run tests (from apps/web) |
| `pytest` | Run ML tests (from services/ml-service) |

## Getting Help

1. **Can't get it running?** Check Troubleshooting section above
2. **Want to dive deeper?** Read [README.md](./README.md)
3. **ML service questions?** See [services/ml-service/README.md](./services/ml-service/README.md)
4. **Frontend questions?** See [apps/web/README.md](./apps/web/README.md)

## What You Just Set Up

- **Next.js 15** - Modern React framework with Server Components
- **FastAPI** - High-performance Python API framework
- **PostgreSQL** - Database shared by both services
- **Prisma** - Type-safe database client
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful React components
- **scikit-learn** - ML model training and prediction
- **Hot Reload** - Auto-refresh on code changes in both services

## Next Steps

1. Explore the [architecture docs](./docs/)
2. Read API documentation at http://localhost:8000/docs
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make changes, test, commit, push
5. Create a pull request against `main`

## One Last Thing

You're all set! Start development now:

```bash
npm run dev
```

Then open:
- http://localhost:3000 (Next.js)
- http://localhost:8000/docs (API Documentation)

Happy coding!
