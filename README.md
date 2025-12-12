# Next Ecommerce — Server

A TypeScript Express backend for the Next Ecommerce project. Exposes REST APIs for auth, products, cart, orders, reviews, and settings. Uses Prisma for database access.

## Key Features
- Authentication with JWT and HTTP-only cookies
- Role-based routes (user / admin / super-admin)
- Product, cart, coupon, address, order, and review APIs
- CORS configured for credentialed requests
- Prisma ORM + migrations and seeding
- Graceful shutdown and environment-aware settings

## Tech Stack
- Node.js + TypeScript
- Express
- Prisma (Postgres / MySQL / SQLite supported)
- dotenv for config
- cookie-parser, cors, bcrypt/jsonwebtoken (auth)

## Prerequisites
- Node.js 18+
- npm or yarn
- A running database (set DATABASE_URL)

## Example .env
Create a `.env` in `server/` (do not commit secrets):
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/next_ecom?schema=public
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
```

## Install
From the server directory:
```bash
npm install
# or
yarn
```

## Scripts
Typical package.json scripts to run:
- Development (ts-node-dev / nodemon):
  ```bash
  npm run dev
  ```
- Build + Start:
  ```bash
  npm run build
  npm run start
  ```
- Prisma:
  ```bash
  npx prisma generate
  npx prisma migrate dev --name init
  npx prisma db seed
  ```

Adjust commands to match your package.json.

## CORS & Cookies
- Backend sends HTTP-only cookies for auth. Ensure frontend requests include credentials:
  - axios: withCredentials: true
  - fetch: credentials: "include"
- In production, set `CLIENT_URL` to your client origin. Server will restrict CORS origin to that value when `NODE_ENV=production`.

## Database & Prisma
- Define schema in `prisma/schema.prisma`.
- Use `prisma migrate` to apply schema changes.
- Use `prisma generate` after updating Prisma client.
- Add a seed script (optional) and run via `npx prisma db seed`.

## Running Locally
1. Ensure `.env` is configured and database is reachable.
2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
3. Run migrations (if needed):
   ```bash
   npx prisma migrate dev
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Server runs on `http://localhost:${PORT}` (default 3001).

## Deployment Notes
- Set NODE_ENV=production, configure CLIENT_URL and DATABASE_URL in your hosting environment.
- Use secure cookie settings (SameSite=None and secure=true) when serving over HTTPS.
- Run build and start scripts; ensure migrations and seeds are applied.

## Troubleshooting
- CORS errors: verify CLIENT_URL and that requests include credentials.
- Authentication failures: check JWT_SECRET consistency and cookie attributes.
- Prisma errors: run `npx prisma studio` / `npx prisma migrate status` to inspect.

## Contributing
- Follow existing patterns; run lint/tests before PR.
- Document API changes and add Prisma migrations for schema updates.


