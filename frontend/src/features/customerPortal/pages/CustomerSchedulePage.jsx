import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import customerPortalService from '../services/customerPortalService';
import RequestFormModal from '../components/RequestFormModal';
import BufferLockNotice from '../components/BufferLockNotice';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { formatDate, formatTime } from '../../../utils/formatters';
import { 
  Calendar, List, MapPin, Clock, 
  HelpCircle, ChevronLeft, ChevronRight, Check, X, Camera 
} from 'lucide-react';

export const CustomerSchedulePage = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const serviceFilter = searchParams.get('serviceId');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Selected date for calendar view detail pane
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

  // Lightbox photos state
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [photosList, setPhotosList] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Request modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedJobForRequest, setSelectedJobForRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // Calendar month selection
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const result = await customerPortalService.getSchedule();
      let data = result.data || [];
      if (serviceFilter) {
        data = data.filter(j => j.ServiceID === parseInt(serviceFilter, 10));
      }
      setJobs(data);
    } catch (err) {
      addToast('Failed to load schedule.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [serviceFilter]);

  const handleRequestChangeClick = (job, preselectedType = null) => {
    setSelectedJobForRequest({
      serviceRecordId: job.ServiceRecordID,
      serviceId: job.ServiceID,
      scheduledDate: job.ScheduledDate,
      scheduledStart: job.ScheduledStart,
      preselectedType
    });
    setRequestModalOpen(true);
  };

  const handleRequestSubmit = async (requestData) => {
    setRequestLoading(true);
    try {
      await customerPortalService.submitRequest(requestData);
      addToast('Change request submitted successfully.', 'success');
      setRequestModalOpen(false);
      fetchSchedule();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit request.', 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleViewPhotosClick = async (serviceRecordId) => {
    setPhotosModalOpen(true);
    setPhotosLoading(true);
    setPhotosList([]);
    try {
      const result = await customerPortalService.getPhotos(serviceRecordId);
      setPhotosList(result.data || []);
    } catch (err) {
      addToast('Failed to load after photos.', 'error');
    } finally {
      setPhotosLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let classes = '';
    switch (status) {
      case 'completed':
        classes = 'bg-emerald-50 text-emerald-700 border-emerald-150';
        break;
      case 'scheduled':
      case 'in_progress':
        classes = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'cancelled':
      case 'skipped':
        classes = 'bg-slate-50 text-slate-400 border-slate-200 line-through';
        break;
      case 'missed':
        classes = 'bg-rose-50 text-rose-600 border-rose-100 font-black';
        break;
      default:
        classes = 'bg-slate-50 text-slate-700 border-slate-200';
        break;
    }
    return (
      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Helper: get day name for date string
  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long' });
  };

  // Calendar rendering helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // 0 = Sunday, 1 = Monday, etc. Adjust so Monday is 0
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayIndex = getFirstDayIndex(currentMonth);
    
    const dayCells = [];
    // Padding for empty start cells
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-14 border border-slate-100 bg-slate-50/20" />);
    }

    // Days in current month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const cellDate = new Date(cellDateStr);
      
      // Find jobs on this date
      const dateJobs = jobs.filter(j => {
        const jDateStr = new Date(j.ScheduledDate).toISOString().split('T')[0];
        return jDateStr === cellDateStr;
      });

      // Find status dots
      const hasCompleted = dateJobs.some(j => j.Status === 'completed');
      const hasScheduled = dateJobs.some(j => ['scheduled', 'in_progress'].includes(j.Status));
      const hasMissedOrCancelled = dateJobs.some(j => ['missed', 'cancelled', 'skipped'].includes(j.Status));

      const isSelected = selectedCalendarDate.toDateString() === cellDate.toDateString();

      dayCells.push(
        <button
          key={`day-${dayNum}`}
          onClick={() => setSelectedCalendarDate(cellDate)}
          className={`h-14 border border-slate-150 p-1 flex flex-col justify-between items-start transition-all relative hover:bg-slate-50/80 focus:outline-hidden ${
            isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200/50 z-10' : 'bg-white'
          }`}
        >
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
            cellDate.toDateString() === new Date().toDateString() 
              ? 'bg-brand-accent text-slate-900' 
              : isSelected ? 'text-indigo-700' : 'text-slate-500'
          }`}>
            {dayNum}
          </span>

          {/* Dots Indicator */}
          <div className="flex gap-1 mt-1 pb-1">
            {hasCompleted && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Completed Clean" />}
            {hasScheduled && <span className="h-2 w-2 rounded-full bg-teal-400" title="Scheduled Clean" />}
            {hasMissedOrCancelled && <span className="h-2 w-2 rounded-full bg-slate-400" title="Missed/Cancelled" />}
          </div>
        </button>
      );
    }

    return dayCells;
  };

  // Filter jobs for selected calendar date
  const getSelectedDateJobs = () => {
    const selectedStr = selectedCalendarDate.toISOString().split('T')[0];
    return jobs.filter(j => {
      const jDateStr = new Date(j.ScheduledDate).toISOString().split('T')[0];
      return jDateStr === selectedStr;
    });
  };

  const selectedDateJobs = getSelectedDateJobs();

  // Helper to format local photos paths
  const getImageSrc = (photo) => {
    if (photo.DriveURL) return photo.DriveURL;
    if (photo.DriveFileID && !photo.DriveFileID.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : '';
      return `${baseUrl}/uploads/${photo.DriveFileID}`;
    }
    return photo.DriveFileID;
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Upcoming Schedule</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Audit your scheduled bookings and download after photos
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl w-fit self-end sm:self-center">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs italic">
            No schedule occurrences scheduled in the next 30 days.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isScheduled = job.Status === 'scheduled';
              return (
                <div 
                  key={job.ServiceRecordID} 
                  className={`bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-3 flex-1 text-xs">
                    <div className="flex items-center flex-wrap gap-2.5">
                      {getStatusBadge(job.Status)}
                      <span className="font-bold text-slate-850 text-sm">
                        {formatDate(job.ScheduledDate)} ({getDayName(job.ScheduledDate)})
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-0.5 font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{job.AddressLine}, {job.City}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Estimated clean duration: {job.EstimatedHours} hours starting at {formatTime(job.ScheduledStart)}</span>
                      </div>
                    </div>

                    {/* Buffer Lock Warning */}
                    {isScheduled && job.isLocked && (
                      <div className="max-w-md mt-2">
                        <BufferLockNotice message={job.lockMessage} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {isScheduled && !job.isLocked && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestChangeClick(job, 'cancel')}
                          className="py-1 px-3 text-xs font-bold border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                        >
                          Cancel Clean
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestChangeClick(job, 'reschedule')}
                          className="py-1 px-3 text-xs font-bold"
                        >
                          Reschedule
                        </Button>
                      </div>
                    )}

                    {job.Status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotosClick(job.ServiceRecordID)}
                        className="py-1.5 px-3 text-xs font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>View Photos</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* CALENDAR VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar Grid Container */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            {/* Calendar Month Selector Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-800">
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <button 
                  onClick={() => changeMonth(-1)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => changeMonth(1)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 select-none">
              {renderCalendarGrid()}
            </div>
          </div>

          {/* Details Pane for Selected Day */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              Details for {formatDate(selectedCalendarDate)}
            </h3>

            {selectedDateJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 font-semibold text-xs italic">
                No cleaning jobs scheduled on this date.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateJobs.map(job => (
                  <div key={job.ServiceRecordID} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs text-left text-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">
                        Arrival: {formatTime(job.ScheduledStart)}
                      </span>
                      {getStatusBadge(job.Status)}
                    </div>
                    
                    <p className="font-semibold text-slate-500 flex items-start gap-1">
                      <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{job.AddressLine}</span>
                    </p>

                    {job.Status === 'scheduled' && (
                      <div className="pt-2 flex flex-col gap-2">
                        {job.isLocked ? (
                          <BufferLockNotice message={job.lockMessage} />
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestChangeClick(job, 'cancel')}
                              className="py-1 px-2.5 text-[11px] font-bold flex-1 border-red-200 text-red-500 hover:bg-red-50"
                            >
                              Cancel Clean
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestChangeClick(job, 'reschedule')}
                              className="py-1 px-2.5 text-[11px] font-bold flex-1"
                            >
                              Reschedule
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {job.Status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotosClick(job.ServiceRecordID)}
                        className="w-full py-1 px-2.5 text-[11px] font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>View Photos</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Photos Lightbox Modal */}
      <Modal
        isOpen={photosModalOpen}
        onClose={() => setPhotosModalOpen(false)}
        title="Completed Job Photos"
      >
        <div className="space-y-4">
          {photosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-accent border-r-2" />
            </div>
          ) : photosList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center italic font-semibold py-6">
              No photos uploaded by cleaner for this job.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {photosList.map((photo, i) => (
                <div key={photo.ServicePhotoID || i} className="group relative aspect-square bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageSrc(photo)}
                    alt={`Job photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <a 
                    href={getImageSrc(photo)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px] uppercase bg-black/30"
                  >
                    Open Image
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Change Request Form Modal */}
      <RequestFormModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        selectedJob={selectedJobForRequest}
        onSubmit={handleRequestSubmit}
        loading={requestLoading}
      />
    </div>
  );
};

export default CustomerSchedulePage;
