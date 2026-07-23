# Testing Guide

## Overview

This project includes four types of testing:
1. **Unit & Integration Tests** – Jest + supertest (backend)
2. **API Testing** – Postman collection with test scripts
3. **User Testing** – Manual testing with 5–8 participants
4. **Heuristic Evaluation** – Nielsen Norman Group 10 usability heuristics

---

## 1. Jest Unit & Integration Tests (Backend)

### Setup

Jest test dependencies are already installed:
- `jest` – test runner
- `@jest/globals` – ESM-compatible test globals
- `supertest` – HTTP assertion library
- `mongodb-memory-server` – in-memory MongoDB for isolated tests

### Running Tests

```bash
# From the server directory
cd server
npm test

# Run a specific test file
npm test -- src/__tests__/models/User.test.js

# Run all tests (98 tests across 8 suites)
npm test
```

### Test Structure

```
server/src/__tests__/
├── helpers.js              # Test utilities (DB connect/disconnect, factories)
├── models/
│   ├── User.test.js        # User model validation (10 tests)
│   ├── Property.test.js    # Property model validation (13 tests)
│   └── Booking.test.js     # Booking model validation (9 tests)
├── routes/
│   ├── auth.test.js        # Auth endpoints (14 tests)
│   ├── property.test.js    # Property CRUD + search (20 tests)
│   ├── booking.test.js     # Booking CRUD (14 tests)
│   ├── admin.test.js       # Admin endpoints (10 tests)
│   └── middleware.test.js  # Health, 404, auth, validation (8 tests)
```

### Test Coverage

| Area | Tests | What's Covered |
|------|-------|----------------|
| User Model | 10 | Creation, password hashing, validation, roles, safe serialization |
| Property Model | 13 | CRUD validation, enums, images, lat/lng bounds |
| Booking Model | 9 | CRUD validation, status enums, message length, timestamps |
| Auth Routes | 14 | Register, login, duplicate email, forgot password, admin check |
| Property Routes | 20 | Search, filter, pagination, CRUD, role-based access |
| Booking Routes | 14 | Create, list, approve/reject, role-based access |
| Admin Routes | 10 | Summary, users, properties, bookings, moderation status |
| Middleware/Errors | 8 | Health check, 404, 401, 403, validation errors |
| **Total** | **98** | |

### Adding New Tests

1. Create a `.test.js` file in the appropriate `__tests__/` subdirectory
2. Import helpers from `../helpers.js`
3. Use `connectTestDb()` in `beforeAll`, `disconnectTestDb()` in `afterAll`
4. Use `clearCollections()` in `beforeEach` to isolate tests
5. Use factory functions: `createTestUser()`, `createTestProperty()`, `createTestBooking()`

---

## 2. API Testing with Postman

### Collection Location

`postman/PropertyRental.postman_collection.json`

### Setup

1. Import the collection into Postman (`File → Import`)
2. Create an environment with these variables:
   - `baseUrl`: `http://localhost:5000`
3. Start the backend server:
   ```bash
   npm run dev:server
   ```
4. Run the collection in order (tests auto-populate variables)

### Collection Structure

| Folder | Requests | Description |
|--------|----------|-------------|
| Health | 1 | Health check endpoint |
| Auth | 8 | Register (3 roles), Login (2), Me, Admin check, Forgot password |
| Properties | 6 | Create, mine, search, get by ID, update, delete |
| Bookings | 4 | Create, mine, incoming, approve |
| Messages | 6 | Create conversation, list, send, get messages, mark read, unread counts |
| Admin | 5 | Summary, users, properties, bookings, moderation status |
| User Profile | 2 | Update profile, change password |
| Negative Tests | 5 | 401, 403, 404, 400, 409 error scenarios |

### Running via CLI (Newman)

```bash
# Install Newman
npm install -g newman

# Run the collection
newman run postman/PropertyRental.postman_collection.json \
  --env-var "baseUrl=http://localhost:5000"
```

### Test Scripts

Every request includes Postman test scripts that validate:
- HTTP status codes
- Response body structure
- Response data types
- Collection variable population (tokens, IDs)

---

## 3. User Testing Plan

### Objective
Validate the Property Rental Portal with 5–8 real users representing the three roles: **landlord**, **tenant**, and **admin**.

### Participant Requirements

| Role | Participants | Criteria |
|------|-------------|----------|
| Landlord | 2–3 | Has rented out property before or understands landlord workflows |
| Tenant | 2–3 | Has rented a property before or understands tenant workflows |
| Admin | 1–2 | Familiar with admin/moderator interfaces |
| **Total** | **5–8** | |

### Test Environment

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Pre-seeded demo data (run `npm run seed:demo` from server)
- Use normal browser for one role, incognito for another
- Screen recording (optional, with consent)

### Task Scenarios

#### Landlord Tasks
1. Register as a new landlord account
2. Create a property listing with all required fields
3. Upload at least one property image (JPG/PNG/WEBP)
4. View your listings on the landlord dashboard
5. Edit the rent amount and description of a listing
6. View incoming booking requests
7. Approve one booking request and reject another
8. Open a chat conversation and send a message

#### Tenant Tasks
1. Register as a new tenant account
2. Search for properties by city (e.g., "Manchester")
3. Filter results by price range (£500–£1500)
4. Open a property detail page
5. Submit a viewing/booking request
6. View your booking requests in the tenant dashboard
7. Open chat from a booking card and read messages

