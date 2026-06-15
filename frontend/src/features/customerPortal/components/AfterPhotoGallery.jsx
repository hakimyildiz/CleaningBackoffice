import React, { useState } from 'react';
import { formatDate, formatTime } from '../../../utils/formatters';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react';

export const AfterPhotoGallery = ({ lastCompletedJob }) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  if (!lastCompletedJob || !lastCompletedJob.photos || lastCompletedJob.photos.length === 0) {
    return null;
  }

  const { photos, scheduledDate } = lastCompletedJob;

  const openLightbox = (index) => {
    setActivePhotoIndex(index);
  };

  const closeLightbox = () => {
    setActivePhotoIndex(null);
  };

  const showPrev = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const showNext = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Get image source URL: if it contains http/https, use directly. Otherwise append VITE_API_URL or base path.
  const getImageSrc = (photo) => {
    if (photo.DriveURL) return photo.DriveURL;
    // Fallback if local file ID is used
    if (photo.DriveFileID && !photo.DriveFileID.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : '';
      return `${baseUrl}/uploads/${photo.DriveFileID}`;
    }
    return photo.DriveFileID;
  };

  const formattedUploadTime = photos[0]?.UploadedAt 
    ? formatTime(photos[0].UploadedAt.split('T')[1] || '') 
    : '—';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-500" />
            <span>Your last cleaning — {formatDate(scheduledDate)}</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Uploaded by cleaning team at {formattedUploadTime}
          </p>
        </div>
      </div>

      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <button
            key={photo.ServicePhotoID || index}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square bg-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden focus:outline-hidden hover:opacity-95 transition-all"
          >
            <img
              src={getImageSrc(photo)}
              alt={`After clean details ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/95 text-slate-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-xl shadow-sm tracking-wider">
                Zoom
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {activePhotoIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={showPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Center Image Container */}
          <div className="max-w-[90vw] max-h-[80vh] flex flex-col items-center">
            <img
              src={getImageSrc(photos[activePhotoIndex])}
              alt={`Zoomed view ${activePhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            />
            <p className="text-white text-xs font-bold mt-4 tracking-wider uppercase bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
              Photo {activePhotoIndex + 1} of {photos.length}
            </p>
          </div>

          {/* Right Arrow */}
          <button
            onClick={showNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AfterPhotoGallery;
