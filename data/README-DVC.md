# DVC Data Versioning for Americano Research Analytics

**Status:** ACTIVE | **Type:** Data Infrastructure
**Owner:** Kevy | **Last Updated:** 2025-10-27
**ADR Reference:** ADR-006 Research Analytics Infrastructure

---

## Overview

This directory uses [DVC (Data Version Control)](https://dvc.org) to track large data files for research-grade analytics while keeping the git repository lightweight.

**Key Benefits:**
- Version control for databases and datasets
- Reproducible research pipeline
- Efficient storage (only metadata in git)
- Easy collaboration (shared remote storage)

---

## Quick Start

### First Time Setup (New Team Member)

1. **Install DVC:**
   ```bash
   pip install dvc
   # or
   brew install dvc
   ```

2. **Pull the data:**
   ```bash
   cd /Users/kyin/Projects/Americano
   dvc pull
   ```

   This downloads:
   - `data/americano_analytics.duckdb` (12 KB initial, grows with data)
   - Future tracked datasets

3. **Verify data exists:**
   ```bash
   ls -lh data/*.duckdb
   # Should show: americano_analytics.duckdb
   ```

---

## Working with DVC

### Check Status

```bash
dvc status
```

**Output meanings:**
- `Data and pipelines are up to date.` - All good!
- `modified: data/americano_analytics.duckdb` - Local file changed
- `deleted: data/americano_analytics.duckdb` - Need to run `dvc checkout`

### Pull Latest Data

```bash
# Pull all tracked data
dvc pull

# Pull specific file
dvc pull data/americano_analytics.duckdb.dvc
```

### After Modifying Data

```bash
# 1. Add updated file to DVC
dvc add data/americano_analytics.duckdb

# 2. Commit the .dvc metadata file
git add data/americano_analytics.duckdb.dvc
git commit -m "Update analytics database with new behavioral events"

# 3. Push data to remote storage
dvc push

# 4. Push git metadata
git push
```

---

## Data Files Tracked by DVC

| File | Purpose | Size | Update Frequency |
|------|---------|------|------------------|
| `americano_analytics.duckdb` | Research analytics database | ~12 KB (grows) | After each data sync |
| `behavioral_events_*.parquet` | Event exports (future) | TBD | Daily/weekly |

---

## DVC Configuration

### Current Setup

**Remote Storage:**
- **Type:** Local filesystem (development)
- **Path:** `/tmp/americano-dvc-cache`
- **Status:** Temporary (will upgrade to S3/GCS for production)

**View config:**
```bash
dvc config -l
```

**Output:**
```
core.remote=local
remote.local.url=/tmp/americano-dvc-cache
```

### Upgrading to Cloud Storage (Future)

**Option 1: AWS S3**
```bash
dvc remote add -d s3remote s3://americano-dvc-data/cache
dvc remote modify s3remote region us-west-2
```

**Option 2: Google Cloud Storage**
```bash
dvc remote add -d gcs gs://americano-dvc-data/cache
```

**Option 3: Azure Blob Storage**
```bash
dvc remote add -d azure azure://americano-dvc-data/cache
```

---

## Data Lifecycle

### 1. Generate/Export Data

```bash
# Export behavioral events from PostgreSQL
python apps/ml-service/scripts/export_behavioral_events.py

# Sync to DuckDB
python apps/ml-service/scripts/duckdb_setup.py sync
```

### 2. Track with DVC

```bash
dvc add data/americano_analytics.duckdb
```

### 3. Commit Metadata

```bash
git add data/americano_analytics.duckdb.dvc data/.gitignore
git commit -m "Update research analytics database (Day 7-8 sync)"
```

### 4. Share with Team

```bash
dvc push  # Upload data to remote
git push  # Upload metadata to git
```

---

## Troubleshooting

### "Data file not found"

**Problem:** `data/americano_analytics.duckdb` missing
**Solution:**
```bash
dvc pull
```

### "No DVC remote configured"

**Problem:** DVC can't push/pull data
**Solution:**
```bash
dvc remote list
# If empty, configure remote (see "DVC Configuration" above)
```

### "Permission denied" on /tmp/americano-dvc-cache

**Problem:** Cache directory not writable
**Solution:**
```bash
mkdir -p /tmp/americano-dvc-cache
chmod 755 /tmp/americano-dvc-cache
```

### "DVC file modified but data unchanged"

**Problem:** `.dvc` file shows changes but data is identical
**Solution:**
```bash
dvc checkout  # Reset to tracked version
```

---

## DVC Commands Cheatsheet

| Task | Command |
|------|---------|
| Initialize DVC (already done) | `dvc init` |
| Track a new file | `dvc add <file>` |
| Download data | `dvc pull` |
| Upload data | `dvc push` |
| Check status | `dvc status` |
| Reset to tracked version | `dvc checkout` |
| List remotes | `dvc remote list` |
| View config | `dvc config -l` |
| Remove file from tracking | `dvc remove <file.dvc>` |

---

## Integration with Research Pipeline

### Day 7-8: Research Analytics (ADR-006)

DVC supports the following workflow:

```
PostgreSQL (operational)
    ↓ export
Parquet files (data/raw/)
    ↓ sync
DuckDB (data/americano_analytics.duckdb) ← Tracked by DVC
    ↓ query
Research notebooks (apps/ml-service/notebooks/)
    ↓ results
Analysis reports (docs/research-analytics/)
```

### Reproducibility Checklist

To reproduce research results:
1. Clone repo: `git clone <repo-url>`
2. Checkout specific commit: `git checkout <commit-sha>`
3. Pull data: `dvc pull`
4. Run analysis: `python apps/ml-service/scripts/example_duckdb_queries.py`

**Result:** Exact same data + code = reproducible analysis

---

## Best Practices

### DO:
- Run `dvc status` before starting work
- Commit `.dvc` files to git after `dvc add`
- Push data (`dvc push`) before pushing git
- Use descriptive commit messages when updating data

### DON'T:
- Commit large data files directly to git
- Manually edit `.dvc` metadata files
- Delete `.dvc` files without running `dvc remove`
- Forget to run `dvc push` after `dvc add`

---

## Additional Resources

- **DVC Documentation:** https://dvc.org/doc
- **DVC Tutorial:** https://dvc.org/doc/start
- **DVC with ML Pipelines:** https://dvc.org/doc/user-guide/pipelines
- **DVC Studio (UI):** https://studio.dvc.ai

---

## Support

**Questions?** Ask in:
- Slack: #americano-dev
- Email: kevy@americano.dev
- GitHub Issues: Tag with `data-infrastructure`

**Maintainer:** Kevy (DRI for data infrastructure)
**Review Cadence:** Monthly or per major data update
