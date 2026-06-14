export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CLEANER_MANAGER: 'cleaner_manager',
  CLEANER: 'cleaner',
  CUSTOMER: 'customer',
  AGENCY_MANAGER: 'agency_manager',
  AGENCY_BOOKKEEPER: 'agency_bookkeeper',
  AGENCY_STAFF: 'agency_staff'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.CLEANER_MANAGER]: 'Cleaner Manager',
  [ROLES.CLEANER]: 'Cleaner',
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.AGENCY_MANAGER]: 'Agency Manager',
  [ROLES.AGENCY_BOOKKEEPER]: 'Agency Bookkeeper',
  [ROLES.AGENCY_STAFF]: 'Agency Staff'
};

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

export const SERVICE_RECORD_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  INVOICE_SENT: 'invoice_sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped'
};
