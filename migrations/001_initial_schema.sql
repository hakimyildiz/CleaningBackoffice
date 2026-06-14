-- Cleaning Service Management Database Schema
-- MariaDB Schema

CREATE TABLE IF NOT EXISTS UserLogin (
    UserID CHAR(36) PRIMARY KEY PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    Email VARCHAR(100),
    Role ENUM('admin', 'manager', 'cleaner_manager', 'cleaner', 'customer', 'agency_manager', 'agency_bookkeeper', 'agency_staff') NOT NULL DEFAULT 'customer',
    IsActive BOOLEAN DEFAULT TRUE,
    EntityID INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Cleaner (
    CleanerID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(20),
    FirstName VARCHAR(100),
    SureName VARCHAR(100),
    Occupation VARCHAR(100),
    Email VARCHAR(100),
    HomePhone VARCHAR(20),
    WorkPhone VARCHAR(20),
    MobilePhone VARCHAR(20),
    BrithDate DATE,
    Gender VARCHAR(10),
    RegisterDate DATE,
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    NINo VARCHAR(30),
    IsActive BOOLEAN DEFAULT TRUE,
    Rate DECIMAL(10,2),
    Note TEXT,
    UserID CHAR(36),
    FOREIGN KEY (UserID) REFERENCES UserLogin(UserID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(20),
    FirstName VARCHAR(100),
    SureName VARCHAR(100),
    Occupation VARCHAR(100),
    Email VARCHAR(100),
    HomePhone VARCHAR(20),
    WorkPhone VARCHAR(20),
    MobilePhone VARCHAR(20),
    BrithDate DATE,
    Gender VARCHAR(10),
    RegisterDate DATE,
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Rate DECIMAL(10,2),
    Note TEXT,
    UserID CHAR(36),
    FOREIGN KEY (UserID) REFERENCES UserLogin(UserID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Agency (
    AgencyID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    AddressNo VARCHAR(20),
    Street VARCHAR(100),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Email VARCHAR(100),
    HomePhone VARCHAR(20),
    WorkPhone VARCHAR(20),
    MobilePhone VARCHAR(20),
    CompanyNo VARCHAR(50),
    BankType VARCHAR(50),
    BankName VARCHAR(100),
    SortCode VARCHAR(20),
    AccountNo VARCHAR(30),
    IBAN VARCHAR(34),
    AddressLine VARCHAR(255),
    Rate DECIMAL(10,2),
    Note TEXT,
    UserID CHAR(36),
    FOREIGN KEY (UserID) REFERENCES UserLogin(UserID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS AgencyStaff (
    AgencyStaffID INT AUTO_INCREMENT PRIMARY KEY,
    AgencyID INT,
    Title VARCHAR(20),
    FirstName VARCHAR(100),
    SureName VARCHAR(100),
    Occupation VARCHAR(100),
    Email VARCHAR(100),
    HomePhone VARCHAR(20),
    WorkPhone VARCHAR(20),
    MobilePhone VARCHAR(20),
    BrithDate DATE,
    Gender VARCHAR(10),
    RegisterDate DATE,
    AgancyCode VARCHAR(50),
    IsActive BOOLEAN DEFAULT TRUE,
    Note TEXT,
    UserID CHAR(36),
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES UserLogin(UserID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Service (
    ServiceID CHAR(36) NOT NULL PRIMARY KEY,
    CustomerID INT,
    AgencyID INT,
    AgencyStaffID INT,
    RefNo VARCHAR(100),
    Rate DECIMAL(10,2),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Beds INT DEFAULT 0,
    Kitchen INT DEFAULT 1,
    Bathroom INT DEFAULT 1,
    Pet BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE,
    Note TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE SET NULL,
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID) ON DELETE SET NULL,
    FOREIGN KEY (AgencyStaffID) REFERENCES AgencyStaff(AgencyStaffID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ServicePeriod (
    ServicePeriodID CHAR(36) NOT NULL PRIMARY KEY,
    ServiceID CHAR(36) NOT NULL,
    Period ENUM('daily', 'weekly', 'monthly', 'custom') DEFAULT 'weekly',
    WeekOfDay VARCHAR(20),
    MonthOfWeek VARCHAR(20),
    MonthOfDay INT,
    PreferredTime TIME,
    WorkingHours DECIMAL(5,2),
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ServiceOption (
    ServiceOptionID CHAR(36) NOT NULL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Fee DECIMAL(10,2) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ServiceRecord (
    ServiceRecordID CHAR(36) NOT NULL PRIMARY KEY,
    ServiceID CHAR(36),
    CustomerID INT,
    AgencyID INT,
    AgencyStaffID INT,
    RefNo VARCHAR(100),
    Rate DECIMAL(10,2),
    AddressLine VARCHAR(255),
    City VARCHAR(100),
    PostCode VARCHAR(20),
    Beds INT DEFAULT 0,
    Kitchen INT DEFAULT 1,
    Bathroom INT DEFAULT 1,
    Pet BOOLEAN DEFAULT FALSE,
    RecordDate DATE NOT NULL,
    WorkingTime INT,
    Note TEXT,
    Status ENUM('Created', 'In Cleaning', 'Cleaned', 'Invoice Sent', 'Paid', 'Canceled') DEFAULT 'Created',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON DELETE SET NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE SET NULL,
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID) ON DELETE SET NULL,
    FOREIGN KEY (AgencyStaffID) REFERENCES AgencyStaff(AgencyStaffID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ServiceRecordDetail (
    ServiceRecordDetailID CHAR(36) NOT NULL PRIMARY KEY,
    ServiceOptionID CHAR(36),
    ServiceRecordID CHAR(36) NOT NULL,
    Name VARCHAR(100),
    Fee DECIMAL(10,2),
    FOREIGN KEY (ServiceOptionID) REFERENCES ServiceOption(ServiceOptionID) ON DELETE SET NULL,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ServiceRecordCleaner (
    ServiceRecordCleanerID CHAR(36) NOT NULL PRIMARY KEY,
    ServiceRecordID CHAR(36) NOT NULL,
    CleanerID INT NOT NULL,
    StartDateTime DATETIME,
    WorkingTime INT,
    ClockInTime DATETIME,
    ClockOutTime DATETIME,
    Photos JSON,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID) ON DELETE CASCADE,
    FOREIGN KEY (CleanerID) REFERENCES Cleaner(CleanerID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Invoice (
    InvoiceID CHAR(36) NOT NULL PRIMARY KEY,
    ServiceRecordID CHAR(36),
    InvoiceNumber CHAR(12) UNIQUE,
    CustomerID INT,
    AgencyID INT,
    AgencyStaffID INT,
    PDFPath VARCHAR(255),
    Total DECIMAL(10,2),
    Status ENUM('Sent', 'Paid') DEFAULT 'Sent',
    SentDate DATETIME,
    PaidDate DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ServiceRecordID) REFERENCES ServiceRecord(ServiceRecordID) ON DELETE SET NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE SET NULL,
    FOREIGN KEY (AgencyID) REFERENCES Agency(AgencyID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS SystemSettings (
    SettingID INT AUTO_INCREMENT PRIMARY KEY,
    SettingKey VARCHAR(100) UNIQUE NOT NULL,
    SettingValue TEXT,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_service_record_date ON ServiceRecord(RecordDate);
CREATE INDEX idx_service_record_status ON ServiceRecord(Status);
CREATE INDEX idx_service_record_customer ON ServiceRecord(CustomerID);
CREATE INDEX idx_service_period_service ON ServicePeriod(ServiceID);
CREATE INDEX idx_service_record_cleaner_cleaner ON ServiceRecordCleaner(CleanerID);
CREATE INDEX idx_invoice_status ON Invoice(Status);
CREATE INDEX idx_userlogin_email ON UserLogin(Email);
CREATE INDEX idx_cleaner_isactive ON Cleaner(IsActive);
CREATE INDEX idx_customer_email ON Customer(Email);
