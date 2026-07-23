# Property Rental Portal

Full-stack property portal for direct landlord listings, tenant search, booking requests, messaging, and admin review.

## Project Structure

```text
PropertyRental/
  client/   Next.js frontend
  server/   Express API backend
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Local Setup

Install dependencies from the repository root:

```bash
npm install
```

Start the frontend:

```bash
npm run dev:client
```

Start the backend:

```bash
npm run dev:server
```

Default local URLs:

- Client: `http://localhost:3000`
- Server health check: `http://localhost:5000/health`

Build the frontend:

```bash
npm run build:client
```

Optional demo data seed:

```powershell
$env:DEMO_SEED_CONFIRM="true"
npm run seed:demo
```

## Backend Environment

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Auth endpoints added in Chunk 2:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/admin-check`

Example register body:

```json
{
  "name": "Demo Landlord",
  "email": "landlord@example.com",
  "password": "Password123",
  "role": "landlord"
}
```

Allowed roles are `landlord`, `tenant`, and `admin`.

Property endpoints added in Chunk 4:

- `GET /api/properties`
- `GET /api/properties/:id`
- `GET /api/properties/mine`
- `POST /api/properties`
- `PATCH /api/properties/:id`
- `DELETE /api/properties/:id`

Create and update listing requests use `multipart/form-data` with optional
`images` files. Supported image formats are JPG, PNG, and WEBP up to 5MB each.

Booking endpoints added in Chunk 7:

- `POST /api/bookings`
- `GET /api/bookings/mine`
- `GET /api/bookings/incoming`
- `PATCH /api/bookings/:id/status`

Messaging endpoints added in Chunk 8:

- `GET /api/messages/conversations`
- `POST /api/messages/conversations`
- `GET /api/messages/conversations/:id/messages`
- `POST /api/messages/conversations/:id/messages`

Admin endpoints added in Chunk 9:

- `GET /api/admin/summary`
- `GET /api/admin/users`
- `GET /api/admin/properties`
- `PATCH /api/admin/properties/:id/status`
- `GET /api/admin/bookings`

## MongoDB Atlas Setup

1. Create or sign in to a MongoDB Atlas account.
2. Create a free shared cluster.
3. Create a database user with a username and password.
4. Add your current IP address to Network Access.
5. Copy the Node.js connection string.
6. Replace `<password>` in the connection string with your database user password.
7. Put the final connection string into `server/.env` as `MONGODB_URI`.
8. Add a long random value for `JWT_SECRET`.

## Chunk Status

- Chunk 1: Project foundation - done
- Chunk 2: Backend auth foundation - done
- Chunk 3: Frontend auth flow - done
- Chunk 4: Property listings backend - done
- Chunk 5: Landlord listing UI - done
- Chunk 6: Tenant search and property details - done
- Chunk 7: Booking requests - done
- Chunk 8: Messaging - done
- Chunk 9: Admin dashboard - done
- Chunk 10: Testing, polish, and deployment prep - done

## Project Handoff Assets

- Testing guide: `docs/testing.md`
- Deployment guide: `docs/deployment.md`
- Postman collection: `postman/PropertyRental.postman_collection.json`
- Demo seed script: `server/src/scripts/seedDemoData.js`
