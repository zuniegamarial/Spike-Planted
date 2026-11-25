import { useEffect, useState } from 'react';
import {
  Play,
  Circle,
  Clock,
  Calendar,
  FileText,
  Star,
  Square,
  CheckCircle2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTimer } from '../../context/TimerContext';
import { api } from '../../api/axios';

const FALLBACK_DOC_TYPES = [
  'MOA',
  'Insurance',
  'Endorsement Letter',
  'Medical Certificate'
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { fetchActiveSession } = useTimer();

  const [attendance, setAttendance] = useState({
    summary: null,
    records: []
  });
  const [requirements, setRequirements] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const REQUIRED_HOURS = 486;

  const fetchAll = async () => {
    try {
      const [attRes, reqRes, docsRes] = await Promise.all([
        api.get('/ojt/my-attendance'),
        api.get('/documents/requirements').catch(() => ({ data: { requirements: [] } })),
        api.get('/documents/my-documents').catch(() => ({ data: { documents: [] } }))
      ]);

      const data = attRes.data;

      setAttendance({
        summary: data.summary,
        records: data.attendance || []
      });

      const activeReqs = (reqRes.data?.requirements || []).filter(
        (item) => item.isActive !== false && item.title !== 'Other'
      );
      setRequirements(activeReqs);
      setMyDocuments(docsRes.data?.documents || []);

      setError('');
    } catch (err) {
      console.error('Attendance loading error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load attendance records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const activeSession = attendance.records.find(
    (record) => !record.timeOut
  );

  const handleTime = async (action) => {
    try {
      setBusy(true);
      setError('');

      const manilaTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date());

      if (action === 'time-in') {
        await api.post('/ojt/time-in');
        addNotification(
          `You have successfully timed in at ${manilaTime}.`,
          'success'
        );
      } else {
        await api.post('/ojt/time-out');
        addNotification(
          `You have successfully timed out at ${manilaTime}.`,
          'success'
        );
      }

      await fetchAll();
      await fetchActiveSession();
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

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const dateStr = format(d, 'yyyy-MM-dd');

    const record = attendance.records.find(
      (r) => r.attendanceDate === dateStr
    );

    return {
      day: format(d, 'EEE'),
      hours: record?.totalHours || 0
    };
  });

  const totalHours = attendance.summary?.totalHours || 0;

  const percent = Math.min(
    100,
    Math.round((totalHours / REQUIRED_HOURS) * 100)
  );

  const todayRecords = attendance.records.filter(
    (r) => r.attendanceDate === todayStr
  );

  const todayHours = todayRecords.reduce(
    (sum, record) => sum + (record.totalHours || 0),
    0
  );

  const pendingAttendanceCount = attendance.records.filter(
    (r) => r.status === 'Pending'
  ).length;

  const pendingDocsCount = myDocuments.filter(
    (d) => d.status === 'Pending'
  ).length;

  const pendingCount = pendingAttendanceCount + pendingDocsCount;

  const checklistItems =
    requirements.length > 0
      ? requirements.map((reqItem) => ({
          id: reqItem._id || reqItem.title,
          title: reqItem.title
        }))
      : FALLBACK_DOC_TYPES.map((title) => ({
          id: title,
          title
        }));

  const getDocStatusForTitle = (title) => {
    const matchingDocs = myDocuments.filter(
      (doc) => (doc.documentType || '').toLowerCase() === title.toLowerCase()
    );

    if (matchingDocs.some((doc) => doc.status === 'Approved')) {
      return 'Approved';
    }
    if (matchingDocs.some((doc) => doc.status === 'Pending')) {
      return 'Pending';
    }
    if (matchingDocs.some((doc) => doc.status === 'Rejected')) {
      return 'Rejected';
    }
    return 'Missing';
  };

  const approvedCount = checklistItems.filter(
    (item) => getDocStatusForTitle(item.title) === 'Approved'
  ).length;

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
              type="button"
              onClick={() =>
                handleTime(activeSession ? 'time-out' : 'time-in')
              }
              disabled={busy}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-card hover:shadow-lg transition disabled:opacity-50"
            >
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                {activeSession ? (
                  <Square size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
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
          <h3 className="font-extrabold mb-4 text-text">Today's Activity</h3>

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
                {approvedCount}/{checklistItems.length}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                <Circle size={12} /> Pending
              </div>
              <p className="text-xl font-extrabold text-warning">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                <Calendar size={12} /> Journals
              </div>
              <p className="text-xl font-extrabold text-text">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Hours */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">Total Hours</h3>

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
          <h3 className="font-extrabold mb-4 text-text">This Week's Hours</h3>

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
          <h3 className="font-extrabold mb-4 text-text">Required Documents</h3>

          <div className="space-y-2">
            {checklistItems.map((item) => {
              const status = getDocStatusForTitle(item.title);
              const isApproved = status === 'Approved';
              const isPending = status === 'Pending';
              const isRejected = status === 'Rejected';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-background"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isApproved ? (
                      <CheckCircle2
                        size={16}
                        className="text-success shrink-0"
                      />
                    ) : (
                      <Circle size={16} className="text-muted shrink-0" />
                    )}
                    <span className="text-xs font-medium text-text truncate">
                      {item.title}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      isApproved
                        ? 'bg-green-100 text-success'
                        : isPending
                          ? 'bg-amber-100 text-warning'
                          : isRejected
                            ? 'bg-red-100 text-danger'
                            : 'bg-gray-100 text-muted'
                    }`}
                  >
                    {status}
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