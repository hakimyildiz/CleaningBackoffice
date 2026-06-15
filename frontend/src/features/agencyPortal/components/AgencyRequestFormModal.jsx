import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { formatDate } from '../../../utils/formatters';
import { CalendarRange, Info, AlertTriangle } from 'lucide-react';

export const AgencyRequestFormModal = ({ 
  isOpen, 
  onClose, 
  properties = [], 
  selectedJob = null, 
  selectedProperty = null,
  onSubmit, 
  loading 
}) => {
  const [requestType, setRequestType] = useState('reschedule');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Form states
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  const [extraServiceDetails, setExtraServiceDetails] = useState('');
  const [hoursChangeValue, setHoursChangeValue] = useState('');
  const [hoursChangeReason, setHoursChangeReason] = useState('');
  const [otherText, setOtherText] = useState('');

  // Sync state
  useEffect(() => {
    if (isOpen) {
      if (selectedJob) {
        setSelectedPropertyId(selectedJob.ServiceID || '');
      } else if (selectedProperty) {
        setSelectedPropertyId(selectedProperty.ServiceID || '');
      } else if (properties.length > 0) {
        setSelectedPropertyId(properties[0].ServiceID || '');
      }
      
      // Default type
      setRequestType('reschedule');

      // Reset fields
      setNewDate('');
      setNewTime('');
      setRescheduleNote('');
      setCancelReason('');
      setCancelConfirm(false);
      setPauseFrom('');
      setPauseTo('');
      setPauseReason('');
      setExtraServiceDetails('');
      setHoursChangeValue('');
      setHoursChangeReason('');
      setOtherText('');
    }
  }, [isOpen, selectedJob, selectedProperty, properties]);

  const handleConfirmSubmit = () => {
    if (!selectedPropertyId) {
      alert('Please select a property.');
      return;
    }

    const data = {
      type: requestType,
      serviceId: parseInt(selectedPropertyId, 10),
      serviceRecordId: selectedJob?.ServiceRecordID || null,
      serviceScheduleId: selectedJob?.ServiceScheduleID || null
    };

    if (requestType === 'reschedule') {
      if (!newDate || !newTime) {
        alert('Please select a preferred date and time.');
        return;
      }
      data.requestedValue = { newDate, newTime, reason: rescheduleNote };
      data.note = rescheduleNote;
    } else if (requestType === 'cancel') {
      if (!cancelConfirm) {
        alert('Please check the confirmation box.');
        return;
      }
      data.requestedValue = { date: selectedJob?.ScheduledDate || new Date().toISOString().split('T')[0], reason: cancelReason };
      data.note = cancelReason;
    } else if (requestType === 'pause') {
      if (!pauseFrom || !pauseTo) {
        alert('Please select both start and end dates.');
        return;
      }
      data.requestedValue = { pauseFrom, pauseTo, reason: pauseReason };
      data.note = pauseReason;
    } else if (requestType === 'extra_service') {
      if (!extraServiceDetails || extraServiceDetails.trim().length < 10) {
        alert('Please describe the extra service details (minimum 10 characters).');
        return;
      }
      data.requestedValue = { details: extraServiceDetails };
      data.note = extraServiceDetails;
    } else if (requestType === 'hours_change') {
      if (!hoursChangeValue || parseFloat(hoursChangeValue) <= 0) {
        alert('Please specify a valid number of hours.');
        return;
      }
      if (!hoursChangeReason || hoursChangeReason.trim().length < 10) {
        alert('Please describe the reason for hours change (minimum 10 characters).');
        return;
      }
      data.requestedValue = { newHours: parseFloat(hoursChangeValue), reason: hoursChangeReason };
      data.note = hoursChangeReason;
    } else {
      if (!otherText || otherText.trim().length < 20) {
        alert('Please describe your request (minimum 20 characters).');
        return;
      }
      data.requestedValue = { details: otherText };
      data.note = otherText;
    }

    onSubmit(data);
  };

  const getModalTitle = () => {
    if (selectedJob?.ScheduledDate) {
      return `Request Change for Clean on ${formatDate(selectedJob.ScheduledDate)}`;
    }
    return 'Submit Schedule Change Request';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      onConfirm={handleConfirmSubmit}
      confirmText={loading ? 'Submitting...' : 'Send Request'}
      isLoading={loading}
    >
      <div className="space-y-4.5 text-left text-xs">
        {/* Step 1: Select Property (only if not preselected) */}
        {!selectedJob && !selectedProperty ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Select Property
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-850 focus:outline-hidden focus:border-brand-accent focus:bg-white"
            >
              {properties.map((p) => (
                <option key={p.ServiceID} value={p.ServiceID}>
                  {p.AddressLine}, {p.City}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selected Property
            </span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">
              {selectedJob?.AddressLine || selectedProperty?.AddressLine}, {selectedJob?.City || selectedProperty?.City}
            </span>
          </div>
        )}

        {/* Step 2: Request Type Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Request Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { value: 'reschedule', label: 'Reschedule Clean' },
              { value: 'cancel', label: 'Cancel Clean' },
              { value: 'pause', label: 'Pause Service' },
              { value: 'extra_service', label: 'Extra Service' },
              { value: 'hours_change', label: 'Hours Change' },
              { value: 'other', label: 'Other Request' }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRequestType(opt.value)}
                className={`py-2 px-1 border rounded-xl font-bold transition-all text-center text-[10px] sm:text-xs ${
                  requestType === opt.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-350'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Type specific inputs */}
        {requestType === 'reschedule' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preferred New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // min tomorrow
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preferred New Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reason / Additional Notes (Optional)
              </label>
              <textarea
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="Describe why you want to reschedule..."
              />
            </div>
          </div>
        )}

        {requestType === 'cancel' && (
          <div className="space-y-3.5">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-rose-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                Cancelling a clean removes the occurrence from our schedule. Pausing is recommended for temporary absences.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="Reason..."
              />
            </div>

            <label className="flex items-start gap-2.5 p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cancelConfirm}
                onChange={(e) => setCancelConfirm(e.target.checked)}
                className="mt-0.5 rounded text-brand-accent border-slate-300 focus:ring-brand-accent"
              />
              <span className="font-semibold text-slate-700 leading-snug">
                I understand this request will be sent to the administration team and cannot be undone once approved.
              </span>
            </label>
          </div>
        )}

        {requestType === 'pause' && (
          <div className="space-y-3.5">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-amber-800">
              <CalendarRange className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                Pause requests must be submitted at least 24 hours in advance and are subject to administrative approval.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pause From Date
                </label>
                <input
                  type="date"
                  value={pauseFrom}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // min tomorrow
                  onChange={(e) => setPauseFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pause Until Date
                </label>
                <input
                  type="date"
                  value={pauseTo}
                  min={pauseFrom || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => setPauseTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reason for Pause
              </label>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="Reason..."
              />
            </div>
          </div>
        )}

        {requestType === 'extra_service' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Describe Extra Service Needed
            </label>
            <textarea
              value={extraServiceDetails}
              onChange={(e) => setExtraServiceDetails(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              placeholder="e.g. Deep oven cleaning, window washing, carpet cleaning..."
            />
          </div>
        )}

        {requestType === 'hours_change' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Requested Clean Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={hoursChangeValue}
                onChange={(e) => setHoursChangeValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="e.g. 3.5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reason for Change
              </label>
              <textarea
                value={hoursChangeReason}
                onChange={(e) => setHoursChangeReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="Explain why you need to adjust the duration..."
              />
            </div>
          </div>
        )}

        {requestType === 'other' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Describe Your Request
            </label>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              placeholder="Please describe your request in detail..."
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AgencyRequestFormModal;
