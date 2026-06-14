-- Insert Admin Person
INSERT INTO Person (Title, FirstName, SureName, Email, MobilePhone, AddressLine, City, PostCode)
VALUES ('Mr', 'Admin', 'User', 'admin@mopsy.co.uk', '07700900000', '123 Main St', 'London', 'EC1A 1BB');

-- Insert Admin User linked to Person (PersonID = 1)
-- Password is 'Admin1234!' (hashed with bcrypt 12 rounds)
INSERT INTO User (PersonID, Username, Password, Role, IsActive)
VALUES (1, 'admin', '$2b$12$OLlruQv87dVeyFoNdKS4OOqUKjnnhj4r/s0DYLxrH4KdpWn3huB5u', 'admin', TRUE);
