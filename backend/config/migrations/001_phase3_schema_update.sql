-- Migration 001: Phase 3 Schema Updates
-- Run this against your MariaDB container before starting the backend.

-- 1. Add PrimaryContactUserID to Agency table
ALTER TABLE Agency
ADD COLUMN PrimaryContactUserID INT NULL,
ADD CONSTRAINT fk_agency_primary_contact
    FOREIGN KEY (PrimaryContactUserID) REFERENCES User(UserID)
    ON DELETE SET NULL;

-- 2. Ensure ServiceRecordOption.ServiceOptionID is nullable
--    and confirm Name + Fee snapshot columns exist
ALTER TABLE ServiceRecordOption
MODIFY COLUMN ServiceOptionID INT NULL;

-- Confirm snapshot columns exist (safe to run even if already present)
ALTER TABLE ServiceRecordOption
MODIFY COLUMN Name VARCHAR(100) NULL,
MODIFY COLUMN Fee DECIMAL(10,2) NULL,
MODIFY COLUMN IsChargeable BOOLEAN NULL;

-- 3. Add IsPauseRequested flag to Service table for customer pause queue
ALTER TABLE Service
ADD COLUMN IsPauseRequested BOOLEAN DEFAULT FALSE;
