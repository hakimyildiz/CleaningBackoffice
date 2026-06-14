const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  authToken = localStorage.getItem('token');
  return authToken;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, role: string) =>
    apiRequest<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiRequest<{ user: AuthUser }>('/auth/me'),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Cleaners API
export const cleanersApi = {
  getAll: (params?: { isActive?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.search) query.set('search', params.search);
    return apiRequest<Cleaner[]>(`/cleaners?${query}`);
  },

  getById: (id: number) =>
    apiRequest<Cleaner>(`/cleaners/${id}`),

  create: (data: Partial<Cleaner>) =>
    apiRequest<Cleaner>('/cleaners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Cleaner>) =>
    apiRequest<Cleaner>(`/cleaners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/cleaners/${id}`, { method: 'DELETE' }),

  toggleActive: (id: number) =>
    apiRequest<Cleaner>(`/cleaners/${id}/toggle-active`, { method: 'PATCH' }),
};

// Customers API
export const customersApi = {
  getAll: (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    return apiRequest<Customer[]>(`/customers?${query}`);
  },

  getById: (id: number) =>
    apiRequest<Customer>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Customer>) =>
    apiRequest<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/customers/${id}`, { method: 'DELETE' }),
};

// Agencies API
export const agenciesApi = {
  getAll: (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    return apiRequest<Agency[]>(`/agencies?${query}`);
  },

  getById: (id: number) =>
    apiRequest<Agency>(`/agencies/${id}`),

  create: (data: Partial<Agency>) =>
    apiRequest<Agency>('/agencies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Agency>) =>
    apiRequest<Agency>(`/agencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/agencies/${id}`, { method: 'DELETE' }),
};

// Services API
export const servicesApi = {
  getAll: (params?: { isActive?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.search) query.set('search', params.search);
    return apiRequest<Service[]>(`/services?${query}`);
  },

  getById: (id: string) =>
    apiRequest<Service & { periods: ServicePeriod[] }>(`/services/${id}`),

  create: (data: Partial<Service>) =>
    apiRequest<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Service>) =>
    apiRequest<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/services/${id}`, { method: 'DELETE' }),

  toggleActive: (id: string) =>
    apiRequest<Service>(`/services/${id}/toggle-active`, { method: 'PATCH' }),

  getOptions: () =>
    apiRequest<ServiceOption[]>('/services/options/all'),
};

