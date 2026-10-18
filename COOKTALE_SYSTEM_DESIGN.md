# CookTale System Design

Status: Approved direction for continued development
Product stage: Development and recovery
Account model for version one: Individual creators
Scale goal: Designed to grow toward 15,000 concurrent users, subject to load testing

---

## 1. Purpose

CookTale is a user-generated cooking platform where people can discover food content and creators can publish and earn from their work.

The system must begin simply, remain safe for a public launch, and allow later growth without rebuilding the whole product.

The architecture diagram and this document describe a target direction. They do not prove that the system can already support 15,000 concurrent users. Capacity must be measured with real load tests and production monitoring.

---

## 2. Product scope

### Version-one features

- User registration, login, email verification and password reset
- Individual creator profiles
- Create, edit, publish and remove recipes
- Recipe images and short step videos
- Public recipe pages
- Likes, ratings, reviews and comments
- Bookmarks and recipe collections
- Follow and unfollow creators
- Cooking stories or blogs
- Community discussions
- Search and filters
- In-app and email notifications
- Creator dashboard
- CookTale membership subscriptions
- Admin moderation and support tools

### Later features

- Mobile application
- Push notifications
- Cooking courses
- Large private course videos
- Live cooking classes and chat
- Creator advertising earnings
- Creator payouts
- Advanced recommendations
- Business or team accounts

### Not required now

- GraphQL
- Microservices for every feature
- Kubernetes
- Docker Swarm
- Database sharding
- PostgreSQL read replicas
- OpenSearch
- Multi-region application servers
- A self-built YouTube-style video platform

---

## 3. Confirmed architecture decisions

1. Version one supports individual creators only.
2. One user owns their recipes, stories, courses and earnings.
3. Next.js renders the website.
4. NestJS owns the API and all important business rules.
5. PostgreSQL is the permanent source of truth.
6. Prisma is used by NestJS to access PostgreSQL.
7. The frontend must not directly access Prisma or PostgreSQL.
8. REST is used initially, under `/api/v1`.
9. Redis is used for temporary data, caching and rate limits.
10. BullMQ is used for background work.
11. Important events are saved in PostgreSQL before background processing.
12. The outbox pattern is used for important database-to-queue work.
13. Cloudinary handles normal CookTale images and short videos.
14. S3-compatible storage is added later for large or private files.
15. Cloudflare sits in front of the public website and API.
16. The current frontend uses Redux Toolkit and AuthContext.
17. The target frontend uses Zustand and TanStack Query.
18. State migration is gradual and is not part of recovery unless approved.
19. Zod validates frontend forms.
20. `class-validator` validates NestJS request objects.
21. WebSockets, Meilisearch and advanced scaling are added only when needed.
22. The mobile technology will be selected when mobile development begins.

---

## 4. Account and ownership model

Version one uses this model:

```text
One user
  -> owns recipes
  -> owns stories
  -> owns courses later
  -> receives earnings later
```

Every owned record has a creator or user identifier. NestJS checks ownership on every protected action. The browser is never trusted to decide ownership.

Possible future team support:

```text
organizations
organization_members
organization_roles
```

These tables are not created now. Business rules should stay inside NestJS so ownership can be expanded later without rewriting every frontend screen.

---

## 5. High-level architecture

### Initial production architecture

```text
Web browser
    |
    v
Cloudflare
    |
    v
Nginx or Caddy reverse proxy
    |
    +--------------------+
    |                    |
    v                    v
Next.js website      NestJS REST API
                         |
          +--------------+----------------+
          |              |                |
          v              v                v
     PostgreSQL        Redis           BullMQ
                                          |
                                          v
                                  Background worker

External services:
- Cloudinary for images and short videos
- Resend for email
- Lemon Squeezy for payments
- Sentry for errors
- External uptime monitoring
```

### Later scalable architecture

```text
Web and mobile clients
          |
          v
Cloudflare
          |
          v
Load balancer
          |
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
Multiple Next.js       Multiple NestJS       WebSocket servers
instances              API instances         when required
          |                     |                     |
          +---------------------+---------------------+
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
      Managed PostgreSQL   Managed Redis      Worker groups
             |                  |                  |
             v                  v                  v
       Read copies later   Cache and queues   General/media jobs

External storage and services:
- Cloudinary
- S3-compatible storage
- CDN
- Meilisearch later
- Resend
- Firebase Cloud Messaging later
- Lemon Squeezy
- Monitoring and error tracking
```

---

## 6. Main request flow

```text
1. A user opens CookTale.
2. Cloudflare checks and forwards the request.
3. The reverse proxy sends website traffic to Next.js.
4. Next.js renders the page.
5. Next.js or the browser calls `/api/v1` on NestJS.
6. NestJS validates identity, permission and input.
7. NestJS reads or writes PostgreSQL through Prisma.
8. NestJS may read or update Redis.
9. Slow work is placed in an outbox and then BullMQ.
10. NestJS returns a safe response.
```

