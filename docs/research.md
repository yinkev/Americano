# Americano Repository Research Analysis

## Executive Summary

Americano is an AI-powered medical education platform designed to provide adaptive learning experiences for medical students. The platform combines AI-driven personalization with behavioral analytics to eliminate "what to study" anxiety and optimize learning outcomes. Built as a modern full-stack application, Americano leverages a hybrid TypeScript + Python microservices architecture with Next.js 15 for the frontend, FastAPI for ML services, and PostgreSQL with pgvector for data storage. The repository demonstrates sophisticated engineering practices including comprehensive documentation, robust testing strategies, and production-ready deployment configurations.

## 1. Repository Structure and Purpose

### Project Overview
Americano serves as an adaptive learning platform specifically tailored for medical education, with a focus on board exam (USMLE/COMLEX) preparation. The platform's core value proposition centers on three key pillars:

1. **Adaptive Learning**: AI-powered content recommendations and personalized study paths based on individual learning patterns
2. **Behavioral Analytics**: Real-time learning progress tracking with predictive modeling for early intervention
3. **Multi-Modal Content**: Integration of PDF document processing with OCR, interactive study sessions, and spaced repetition scheduling

### Repository Organization
The repository follows a monorepo structure with clear separation of concerns:

```
Americano/
├── apps/
│   ├── api/                    # Python FastAPI microservice for AI evaluation (Epic 4)
│   ├── data/                   # Data processing applications
│   ├── ml-service/             # ML prediction service for behavioral analytics (Epic 5)
│   └── web/                    # Next.js 15 frontend application
├── services/
│   ├── chatmock/               # OpenAI-compatible API wrapper using ChatGPT Plus account
│   ├── ml-service/             # FastAPI ML service for behavioral predictions
│   └── ocr-service/            # PaddleOCR-based PDF text extraction service
├── data/
│   ├── raw/                    # Raw data files
│   ├── processed/              # Processed data
│   └── exports/                # Exported datasets
├── docs/                       # Comprehensive project documentation (163+ files)
├── scripts/                    # Setup and utility scripts
├── .iflow/                     # Agent framework configuration
└── bmad/                       # BMAD Method documentation framework
```

The repository demonstrates exceptional documentation quality with 163+ markdown files following the BMAD Method principles, achieving world-class excellence standards with automated quality gates for linting, link checking, and grammar validation.

## 2. Core Applications Architecture and Functionality

### Next.js Web Application (apps/web)
The frontend is built with Next.js 15 using the App Router architecture, providing a modern, responsive user interface with server-side rendering capabilities.

**Key Features:**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: Zustand for global state
- **Forms**: React Hook Form with Zod validation
- **Database**: PostgreSQL with Prisma ORM (77 models, 27 strategic indexes)

**Architecture Highlights:**
- Server Actions for backend operations
- API routes for external service integration
- Comprehensive error handling and logging
- Performance optimization with code splitting and lazy loading

### Python FastAPI Services

#### Understanding Validation Engine (apps/api)
This service powers Epic 4's AI-powered comprehension evaluation capabilities:

**Core Functionality:**
- **Prompt Generation**: AI-powered "Explain to a patient" prompts with 3 template types
- **Comprehension Evaluation**: 4-dimensional scoring rubric (terminology, relationships, application, clarity)
- **Confidence Calibration**: Detection of overconfidence/underconfidence patterns
- **Structured Outputs**: Pydantic-validated LLM responses using the `instructor` library

**Technology Stack:**
- FastAPI 0.115.0 with async/await support
- Pydantic v2 for type-safe data validation
- OpenAI SDK 1.15.0 for LLM integration
- Full test coverage with pytest

#### ML Prediction Service (services/ml-service)
This service provides Epic 5's behavioral analytics and prediction capabilities:

**Core Functionality:**
- **Struggle Prediction**: ML models identifying students at risk based on behavioral patterns
- **Behavioral Analytics**: Real-time analysis of student engagement and learning behaviors
- **Intervention Recommendations**: Evidence-based educational intervention suggestions
- **Performance Tracking**: Continuous monitoring of model performance and accuracy

**Technology Stack:**
- FastAPI microservice architecture
- PostgreSQL database (shared with Next.js app)
- Prisma Python Client for database operations
- scikit-learn, numpy, and pandas for ML operations

## 3. Supporting Services and Their Roles

### ChatMock Service (services/chatmock)
ChatMock provides an OpenAI-compatible API that leverages a user's ChatGPT Plus/Pro account to access advanced models like GPT-5 without requiring traditional API keys.

**Key Capabilities:**
- **Model Access**: GPT-5, GPT-5-Codex, and codex-mini models
- **Compatibility**: OpenAI and Ollama API compatibility
- **Advanced Features**: Tool/function calling, vision understanding, thinking summaries
- **Customization**: Configurable reasoning effort and summary detail levels

**Integration Role**: Enables cost-effective access to advanced AI models during development and testing phases, with the ability to switch to production OpenAI API keys when needed.

