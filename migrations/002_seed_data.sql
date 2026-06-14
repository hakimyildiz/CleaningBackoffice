-- Seed Data for Cleaning Service Management

-- Insert default service options
INSERT IGNORE INTO ServiceOption (ServiceOptionID, Name, Fee, IsActive) VALUES
    (UUID(), 'Deep Cleaning', 50.00, TRUE),
    (UUID(), 'Window Cleaning', 25.00, TRUE),
    (UUID(), 'Oven Cleaning', 35.00, TRUE),
    (UUID(), 'Fridge Cleaning', 20.00, TRUE),
    (UUID(), 'Carpet Cleaning', 45.00, TRUE),
    (UUID(), 'Ironing Service', 30.00, TRUE),
    (UUID(), 'Laundry Service', 25.00, TRUE),
    (UUID(), 'Pet Waste Removal', 20.00, TRUE),
    (UUID(), 'Garden Cleanup', 60.00, TRUE),
    (UUID(), 'Post-Construction Cleaning', 100.00, TRUE);

-- Insert default system settings
INSERT IGNORE INTO SystemSettings (SettingKey, SettingValue) VALUES
    ('paypal_enabled', 'false'),
    ('base_cleaning_rate', '15.00'),
    ('bed_rate', '5.00'),
    ('bathroom_rate', '8.00'),
    ('kitchen_rate', '10.00'),
    ('pet_fee', '15.00'),
    ('weekend_multiplier', '1.25'),
    ('reschedule_limit_hours', '6'),
    ('invoice_prefix', 'INV'),
    ('vat_rate', '0.20');

-- Insert default admin user
INSERT IGNORE INTO UserLogin (UserID, Username, UserPassword, Email, Role, IsActive)
SELECT UUID(), 'admin', '$2a$10$owSdIaqBjUpDlweDMNcoLOPxUSusDLF5ztX/Cs5KCIOQeoKVafBWy', 'admin@cleanpro.com', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM UserLogin WHERE Role = 'admin');

-- Note: The password for the admin user is 'admin123'
-- You should change this immediately after first login

-- Create default admin cleaner record
INSERT IGNORE INTO Cleaner (Title, FirstName, SureName, Email, MobilePhone, IsActive, Rate)
SELECT 'Mr', 'System', 'Admin', 'admin@cleanpro.com', '+44 7000 000000', TRUE, 15.00
WHERE NOT EXISTS (SELECT 1 FROM Cleaner WHERE Email = 'admin@cleanpro.com');
