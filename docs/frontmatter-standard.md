# Documentation Frontmatter Standard

**Purpose:** Standardized YAML frontmatter for all Americano documentation
**Created:** 2025-10-23T11:00:00-07:00
**Status:** Active
**Owner:** Kevy

---

## Overview

All documentation in the Americano project uses enhanced YAML frontmatter to enable:
- **Ownership tracking** - Clear DRIs and review cadence
- **Lifecycle management** - Track status, deprecation, archival
- **Dependency mapping** - Understand doc relationships
- **Audience targeting** - Tailor content to reader skill level
- **Automated tooling** - Enable doc health dashboards and quality gates

---

## Complete Template

```yaml
---
# === Core Metadata ===
title: "Document Title"
description: "Brief 1-2 sentence description of this document's purpose"
type: "Architecture | API | Data | Guide | Testing | Epic | Story | Troubleshooting"
status: "Active | Draft | Review | Deprecated | Archived"
version: "1.0"

# === Ownership ===
owner: "Kevy"                                    # Primary document owner (DRI)
dri_backup: "Amelia"                             # Backup owner if primary unavailable
contributors: ["Winston", "Database Optimizer"]   # Other contributors
review_cadence: "Per Change | Weekly | Monthly | Quarterly | Per Epic"

# === Timestamps (ISO 8601 with timezone) ===
created_date: "2025-10-23T10:45:00-07:00"        # When doc was created
last_updated: "2025-10-23T11:00:00-07:00"        # Last modification timestamp
last_reviewed: "2025-10-23T11:00:00-07:00"       # Last human review date
next_review_due: "2025-11-23"                     # When next review is due

# === Dependencies ===
depends_on:
  - docs/architecture/solution-architecture.md    # Docs this one depends on
  - apps/web/prisma/schema.prisma
affects:
  - docs/developer-guides/getting-started.md      # Docs affected by changes here
related_adrs:
  - docs/architecture/ADR-001-hybrid-typescript-python.md

# === Audience & Discovery ===
audience:
  - new-developers          # Onboarding juniors
  - experienced-devs        # Team members
  - external-contributors   # Open source contributors
  - stakeholders            # PM/business
technical_level: "Beginner | Intermediate | Advanced | Expert"
tags: ["api", "authentication", "epic-4", "production"]
keywords: ["OAuth 2.0", "JWT", "FastAPI"]
search_priority: "low | medium | high | critical"

# === Lifecycle ===
lifecycle:
  stage: "Active"                               # Draft | Review | Active | Deprecated | Archived
  deprecation_date: null                        # When doc becomes deprecated (YYYY-MM-DD)
  replacement_doc: null                         # Link to replacement doc if deprecated
  archive_after: null                           # Auto-archive date (YYYY-MM-DD)

# === Metrics (optional) ===
metrics:
  word_count: 3452                              # Approximate word count
  reading_time_min: 17                          # Estimated reading time
  code_examples: 12                             # Number of code blocks
  last_link_check: "2025-10-23T09:00:00-07:00"  # Last link validation
  broken_links: 0                               # Broken link count

# === Changelog ===
changelog:
  - version: "1.1"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Added Epic 5 endpoints"
      - "Updated caching strategy"
  - version: "1.0"
    date: "2025-10-15"
    author: "Amelia"
    changes:
      - "Initial documentation"
---
```

---

## Field Descriptions

### Core Metadata

#### `title` (Required)
**Type:** String
**Description:** Clear, descriptive title for the document
**Example:** `"API Contracts Documentation"`

#### `description` (Required)
**Type:** String
**Description:** 1-2 sentence summary of document purpose
**Example:** `"Canonical API contract specifications for Americano platform"`

#### `type` (Required)
**Type:** Enum
**Options:**
- `Architecture` - System design, architectural decisions, patterns
- `API` - API specifications, endpoint documentation
- `Data` - Database schemas, data models
- `Guide` - How-to guides, tutorials, developer guides
- `Testing` - Test strategies, test reports, coverage
- `Epic` - Epic summaries, retrospectives
- `Story` - Story implementation details, task summaries
- `Troubleshooting` - Problem-solving guides, FAQs

