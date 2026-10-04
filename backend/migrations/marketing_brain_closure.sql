-- Marketing Brain closure: publication lifecycle + attribution evidence.
-- Marketing-only migration. Safe to run repeatedly.

ALTER TABLE marketing_campaign_runs
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS provider_status TEXT,
    ADD COLUMN IF NOT EXISTS internal_status TEXT,
    ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS error TEXT;

CREATE INDEX IF NOT EXISTS marketing_campaign_runs_status_idx
    ON marketing_campaign_runs(status, last_checked_at);

CREATE INDEX IF NOT EXISTS marketing_campaign_runs_provider_idx
    ON marketing_campaign_runs(channel, external_id, provider_status);

ALTER TABLE marketing_learning_observations
    ADD COLUMN IF NOT EXISTS attribution_key TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT,
    ADD COLUMN IF NOT EXISTS medium TEXT,
    ADD COLUMN IF NOT EXISTS attribution_evidence BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS marketing_learning_attribution_key_idx
    ON marketing_learning_observations(attribution_key)
    WHERE attribution_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketing_learning_evidence_idx
    ON marketing_learning_observations(attribution_evidence, updated_at DESC);
