"""
Health Endpoint Tests

Tests for service health check and root endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.api
@pytest.mark.smoke
async def test_health_check_success(client: AsyncClient):
    """Test health endpoint returns healthy status."""
    response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "ml-service"
    assert data["version"] == "1.0.0"
    assert "environment" in data
    assert data["database"] in ["connected", "disconnected"]


@pytest.mark.asyncio
@pytest.mark.api
@pytest.mark.smoke
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint returns service information."""
    response = await client.get("/")

    assert response.status_code == 200
    data = response.json()

    assert data["service"] == "Americano ML Service"
    assert "Predictive Analytics" in data["description"]
    assert data["version"] == "1.0.0"
    assert data["health"] == "/health"


@pytest.mark.asyncio
@pytest.mark.api
async def test_health_check_includes_all_fields(client: AsyncClient):
    """Test health check response includes all required fields."""
    response = await client.get("/health")
    data = response.json()

    required_fields = ["status", "service", "version", "environment", "database"]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


@pytest.mark.asyncio
@pytest.mark.api
async def test_root_endpoint_documentation_links(client: AsyncClient):
    """Test root endpoint includes documentation references."""
    response = await client.get("/")
    data = response.json()

    assert "docs" in data
    assert "health" in data

    # Docs should be available in development
    assert data["docs"] in ["/docs", "disabled"]


@pytest.mark.asyncio
@pytest.mark.smoke
async def test_service_responds_quickly(client: AsyncClient):
    """Test health endpoint responds within acceptable time."""
    import time

    start = time.time()
    response = await client.get("/health")
    duration = time.time() - start

    assert response.status_code == 200
    assert duration < 1.0, f"Health check took {duration}s, expected <1s"