For public pages, Next.js Server Components may call NestJS while rendering. For interactive actions after the page opens, TanStack Query calls NestJS from the client.

---

## 7. Frontend architecture

### Frontend technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zustand as the target shared client-state tool
- TanStack Query as the target interactive API-data tool
- React local state for small component state
- React Hook Form for larger forms
- Zod for form and client validation

### State ownership rules

```text
PostgreSQL
  -> permanent business data

NestJS
  -> business rules and authoritative API responses

Next.js Server Components
  -> initial public and SEO-friendly page data

TanStack Query
  -> changing API data in interactive client screens

Zustand
  -> shared temporary UI state

React local state
  -> state used by one component

URL search parameters
  -> shareable filters, search, sorting, tabs and page number
```

### Next.js Server Components should handle

- Initial public recipe data
- Initial creator-profile data
- Public story and blog data
- Public course landing pages later
- SEO metadata
- Data needed before the first page is displayed

Server Components call NestJS. They do not call Prisma.

### TanStack Query should handle

- Like and unlike actions
- Bookmark and remove-bookmark actions
- Comments and replies
- Ratings and reviews
- Follow and unfollow actions
- Infinite lists
- Notifications
- Creator dashboard data
- Search suggestions and interactive results
- Upload-processing status
- Course progress later

TanStack Query is a cache of NestJS data. It is never the permanent record.

### Zustand should handle

- Global modal and drawer state
- Navigation UI state
- Temporary recipe-editor steps
- Temporary upload progress
- Unsaved UI preferences
- Shared state needed across unrelated client components

Important recipe drafts must be saved regularly through NestJS. A draft must not exist only in Zustand because closing the browser could lose it.

### React local state should handle

- A button's loading state
- A local dropdown
- A form section used by one component
- Temporary input that does not need to be shared

### URL state should handle

- Search text
- Cuisine and dietary filters
- Sort order
- Page number
- Publicly shareable selected tabs

Example:

```text
/recipes?search=biryani&cuisine=indian&page=2
```

### Authentication state

- NestJS is the authority for the logged-in user.
- The frontend may display a temporary user copy.
- Sensitive tokens must not be stored in Zustand or Redux.
- Prefer secure HTTP-only cookies for refresh or session credentials.
- If short-lived access tokens are used, keep them in memory where practical.
- Authentication should not be migrated during recovery unless there is a confirmed problem.

### Current-to-target state migration

```text
Current:
- Redux Toolkit
- AuthContext
- Direct fetch or API client calls

Target:
- Zustand for shared UI state
- TanStack Query for interactive NestJS data
- Auth remains stable until a separate approved migration
```

Migration happens feature by feature. Redux and Zustand should not manage the same state at the same time.

---

## 8. NestJS backend architecture

NestJS is a modular monolith initially. This means one deployable backend contains separate feature modules with clear boundaries.

This is simpler than microservices and can still run as multiple identical server instances later.

### Suggested modules

```text
src/
  auth/
  users/
  profiles/
  recipes/
  media/
  comments/
  likes/
  ratings/
  reviews/
  bookmarks/
  collections/
  follows/
  stories/
  community/
  notifications/
  search/
  subscriptions/
  payments/
  courses/
  earnings/
  analytics/
  moderation/
  admin/
  outbox/
  health/
  common/
```

Small related features may stay together when splitting them would add unnecessary complexity.

### Module structure

```text
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  dto/
  types/
```

### Backend responsibilities

- Authentication and session rules
- Authorization and ownership checks
- Request validation
- Business rules
- Database transactions
- Payment verification
- Subscription access
- Creator earnings calculations
- File upload permissions
- Rate limiting
- Notification rules
- Content moderation
- Admin operations
- Audit logging
- Background-job creation

### Backend rules

- Controllers handle HTTP requests and responses.
- DTOs validate incoming data.
- Services contain business logic.
- Prisma handles database access.
- Guards protect authenticated and role-based routes.
- Business rules must not be duplicated in Next.js.
- Errors returned to users must not reveal secrets or internal details.

---

## 9. REST API design

All public API routes are versioned:

```text
/api/v1/health
/api/v1/auth
/api/v1/users
/api/v1/profiles
/api/v1/recipes
/api/v1/comments
/api/v1/likes
/api/v1/bookmarks
/api/v1/collections
/api/v1/follows
/api/v1/stories
/api/v1/community
/api/v1/notifications
/api/v1/search
/api/v1/subscriptions
/api/v1/payments
/api/v1/courses
/api/v1/earnings
/api/v1/analytics
/api/v1/admin
```

### API rules

- Use nouns for resources.
- Use normal HTTP methods: GET, POST, PATCH and DELETE.
- Validate every request.
- Return consistent error shapes.
- Paginate all lists that can grow.
- Set maximum page sizes.
- Use cursor pagination for very large or fast-changing feeds later.
- Include a request ID in responses and logs.
- Use idempotency keys for payment and other duplicate-sensitive operations.
- Keep breaking changes under a new version such as `/api/v2`.

