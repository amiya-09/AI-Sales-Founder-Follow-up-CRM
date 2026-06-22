CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  gmail_connected BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'replied', 'follow_up_sent', 'cold', 'won', 'lost'
);

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL,
  name            VARCHAR(255),
  company         VARCHAR(255),
  status          lead_status DEFAULT 'new',
  last_contact_at TIMESTAMPTZ,
  last_reply_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_leads_user_id     ON leads(user_id);
CREATE INDEX idx_leads_last_reply  ON leads(last_reply_at DESC);

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction        message_direction NOT NULL,
  subject          VARCHAR(500),
  body_text        TEXT NOT NULL,
  sent_at          TIMESTAMPTZ NOT NULL,
  gmail_message_id VARCHAR(255) UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_lead_id ON messages(lead_id, sent_at);

CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'frustrated');

CREATE TABLE signals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id         UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  lead_id            UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sentiment          sentiment_type DEFAULT 'neutral',
  summary_text       TEXT,
  signal_tags        JSONB DEFAULT '[]',
  recommended_action VARCHAR(100),
  confidence         FLOAT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_lead_id ON signals(lead_id);

CREATE TYPE draft_status AS ENUM (
  'pending_review', 'edited', 'approved', 'sent', 'dismissed'
);

CREATE TABLE followup_drafts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  signal_id  UUID REFERENCES signals(id),
  draft_text TEXT NOT NULL,
  final_text TEXT,
  status     draft_status DEFAULT 'pending_review',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at    TIMESTAMPTZ
);

CREATE INDEX idx_drafts_lead_id ON followup_drafts(lead_id, status);
