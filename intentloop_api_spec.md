# IntentLoop — NestJS API Spec (MVP v1)

Base URL: `/api/v1`  
Auth: Bearer JWT on all routes unless marked `[public]`

---

## Module Structure

```
src/
├── auth/
├── users/
├── plans/
├── progress-updates/
├── comments/
├── sessions/
├── inspirations/
├── milestones/
├── ai/              ← internal only, no direct routes
└── scheduler/       ← stall detection cron
```

---

## AUTH MODULE

### POST `/auth/register` [public]
Register a new user.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "display_name": "string (optional)"
}
```
**Response:** `201` — `{ access_token, user }`

---

### POST `/auth/login` [public]
**Body:**
```json
{ "email": "string", "password": "string" }
```
**Response:** `200` — `{ access_token, user }`

---

### GET `/auth/me`
Returns current user profile.
**Response:** `200` — `User`

---

## USERS MODULE

### GET `/users/:id`
Get public profile.

### GET `/users/:id/plans`
Get all public plans of a user. Returns private plans only if caller is the owner.

### GET `/users/friends`
Get current user's accepted friends.

### POST `/users/friends/request`
**Body:** `{ "addressee_id": "uuid" }`
**Response:** `201` — `Friendship`

### PATCH `/users/friends/:id/accept`
Accept a pending friend request.

### DELETE `/users/friends/:id`
Remove or reject a friendship.

---

## SESSIONS MODULE

> Every meaningful app entry must create a session.

### POST `/sessions`
Start a new session. Returns inspiration items.

**Body:**
```json
{
  "intent": "build | explore | continue",
  "category_slug": "coding"
}
```

**Response:** `201`
```json
{
  "session": { "id": "uuid", ... },
  "inspirations": [ InspirationItem, ... ]
}
```

---

### PATCH `/sessions/:id/convert`
Mark session as converted to a plan.

**Body:** `{ "plan_id": "uuid" }`
**Response:** `200` — `Session`

---

### PATCH `/sessions/:id/end`
Close a session without conversion.
**Response:** `200` — `Session`

---

## PLANS MODULE

### POST `/plans`
Create a new plan.

**Body:**
```json
{
  "title": "string",
  "category_slug": "string",
  "description": "string (optional)",
  "target_date": "ISO date (optional)",
  "inspiration_ids": ["uuid"] // optional
}
```
**Response:** `201` — `Plan`

---

### GET `/plans`
Get all plans for current user.

**Query params:**
- `status`: filter by plan_status
- `category`: filter by category slug

**Response:** `200` — `Plan[]`

---

### GET `/plans/:id`
Get single plan with progress updates and milestones.

Access rules:
- Owner: always
- Friend of owner: if any progress update is public
- Otherwise: 403

---

### PATCH `/plans/:id`
Update plan fields.

**Body (all optional):**
```json
{
  "title": "string",
  "description": "string",
  "status": "idea | active | stalled | completed | archived",
  "target_date": "ISO date"
}
```

---

### DELETE `/plans/:id`
Soft-delete → sets status to `archived`.
(Nothing is hard deleted per system rules.)

---

## PROGRESS UPDATES MODULE

### POST `/plans/:planId/updates`
Add a progress update.

**Body:**
```json
{
  "content": "string",
  "type": "technical | question | extension | support | none"
}
```

**System behavior:**
- If `type !== 'none'` → `visibility = 'public'`
- If `type === 'none'` → send to AI classifier → set `visibility` and override `type`
- Also marks plan status as `active` if currently `idea` or `stalled`

**Response:** `201` — `ProgressUpdate`

---

### GET `/plans/:planId/updates`
Get all updates for a plan.

Access: owner sees all. Friends see only `public` ones.

---

### DELETE `/plans/:planId/updates/:id`
Soft-delete (sets visibility to `private_to_author`).

---

## COMMENTS MODULE

### POST `/plans/:planId/comments`
Add a comment. Caller must be a friend of the plan owner.

**Body:**
```json
{
  "content": "string",
  "type": "technical | question | extension | support | none"
}
```

Same AI-classification rule as progress updates.

**Response:** `201` — `Comment`

---

### GET `/plans/:planId/comments`
Get comments. Owner sees all; others see `public` only.

---

### DELETE `/plans/:planId/comments/:id`
Owner of comment or plan owner can suppress (sets `private_to_author`).

---

## MILESTONES MODULE

### POST `/plans/:planId/milestones`
**Body:** `{ "title": "string" }`
**Response:** `201` — `Milestone`

### PATCH `/plans/:planId/milestones/:id`
**Body:** `{ "title": "string", "completed": true }`
**Response:** `200` — `Milestone`

### DELETE `/plans/:planId/milestones/:id`
Hard delete (milestones are lightweight, no content).

---

## INSPIRATIONS MODULE

### GET `/inspirations`
Get inspiration items by category (used internally for session generation).

**Query:** `?category=coding&limit=6`

### POST `/inspirations` (admin only)
Seed new inspiration content.

---

## DASHBOARD MODULE

### GET `/dashboard`
Returns a structured dashboard payload for the current user.

**Response:**
```json
{
  "active_plans": Plan[],
  "stalled_plans": Plan[],
  "completed_plans": Plan[],
  "recent_friend_updates": PublicProgressUpdate[],
  "metrics": {
    "total_plans": 12,
    "completed": 4,
    "active": 5,
    "stalled": 3
  }
}
```

---

## AI MODULE (internal, no HTTP routes)

Called internally by other services. Never exposed directly.

### `AiService.classifyUpdate(content: string)`
Returns `{ type: UpdateType, visibility: VisibilityLevel }`

### `AiService.summarizePlan(planId: string)`
Returns markdown summary of all progress updates.

### `AiService.detectStall(planId: string)`
Called by scheduler. Returns boolean.

---

## SCHEDULER MODULE

Runs every 24 hours via `@nestjs/schedule`:

```ts
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async detectStalledPlans() {
  // UPDATE plans SET status='stalled', stalled_since=NOW()
  // WHERE status='active'
  //   AND last progress_update older than 7 days
}
```

---

## ERROR RESPONSES

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You must be a friend to view this plan"
}
```

Standard NestJS `HttpException` shapes throughout.

---

## AUTH GUARD SUMMARY

| Route pattern       | Guard              |
|---------------------|--------------------|
| `POST /auth/*`      | None (public)      |
| All others          | `JwtAuthGuard`     |
| Plan visibility     | `PlanAccessGuard`  |
| Comment posting     | `FriendGuard`      |
| Admin routes        | `AdminGuard`       |

---

## RECOMMENDED NestJS MODULES

```
@nestjs/jwt
@nestjs/passport
passport-jwt
@nestjs/schedule       ← stall detection
@nestjs/config
prisma (ORM)
class-validator        ← DTO validation
class-transformer
```

---

## DTO EXAMPLE (Plan)

```ts
// create-plan.dto.ts
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  title: string;

  @IsString()
  category_slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  target_date?: string;

  @IsOptional()
  @IsArray()
  inspiration_ids?: string[];
}
```
