import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/portalService';
import {
  IoVolumeHighOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5';

const severityStyles = {
  INFO: 'bg-blue-50 text-blue-800 border-blue-100',
  WARNING: 'bg-amber-50 text-amber-800 border-amber-100',
  ALERT: 'bg-red-50 text-red-800 border-red-150',
};

const severityIcons = {
  INFO: <IoInformationCircleOutline size={18} className="text-blue-500 shrink-0" />,
  WARNING: <IoAlertCircleOutline size={18} className="text-amber-500 shrink-0" />,
  ALERT: <IoVolumeHighOutline size={18} className="text-red-500 shrink-0" />,
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await adminService.getActiveAnnouncements();
        if (res.data?.data?.announcements) {
          setAnnouncements(res.data.data.announcements);
        }
      } catch (_) {
        // fail silently
      }
    };

    // Load dismissed announcement IDs from localStorage
    const saved = localStorage.getItem('dismissed_announcements');
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (_) {}
    }

    fetchActive();
  }, []);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full space-y-2 mb-6">
      {visibleAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-sans shadow-sm transition-all ${severityStyles[ann.type] || severityStyles.INFO}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {severityIcons[ann.type]}
            <div className="min-w-0">
              <span className="font-bold mr-1.5">{ann.title}:</span>
              <span className="opacity-90">{ann.body}</span>
            </div>
          </div>
          <button
            onClick={() => handleDismiss(ann.id)}
            className="p-1 hover:bg-black/5 rounded-lg shrink-0 transition-all cursor-pointer"
            title="Dismiss notification"
          >
            <IoCloseOutline size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
