-- Migration 004: Phase 6 Schema Updates
-- Run before starting the backend:
-- docker exec -i mopsy_db mariadb -u mopsy_user -p mopsy < backend/config/migrations/004_phase6_schema_update.sql

-- 1. Add CustomBufferHours to Service table
--    NULL = use global DEFAULT_REQUEST_BUFFER_HOURS from env
ALTER TABLE Service
ADD COLUMN IF NOT EXISTS CustomBufferHours INT NULL;
