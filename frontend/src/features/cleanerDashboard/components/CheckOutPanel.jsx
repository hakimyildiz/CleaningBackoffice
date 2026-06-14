import React, { useState, useRef } from 'react';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import { Camera, X, AlertTriangle } from 'lucide-react';

export const CheckOutPanel = ({ 
  serviceRecordId,
  requirePhoto = true, 
  onCheckOut, 
  onCancel 
}) => {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]); // array of { file, preview, id, type: 'after' }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Limits: Max 10 files
    if (files.length + selectedFiles.length > 10) {
      setError('Cannot upload more than 10 files per request.');
      return;
    }

    const nextFiles = selectedFiles.map((file, idx) => {
      // Size limit: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds the 10MB limit.`);
        return null;
      }
      return {
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        type: 'after' // default: After
      };
    }).filter(Boolean);

    setError('');
    setFiles((prev) => [...prev, ...nextFiles]);
  };

  const handleRemoveFile = (id, preview) => {
    URL.revokeObjectURL(preview);
    setFiles((prev) => prev.filter(f => f.id !== id));
  };

  const handleTypeChange = (id, type) => {
    setFiles((prev) => prev.map(f => f.id === id ? { ...f, type } : f));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (requirePhoto && files.length === 0) {
      setError('At least one photo is required to check out.');
      return;
    }

    setLoading(true);
    setError('');

    const executeCheckout = (lat, lng) => {
      const formData = new FormData();
      formData.append('lat', lat !== null ? String(lat) : '');
      formData.append('lng', lng !== null ? String(lng) : '');
      formData.append('note', note.trim());
      
      files.forEach(f => {
        formData.append('photos', f.file);
        formData.append('photoTypes', f.type);
      });

      onCheckOut(serviceRecordId, formData)
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to complete check out.');
        })
        .finally(() => setLoading(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          executeCheckout(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation capture failed, checking out without GPS:', err.message);
          executeCheckout(null, null);
        },
        { timeout: 5000 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      executeCheckout(null, null);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-4 text-left">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
        Complete Checkout Details
      </h3>

      {error && (
        <div className="mb-4 flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl text-xs font-semibold leading-relaxed">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Checkout Notes" error={null}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any details about the work done (e.g. issues, requests)..."
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all duration-150"
            disabled={loading}
          />
        </FormField>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Upload Checkout Photos {requirePhoto && <span className="text-red-500">* (At least 1 required)</span>}
          </label>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-250 hover:border-brand-accent hover:bg-slate-50/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-150"
          >
            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Drag & drop or Click to upload photos</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">JPEG, PNG, or WebP (Max 10MB each, up to 10 photos)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            {files.map((f) => (
              <div key={f.id} className="relative bg-white border border-slate-200 rounded-xl p-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveFile(f.id, f.preview)}
                  className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors z-10"
                  disabled={loading}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                
                <img 
                  src={f.preview} 
                  alt="preview" 
                  className="w-full h-24 object-cover rounded-lg"
                />
                
                <select
                  value={f.type}
                  onChange={(e) => handleTypeChange(f.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 rounded p-1 focus:outline-none"
                  disabled={loading}
                >
                  <option value="after">After</option>
                  <option value="before">Before</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-5 font-bold text-slate-700 bg-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={loading}
            isLoading={loading}
            className="px-5 font-black bg-rose-600 hover:bg-rose-700 border-rose-600 shadow-sm"
          >
            Confirm Check Out
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CheckOutPanel;
