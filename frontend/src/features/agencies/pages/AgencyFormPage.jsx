import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { agencyService } from '../services/agencyService';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Accordion from '../../../components/common/Accordion';
import AgencyPrimaryContactSelect from '../components/AgencyPrimaryContactSelect';
import { useToast } from '../../../hooks/useToast';

export const AgencyFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    Name: '',
    CompanyNo: '',
    Email: '',
    Phone: '',
    AddressLine: '',
    City: '',
    PostCode: '',
    Rate: '',
    Note: '',
    PrimaryContactUserID: '',
    BankType: '',
    BankName: '',
    SortCode: '',
    AccountNo: '',
    IBAN: '',
    IsActive: true
  });

  const [staff, setStaff] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);

  // Load staff list & agency details if edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchAgencyAndStaff = async () => {
        try {
          // Fetch agency details
          const detailsResult = await agencyService.getAgencyById(id);
          const agency = detailsResult.data;

          setFormData({
            Name: agency.Name || '',
            CompanyNo: agency.CompanyNo || '',
            Email: agency.Email || '',
            Phone: agency.Phone || '',
            AddressLine: agency.AddressLine || '',
            City: agency.City || '',
            PostCode: agency.PostCode || '',
            Rate: agency.Rate || '',
            Note: agency.Note || '',
            PrimaryContactUserID: agency.PrimaryContactUserID || '',
            BankType: agency.BankType || '',
            BankName: agency.BankName || '',
            SortCode: agency.SortCode || '',
            AccountNo: agency.AccountNo || '',
            IBAN: agency.IBAN || '',
            IsActive: agency.IsActive === 1 || agency.IsActive === true
          });

          // Fetch agency staff list
          const staffResult = await agencyService.getAgencyStaff(id);
          setStaff(staffResult.data || []);
        } catch (err) {
          addToast(err.response?.data?.message || 'Failed to load agency details.', 'error');
          navigate('/agencies');
        } finally {
          setFetching(false);
        }
      };
      fetchAgencyAndStaff();
    }
  }, [id, isEditMode, navigate, addToast]);

  // Unsaved changes confirmation dialog
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

  const validate = () => {
    const tempErrors = {};
    if (!formData.Name.trim()) {
      tempErrors.Name = 'Agency name is required.';
    } else if (formData.Name.length > 100) {
      tempErrors.Name = 'Agency name cannot exceed 100 characters.';
    }

    if (formData.Email && formData.Email.trim()) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(formData.Email)) {
        tempErrors.Email = 'Please provide a valid email format.';
      }
    }

    if (formData.CompanyNo && formData.CompanyNo.length > 50) {
      tempErrors.CompanyNo = 'Company number cannot exceed 50 characters.';
    }

    if (formData.Rate && (isNaN(formData.Rate) || parseFloat(formData.Rate) < 0)) {
      tempErrors.Rate = 'Custom rate must be a valid positive number.';
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
        await agencyService.updateAgency(id, formData);
        addToast('Agency updated successfully.', 'success');
      } else {
        await agencyService.createAgency(formData);
        addToast('Agency created successfully.', 'success');
      }
      setIsDirty(false);
      navigate('/agencies');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      addToast(err.response?.data?.message || 'An error occurred while saving agency details.', 'error');
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Link
          to="/agencies"
          onClick={(e) => {
            if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to go back?')) {
              e.preventDefault();
            }
          }}
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to list
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          {isEditMode ? 'Edit Agency' : 'Add Agency'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          {isEditMode ? `Update details for ${formData.Name}` : 'Add a new agency partner account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Agency details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 1: Agency Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Agency Name"
              required
              error={errors.Name}
              value={formData.Name}
              onChange={(e) => handleFieldChange('Name', e.target.value)}
              placeholder="e.g. Apex Cleaning Services"
            />
            <FormField
              label="Company Number"
              error={errors.CompanyNo}
              value={formData.CompanyNo}
              onChange={(e) => handleFieldChange('CompanyNo', e.target.value)}
              placeholder="e.g. 12345678"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Email Address"
              type="email"
              error={errors.Email}
              value={formData.Email}
              onChange={(e) => handleFieldChange('Email', e.target.value)}
              placeholder="e.g. info@apexcleaning.co.uk"
            />
            <FormField
              label="Phone Number"
              error={errors.Phone}
              value={formData.Phone}
              onChange={(e) => handleFieldChange('Phone', e.target.value)}
              placeholder="e.g. 020 1234 5678"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Address Line"
                error={errors.AddressLine}
                value={formData.AddressLine}
                onChange={(e) => handleFieldChange('AddressLine', e.target.value)}
                placeholder="e.g. 123 London Road"
              />
            </div>
            <FormField
              label="City"
              error={errors.City}
              value={formData.City}
              onChange={(e) => handleFieldChange('City', e.target.value)}
              placeholder="e.g. London"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Post Code"
              error={errors.PostCode}
              value={formData.PostCode}
              onChange={(e) => handleFieldChange('PostCode', e.target.value)}
              placeholder="e.g. EC1A 1AA"
            />
            <FormField
              label="Custom Service Rate (£)"
              type="number"
              step="0.01"
              min="0"
              error={errors.Rate}
              value={formData.Rate}
              onChange={(e) => handleFieldChange('Rate', e.target.value)}
              placeholder="Leave empty to use Default System Rate"
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
              <label htmlFor="IsActive" className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                Active Agency Partner (Status)
              </label>
            </div>
          )}

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
            <textarea
              value={formData.Note}
              onChange={(e) => handleFieldChange('Note', e.target.value)}
              placeholder="Add agency notes here..."
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent transition-all duration-150 shadow-sm"
            />
          </div>
        </div>

        {/* Section 2: Bank Details Accordion */}
        <Accordion title="Section 2: Bank Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Bank Type"
              error={errors.BankType}
              value={formData.BankType}
              onChange={(e) => handleFieldChange('BankType', e.target.value)}
              placeholder="e.g. Business Account"
            />
            <FormField
              label="Bank Name"
              error={errors.BankName}
              value={formData.BankName}
              onChange={(e) => handleFieldChange('BankName', e.target.value)}
              placeholder="e.g. Barclays"
            />
            <FormField
              label="Sort Code"
              error={errors.SortCode}
              value={formData.SortCode}
              onChange={(e) => handleFieldChange('SortCode', e.target.value)}
              placeholder="e.g. 20-30-40"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Account Number"
              error={errors.AccountNo}
              value={formData.AccountNo}
              onChange={(e) => handleFieldChange('AccountNo', e.target.value)}
              placeholder="e.g. 12345678"
            />
            <FormField
              label="IBAN"
              error={errors.IBAN}
              value={formData.IBAN}
              onChange={(e) => handleFieldChange('IBAN', e.target.value)}
              placeholder="e.g. GB89 BARC 2030 4012 3456 78"
            />
          </div>
        </Accordion>

        {/* Section 3: Primary Contact */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 3: Primary Contact
          </h3>

          {isEditMode ? (
            <div className="max-w-md">
              <AgencyPrimaryContactSelect
                staff={staff}
                value={formData.PrimaryContactUserID}
                onChange={(e) => handleFieldChange('PrimaryContactUserID', e.target.value)}
                error={errors.PrimaryContactUserID}
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-slate-400 font-semibold leading-relaxed">
                Primary contact must be an existing staff member of this agency. You can add staff members on the Agency Staff page.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-250 flex items-start gap-2.5">
              <span className="text-brand-primary">ℹ️</span>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                You can assign a Primary Contact after creating this Agency and adding Agency Staff members.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => navigate('/agencies')}
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
            <Save className="w-4 h-4" />
            <span>{isEditMode ? 'Save Changes' : 'Create Agency'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgencyFormPage;
