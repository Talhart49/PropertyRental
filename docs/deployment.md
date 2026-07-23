# Deployment Guide

## MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user.
3. Add the deployment provider IPs to Network Access, or temporarily use `0.0.0.0/0` for student demo deployment.
4. Copy the Node.js connection string.
5. Use a database name such as `property-rental`.

## Backend on Railway

Create a Railway service from the repository and set the root/service directory to `server` if Railway asks.

Environment variables:

```env
PORT=5000
CLIENT_URL=https://your-vercel-app.vercel.app
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Build/start:

```bash
npm install
npm start
```

After deployment, verify:

```text
https://your-railway-api.up.railway.app/health
```

## Frontend on Vercel

Create a Vercel project for the `client` workspace.

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-api.up.railway.app
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Build command:

```bash
npm run build
```

Output is managed by Next.js.

## Demo Seed Data

Run this only against a database where demo data is safe:

```bash
$env:DEMO_SEED_CONFIRM="true"
npm run seed:demo
```

Demo credentials created:

- `demo.landlord@propertyrental.local` / `Password123`
- `demo.tenant@propertyrental.local` / `Password123`
- `demo.admin@propertyrental.local` / `Password123`

## Final Demo Checklist

- Frontend URL opens.
- Backend `/health` works.
- Tenant can search listings.
- Landlord can manage listings.
- Tenant can request a booking.
- Landlord can approve/reject.
- Chat works between tenant and landlord.
- Admin can view dashboard and moderate listings.
