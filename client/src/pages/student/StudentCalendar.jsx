import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { zoomService } from '../../services/portalService';
import { IoCalendarOutline, IoVideocamOutline, IoChevronBackOutline, IoChevronForwardOutline, IoTimeOutline, IoPersonOutline } from 'react-icons/io5';

const STATUS_STYLES = {
  LIVE:      { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    label: '🔴 LIVE'      },
  SCHEDULED: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   label: 'Scheduled'    },
  ENDED:     { bg: 'bg-slate-50',  text: 'text-slate-400',  border: 'border-slate-200',  dot: 'bg-slate-400',  label: 'Ended'        },
  CANCELLED: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-400', label: 'Cancelled'    },
};

// Re-evaluate meeting status client-side so stale LIVE/SCHEDULED classes
// that have already passed show as ENDED without a page refresh.
function computeCurrentStatus(meeting) {
  const status = meeting.status;
  if (status !== 'LIVE' && status !== 'SCHEDULED') return status;
  const start = new Date(meeting.startTime);
  const end = new Date(start.getTime() + (meeting.duration || 60) * 60 * 1000);
  if (new Date() > end) return 'ENDED';
  return status;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarGrid({ year, month, meetings, selectedDay, onSelectDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Build a Set of "YYYY-M-D" strings that have meetings
  const meetingDays = useMemo(() => {
    const s = new Set();
    meetings.forEach((m) => {
      const d = new Date(m.startTime);
      s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return s;
  }, [meetings]);

  const liveMeetingDays = useMemo(() => {
    const s = new Set();
    meetings.filter(m => computeCurrentStatus(m) === 'LIVE').forEach((m) => {
      const d = new Date(m.startTime);
      s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return s;
  }, [meetings]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const key = `${year}-${month}-${day}`;
          const hasMeeting = meetingDays.has(key);
          const hasLive = liveMeetingDays.has(key);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer
                ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : isToday ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}
              `}
            >
              {day}
              {hasMeeting && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasLive ? 'bg-red-500' : isSelected ? 'bg-white' : 'bg-primary-400'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentCalendar() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await zoomService.getCalendar();
        setMeetings(data.data.meetings || []);
      } catch (e) {
        console.error('Calendar fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Filter meetings for currently viewed month
  const monthMeetings = useMemo(() => meetings.filter((m) => {
    const d = new Date(m.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  }), [meetings, year, month]);

  // Filter meetings for selected day (or all for month if no day selected)
  const displayedMeetings = useMemo(() => {
    if (selectedDay === null) {
      // Show all upcoming / today's meetings across all time
      return [...meetings]
        .filter(m => {
          const s = computeCurrentStatus(m);
          return s !== 'ENDED' && s !== 'CANCELLED';
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    return monthMeetings.filter((m) => {
      const d = new Date(m.startTime);
      return d.getDate() === selectedDay;
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [selectedDay, monthMeetings, meetings]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary-900 flex items-center gap-3">
          <IoCalendarOutline size={28} className="text-primary-600" />
          Class Calendar
        </h1>
        <p className="text-sm text-slate-500 mt-1">View all your scheduled and live classes in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Calendar ── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors">
              <IoChevronBackOutline size={18} />
            </button>
            <h2 className="text-base font-bold text-slate-800">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors">
              <IoChevronForwardOutline size={18} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              meetings={monthMeetings}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Live Now
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-primary-400 inline-block" /> Scheduled
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-xl bg-primary-50 border border-primary-200 inline-block" /> Today
            </span>
          </div>
        </div>

        {/* ── Sessions panel ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">
              {selectedDay
                ? `Classes on ${MONTHS[month]} ${selectedDay}`
                : 'Upcoming Classes'}
            </h3>

            {displayedMeetings.length === 0 ? (
              <div className="py-10 text-center">
                <IoCalendarOutline size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  {selectedDay ? 'No classes scheduled for this day.' : 'No upcoming classes.'}
                </p>
                {selectedDay && (
                  <button onClick={() => setSelectedDay(null)} className="mt-2 text-xs text-primary-600 hover:underline cursor-pointer">
                    View all upcoming →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {displayedMeetings.map((meeting) => {
                  const currentStatus = computeCurrentStatus(meeting);
                  const style = STATUS_STYLES[currentStatus] || STATUS_STYLES.ENDED;
                  const startDate = new Date(meeting.startTime);
                  const isLive = currentStatus === 'LIVE';

                  return (
                    <div
                      key={meeting.id}
                      className={`p-4 rounded-xl border ${style.border} ${style.bg} space-y-2.5`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{meeting.topic}</p>
                          <p className="text-xs text-slate-500 truncate">{meeting.course?.title}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${style.border} ${style.text} ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${isLive ? 'animate-pulse' : ''}`} />
                          {style.label}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <IoTimeOutline size={12} />
                          {startDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          {' '}· {meeting.duration} min
                        </div>
                        {meeting.instructor && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <IoPersonOutline size={12} />
                            {meeting.instructor.name}
                          </div>
                        )}
                      </div>

                      {isLive && (
                        <Link to={`/zoom-classroom/${meeting.meetingId}?courseId=${meeting.course?.id}`}>
                          <button className="w-full mt-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                            <IoVideocamOutline size={14} /> Join Live Class
                          </button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats pill */}
          <div className="grid grid-cols-3 gap-3">
            {[
                          { label: 'Live Now',  count: meetings.filter(m => computeCurrentStatus(m) === 'LIVE').length,      color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
              { label: 'Upcoming', count: meetings.filter(m => computeCurrentStatus(m) === 'SCHEDULED').length,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
              { label: 'Total',    count: meetings.length,                                         color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-100' },
            ].map(({ label, count, color, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-[10px] text-slate-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