#### `status` (Required)
**Type:** Enum
**Options:**
- `Draft` - Work in progress, not yet reviewed
- `Review` - Ready for review
- `Active` - Current, actively maintained
- `Deprecated` - Outdated, refer to replacement
- `Archived` - Historical reference only

#### `version` (Required)
**Type:** String (Semantic versioning)
**Description:** Document version (increment on significant changes)
**Example:** `"1.0"`, `"2.1"`, `"3.0-beta"`

---

### Ownership

#### `owner` (Required)
**Type:** String (Name or team)
**Description:** Primary document owner (DRI - Document Responsible Individual)
**Example:** `"Kevy"`, `"Architecture Team"`

#### `dri_backup` (Optional)
**Type:** String
**Description:** Backup owner if primary unavailable
**Example:** `"Amelia"`

#### `contributors` (Optional)
**Type:** List of strings
**Description:** Other contributors to this document
**Example:** `["Winston (Architect)", "Database Optimizer"]`

#### `review_cadence` (Required)
**Type:** Enum
**Options:**
- `Per Change` - Review every time doc changes
- `Weekly` - Weekly review cycle
- `Monthly` - Monthly review cycle
- `Quarterly` - Quarterly review cycle
- `Per Epic` - Review after each epic completion
**Description:** How often this doc should be reviewed

---

### Timestamps

All timestamps use **ISO 8601 format with timezone**: `YYYY-MM-DDTHH:MM:SS±HH:MM`

#### `created_date` (Required)
**Type:** ISO 8601 datetime
**Description:** When document was first created
**Example:** `"2025-10-23T10:45:00-07:00"`

#### `last_updated` (Required)
**Type:** ISO 8601 datetime
**Description:** Last modification timestamp (auto-update on edits)
**Example:** `"2025-10-23T11:00:00-07:00"`

#### `last_reviewed` (Required)
**Type:** ISO 8601 datetime
**Description:** Last human review date (not just edits)
**Example:** `"2025-10-23T11:00:00-07:00"`

#### `next_review_due` (Optional)
**Type:** Date (YYYY-MM-DD)
**Description:** When next review is due (based on review_cadence)
**Example:** `"2025-11-23"`

---

### Dependencies

#### `depends_on` (Optional)
**Type:** List of file paths
**Description:** Documents/files this document depends on
**Use:** When those files change, this doc may need updates
**Example:**
```yaml
depends_on:
  - docs/architecture/solution-architecture.md
  - apps/web/prisma/schema.prisma
```

#### `affects` (Optional)
**Type:** List of file paths
**Description:** Documents affected when this doc changes
**Use:** Know what to update when this doc changes
**Example:**
```yaml
affects:
  - docs/developer-guides/getting-started.md
  - docs/testing/index.md
```

#### `related_adrs` (Optional)
**Type:** List of ADR paths
**Description:** Related Architecture Decision Records
**Example:**
```yaml
related_adrs:
  - docs/architecture/ADR-001-hybrid-typescript-python.md
```

---

### Audience & Discovery

#### `audience` (Optional)
**Type:** List of audience types
**Options:**
- `new-developers` - Onboarding juniors
- `experienced-devs` - Team members
- `external-contributors` - Open source contributors
- `stakeholders` - PM/business/non-technical

#### `technical_level` (Optional)
**Type:** Enum
**Options:** `Beginner`, `Intermediate`, `Advanced`, `Expert`
**Description:** Technical complexity level

#### `tags` (Optional)
**Type:** List of strings
**Description:** Categorical tags for filtering/searching
**Example:** `["api", "authentication", "epic-4", "production-ready"]`

#### `keywords` (Optional)
**Type:** List of strings
**Description:** Search keywords (technical terms, acronyms)
**Example:** `["OAuth 2.0", "JWT tokens", "FastAPI"]`

