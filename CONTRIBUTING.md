# Contributing to Americano

Thank you for your interest in contributing to Americano! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 20.x or higher (see `.nvmrc`)
- Python 3.11+ (for ML services)
- PostgreSQL 15+ with pgvector extension
- pnpm (latest version)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/americano.git
cd americano

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
cd apps/web
npx prisma migrate dev

# Start development servers
cd ../..
pnpm dev
```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks

### Before You Commit

1. **Lint and Format:** Biome runs automatically on pre-commit
2. **Type Check:** Ensure TypeScript has no errors
3. **Test:** Run relevant tests for your changes
4. **Documentation:** Update docs if adding/changing features

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm lint:fix` and `pnpm format`
4. Ensure all tests pass
5. Update documentation as needed
6. Submit PR with clear description

### Commit Message Format

We use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `perf:` - Performance improvements

Example:
```
feat(validation): add AI-powered clinical reasoning scenarios

Implements Story 4.2 - Clinical Reasoning Scenarios with
ChatMock integration and competency scoring.

Closes #42
```

## Code Style

### TypeScript/JavaScript

- We use **Biome** for linting and formatting
- Configuration: `biome.json`
- Run: `pnpm lint:fix` to auto-fix issues

### Python

- Follow PEP 8 style guide
- Use type hints for all function signatures
- Docstrings: Google-style

### Documentation

- All markdown files are linted with markdownlint
- Use frontmatter for documentation metadata
- Follow conventions in `docs/frontmatter-standard.md`

## Testing

### TypeScript Tests
```bash
cd apps/web
pnpm test
pnpm test:coverage
```

### Python Tests
```bash
cd services/ml-service
pytest
pytest --cov
```

## Documentation

- Update `docs/` for architectural changes
- Create ADRs for significant decisions
- Keep `CHANGELOG.md` updated

## Questions?

- Check existing [documentation](docs/index.md)
- Review [Architecture Decision Records](docs/architecture/ADR-INDEX.md)
- Ask in discussions or issues

Thank you for contributing! 🎉