### OCR Service (services/ocr-service)
The OCR service handles PDF text extraction for lecture materials using PaddleOCR, optimized specifically for medical terminology preservation.

**Key Features:**
- **Medical Terminology Accuracy**: >90% accuracy target for medical terms
- **PDF Processing**: Converts PDF pages to images and extracts text
- **Confidence Scoring**: Tracks OCR quality metrics per page
- **Robust Error Handling**: Handles corrupted PDFs and processing failures

**Integration Role**: Enables processing of existing medical lecture materials into structured, searchable content that can be integrated into the knowledge graph and semantic search systems.

### ML Service (services/ml-service)
The ML service provides the behavioral twin engine that powers Epic 5's advanced analytics:

**Core Capabilities:**
- **Learning Pattern Recognition**: VARK profiling and forgetting curve analysis (Story 5.1)
- **Predictive Analytics**: 73% accurate struggle prediction using ML models (Story 5.2)
- **Optimal Study Timing**: Google Calendar integration for scheduling recommendations (Story 5.3)
- **Cognitive Load Monitoring**: Burnout prevention through cognitive load tracking (Story 5.4)
- **Adaptive Personalization**: Multi-armed bandit optimization for content delivery (Story 5.5)
- **Behavioral Insights Dashboard**: Goal tracking and learning science visualization (Story 5.6)

## 4. Data Management with DVC Implementation

### DVC (Data Version Control) Architecture
Americano implements DVC for research-grade analytics data management, providing version control for large datasets while keeping the Git repository lightweight.

**Current Implementation:**
- **Tracked Files**: `americano_analytics.duckdb` (12 KB initial size, grows with data)
- **Storage**: Local filesystem at `/tmp/americano-dvc-cache` (development)
- **Future Plans**: Migration to S3/GCS for production team collaboration
- **Integration**: Seamless workflow with PostgreSQL operational database

**Data Lifecycle:**
```
PostgreSQL (operational DB)
    ↓ export
Parquet files (data/raw/*.parquet)
    ↓ sync
DuckDB (data/americano_analytics.duckdb) ← DVC tracked
    ↓ query
Research notebooks (apps/ml-service/notebooks/)
    ↓ results
Analysis reports (docs/research-analytics/)
```

**Benefits:**
- **Reproducibility**: Exact same data + code = identical research results
- **Version Control**: Track changes to analytical datasets over time
- **Efficiency**: 99.1% reduction in Git repository size compared to direct data commits
- **Collaboration**: Shared remote storage for team data access

### Database Architecture
The primary operational database uses PostgreSQL with the pgvector extension for vector embeddings:

- **Schema Complexity**: 77 Prisma models, 55 enums, 27 strategic indexes
- **Vector Embeddings**: 1536-dimensional vectors using Google Gemini embeddings
- **Epic-Specific Models**:
  - **Epic 3**: ContentChunk, Embedding, KnowledgeGraphNode, FirstAidSection
  - **Epic 4**: ValidationPrompt, ValidationResponse, ClinicalScenario (11 models)
  - **Epic 5**: UserLearningProfile, StrugglePrediction, CognitiveLoadEvent (20+ models)

## 5. Development Workflows and Best Practices

### Monorepo Management
The repository uses npm workspaces to manage the monorepo structure:

```json
{
  "workspaces": [
    "apps/web",
    "services/ml-service"
  ]
}
```

**Development Scripts:**
- `npm run dev`: Starts both Next.js and ML service simultaneously
- `npm run dev:web-only`: Starts only the Next.js frontend
- `npm run dev:ml-only`: Starts only the ML service
- `npm run health-check`: Verifies both services are running
- `npm run setup`: Full repository setup script

### Code Quality and Standards

**TypeScript/JavaScript:**
- **Formatter**: Biome with 2-space indentation, single quotes, no semicolons
- **Linting**: Biome with recommended rules enabled
- **Type Checking**: Strict TypeScript with comprehensive type definitions

**Python:**
- **Formatter**: Black for consistent code formatting
- **Linting**: Flake8 for code quality
- **Type Checking**: MyPy for static type analysis

**Documentation Standards:**
- **Frontmatter**: Standardized metadata for all documentation files
- **Automated Quality Gates**: Markdown linting, link checking, grammar validation
- **BMAD Method**: Comprehensive documentation framework with single source of truth

### Development Environment Setup
The repository provides comprehensive setup automation:

1. **Prerequisites Verification**: Node.js 20+, Python 3.11+, PostgreSQL
2. **Dependency Installation**: Automated npm and pip dependency installation
3. **Database Setup**: Prisma schema generation and migration execution
4. **Environment Configuration**: .env file creation and validation
5. **Service Initialization**: Virtual environment setup for Python services

## 6. Testing Approaches and Quality Assurance

### Multi-Layered Testing Strategy

