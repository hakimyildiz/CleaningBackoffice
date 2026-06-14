-- Migration 002: Phase 4 Schema Updates
-- Run this against your MariaDB container before starting the backend.
-- Command: docker exec -i mopsy_db mariadb -u mopsy_user -p mopsy < backend/config/migrations/002_phase4_schema_update.sql

-- 1. Add RequireCheckoutPhoto to Service table
ALTER TABLE Service
ADD COLUMN RequireCheckoutPhoto BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Add per-cleaner GPS coordinates to ServiceRecordCleaner
ALTER TABLE ServiceRecordCleaner
ADD COLUMN CheckInLat  DECIMAL(11,8) NULL,
ADD COLUMN CheckInLng  DECIMAL(11,8) NULL,
ADD COLUMN CheckOutLat DECIMAL(11,8) NULL,
ADD COLUMN CheckOutLng DECIMAL(11,8) NULL;

-- 3. Modify ServiceRecord.Status enum to include 'missed' and preserve all other statuses
ALTER TABLE ServiceRecord
MODIFY COLUMN Status ENUM(
  'scheduled',
  'in_progress',
  'completed',
  'invoice_sent',
  'paid',
  'cancelled',
  'skipped',
  'missed'
) NOT NULL DEFAULT 'scheduled';

-- 4. Add Status column to ServiceSchedule table to support migration and potential rule status
ALTER TABLE ServiceSchedule
ADD COLUMN IF NOT EXISTS Status ENUM(
  'scheduled',
  'skipped',
  'cancelled',
  'missed',
  'completed'
) NOT NULL DEFAULT 'scheduled';

-- 5. Add HoursOverride and RateOverride columns to Invoice table
ALTER TABLE Invoice
ADD COLUMN HoursOverride DECIMAL(4,2) NULL,
ADD COLUMN RateOverride DECIMAL(10,2) NULL;

-- 6. Add ServiceScheduleEmployee join table
CREATE TABLE IF NOT EXISTS ServiceScheduleEmployee (
    ServiceScheduleEmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceScheduleID         INT NOT NULL,
    EmployeeID                INT NOT NULL,
    AssignedBy                INT NOT NULL,
    AssignedAt                DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceScheduleID) REFERENCES ServiceSchedule(ServiceScheduleID) ON DELETE CASCADE,
    FOREIGN KEY (EmployeeID)        REFERENCES Employee(EmployeeID),
    FOREIGN KEY (AssignedBy)        REFERENCES User(UserID),
    UNIQUE KEY uq_schedule_employee (ServiceScheduleID, EmployeeID)
);
