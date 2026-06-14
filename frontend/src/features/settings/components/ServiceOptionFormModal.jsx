import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';

export const ServiceOptionFormModal = ({
  isOpen = false,
  onClose,
  onSubmit,
  option = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    Name: '',
    IsChargeable: false,
    Fee: '0.00'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (option) {
        setFormData({
          Name: option.Name || '',
          IsChargeable: option.IsChargeable === 1 || option.IsChargeable === true,
          Fee: parseFloat(option.Fee || 0).toFixed(2)
        });
      } else {
        setFormData({
          Name: '',
          IsChargeable: false,
          Fee: '0.00'
        });
      }
      setErrors({});
    }
  }, [isOpen, option]);

  const handleFieldChange = (field, val) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'IsChargeable' && !val) {
        updated.Fee = '0.00';
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.Name.trim()) {
      tempErrors.Name = 'Name is required.';
    } else if (formData.Name.length > 100) {
      tempErrors.Name = 'Name cannot exceed 100 characters.';
    }

    if (formData.IsChargeable) {
      const feeNum = parseFloat(formData.Fee);
      if (isNaN(feeNum) || feeNum < 0) {
        tempErrors.Fee = 'Fee must be a valid positive number.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    
    try {
      await onSubmit({
        Name: formData.Name.trim(),
        IsChargeable: formData.IsChargeable,
        Fee: formData.IsChargeable ? parseFloat(formData.Fee) : 0.00
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={option ? 'Edit Service Option' : 'Add Service Option'}
      onConfirm={handleConfirm}
      confirmText={option ? 'Save Changes' : 'Add Option'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <FormField
          label="Option Name"
          required
          error={errors.Name}
          value={formData.Name}
          onChange={(e) => handleFieldChange('Name', e.target.value)}
          placeholder="e.g. Deep Oven Clean"
          disabled={isLoading}
        />

        <div className="flex items-center gap-2.5 py-1">
          <input
            type="checkbox"
            id="IsChargeable"
            checked={formData.IsChargeable}
            onChange={(e) => handleFieldChange('IsChargeable', e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded text-brand-accent border-slate-300 focus:ring-brand-accent cursor-pointer"
          />
          <label
            htmlFor="IsChargeable"
            className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
          >
            Is Chargeable (Fee Applies)
          </label>
        </div>

        {formData.IsChargeable && (
          <FormField
            label="Fee (£)"
            required
            type="number"
            step="0.01"
            min="0"
            error={errors.Fee}
            value={formData.Fee}
            onChange={(e) => handleFieldChange('Fee', e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
          />
        )}
      </div>
    </Modal>
  );
};

export default ServiceOptionFormModal;
