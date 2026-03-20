-- Worker support: alert dedup, round-robin scheduling, health tracking

-- Partial unique index: only one unclaimed alert per watch at a time
-- Allows re-alerts after previous alert is claimed or expired
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_unclaimed_alert_per_watch
  ON availability_alerts (watched_target_id)
  WHERE claimed = false;

-- Round-robin tracking so all watches get fair coverage
ALTER TABLE watched_targets ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Worker health status (singleton row)
CREATE TABLE IF NOT EXISTS worker_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_cycle_at TIMESTAMPTZ,
  last_successful_poll_at TIMESTAMPTZ,
  consecutive_403_count INT DEFAULT 0,
  platforms_healthy JSONB DEFAULT '{}',
  cycle_stats JSONB DEFAULT '{}'
);

ALTER TABLE worker_status ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so this policy is only needed if
-- you ever query worker_status from the client side
CREATE POLICY "Allow worker status reads" ON worker_status
  FOR SELECT USING (true);