#### `search_priority` (Optional)
**Type:** Enum
**Options:** `low`, `medium`, `high`, `critical`
**Description:** Search result ranking priority

---

### Lifecycle

#### `lifecycle.stage` (Required)
**Type:** Enum
**Options:** `Draft`, `Review`, `Active`, `Deprecated`, `Archived`
**Description:** Current lifecycle stage (same as `status` field)

#### `lifecycle.deprecation_date` (Optional)
**Type:** Date (YYYY-MM-DD)
**Description:** When document becomes deprecated
**Example:** `"2025-12-31"`

#### `lifecycle.replacement_doc` (Optional)
**Type:** File path
**Description:** Link to replacement document if deprecated
**Example:** `docs/architecture/ADR-002-new-approach.md`

#### `lifecycle.archive_after` (Optional)
**Type:** Date (YYYY-MM-DD)
**Description:** Auto-archive date (for completed epic docs)
**Example:** `"2026-10-23"` (1 year after epic completion)

---

### Metrics (Optional)

These fields enable documentation health dashboards.

#### `metrics.word_count` (Optional)
**Type:** Number
**Description:** Approximate word count
**Tool:** Use `wc -w filename.md` or editor word count

#### `metrics.reading_time_min` (Optional)
**Type:** Number
**Description:** Estimated reading time in minutes (200 words/min)
**Calculation:** `word_count / 200`

#### `metrics.code_examples` (Optional)
**Type:** Number
**Description:** Number of code blocks in document
**Tool:** Count ` ```language ` blocks

#### `metrics.last_link_check` (Optional)
**Type:** ISO 8601 datetime
**Description:** Last time links were validated
**Tool:** `markdown-link-check` or CI pipeline

#### `metrics.broken_links` (Optional)
**Type:** Number
**Description:** Number of broken links found
**Target:** Should be 0

---

### Changelog

#### `changelog` (Optional but Recommended)
**Type:** List of changelog entries
**Description:** Track document version history
**Structure:**
```yaml
changelog:
  - version: "1.1"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Added new section"
      - "Updated examples"
```

---

## Examples by Document Type

### Example 1: Architecture Document

```yaml
---
title: "Solution Architecture"
description: "Complete system architecture for Americano adaptive learning platform"
type: "Architecture"
status: "Active"
version: "2.0"

owner: "Kevy"
dri_backup: "Winston (Architect)"
contributors: ["Amelia", "Database Optimizer"]
review_cadence: "Monthly"

created_date: "2025-10-14T09:00:00-07:00"
last_updated: "2025-10-23T11:00:00-07:00"
last_reviewed: "2025-10-23T11:00:00-07:00"
next_review_due: "2025-11-23"

depends_on:
  - docs/architecture/ADR-001-hybrid-typescript-python.md
  - docs/PRD-Americano-2025-10-14.md
affects:
  - docs/developer-guides/getting-started.md
  - docs/api-contracts.md
  - docs/data-models.md
related_adrs:
  - docs/architecture/ADR-001-hybrid-typescript-python.md
  - docs/architecture/ADR-003-two-tier-caching.md

audience:
  - experienced-devs
  - external-contributors
