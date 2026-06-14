import React from 'react';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';

const FREQ_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' }
];

const DOW_OPTIONS = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' }
];

export const RegularFields = ({ formData, errors, onChange }) => {
  const isMonthly = formData.Frequency === 'monthly';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Frequency" required error={errors.Frequency}>
          <Select
            options={FREQ_OPTIONS}
            value={formData.Frequency}
            onChange={(e) => onChange('Frequency', e.target.value)}
            placeholder=""
          />
        </FormField>

        {!isMonthly ? (
          <FormField label="Day of Week" required error={errors.DayOfWeek}>
            <Select
              options={DOW_OPTIONS}
              value={formData.DayOfWeek}
              onChange={(e) => onChange('DayOfWeek', e.target.value)}
              placeholder="Select Day"
            />
          </FormField>
        ) : (
          <FormField
            label="Day of Month (1-31)"
            required
            type="number"
            min="1"
            max="31"
            error={errors.DayOfMonth}
            value={formData.DayOfMonth || ''}
            onChange={(e) => onChange('DayOfMonth', e.target.value)}
            placeholder="e.g. 15"
          />
        )}

        <FormField
          label="Schedule Start Date"
          required
          type="date"
          error={errors.StartDate}
          value={formData.StartDate || ''}
          onChange={(e) => onChange('StartDate', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Start Time"
          type="time"
          error={errors.StartTime}
          value={formData.StartTime || '09:00'}
          onChange={(e) => onChange('StartTime', e.target.value)}
        />

        <FormField
          label="Estimated Hours per Occurrence"
          type="number"
          step="0.5"
          min="0.5"
          error={errors.EstimatedHours}
          value={formData.EstimatedHours || '2.0'}
          onChange={(e) => onChange('EstimatedHours', e.target.value)}
          placeholder="2.0"
        />
      </div>
    </div>
  );
};

export default RegularFields;
