import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { formatDate, formatTime } from '../../../utils/formatters';
import { 
  Calendar, Check, X, Search, Clock, 
  MapPin, HelpCircle, AlertCircle, CalendarRange, 
  Trash2, Sliders, UserCheck, MessageSquare 
} from 'lucide-react';

export const RequestsQueuePage = () => {
  const { addToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  // Filters state
  const [filterTypeGroup, setFilterTypeGroup] = useState('all'); // 'all' | 'pause' | 'change'
  const [status, setStatus] = useState('pending'); // default pending to prioritize work
  const [search, setSearch] = useState('');
  
  // Rejection note modal state
  const [requestToReview, setRequestToReview] = useState(null); // { request, action: 'approve' | 'reject' }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // If filterTypeGroup is 'pause', query type = 'pause'. 
      // If it is 'change', we can filter on frontend or pass a parameter. 
      // For now let's query all and filter if needed, or query with type filter if 'pause'.
      const queryType = filterTypeGroup === 'pause' ? 'pause' : undefined;

      const result = await requestService.getRequests({
        page,
        limit: 10,
        type: queryType,
        status: status || undefined,
        search: search || undefined
      });

      let data = result.data || [];
      // If filterTypeGroup is 'change', filter out 'pause' requests on frontend
      if (filterTypeGroup === 'change') {
        data = data.filter(r => r.Type !== 'pause');
      }

      setRequests(data);
      setPagination(result.pagination);
    } catch (err) {
      addToast('Failed to fetch requests queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, filterTypeGroup, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleReviewClick = (request, action) => {
    setRequestToReview({ request, action });
    setReviewNote('');
  };

  const handleReviewConfirm = async () => {
    if (!requestToReview) return;
    const { request, action } = requestToReview;
    setReviewLoading(true);

    try {
      if (action === 'approve') {
        await requestService.approveRequest(request.ChangeRequestID, reviewNote);
        addToast('Request approved successfully, schedule updated.', 'success');
      } else {
        await requestService.rejectRequest(request.ChangeRequestID, reviewNote);
        addToast('Request rejected successfully.', 'warning');
      }
      setRequestToReview(null);
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to review request.', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper to format the RequestedValue into human-readable description
  const formatRequestValue = (type, valueStr) => {
    if (!valueStr) return 'No details provided.';
    let val = {};
    try {
      val = JSON.parse(valueStr);
    } catch (e) {
      return valueStr; // fallback to raw string
    }

    switch (type) {
      case 'pause':
        return `Request to pause service from ${formatDate(val.pauseFrom)} to ${formatDate(val.pauseTo)}.`;
      case 'reschedule':
        return `Reschedule clean to ${formatDate(val.newDate)} at ${val.newTime || '—'}.`;
      case 'cancel':
        return `Cancel clean occurrence scheduled for ${val.date ? formatDate(val.date) : 'this date'}.`;
      case 'hours_change':
        return `Change expected duration to ${val.newEstimatedHours} hours.`;
      case 'cleaner_change':
        return `Reassign cleaners. (Remove employee ID: ${val.removeEmployeeId || '—'}, Assign employee ID: ${val.addEmployeeId || '—'}).`;
      default:
        return val.reason || val.note || JSON.stringify(val);
    }
  };

  // Helper for Type Badges
  const getTypeBadge = (type) => {
    let classes = '';
    let label = '';
    switch (type) {
      case 'pause':
        classes = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Pause';
        break;
      case 'reschedule':
        classes = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Reschedule';
        break;
      case 'cancel':
        classes = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Cancel';
        break;
      case 'hours_change':
        classes = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Hours Change';
        break;
      case 'cleaner_change':
        classes = 'bg-teal-50 text-teal-700 border-teal-200';
        label = 'Cleaner Swap';
        break;
      default:
        classes = 'bg-slate-50 text-slate-700 border-slate-200';
        label = 'Other';
        break;
    }
    return (
      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-md">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md animate-pulse">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Requests Queue</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Approve or reject schedule changes requested by customers or staff
          </p>
        </div>
      </div>

      {/* Filter and Tab controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Toggle Group buttons */}
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl w-fit">
          <button
            onClick={() => { setFilterTypeGroup('all'); setPage(1); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTypeGroup === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => { setFilterTypeGroup('pause'); setPage(1); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTypeGroup === 'pause' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pause Requests
          </button>
          <button
            onClick={() => { setFilterTypeGroup('change'); setPage(1); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTypeGroup === 'change' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Change Requests
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-brand-accent appearance-none pr-8 relative"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8.5 pr-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent"
              placeholder="Search client..."
            />
          </form>
        </div>
      </div>

      {/* Cards Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs italic">
            No pending requests found in the queue.
          </div>
        ) : (
          requests.map((r) => {
            const clientName = r.CustomerID
              ? `${r.CustomerFirstName} ${r.CustomerSureName}`
              : r.AgencyName || 'System Client';
            const isPending = r.Status === 'pending';

            return (
              <div 
                key={r.ChangeRequestID} 
                className={`bg-white border border-slate-200 rounded-3xl p-5 shadow-xs transition-all hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending ? 'border-l-4 border-l-brand-accent' : ''
                }`}
              >
                {/* Left side details */}
                <div className="space-y-3 flex-1 text-xs">
                  <div className="flex items-center flex-wrap gap-2.5">
                    {getTypeBadge(r.Type)}
                    <span className="font-bold text-slate-800 text-sm">
                      Customer: {clientName}
                    </span>
                    <span className="text-slate-400 font-medium">
                      • Submitted: {formatDate(r.CreatedAt)} {formatTime(r.CreatedAt)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-0.5">
                    {r.AddressLine && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.AddressLine}, {r.City}</span>
                      </div>
                    )}
                    
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-slate-750 font-bold text-xs leading-relaxed flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                      <span>{formatRequestValue(r.Type, r.RequestedValue)}</span>
                    </div>
                  </div>

                  {/* Review details if approved/rejected */}
                  {!isPending && r.ReviewedBy && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-500 font-semibold space-y-0.5">
                      <div className="flex justify-between">
                        <span>Reviewed By: <strong className="text-slate-700">{r.ReviewedByFirstName} {r.ReviewedBySureName}</strong></span>
                        <span>Reviewed At: {formatDate(r.ReviewedAt)}</span>
                      </div>
                      {r.Note && (
                        <div className="flex items-start gap-1 mt-1 text-slate-600 italic font-medium">
                          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                          <span>"{r.Note}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side status / review buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {isPending ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleReviewClick(r, 'reject')}
                        className="py-1 px-3 text-xs font-bold border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleReviewClick(r, 'approve')}
                        className="py-1 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </Button>
                    </div>
                  ) : (
                    getStatusBadge(r.Status)
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Approve / Reject Dialog Note Modal */}
      <Modal
        isOpen={!!requestToReview}
        onClose={() => setRequestToReview(null)}
        title={requestToReview?.action === 'approve' ? 'Approve Change Request' : 'Reject Change Request'}
        onConfirm={handleReviewConfirm}
        confirmText={requestToReview?.action === 'approve' ? 'Approve' : 'Reject Request'}
        confirmVariant={requestToReview?.action === 'approve' ? 'primary' : 'danger'}
        isLoading={reviewLoading}
      >
        <div className="space-y-3 text-left text-xs">
          <p className="text-sm text-slate-650 font-semibold">
            Are you sure you want to {requestToReview?.action} this change request?
          </p>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Review Note / Reason (Optional)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              placeholder="e.g. Approved per phone call agreement..."
            />
          </div>
        </div>
      </Modal>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-bold text-slate-500">
          <span>
            Showing page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="py-1 px-3 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="py-1 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsQueuePage;
