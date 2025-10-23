# Vale Grammar and Style Checking

Vale is a grammar and style linter for prose. It's configured to check documentation for style consistency and readability.

## Installation

### macOS
```bash
brew install vale
```

### Linux
```bash
# Download from https://vale.sh
wget https://github.com/errata-ai/vale/releases/download/v2.29.6/vale_2.29.6_Linux_64-bit.tar.gz
tar -xvzf vale_2.29.6_Linux_64-bit.tar.gz
sudo mv vale /usr/local/bin/
```

### Windows
```powershell
choco install vale
```

## Setup

After installing Vale, initialize the styles:

```bash
vale sync
```

This downloads the required style packages (Vale, write-good).

## Usage

Run Vale on documentation:

```bash
# Check all docs
vale docs/

# Check specific file
vale docs/index.md

# Check with specific severity
vale --minAlertLevel=error docs/
```

## Configuration

Vale is configured in `.vale.ini` with:

- **MinAlertLevel**: `suggestion` - Shows all suggestions, warnings, and errors
- **Styles**: `Vale`, `write-good` - Standard style rules
- **Medical Vocabulary**: Custom terms in `.vale/styles/Medical/terms.yml`

### Disabled Rules

- `write-good.Passive` - Medical writing often requires passive voice
- `write-good.TooWordy` - Technical docs need precision over brevity
- `write-good.E-Prime` - Allows "is/are" constructions

## Medical Terminology

Custom medical and technical terms are defined in `.vale/styles/Medical/terms.yml` including:

- Medical specialties (cardiology, neurology, etc.)
- Clinical terms (tachycardia, dyspnea, etc.)
- Technical terms (TypeScript, PostgreSQL, etc.)
- Americano-specific terms (FSRS, pgvector, etc.)

## CI Integration

Vale runs automatically in GitHub Actions on pull requests that modify markdown files. See `.github/workflows/docs-quality.yml` for configuration.

## Optional Use

Vale is **optional** for local development but runs automatically in CI. It provides suggestions to improve documentation quality but doesn't block merges.
