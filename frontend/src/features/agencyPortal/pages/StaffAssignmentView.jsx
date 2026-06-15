import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import { UserCheck, Info, Building2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export const StaffAssignmentView = () => {
  const { role } = useAuth();
  const { addToast } = useToast();

  const [staffAssignments, setStaffAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const result = await agencyPortalService.getStaffAssignments();
        setStaffAssignments(result.data || []);
      } catch (err) {
        addToast('Failed to load staff assignments.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (role === 'agency_manager') {
      fetchAssignments();
    } else {
      setLoading(false);
    }
  }, [role, addToast]);

  const toggleRow = (staffId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  if (role !== 'agency_manager') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center text-red-650 max-w-lg mx-auto mt-12 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-black">Access Denied</h2>
        <p className="text-xs font-semibold mt-1">Staff assignment overview is only visible to agency managers.</p>
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
          <UserCheck className="w-6 h-6 text-brand-accent" />
          <span>Staff Assignments</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          View which agency staff member is assigned to manage which property
        </p>
      </div>

      {/* Info notice box */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-150 rounded-2xl p-4 text-xs text-blue-700 font-semibold shadow-2xs">
        <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
        <div>
          <p className="font-bold">Read-Only Overview</p>
          <p className="font-medium mt-0.5">
            This dashboard displays current property managers for informational purposes. To reassign staff to specific properties, please contact your Mopsy administrator.
          </p>
        </div>
      </div>

      {/* Staff assignments table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        {staffAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs italic">
            No agency staff assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Agency Role</th>
                  <th className="px-6 py-4">Managed Properties Count</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-605">
                {staffAssignments.map((staff) => {
                  const isExpanded = !!expandedRows[staff.AgencyStaffID];
                  const hasProps = staff.properties && staff.properties.length > 0;
                  
                  return (
                    <React.Fragment key={staff.AgencyStaffID}>
                      {/* Parent Row */}
                      <tr 
                        onClick={() => hasProps && toggleRow(staff.AgencyStaffID)}
                        className={`hover:bg-slate-50/50 transition-colors ${hasProps ? 'cursor-pointer' : 'select-none opacity-80'}`}
                      >
                        <td className="px-6 py-4.5 whitespace-nowrap font-bold text-slate-800">
                          {staff.FirstName} {staff.SureName}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <span className="font-bold capitalize text-slate-500">
                            {staff.Role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap font-black text-slate-800">
                          {staff.properties?.length || 0}
                        </td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          {hasProps ? (
                            <button className="p-1.5 hover:bg-slate-150 rounded-xl inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 transition-colors">
                              <span>{isExpanded ? 'Hide Properties' : 'View Properties'}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] font-semibold pr-2">No properties</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Child Row */}
                      {isExpanded && hasProps && (
                        <tr>
                          <td colSpan="4" className="bg-slate-50/50 px-8 py-4 border-t border-b border-slate-150">
                            <div className="space-y-2.5">
                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">
                                Assigned Properties List
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {staff.properties.map((p) => (
                                  <div 
                                    key={p.ServiceID}
                                    className="bg-white border border-slate-200 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-xs transition-shadow"
                                  >
                                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-indigo-500 shrink-0">
                                      <Building2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="text-left font-semibold">
                                      <p className="text-xs text-slate-800 font-bold leading-snug">{p.AddressLine}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{p.City}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAssignmentView;