### Example error response

```json
{
  "statusCode": 403,
  "code": "RECIPE_NOT_OWNED",
  "message": "You cannot edit this recipe.",
  "requestId": "req_123"
}
```

### Example paginated response

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "hasMore": false
}
```

---

## 10. Authentication and authorization

### Authentication flow

```text
Register or login
      |
      v
NestJS verifies credentials
      |
      v
Short-lived access credential + secure refresh/session cookie
      |
      v
Protected requests pass through an authentication guard
```

### Security requirements

- Hash passwords using an accepted password-hashing library.
- Verify email addresses.
- Rate-limit login, signup, reset and verification attempts.
- Rotate refresh tokens when used.
- Allow sessions to be revoked.
- Store refresh-token hashes rather than raw refresh tokens.
- Use secure, HTTP-only and appropriate SameSite cookies.
- Use CSRF protection for cookie-authenticated state changes where applicable.
- Restrict CORS to approved CookTale origins.
- Require recent authentication for sensitive changes when appropriate.
- Log important account-security events without logging secrets.

### Authorization

- `USER`: normal user and creator actions
- `MODERATOR`: content review actions
- `ADMIN`: operational and administrative actions

Roles alone are not enough. NestJS must also check record ownership.

Example:

```text
Authenticated user + owns recipe
  -> may edit recipe

Authenticated user + does not own recipe
  -> forbidden

Admin with recorded reason
  -> may moderate recipe
```

---

## 11. PostgreSQL data design

PostgreSQL stores all permanent business records.

### Main data areas

- Users, OAuth accounts and sessions
- Profiles and preferences
- Recipes, ingredients, equipment, steps and media metadata
- Ratings, reviews, comments and replies
- Likes and bookmarks
- Collections
- Follows
- Stories and story content
- Community discussions and challenges
- Notifications and delivery attempts
- Subscriptions, purchases and invoices
- Courses, lessons and access records later
- Creator earnings and payouts later
- Analytics event records and daily summaries
- Audit logs
- Outbox events
- Processed external webhook identifiers

### Required database rules

- User email is unique.
- Username is unique when present.
- Recipe slug is unique when present.
- A user can like a recipe only once.
- A user can bookmark a recipe only once.
- A user can follow another user only once.
- A user cannot follow themselves.
- One external payment event can be processed only once.
- One earning event can be credited only once.
- Relationships use foreign keys.
- Deleting owned content follows explicit safe rules.
- Money uses integer minor units or an exact decimal type, never floating point.

### Transactions

Use a database transaction when several writes must succeed or fail together.

Examples:

- Create like and update the displayed like counter
- Save recipe and replace all recipe steps
- Save payment and grant course access
- Save subscription event and update membership access
- Save creator earning and ledger entry
- Save business change and matching outbox event

### Index priorities

Indexes should support real query patterns, including:

- Published recipes by publish date
- Published recipes by popularity
- Recipes by creator and status
- Recipe lookup by slug
- Comments by recipe and creation time
- Notifications by user, read state and creation time
- Follows by follower and followed user
- Bookmarks by user and creation time
- Active sessions by user and expiration
- Outbox events by processing state and creation time
- Payment events by provider event ID

Every index must have a known query reason. Too many indexes slow writes.

### Database scaling order

1. Correct queries and indexes
2. Pagination
3. Safe connection pooling
4. Query timeouts
5. Slow-query monitoring
6. Database resource upgrades
7. Cache proven hot reads
8. Managed PostgreSQL or separate database server
9. Read replicas for proven read pressure
10. Sharding only at very large scale

---

## 12. Outbox pattern

The outbox pattern keeps important database changes and required background work together.

### Problem

```text
Recipe saved in PostgreSQL
Search job creation fails
Result: recipe exists but is never indexed
```

### Safe flow

```text
One PostgreSQL transaction
  +-- Save business record
  +-- Save outbox event

Outbox relay
  +-- Reads unprocessed events
  +-- Adds BullMQ job with a stable job ID
  +-- Marks the event as published

Worker
  +-- Processes safely
  +-- Handles duplicate delivery
