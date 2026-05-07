-- ============================================================
-- IntentLoop — PostgreSQL Schema (MVP v1)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(64) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(128),
    bio         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FRIENDS (bidirectional)
-- ============================================================
CREATE TABLE friendships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(16) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id <> addressee_id)
);

-- ============================================================
-- CATEGORIES (seeded, extendable)
-- ============================================================
CREATE TABLE categories (
    id      SERIAL PRIMARY KEY,
    slug    VARCHAR(64) UNIQUE NOT NULL,  -- e.g. 'coding', 'carpentry'
    label   VARCHAR(128) NOT NULL,
    icon    VARCHAR(64)                   -- optional emoji or icon name
);

INSERT INTO categories (slug, label, icon) VALUES
    ('coding',     'Coding',      '💻'),
    ('design',     'Design',      '🎨'),
    ('carpentry',  'Carpentry',   '🪚'),
    ('writing',    'Writing',     '✍️'),
    ('music',      'Music',       '🎸'),
    ('art',        'Art',         '🖌️'),
    ('hardware',   'Hardware',    '🔩'),
    ('research',   'Research',    '🔬'),
    ('other',      'Other',       '📦');

-- ============================================================
-- PLANS
-- ============================================================
CREATE TYPE plan_status AS ENUM ('idea', 'active', 'stalled', 'completed', 'archived');

CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INT  NOT NULL REFERENCES categories(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    status          plan_status NOT NULL DEFAULT 'idea',
    target_date     DATE,
    stalled_since   TIMESTAMPTZ,   -- set by background job
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_user_id     ON plans(user_id);
CREATE INDEX idx_plans_status      ON plans(status);
CREATE INDEX idx_plans_category_id ON plans(category_id);

-- ============================================================
-- PROGRESS UPDATES
-- ============================================================
CREATE TYPE update_type       AS ENUM ('technical', 'question', 'extension', 'support', 'none');
CREATE TYPE visibility_level  AS ENUM ('public', 'private_to_author');

CREATE TABLE progress_updates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    type        update_type NOT NULL DEFAULT 'none',
    visibility  visibility_level NOT NULL DEFAULT 'public',
    ai_classified BOOLEAN NOT NULL DEFAULT FALSE,  -- true if type was set by AI
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_progress_plan_id ON progress_updates(plan_id);

-- ============================================================
-- COMMENTS (on plans only, friend-scoped)
-- ============================================================
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    type        update_type NOT NULL DEFAULT 'none',
    visibility  visibility_level NOT NULL DEFAULT 'public',
    ai_classified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_plan_id ON comments(plan_id);

-- ============================================================
-- SESSIONS (entry-point log)
-- ============================================================
CREATE TYPE session_intent AS ENUM ('build', 'explore', 'continue');

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intent          session_intent NOT NULL,
    category_id     INT REFERENCES categories(id),
    converted       BOOLEAN NOT NULL DEFAULT FALSE, -- did session produce a plan?
    converted_plan_id UUID REFERENCES plans(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- ============================================================
-- INSPIRATION ITEMS
-- ============================================================
CREATE TABLE inspiration_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INT NOT NULL REFERENCES categories(id),
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- junction: which inspiration items were shown in a session
CREATE TABLE session_inspirations (
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    inspiration_id  UUID NOT NULL REFERENCES inspiration_items(id),
    PRIMARY KEY (session_id, inspiration_id)
);

-- junction: which inspirations contributed to a plan
CREATE TABLE plan_inspirations (
    plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    inspiration_id  UUID NOT NULL REFERENCES inspiration_items(id),
    PRIMARY KEY (plan_id, inspiration_id)
);

-- ============================================================
-- MILESTONES (optional sub-goals inside a plan)
-- ============================================================
CREATE TABLE milestones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- STALL DETECTION (run as a scheduled job / cron)
-- ============================================================
-- Mark plans as stalled if no progress update in 7 days while active
-- Call this from a NestJS scheduler every 24h:
--
-- UPDATE plans
-- SET status = 'stalled', stalled_since = NOW()
-- WHERE status = 'active'
--   AND id NOT IN (
--       SELECT DISTINCT plan_id FROM progress_updates
--       WHERE created_at > NOW() - INTERVAL '7 days'
--   );
