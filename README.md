# Poker de Garagem

A containerized web application for managing poker game history with group-based access control.

## Features

- **Authentication**: Email/password sign up and sign in with JWT-based sessions
- **Groups**: Create and manage poker groups with role-based access (Owner/Admin/Member)
- **Invitations**: Invite users via email or shareable link tokens
- **Games**: Track cash games and tournaments with per-player buy-ins and cashouts
- **Guest Players**: Support for non-registered players in games
- **Dashboards**: View statistics per group and aggregated across all groups
- **Date Filtering**: Filter stats by date range

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL 8
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Custom JWT with bcrypt
- **Containerization**: Docker + Kubernetes

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Kubernetes cluster (for k8s deployment)

## Local Development

### Option 1: Using Docker Compose (Recommended)

1. **Clone and start services**:
   ```bash
   # Copy environment file
   cp .env.example .env

   # Start all services
   docker-compose up -d

   # Run migrations (first time only)
   docker-compose run --rm migrate
   ```

2. **Access the application**:
   - App: http://localhost:3000
   - MySQL: localhost:3306

3. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

### Option 2: Local Node.js Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL connection string
   ```

3. **Start MySQL** (via Docker or local installation):
   ```bash
   docker run -d \
     --name poker-mysql \
     -e MYSQL_ROOT_PASSWORD=rootpassword \
     -e MYSQL_DATABASE=poker_db \
     -e MYSQL_USER=poker \
     -e MYSQL_PASSWORD=poker123 \
     -p 3306:3306 \
     mysql:8.0
   ```

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Seed the database** (optional):
   ```bash
   npm run db:seed
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**: http://localhost:3000

## Seed Data

After seeding, you can log in with:
- **Email**: `alice@example.com` | **Password**: `password123`
- **Email**: `bob@example.com` | **Password**: `password123`

The seed creates:
- 4 users (Alice, Bob, Charlie, Diana)
- 2 groups (Friday Night Poker, Weekend Warriors)
- 5 sample games with various participants

## Kubernetes Deployment

### Build and Push Docker Image

```bash
# Build the production image
docker build -t poker-de-garagem:latest .

# Build the dev/migration image
docker build -f Dockerfile.dev -t poker-de-garagem-dev:latest .

# Tag and push to your registry
docker tag poker-de-garagem:latest your-registry/poker-de-garagem:latest
docker push your-registry/poker-de-garagem:latest
```

### Deploy to Kubernetes

1. **Update image references** in `k8s/app.yaml` and `k8s/migration-job.yaml` with your registry.

2. **Update secrets** in `k8s/secrets.yaml` with secure values for production.

3. **Apply manifests**:
   ```bash
   # Using kustomize
   kubectl apply -k k8s/

   # Or manually in order
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/mysql.yaml

   # Wait for MySQL to be ready
   kubectl -n poker-app wait --for=condition=ready pod -l app=mysql --timeout=120s

   # Run migrations
   kubectl apply -f k8s/migration-job.yaml

   # Deploy the app
   kubectl apply -f k8s/app.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

4. **Verify deployment**:
   ```bash
   kubectl -n poker-app get pods
   kubectl -n poker-app get svc
   ```

5. **Access the app**:
   - Add `poker.local` to your `/etc/hosts` pointing to your ingress IP
   - Or use port-forwarding: `kubectl -n poker-app port-forward svc/poker-app 3000:80`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/[groupId]` - Get group details
- `PUT /api/groups/[groupId]` - Update group
- `DELETE /api/groups/[groupId]` - Delete group

### Members
- `GET /api/groups/[groupId]/members` - List members
- `PUT /api/groups/[groupId]/members/[memberId]` - Change role
- `DELETE /api/groups/[groupId]/members/[memberId]` - Remove member

### Invites
- `GET /api/groups/[groupId]/invites` - List pending invites
- `POST /api/groups/[groupId]/invites` - Create invite
- `DELETE /api/groups/[groupId]/invites/[inviteId]` - Cancel invite
- `GET /api/invites/[token]` - View invite details
- `POST /api/invites/[token]` - Accept/decline invite

### Games
- `GET /api/groups/[groupId]/games` - List games
- `POST /api/groups/[groupId]/games` - Create game
- `GET /api/groups/[groupId]/games/[gameId]` - Get game details
- `PUT /api/groups/[groupId]/games/[gameId]` - Update game
- `DELETE /api/groups/[groupId]/games/[gameId]` - Delete game

### Dashboards
- `GET /api/dashboard` - Overall user dashboard
- `GET /api/groups/[groupId]/dashboard` - Group dashboard

### Health
- `GET /api/health` - Health check endpoint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Required |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `NEXT_PUBLIC_APP_URL` | Public app URL for invite links | http://localhost:3000 |

## Assumptions

The following assumptions were made during development:

1. **Email Invites**: Email sending is out of scope. Invites are implemented using shareable tokens/links. In production, integrate with an email service (SendGrid, AWS SES, etc.).

2. **Guest Players**: Games can include guest players who are not registered users. Guests are identified by name and tracked separately from registered users.

3. **Money Handling**: All monetary values use DECIMAL(10,2) in MySQL and are displayed with 2 decimal places. The application does not enforce currency or locale-specific formatting.

4. **Cash Game Balance**: In cash games, `totalSpent` should roughly equal `totalWon`. The application calculates and displays the difference but does not enforce this as a hard constraint.

5. **Tournament Payouts**: In tournaments, the total prize pool may not equal total buy-ins (e.g., if there are rebuys, add-ons, or external contributions). No strict validation is enforced.

6. **Time Zones**: Game dates are stored as UTC. The UI displays dates in the user's local timezone via browser APIs.

7. **Duplicate Participants**: The same registered user cannot appear twice in the same game. Guests with the same name in different games are treated as different people.

8. **Role Hierarchy**:
   - OWNER: Full control, can change roles, invite/remove anyone, delete group
   - ADMIN: Can invite members, remove regular members (not admins)
   - MEMBER: Can view data and participate in games

9. **Leaving Groups**: Members can leave groups voluntarily. Owners cannot leave (must transfer ownership or delete group).

10. **Session Duration**: JWT tokens expire after 7 days. Users must sign in again after expiration.

## Project Structure

```
pokerdegaragem/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Database migrations
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API route handlers
│   │   ├── auth/          # Auth pages
│   │   ├── dashboard/     # Dashboard page
│   │   ├── groups/        # Group pages
│   │   └── invites/       # Invite acceptance page
│   ├── components/        # React components
│   │   ├── auth/          # Auth-related components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React contexts
│   └── lib/               # Utilities and helpers
│       ├── api-response.ts
│       ├── auth.ts
│       ├── authorization.ts
│       ├── db.ts
│       ├── money.ts
│       ├── utils.ts
│       └── validations.ts
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
└── package.json
```

## License

MIT