#### Admin Tasks
1. Register as an admin account (or use pre-seeded admin)
2. Open the admin dashboard
3. Verify user, listing, and booking counts are displayed
4. View the list of recent users
5. Change a listing's moderation status from pending to active
6. Confirm the listing is now visible in public search

### Data Collection

For each task, record:
- **Task completion** (Yes/No/Partial)
- **Time on task** (seconds)
- **Errors encountered** (describe)
- **User satisfaction** (1–5 scale)
- **User comments** (verbatim quotes)

### Post-Test Questionnaire (SUS)

Ask participants to complete the System Usability Scale:

1. I think that I would like to use this system frequently
2. I found the system unnecessarily complex
3. I thought the system was easy to use
4. I think that I would need the support of a technical person to be able to use this system
5. I found the various functions in this system were well integrated
6. I thought there was too much inconsistency in this system
7. I would imagine that most people would learn to use this system very quickly
8. I found the system very cumbersome to use
9. I felt very confident using the system
10. I needed to learn a lot of things before I could get going with this system

**Scoring:** Each item rated 1–5. Odd items: score - 1. Even items: 5 - score. Sum × 2.5 = SUS score (0–100).

---

## 4. Heuristic Evaluation (Nielsen Norman Group)

### Evaluation Method

Review the application against Nielsen's 10 usability heuristics. Rate each issue:
- **0** = Not a problem
- **1** = Cosmetic
- **2** = Minor
- **3** = Major
- **4** = Catastrophic

### 10 Usability Heuristics Checklist

#### 1. Visibility of System Status
- [ ] Loading indicators shown during searches and data fetches
- [ ] Booking status clearly visible (pending/approved/rejected)
- [ ] Property moderation status visible to landlord
- [ ] Confirmation messages after form submissions
- [ ] Toast/notification when actions complete

#### 2. Match Between System and Real World
- [ ] Uses familiar real estate terminology (landlord, tenant, booking, viewing)
- [ ] Price displayed as monthly rent (£/month)
- [ ] Date/time formats are user-friendly
- [ ] Property types match common UK categories (flat, house, studio, etc.)

#### 3. User Control and Freedom
- [ ] Users can edit/cancel their bookings
- [ ] Landlords can edit/delete their listings
- [ ] Easy navigation back to search results
- [ ] Logout readily available
- [ ] Account deletion available

#### 4. Consistency and Standards
- [ ] Consistent navigation structure across pages
- [ ] Similar form layouts for login/register
- [ ] Uniform button styles for primary/secondary actions
- [ ] Consistent error message formatting
- [ ] Follows web platform conventions (blue for links, underlined on hover)

#### 5. Error Prevention
- [ ] Form validation before submission (required fields, email format, password length)
- [ ] Confirm before deleting a property listing
- [ ] Prevent duplicate email registration
- [ ] Warn before navigating away from unsaved form
- [ ] File upload type/size restrictions communicated upfront

#### 6. Recognition Rather Than Recall
- [ ] Navigation labels are descriptive and clear
- [ ] Icons used consistently with text labels
- [ ] Property cards show key info at a glance (price, location, bedrooms)
- [ ] User's role displayed in the UI
- [ ] Search/filter state visible (what filters are applied)

#### 7. Flexibility and Efficiency of Use
- [ ] Search works for advanced users (direct URL query parameters)
- [ ] Keyboard shortcuts for common actions (if applicable)
- [ ] Quick access to recent/bookmarked properties
- [ ] Bulk actions (if applicable)
- [ ] Sort options for listings

#### 8. Aesthetic and Minimalist Design
- [ ] No irrelevant or rarely-used information displayed
- [ ] Clean layout with adequate whitespace
- [ ] Visual hierarchy (most important info most prominent)
- [ ] Mobile-responsive design
- [ ] Color scheme is professional and non-distracting

#### 9. Help Users Recognize, Diagnose, and Recover from Errors
- [ ] Error messages are specific and actionable ("Email must be valid" not "Error")
- [ ] Form fields with errors are highlighted
- [ ] 404 page provides navigation options
- [ ] Network errors show retry option
- [ ] Validation errors appear inline near the relevant field

#### 10. Help and Documentation
- [ ] Tooltips or help text on complex forms
- [ ] FAQ or help page available
- [ ] Contact/support information visible
- [ ] Onboarding guidance for new users
- [ ] Password requirements shown during registration

### Severity Rating Scale

| Rating | Meaning | Action Required |
|--------|---------|----------------|
| 0 | Not a problem | No action |
| 1 | Cosmetic | Fix if time allows |
| 2 | Minor | Low priority fix |
| 3 | Major | Important to fix |
| 4 | Catastrophic | Must fix before release |

### Reporting Template

For each issue found, document:
```
**Heuristic:** [1–10]
**Location:** [Page/element]
**Issue:** [Description]
**Severity:** [0–4]
**Recommendation:** [Suggested fix]
**Screenshot:** [Reference]
```

---

## Local Smoke Test

Before running any tests, verify the system is operational:

```bash
# Start both services
npm run dev:server
npm run dev:client
```

Check:
- `http://localhost:5000/health` returns `{ data: { status: "ok" } }`
- `http://localhost:3000` loads without errors
- Register/login works for tenant, landlord, and admin

## Known Manual Test Notes

- Use a normal browser window for one role and an incognito/private window for another role.
- Socket.io chat updates appear when both users have opened the same conversation.
- Google Maps is represented by a placeholder unless a Maps API key is configured.