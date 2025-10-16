# Story 1.1: User Registration and Authentication System

Status: Draft

## Story

As a medical student,
I want secure account creation and login,
so that my personal study data and progress are protected and accessible only to me.

## Acceptance Criteria

1. User can create account with email and secure password meeting complexity requirements
2. Email verification required before account activation
3. User can log in with email/password combination
4. Session management maintains authentication across browser sessions
5. Password reset functionality available via email
6. Account settings page allows profile updates and password changes
7. Basic user profile stores medical school, graduation year, and study preferences
8. FERPA-compliant data privacy notice and consent during registration

## Tasks / Subtasks

- [ ] Task 1: Set up authentication infrastructure (AC: #1, #2, #3, #4, #5)
  - [ ] 1.1: Evaluate and select authentication solution (NextAuth.js v5, Supabase Auth, or Auth.js)
  - [ ] 1.2: Install and configure chosen authentication library
  - [ ] 1.3: Configure email provider for verification and password reset (e.g., Resend, SendGrid, or local SMTP for development)
  - [ ] 1.4: Implement session management with JWT tokens
  - [ ] 1.5: Set up environment variables for authentication secrets and email configuration

- [ ] Task 2: Implement user registration flow (AC: #1, #2, #8)
  - [ ] 2.1: Create registration page UI (`/app/(auth)/register/page.tsx`)
  - [ ] 2.2: Build registration form with email and password inputs
  - [ ] 2.3: Implement client-side password validation (minimum 12 characters, uppercase, lowercase, number, special character)
  - [ ] 2.4: Create API endpoint `/api/auth/register` with server-side validation
  - [ ] 2.5: Implement password hashing using bcrypt (12+ salt rounds)
  - [ ] 2.6: Send email verification link after successful registration
  - [ ] 2.7: Create email verification page (`/app/(auth)/verify-email/page.tsx`)
  - [ ] 2.8: Display FERPA-compliant privacy notice and consent checkbox during registration

- [ ] Task 3: Implement login flow (AC: #3, #4)
  - [ ] 3.1: Create login page UI (`/app/(auth)/login/page.tsx`)
  - [ ] 3.2: Build login form with email and password inputs
  - [ ] 3.3: Create API endpoint `/api/auth/login` with credential validation
  - [ ] 3.4: Implement session creation with secure HTTP-only cookies
  - [ ] 3.5: Add rate limiting to login endpoint (5 attempts per 15 minutes)
  - [ ] 3.6: Redirect to dashboard after successful authentication
  - [ ] 3.7: Handle invalid credentials with appropriate error messages

- [ ] Task 4: Implement password reset flow (AC: #5)
  - [ ] 4.1: Create "Forgot Password" link on login page
  - [ ] 4.2: Build password reset request page (`/app/(auth)/forgot-password/page.tsx`)
  - [ ] 4.3: Create API endpoint `/api/auth/forgot-password` to send reset link
  - [ ] 4.4: Create password reset page with token validation (`/app/(auth)/reset-password/page.tsx`)
  - [ ] 4.5: Create API endpoint `/api/auth/reset-password` to update password
  - [ ] 4.6: Expire reset tokens after 1 hour
  - [ ] 4.7: Send confirmation email after successful password reset

- [ ] Task 5: Create user profile management (AC: #6, #7)
  - [ ] 5.1: Extend Prisma User model with profile fields (medical school, graduation year, study preferences)
  - [ ] 5.2: Create migration for User model extensions
  - [ ] 5.3: Build account settings page UI (`/app/settings/page.tsx`)
  - [ ] 5.4: Create profile update form (name, email, medical school, graduation year)
  - [ ] 5.5: Create password change form with current password verification
  - [ ] 5.6: Create API endpoint `/api/user/profile` for profile updates
  - [ ] 5.7: Implement study preferences storage (optional fields for initial MVP)
  - [ ] 5.8: Add email change confirmation workflow (verify new email before updating)

- [ ] Task 6: Implement session management and middleware (AC: #4)
  - [ ] 6.1: Create authentication middleware for Next.js (`middleware.ts`)
  - [ ] 6.2: Protect authenticated routes (dashboard, study, library, etc.)
  - [ ] 6.3: Implement automatic token refresh logic
  - [ ] 6.4: Create logout functionality with session cleanup
  - [ ] 6.5: Handle expired sessions with redirect to login

- [ ] Task 7: Testing and security hardening (All ACs)
  - [ ] 7.1: Test complete registration → verification → login flow
  - [ ] 7.2: Test password reset flow end-to-end
  - [ ] 7.3: Test session persistence across browser sessions
  - [ ] 7.4: Test profile update and password change
  - [ ] 7.5: Verify rate limiting on authentication endpoints
  - [ ] 7.6: Verify password complexity requirements enforcement
  - [ ] 7.7: Test email verification expiration (24 hours)
  - [ ] 7.8: Security audit: SQL injection, XSS, CSRF protection

## Dev Notes

**Architecture Context:**
- Modular Monolith pattern - authentication is infrastructure, not a subsystem
- User model already defined in Prisma schema (`prisma/schema.prisma`)
- No external authentication service for MVP (intentionally simple)

**Important Implementation Notes:**

1. **MVP Authentication Deferral:**
   - Per solution-architecture.md (lines 406-408), authentication is **deferred for MVP**
   - Single user local development means full auth system may be overkill
   - Consider: Start with simplified "mock" authentication or skip entirely for first sprint
   - Full authentication system should be implemented when deploying to production or multi-user

2. **Technology Selection:**
   - NextAuth.js v5 (Auth.js) recommended for Next.js 15 App Router
   - Alternative: Implement minimal custom auth with JWT + bcrypt for learning
   - Supabase Auth option available but requires cloud dependency

3. **Database Schema:**
   - User model exists at `prisma/schema.prisma:719-734`
   - Fields: id (cuid), email, name, createdAt, updatedAt
   - Need to extend with: passwordHash, emailVerified, medicalSchool, graduationYear
   - Migration command: `npx prisma migrate dev --name add-auth-fields`

4. **Security Requirements:**
   - Password hashing: bcrypt with 12+ salt rounds (industry standard)
   - JWT tokens: HTTP-only cookies to prevent XSS
   - Rate limiting: Prevent brute force attacks (use `@upstash/ratelimit` or custom middleware)
   - CSRF protection: Next.js CSRF tokens or SameSite cookies

5. **Email Provider Setup:**
   - Development: Use Ethereal (fake SMTP) or log to console
   - Production: Resend.com (recommended), SendGrid, or AWS SES
   - Email templates: Verification, password reset, email change confirmation

### Project Structure Notes

**Files to Create/Modify:**

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication route group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx         # Account settings
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── forgot-password/route.ts
│   │       │   └── reset-password/route.ts
│   │       └── user/
│   │           └── profile/route.ts
│   ├── lib/
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── password.ts          # Password hashing/validation
│   │   └── email.ts             # Email sending utilities
│   ├── middleware.ts            # Authentication middleware
│   └── components/
│       └── auth/
│           ├── login-form.tsx
│           ├── register-form.tsx
│           └── password-reset-form.tsx
├── prisma/
│   └── migrations/              # New migration for auth fields
└── .env.local
    # Add: AUTH_SECRET, EMAIL_SERVER, EMAIL_FROM
```

**Alignment with Solution Architecture:**
- Follows source tree structure from solution-architecture.md (lines 1772-1952)
- Uses Next.js App Router with route groups for authentication pages
- API endpoints follow RESTful conventions established in architecture

**Known Deviations:**
- Solution architecture defers authentication for MVP (line 407)
- This story implements full auth system - consider phased approach
- Option 1: Implement full system now for future-proofing
- Option 2: Implement minimal auth (hardcoded user) and defer full system

### References

- [Source: docs/epics-Americano-2025-10-14.md - Epic 1, Story 1.1 (lines 63-85)]
- [Source: docs/solution-architecture.md - User Model (lines 719-734)]
- [Source: docs/solution-architecture.md - Technology Stack (lines 1704-1742)]
- [Source: docs/solution-architecture.md - Authentication Preferences (lines 406-408)]
- [Source: docs/solution-architecture.md - Source Tree Structure (lines 1769-1952)]
- [Source: docs/PRD-Americano-2025-10-14.md - FR11: User Authentication & Profile Management]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