```

### Use the outbox for

- Payment processing
- Subscription changes
- Course purchases and access
- Creator earnings
- Search indexing
- Important notifications
- Monetized analytics events
- Critical cleanup after content changes

### Outbox requirements

- Unique event ID
- Event type
- Record identifier
- Safe payload
- Creation time
- Published time
- Attempt count
- Last error
- Retry scheduling
- Retention and cleanup policy

The outbox gives at-least-once delivery. Every worker must therefore be safe when the same event arrives more than once.

---

## 13. Redis

Redis is temporary infrastructure, not the permanent source of truth.

### Redis uses

- API caching
- Authentication and abuse rate limits
- BullMQ queues
- Temporary counters
- Search suggestions
- WebSocket coordination later

### Good cache candidates

- Public recipe summaries
- Homepage sections
- Trending recipes
- Popular creators
- Public creator summaries
- Categories
- Search suggestions

### Do not place only in Redis

- Users
- Recipes
- Purchases
- Subscription truth
- Course access
- Creator earnings
- Payout records
- Important notifications
- Audit history

### Cache rules

- Every cache entry has an expiration unless permanence is clearly required.
- Shared cache keys never contain private user data.
- Cache keys include locale and other response-changing inputs.
- Update or remove relevant cache entries after database changes.
- Prevent many requests from rebuilding the same expired key at once.
- Redis failure must not create unlimited PostgreSQL traffic.

Example keys:

```text
recipe:{recipeId}
creator:{creatorId}:public
homepage:trending:{locale}
category:{categoryId}:page:{page}
```

Initially, one Redis instance may support both cache and BullMQ with clear key prefixes. Later, use separate Redis services so cache pressure cannot damage queues.

---

## 14. BullMQ and workers

BullMQ handles work that does not need to finish before the API responds.

### Initial queues

- `email`
- `notifications`
- `media`
- `search-indexing`
- `analytics`
- `scheduled`
- `cleanup`

### Initial workers

- General worker: email, notifications, search, scheduled work and cleanup
- Media worker later: video and other heavy media work

### Worker requirements

- Stable job IDs for duplicate protection
- Retry limits
- Exponential retry delays
- Processing timeouts
- Failed-job records
- Monitoring of waiting, active, delayed and failed jobs
- Graceful shutdown
- Safe repeat processing
- Controlled concurrency
- Separate limits for CPU-heavy work

### Suitable background work

- Send email
- Send push notifications later
- Create thumbnails
- Process video later
- Update search index
- Aggregate analytics
- Generate reports
- Weekly digest
- Remove expired files
- Retry provider calls

### Unsuitable queue-only data

Financial and access-changing events must already have a durable PostgreSQL record before entering BullMQ.

---

## 15. Images, short videos and files

### Cloudinary now

Use Cloudinary for:

- Recipe images
- Profile and banner images
- Story images
- Thumbnails
- Short recipe-step videos
- Image resizing and cropping
- WebP or AVIF delivery
- CDN delivery

### Upload flow

```text
1. Client asks NestJS for upload permission.
2. NestJS checks identity, file rules and ownership.
3. NestJS returns a signed upload request.
4. Client uploads directly to Cloudinary.
5. Client sends returned media metadata to NestJS.
6. NestJS validates and saves the metadata.
7. Abandoned uploads are cleaned later.
```

NestJS should not carry large file bytes when direct signed upload is available.

### File checks

- Allowed file types
- Maximum image and video sizes
- Maximum dimensions and duration
- Per-user upload limits
- Safe generated public identifiers
- Ownership of deletion requests
- Malware checks for relevant downloadable files later

### S3-compatible storage later

Use it for:

- Large course videos
- Original source files
- Private downloads
- Raw uploads
- Large archives
- Backups in a separately protected location

Private files use signed, short-lived download URLs.

---

## 16. Course video system later

Do not build this before courses are approved.

Recommended first option: use a managed video provider.

If CookTale later runs its own pipeline:

```text
Creator uploads original file directly
          |
          v
S3-compatible storage
          |
          v
Outbox event and BullMQ media job
          |
          v
Video processing worker
          |
          +-- 360p
          +-- 480p
          +-- 720p
          +-- 1080p when justified
          +-- thumbnails
          +-- HLS playlist
          |
          v
CDN with signed access
```

Later requirements include resumable uploads, subtitles, playback progress, adaptive quality, course access checks and processing status.

---

## 17. Search

### Search growth stages

```text
Stage 1: PostgreSQL basic search
Stage 2: PostgreSQL full-text search
Stage 3: Meilisearch when required
Stage 4: OpenSearch only if later complexity justifies it
```

### Search fields

- Recipe title
- Description
- Ingredients
- Cuisine
- Category
- Tags
- Dietary type
- Creator name

### Search rules

- PostgreSQL remains the permanent record.
- Search indexes are replaceable copies.
- Published content only is sent to public search.
- Removed or unpublished content is removed from search.
- Search updates use an outbox event.
- Search results enforce visibility and moderation rules.

---

## 18. Notifications

### Channels

- In-app notifications
- Transactional email
- Push notifications later
- Marketing email only with proper consent
- SMS only if a real need appears

### Flow

```text
Business event saved
      |
      v
Notification record saved in PostgreSQL
      |
      v
User preferences checked
      |
      v
Outbox events created
      |
      +-- email job -> Resend
      +-- push job later -> Firebase Cloud Messaging
```

### Notification data

```text
notifications
- id
- userId
- type
- title
- message
- link
- readAt
- createdAt

