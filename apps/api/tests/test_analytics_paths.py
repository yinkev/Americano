from fastapi.testclient import TestClient

# Import the FastAPI app
from main import app


def test_analytics_comparison_path_in_openapi():
    client = TestClient(app)
    r = client.get('/openapi.json')
    assert r.status_code == 200
    paths = r.json().get('paths', {})
    # Correct path exists (relative to router prefix '/analytics')
    assert '/analytics/understanding/comparison' in paths
    # Old double-prefixed path must not exist
    assert '/analytics/analytics/understanding/comparison' not in paths

