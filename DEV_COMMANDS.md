# Developer Commands Reference

Quick reference for all common development commands.

## Getting Started (First Time)

```bash
# Automated setup (recommended)
bash scripts/setup.sh

# Or manual setup
npm install
cd apps/web && npm install && npx prisma generate && npx prisma migrate dev && cd ../..
cd services/ml-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && prisma generate
```

## Daily Development

```bash
# Start everything with one command
npm run dev

# Or start services individually in separate terminals:
npm run dev:web-only      # Terminal 1: Next.js only
npm run dev:ml-only       # Terminal 2: FastAPI only

# Check that both are running
npm run health-check
```

## Building

```bash
# Build everything
npm run build

# Build individual services
npm run build:web         # Next.js production build
npm run build:ml          # Install ML service dependencies
```

## Testing

```bash
# Web app tests
cd apps/web
npm test                  # Run once
npm test:watch           # Watch mode
npm test:coverage        # With coverage report

# ML service tests
cd services/ml-service
source venv/bin/activate
pytest                   # Run all tests
pytest -v                # Verbose
pytest --cov            # With coverage
```

## Code Quality

```bash
# Web app (TypeScript/JavaScript)
cd apps/web
npm run lint             # Check issues
npm run lint:fix         # Fix issues
npm run format           # Format code

# ML service (Python)
cd services/ml-service
source venv/bin/activate
black .                  # Format code
flake8                   # Lint code
mypy .                   # Type checking
```

## Database

```bash
cd apps/web

# View database in GUI
npx prisma studio       # Opens http://localhost:5555

# Create migration
npx prisma migrate dev --name "description"

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Debugging

### VS Code Full Stack Debugging

1. Press `F5` or go to Run → Start Debugging
2. Select "Full Stack Development"
3. Set breakpoints in TypeScript or Python files
4. Debug works in both services simultaneously

### Individual Debuggers

**Next.js Only:**
- F5 → Select "Next.js"
- Debug React components and API routes

**FastAPI Only:**
- F5 → Select "FastAPI (ML Service)"
- Debug Python code and API endpoints

### Manual Debugging

**Next.js:**
```bash
cd apps/web
npm run dev
# Then inspect chrome://inspect
```

**FastAPI:**
```bash
cd services/ml-service
source venv/bin/activate
python -m debugpy.adapter --listen 5678 --log-dir . -- -m uvicorn app.main:app --reload --port 8000
```

## Development Workflows

### Adding a New Feature

```bash
# Create feature branch
git checkout -b feature/my-feature

# Start dev server
npm run dev

# Make changes to apps/web/src/ or services/ml-service/app/

# Write tests
cd apps/web && npm test
cd services/ml-service && pytest

# Check code quality
cd apps/web && npm run lint:fix
cd services/ml-service && black . && flake8

# Commit changes
git add .
git commit -m "feat: description of feature"

# Push to remote
git push origin feature/my-feature
```

### Database Schema Changes

```bash
# 1. Update schema.prisma
nano apps/web/prisma/schema.prisma

# 2. Create migration
cd apps/web
npx prisma migrate dev --name "add_new_field"

# 3. Generate client
npx prisma generate

# 4. Test locally
npm run dev
```

### Adding Dependencies

**For Next.js:**
```bash
cd apps/web
npm install package-name
npm install -D dev-package  # Development dependency
```

**For FastAPI:**
```bash
cd services/ml-service
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

**For Root (shared tools):**
```bash
npm install -D package-name  # Usually for build tools
```

## Environment Configuration

### Setup Environment Files

**Web App (.env.local in apps/web/):**
```bash
cat apps/web/.env.example > apps/web/.env.local
# Edit with your values
```

**ML Service (.env in services/ml-service/):**
```bash
cat services/ml-service/.env.example > services/ml-service/.env
# Edit with your values
```

### Common Environment Variables

```env
# apps/web/.env.local
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key

# services/ml-service/.env
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev
FASTAPI_ENV=development
DEBUG=true
```

## Troubleshooting Commands

### Port Conflicts

```bash
# Find what's using port 3000
lsof -i :3000
kill -9 <PID>

# Find what's using port 8000
lsof -i :8000
kill -9 <PID>

# Find what's using port 5432 (database)
lsof -i :5432
```

### Python Virtual Environment Issues

```bash
# Check if activated
echo $VIRTUAL_ENV  # Should show path to venv

# Reactivate if needed
cd services/ml-service
source venv/bin/activate

# Delete and recreate if corrupted
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node Dependencies Issues

```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install

# For web app
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Reset database (development)
cd apps/web
npx prisma migrate reset
npm run seed
```

## Service Status

```bash
# Check if both services running
npm run health-check

# Manual checks
curl http://localhost:3000        # Next.js
curl http://localhost:8000/health # FastAPI
curl http://localhost:8000/docs   # API Documentation
```

## Cleanup

```bash
# Remove build artifacts
npm run clean               # If configured

# Remove node modules
rm -rf node_modules

# Remove Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
find . -name "*.pyc" -delete

# Full reset (use carefully!)
git clean -fdx
npm install
bash scripts/setup.sh
```

## Performance Monitoring

### Check Build Times

```bash
cd apps/web
npm run build              # Shows build time
npm run build -- --profile # With detailed profile

npm run dev -- --profile   # Dev with profiling
```

### Check API Response Times

```bash
# From http://localhost:8000/docs
# Use the Try It Out feature in Swagger UI

# Or from command line
time curl http://localhost:8000/health
```

## Git Commands

```bash
# Check status
git status

# See what changed
git diff                   # Unstaged
git diff --staged         # Staged

# View recent commits
git log --oneline -10

# Create branch for feature
git checkout -b feature/name

# Switch branches
git checkout main
git checkout feature/name

# Stage changes
git add .                 # All
git add file.ts          # Specific file

# Commit
git commit -m "message"

# Push
git push origin branch-name

# Pull latest
git pull origin main
```

## Quick Shortcuts

```bash
# Start everything and check status
npm run dev && npm run health-check

# Start dev and open in browser
npm run dev & open http://localhost:3000

# Database GUI in new terminal
cd apps/web && npx prisma studio &

# Kill all Node processes (careful!)
killall node

# View logs from both services
tail -f logs/next.log logs/fastapi.log
```

## Getting Help

| Need Help With | Command |
|---------------|---------|
| Setup issues | Read `/QUICK_START.md` |
| Full documentation | Read `/README.md` |
| ML service | Read `/services/ml-service/README.md` |
| VSCode debugging | Press F5, select config |
| API endpoints | Open http://localhost:8000/docs |
| Database schema | Open http://localhost:5555 |

## One-Liners for Common Tasks

```bash
# Update all dependencies
npm install && cd apps/web && npm install && cd ../services/ml-service && pip install -U -r requirements.txt

# Run all tests
cd apps/web && npm test && cd ../services/ml-service && pytest

# Format all code
cd apps/web && npm run lint:fix && cd ../services/ml-service && black . && flake8

# Full dev setup and start
bash scripts/setup.sh && npm run dev

# Check everything is working
npm run health-check && npm run build
```

---

**For complete details, see:**
- `/README.md` - Full documentation
- `/QUICK_START.md` - Fast setup guide
- `/services/ml-service/README.md` - ML service guide