notification_deliveries
- id
- notificationId
- channel
- status
- attempts
- providerMessageId
- lastError
- sentAt
```

### Notification categories

- Security
- Transactional
- Social
- Creator activity
- Marketing

Users control optional categories. Critical security or purchase information must not depend only on push notifications.

### Duplicate email protection

- Give each email event a stable unique key.
- Store the key in PostgreSQL.
- Use it as the BullMQ job ID.
- Store provider message IDs.
- Track attempts and final status.

---

## 19. Payments and subscriptions

Use Lemon Squeezy for CookTale membership, course purchases and digital products.

### Checkout flow

```text
User requests checkout
      |
      v
NestJS creates approved checkout details
      |
      v
Lemon Squeezy checkout
      |
      v
Lemon Squeezy sends webhook
      |
      v
NestJS verifies webhook signature
      |
      v
One PostgreSQL transaction
  +-- save provider event ID
  +-- update order or subscription
  +-- grant or remove access
  +-- save outbox event
      |
      v
Background receipt and notification work
```

The browser redirect is never accepted as proof of payment.

### Payment requirements

- Verify webhook signatures using the raw request body as required.
- Store every provider event ID with a unique constraint.
- Process duplicate webhooks safely.
- Keep an auditable status history.
- Handle success, failure, refund, cancellation and expiration.
- Grant access only after verified payment state.
- Remove or retain access according to an explicit refund and cancellation policy.
- Reconcile local subscription state with the provider regularly.
- Never log payment secrets.

Creator payouts are separate from customer payments and are not part of the first payment version.

---

## 20. Creator earnings later

Public recipe views are not a safe payment source.

Keep these separate:

- Card impression
- Recipe-page view
- Unique visitor
- Engaged view
- Ad impression
- Valid monetized impression
- Creator earning
- Approved payout

### Future earnings flow

```text
Client sends an event
      |
      v
NestJS validates basic format and identity
      |
      v
Durable PostgreSQL event record
      |
      v
Outbox and analytics processing
      |
      +-- valid
      +-- duplicate
      +-- suspicious
      |
      v
Daily summary matched with confirmed ad revenue
      |
      v
Creator earning ledger
      |
      v
Approval and payout later
```

Money calculations use a ledger: each credit or debit is a durable, unique record. Displayed balances are derived from that ledger.

Fraud controls later include bot checks, duplicate-session checks, creator self-refresh detection, rate limits and suspicious-pattern review.

---

## 21. Analytics

### Product analytics

Track useful product events without collecting unnecessary personal information.

Examples:

- Recipe impression
- Recipe click
- Recipe view
- Search performed
- Bookmark
- Follow
- Recipe published
- Subscription checkout started
- Subscription confirmed

### Event example

```json
{
  "event": "recipe_clicked",
  "recipeId": "recipe-123",
  "impressionId": "imp-456",
  "feedSessionId": "feed-789",
  "position": 4,
  "source": "homepage_trending"
}
```

Public URLs remain clean. Analytics data is sent separately.

Non-financial analytics can be delayed and aggregated. Financial analytics follows the durable event and outbox rules.

---

## 22. WebSockets and real-time features later

REST remains the default.

Use WebSockets only for features where immediate updates improve the product:

- Live notification count
- Live class chat
- Live class status
- Upload or video-processing progress
- Admin operational updates
- Live viewer counts

Normal recipe loading, comments, likes, purchases and search continue using REST.

When multiple WebSocket servers exist, use Redis coordination so an event can reach a user connected to any server.

WebSocket connections must authenticate, re-check permissions for protected rooms and handle reconnects safely.

---

## 23. Cloudflare and edge protection

Cloudflare handles:

- DNS
- HTTPS
- DDoS protection
- Web Application Firewall rules
- Basic bot protection
- Static asset caching
- Safe public-page caching
- Edge rate limits
- Maintenance responses when configured

Cloudflare sits before both Next.js and NestJS.

Private or user-specific API responses must not be stored in a shared public cache.

Cloudflare is not the permanent media or database storage system.

---

## 24. Deployment

### Development

Use Docker Compose for:

- Next.js
- NestJS API
- General worker
- PostgreSQL
- Redis

External providers are used through development or test credentials.

### Initial production

Possible starting setup:

- One VPS
- Docker Compose
- Nginx or Caddy
- Cloudflare
- Off-server media
- Off-server database backups
- External email
- External uptime monitoring
- GitHub as the remote source repository

A starting server may be around 4 vCPU, 8 GB RAM and 80-160 GB SSD, but the correct size must be measured.

One VPS is a single point of failure. This is acceptable only as a known early-stage tradeoff, with tested off-server backups and a recovery plan.

### Growth deployment

When monitoring proves the need:

1. Move PostgreSQL to a managed or separate service.
2. Move Redis to a managed or separate service.
3. Run API and workers on separate machines.
4. Add multiple Next.js and NestJS instances.
5. Add a load balancer.
6. Separate cache Redis from queue Redis.
7. Add read replicas for proven read pressure.
8. Consider Kubernetes only when managing many instances manually becomes a real burden.

Do not use Docker Swarm and Kubernetes together.

---

## 25. Health checks

```text
GET /api/v1/health/live
  -> confirms that the NestJS process is alive

