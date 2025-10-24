# Authentication System - MVP Documentation

**Status:** MVP Implementation (Single-User Mode)
**Last Updated:** 2025-10-15
**Story:** 2.3 - Intelligent Content Prioritization Algorithm

## Overview

The current authentication system is a **minimal viable product (MVP)** designed for single-user development and testing. It provides a foundation that can be easily upgraded to full multi-user authentication.

## Current Implementation

### Location
`/Users/Kyin/Projects/Americano/apps/web/src/lib/auth.ts`

### Functions

#### `getCurrentUserId(): Promise<string>`
Returns the ID of the first user found in the database.

```typescript
const userId = await getCurrentUserId()
// Returns: 'cmgrl1wtd0000v1cloq21m9cg'
```

**Usage in API Routes:**
```typescript
import { getCurrentUserId } from '@/lib/auth'

async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()

  const exams = await prisma.exam.findMany({
    where: { userId }
  })

  return Response.json(successResponse(exams))
}
```

#### `getCurrentUser(): Promise<User>`
Returns the complete user object for the first user in the database.

```typescript
const user = await getCurrentUser()
// Returns: { id, email, createdAt, updatedAt, ... }
```

### API Routes Using Dynamic Auth

All Story 2.3 API endpoints now use dynamic authentication:

1. **Exam Management:**
   - `GET /api/exams` - List user's exams
   - `POST /api/exams` - Create exam
   - `PATCH /api/exams/[id]` - Update exam
   - `DELETE /api/exams/[id]` - Delete exam

2. **Course Priorities:**
   - `POST /api/courses/[id]/priority` - Set course priority

3. **Priority System:**
   - `GET /api/priorities` - Get prioritized content
   - `GET /api/priorities/objectives` - List prioritized objectives
   - `GET /api/priorities/objectives/[id]/explain` - Explain priority score
   - `GET /api/priorities/recommendations` - Get study recommendations
   - `POST /api/priorities/feedback` - Submit priority feedback

## Limitations (MVP)

⚠️ **Current Limitations:**

1. **Single User Only:** Always returns the first user in the database
2. **No Session Management:** No cookies, tokens, or session tracking
3. **No Access Control:** All users can access all data (not an issue with single user)
4. **No User Registration:** Users must be added directly to database
5. **No Password Authentication:** No login flow
6. **No OAuth Integration:** No social login providers

## Production Migration Path

### Phase 1: Session-Based Authentication (Recommended First Step)

**Technologies:**
- `next-auth` (now Auth.js) for Next.js 15
- Cookie-based sessions
- Email/password authentication

**Implementation:**
```typescript
// src/lib/auth.ts (production version)
import { auth } from '@/auth' // next-auth config

export async function getCurrentUserId(): Promise<string> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session')
  }

  return session.user.id
}
```

**Estimated Effort:** 2-3 days
- Auth.js configuration
- Login/logout pages
- Session middleware
- Protected route guards

### Phase 2: OAuth Providers (Multi-User Support)

**Providers:**
- Google OAuth
- Microsoft Azure AD
- Apple Sign In

**Benefits:**
- No password management
- Trusted identity providers
- Better user experience

**Estimated Effort:** 1-2 days (after Phase 1)

### Phase 3: Supabase Auth Integration (Optional)

**If migrating to Supabase:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user.id
}
```

**Benefits:**
- Row-level security (RLS)
- Built-in user management
- Email verification
- Password reset flows

**Estimated Effort:** 3-4 days
- Supabase setup
- Migration of auth logic
- RLS policies configuration

## Testing with MVP

### Adding Test Users

**Via Database:**
```sql
INSERT INTO users (id, email, "createdAt", "updatedAt")
VALUES (
  'test-user-id',
  'test@americano.dev',
  NOW(),
  NOW()
);
```

**Via Prisma Studio:**
```bash
npx prisma studio
```

### Current Test User
```
ID: cmgrl1wtd0000v1cloq21m9cg
Email: kevy@americano.dev
```

## Error Handling

### No Users Found
If no users exist in the database, the auth functions throw:
```
Error: No users found in database. Please run database seed.
```

**Solution:** Run the database seed script or manually add a user.

## Best Practices (MVP)

1. **Always use `await getCurrentUserId()`** - Never hardcode user IDs
2. **Add user validation** in all protected API routes
3. **Document auth requirements** in API JSDoc comments
4. **Plan for migration** - Keep auth logic centralized in `/lib/auth.ts`

## Migration Checklist

When upgrading to production auth:

- [ ] Choose authentication provider (Auth.js, Supabase, custom)
- [ ] Install and configure auth library
- [ ] Update `getCurrentUserId()` implementation
- [ ] Add middleware to protect API routes
- [ ] Create login/logout pages
- [ ] Add session management
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Add user registration (if needed)
- [ ] Configure OAuth providers (if needed)
- [ ] Update documentation

## Related Files

- **Auth Utility:** `src/lib/auth.ts`
- **Prisma Schema:** `prisma/schema.prisma` (User model)
- **Environment:** `.env` (DATABASE_URL)

## Security Notes

⚠️ **For MVP Only:** This implementation is **NOT suitable for production** with multiple users.

**Production Requirements:**
- Proper session management
- CSRF protection
- Rate limiting
- Password hashing (if using email/password)
- Secure cookie configuration
- HTTPS enforcement