technical_level: "Advanced"
tags: ["architecture", "system-design", "epic-3", "epic-4", "epic-5"]
keywords: ["Next.js 15", "FastAPI", "PostgreSQL", "pgvector", "hybrid architecture"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 8500
  reading_time_min: 42
  code_examples: 18
  last_link_check: "2025-10-23T10:00:00-07:00"
  broken_links: 0

changelog:
  - version: "2.0"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Added Epic 5 behavioral twin architecture"
      - "Updated caching strategy to two-tier (Redis + in-memory)"
  - version: "1.0"
    date: "2025-10-14"
    author: "Winston"
    changes:
      - "Initial architecture documentation"
---
```

### Example 2: API Documentation

```yaml
---
title: "Epic 5 Analytics API Reference"
description: "REST API endpoints for behavioral analytics and personalization"
type: "API"
status: "Active"
version: "1.0"

owner: "Amelia"
dri_backup: "Kevy"
review_cadence: "Per Change"

created_date: "2025-10-20T14:30:00-07:00"
last_updated: "2025-10-21T16:00:00-07:00"
last_reviewed: "2025-10-21T16:00:00-07:00"
next_review_due: null

depends_on:
  - apps/web/docs/api/openapi.yaml
  - docs/data-models.md
affects:
  - docs/developer-guides/getting-started.md
related_adrs:
  - docs/architecture/ADR-003-two-tier-caching.md

audience:
  - experienced-devs
  - external-contributors
technical_level: "Intermediate"
tags: ["api", "epic-5", "analytics", "rest"]
keywords: ["REST endpoints", "behavioral analytics", "caching"]
search_priority: "high"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 2400
  reading_time_min: 12
  code_examples: 15
  last_link_check: "2025-10-21T15:00:00-07:00"
  broken_links: 0

changelog:
  - version: "1.0"
    date: "2025-10-21"
    author: "Amelia"
    changes:
      - "Initial API documentation for Epic 5"
---
```

### Example 3: Developer Guide

```yaml
---
title: "Development Environment Setup"
description: "Complete guide to setting up local development environment for Americano"
type: "Guide"
status: "Active"
version: "1.2"

owner: "Kevy"
review_cadence: "Quarterly"

created_date: "2025-10-14T10:00:00-07:00"
last_updated: "2025-10-21T09:00:00-07:00"
last_reviewed: "2025-10-21T09:00:00-07:00"
next_review_due: "2026-01-21"

depends_on:
  - docs/solution-architecture.md
affects:
  - docs/developer-guides/first-aid-cache-usage.md

audience:
  - new-developers
  - external-contributors
technical_level: "Beginner"
tags: ["setup", "development", "onboarding"]
keywords: ["local development", "PostgreSQL", "Node.js", "Python", "pnpm"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 1800
  reading_time_min: 9
  code_examples: 8
  last_link_check: "2025-10-21T08:00:00-07:00"
  broken_links: 0

changelog:
  - version: "1.2"
    date: "2025-10-21"
    author: "Kevy"
    changes:
      - "Added Python ML service setup steps"
  - version: "1.1"
    date: "2025-10-17"
    author: "Kevy"
    changes:
      - "Updated for FastAPI service setup"
  - version: "1.0"
    date: "2025-10-14"
    author: "Amelia"
    changes:
      - "Initial setup guide"
---
```

### Example 4: Epic Completion Document

```yaml
---
title: "Epic 5: Behavioral Learning Twin - Completion Summary"
description: "Complete summary of Epic 5 deliverables, metrics, and retrospective"
type: "Epic"
status: "Active"
version: "1.0"

owner: "Kevy"
review_cadence: "Per Epic"

created_date: "2025-10-21T16:00:00-07:00"
last_updated: "2025-10-21T17:30:00-07:00"
last_reviewed: "2025-10-21T17:30:00-07:00"
next_review_due: null

depends_on:
  - docs/stories/story-5.1.md
  - docs/stories/story-5.2.md
  - docs/stories/story-5.3.md
  - docs/stories/story-5.4.md
  - docs/stories/story-5.5.md
  - docs/stories/story-5.6.md
affects:
  - docs/index.md
  - CHANGELOG.md
related_adrs:
  - docs/architecture/ADR-003-two-tier-caching.md
  - docs/architecture/ADR-004-oklch-glassmorphism.md

audience:
  - stakeholders
  - experienced-devs
technical_level: "Intermediate"
tags: ["epic-5", "retrospective", "completion", "behavioral-twin"]
keywords: ["behavioral analytics", "ML predictions", "cognitive health"]
search_priority: "high"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: "2026-10-21"  # Archive after 1 year

metrics:
  word_count: 12000
  reading_time_min: 60
  code_examples: 25
  last_link_check: "2025-10-21T17:00:00-07:00"
  broken_links: 0

changelog:
  - version: "1.0"
    date: "2025-10-21"
    author: "Kevy"
    changes:
      - "Epic 5 completion documentation"
---
```

---

## Best Practices

### Required vs. Optional Fields

**Always Include (Required):**
- `title`, `description`, `type`, `status`, `version`
- `owner`, `review_cadence`
- `created_date`, `last_updated`, `last_reviewed`
- `lifecycle.stage`

**Include When Applicable:**
- `depends_on` / `affects` - For interconnected docs
- `related_adrs` - For architecture/design docs
- `audience` / `technical_level` - For guides and tutorials
- `tags` / `keywords` - For searchability
- `metrics` - For automated health tracking
- `changelog` - For frequently updated docs

### Timestamps

- **Always use ISO 8601 format with timezone:** `2025-10-23T11:00:00-07:00`
- **Update `last_updated` on every edit**
- **Update `last_reviewed` only on human reviews** (not automated edits)
- **Calculate `next_review_due`** based on `review_cadence`

### Version Numbers

- **Major version (X.0.0):** Breaking changes, major rewrites
- **Minor version (1.X.0):** New sections, significant additions
- **Patch version (1.0.X):** Typos, small corrections (optional)

### Lifecycle Management

- **Draft → Review → Active:** Standard approval flow
- **Active → Deprecated:** Mark `deprecation_date` and `replacement_doc`
- **Active → Archived:** Set `archive_after` for completed epic docs (1 year default)

---

## Validation Checklist

Before committing documentation with frontmatter:

- [ ] All required fields present
- [ ] ISO 8601 timestamps with timezone
- [ ] `owner` assigned (DRI)
- [ ] `review_cadence` appropriate for doc type
- [ ] `depends_on` / `affects` accurate (if applicable)
- [ ] `type` matches document content
- [ ] `status` reflects current state
- [ ] `version` incremented on significant changes
- [ ] `changelog` entry added for this version

---

## Tools & Automation

### Frontmatter Validation

```bash
# Validate frontmatter in all docs (coming soon)
npm run validate:frontmatter
```

### Auto-Update Last Updated

```bash
# Git pre-commit hook to auto-update last_updated timestamp
# .git/hooks/pre-commit
#!/bin/bash
# Update last_updated in staged markdown files
```

### Doc Health Dashboard

```bash
# Generate documentation health metrics (coming soon)
npm run docs:health
```

---

## FAQ

**Q: Do all docs need frontmatter?**
A: Yes, all documentation files (especially in `docs/`) should have frontmatter. Exceptions: generated files, temporary notes.

**Q: What if I don't know the owner?**
A: Default to `"Kevy"` or `"Team"`. Assign a proper owner in the next review cycle.

**Q: How strict are the enums (type, status, etc.)?**
A: Follow the defined options. If you need a new option, propose it in the #documentation Slack channel.

**Q: Should I update frontmatter on typo fixes?**
A: Update `last_updated` yes, but version/changelog only for significant changes.

**Q: Can I add custom fields?**
A: Yes, add custom fields as needed. Document them in this file if they're reusable.

---

**Maintained By:** Americano Documentation Team
**Last Updated:** 2025-10-23T11:00:00-07:00
**Version:** 1.0

---

## Frontmatter Checklist (PR Gate)

- Title accurately reflects the document and matches H1
- Description is present (1–2 sentences)
- Type is one of: Architecture | API | Data | Guide | Testing | Epic | Story | Operations
- Status is set (Active | Draft | Review | Deprecated | Archived)
- Owner is assigned (team or individual)
- created_date and last_updated are ISO 8601 with timezone
- Tags/depends_on/affects/related_adrs populated when relevant
- For archived docs under `docs/deprecated/**`, status is Archived
- If consolidating/renaming, update inbound links and `docs/index.md`
