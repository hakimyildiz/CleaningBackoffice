import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import { formatDate, formatTime } from '../../../utils/formatters';
import { 
  ClipboardList, PlusCircle, History, Info, 
  CalendarRange, AlertTriangle, CheckCircle2, XCircle, Clock
} from 'lucide-react';

export const AgencyRequestsPage = () => {
  const { role } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('submit');
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [requestType, setRequestType] = useState('reschedule');
  
  // Reschedule
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // Cancel
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Pause
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  // Extra service
  const [extraServiceDetails, setExtraServiceDetails] = useState('');

  // Hours change
  const [hoursChangeValue, setHoursChangeValue] = useState('');
  const [hoursChangeReason, setHoursChangeReason] = useState('');

  // Other
  const [otherText, setOtherText] = useState('');

  const fetchInitialData = async () => {
    try {
      const propResult = await agencyPortalService.getProperties();
      const props = propResult.data || [];
      setProperties(props);
      if (props.length > 0) {
        setSelectedPropertyId(props[0].ServiceID);
      }

      const requestsResult = await agencyPortalService.getRequests();
      setRequests(requestsResult.data || []);
    } catch (err) {
      addToast('Failed to load properties or request history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'agency_bookkeeper') {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [role, addToast]);

  const handleFormReset = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      addToast('Please select a property.', 'error');
      return;
    }

    const data = {
      type: requestType,
      serviceId: parseInt(selectedPropertyId, 10),
      serviceRecordId: null,
      serviceScheduleId: null
    };

    if (requestType === 'reschedule') {
      if (!newDate || !newTime) {
        addToast('Please select preferred new date and time.', 'error');
        return;
      }
      data.requestedValue = { newDate, newTime, reason: rescheduleNote };
      data.note = rescheduleNote;
    } else if (requestType === 'cancel') {
      if (!cancelConfirm) {
        addToast('Please check the cancellation confirmation box.', 'error');
        return;
      }
      data.requestedValue = { reason: cancelReason };
      data.note = cancelReason;
    } else if (requestType === 'pause') {
      if (!pauseFrom || !pauseTo) {
        addToast('Please select start and end pause dates.', 'error');
        return;
      }
      data.requestedValue = { pauseFrom, pauseTo, reason: pauseReason };
      data.note = pauseReason;
    } else if (requestType === 'extra_service') {
      if (!extraServiceDetails || extraServiceDetails.trim().length < 10) {
        addToast('Please describe the extra service details (minimum 10 characters).', 'error');
        return;
      }
      data.requestedValue = { details: extraServiceDetails };
      data.note = extraServiceDetails;
    } else if (requestType === 'hours_change') {
      if (!hoursChangeValue || parseFloat(hoursChangeValue) <= 0) {
        addToast('Please specify a valid number of hours.', 'error');
        return;
      }
      if (!hoursChangeReason || hoursChangeReason.trim().length < 10) {
        addToast('Please provide a reason for the hours change (minimum 10 characters).', 'error');
        return;
      }
      data.requestedValue = { newHours: parseFloat(hoursChangeValue), reason: hoursChangeReason };
      data.note = hoursChangeReason;
    } else {
      if (!otherText || otherText.trim().length < 20) {
        addToast('Please describe your request in detail (minimum 20 characters).', 'error');
        return;
      }
      data.requestedValue = { details: otherText };
      data.note = otherText;
    }

    setSubmitting(true);
    try {
      await agencyPortalService.submitRequest(data);
      addToast('Change request submitted successfully.', 'success');
      handleFormReset();
      
      // Refresh request list and select active tab
      const reqResult = await agencyPortalService.getRequests();
      setRequests(reqResult.data || []);
      setActiveTab('history');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestDetails = (req) => {
    let val = req.RequestedValue;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch (e) {
        // fallback
      }
    }
    
    if (!val) return req.Note || 'No details provided';

    switch (req.Type?.toLowerCase()) {
      case 'reschedule':
        return `Reschedule to ${formatDate(val.newDate)} at ${formatTime(val.newTime)}${val.reason ? ` - Note: "${val.reason}"` : ''}`;
      case 'cancel':
        return `Cancel clean occurrence${val.reason ? ` - Reason: "${val.reason}"` : ''}`;
      case 'pause':
        return `Pause from ${formatDate(val.pauseFrom)} to ${formatDate(val.pauseTo)}${val.reason ? ` - Reason: "${val.reason}"` : ''}`;
      case 'extra_service':
        return `Extra Service: "${val.details || val.request || req.Note}"`;
      case 'hours_change':
        return `Change hours to ${val.newHours} hrs${val.reason ? ` - Reason: "${val.reason}"` : ''}`;
      default:
        return val.details || val.request || req.Note || 'Change request submitted';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-amber-250 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-emerald-250 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-rose-200 bg-rose-50 text-rose-705 rounded-full text-[10px] font-bold uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (role === 'agency_bookkeeper') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center text-red-650 max-w-lg mx-auto mt-12 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-black">Access Denied</h2>
        <p className="text-xs font-semibold mt-1">Bookkeepers are not authorized to submit or view change requests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-accent" />
          <span>Change Requests</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          Submit and track schedule changes, pauses, cancellations, and extra options
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('submit')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 transition-all relative ${
            activeTab === 'submit' 
              ? 'text-slate-850 border-b-2 border-brand-accent font-black' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Request</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 transition-all relative ${
            activeTab === 'history' 
              ? 'text-slate-850 border-b-2 border-brand-accent font-black' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <History className="w-4 h-4" />
          <span>My Requests ({requests.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'submit' ? (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 max-w-2xl text-xs">
          {properties.length === 0 ? (
            <div className="text-slate-400 font-semibold italic text-center py-4">
              No properties found under management. Cannot submit change requests.
            </div>
          ) : (
            <>
              {/* Select Property */}
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

              {/* Request Type */}
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

              {/* Dynamic Sub-forms */}
              {requestType === 'reschedule' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
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
                      placeholder="Reason for reschedule..."
                    />
                  </div>
                </div>
              )}

              {requestType === 'cancel' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
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
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
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
                      placeholder="Explain details..."
                    />
                  </div>
                </div>
              )}

              {requestType === 'extra_service' && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Describe Extra Service Details
                  </label>
                  <textarea
                    value={extraServiceDetails}
                    onChange={(e) => setExtraServiceDetails(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                    placeholder="e.g. Add oven cleaning or professional carpet cleaning on next visit..."
                  />
                </div>
              )}

              {requestType === 'hours_change' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
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
                      placeholder="Why adjust clean hours..."
                    />
                  </div>
                </div>
              )}

              {requestType === 'other' && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Describe Your Request
                  </label>
                  <textarea
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                    placeholder="Describe request..."
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs uppercase tracking-wider text-center"
              >
                {submitting ? 'Sending Request...' : 'Send Request'}
              </button>
            </>
          )}
        </form>
      ) : (
        /* Tab 2: Requests History */
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-semibold text-xs italic">
              No change requests submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Request Type</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Requested By</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                  {requests.map((req) => (
                    <tr key={req.ChangeRequestID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(req.CreatedAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-slate-800">{req.AddressLine}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{req.City}</div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="font-bold text-slate-800 capitalize">
                          {req.Type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 max-w-[280px]">
                        <span className="text-[11px] font-semibold text-slate-500 block leading-relaxed break-words">
                          {renderRequestDetails(req)}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-slate-500 font-semibold">
                        {req.RequestedByFirstName} {req.RequestedBySureName}
                      </td>
                      <td className="px-6 py-4.5 text-center whitespace-nowrap">
                        {getStatusBadge(req.Status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgencyRequestsPage;
