SHELL := /bin/bash
.PHONY: help up start setup install env db db-init migrate seed generate web ml dev web-only ml-only health open doctor clean stop check-db-env

SENTINEL := .americano/initialized

# Paths
ENV_WEB := apps/web/.env
ENV_WEB_EX := apps/web/.env.example
ENV_ML := apps/ml-service/.env
ENV_ML_EX := apps/ml-service/.env.example

up: ## One-click: first run does setup, then starts services; later runs just start
	@$(MAKE) stop >/dev/null 2>&1 || true; \
	if [ -f "$(SENTINEL)" ]; then \
	  echo "✓ Americano already initialized — starting services"; \
	  $(MAKE) dev; \
	else \
	  echo "=== First-time setup (one-off) ==="; \
	  $(MAKE) setup && mkdir -p .americano && touch "$(SENTINEL)" && $(MAKE) dev; \
	fi

start: dev ## Alias to just start services (no setup)

setup: env install generate migrate seed ## Prepare env, install deps, generate clients, migrate, seed

install: ## Install Node deps (workspace)
	npm ci

env: ## Ensure .env files exist for web and ml-service
	@if [ ! -f "$(ENV_WEB)" ] && [ -f "$(ENV_WEB_EX)" ]; then cp "$(ENV_WEB_EX)" "$(ENV_WEB)"; echo "Created $(ENV_WEB)"; fi
	@if [ ! -f "$(ENV_ML)" ] && [ -f "$(ENV_ML_EX)" ]; then cp "$(ENV_ML_EX)" "$(ENV_ML)"; echo "Created $(ENV_ML)"; fi

generate: ## Generate Prisma client + API TS types
	npx prisma generate --schema apps/web/prisma/schema.prisma
	cd apps/web && npm run generate-types

migrate: db ## Run database migrations (creates pgvector extension if needed)

db: check-db-env db-init ## Sync Prisma schema to DB (dev) and add vector indexes
	@bash -lc 'set -a; source apps/web/.env; set +a; npx prisma db push --schema apps/web/prisma/schema.prisma --accept-data-loss'
	@DB_USER="$$(id -un)"; DB_NAME="americano"; \
	  if [ -f apps/web/prisma/vector-indexes.sql ]; then \
	    echo "Applying vector indexes (if compatible)..."; \
	    psql -h localhost -U "$$DB_USER" -d "$$DB_NAME" -f apps/web/prisma/vector-indexes.sql 2>/dev/null \
	      || echo "Note: Skipped vector indexes (likely dimension mismatch); app will still run."; \
	  fi

migrate-deploy: ## Apply Prisma SQL migrations (for fresh databases)
	@bash -lc 'set -a; source apps/web/.env; set +a; npx prisma migrate deploy --schema apps/web/prisma/schema.prisma || true'

DB_USER := $(shell id -un)
DB_NAME := americano

db-init: ## Create local database and enable pgvector if missing
	@echo "Ensuring Postgres database '$(DB_NAME)' exists and pgvector is enabled..."
	@psql -h localhost -U "$(DB_USER)" -tc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)'" 2>/dev/null | grep -q 1 \
		|| (echo "Creating database $(DB_NAME) as $(DB_USER)..." && createdb -h localhost -U "$(DB_USER)" "$(DB_NAME)" 2>/dev/null || true)
	@psql -h localhost -U "$(DB_USER)" -d "$(DB_NAME)" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null \
		|| echo "Note: Could not enable 'vector' extension automatically. You can run: psql -h localhost -U $(DB_USER) -d $(DB_NAME) -c 'CREATE EXTENSION IF NOT EXISTS vector;'"

seed: ## Seed development data (users, articles, etc.)
	bash -lc 'set -a; source apps/web/.env; set +a; cd apps/web && npx tsx prisma/seed.ts && npx tsx prisma/seed-learning-articles.ts'

backfill-prompts: ## Backfill ValidationPrompt.objectiveId by conceptName→objective mapping
	cd apps/web && node scripts/backfill-validation-prompt-objective-id.js --apply || true

