"use client";
import { useState, useEffect } from 'react';
import { cleanersApi, type Cleaner } from '../lib/api';
import { LuPlus as Plus, LuSearch as Search, LuEdit as Edit, LuTrash2 as Trash2, LuPhone as Phone, LuMail as Mail, LuMapPin as MapPin, LuUserCheck as UserCheck, LuX as X, LuSave as Save } from 'react-icons/lu';

export function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState<Cleaner | null>(null);
  const [formData, setFormData] = useState<Partial<Cleaner>>({});

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      const data = await cleanersApi.getAll();
      setCleaners(data || []);
    } catch (err) {
      console.error('Error fetching cleaners:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCleaners = cleaners.filter((c) =>
    `${c.FirstName} ${c.SureName} ${c.Email} ${c.MobilePhone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCleaner) {
        await cleanersApi.update(editingCleaner.CleanerID, formData);
      } else {
        await cleanersApi.create(formData);
      }
      fetchCleaners();
      setShowForm(false);
      setEditingCleaner(null);
      setFormData({});
    } catch (err) {
      console.error('Error saving cleaner:', err);
    }
  };

  const handleEdit = (cleaner: Cleaner) => {
    setEditingCleaner(cleaner);
    setFormData(cleaner);
    setShowForm(true);
  };

  const handleDelete = async (cleanerId: number) => {
    if (confirm('Are you sure you want to delete this cleaner?')) {
      try {
        await cleanersApi.delete(cleanerId);
        fetchCleaners();
      } catch (err) {
        console.error('Error deleting cleaner:', err);
      }
    }
  };

  const handleToggleActive = async (cleaner: Cleaner) => {
    try {
      await cleanersApi.toggleActive(cleaner.CleanerID);
      fetchCleaners();
    } catch (err) {
      console.error('Error updating cleaner:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cleaners</h1>
          <p className="text-slate-500 text-sm mt-1">{cleaners.length} cleaners registered</p>
        </div>
        <button
          onClick={() => { setEditingCleaner(null); setFormData({}); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Cleaner
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cleaners..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCleaners.map((cleaner) => (
          <div key={cleaner.CleanerID} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {cleaner.Title} {cleaner.FirstName} {cleaner.SureName}
                  </h3>
                  <p className="text-sm text-slate-500">{cleaner.Occupation || 'Cleaner'}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${cleaner.IsActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {cleaner.IsActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              {cleaner.Email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span>{cleaner.Email}</span></div>}
              {cleaner.MobilePhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span>{cleaner.MobilePhone}</span></div>}
              {cleaner.City && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /><span>{cleaner.City}</span></div>}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-sm">
                <span className="text-slate-500">Rate:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {cleaner.Rate?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) || 'N/A'}/hr
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(cleaner)}
                  className={`p-2 rounded-lg transition-colors ${cleaner.IsActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                >
                  <UserCheck className="h-4 w-4" />
                </button>
                <button onClick={() => handleEdit(cleaner)} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(cleaner.CleanerID)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCleaners.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <UserCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <p>No cleaners found</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">{editingCleaner ? 'Edit Cleaner' : 'Add New Cleaner'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <select value={formData.Title || ''} onChange={(e) => setFormData({ ...formData, Title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input type="text" value={formData.FirstName || ''} onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Surname *</label>
                  <input type="text" value={formData.SureName || ''} onChange={(e) => setFormData({ ...formData, SureName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.Email || ''} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Phone</label>
                  <input type="tel" value={formData.MobilePhone || ''} onChange={(e) => setFormData({ ...formData, MobilePhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Home Phone</label>
                  <input type="tel" value={formData.HomePhone || ''} onChange={(e) => setFormData({ ...formData, HomePhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Work Phone</label>
                  <input type="tel" value={formData.WorkPhone || ''} onChange={(e) => setFormData({ ...formData, WorkPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" value={formData.AddressLine || ''} onChange={(e) => setFormData({ ...formData, AddressLine: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" value={formData.City || ''} onChange={(e) => setFormData({ ...formData, City: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Post Code</label>
                  <input type="text" value={formData.PostCode || ''} onChange={(e) => setFormData({ ...formData, PostCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Birth Date</label>
                  <input type="date" value={formData.BrithDate || ''} onChange={(e) => setFormData({ ...formData, BrithDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select value={formData.Gender || ''} onChange={(e) => setFormData({ ...formData, Gender: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rate (per hour) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                    <input type="number" step="0.01" value={formData.Rate || ''} onChange={(e) => setFormData({ ...formData, Rate: parseFloat(e.target.value) })} className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NI Number</label>
                  <input type="text" value={formData.NINo || ''} onChange={(e) => setFormData({ ...formData, NINo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={formData.Note || ''} onChange={(e) => setFormData({ ...formData, Note: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={formData.IsActive !== false} onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="h-4 w-4" />
                  {editingCleaner ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
