import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import customerPortalService from '../services/customerPortalService';
import ActiveCleaningCard from '../components/ActiveCleaningCard';
import UpcomingJobsList from '../components/UpcomingJobsList';
import AfterPhotoGallery from '../components/AfterPhotoGallery';
import RequestFormModal from '../components/RequestFormModal';
import { useToast } from '../../../hooks/useToast';
import { formatGBP } from '../../../utils/formatters';
import { AlertTriangle, Sparkles, Calendar, Receipt, ChevronRight } from 'lucide-react';

export const CustomerHomePage = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Request modal states
  const [selectedJobForChange, setSelectedJobForChange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchOverview = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await customerPortalService.getOverview();
      setData(result.data);
    } catch (err) {
      addToast('Failed to load portal overview.', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverview(false);
    setRefreshing(false);
    addToast('Status refreshed.', 'success');
  };

  const handleRequestChangeClick = (job) => {
    setSelectedJobForChange(job);
    setModalOpen(true);
  };

  const handleRequestSubmit = async (requestData) => {
    setModalLoading(true);
    try {
      await customerPortalService.submitRequest(requestData);
      addToast('Your request has been submitted. Our team will review it shortly.', 'success');
      setModalOpen(false);
      fetchOverview();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit request.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  const hasUnpaid = data?.unpaidInvoices?.count > 0;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-accent animate-pulse" />
            <span>Welcome back!</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Manage your scheduled cleanings and invoices below
          </p>
        </div>
      </div>

      {/* Unpaid Invoices Banner */}
      {hasUnpaid && (
        <div className="bg-amber-50 border-2 border-amber-200/80 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-slate-800">Outstanding Invoices</p>
              <p className="text-slate-500 font-semibold mt-0.5">
                You have {data.unpaidInvoices.count} unpaid invoice(s) totalling{' '}
                <strong className="text-slate-700">{formatGBP(data.unpaidInvoices.total)}</strong>.
              </p>
            </div>
          </div>
          <Link
            to="/customer-portal/invoices"
            className="text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-2xl border border-amber-200/50 flex items-center justify-center gap-1 shrink-0 self-end sm:self-center transition-all"
          >
            <span>View Invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Live Status & Photos */}
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Live Status
          </h2>
          <ActiveCleaningCard
            activeJob={data?.activeJob}
            todayScheduledJob={data?.todayScheduledJob}
            onRefresh={handleRefresh}
            loading={refreshing}
          />

          {data?.lastCompletedJob && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Completed Job Photos
              </h2>
              <AfterPhotoGallery lastCompletedJob={data.lastCompletedJob} />
            </div>
          )}
        </div>

        {/* Right Column: Upcoming cleanings list */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Upcoming Cleanings
          </h2>
          <UpcomingJobsList
            upcomingJobs={data?.upcomingJobs}
            onRequestChange={handleRequestChangeClick}
          />

          <div className="pt-4 flex justify-between gap-4">
            <Link
              to="/customer-portal/schedule"
              className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 text-center hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Calendar className="w-5 h-5 mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-bold text-slate-800">Full 30-Day Schedule</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">View and request reschedules</p>
            </Link>
            <Link
              to="/customer-portal/invoices"
              className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 text-center hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Receipt className="w-5 h-5 mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-bold text-slate-800">Billing & History</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Download PDF receipts</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Request Change Modal */}
      <RequestFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedJob={selectedJobForChange}
        onSubmit={handleRequestSubmit}
        loading={modalLoading}
      />
    </div>
  );
};

export default CustomerHomePage;
