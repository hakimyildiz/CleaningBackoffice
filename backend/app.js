const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import Route Modules
const authRoutes = require('./modules/auth/auth.routes');
const employeeRoutes = require('./modules/employee/employee.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const agencyStaffRoutes = require('./modules/agencyStaff/agencyStaff.routes');
const userRoutes = require('./modules/user/user.routes');
const agencyRoutes = require('./modules/agency/agency.routes');
const serviceRoutes = require('./modules/service/service.routes');
const serviceScheduleRoutes = require('./modules/serviceSchedule/serviceSchedule.routes');
const servicePauseRoutes = require('./modules/servicePause/servicePause.routes');
const serviceOptionRoutes = require('./modules/serviceOption/serviceOption.routes');

// New Phase 4 route modules
const serviceRecordRoutes = require('./modules/serviceRecord/serviceRecord.routes');
const servicePhotoRoutes = require('./modules/servicePhoto/servicePhoto.routes');
const invoiceRoutes = require('./modules/invoice/invoice.routes');
const cleanerRoutes = require('./modules/cleaner/cleaner.routes');

// New Phase 5 route modules
const pdfRoutes = require('./modules/pdf/pdf.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const creditLedgerRoutes = require('./modules/creditLedger/creditLedger.routes');
const employeePaymentRoutes = require('./modules/employeePayment/employeePayment.routes');
const changeRequestRoutes = require('./modules/changeRequest/changeRequest.routes');

// New Phase 6 route modules
const customerPortalRoutes = require('./modules/customerPortal/customerPortal.routes');
const agencyPortalRoutes = require('./modules/agencyPortal/agencyPortal.routes');

const ServiceController = require('./modules/service/service.controller');
const db = require('./config/db');
const verifyToken = require('./middleware/auth');
const requireRole = require('./middleware/role');

// Initialize Cron Jobs
require('./jobs/missedJobCron');
require('./jobs/overdueInvoiceCron');

const app = express();

// Enable CORS with Credentials (for httpOnly Cookie exchange)
app.use(cors({
  origin: true, // Echo back origin to allow all origins with credentials
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes (Versioned at /api/v1/)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/agency-staff', agencyStaffRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/agencies', agencyRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1', serviceScheduleRoutes);
app.use('/api/v1', servicePauseRoutes);
app.use('/api/v1/service-options', serviceOptionRoutes);

// Phase 4 Operations Routes
app.use('/api/v1/service-records', serviceRecordRoutes);
app.use('/api/v1', servicePhotoRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/cleaner', cleanerRoutes);

// Phase 5 Finance & Admin Routes
app.use('/api/v1/invoices', pdfRoutes); // registers GET /:id/pdf under /invoices
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/credits', creditLedgerRoutes);
app.use('/api/v1/employee-payments', employeePaymentRoutes);
app.use('/api/v1/requests', changeRequestRoutes);

// Phase 6 Portal Routes
app.use('/api/v1/customer-portal', customerPortalRoutes);
app.use('/api/v1/agency-portal', agencyPortalRoutes);

// Live rate resolution helper route
app.get('/api/v1/rates/resolve', verifyToken, requireRole('admin', 'manager'), ServiceController.resolveLiveRate);

// Root Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Catch-all 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Exception Handler
app.use(errorHandler);

module.exports = app;
