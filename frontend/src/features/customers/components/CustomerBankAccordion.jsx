import React from 'react';
import Accordion from '../../../components/common/Accordion';
import FormField from '../../../components/common/FormField';

export const CustomerBankAccordion = ({ formData, errors, onChange }) => {
  return (
    <Accordion title="Bank Account Details (Optional)">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Bank Type"
          error={errors.BankType}
          value={formData.BankType || ''}
          onChange={(e) => onChange('BankType', e.target.value)}
          placeholder="e.g. Current, Savings"
        />

        <FormField
          label="Bank Name"
          error={errors.BankName}
          value={formData.BankName || ''}
          onChange={(e) => onChange('BankName', e.target.value)}
          placeholder="e.g. Barclays Bank"
        />

        <FormField
          label="Sort Code"
          error={errors.SortCode}
          value={formData.SortCode || ''}
          onChange={(e) => onChange('SortCode', e.target.value)}
          placeholder="e.g. 20-30-40"
        />

        <FormField
          label="Account Number"
          error={errors.AccountNo}
          value={formData.AccountNo || ''}
          onChange={(e) => onChange('AccountNo', e.target.value)}
          placeholder="e.g. 12345678"
        />

        <div className="col-span-full">
          <FormField
            label="IBAN"
            error={errors.IBAN}
            value={formData.IBAN || ''}
            onChange={(e) => onChange('IBAN', e.target.value)}
            placeholder="e.g. GB29 BARC 2030 4012 3456 78"
          />
        </div>
      </div>
    </Accordion>
  );
};

export default CustomerBankAccordion;
