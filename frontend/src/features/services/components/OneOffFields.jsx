import React from 'react';
import FormField from '../../../components/common/FormField';

export const OneOffFields = ({ formData, errors, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField
        label="Service Date"
        required
        type="date"
        error={errors.ScheduledDate}
        value={formData.ScheduledDate || ''}
        onChange={(e) => onChange('ScheduledDate', e.target.value)}
      />

      <FormField
        label="Start Time"
        type="time"
        error={errors.StartTime}
        value={formData.StartTime || '09:00'}
        onChange={(e) => onChange('StartTime', e.target.value)}
      />

      <FormField
        label="Estimated Hours"
        type="number"
        step="0.5"
        min="0.5"
        error={errors.EstimatedHours}
        value={formData.EstimatedHours || '2.0'}
        onChange={(e) => onChange('EstimatedHours', e.target.value)}
        placeholder="2.0"
      />
    </div>
  );
};

export default OneOffFields;
