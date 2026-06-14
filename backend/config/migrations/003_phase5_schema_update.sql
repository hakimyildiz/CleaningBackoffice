-- Migration 003: Phase 5 Schema Updates
-- Run before starting the backend:
-- docker exec -i mopsy_db mariadb -u mopsy_user -p mopsy < backend/config/migrations/003_phase5_schema_update.sql

-- 1. Add RemainingAmount, HoursOverride, RateOverride, CreditApplied to Invoice
ALTER TABLE Invoice
ADD COLUMN IF NOT EXISTS RemainingAmount  DECIMAL(10,2)  NULL,
ADD COLUMN IF NOT EXISTS HoursOverride    DECIMAL(4,2)   NULL,
ADD COLUMN IF NOT EXISTS RateOverride     DECIMAL(10,2)  NULL,
ADD COLUMN IF NOT EXISTS CreditApplied    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS PreviousBalance  DECIMAL(10,2)  NOT NULL DEFAULT 0.00;

-- 2. Add 'forwarded' to Invoice.Status enum
ALTER TABLE Invoice
MODIFY COLUMN Status ENUM(
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'forwarded',
  'cancelled'
) NOT NULL DEFAULT 'draft';

-- 3. Set RemainingAmount default to Total for existing rows
UPDATE Invoice SET RemainingAmount = Total WHERE RemainingAmount IS NULL;

-- Make RemainingAmount NOT NULL after backfill
ALTER TABLE Invoice
MODIFY COLUMN RemainingAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Overdue cron tracking: add DueDate to Invoice if not present
ALTER TABLE Invoice
ADD COLUMN IF NOT EXISTS DueDate DATE NULL;

-- 5. Extend ChangeRequest table with ServiceScheduleID and 'pause' type if not already done
ALTER TABLE ChangeRequest
ADD COLUMN IF NOT EXISTS ServiceScheduleID INT NULL,
MODIFY COLUMN Type ENUM(
  'reschedule',
  'cancel',
  'extra_service',
  'cleaner_change',
  'hours_change',
  'pause',
  'other'
) NOT NULL;

-- Try adding foreign key if it is not present
ALTER TABLE ChangeRequest
ADD CONSTRAINT fk_change_request_schedule
FOREIGN KEY (ServiceScheduleID) REFERENCES ServiceSchedule(ServiceScheduleID);
