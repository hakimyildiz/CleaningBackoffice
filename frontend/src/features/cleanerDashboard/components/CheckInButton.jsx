import React, { useState } from 'react';
import Button from '../../../components/common/Button';
import { PlayCircle } from 'lucide-react';

export const CheckInButton = ({ 
  scheduleId, 
  onCheckIn, 
  disabled = false,
  disabledReason = ''
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckInClick = () => {
    if (disabled) return;
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          onCheckIn(scheduleId, lat, lng).finally(() => setLoading(false));
        },
        (error) => {
          console.warn('Geolocation capture denied or failed:', error.message);
          // Gracefully proceed with null coordinates as per spec
          onCheckIn(scheduleId, null, null).finally(() => setLoading(false));
        },
        { timeout: 5000 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      onCheckIn(scheduleId, null, null).finally(() => setLoading(false));
    }
  };

  return (
    <div className="relative group w-full sm:w-auto">
      <Button
        onClick={handleCheckInClick}
        disabled={disabled || loading}
        isLoading={loading}
        variant="primary"
        className="w-full sm:w-auto font-black flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-sm px-6 py-2.5 rounded-xl transition-all duration-150"
      >
        <PlayCircle className="w-5 h-5" />
        <span>Check In</span>
      </Button>
      
      {disabled && disabledReason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-20">
          {disabledReason}
        </div>
      )}
    </div>
  );
};

export default CheckInButton;
