import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  BookOpen,
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

export default function ReviewSubmissions() {
  const [journals, setJournals] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('journals');
  const [reviewingId, setReviewingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [journalRes, attendanceRes] = await Promise.all([
        api.get('/weekly-journals/all'),
        api.get('/coordinator/attendance')
      ]);

      setJournals(journalRes.data.journals || []);
      setAttendance(attendanceRes.data.attendance || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load submissions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return format(parsedDate, 'MMM dd, yyyy');
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';

    const parsedDate = new Date(time);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return format(parsedDate, 'hh:mm a');
  };

  const handleReviewJournal = async (id, status) => {
    let feedback = '';

    if (status === 'Rejected') {
      feedback = window.prompt(
        'Enter feedback explaining why this journal was rejected:'
      );

      if (feedback === null) return;

      if (!feedback.trim()) {
        alert('Feedback is required when rejecting a journal.');
        return;
      }
    } else {
      feedback = 'Journal approved.';
    }

    try {
      setReviewingId(id);

      await api.patch(`/weekly-journals/${id}/review`, {
        status,
        feedback
      });

      alert(`Journal ${status.toLowerCase()} successfully!`);

      await fetchData();
    } catch (err) {
      console.error('Journal review error:', err);

      alert(
        err.response?.data?.message ||
          'Failed to review journal.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleReviewAttendance = async (id, status) => {
    let remarks = '';

    if (status === 'Rejected') {
      remarks = window.prompt(
        'Enter the reason for rejecting this attendance:'
      );

      if (remarks === null) return;

      if (!remarks.trim()) {
        alert('Remarks are required when rejecting attendance.');
        return;
      }
    } else {
      remarks = 'Attendance approved.';
    }

    try {
      setReviewingId(id);

      await api.patch(`/ojt/${id}/review`, {
        status,
        remarks
      });

      alert(`Attendance ${status.toLowerCase()} successfully!`);

      await fetchData();
    } catch (err) {
      console.error('Attendance review error:', err);

      alert(
        err.response?.data?.message ||
          'Failed to review attendance.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Approvals
          </h1>

          <p className="text-sm text-muted mt-1">
            Review student weekly journals and attendance
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white shadow-card text-primary hover:bg-primary-light disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex gap-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
            activeTab === 'journals'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted'
          }`}
        >
          <BookOpen size={16} />
          Journals ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted'
          }`}
        >
          <Clock size={16} />
          Attendance ({attendance.length})
        </button>
      </div>

      {activeTab === 'journals' && (
        <div className="bg-white rounded-3xl shadow-card p-6">
          {journals.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen
                size={36}
                className="mx-auto mb-3 text-muted"
              />

              <p className="font-semibold text-text">
                No submitted journals
              </p>

              <p className="text-sm text-muted mt-1">
                Submitted weekly journals will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-background text-muted text-xs uppercase">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Week</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Activities & Learnings</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {journals.map((journal) => (
                    <tr
                      key={journal._id}
                      className="hover:bg-background/50 align-top"
                    >
                      <td className="p-3">
                        <p className="font-semibold text-text">
                          {journal.student?.firstName}{' '}
                          {journal.student?.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          {journal.student?.studentNumber || 'N/A'}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-text whitespace-nowrap">
                        Week {journal.weekNumber}
                      </td>
                      <td className="p-3 text-xs text-muted whitespace-nowrap">
                        {formatDate(journal.startDate)} -{' '}
                        {formatDate(journal.endDate)}
                      </td>
                      <td className="p-3 max-w-md space-y-1">
                        <p className="text-xs text-text line-clamp-2">
                          <span className="font-semibold">Activities:</span>{' '}
                          {journal.activities}
                        </p>
                        <p className="text-xs text-muted line-clamp-2">
                          <span className="font-semibold text-text">
                            Learnings:
                          </span>{' '}
                          {journal.learnings}
                        </p>
                        {journal.challenges && (
                          <p className="text-xs text-muted line-clamp-1">
                            <span className="font-semibold text-text">
                              Challenges:
                            </span>{' '}
                            {journal.challenges}
                          </p>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          {journal.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleReviewJournal(journal._id, 'Rejected')
                            }
                            disabled={reviewingId === journal._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              handleReviewJournal(journal._id, 'Approved')
                            }
                            disabled={reviewingId === journal._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl shadow-card p-6">
          {attendance.length === 0 ? (
            <div className="p-8 text-center">
              <Clock
                size={36}
                className="mx-auto mb-3 text-muted"
              />

              <p className="font-semibold text-text">
                No pending attendance
              </p>

              <p className="text-sm text-muted mt-1">
                Completed attendance records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-background text-muted text-xs uppercase">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time In</th>
                    <th className="p-3">Time Out</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-background/50">
                      <td className="p-3">
                        <p className="font-semibold text-text">
                          {record.student?.firstName} {record.student?.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          {record.student?.studentNumber || 'N/A'}
                        </p>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDate(record.attendanceDate || record.date)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatTime(record.timeIn)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatTime(record.timeOut)}
                      </td>
                      <td className="p-3 font-semibold text-primary whitespace-nowrap">
                        {Number(record.totalHours || 0).toFixed(2)} hrs
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          {record.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleReviewAttendance(record._id, 'Rejected')
                            }
                            disabled={reviewingId === record._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              handleReviewAttendance(record._id, 'Approved')
                            }
                            disabled={reviewingId === record._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}