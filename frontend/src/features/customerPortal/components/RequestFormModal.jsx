import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { formatDate } from '../../../utils/formatters';
import { CalendarRange, Info } from 'lucide-react';

export const RequestFormModal = ({ isOpen, onClose, selectedJob, onSubmit, loading }) => {
  const [requestType, setRequestType] = useState('reschedule');
  
  // Reschedule fields
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // Cancel fields
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Pause fields
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  // Other fields
  const [otherText, setOtherText] = useState('');

  // Synchronize initial state when job changes
  useEffect(() => {
    if (selectedJob) {
      if (selectedJob.preselectedType) {
        setRequestType(selectedJob.preselectedType);
      } else {
        setRequestType('reschedule');
      }
      // Reset fields
      setNewDate('');
      setNewTime('');
      setRescheduleNote('');
      setCancelReason('');
      setCancelConfirm(false);
      setPauseFrom('');
      setPauseTo('');
      setPauseReason('');
      setOtherText('');
    }
  }, [selectedJob, isOpen]);

  const handleConfirmSubmit = () => {
    const data = {
      type: requestType,
      serviceRecordId: selectedJob?.serviceRecordId || null,
      serviceId: selectedJob?.serviceId || null,
      serviceScheduleId: selectedJob?.serviceScheduleId || null
    };

    if (requestType === 'reschedule') {
      if (!newDate || !newTime) {
        alert('Please select preferred date and time.');
        return;
      }
      data.requestedValue = { newDate, newTime, reason: rescheduleNote };
      data.note = rescheduleNote;
    } else if (requestType === 'cancel') {
      if (!cancelConfirm) {
        alert('Please check the confirmation box.');
        return;
      }
      data.requestedValue = { date: selectedJob?.scheduledDate, reason: cancelReason };
      data.note = cancelReason;
    } else if (requestType === 'pause') {
      if (!pauseFrom || !pauseTo) {
        alert('Please select both start and end pause dates.');
        return;
      }
      data.requestedValue = { pauseFrom, pauseTo, reason: pauseReason };
      data.note = pauseReason;
    } else {
      if (!otherText || otherText.trim().length < 20) {
        alert('Please provide a descriptive request (at least 20 characters).');
        return;
      }
      data.requestedValue = { request: otherText };
      data.note = otherText;
    }

    onSubmit(data);
  };

  // Build header / title based on selection
  const getModalTitle = () => {
    if (selectedJob?.scheduledDate) {
      return `Request Change for Clean on ${formatDate(selectedJob.scheduledDate)}`;
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
      <div className="space-y-4 text-left text-xs">
        {/* Step 1: Type Selection (hidden if preselected type is enforced) */}
        {!selectedJob?.preselectedType && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              What change would you like to request?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'reschedule', label: 'Reschedule Clean' },
                { value: 'cancel', label: 'Cancel Clean' },
                { value: 'pause', label: 'Pause Service' },
                { value: 'other', label: 'Other Request' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRequestType(opt.value)}
                  className={`py-2 px-3 border rounded-xl font-bold transition-all text-center ${
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
        )}

        {/* Step 2: Form Fields */}
        {requestType === 'reschedule' && (
          <div className="space-y-3">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="e.g. I have guests visiting on Tuesday, would prefer Thursday afternoon if possible..."
              />
            </div>
          </div>
        )}

        {requestType === 'cancel' && (
          <div className="space-y-3">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="e.g. Away on holiday this weekend..."
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
          <div className="space-y-3">
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
                placeholder="e.g. Renovation works on property, away for summer holiday..."
              />
            </div>
          </div>
        )}

        {requestType === 'other' && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Describe Your Request
              </label>
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="Describe your request in detail (minimum 20 characters)..."
              />
              <span className="text-[10px] font-bold text-slate-400">
                {otherText.trim().length}/20 chars minimum
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RequestFormModal;
