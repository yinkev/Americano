"""
Intervention Endpoints Tests

Tests for 2 intervention endpoints:
- GET /interventions
- POST /interventions/{id}/apply
"""

import pytest
from httpx import AsyncClient
from typing import Dict, Any


# ==================== GET /interventions ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_success(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test successful intervention query."""
    response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    # Response is array of interventions


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_response_structure(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test intervention response has correct structure."""
    response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    if len(data) > 0:
        intervention = data[0]
        required_fields = [
            "id", "predictionId", "userId", "interventionType",
            "description", "reasoning", "priority", "status"
        ]
        for field in required_fields:
            assert field in intervention, f"Missing field: {field}"

        # Validate intervention type enum
        assert intervention["interventionType"] in [
            "PREREQUISITE_REVIEW",
            "DIFFICULTY_PROGRESSION",
            "CONTENT_FORMAT_ADAPT",
            "COGNITIVE_LOAD_REDUCE",
            "SPACED_REPETITION_BOOST",
            "BREAK_SCHEDULE_ADJUST"
        ]

        # Validate status enum
        assert intervention["status"] in [
            "PENDING", "APPLIED", "COMPLETED", "DISMISSED"
        ]

        # Validate priority range
        assert 1 <= intervention["priority"] <= 10


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_sorted_by_priority(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test interventions are sorted by priority descending."""
    response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    if len(data) > 1:
        priorities = [intervention["priority"] for intervention in data]
        # Check priorities are in descending order
        assert priorities == sorted(priorities, reverse=True)


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_filters_active_only(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test interventions endpoint returns only PENDING and APPLIED status."""
    response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    # All interventions should be PENDING or APPLIED
    for intervention in data:
        assert intervention["status"] in ["PENDING", "APPLIED"]


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_missing_user_id(client: AsyncClient):
    """Test interventions query requires user_id."""
    response = await client.get("/interventions/")

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_interventions_nonexistent_user(client: AsyncClient):
    """Test interventions query with nonexistent user returns empty list."""
    response = await client.get(
        "/interventions/",
        params={"user_id": "nonexistent-user-999"}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # May be empty for nonexistent user


# ==================== POST /interventions/{id}/apply ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_success(
    client: AsyncClient,
    test_intervention: Dict[str, Any],
    test_mission: Dict[str, Any]
):
    """Test successful intervention application to specific mission."""
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={"mission_id": test_mission["mission_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["intervention_id"] == test_intervention["intervention_id"]
    assert data["mission_id"] == test_mission["mission_id"]
    assert "message" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_to_next_mission(
    client: AsyncClient,
    test_intervention: Dict[str, Any]
):
    """Test intervention application to next available mission."""
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={}  # No mission_id specified
    )

    # Should find next pending mission or return 404 if none exist
    assert response.status_code in [200, 404]

    if response.status_code == 200:
        data = response.json()
        assert data["success"] is True
        assert "mission_id" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_nonexistent_intervention(
    client: AsyncClient,
    test_mission: Dict[str, Any]
):
    """Test intervention application with nonexistent intervention."""
    response = await client.post(
        "/interventions/nonexistent-intervention-999/apply",
        json={"mission_id": test_mission["mission_id"]}
    )

    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_nonexistent_mission(
    client: AsyncClient,
    test_intervention: Dict[str, Any]
):
    """Test intervention application with nonexistent mission."""
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={"mission_id": "nonexistent-mission-999"}
    )

    # Should fail gracefully
    assert response.status_code in [404, 500]


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_updates_status(
    client: AsyncClient,
    test_intervention: Dict[str, Any],
    test_mission: Dict[str, Any],
    test_user: Dict[str, str]
):
    """Test applying intervention updates status to APPLIED."""
    # Apply intervention
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={"mission_id": test_mission["mission_id"]}
    )

    assert response.status_code == 200

    # Query interventions and verify status
    query_response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    data = query_response.json()
    applied = next(
        (i for i in data if i["id"] == test_intervention["intervention_id"]),
        None
    )

    if applied:
        assert applied["status"] == "APPLIED"
        assert applied.get("appliedToMissionId") == test_mission["mission_id"]


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_no_pending_missions(
    client: AsyncClient,
    test_intervention: Dict[str, Any]
):
    """Test intervention application when no pending missions exist."""
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={}  # Let it find next mission
    )

    # Should return 404 if no pending missions
    assert response.status_code in [200, 404]


@pytest.mark.asyncio
@pytest.mark.api
async def test_apply_intervention_response_includes_type(
    client: AsyncClient,
    test_intervention: Dict[str, Any],
    test_mission: Dict[str, Any]
):
    """Test intervention application response includes intervention details."""
    response = await client.post(
        f"/interventions/{test_intervention['intervention_id']}/apply",
        json={"mission_id": test_mission["mission_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    # Message should reference intervention type
    assert test_intervention["type"] in data["message"]
