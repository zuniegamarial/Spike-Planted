import { useEffect, useState } from 'react';
import {
  Play, Circle, Clock, Calendar, FileText, Star, Square, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [attendance, setAttendance] = useState({
    summary: null,
    records: []
  });

  const [pendingSummary, setPendingSummary] = useState({
    documents: 0,
    journals: 0,
    attendance: 0,
    total: 0
  });

  const [requiredDocs, setRequiredDocs] = useState([]);
  const [myDocs, setMyDocs] = useState([]);
  const [showPendingPopover, setShowPendingPopover] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const REQUIRED_HOURS = 486;

  const fetchAll = async () => {
    try {
      const [attRes, profileRes, reqRes, docsRes] = await Promise.all([
        api.get('/ojt/my-attendance'),
        api.get('/profile'),
        api.get('/documents/requirements'),
        api.get('/documents/my-documents')
      ]);

      const data = attRes.data;

      setAttendance({
        summary: data.summary,
        records: data.attendance || []
      });

      if (profileRes.data.pendingSummary) {
        setPendingSummary(profileRes.data.pendingSummary);
      }

      setRequiredDocs(reqRes.data.requirements || []);
      setMyDocs(docsRes.data.documents || []);

      setError('');
    } catch (err) {
      console.error('Dashboard loading error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const activeSession = attendance.records.find(
    record => !record.timeOut && record.status !== 'Rejected'
  );

  const handleTime = async (action) => {
    try {
      setBusy(true);
      setError('');

      if (action === 'time-in') {
        await api.post('/ojt/time-in');
        addNotification('You have successfully timed in.', 'success');
      } else {
        await api.post('/ojt/time-out');
        addNotification('You have successfully timed out.', 'success');
      }

      await fetchAll();
    } catch (err) {
      console.error('Attendance action error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to process attendance. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const getToday = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

  const todayStr = getToday();

  const nonRejectedRecords = attendance.records.filter(
    r => r.status !== 'Rejected'
  );

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const dateStr = format(d, 'yyyy-MM-dd');

    const dayHours = nonRejectedRecords
      .filter(r => r.attendanceDate === dateStr)
      .reduce((sum, r) => sum + (r.totalHours || 0), 0);

    return {
      day: format(d, 'EEE'),
      hours: Number(dayHours.toFixed(2))
    };
  });

  const computedNonRejectedHours = nonRejectedRecords.reduce(
    (sum, r) => sum + (r.totalHours || 0),
    0
  );

  const totalHours =
    typeof attendance.summary?.totalHours === 'number'
      ? attendance.summary.totalHours
      : Number(computedNonRejectedHours.toFixed(2));

  const percent = Math.min(
    100,
    Math.round((totalHours / REQUIRED_HOURS) * 100)
  );

  const todayRecords = nonRejectedRecords.filter(
    r => r.attendanceDate === todayStr
  );

  const todayHours = todayRecords.reduce(
    (sum, record) => sum + (record.totalHours || 0),
    0
  );

  const docChecklist = requiredDocs.map((reqItem) => {
    const submitted = myDocs.find(
      (doc) =>
        (doc.documentType || '').toLowerCase() ===
        (reqItem.title || '').toLowerCase()
    );
    return {
      id: reqItem._id,
      title: reqItem.title,
      dueDate: reqItem.dueDate,
      status: submitted ? submitted.status : 'Missing'
    };
  });

  const approvedDocsCount = docChecklist.filter(
    (item) => item.status === 'Approved'
  ).length;
  const totalDocsCount = docChecklist.length;

  if (loading) {
    return (
      <div className="p-10 text-center text-primary font-bold">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-extrabold text-text">
          Hello, {user?.fullName?.split(' ')[0] || 'Student'}
        </h1>

        <p className="text-sm text-muted mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* OJT Progress */}
        <div className="lg:col-span-2 rounded-3xl bg-primary-light p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-card">

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/40 px-3 py-1.5 rounded-full text-primary">
              <Star size={14} /> OJT Progress
            </span>

            <h2 className="text-2xl lg:text-3xl font-extrabold mt-4 max-w-xs leading-tight text-primary-dark">
              {totalHours >= REQUIRED_HOURS
                ? "You've completed your required hours!"
                : `Keep going — ${Math.max(0, REQUIRED_HOURS - totalHours).toFixed(2)} hrs to go`}
            </h2>
          </div>

          <div className="relative z-10 flex items-center gap-3 mt-6">

            <button
              onClick={() =>
                handleTime(activeSession ? 'time-out' : 'time-in')
              }
              disabled={busy}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-card hover:shadow-lg transition disabled:opacity-50"
            >
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                {activeSession
                  ? <Square size={14} fill="currentColor" />
                  : <Play size={14} fill="currentColor" />}
              </span>

              {busy
                ? 'Please wait…'
                : activeSession
                  ? 'Time Out'
                  : 'Time In'}
            </button>

            {activeSession && (
              <p className="text-xs font-medium text-primary-dark">
                Timer started at{' '}
                {format(new Date(activeSession.timeIn), 'h:mm a')}
              </p>
            )}
          </div>

          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute right-12 top-4 w-24 h-24 rounded-full bg-white/30" />
        </div>

        {/* Today's Activity */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">
            Today's Activity
          </h3>

          <div className="grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-primary-light p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                <Clock size={12} /> Hours
              </div>
              <p className="text-xl font-extrabold text-primary-dark">
                {todayHours.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                <FileText size={12} /> Docs
              </div>
              <p className="text-xl font-extrabold text-success">
                {approvedDocsCount}/{totalDocsCount}
              </p>
            </div>

            {/* PENDING TILE WITH POPOVER */}
            <div className="relative">
              <div
                onClick={() => setShowPendingPopover(!showPendingPopover)}
                className="rounded-2xl bg-orange-50 p-3 cursor-pointer hover:bg-orange-100 transition border border-orange-100 h-full"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <Circle size={12} /> Pending
                </div>
                <p className="text-xl font-extrabold text-warning">
                  {pendingSummary.total}
                </p>
              </div>

              {showPendingPopover && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPendingPopover(false)}></div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-border p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                      <h4 className="text-sm font-bold text-text flex items-center gap-2">
                        <AlertCircle size={14} className="text-warning" /> Pending Items
                      </h4>
                      <button onClick={() => setShowPendingPopover(false)} className="text-muted hover:text-text"><X size={14}/></button>
                    </div>

                    {pendingSummary.total === 0 ? (
                      <p className="text-xs text-muted text-center py-2">All caught up! No pending items.</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingSummary.documents > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">Documents</span>
                            <span className="font-bold text-text bg-orange-50 px-2 py-0.5 rounded-md">{pendingSummary.documents}</span>
                          </div>
                        )}
                        {pendingSummary.journals > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">Journals</span>
                            <span className="font-bold text-text bg-orange-50 px-2 py-0.5 rounded-md">{pendingSummary.journals}</span>
                          </div>
                        )}
                        {pendingSummary.attendance > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">Attendance</span>
                            <span className="font-bold text-text bg-orange-50 px-2 py-0.5 rounded-md">{pendingSummary.attendance}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-border rotate-45"></div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                <Calendar size={12} /> Journals
              </div>
              <p className="text-xl font-extrabold text-text">
                {pendingSummary.journals}
              </p>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Total Hours */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">
            Total Hours
          </h3>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44">

              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />

                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#14532d"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(percent / 100) * 264} 264`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-primary-dark">
                  {totalHours.toFixed(1)}
                </span>

                <span className="text-xs text-muted">
                  {percent}% of {REQUIRED_HOURS}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">
            This Week's Hours
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={last7Days}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />

              <YAxis hide />

              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              />

              <Line
                type="monotone"
                dataKey="hours"
                stroke="#15803d"
                strokeWidth={3}
                dot={{ r: 4, fill: '#15803d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Required Documents */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">
            Required Documents
          </h3>

          <div className="space-y-2">
            {docChecklist.map((item) => {
              const badgeClass =
                item.status === 'Approved'
                  ? 'bg-green-100 text-success'
                  : item.status === 'Pending'
                  ? 'bg-amber-100 text-warning'
                  : item.status === 'Rejected'
                  ? 'bg-red-100 text-danger'
                  : 'bg-gray-100 text-muted';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-background"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.status === 'Approved' ? (
                      <CheckCircle2 size={16} className="text-success shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-xs font-medium text-text block truncate">
                        {item.title}
                      </span>
                      {item.dueDate && (
                        <span className="text-[10px] text-muted block">
                          Due {format(new Date(item.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${badgeClass}`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}