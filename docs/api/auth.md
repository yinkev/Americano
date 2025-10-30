# Americano Backend API Authentication & Authorization

**Generated:** 2025-10-29

This document details the authentication and security strategy for the Americano backend API services.

---

## Current Authentication Status

**⚠️ IMPORTANT:** Currently, **NO authentication or authorization** is implemented in either service.

Both the Main API Service and ML Service are currently **open APIs** without any authentication middleware, authorization checks, or user session management.

---

## Security Assessment

### Current Security State

| Component | Status | Details |
|-----------|--------|---------|
| **Authentication** | ❌ Not Implemented | No JWT, OAuth, session management |
| **Authorization** | ❌ Not Implemented | No role-based access control |
| **API Key Validation** | ❌ Not Implemented | No API key middleware |
| **Rate Limiting** | ❌ Not Implemented | No rate limiting configured |
| **Request Authentication** | ❌ Not Implemented | No auth headers required |
| **User Session Management** | ❌ Not Implemented | Stateless, no session persistence |
| **CORS** | ✅ Configured | Wildcard origins allowed (configurable) |
| **Input Validation** | ✅ Implemented | Pydantic models for request validation |

---

## Service-Specific Security Analysis

### Main API Service (`apps/api`)

#### Current State

```python
# apps/api/main.py - Line 38-44
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Key Points:**
- CORS is configured but allows all methods/headers
- No authentication middleware present
- No dependency injections for auth checking
- All endpoints are publicly accessible
- User identification expected via request body fields (e.g., `user_id`)

#### Endpoints Requiring Authentication (Current Implementation)

While authentication is not enforced, the following endpoints **should** be protected in production:

1. **`POST /validation/generate-prompt`** - Should require user authentication
2. **`POST /validation/evaluate`** - Stores user responses, needs auth
3. **`POST /validation/scenarios/evaluate`** - User-specific evaluation data
4. **`POST /challenge/feedback`** - User feedback submission
5. **`POST /challenge/detect-patterns`** - User-specific pattern analysis
6. **`POST /adaptive/question/next`** - Session tracking per user
7. **`GET /adaptive/session/{session_id}/metrics`** - Session data retrieval
8. **All `/analytics/*` endpoints** - User-specific analytics and recommendations
9. **`POST /predictions/*` in ML Service** - User predictions

#### Data Flow (Current)

```python
# Expected user_id field in requests
{
  "user_id": "string",  # No validation or authentication
  ...
}
```

**Issue:** Any client can submit any `user_id`, leading to:
- Unauthorized access to other users' data
- Data leakage between users
- No audit trail for user actions
- Impossible to verify data integrity

---

### ML Service (`apps/ml-service`)

#### Current State

```python
# apps/ml-service/app/main.py - Line 77-84
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)
```

**Key Points:**
- CORS is more restrictive (specific methods listed)
- Prisma client has no auth layer
- Endpoints accept `user_id` parameter without verification
- Database queries execute for any user ID provided

#### Prisma Integration

```python
# apps/ml-service/app/routes/predictions.py - Line 102-130
async def get_predictions(
    user_id: str,  # No auth validation
    status: Optional[PredictionStatus] = None,
    min_probability: float = 0.5,
    db: Prisma = Depends(get_db)
):
```

**Issue:** Prisma queries execute for any `user_id` string, no ownership verification.

---

## Recommended Authentication Strategy

### Option 1: JWT-Based Authentication (Recommended)

#### Implementation Approach

**1. Install Dependencies**
```bash
pip install python-jose[cryptography] passlib[bcrypt]
# or
pip install authlib
```

**2. Add Authentication Middleware**

```python
# apps/api/src/auth/middleware.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
```

**3. Protect Endpoints**

```python
# apps/api/src/validation/routes.py
@router.post("/evaluate")
async def evaluate_comprehension(
    request: EvaluationRequest,
    user: dict = Depends(verify_token)  # Add auth dependency
):
    # user["user_id"] contains verified user ID
    request.user_id = user["user_id"]
    result = await evaluator.evaluate_comprehension(request)
    return result
```

**4. Generate Tokens (Frontend Integration Point)**

```python
# apps/api/src/auth/token_handler.py
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

---

### Option 2: API Key-Based Authentication

#### Implementation Approach

**1. Generate API Keys**

```python
# apps/api/src/auth/api_keys.py
import secrets
import hashlib

def generate_api_key():
    """Generate a secure API key."""
    return secrets.token_urlsafe(32)

def hash_api_key(api_key: str):
    """Hash API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()
```

**2. Middleware for API Key Validation**

```python
# apps/api/src/auth/middleware.py
from fastapi import HTTPException, status

async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    # Validate against database
    # return user_id
```

**3. Protect Endpoints**

```python
@router.post("/evaluate")
async def evaluate_comprehension(
    request: EvaluationRequest,
    user: dict = Depends(verify_api_key)
):
    # user["user_id"] contains verified user ID
```

---

### Option 3: OAuth 2.0 / OpenID Connect

#### Use Case
Best for enterprise deployment or integration with existing identity providers (Google, Microsoft, Auth0, etc.).

#### Implementation Approach

```python
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def verify_oauth_token(token: str = Depends(oauth2_scheme)):
    # Verify against OAuth provider
    # Return user claims
    pass
```

**Recommended Libraries:**
- `authlib` - Full-featured OAuth implementation
- `python-jose` - JWT handling
- `python-multipart` - Form data handling

---

## Authorization Strategy

### Role-Based Access Control (RBAC)

**Proposed User Roles:**

1. **Student** - Default role
   - Access: Own validation results, analytics, recommendations
   - Restrictions: Cannot access other users' data

2. **Instructor** - Teaching role
   - Access: Own data + anonymized aggregate data
   - Restrictions: Cannot see individual student data without consent

3. **Administrator** - Administrative role
   - Access: All data
   - Responsibilities: User management, system configuration

**Implementation:**

```python
# apps/api/src/auth/permissions.py
from enum import Enum

class UserRole(Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

def require_role(required_role: UserRole):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            user = kwargs.get("user")  # From auth dependency
            if user["role"] != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required: {required_role.value}"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage:
@router.get("/admin/users")
@require_role(UserRole.ADMIN)
async def list_users(user: dict = Depends(verify_token)):
    ...
```

---

## Data Isolation Strategy

### Current Implementation (Insecure)

```python
# ANY user can access ANY data by changing user_id parameter
POST /analytics/dashboard
{
  "user_id": "any_arbitrary_string"  # No validation!
}
```

### Proposed Secure Implementation

```python
# apps/api/src/analytics/routes.py
@router.post("/understanding/dashboard")
async def get_dashboard_summary(
    request: DashboardRequest,  # No user_id field needed!
    session: AsyncSession = Depends(get_db_session),
    user: dict = Depends(verify_token)  # Extract from auth token
):
    # User ID comes from authentication token, not request body
    user_id = user["user_id"]

    # Query database with authenticated user_id
    query = text("SELECT ... WHERE vr.user_id = :user_id")
    result = await session.execute(query, {"user_id": user_id})
    ...
```

**Benefits:**
- No way to query other users' data
- Consistent security model
- Audit trail for data access
- Simpler request models

---

## Rate Limiting

### Recommended Middleware

```python
# apps/api/src/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Usage:
@router.post("/validate/evaluate")
@limiter.limit("10/minute")  # 10 evaluations per minute
async def evaluate_comprehension(request: Request, ...):
    ...
```

**Install:**
```bash
pip install slowapi
```

**Proposed Limits:**
- Evaluation endpoints: 10/minute per user
- Analytics endpoints: 30/minute per user
- Prediction generation: 5/minute per user
- Health check: 100/minute per IP

---

## CORS Configuration Hardening

### Current Configuration (Insecure)

```python
# Main API - apps/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # ALL methods allowed
    allow_headers=["*"],  # ALL headers allowed
)
```

### Proposed Secure Configuration

```python
# apps/api/src/config.py
class Settings(BaseSettings):
    # ... existing settings ...
    cors_origins: list[str] = ["http://localhost:3000"]
    cors_allow_methods: set[str] = {"GET", "POST", "PUT", "DELETE", "OPTIONS"}
    cors_allow_headers: set[str] = {
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since"
    }
```

**Apply:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.cors_allow_methods,  # Specific methods only
    allow_headers=list(settings.cors_allow_headers),  # Specific headers only
)
```

---

## Request Validation Enhancement

### Current State

**✅ Implemented:** Pydantic models validate request structure

**Example:**
```python
# apps/api/src/validation/models.py
class EvaluationRequest(BaseModel):
    prompt_id: str
    user_answer: str
    confidence_level: int = Field(ge=1, le=5)
    objective_text: str
    # Note: No user_id field - needs to be added!
```

### Enhancement Recommendations

**1. Add User ID to All Requests**

```python
# Add user_id to all request models
class EvaluationRequest(BaseModel):
    user_id: str  # Explicit user ID (will be replaced by auth token)
    prompt_id: str
    user_answer: str
    confidence_level: int = Field(ge=1, le=5)
    objective_text: str

    # When auth is implemented, user_id will come from token, not request
```

**2. Add Timestamp Validation**

```python
class EvaluationRequest(BaseModel):
    # ... existing fields ...
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v):
        # Ensure timestamp is not more than 5 minutes old
        if datetime.utcnow() - v > timedelta(minutes=5):
            raise ValueError("Request timestamp too old")
        return v
```

**3. Add Request ID for Audit Trail**

```python
class EvaluationRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    # ... rest of fields ...
```

---

## Audit Logging

### Recommended Implementation

```python
# apps/api/src/middleware/audit.py
import structlog

logger = structlog.get_logger()

async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()

    # Extract user from auth (when implemented)
    user_id = getattr(request.state, "user_id", "anonymous")

    response = await call_next(request)

    # Log all API access
    logger.info(
        "API Request",
        user_id=user_id,
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration=time.time() - start_time,
        request_id=getattr(request.state, "request_id", "unknown")
    )

    return response
```

**Install:**
```bash
pip install structlog
```

---

## Production Security Checklist

### Authentication & Authorization

- [ ] Implement JWT-based authentication
- [ ] Add authentication middleware to all endpoints
- [ ] Remove `user_id` from request bodies (use auth tokens)
- [ ] Implement role-based access control (RBAC)
- [ ] Add API key authentication option
- [ ] Implement session management

### Rate Limiting

- [ ] Install and configure `slowapi`
- [ ] Add rate limits to all endpoints
- [ ] Set different limits for different endpoint types
- [ ] Add rate limit headers to responses

### Input Validation

- [ ] Add `user_id` to all request models (placeholder)
- [ ] Add timestamp validation
- [ ] Add request ID generation
- [ ] Implement request size limits

### CORS

- [ ] Restrict `allow_methods` to specific methods
- [ ] Restrict `allow_headers` to specific headers
- [ ] Validate `Origin` header against whitelist
- [ ] Consider domain-based environment config

### Monitoring & Logging

- [ ] Add audit logging middleware
- [ ] Configure structured logging (JSON format)
- [ ] Add security event alerting
- [ ] Monitor authentication failures
- [ ] Track unusual access patterns

### Database Security

- [ ] Implement row-level security (RLS) in PostgreSQL
- [ ] Add database-level access controls
- [ ] Use connection encryption (SSL)
- [ ] Implement query timeout limits

### HTTPS & Transport Security

- [ ] Enable HTTPS in production
- [ ] Configure SSL/TLS certificates
- [ ] Implement HTTP Strict Transport Security (HSTS)
- [ ] Disable HTTP (redirect to HTTPS)

### Error Handling

- [ ] Remove stack traces from production errors
- [ ] Implement error logging
- [ ] Add error tracking (Sentry, Rollbar, etc.)
- [ ] Sanitize error messages (no secrets in errors)

### Data Protection

- [ ] Encrypt sensitive data at rest
- [ ] Implement data anonymization for analytics
- [ ] Add GDPR compliance measures
- [ ] Implement data retention policies

---

## Migration Path

### Phase 1: Basic Authentication (Week 1-2)

1. Install JWT dependencies
2. Create auth middleware
3. Add authentication to one endpoint as proof of concept
4. Test with frontend integration

### Phase 2: Full API Protection (Week 3-4)

1. Roll out authentication to all endpoints
2. Remove `user_id` from request bodies
3. Implement basic rate limiting
4. Add audit logging

### Phase 3: Authorization & RBAC (Week 5-6)

1. Implement role-based access control
2. Add instructor/admin roles
3. Implement data isolation
4. Add permission checks

### Phase 4: Security Hardening (Week 7-8)

1. Harden CORS configuration
2. Add request validation enhancements
3. Implement comprehensive monitoring
4. Security audit and penetration testing

---

## Integration with Frontend

### Current Frontend Pattern

```javascript
// Next.js - Current implementation
const response = await fetch('/api/validation/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'some-user-id',  // From localStorage/session
    prompt_id: '...',
    user_answer: '...',
    // ...
  }),
});
```

### Proposed Frontend Pattern

```javascript
// Next.js - With authentication
const token = localStorage.getItem('access_token');

const response = await fetch('/api/validation/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Auth token
  },
  body: JSON.stringify({
    prompt_id: '...',
    user_answer: '...',
    // No user_id - comes from token!
  }),
});
```

**Frontend Auth Flow:**

1. User logs in (via separate auth service or NextAuth.js)
2. Frontend receives JWT token
3. Token stored securely (httpOnly cookie preferred, or memory)
4. Token included in all API requests
5. Token refreshed before expiration

---

## Libraries & Dependencies

### Recommended Authentication Libraries

```bash
# JWT handling
pip install python-jose[cryptography]  # or
pip install PyJWT

# Password hashing
pip install passlib[bcrypt]  # or
pip install bcrypt

# Full OAuth implementation
pip install authlib

# Rate limiting
pip install slowapi

# Structured logging
pip install structlog

# Security headers
pip install secure
```

---

## Environment Configuration

### Required Environment Variables

```bash
# apps/api/.env
SECRET_KEY=your-secret-key-here  # Generate secure key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# CORS configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate limiting
REDIS_URL=redis://localhost:6379  # For distributed rate limiting
```

---

## Testing Authentication

### Unit Tests

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_protected_endpoint_without_token():
    response = client.post("/validation/evaluate", json={
        "prompt_id": "test",
        "user_answer": "test",
        "confidence_level": 3,
        "objective_text": "test"
    })
    assert response.status_code == 401

def test_protected_endpoint_with_invalid_token():
    response = client.post(
        "/validation/evaluate",
        json={...},
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401
```

### Integration Tests

```python
# tests/test_auth_integration.py
def test_authenticated_user_can_access_own_data():
    # Login and get token
    token = login_user("test@example.com", "password")

    # Access endpoint with token
    response = client.post(
        "/analytics/dashboard",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    # Verify user_id in response matches authenticated user
```

---

## Security Incident Response

### Recommended Incident Response Plan

1. **Detection:** Monitor authentication failures, unusual access patterns
2. **Immediate Response:** Block suspicious IPs, invalidate compromised tokens
3. **Assessment:** Determine scope of potential breach
4. **Communication:** Notify affected users, administrators
5. **Remediation:** Patch vulnerabilities, rotate secrets, update auth
6. **Post-Incident:** Review and improve security measures

---

## Compliance Considerations

### HIPAA Compliance (Medical Education)

If handling PHI (Protected Health Information):
- [ ] Enable database encryption at rest
- [ ] Implement audit trails for all data access
- [ ] Add data anonymization for analytics
- [ ] Implement data retention and deletion policies
- [ ] Add user access logging
- [ ] Regular security assessments

### FERPA Compliance (Student Records)

- [ ] Encrypt student data in transit and at rest
- [ ] Implement access controls for student records
- [ ] Add audit logging for grade/performance data access
- [ ] Provide data export for student records
- [ ] Implement right to deletion

---

## Summary

**Current State:**
- ❌ No authentication
- ❌ No authorization
- ❌ CORS allows all methods/headers
- ❌ No rate limiting
- ❌ User data is not isolated

**Immediate Actions Required:**
1. Implement JWT-based authentication
2. Remove `user_id` from request bodies
3. Add rate limiting
4. Harden CORS configuration
5. Add comprehensive audit logging

**Recommended Timeline:**
- **Week 1-2:** Basic JWT authentication
- **Week 3-4:** Full API protection
- **Week 5-6:** RBAC and authorization
- **Week 7-8:** Security hardening and testing

This document should be updated as authentication is implemented and security measures are put in place.
