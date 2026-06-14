import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { customerService } from '../services/customerService';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import CustomerBankAccordion from '../components/CustomerBankAccordion';
import { useToast } from '../../../hooks/useToast';

const TITLE_OPTIONS = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' }
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    Title: 'Mr',
    FirstName: '',
    SureName: '',
    Occupation: '',
    Email: '',
    HomePhone: '',
    WorkPhone: '',
    MobilePhone: '',
    BirthDate: '',
    Gender: 'Prefer not to say',
    AddressLine: '',
    City: '',
    PostCode: '',
    Note: '',
    HourlyRate: '', // Custom Rate
    RegisterDate: new Date().toISOString().substring(0, 10), // Default today
    BankType: '',
    BankName: '',
    SortCode: '',
    AccountNo: '',
    IBAN: '',
    IsActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);

  // Sync edit data
  useEffect(() => {
    if (isEditMode) {
      const fetchCustomer = async () => {
        try {
          const result = await customerService.getCustomerById(id);
          const cust = result.data;

          const formatInputDate = (d) => {
            if (!d) return '';
            return new Date(d).toISOString().substring(0, 10);
          };

          setFormData({
            Title: cust.Title || 'Mr',
            FirstName: cust.FirstName || '',
            SureName: cust.SureName || '',
            Occupation: cust.Occupation || '',
            Email: cust.Email || '',
            HomePhone: cust.HomePhone || '',
            WorkPhone: cust.WorkPhone || '',
            MobilePhone: cust.MobilePhone || '',
            BirthDate: formatInputDate(cust.BirthDate),
            Gender: cust.Gender || 'Prefer not to say',
            AddressLine: cust.AddressLine || '',
            City: cust.City || '',
            PostCode: cust.PostCode || '',
            Note: cust.Note || '',
            HourlyRate: cust.Rate || '',
            RegisterDate: formatInputDate(cust.RegisterDate),
            BankType: cust.BankType || '',
            BankName: cust.BankName || '',
            SortCode: cust.SortCode || '',
            AccountNo: cust.AccountNo || '',
            IBAN: cust.IBAN || '',
            IsActive: cust.IsActive === 1 || cust.IsActive === true
          });
        } catch (err) {
          addToast(err.response?.data?.message || 'Failed to load customer details.', 'error');
          navigate('/customers');
        } finally {
          setFetching(false);
        }
      };
      fetchCustomer();
    }
  }, [id, isEditMode, navigate, addToast]);

  // Unsaved changes alert
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to navigate away?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleFieldChange = (field, val) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: val }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validation
  const validate = () => {
    const tempErrors = {};
    if (!formData.FirstName.trim()) tempErrors.FirstName = 'First name is required.';
    if (!formData.SureName.trim()) tempErrors.SureName = 'Surname is required.';
    if (!formData.Email.trim()) {
      tempErrors.Email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      tempErrors.Email = 'Please enter a valid email address.';
    }

    if (formData.HourlyRate && (isNaN(formData.HourlyRate) || parseFloat(formData.HourlyRate) < 0)) {
      tempErrors.HourlyRate = 'Hourly rate must be a valid positive number.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fix the validation errors before submitting.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await customerService.updateCustomer(id, formData);
        addToast('Customer updated successfully.', 'success');
      } else {
        const result = await customerService.createCustomer(formData);
        if (result.warning) {
          addToast(result.warning, 'info');
        } else {
          addToast(`Customer created. Welcome email sent to ${formData.Email}`, 'success');
        }
      }
      setIsDirty(false);
      navigate('/customers');
    } catch (err) {
      addToast(err.response?.data?.message || 'An error occurred while saving customer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div className="flex items-center gap-2">
        <Link
          to="/customers"
          onClick={(e) => {
            if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to go back?')) {
              e.preventDefault();
            }
          }}
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to list
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          {isEditMode ? 'Edit Customer' : 'Add Customer'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          {isEditMode ? `Update records for ${formData.FirstName} ${formData.SureName}` : 'Add a new cleaning service customer'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 1: Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Title" error={errors.Title}>
              <Select
                options={TITLE_OPTIONS}
                value={formData.Title}
                onChange={(e) => handleFieldChange('Title', e.target.value)}
                placeholder=""
              />
            </FormField>

            <FormField
              label="First Name"
              required
              error={errors.FirstName}
              value={formData.FirstName}
              onChange={(e) => handleFieldChange('FirstName', e.target.value)}
              placeholder="e.g. John"
            />

            <FormField
              label="Surname"
              required
              error={errors.SureName}
              value={formData.SureName}
              onChange={(e) => handleFieldChange('SureName', e.target.value)}
              placeholder="e.g. Smith"
            />

            <FormField
              label="Occupation"
              error={errors.Occupation}
              value={formData.Occupation}
              onChange={(e) => handleFieldChange('Occupation', e.target.value)}
              placeholder="e.g. Accountant"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Email Address"
                required
                type="email"
                error={errors.Email}
                value={formData.Email}
                onChange={(e) => handleFieldChange('Email', e.target.value)}
                placeholder="e.g. john.smith@example.com"
              />
            </div>

            <FormField
              label="Home Phone"
              error={errors.HomePhone}
              value={formData.HomePhone}
              onChange={(e) => handleFieldChange('HomePhone', e.target.value)}
              placeholder="e.g. 020 8765 4321"
            />

            <FormField
              label="Mobile Phone"
              error={errors.MobilePhone}
              value={formData.MobilePhone}
              onChange={(e) => handleFieldChange('MobilePhone', e.target.value)}
              placeholder="e.g. 07700 900001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Birth Date"
              type="date"
              error={errors.BirthDate}
              value={formData.BirthDate}
              onChange={(e) => handleFieldChange('BirthDate', e.target.value)}
            />

            <FormField label="Gender" error={errors.Gender}>
              <Select
                options={GENDER_OPTIONS}
                value={formData.Gender}
                onChange={(e) => handleFieldChange('Gender', e.target.value)}
                placeholder=""
              />
            </FormField>

            <FormField
              label="Work Phone"
              error={errors.WorkPhone}
              value={formData.WorkPhone}
              onChange={(e) => handleFieldChange('WorkPhone', e.target.value)}
              placeholder="e.g. 020 8765 4322"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Address Line"
                error={errors.AddressLine}
                value={formData.AddressLine}
                onChange={(e) => handleFieldChange('AddressLine', e.target.value)}
                placeholder="e.g. 12 Park Lane"
              />
            </div>
            <FormField
              label="City"
              error={errors.City}
              value={formData.City}
              onChange={(e) => handleFieldChange('City', e.target.value)}
              placeholder="e.g. London"
            />
            <FormField
              label="Post Code"
              error={errors.PostCode}
              value={formData.PostCode}
              onChange={(e) => handleFieldChange('PostCode', e.target.value)}
              placeholder="e.g. NW1 4PP"
            />
          </div>
        </div>

        {/* Section 2: Account Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 2: Account Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Custom Rate (£/hr)"
              error={errors.HourlyRate}
              value={formData.HourlyRate}
              onChange={(e) => handleFieldChange('HourlyRate', e.target.value)}
              placeholder="Leave empty to use default rate"
            />

            <FormField
              label="Register Date"
              type="date"
              error={errors.RegisterDate}
              value={formData.RegisterDate}
              onChange={(e) => handleFieldChange('RegisterDate', e.target.value)}
            />
          </div>

          {isEditMode && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="IsActive"
                checked={formData.IsActive}
                onChange={(e) => handleFieldChange('IsActive', e.target.checked)}
                className="w-4 h-4 rounded text-brand-accent border-slate-300 focus:ring-brand-accent cursor-pointer"
              />
              <label htmlFor="IsActive" className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none">
                Active Customer (Status)
              </label>
            </div>
          )}

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note</label>
            <textarea
              value={formData.Note}
              onChange={(e) => handleFieldChange('Note', e.target.value)}
              placeholder="Add customer notes, instructions, or gate codes here..."
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent transition-all duration-150 shadow-sm"
            />
          </div>
        </div>

        {/* Section 3: Bank Details */}
        <CustomerBankAccordion
          formData={formData}
          errors={errors}
          onChange={handleFieldChange}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => navigate('/customers')}
            className="px-6 font-bold text-slate-700 bg-white"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-6 font-bold flex items-center gap-1.5 shadow-sm"
            isLoading={loading}
          >
            <span>{isEditMode ? 'Save Changes' : 'Create Customer'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;
