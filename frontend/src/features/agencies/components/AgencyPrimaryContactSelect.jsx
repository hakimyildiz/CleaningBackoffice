import React from 'react';
import FormField from '../../../components/common/FormField';
import Select from '../../../components/common/Select';

export const AgencyPrimaryContactSelect = ({
  staff = [],
  value = '',
  onChange,
  error,
  disabled = false
}) => {
  const options = staff.map((member) => ({
    value: member.UserID.toString(),
    label: `${member.FirstName} ${member.SureName} — ${member.Role.replace('_', ' ')}`
  }));

  return (
    <FormField
      label="Primary Contact"
      error={error}
      disabled={disabled}
    >
      <Select
        options={options}
        value={value ? value.toString() : ''}
        onChange={onChange}
        placeholder="None (Select Primary Contact)"
        disabled={disabled}
      />
    </FormField>
  );
};

export default AgencyPrimaryContactSelect;
