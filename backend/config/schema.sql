-- 1. Person
CREATE TABLE Person (
    PersonID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(20),
    FirstName VARCHAR(100) NOT NULL,
    SureName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE,
    HomePhone VARCHAR(20),
    MobilePhone VARCHAR(20),
    BirthDate DATE,
    Gender VARCHAR(10),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Note TEXT
);

-- 2. User
CREATE TABLE User (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL UNIQUE,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('admin','manager','cleaner_manager','cleaner',
              'customer','agency_manager','agency_bookkeeper','agency_staff') NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastLoginAt DATETIME,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
);

-- 3. RefreshToken
CREATE TABLE RefreshToken (
    RefreshTokenID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Token VARCHAR(512) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- 4. Employee
CREATE TABLE Employee (
    EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL UNIQUE,
    WorkPhone VARCHAR(20),
    RegisterDate DATE,
    NINo VARCHAR(30),
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    Rate DECIMAL(10,2),
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
);

-- 5. Customer
CREATE TABLE Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL UNIQUE,
    WorkPhone VARCHAR(20),
    Occupation VARCHAR(100),
    RegisterDate DATE,
    Rate DECIMAL(10,2),
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
);

-- 6. Agency
CREATE TABLE Agency (
    AgencyID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Email VARCHAR(100),
    Phone VARCHAR(20),
    CompanyNo VARCHAR(50),
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    Rate DECIMAL(10,2),
    IsActive BOOLEAN DEFAULT TRUE,
    Note TEXT
);

-- 7. AgencyStaff
CREATE TABLE AgencyStaff (
    AgencyStaffID INT AUTO_INCREMENT PRIMARY KEY,
    AgencyID INT NOT NULL,
    PersonID INT NOT NULL UNIQUE,
    WorkPhone VARCHAR(20),
    RegisterDate DATE,
    AgencyCode VARCHAR(50),
    Role ENUM('agency_manager','agency_bookkeeper','agency_staff') NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    Note TEXT,
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID),
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
);

-- 8. DefaultRate
CREATE TABLE DefaultRate (
    DefaultRateID INT AUTO_INCREMENT PRIMARY KEY,
    Rate DECIMAL(10,2) NOT NULL,
    ValidFrom DATE NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. ServiceOption
CREATE TABLE ServiceOption (
    ServiceOptionID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Fee DECIMAL(10,2) DEFAULT 0.00,
    IsChargeable BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE
);

-- 10. Service
CREATE TABLE Service (
    ServiceID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    AgencyID INT,
    AgencyStaffID INT,
    Type ENUM('one_off','regular') NOT NULL,
    RefNo VARCHAR(100),
    Rate DECIMAL(10,2),
    PropertyType ENUM('house','office','shop','apartment','other'),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Beds INT,
    Bathrooms INT,
    Kitchens INT,
    HasPet BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID),
    FOREIGN KEY (AgencyStaffID) REFERENCES AgencyStaff(AgencyStaffID)
);

-- 11. ServiceSchedule
CREATE TABLE ServiceSchedule (
    ServiceScheduleID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceID INT NOT NULL,
    Frequency ENUM('weekly','fortnightly','monthly') NOT NULL,
    DayOfWeek ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
    DayOfMonth INT,
    StartTime TIME,
    EstimatedHours DECIMAL(4,2),
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID)
);

-- 12. ServicePause
CREATE TABLE ServicePause (
    ServicePauseID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceID INT NOT NULL,
    PauseFrom DATE NOT NULL,
    PauseTo DATE NOT NULL,
    Reason TEXT,
    RequestedBy INT,
    ApprovedBy INT,
    Status ENUM('pending','approved','rejected') DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID),
    FOREIGN KEY (RequestedBy) REFERENCES User(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES User(UserID)
);

-- 13. ServiceRecord
CREATE TABLE ServiceRecord (
    ServiceRecordID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceID INT NOT NULL,
    CustomerID INT,
    AgencyID INT,
    AgencyStaffID INT,
    Rate DECIMAL(10,2),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    ScheduledDate DATE NOT NULL,
    ScheduledStart TIME,
    EstimatedHours DECIMAL(4,2),
    ActualHours DECIMAL(4,2),
    Status ENUM('scheduled','in_progress','completed',
                'invoice_sent','paid','cancelled','skipped') NOT NULL DEFAULT 'scheduled',
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID),
    FOREIGN KEY (AgencyStaffID) REFERENCES AgencyStaff(AgencyStaffID),
    FOREIGN KEY (CreatedBy) REFERENCES User(UserID)
);