GET /api/v1/health/ready
  -> confirms that the API can accept normal traffic
```

The readiness check may test required dependencies with short timeouts. The liveness check stays simple so a slow database does not repeatedly restart a healthy process.

External monitoring calls these endpoints from outside CookTale infrastructure.

---

## 26. Monitoring

### Infrastructure

- CPU
- Memory
- Disk usage and free space
- Network traffic
- Container restarts
- Server availability

### Next.js and NestJS

- Request count
- Response time by route
- Median and high-percentile response times
- 4xx and 5xx responses
- Timeouts
- Active requests
- Authentication failures
- Rate-limit blocks

### PostgreSQL

- Active connections
- Connection-pool usage
- Query duration
- Slow queries
- Locks and waiting transactions
- Database size
- Backup status
- Replication delay later

### Redis

- Memory usage
- Connection count
- Command latency
- Cache hit rate
- Evictions
- Persistence health when used by queues

### BullMQ

- Waiting jobs
- Active jobs
- Delayed jobs
- Failed jobs
- Retries
- Processing time
- Oldest waiting job

### Initial monitoring approach

- External uptime service
- Sentry
- Host and container metrics
- Simple provider alerts

### Later monitoring stack

```text
Prometheus -> metrics
Grafana -> dashboards
Alertmanager -> alerts
```

Monitoring outside the VPS is required because monitoring on a failed VPS cannot send an alert.

---

## 27. Logging and error tracking

Use structured JSON logs.

```json
{
  "level": "error",
  "requestId": "req-123",
  "userId": "user-456",
  "method": "POST",
  "path": "/api/v1/recipes",
  "statusCode": 500,
  "durationMs": 920,
  "errorCode": "DATABASE_TIMEOUT"
}
```

### Request tracing

- Every incoming request receives a request ID.
- The ID is returned to the client.
- The same ID is copied into outbox events and jobs.
- Worker logs include the event and job IDs.
- Payment and notification records include safe provider identifiers.

### Never log

- Passwords
- Raw access or refresh tokens
- Cookie values
- API secrets
- Private keys
- Full payment details
- Unnecessary private personal data

Use Sentry for Next.js, NestJS and worker exceptions. Include release version and request ID, while removing sensitive information.

Start with Docker logs. Add Loki and Grafana when centralized log search becomes necessary.

---

## 28. Backups and disaster recovery

### PostgreSQL backups

- Automated backups before public launch
- Encrypted off-server storage
- Daily, weekly and monthly retention
- Point-in-time recovery when payments or important activity justify it
- Backup-failure alerts
- Regular restore tests

Example retention starting point:

```text
7 daily
4 weekly
6 monthly
```

### Media protection

- Clear ownership and deletion rules
- Original-file retention where required
- S3 versioning or provider protection for important originals later
- Never treat the same VPS as both production and backup storage

### Recovery document

Document how to:

1. Create a replacement server.
2. Restore deployment secrets.
3. Pull the correct application release.
4. Restore PostgreSQL.
5. Reconnect Redis and external services.
6. Validate database migrations.
7. Run health and user-journey checks.
8. Restore public traffic.

A backup is not trusted until a restore test succeeds.

Recovery time and acceptable data-loss targets must be chosen before public launch based on business risk.

---

## 29. Security

### Required controls

- HTTPS everywhere
- Secure cookies
- CSRF protection where applicable
- Restricted CORS
- Input validation
- Output encoding
- Authentication guards
- Role and ownership checks
- Rate limiting
- Password hashing
- Refresh-token rotation when used
- Secret management
- File type, size and ownership checks
- Signed uploads
- Verified payment webhooks
- Dependency scanning
- Audit logging
- Content moderation
- Bot and abuse protection

### Secret rules

- Production secrets are never committed.
- Frontend-public variables contain no secrets.
- Development, staging and production use different credentials.
- Secrets are rotated after suspected exposure.
- Access to production secrets is limited and auditable.

### Admin protection

- Separate admin permission checks
- Strong authentication
- Optional stronger verification for sensitive actions
- Audit record for every important admin change
- Reason required for moderation and payout changes
- Admin IP restrictions only if operationally suitable later

### Privacy

- Collect only needed personal data.
- Support account export and deletion.
- Define retention for deleted content, logs and analytics.
- Hash or reduce IP and device data used for fraud checks.
- Separate required transactional messages from marketing consent.

---

## 30. Admin system

The admin interface calls NestJS and never accesses PostgreSQL directly.

Admin features may include:

- User management
- Recipe, story and comment moderation
- Reports and abuse review
- Content removal and restoration
- Category management
- Subscription support
- Suspicious traffic review
- Earnings and payout review later
- Failed-job review
- Feature flags
- System health summary
- Audit-log review

Every sensitive admin action records the admin, target, action, reason and time.

---

## 31. Feature flags and graceful degradation

Possible feature flags:

```text
course_uploads
recommendations
live_comments
video_processing
marketing_notifications
creator_analytics
advanced_search
```

During overload or provider failure, CookTale may temporarily:

- Disable video uploads
- Use simple recommendations
- Disable expensive search filters
- Delay analytics
- Pause marketing messages
- Hide live status

Essential features should remain available where safely possible:

- Homepage
- Public recipe pages
- Login
- Recipe creation
- Bookmarks
- Purchases
- Paid-course access later

Disabled features return a clear temporary response, normally `503 Service Unavailable`, with a friendly message.

---

## 32. Testing strategy

### Backend unit tests

Test isolated rules such as:

- Ownership checks
- Slug creation
- Notification preferences
- Payment state transitions
- Creator revenue calculations later
- Course-access rules later
- Event duplicate protection

### Backend integration tests

Use a real temporary PostgreSQL and Redis where needed.

Test:

- Prisma queries
- Database constraints
- Transactions
- Outbox creation
- BullMQ job creation
- Cache invalidation
- Webhook duplicate handling

### API end-to-end tests

```text
HTTP request
  -> controller
  -> guard
  -> validation
  -> service
  -> Prisma
  -> PostgreSQL
  -> response