web: web-only ## Alias for web-only

ml: ml-only ## Alias for ml-only

dev: ## Run web + ML services together
	npm run dev

web-only: ## Run only Next.js web app
	cd apps/web && npm run dev

ml-only: ## Run only ML service (FastAPI)
	cd apps/ml-service && ./start-ml-service.sh

health: ## Check that services are responding
	bash scripts/check-services.sh || true

wait-health: ## Wait until services respond (useful after daemon start)
	bash scripts/wait-for-services.sh 60 || true

open: ## Open web app in browser
	@if command -v open >/dev/null 2>&1; then open http://localhost:3000; \
	elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000; \
	else echo "Please open http://localhost:3000 in your browser"; fi

doctor: ## Quick env check
	@echo "Node:     $$(node -v 2>/dev/null || echo not found)"; \
	echo "npm:      $$(npm -v 2>/dev/null || echo not found)"; \
	echo "Python:   $$(python3 -V 2>/dev/null || echo not found)"; \
	echo "psql:     $$(psql --version 2>/dev/null || echo not found)"; \
	if command -v rg >/dev/null 2>&1; then \
	  echo "DATABASE_URL(web): $$(rg -n \"^[[:space:]]*DATABASE_URL=\" apps/web/.env || echo not set)"; \
	  echo "DATABASE_URL(ml):  $$(rg -n \"^[[:space:]]*DATABASE_URL=\" apps/ml-service/.env || echo not set)"; \
	else \
	  echo "DATABASE_URL(web): $$(grep -nE \"^[[:space:]]*DATABASE_URL=\" apps/web/.env || echo not set)"; \
	  echo "DATABASE_URL(ml):  $$(grep -nE \"^[[:space:]]*DATABASE_URL=\" apps/ml-service/.env || echo not set)"; \
	fi

clean: ## Remove Next build artifacts
	rm -rf apps/web/.next

stop: ## Stop web and ML services (ports 3000, 8000)
	bash scripts/stop.sh

restart: ## Stop then start both services
	$(MAKE) stop || true
	$(MAKE) up

daemon: ## Start both services in background (logs to web.log, ml.log)
	@$(MAKE) stop || true
	@cd apps/ml-service && nohup ./start-ml-service.sh > ../../ml.log 2>&1 & echo $$! > ../../.ml.pid
	@cd apps/web && nohup npm run dev > ../../web.log 2>&1 & echo $$! > ../../.web.pid
	@echo "Started in background. Logs: make logs"

logs: ## Tail background logs (web + ml)
	@echo "--- ml.log ---" && tail -n 80 -f ml.log & echo $$! > .logs_ml.pid; \
	 echo "--- web.log ---" && tail -n 80 -f web.log & echo $$! > .logs_web.pid; \
	 wait

check-db-env:
	@if ! [ -f apps/web/.env ]; then \
		echo "ERROR: apps/web/.env not found. Copy apps/web/.env.example to apps/web/.env and set DATABASE_URL."; \
		exit 1; \
	fi

help: ## Show available make targets
	@grep -E '^[a-zA-Z_-]+:.*##' Makefile | sed -e 's/:.*##/: /' | sort

	@FOUND=0; \
	if command -v rg >/dev/null 2>&1; then \
	  rg -n "^[[:space:]]*DATABASE_URL=" apps/web/.env >/dev/null 2>&1 && FOUND=1; \
	else \
	  grep -E "^[[:space:]]*DATABASE_URL=" apps/web/.env >/dev/null 2>&1 && FOUND=1; \
	fi; \
	if [ "$$FOUND" -ne 1 ]; then \
	  echo "ERROR: DATABASE_URL is missing in apps/web/.env"; \
	  echo "Example (no password): DATABASE_URL=postgresql://<user>@localhost:5432/americano"; \
	  echo "Then run: make db seed"; \
	  exit 1; \
	fi