-- 14. ServiceRecordOption
CREATE TABLE ServiceRecordOption (
    ServiceRecordOptionID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceRecordID INT NOT NULL,
    ServiceOptionID INT NOT NULL,
    Name VARCHAR(100),
    Fee DECIMAL(10,2),
    IsChargeable BOOLEAN,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID),
    FOREIGN KEY (ServiceOptionID) REFERENCES ServiceOption(ServiceOptionID)
);

-- 15. ServiceRecordCleaner
CREATE TABLE ServiceRecordCleaner (
    ServiceRecordCleanerID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceRecordID INT NOT NULL,
    EmployeeID INT NOT NULL,
    AssignedBy INT,
    CheckIn DATETIME,
    CheckOut DATETIME,
    ActualHours DECIMAL(4,2),
    Note TEXT,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (AssignedBy) REFERENCES User(UserID)
);

-- 16. ServicePhoto
CREATE TABLE ServicePhoto (
    ServicePhotoID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceRecordID INT NOT NULL,
    EmployeeID INT,
    PhotoType ENUM('before','after','other'),
    DriveFileID VARCHAR(255),
    DriveURL VARCHAR(500),
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

-- 17. Invoice
CREATE TABLE Invoice (
    InvoiceID INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceNumber CHAR(12) UNIQUE NOT NULL,
    ServiceRecordID INT NOT NULL,
    CustomerID INT,
    AgencyID INT,
    SubTotal DECIMAL(10,2),
    ExtrasTotal DECIMAL(10,2),
    Total DECIMAL(10,2),
    PDFPath VARCHAR(500),
    Status ENUM('draft','sent','partially_paid','paid','overdue') DEFAULT 'draft',
    SentAt DATETIME,
    DueDate DATE,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID),
    FOREIGN KEY (CreatedBy) REFERENCES User(UserID)
);

-- 18. Payment
CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaidAt DATETIME NOT NULL,
    Method ENUM('bank_transfer','cash','card','other') DEFAULT 'bank_transfer',
    Reference VARCHAR(100),
    Note TEXT,
    RecordedBy INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID),
    FOREIGN KEY (RecordedBy) REFERENCES User(UserID)
);

-- 19. CreditLedger
CREATE TABLE CreditLedger (
    CreditLedgerID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    AgencyID INT,
    Amount DECIMAL(10,2) NOT NULL,
    Type ENUM('overpayment','underpayment','manual_adjustment','refund') NOT NULL,
    RelatedPaymentID INT,
    RelatedInvoiceID INT,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID),
    FOREIGN KEY (RelatedPaymentID) REFERENCES Payment(PaymentID),
    FOREIGN KEY (RelatedInvoiceID) REFERENCES Invoice(InvoiceID),
    FOREIGN KEY (CreatedBy) REFERENCES User(UserID)
);

-- 20. EmployeePayment
CREATE TABLE EmployeePayment (
    EmployeePaymentID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Type ENUM('regular','bonus','expense','travel','other') NOT NULL,
    PeriodFrom DATE,
    PeriodTo DATE,
    PaidAt DATETIME,
    Reference VARCHAR(100),
    Note TEXT,
    RecordedBy INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (RecordedBy) REFERENCES User(UserID)
);

-- 21. ChangeRequest
CREATE TABLE ChangeRequest (
    ChangeRequestID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceRecordID INT,
    ServiceID INT,
    RequestedBy INT NOT NULL,
    Type ENUM('reschedule','cancel','extra_service',
              'cleaner_change','hours_change','other') NOT NULL,
    RequestedValue TEXT,
    Status ENUM('pending','approved','rejected') DEFAULT 'pending',
    ReviewedBy INT,
    ReviewedAt DATETIME,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID),
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID),
    FOREIGN KEY (RequestedBy) REFERENCES User(UserID),
    FOREIGN KEY (ReviewedBy) REFERENCES User(UserID)
);

-- 22. NotificationLog
CREATE TABLE NotificationLog (
    NotificationLogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Type ENUM('invoice','overdue_reminder','assignment',
              'change_request','approval','other') NOT NULL,
    Channel ENUM('email') DEFAULT 'email',
    Subject VARCHAR(255),
    SentAt DATETIME,
    Status ENUM('sent','failed') DEFAULT 'sent',
    RelatedID INT,
    RelatedType VARCHAR(50),
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- 23. SystemLog
CREATE TABLE SystemLog (
    SystemLogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Action VARCHAR(100),
    EntityType VARCHAR(50),
    EntityID INT,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);
