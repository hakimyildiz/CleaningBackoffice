import React, { useState, useEffect, useCallback } from 'react';
import cleanerDashboardService from '../services/cleanerDashboardService';
import serviceRecordService from '../../serviceRecords/services/serviceRecordService';
import JobCard from '../components/JobCard';
import CheckInButton from '../components/CheckInButton';
import CheckOutPanel from '../components/CheckOutPanel';
import ActiveJobTimer from '../components/ActiveJobTimer';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { Calendar, User, Clock, MapPin, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { formatDate, formatTime } from '../../../utils/formatters';

export const CleanerDashboardPage = () => {
  const { addToast } = useToast();
  
  const [jobs, setJobs] = useState({ past: [], today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  
  // Active checkout panel state
  const [activeCheckoutId, setActiveCheckoutId] = useState(null);
  
  // Selected job detail modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cleanerDashboardService.getCleanerJobs();
      setJobs(result.data || { past: [], today: [], upcoming: [] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load cleaner schedule.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCheckIn = async (scheduleId, lat, lng) => {
    try {
      const result = await serviceRecordService.checkIn({ scheduleId, lat, lng });
      addToast('Checked in successfully! Happy cleaning.', 'success');
      fetchJobs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Check-in failed.', 'error');
    }
  };

  const handleCheckOut = async (recordId, formData) => {
    try {
      await serviceRecordService.checkOut(recordId, formData);
      addToast('Checked out successfully! Job completed and draft invoice generated.', 'success');
      setActiveCheckoutId(null);
      fetchJobs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Check-out failed.', 'error');
      throw err; // throw back to Panel to preserve form state/loading
    }
  };

  const openDetailModal = (job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Concurrency check: does the cleaner currently have any job in progress?
  const activeJob = jobs.today.find((j) => j.hasActiveRecord === 1 || j.hasActiveRecord === true);
  const hasActiveJob = !!activeJob;

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-12 px-2 text-left">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-accent/15 text-brand-accent rounded-2xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daily Jobs</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">
            Your cleaning assignment checklist
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading jobs...</span>
        </div>
      ) : (
        <>
          {/* 1. TODAY'S JOBS SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Today &mdash; {formatDate(new Date())}
              </h2>
            </div>

            {jobs.today.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <AlertCircle className="w-12 h-12 text-slate-355 mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-bold text-slate-800">No jobs scheduled today</h3>
                <p className="text-xs text-slate-450 mt-1">
                  Enjoy your day off! Any new assignments will display here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.today.map((job) => {
                  const isInProgress = job.hasActiveRecord === 1 || job.hasActiveRecord === true;
                  const isCompleted = job.Status === 'completed';
                  
                  return (
                    <div key={job.ServiceRecordID} className="space-y-3">
                      <JobCard 
                        job={job} 
                        variant="today"
                        onClick={() => openDetailModal(job)}
                      >
                        {/* Dynamic action triggers based on state */}
                        {!isCompleted && !isInProgress && (
                          <CheckInButton
                            scheduleId={job.ServiceRecordID}
                            onCheckIn={handleCheckIn}
                            disabled={hasActiveJob}
                            disabledReason="Finish your current job first"
                          />
                        )}

                        {isInProgress && activeCheckoutId !== job.ServiceRecordID && (
                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <ActiveJobTimer checkInTime={job.checkInTime} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCheckoutId(job.ServiceRecordID);
                              }}
                              className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-600 text-white font-black rounded-xl text-sm shadow-sm transition-colors"
                            >
                              Check Out
                            </button>
                          </div>
                        )}
                      </JobCard>

                      {/* Checkout Form Panel */}
                      {isInProgress && activeCheckoutId === job.ServiceRecordID && (
                        <CheckOutPanel
                          serviceRecordId={job.ServiceRecordID}
                          requirePhoto={job.RequireCheckoutPhoto === 1 || job.RequireCheckoutPhoto === true}
                          onCheckOut={handleCheckOut}
                          onCancel={() => setActiveCheckoutId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. UPCOMING JOBS SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest pl-2">
              Coming Up
            </h3>
            {jobs.upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 pl-2 font-bold uppercase tracking-wider">No upcoming assignments listed</p>
            ) : (
              <div className="space-y-3">
                {jobs.upcoming.map((job) => (
                  <JobCard 
                    key={job.ServiceRecordID} 
                    job={job} 
                    variant="upcoming"
                    onClick={() => openDetailModal(job)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. PAST JOBS SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest pl-2">
              Recent Jobs
            </h3>
            {jobs.past.length === 0 ? (
              <p className="text-xs text-slate-400 pl-2 font-bold uppercase tracking-wider">No completed jobs yet</p>
            ) : (
              <div className="space-y-3">
                {jobs.past.map((job) => (
                  <JobCard 
                    key={job.ServiceRecordID} 
                    job={job} 
                    variant="past"
                    onClick={() => openDetailModal(job)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Read-Only Job Detail Modal Dialog */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedJob(null);
        }}
        title="Job Details"
        confirmText="Close"
        onConfirm={() => {
          setIsDetailOpen(false);
          setSelectedJob(null);
        }}
      >
        {selectedJob && (
          <div className="space-y-4 text-left text-sm text-slate-600 font-semibold">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                {selectedJob.RefNo || 'No Ref'}
              </span>
              <h3 className="text-base font-black text-slate-800 mt-2">
                {selectedJob.CustomerID ? `${selectedJob.CustomerFirstName} ${selectedJob.CustomerSureName}` : selectedJob.AgencyName}
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-800">{selectedJob.ServiceAddressLine || selectedJob.AddressLine}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedJob.ServiceCity || selectedJob.City}, {selectedJob.ServicePostCode || selectedJob.PostCode}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-450 flex-shrink-0" />
                <span>{formatDate(selectedJob.ScheduledDate)}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-450 flex-shrink-0" />
                <span>{formatTime(selectedJob.ScheduledStart)} ({selectedJob.EstimatedHours} hours estimated)</span>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-450 flex-shrink-0" />
                <span>Property Type: {selectedJob.PropertyType ? selectedJob.PropertyType.charAt(0).toUpperCase() + selectedJob.PropertyType.slice(1) : 'House'}</span>
              </div>

              {selectedJob.partners && selectedJob.partners.length > 0 && (
                <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3">
                  <User className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Assigned crew:</span>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedJob.partners.join(', ')}</p>
                  </div>
                </div>
              )}

              {selectedJob.Note && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client notes / Instructions:</span>
                  <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-50 p-3 border border-slate-200 rounded-xl italic">
                    "{selectedJob.Note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CleanerDashboardPage;
