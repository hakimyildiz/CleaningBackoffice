import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import AgencyScheduleTable from '../components/AgencyScheduleTable';
import AgencyRequestFormModal from '../components/AgencyRequestFormModal';
import { Calendar, Filter, User } from 'lucide-react';

export const AgencySchedulePage = () => {
  const { role } = useAuth();
  const { addToast } = useToast();
  
  const [schedule, setSchedule] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Request modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      const scheduleResult = await agencyPortalService.getSchedule();
      setSchedule(scheduleResult.data || []);

      if (role === 'agency_manager') {
        const staffResult = await agencyPortalService.getStaffAssignments();
        setStaffList(staffResult.data || []);
      }
    } catch (err) {
      addToast('Failed to load schedule data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, addToast]);

  const handleRequestChangeClick = (job) => {
    setSelectedJob(job);
    setModalOpen(true);
  };

  const handleRequestSubmit = async (requestData) => {
    setModalLoading(true);
    try {
      await agencyPortalService.submitRequest(requestData);
      addToast('Your change request has been submitted successfully.', 'success');
      setModalOpen(false);
      fetchData(); // reload schedule to see if status or lock updates
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to submit request.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Filter schedule based on selected staff member
  const filteredSchedule = schedule.filter((job) => {
    if (selectedStaffId === 'all') return true;
    return parseInt(job.AgencyStaffID, 10) === parseInt(selectedStaffId, 10);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-accent" />
            <span>Schedule</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {role === 'agency_staff' 
              ? 'Your upcoming cleaning assignments'
              : 'Upcoming cleanings across the agency'}
          </p>
        </div>

        {/* Manager staff filter */}
        {role === 'agency_manager' && staffList.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl py-1.5 px-3 self-start sm:self-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mr-1">Filter Staff:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-transparent border-0 py-0.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-0 cursor-pointer"
            >
              <option value="all">All Staff</option>
              {staffList.map((staff) => (
                <option key={staff.AgencyStaffID} value={staff.AgencyStaffID}>
                  {staff.FirstName} {staff.SureName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Schedule Table Component */}
      <AgencyScheduleTable
        schedule={filteredSchedule}
        role={role}
        onRequestChange={handleRequestChangeClick}
      />

      {/* Request Change Modal */}
      <AgencyRequestFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedJob={selectedJob}
        onSubmit={handleRequestSubmit}
        loading={modalLoading}
      />
    </div>
  );
};

export default AgencySchedulePage;
