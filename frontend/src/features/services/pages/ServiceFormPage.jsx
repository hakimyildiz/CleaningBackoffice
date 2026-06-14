import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save, ShieldAlert } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { customerService } from '../../customers/services/customerService';
import { agencyService } from '../../agencies/services/agencyService';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import OneOffFields from '../components/OneOffFields';
import RegularFields from '../components/RegularFields';
import ServiceOptionSelector from '../components/ServiceOptionSelector';
import { useToast } from '../../../hooks/useToast';
import { formatGBP } from '../../../utils/formatters';

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'other', label: 'Other' }
];

export const ServiceFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    OwnerType: 'customer', // 'customer' | 'agency'
    CustomerID: '',
    AgencyID: '',
    AgencyStaffID: '',
    Type: 'one_off', // 'one_off' | 'regular'
    
    // One-Off fields
    ScheduledDate: '',
    
    // Regular fields
    Frequency: 'weekly',
    DayOfWeek: 'Mon',
    DayOfMonth: '',
    StartDate: new Date().toISOString().substring(0, 10),
    
    // Shared schedule
    StartTime: '09:00',
    EstimatedHours: '2.0',

    // Property Details
    RefNo: '',
    PropertyType: 'house',
    AddressLine: '',
    City: '',
    PostCode: '',
    Beds: '',
    Bathrooms: '',
    Kitchens: '',
    HasPet: false,
    
    // Rate Override
    Rate: '',
    Note: '',
    
    // Options lists
    ServiceOptions: [],
    CustomOptions: []
  });

  // Dropdown list data
  const [customers, setCustomers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [staff, setStaff] = useState([]);

  // Rate resolution preview
  const [ratePreview, setRatePreview] = useState({ rate: 0, source: 'default' });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);
  
  // Schedule confirmation dialog
  const [isConfirmRegenOpen, setIsConfirmRegenOpen] = useState(false);
  const [scheduledCountToCancel, setScheduledCountToCancel] = useState(0);

  // Load dropdowns on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const custResult = await customerService.getCustomers({ isActive: true, limit: 1000 });
        setCustomers(custResult.data || []);

        const agResult = await agencyService.getAgencies({ isActive: true, limit: 1000 });
        setAgencies(agResult.data || []);
      } catch (err) {
        console.error('Failed to load dropdown records:', err.message);
      }
    };
    loadDropdownData();
  }, []);

  // Fetch agency staff when AgencyID changes
  useEffect(() => {
    if (formData.AgencyID) {
      const loadStaff = async () => {
        try {
          const result = await agencyService.getAgencyStaff(formData.AgencyID);
          setStaff(result.data || []);
        } catch (err) {
          console.error('Failed to load agency staff:', err.message);
        }
      };
      loadStaff();
    } else {
      setStaff([]);
    }
  }, [formData.AgencyID]);

  // Sync edit mode data
  useEffect(() => {
    if (isEditMode) {
      const fetchService = async () => {
        try {
          const result = await serviceService.getServiceById(id);
          const svc = result.data;
          const rule = svc.scheduleRule || {};

          const formatInputDate = (d) => d ? new Date(d).toISOString().substring(0, 10) : '';

          setFormData({
            OwnerType: svc.CustomerID ? 'customer' : 'agency',
            CustomerID: svc.CustomerID || '',
            AgencyID: svc.AgencyID || '',
            AgencyStaffID: svc.AgencyStaffID || '',
            Type: svc.Type || 'one_off',
            ScheduledDate: svc.Type === 'one_off' && rule.StartDate ? formatInputDate(rule.StartDate) : '',
            Frequency: rule.Frequency || 'weekly',
            DayOfWeek: rule.DayOfWeek || 'Mon',
            DayOfMonth: rule.DayOfMonth || '',
            StartDate: rule.StartDate ? formatInputDate(rule.StartDate) : formatInputDate(svc.StartDate),
            StartTime: rule.StartTime ? rule.StartTime.substring(0, 5) : '09:00',
            EstimatedHours: rule.EstimatedHours || '2.0',
            RefNo: svc.RefNo || '',
            PropertyType: svc.PropertyType || 'house',
            AddressLine: svc.AddressLine || '',
            City: svc.City || '',
            PostCode: svc.PostCode || '',
            Beds: svc.Beds || '',
            Bathrooms: svc.Bathrooms || '',
            Kitchens: svc.Kitchens || '',
            HasPet: svc.HasPet === 1 || svc.HasPet === true,
            Rate: svc.Rate || '',
            Note: svc.Note || '',
            // Options checklists (stored temporarily on frontend state for Phase 3)
            ServiceOptions: svc.ServiceOptions || [],
            CustomOptions: svc.CustomOptions || []
          });

          // Fetch upcoming count for regeneration warning
          const schedResult = await serviceService.getServiceSchedule(id);
          const upcomingSchedCount = (schedResult.data || []).filter(
            (o) => o.Status === 'scheduled' && new Date(o.ScheduledDate) >= new Date()
          ).length;
          setScheduledCountToCancel(upcomingSchedCount);

        } catch (err) {
          addToast('Failed to load service details.', 'error');
          navigate('/services');
        } finally {
          setFetching(false);
        }
      };
      fetchService();
    }
  }, [id, isEditMode, navigate, addToast]);

  // Live dynamic rate resolution preview lookup
  useEffect(() => {
    const resolveRate = async () => {
      // If user provided a rate override on form, it will be the effective rate
      if (formData.Rate && !isNaN(formData.Rate) && parseFloat(formData.Rate) > 0) {
        setRatePreview({
          rate: parseFloat(formData.Rate),
          source: 'service'
        });
        return;
      }

      // Else fetch resolved lookup from API
      try {
        const params = {};
        if (formData.OwnerType === 'customer' && formData.CustomerID) {
          params.customerId = formData.CustomerID;
        } else if (formData.OwnerType === 'agency' && formData.AgencyID) {
          params.agencyId = formData.AgencyID;
        }

        const result = await serviceService.resolveEffectiveRate(params);
        if (result.success) {
          setRatePreview({
            rate: result.data.EffectiveRate,
            source: result.data.Source
          });
        }
      } catch (err) {
        console.error('Failed to resolve dynamic rate preview:', err.message);
      }
    };
    resolveRate();
  }, [formData.OwnerType, formData.CustomerID, formData.AgencyID, formData.Rate]);

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
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'OwnerType') {
        updated.CustomerID = '';
        updated.AgencyID = '';
        updated.AgencyStaffID = '';
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (formData.OwnerType === 'customer' && !formData.CustomerID) {
      tempErrors.CustomerID = 'Customer selection is required.';
    }
    if (formData.OwnerType === 'agency' && !formData.AgencyID) {
      tempErrors.AgencyID = 'Agency selection is required.';
    }

    if (!formData.PropertyType) {
      tempErrors.PropertyType = 'Property type is required.';
    }
    if (!formData.AddressLine.trim()) {
      tempErrors.AddressLine = 'Address line is required.';
    }
    if (!formData.City.trim()) {
      tempErrors.City = 'City is required.';
    }
    if (!formData.PostCode.trim()) {
      tempErrors.PostCode = 'Post code is required.';
    }

    if (formData.Type === 'one_off') {
      if (!formData.ScheduledDate) {
        tempErrors.ScheduledDate = 'Service date is required.';
      }
    } else {
      if (formData.Frequency === 'weekly' || formData.Frequency === 'fortnightly') {
        if (!formData.DayOfWeek) {
          tempErrors.DayOfWeek = 'Day of week is required.';
        }
      }
      if (formData.Frequency === 'monthly') {
        const dom = parseInt(formData.DayOfMonth, 10);
        if (isNaN(dom) || dom < 1 || dom > 31) {
          tempErrors.DayOfMonth = 'Day of month must be between 1 and 31.';
        }
      }
      if (!formData.StartDate) {
        tempErrors.StartDate = 'Schedule start date is required.';
      }
    }

    if (formData.Rate && (isNaN(formData.Rate) || parseFloat(formData.Rate) < 0)) {
      tempErrors.Rate = 'Custom rate must be a valid positive number.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      if (isEditMode) {
        const result = await serviceService.updateService(id, formData);
        addToast(result.message || 'Service updated successfully.', 'success');
      } else {
        const result = await serviceService.createService(formData);
        addToast(result.message || 'Service created successfully.', 'success');
      }
      setIsDirty(false);
      navigate('/services');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      addToast(err.response?.data?.message || 'Failed to save service records.', 'error');
    } finally {
      setLoading(false);
      setIsConfirmRegenOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fix the validation errors before saving.', 'error');
      return;
    }

    // Edit Mode Schedule Regeneration Check
    if (isEditMode && formData.Type === 'regular') {
      // Check if schedule fields have changed compared to original edit details
      // If yes, prompt before saving
      setIsConfirmRegenOpen(true);
    } else {
      executeSave();
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.CustomerID.toString(),
    label: `${c.FirstName} ${c.SureName} (${c.Email})`
  }));

  const agencyOptions = agencies.map((a) => ({
    value: a.AgencyID.toString(),
    label: a.Name
  }));

  const staffOptions = staff.map((s) => ({
    value: s.AgencyStaffID.toString(),
    label: `${s.FirstName} ${s.SureName} — ${s.Role.replace('_', ' ')}`
  }));

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          to="/services"
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
          {isEditMode ? 'Edit Service' : 'Add Service'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          {isEditMode ? 'Update service configurations and details' : 'Configure a new cleaning service contract'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Service Owner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 1: Service Owner
          </h3>

          <div className="flex items-center gap-6 py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Owner Type:</span>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="OwnerType"
                  value="customer"
                  checked={formData.OwnerType === 'customer'}
                  onChange={() => handleFieldChange('OwnerType', 'customer')}
                  disabled={isEditMode}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                Customer
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="OwnerType"
                  value="agency"
                  checked={formData.OwnerType === 'agency'}
                  onChange={() => handleFieldChange('OwnerType', 'agency')}
                  disabled={isEditMode}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                Agency
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {formData.OwnerType === 'customer' ? (
              <FormField label="Customer Name" required error={errors.CustomerID}>
                <Select
                  options={customerOptions}
                  value={formData.CustomerID}
                  onChange={(e) => handleFieldChange('CustomerID', e.target.value)}
                  placeholder="Select Customer"
                  disabled={isEditMode}
                />
              </FormField>
            ) : (
              <>
                <FormField label="Agency Name" required error={errors.AgencyID}>
                  <Select
                    options={agencyOptions}
                    value={formData.AgencyID}
                    onChange={(e) => handleFieldChange('AgencyID', e.target.value)}
                    placeholder="Select Agency"
                    disabled={isEditMode}
                  />
                </FormField>

                <FormField label="Assigned Agency Staff" error={errors.AgencyStaffID}>
                  <Select
                    options={staffOptions}
                    value={formData.AgencyStaffID}
                    onChange={(e) => handleFieldChange('AgencyStaffID', e.target.value)}
                    placeholder="None (Unassigned)"
                    disabled={!formData.AgencyID}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Service Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 2: Service Type
          </h3>

          <div className="flex items-center gap-6 py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Type:</span>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="Type"
                  value="one_off"
                  checked={formData.Type === 'one_off'}
                  onChange={() => handleFieldChange('Type', 'one_off')}
                  disabled={isEditMode}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                One-Off (Single appointment)
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="Type"
                  value="regular"
                  checked={formData.Type === 'regular'}
                  onChange={() => handleFieldChange('Type', 'regular')}
                  disabled={isEditMode}
                  className="w-4 h-4 text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                Regular (Recurring appointments)
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule fields */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 3: Scheduling Information
          </h3>

          {formData.Type === 'one_off' ? (
            <OneOffFields
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
            />
          ) : (
            <RegularFields
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}
        </div>

        {/* Section 4: Property details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 4: Property Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Service Reference (Ref No)"
              error={errors.RefNo}
              value={formData.RefNo}
              onChange={(e) => handleFieldChange('RefNo', e.target.value)}
              placeholder="e.g. MS-987"
            />

            <FormField label="Property Type" required error={errors.PropertyType}>
              <Select
                options={PROPERTY_TYPES}
                value={formData.PropertyType}
                onChange={(e) => handleFieldChange('PropertyType', e.target.value)}
                placeholder=""
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Address Line"
                required
                error={errors.AddressLine}
                value={formData.AddressLine}
                onChange={(e) => handleFieldChange('AddressLine', e.target.value)}
                placeholder="e.g. 78 Regent Street"
              />
            </div>
            <FormField
              label="City"
              required
              error={errors.City}
              value={formData.City}
              onChange={(e) => handleFieldChange('City', e.target.value)}
              placeholder="e.g. London"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Post Code"
                required
                error={errors.PostCode}
                value={formData.PostCode}
                onChange={(e) => handleFieldChange('PostCode', e.target.value)}
                placeholder="e.g. W1B 5TR"
              />
            </div>
            <FormField
              label="Beds"
              type="number"
              error={errors.Beds}
              value={formData.Beds}
              onChange={(e) => handleFieldChange('Beds', e.target.value)}
              placeholder="0"
            />
            <FormField
              label="Baths"
              type="number"
              error={errors.Bathrooms}
              value={formData.Bathrooms}
              onChange={(e) => handleFieldChange('Bathrooms', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <FormField
              label="Kitchens"
              type="number"
              error={errors.Kitchens}
              value={formData.Kitchens}
              onChange={(e) => handleFieldChange('Kitchens', e.target.value)}
              placeholder="0"
            />

            <div className="flex items-center gap-2.5 mt-6">
              <input
                type="checkbox"
                id="HasPet"
                checked={formData.HasPet}
                onChange={(e) => handleFieldChange('HasPet', e.target.checked)}
                className="w-4 h-4 rounded text-brand-accent border-slate-300 focus:ring-brand-accent cursor-pointer"
              />
              <label
                htmlFor="HasPet"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
              >
                Property Has Pets
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Pricing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 5: Pricing & Rates
          </h3>

          <div className="max-w-md space-y-2">
            <FormField
              label="Custom Service Rate (£/hr)"
              type="number"
              step="0.01"
              min="0"
              error={errors.Rate}
              value={formData.Rate}
              onChange={(e) => handleFieldChange('Rate', e.target.value)}
              placeholder="Leave empty to use Owner or Default rate"
            />

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-semibold text-slate-600">
              <span className="text-[10px] uppercase font-bold text-slate-400">Preview:</span>
              <span>
                Effective rate is <strong className="text-slate-800">{formatGBP(ratePreview.rate)}</strong> (source: <strong className="text-brand-accent">{ratePreview.source}</strong>)
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: Service Options */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 6: Add-on Options
          </h3>

          <ServiceOptionSelector
            selectedOptionIds={formData.ServiceOptions}
            customOptions={formData.CustomOptions}
            onChange={handleFieldChange}
          />
        </div>

        {/* Section 7: Notes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Section 7: Notes
          </h3>

          <div className="flex flex-col gap-1.5 w-full">
            <textarea
              value={formData.Note}
              onChange={(e) => handleFieldChange('Note', e.target.value)}
              placeholder="Add additional service notes or client requests..."
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent transition-all duration-150 shadow-sm"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => navigate('/services')}
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
            <span>{isEditMode ? 'Save Changes' : 'Create Service'}</span>
          </Button>
        </div>
      </form>

      {/* Regeneration Confirmation Dialog Modal */}
      <Modal
        isOpen={isConfirmRegenOpen}
        onClose={() => setIsConfirmRegenOpen(false)}
        title="Regenerate Service Appointments"
        onConfirm={executeSave}
        confirmText="Confirm & Regenerate"
        confirmVariant="danger"
        isLoading={loading}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-red-650 bg-red-50 border border-red-100 p-3.5 rounded-xl">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <strong>Warning:</strong> Modifying the recurring schedule rules will cancel and overwrite all upcoming appointments!
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Changing the schedule will cancel <strong>{scheduledCountToCancel}</strong> future appointments and regenerate them starting from tomorrow.
          </p>
          <p className="text-xs text-slate-400 font-semibold leading-normal">
            Are you sure you want to continue?
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ServiceFormPage;
