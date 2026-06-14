import React, { useState, useEffect } from 'react';
import { serviceOptionService } from '../../settings/services/serviceOptionService';
import { Plus, X } from 'lucide-react';
import { formatGBP } from '../../../utils/formatters';

export const ServiceOptionSelector = ({
  selectedOptionIds = [],
  customOptions = [],
  onChange
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active system options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const result = await serviceOptionService.getServiceOptions();
        setOptions(result.data || []);
      } catch (err) {
        console.error('Failed to load active service options:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleCheckboxToggle = (optionId) => {
    const isChecked = selectedOptionIds.includes(optionId);
    let updated;
    if (isChecked) {
      updated = selectedOptionIds.filter((id) => id !== optionId);
    } else {
      updated = [...selectedOptionIds, optionId];
    }
    onChange('ServiceOptions', updated);
  };

  const handleAddCustomOption = () => {
    const updated = [...customOptions, { Name: '', Fee: '0.00' }];
    onChange('CustomOptions', updated);
  };

  const handleCustomFieldChange = (index, field, value) => {
    const updated = customOptions.map((opt, idx) => {
      if (idx === index) {
        return { ...opt, [field]: value };
      }
      return opt;
    });
    onChange('CustomOptions', updated);
  };

  const handleRemoveCustomOption = (index) => {
    const updated = customOptions.filter((_, idx) => idx !== index);
    onChange('CustomOptions', updated);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Add-on Options</h4>
      
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-brand-accent" />
          <span className="text-xs text-slate-400 font-semibold">Loading system options...</span>
        </div>
      ) : options.length === 0 ? (
        <p className="text-xs text-slate-400 font-semibold italic">No system options configured.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((opt) => {
            const isChecked = selectedOptionIds.includes(opt.ServiceOptionID);
            const isFree = !opt.IsChargeable || parseFloat(opt.Fee) === 0;

            return (
              <label
                key={opt.ServiceOptionID}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? 'bg-brand-primary/5 border-brand-accent/50 text-brand-primary shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxToggle(opt.ServiceOptionID)}
                    className="w-4 h-4 rounded text-brand-accent border-slate-300 focus:ring-brand-accent"
                  />
                  <span className="text-sm font-bold leading-none">{opt.Name}</span>
                </div>

                <div>
                  {isFree ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 uppercase">
                      Free
                    </span>
                  ) : (
                    <span className="text-xs font-black text-teal-650">
                      +{formatGBP(opt.Fee)}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Custom options additions */}
      {customOptions.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-4">Custom Manual Additions</h4>
          {customOptions.map((opt, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3 pl-6 pr-4 py-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl max-w-2xl transition-all duration-150"
            >
              <div className="w-1/2">
                <input
                  type="text"
                  value={opt.Name}
                  onChange={(e) => handleCustomFieldChange(idx, 'Name', e.target.value)}
                  placeholder="e.g. Clean kitchen cupboards"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 italic focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors shadow-xs"
                />
              </div>

              <div className="w-32 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xs">
                <span className="text-xs font-bold text-slate-400">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={opt.Fee}
                  onChange={(e) => handleCustomFieldChange(idx, 'Fee', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none focus:outline-none text-xs font-black text-slate-700"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveCustomOption(idx)}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-md transition-colors ml-auto"
                title="Remove Custom Option"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleAddCustomOption}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-accent transition-colors px-3 py-1.5 border border-dashed border-slate-250 hover:border-brand-accent/50 rounded-lg bg-white/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add custom manual option</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceOptionSelector;
