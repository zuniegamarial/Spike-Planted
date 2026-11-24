import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  User,
  Clock,
  FileText,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Ban
} from 'lucide-react';
import { api } from '../../api/axios';

export default function StudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [journals, setJournals] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  const fetchStudentRecord = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }

      const { data } = await api.get(`/coordinator/students/${studentId}`);

      setStudent(data.student);
      setSummary(data.summary || {});
      setAttendance(data.attendance || []);
      setJournals(data.journals || []);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load student record:', err);

      if (!silent) {
        setError(
          err.response?.data?.message || 'Unable to load student record.'
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudentRecord();
  }, [studentId]);

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusLoading(true);
      setStatusMessage('');
      setStatusError('');

      const { data } = await api.patch(
        `/coordinator/students/${studentId}/status`,
        { status: newStatus }
      );

      setStudent(data.student);
      setStatusMessage(data.message);
    } catch (err) {
      console.error('Failed to update student status:', err);

      setStatusError(
        err.response?.data?.message ||
          'Failed to update student account status.'
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return 'bg-green-100 text-green-700';

      case 'Pending':
      case 'Submitted':
        return 'bg-amber-100 text-amber-700';

      case 'Rejected':
      case 'Inactive':
        return 'bg-red-100 text-red-700';

      case 'Completed':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '#';

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    const serverUrl = (
      api.defaults.baseURL || 'http://localhost:5000/api'
    ).replace(/\/api\/?$/, '');

    return `${serverUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading student record...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-primary font-semibold"
        >
          <ArrowLeft size={18} />
          Back to Students
        </button>

        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>

        <button
          type="button"
          onClick={() => fetchStudentRecord()}
          className="px-4 py-2 bg-primary text-white rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!student) return null;

  const progress = Math.min(((summary.totalHours || 0) / 486) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="flex items-center gap-2 text-primary font-semibold mb-4"
          >
            <ArrowLeft size={18} />
            Back to Students
          </button>

          <h1 className="text-3xl font-extrabold text-text">Student Details</h1>

          <p className="text-sm text-muted mt-1">
            View student information and OJT progress
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchStudentRecord()}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white shadow-card text-primary"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <User size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-text">
              {student.firstName} {student.lastName}
            </h2>

            <p className="text-sm text-muted">
              Student ID: {student.studentNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="font-semibold text-text break-all">
              {student.email || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Program</p>
            <p className="font-semibold text-text">{student.program || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-muted">Account Status</p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                student.status
              )}`}
            >
              {student.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="border-t border-border mt-6 pt-5">
          <h3 className="font-bold text-text mb-2">Account Management</h3>

          <p className="text-sm text-muted mb-4">
            Manage this student's access to the OJT Tracker.
          </p>

          {statusMessage && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-4">
              {statusMessage}
            </div>
          )}

          {statusError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
              {statusError}
            </div>
          )}

          {student.status === 'Active' && (
            <button
              type="button"
              onClick={() => handleStatusChange('Inactive')}
              disabled={statusLoading}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 disabled:opacity-50 transition"
            >
              <Ban size={18} />
              {statusLoading ? 'Updating...' : 'Deactivate Account'}
            </button>
          )}

          {(student.status === 'Pending' || student.status === 'Inactive') && (
            <button
              type="button"
              onClick={() => handleStatusChange('Active')}
              disabled={statusLoading}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 disabled:opacity-50 transition"
            >
              <CheckCircle size={18} />
              {statusLoading ? 'Updating...' : 'Activate Account'}
            </button>
          )}

          {student.status === 'Completed' && (
            <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-xl">
              This student's OJT account is marked as Completed.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <Clock className="text-primary mb-3" size={24} />
          <p className="text-sm text-muted">Approved OJT Hours</p>
          <h3 className="text-2xl font-extrabold text-text">
            {(summary.totalHours || 0).toFixed(2)}
          </h3>
          <p className="text-xs text-muted">Out of 486 hours</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <CalendarDays className="text-primary mb-3" size={24} />
          <p className="text-sm text-muted">Attendance Records</p>
          <h3 className="text-2xl font-extrabold text-text">
            {summary.attendanceDays || 0}
          </h3>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <BookOpen className="text-primary mb-3" size={24} />
          <p className="text-sm text-muted">Weekly Journals</p>
          <h3 className="text-2xl font-extrabold text-text">
            {summary.totalJournals || 0}
          </h3>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <FileText className="text-primary mb-3" size={24} />
          <p className="text-sm text-muted">Uploaded Documents</p>
          <h3 className="text-2xl font-extrabold text-text">
            {summary.totalDocuments || 0}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-text">OJT Progress</h2>
          <span className="text-sm font-bold text-primary">
            {progress.toFixed(2)}%
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-muted mt-2">
          {(summary.totalHours || 0).toFixed(2)} approved hours / 486 required
          hours
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <h2 className="text-xl font-bold text-text mb-5">Attendance History</h2>

        {attendance.length === 0 ? (
          <p className="text-muted text-center py-6">
            No attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time In</th>
                  <th className="p-3">Time Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {attendance.map((record) => {
                  const isRejected = record.status === 'Rejected';

                  return (
                    <tr
                      key={record._id}
                      className={isRejected ? 'bg-red-50/40' : ''}
                    >
                      <td className="p-3">
                        {formatDate(record.attendanceDate || record.date)}
                      </td>
                      <td className="p-3">{formatTime(record.timeIn)}</td>
                      <td className="p-3">{formatTime(record.timeOut)}</td>
                      <td
                        className={`p-3 font-semibold ${
                          isRejected ? 'line-through text-red-600' : ''
                        }`}
                      >
                        {(record.totalHours || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted">{record.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <h2 className="text-xl font-bold text-text mb-5">
          Weekly Journal History
        </h2>

        {journals.length === 0 ? (
          <p className="text-muted text-center py-6">
            No weekly journals found.
          </p>
        ) : (
          <div className="space-y-4">
            {journals.map((journal) => (
              <div
                key={journal._id}
                className="border border-border rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-text">
                    Week {journal.weekNumber}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                      journal.status
                    )}`}
                  >
                    {journal.status}
                  </span>
                </div>

                <p className="text-xs text-muted">
                  {formatDate(journal.startDate)} - {formatDate(journal.endDate)}
                </p>

                <div>
                  <p className="font-semibold text-sm">Activities Performed</p>
                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {journal.activities}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-sm">Learnings</p>
                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {journal.learnings}
                  </p>
                </div>

                {journal.challenges && (
                  <div>
                    <p className="font-semibold text-sm">Challenges</p>
                    <p className="text-sm text-muted whitespace-pre-wrap">
                      {journal.challenges}
                    </p>
                  </div>
                )}

                {journal.feedback && (
                  <div className="bg-background rounded-xl p-3">
                    <p className="font-semibold text-sm">Review Feedback</p>
                    <p className="text-sm text-muted">{journal.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <h2 className="text-xl font-bold text-text mb-5">Document History</h2>

        {documents.length === 0 ? (
          <p className="text-muted text-center py-6">
            No uploaded documents found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3">File</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr key={doc._id}>
                    <td className="p-3 font-semibold">{doc.documentType}</td>
                    <td className="p-3 text-muted">{doc.fileName}</td>
                    <td className="p-3">{formatDate(doc.createdAt)}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted">{doc.remarks || '—'}</td>
                    <td className="p-3">
                      {doc.filePath && (
                        <a
                          href={getFileUrl(doc.filePath)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-semibold hover:underline"
                        >
                          View File
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}