---
title: "Legacy ML Service (Deprecated)"
description: "This folder contains an older copy of the ML service. Active service lives at apps/ml-service."
type: "Guide"
status: "Deprecated"
version: "1.0"
owner: "Kevy"
review_cadence: "Per Change"
created_date: "2025-10-24T00:00:00-07:00"
last_updated: "2025-10-24T00:00:00-07:00"
last_reviewed: "2025-10-24T00:00:00-07:00"
depends_on:
  - apps/ml-service
audience:
  - experienced-devs
technical_level: "Intermediate"
tags: ["ml-service", "deprecation"]
lifecycle:
  stage: "Deprecated"
---

This directory is deprecated. Use `apps/ml-service` for the active Predictive Analytics service.

Actions taken:
- Root scripts now point to `apps/ml-service`.
- Keep this copy for historical reference only; do not modify or run.

Migration path:
- Move any missing files or data you still need into `apps/ml-service`.
- Remove this directory once you confirm parity.

