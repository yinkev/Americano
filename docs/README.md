---
title: "Documentation Directory"
description: "Entry point to Americano project documentation"
type: "Guide"
status: "Active"
version: "1.0"

owner: "Kevy"
review_cadence: "Quarterly"

created_date: "2025-10-23T15:00:00-07:00"
last_updated: "2025-10-23T15:00:00-07:00"
last_reviewed: "2025-10-23T15:00:00-07:00"
next_review_due: "2026-01-23"

depends_on:
  - docs/index.md
affects: []

audience:
  - new-developers
  - external-contributors
technical_level: "Beginner"
tags: ["documentation", "index", "navigation"]
keywords: ["docs", "documentation", "getting started"]
search_priority: "high"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Initial docs/README.md redirect created"
---

# Americano Documentation

Welcome to the Americano project documentation!

## 📚 Start Here: [Documentation Index](./index.md)

**The complete documentation index is located at:** **[docs/index.md](./index.md)**

This index provides:
- 🎯 Quick start guides
- 🏗️ Architecture documentation
- 🔌 API contracts and endpoints
- 💾 Data models (77 Prisma models)
- 👨‍💻 Developer guides
- 🧪 Testing documentation
- 🚀 Deployment guides
- 📊 Epic completion reports

---

## Quick Links

**For New Developers:**
- [Getting Started](./technical/development-environment-setup.md) - Set up your local environment
- [Project Overview](./overview/PRD-Americano-2025-10-14.md) - What is Americano?
- [Solution Architecture](./overview/solution-architecture.md) - System design overview

**For Experienced Developers:**
- [ADR Index](./architecture/ADR-INDEX.md) - Architecture Decision Records
- [API Contracts](./backend/api-contracts.md) - All endpoints documented
- [Data Models](./backend/data-models.md) - Database schema reference

**Documentation Quality:**
- [Documentation Excellence Report](./DOCUMENTATION-EXCELLENCE-REPORT.md) - 🏆 World-class achievement
- [Doc Health Metrics](./DOC-HEALTH-METRICS.md) - Quantitative tracking
- [Frontmatter Standard](./frontmatter-standard.md) - Metadata guidelines

**For AI Agents:**
- `../AGENTS.MD` - Agent development protocol
- `../CLAUDE.md` - Project instructions for Claude Code

---

## Documentation Structure

```
docs/
├── index.md                          # ⭐ MASTER INDEX - Start here!
├── README.md                         # This file (redirect)
├── DOCUMENTATION-EXCELLENCE-REPORT.md # Achievement report
├── DOC-HEALTH-METRICS.md             # Metrics tracking
├── frontmatter-standard.md           # Metadata template
│
├── architecture/                     # Architecture docs + ADRs
│   ├── ADR-INDEX.md                 # Architecture Decision Records index
│   ├── ADR-001-*.md                 # Individual ADRs (5 total)
│   └── ...
│
├── epics/                           # Epic completion reports
│   ├── epic-3/                      # Knowledge Graph & Semantic Search
│   ├── epic-4/                      # Understanding Validation Engine
│   └── epic-5/                      # Behavioral Learning Twin
│
├── stories/                         # Story implementation docs
├── testing/                         # Test documentation hub
├── deployments/                     # Deployment guides
├── developer-guides/                # Feature implementation guides
├── retrospectives/                  # Epic retrospectives
└── ...
```

---

## Documentation Standards

**This documentation follows:**
- ✅ **BMAD Method** - Better Method for AI Development
- ✅ **Single Source of Truth** - docs/index.md as canonical entry point
- ✅ **Enhanced Frontmatter** - All docs have structured metadata
- ✅ **Quality Gates** - Automated linting, link checking, grammar checking
- ✅ **CI/CD Enforcement** - GitHub Actions on all PR changes
- ✅ **0 Broken Links** - Verified and maintained
- ✅ **World-Class Excellence** - See [Excellence Report](./DOCUMENTATION-EXCELLENCE-REPORT.md)

---

## Need Help?

1. **Start at the index:** [docs/index.md](./index.md)
2. **For setup issues:** [Troubleshooting](./troubleshooting/database-issues.md)
3. **For architecture questions:** [ADR Index](./architecture/ADR-INDEX.md)
4. **For AI agents:** `../AGENTS.MD` and `../CLAUDE.md`

---

**Last Updated:** 2025-10-23T15:00:00-07:00
**Maintained By:** Americano Documentation Team
**Status:** 🏆 World-Class Excellence Achieved