// Service Records API
export const serviceRecordsApi = {
  getAll: (params?: { date?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);
    return apiRequest<ServiceRecord[]>(`/service-records?${query}`);
  },

  getById: (id: string) =>
    apiRequest<ServiceRecord & { cleaners: ServiceRecordCleaner[]; details: ServiceRecordDetail[] }>(`/service-records/${id}`),

  create: (data: Partial<ServiceRecord>) =>
    apiRequest<ServiceRecord>('/service-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ServiceRecord>) =>
    apiRequest<ServiceRecord>(`/service-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    apiRequest<ServiceRecord>(`/service-records/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  clockIn: (id: string, cleanerId: number) =>
    apiRequest<ServiceRecord>(`/service-records/${id}/clock-in`, {
      method: 'POST',
      body: JSON.stringify({ cleanerId }),
    }),

  clockOut: (id: string, cleanerId: number, workingTime: number, photos?: string[]) =>
    apiRequest<ServiceRecord>(`/service-records/${id}/clock-out`, {
      method: 'POST',
      body: JSON.stringify({ cleanerId, workingTime, photos }),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/service-records/${id}`, { method: 'DELETE' }),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return apiRequest<Invoice[]>(`/invoices?${query}`);
  },

  getById: (id: string) =>
    apiRequest<Invoice>(`/invoices/${id}`),

  create: (data: Partial<Invoice>) =>
    apiRequest<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  pay: (id: string) =>
    apiRequest<Invoice>(`/invoices/${id}/pay`, { method: 'PATCH' }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/invoices/${id}`, { method: 'DELETE' }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    apiRequest<DashboardStats>('/dashboard/stats'),

  getCalendar: (startDate: string, endDate: string) =>
    apiRequest<{ records: ServiceRecord[]; cleaners: ServiceRecordCleaner[] }>(
      `/dashboard/calendar?startDate=${startDate}&endDate=${endDate}`
    ),

  getCleanerSchedule: (cleanerId: number) =>
    apiRequest<ServiceRecord[]>(`/dashboard/cleaner-schedule/${cleanerId}`),
};

// Settings API
export const settingsApi = {
  getAll: () =>
    apiRequest<Record<string, string>>('/settings'),

  update: (key: string, value: string) =>
    apiRequest<SystemSetting>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  create: (key: string, value: string) =>
    apiRequest<SystemSetting>('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),
};

// Types
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  entityId?: number;
}

export type UserRole =
  | 'admin'
  | 'manager'
  | 'cleaner_manager'
  | 'cleaner'
  | 'customer'
  | 'agency_manager'
  | 'agency_bookkeeper'
  | 'agency_staff';

export type ServiceStatus = 'Created' | 'In Cleaning' | 'Cleaned' | 'Invoice Sent' | 'Paid' | 'Canceled';
export type InvoiceStatus = 'Sent' | 'Paid';

export interface Cleaner {
  CleanerID: number;
  Title: string | null;
  FirstName: string | null;
  SureName: string | null;
  Occupation: string | null;
  Email: string | null;
  HomePhone: string | null;
  WorkPhone: string | null;
  MobilePhone: string | null;
  BrithDate: string | null;
  Gender: string | null;
  RegisterDate: string | null;
  BankType: string | null;
  BankName: string | null;
  SortCode: string | null;
  AccountNo: string | null;
  IBAN: string | null;
  AddressLine: string | null;
  City: string | null;
  PostCode: string | null;
  NINo: string | null;
  IsActive: boolean;
  Rate: number | null;
  Note: string | null;
  UserID: string | null;
}

export interface Customer {
  CustomerID: number;
  Title: string | null;
  FirstName: string | null;
  SureName: string | null;
  Occupation: string | null;
  Email: string | null;
  HomePhone: string | null;
  WorkPhone: string | null;
  MobilePhone: string | null;
  BrithDate: string | null;
  Gender: string | null;
  RegisterDate: string | null;
  BankType: string | null;
  BankName: string | null;
  SortCode: string | null;
  AccountNo: string | null;
  IBAN: string | null;
  AddressLine: string | null;
  City: string | null;
  PostCode: string | null;
  Rate: number | null;
  Note: string | null;
  UserID: string | null;
}

export interface Agency {
  AgencyID: number;
  Name: string | null;
  AddressNo: string | null;
  Street: string | null;
  City: string | null;
  PostCode: string | null;
  Email: string | null;
  HomePhone: string | null;
  WorkPhone: string | null;
  MobilePhone: string | null;
  CompanyNo: string | null;
  BankType: string | null;
  BankName: string | null;
  SortCode: string | null;
  AccountNo: string | null;
  IBAN: string | null;
  AddressLine: string | null;
  Rate: number | null;
  Note: string | null;
  UserID: string | null;
}

export interface Service {
  ServiceID: string;
  CustomerID: number | null;
  AgencyID: number | null;
  AgencyStaffID: number | null;
  RefNo: string | null;
  Rate: number | null;
  AddressLine: string | null;
  City: string | null;
  PostCode: string | null;
  Beds: number;
  Kitchen: number;
  Bathroom: number;
  Pet: boolean;
  IsActive: boolean;
  Note: string | null;
  CreatedAt: string;
}

export interface ServicePeriod {
  ServicePeriodID: string;
  ServiceID: string;
  Period: string | null;
  WeekOfDay: string | null;
  MonthOfWeek: string | null;
  MonthOfDay: number | null;
  PreferredTime: string | null;
  WorkingHours: number | null;
  IsActive: boolean;
}

export interface ServiceOption {
  ServiceOptionID: string;
  Name: string;
  Fee: number;
  IsActive: boolean;
}

export interface ServiceRecord {
  ServiceRecordID: string;
  ServiceID: string | null;
  CustomerID: number | null;
  AgencyID: number | null;
  AgencyStaffID: number | null;
  RefNo: string | null;
  Rate: number | null;
  AddressLine: string | null;
  City: string | null;
  PostCode: string | null;
  Beds: number;
  Kitchen: number;
  Bathroom: number;
  Pet: boolean;
  RecordDate: string;
  WorkingTime: number | null;
  Note: string | null;
  Status: ServiceStatus;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ServiceRecordDetail {
  ServiceRecordDetailID: string;
  ServiceOptionID: string | null;
  ServiceRecordID: string;
  Name: string | null;
  Fee: number | null;
}

export interface ServiceRecordCleaner {
  ServiceRecordCleanerID: string;
  ServiceRecordID: string;
  CleanerID: number;
  StartDateTime: string | null;
  WorkingTime: number | null;
  ClockInTime: string | null;
  ClockOutTime: string | null;
  Photos: string[] | null;
  FirstName?: string;
  SureName?: string;
}

export interface Invoice {
  InvoiceID: string;
  ServiceRecordID: string | null;
  InvoiceNumber: string;
  CustomerID: number | null;
  AgencyID: number | null;
  AgencyStaffID: number | null;
  PDFPath: string | null;
  Total: number | null;
  Status: InvoiceStatus;
  SentDate: string | null;
  PaidDate: string | null;
  CreatedAt: string;
}

export interface SystemSetting {
  SettingID: number;
  SettingKey: string;
  SettingValue: string | null;
  UpdatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCleaners: number;
  todayJobs: number;
  completedToday: number;
  pendingInvoices: number;
  totalRevenue: number;
  upcomingJobs: ServiceRecord[];
}
