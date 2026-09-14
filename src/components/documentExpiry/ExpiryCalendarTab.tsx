import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Eye,
  Building,
  User,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  ExpiryDocument,
  calculateDaysRemaining,
  getUrgencyLevel,
  getUrgencyBadge,
} from '../../types/documentExpiry';

interface ExpiryCalendarTabProps {
  documents: ExpiryDocument[];
  onSelectDocument: (doc: ExpiryDocument) => void;
  onOpenRenew: (doc: ExpiryDocument) => void;
}

export const ExpiryCalendarTab: React.FC<ExpiryCalendarTabProps> = ({
  documents,
  onSelectDocument,
  onOpenRenew,
}) => {
  // Current calendar view year & month (0-indexed month)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    today.toISOString().split('T')[0]
  );

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Build dates for current month grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  // Map documents by expiryDate: "YYYY-MM-DD" -> ExpiryDocument[]
  const docsByDate = useMemo(() => {
    const map: Record<string, ExpiryDocument[]> = {};
    documents.forEach((doc) => {
      if (!map[doc.expiryDate]) {
        map[doc.expiryDate] = [];
      }
      map[doc.expiryDate].push(doc);
    });
    return map;
  }, [documents]);

  // Selected date's documents
  const selectedDateDocs = docsByDate[selectedDayStr] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 Cols: Monthly Calendar Grid */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-[#0B5D2A] rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-[11px] text-slate-400">
                Visual expiry deadlines & statutory renewal schedule
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Expired</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Today / &lt;= 7 Days</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span>&lt;= 30 Days</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>&lt;= 90 Days</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active / Renewed</span>
          </span>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1 border-b border-slate-100">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 bg-slate-50/40 rounded-xl border border-transparent"></div>
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const isToday = dateStr === today.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDayStr;
            const dayDocs = docsByDate[dateStr] || [];

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => setSelectedDayStr(dateStr)}
                className={`h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : isToday
                    ? 'border-amber-300 bg-amber-50/30'
                    : dayDocs.length > 0
                    ? 'border-slate-300 bg-white hover:border-slate-400'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold rounded-md px-1.5 py-0.2 ${
                      isToday
                        ? 'bg-amber-500 text-white'
                        : isSelected
                        ? 'bg-[#168A45] text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayDocs.length > 0 && (
                    <span className="text-[9px] font-black px-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {dayDocs.length}
                    </span>
                  )}
                </div>

                {/* Event previews in cell */}
                <div className="space-y-0.5 overflow-hidden w-full">
                  {dayDocs.slice(0, 2).map((d) => {
                    const urgency = getUrgencyLevel(d);
                    const dotClass =
                      urgency === 'expired'
                        ? 'bg-red-500 text-red-950 border-red-200'
                        : urgency === 'expiring_today' || urgency === 'expiring_7d'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : urgency === 'expiring_30d'
                        ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                        : 'bg-blue-50 text-blue-900 border-blue-200';

                    return (
                      <div
                        key={d.id}
                        className={`text-[9px] truncate px-1 py-0.2 rounded border font-medium ${dotClass}`}
                      >
                        {d.documentName}
                      </div>
                    );
                  })}
                  {dayDocs.length > 2 && (
                    <div className="text-[8px] text-slate-400 font-bold pl-1">
                      +{dayDocs.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right 4 Cols: Day Details Drawer */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Date</span>
              <h3 className="text-sm font-bold text-slate-800 font-mono">{selectedDayStr}</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {selectedDateDocs.length} {selectedDateDocs.length === 1 ? 'Expiry' : 'Expiries'}
            </span>
          </div>

          {/* List of documents on this date */}
          <div className="mt-4 space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {selectedDateDocs.length > 0 ? (
              selectedDateDocs.map((doc) => {
                const days = calculateDaysRemaining(doc.expiryDate);
                const urgency = getUrgencyLevel(doc);
                const badge = getUrgencyBadge(urgency, days);

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {doc.documentTypeName}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">
                          {doc.documentName}
                        </h4>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ref #:</span>
                        <span className="font-mono font-semibold text-slate-700">{doc.referenceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Responsible:</span>
                        <span className="font-semibold text-slate-700">{doc.responsiblePerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dept:</span>
                        <span className="font-semibold text-slate-700">{doc.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-bold text-slate-800">
                          {doc.currency || 'INR'} {(doc.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRenew(doc)}
                        className="flex-1 py-1 px-2 rounded-lg bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renew</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No document expirations on this date.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click on highlighted calendar days with badges to inspect deadlines.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Footer Tip */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-[#0B5D2A]">
          <strong>Pro-Tip:</strong> The ERP automated background cron checks these dates daily and dispatches notifications via Email, SMS, WhatsApp, and Dashboard alerts.
        </div>
      </div>
    </div>
  );
};
