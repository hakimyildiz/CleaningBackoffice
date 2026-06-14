import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { agencyStaffService } from '../services/agencyStaffService';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { ROLES } from '../../../utils/constants';

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

const ROLE_OPTIONS = [
  { value: ROLES.AGENCY_MANAGER, label: 'Agency Manager' },
  { value: ROLES.AGENCY_BOOKKEEPER, label: 'Agency Bookkeeper' },
  { value: ROLES.AGENCY_STAFF, label: 'Agency Staff' }
];

export const AgencyStaffFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    Title: 'Mr',
    FirstName: '',
    SureName: '',
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
    AgencyID: '',
    RegisterDate: new Date().toISOString().substring(0, 10),
    AgencyCode: '',
    Role: ROLES.AGENCY_STAFF,
    IsActive: true
  });

  const [agencies, setAgencies] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch Agencies & Edit Data
  useEffect(() => {
    const initPage = async () => {
      try {
        // Load agencies first
        const agResult = await agencyStaffService.getAgencies();
        setAgencies(agResult.data || []);

        if (isEditMode) {
          const staffResult = await agencyStaffService.getAgencyStaffById(id);
          const staff = staffResult.data;

          const formatInputDate = (d) => {
            if (!d) return '';
            return new Date(d).toISOString().substring(0, 10);
          };

          setFormData({
            Title: staff.Title || 'Mr',
            FirstName: staff.FirstName || '',
            SureName: staff.SureName || '',
            Email: staff.Email || '',
            HomePhone: staff.HomePhone || '',
            WorkPhone: staff.WorkPhone || '',
            MobilePhone: staff.MobilePhone || '',
            BirthDate: formatInputDate(staff.BirthDate),
            Gender: staff.Gender || 'Prefer not to say',
            AddressLine: staff.AddressLine || '',
            City: staff.City || '',
            PostCode: staff.PostCode || '',
            Note: staff.StaffNote || '',
            AgencyID: staff.AgencyID || '',
            RegisterDate: formatInputDate(staff.RegisterDate),
            AgencyCode: staff.AgencyCode || '',
            Role: staff.Role || ROLES.AGENCY_STAFF,
            IsActive: staff.IsActive === 1 || staff.IsActive === true
          });
        }
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to initialize form data.', 'error');
        navigate('/agency-staff');
      } finally {
        setFetching(false);
      }
    };
    initPage();
  }, [id, isEditMode, navigate, addToast]);

  // Unsaved changes warning
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
    if (!formData.AgencyID) tempErrors.AgencyID = 'Agency selection is required.';
    if (!formData.Role) tempErrors.Role = 'Role selection is required.';

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
        await agencyStaffService.updateAgencyStaff(id, formData);
        addToast('Agency staff updated successfully.', 'success');
      } else {
        const result = await agencyStaffService.createAgencyStaff(formData);
        if (result.warning) {
          addToast(result.warning, 'info');
        } else {
          addToast(`Agency staff created. Welcome email sent to ${formData.Email}`, 'success');
        }
      }
      setIsDirty(false);
      navigate('/agency-staff');
    } catch (err) {
      addToast(err.response?.data?.message || 'An error occurred while saving staff details.', 'error');
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

  const agencyDropdownOptions = agencies.map((a) => ({
    value: a.AgencyID.toString(),
    label: a.Name
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div className="flex items-center gap-2">
        <Link
          to="/agency-staff"
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
          {isEditMode ? 'Edit Agency Staff' : 'Add Agency Staff'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          {isEditMode ? `Update records for ${formData.FirstName} ${formData.SureName}` : 'Add a coordinator or bookkeeper linked to an agency'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 1: Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder="e.g. Sarah"
            />

            <FormField
              label="Surname"
              required
              error={errors.SureName}
              value={formData.SureName}
              onChange={(e) => handleFieldChange('SureName', e.target.value)}
              placeholder="e.g. Jenkins"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Email Address"
              required
              type="email"
              error={errors.Email}
              value={formData.Email}
              onChange={(e) => handleFieldChange('Email', e.target.value)}
              placeholder="e.g. sarah.jenkins@example.com"
            />

            <FormField
              label="Home Phone"
              error={errors.HomePhone}
              value={formData.HomePhone}
              onChange={(e) => handleFieldChange('HomePhone', e.target.value)}
              placeholder="e.g. 020 7654 3210"
            />

            <FormField
              label="Mobile Phone"
              error={errors.MobilePhone}
              value={formData.MobilePhone}
              onChange={(e) => handleFieldChange('MobilePhone', e.target.value)}
              placeholder="e.g. 07700 900002"
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
              placeholder="e.g. 020 7654 3211"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Address Line"
                error={errors.AddressLine}
                value={formData.AddressLine}
                onChange={(e) => handleFieldChange('AddressLine', e.target.value)}
                placeholder="e.g. 88 Queen Road"
              />
            </div>
            <FormField
              label="City"
              error={errors.City}
              value={formData.City}
              onChange={(e) => handleFieldChange('City', e.target.value)}
              placeholder="e.g. Manchester"
            />
            <FormField
              label="Post Code"
              error={errors.PostCode}
              value={formData.PostCode}
              onChange={(e) => handleFieldChange('PostCode', e.target.value)}
              placeholder="e.g. M1 4AA"
            />
          </div>
        </div>

        {/* Section 2: Agency Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 2: Agency Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Agency" required error={errors.AgencyID}>
              <Select
                options={agencyDropdownOptions}
                value={formData.AgencyID}
                onChange={(e) => handleFieldChange('AgencyID', e.target.value)}
                placeholder="Select an agency"
              />
            </FormField>

            <FormField label="Role" required error={errors.Role}>
              <Select
                options={ROLE_OPTIONS}
                value={formData.Role}
                onChange={(e) => handleFieldChange('Role', e.target.value)}
                placeholder=""
              />
            </FormField>

            <FormField
              label="Agency Code"
              error={errors.AgencyCode}
              value={formData.AgencyCode}
              onChange={(e) => handleFieldChange('AgencyCode', e.target.value)}
              placeholder="e.g. AC-99"
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
                Active Staff Status
              </label>
            </div>
          )}

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note</label>
            <textarea
              value={formData.Note}
              onChange={(e) => handleFieldChange('Note', e.target.value)}
              placeholder="Add agency staff notes here..."
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent transition-all duration-150 shadow-sm"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => navigate('/agency-staff')}
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
            <span>{isEditMode ? 'Save Changes' : 'Create Agency Staff'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgencyStaffFormPage;
