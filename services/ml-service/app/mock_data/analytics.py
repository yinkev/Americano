"""Helpers for sharing analytics mock payloads with Python runtimes.

This module mirrors the TypeScript helpers in ``apps/web/src/lib/mocks/analytics.ts``
and guarantees both environments read the same JSON fixtures.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / 'data' / 'mock' / 'analytics'
CONTRACTS_PATH = DATA_DIR / 'contracts.json'

MOCK_METADATA: Dict[str, str] = {
    'source': 'mock',
    'version': '2025-01',
}

@lru_cache(maxsize=1)
def load_analytics_contracts() -> Dict[str, Any]:
    """Return the parsed analytics mock contracts."""
    with CONTRACTS_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def get_analytics_mock(key: str) -> Any:
    """Fetch a single analytics mock payload by contract name."""
    contracts = load_analytics_contracts()
    try:
        return contracts[key]
    except KeyError as exc:
        available = ', '.join(sorted(contracts))
        raise KeyError(f"Unknown analytics mock key '{key}'. Available: {available}") from exc


def list_analytics_mocks() -> Dict[str, Any]:
    """Return a shallow copy of all analytics mock payloads."""
    return dict(load_analytics_contracts())