**Unit Testing:**
- **Next.js**: Jest + React Testing Library with 70%+ coverage target
- **FastAPI**: pytest with 80%+ coverage target for ML/statistics code
- **Coverage**: 291+ tests for Epic 5, 65+ tests for Epic 4

**Integration Testing:**
- **API Integration**: Testing between Next.js and FastAPI services
- **Database Integration**: Testing Prisma client and database operations
- **Service Integration**: Testing external service interactions

**End-to-End Testing:**
- **Framework**: Playwright (planned for future implementation)
- **Focus**: Critical user flows and business-critical paths

### Testing Infrastructure

**Test Structure:**
```
apps/web/
├── src/
│   ├── components/__tests__/
│   ├── lib/__tests__/
│   └── subsystems/behavioral-analytics/__tests__/
apps/api/
├── tests/
│   ├── conftest.py
│   ├── test_irt.py
│   └── integration/test_api_routes.py
```

**Quality Metrics:**
- **Epic 4**: 65+ tests passing, 65%+ coverage on critical paths
- **Epic 5**: 291+ tests passing, 50-60% coverage (exceeds 40% target)
- **Performance**: 98.5% API performance improvement (21.2s → 180ms)

### Testing Conventions
- **AAA Pattern**: Arrange, Act, Assert test structure
- **Mock External Dependencies**: Isolate units under test
- **Test Data Factories**: Consistent test data creation
- **File Naming**: Consistent naming conventions (Component.test.tsx)

## 7. Deployment Strategies and CI/CD

### Production Deployment Architecture

**Recommended Stack:**
- **Frontend**: Vercel (Next.js hosting with Edge Functions)
- **Database**: Neon (Serverless PostgreSQL) or AWS RDS
- **Cache**: Upstash (Serverless Redis)
- **ML Service**: fly.io, AWS ECS, or Google Cloud Run

**Deployment Components:**
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│  PostgreSQL  │      │   Upstash   │
│  (Next.js)  │      │   (Neon/AWS) │      │   (Redis)   │
└──────┬──────┘      └──────────────┘      └─────────────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│   FastAPI   │
│ ML Service  │
│ (Port 8000) │
└─────────────┘
```

### Deployment Process

**Pre-Deployment Checklist:**
- TypeScript build verification (0 errors)
- Test suite execution (all tests pass)
- Linting and type checking
- Bundle size analysis (<10MB target)
- Database schema validation
- Environment variable audit

**Database Deployment:**
- **Migrations**: Prisma migrate deploy for production
- **Backups**: Full database snapshots before migration
- **Indexing**: 27 strategic indexes for Epic 5 performance
- **Connection Pooling**: Enabled for serverless environments

**Service Deployment:**
- **Next.js**: Vercel deployment with custom domain and SSL
- **ML Service**: Docker container deployment with health checks
- **Environment Variables**: Secure storage with encryption
- **Monitoring**: Sentry integration for error tracking

### CI/CD Pipeline

**Current Implementation:**
- **Documentation Quality**: GitHub Actions workflow for markdown files
- **Quality Gates**: Automated linting, link checking, and grammar validation
- **Merge Protection**: Documentation quality checks block PR merges

**Future Enhancements:**
- **Comprehensive Testing**: Full test suite execution on PR
- **Security Scanning**: Dependency vulnerability scanning
- **Performance Testing**: Automated performance regression detection
- **Deployment Automation**: Automated staging and production deployments

### Monitoring and Observability

**Built-in Monitoring:**
- **Vercel Analytics**: Automatic Web Vitals and performance tracking
- **Sentry Integration**: Error tracking and performance monitoring
- **Custom Metrics**: API performance and cache hit rate tracking

**Health Checks:**
- **Service Health**: `/health` endpoints for all services
- **Database Connectivity**: Automated connection testing
- **Cache Performance**: Redis hit rate monitoring (target: 65-85%)

### Rollback and Recovery

**Rollback Procedures:**
- **Vercel**: One-click rollback to previous deployments
- **Database**: Migration rollback or backup restoration
- **Service Recovery**: Automatic restart and health check monitoring

**Backup Strategy:**
- **Database**: Daily automated backups with 7-day retention
- **Redis**: Automatic snapshots (cache layer, less critical)
- **Code**: Git version control with comprehensive commit history

## Conclusion

The Americano repository represents a sophisticated, production-ready medical education platform with exceptional engineering practices. The architecture demonstrates thoughtful consideration of scalability, maintainability, and developer experience. Key strengths include:

1. **Comprehensive Documentation**: World-class documentation following BMAD Method principles
2. **Robust Testing Strategy**: Multi-layered testing with high coverage targets
3. **Modern Architecture**: Hybrid TypeScript + Python microservices with clear separation of concerns
4. **Production-Ready Deployment**: Detailed deployment guides with rollback procedures
5. **Data Management Excellence**: DVC implementation for reproducible research analytics
6. **Quality Assurance**: Automated quality gates and comprehensive code standards

The repository is well-positioned for production deployment and demonstrates engineering excellence across all aspects of modern software development.