```

Critical API journeys:

- Register
- Verify email
- Login
- Refresh session
- Reset password
- Create and publish recipe
- Edit and remove recipe
- Like only once
- Bookmark only once
- Comment and reply permissions
- Follow only once
- Payment webhook validation
- Duplicate webhook handling
- Access grant and removal later

### Frontend tests

- Unit tests for important UI logic
- React Testing Library for components
- Playwright for browser journeys

### Browser journeys

- Register and login
- Publish and edit a recipe
- Upload media
- Like and bookmark
- Follow a creator
- Comment and reply
- Reset password
- Subscribe and confirm access
- Admin moderation later

### Load testing

Use k6 and grow gradually:

```text
10 concurrent users
50
100
250
500
1,000
higher only after fixing discovered limits
```

Test separate workloads:

- Homepage reads
- Recipe-page reads
- Search
- Login
- Likes and comments
- Recipe publishing
- Subscription access
- Redis failure
- Slow PostgreSQL
- Worker backlog

Define whether 15,000 means signed-in users online, open connections, active requests or requests per second. These are different measurements.

---

## 33. Continuous integration and delivery

Every pull request should run:

```text
Install dependencies
Lint
Type checking
Unit tests
Integration tests
Next.js build
NestJS build
Database migration validation
```

Playwright can run as a separate job.

### Delivery rules

- Failed required checks block deployment.
- Database migrations are reviewed before deployment.
- Production secrets stay outside build logs.
- Docker images have a fixed release identifier.
- Deployment records the application version.
- Rollback steps are documented.
- Database changes are backward-compatible when a fast rollback is needed.
- Production deployment requires explicit approval.

---

## 34. Performance and capacity

### Performance goals

Set separate goals instead of one vague global number.

Examples to confirm through testing:

- Public cached pages should feel immediate.
- Common API reads should have a measured high-percentile target.
- Writes should finish quickly or return after safely scheduling slow work.
- Large uploads go directly to media storage.
- Slow provider calls do not hold API requests unnecessarily.

`<200 ms average response time` is not a reliable promise for every global request. Track median, p95 and p99 times per important route.

### Scale approach

The application servers are designed to remain replaceable and mostly stateless. Permanent sessions, data and files live outside their local filesystems.

This allows more Next.js, NestJS and worker instances to be added later.

Capacity is proven through:

- Realistic load tests
- Database monitoring
- Cache behavior
- Worker backlog measurements
- Production traffic patterns
- Failure testing

---

## 35. Failure behavior

### PostgreSQL unavailable

- Readiness check fails.
- Protected writes stop safely.
- Do not claim a write succeeded.
- Show a clear temporary error.
- Alert operators.

### Redis unavailable

- Rate-limit behavior fails safely according to endpoint risk.
- Cache misses are limited so PostgreSQL is not flooded.
- Queue-dependent optional work is delayed.
- Critical business changes remain recorded through PostgreSQL and outbox.

### Worker unavailable

- API and main website remain available.
- Outbox events remain pending.
- Queue backlog alert fires.
- Work resumes safely after recovery.

### Cloudinary unavailable

- Existing cached media may remain visible.
- New uploads are temporarily disabled.
- Recipe text can be preserved as a draft.

### Email provider unavailable

- Email jobs retry with limits.
- Authentication messages show a clear delay message.
- Failed delivery remains visible to operations.

### Payment provider unavailable

- Do not grant access based on the frontend.
- Keep verified local access unchanged.
- Delay new checkout or show a temporary error.
- Reconcile when the provider recovers.

---

## 36. Development phases

### Phase 0 - Recovery and safety

- Protect all current code in one clear Git strategy
- Record current working and unfinished changes
- Make the local Docker stack start reliably
- Validate environment examples
- Build frontend and backend
- Run database migrations safely
- Verify health, authentication, profile, media and recipe flows
- Document current direct frontend database access
- Do not migrate state tools yet

### Phase 1 - Required before public launch

- Finish moving core data access behind NestJS
- Complete recipes
- Complete profiles and follows
- Complete stories or blogs
- Complete comments, likes and bookmarks
- Basic PostgreSQL search
- Complete subscription payment verification
- Add database constraints and important indexes
- Add outbox for critical work
- Add core automated tests
- Add Sentry and external uptime monitoring
- Add structured logs and request IDs
- Add automated off-server backups
- Test restore process
- Add admin moderation essentials
- Complete security review
- Run initial load tests

### Phase 2 - Required after early real users

- Introduce TanStack Query feature by feature
- Migrate approved Redux UI state to Zustand gradually
- Add in-app notification records
- Improve cache based on measurements
- Add better worker monitoring
- Improve search with PostgreSQL full-text search
- Add Playwright coverage for main journeys
- Improve product analytics
- Add operational dashboards
- Test failure and recovery behavior

### Phase 3 - Required during meaningful growth

- Separate database and Redis from the app VPS
- Separate API and workers
- Separate Redis cache and BullMQ Redis
- Add multiple application instances and load balancing
- Add Meilisearch if PostgreSQL search becomes limiting
- Add push notifications
- Add course storage or a managed video provider
- Add WebSockets only for approved live features
- Add more advanced monitoring and centralized logs
- Add point-in-time database recovery

### Phase 4 - Required only at large scale

- PostgreSQL read replicas
- Redis high availability
- Dedicated WebSocket infrastructure
- Dedicated media-processing fleet
- Kubernetes if operationally justified
- Advanced search infrastructure if Meilisearch is insufficient
- Multi-region static delivery
- Creator advertising earnings and payout infrastructure
- Business and team accounts if the product requires them

---

## 37. Current and target architecture documents

Maintain two separate views.

### Current architecture

Only list components confirmed in the repository or deployment. At the present development snapshot these include or are being integrated:

- Next.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Cloudinary
- Resend
- Lemon Squeezy
- Redux Toolkit
- AuthContext
- Docker Compose

The current document must also list unfinished migrations, missing tests, direct Next.js database access and missing operations work.

### Target architecture

List planned growth components and label them clearly as future:

- Zustand and TanStack Query
- Cloudflare
- Load balancer
- Multiple application instances
- Separate worker groups
- S3-compatible storage
- WebSockets
- Meilisearch
- Read replicas
- Full metrics, logs and alerting
- Managed or separated data services

Use this label:

> Designed to scale toward 15,000 concurrent users, subject to load testing and infrastructure sizing.

---

## 38. Launch checklist

CookTale is not ready for public production until these are confirmed:

- Core user journeys work end to end
- NestJS owns core business data access
- Production secrets are configured safely
- Payment webhooks are verified and duplicate-safe
- Database migrations are reviewed and tested
- Important constraints and indexes exist
- Backups run automatically off-server
- A restore has been tested
- Error tracking is active
- External uptime monitoring is active
- Logs contain request IDs and no secrets
- Admin moderation basics exist
- Legal pages and privacy choices are correct
- Email delivery is configured and monitored
- File upload limits and ownership checks work
- Critical automated tests pass
- Initial load tests pass agreed targets
- Recovery and rollback instructions exist
- Production deployment has explicit approval

---

## 39. Final rules

1. PostgreSQL is the permanent source of truth.
2. NestJS owns business rules and database access.
3. Next.js renders the website and calls NestJS.
4. Use `/api/v1` for the current public API.
5. Server Components load initial public data.
6. TanStack Query handles changing interactive API data.
7. Zustand handles shared temporary UI state.
8. Permanent data never depends on frontend state.
9. Sensitive tokens never live in Redux or Zustand.
10. Important database changes and outbox events are saved together.
11. Workers are safe to retry and receive duplicates.
12. Redis improves speed but is not the only record for important data.
13. Payment and creator-earning events reach PostgreSQL before background processing.
14. Large uploads go directly to media storage.
15. Public view counters do not determine creator earnings.
16. Monitoring, external backups and restore testing are required before launch.
17. Start with individual creators; add teams only when the product needs them.
18. Do not add Kubernetes, replicas, sharding or advanced search without measurements.
19. Do not claim 15,000-user capacity until load testing proves it.
20. Recover and stabilize the current product before large migrations.

---

## 40. Development backlog

### Newsletter campaigns

- Add a scheduled worker for weekly newsletters after launch.
- Send only to confirmed, active subscribers who have not unsubscribed.
- Send in small batches with retry handling, delivery tracking and failure alerts.
- Keep the subscriber record and unsubscribe status in PostgreSQL as the source of truth.

### Optional onboarding survey

- Keep a short, skippable survey after signup to learn how people found CookTale and what they want to do.
- Store only useful answers: referral source, primary goal and creator/home-cook role.
- Add a simple admin report for referral-source totals before launch marketing begins.
- Review the answer options after early launch feedback; do not collect sensitive or unnecessary personal information.
