import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  FilePlus2,
  PauseCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { api, getFileUrl } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function PostRequirements() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [requirements, setRequirements] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [reqRes, docsRes] = await Promise.all([
        api.get('/documents/requirements/manage'),
        api.get('/documents', { params: { status: 'Pending' } })
      ]);

      setRequirements(reqRes.data.requirements || []);
      setPendingDocs(docsRes.data.documents || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load required documents.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      await api.post('/documents/requirements', {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null
      });

      setTitle('');
      setDescription('');
      setDueDate('');
      setSuccessMessage('Required document posted for students.');
      addNotification('New required document posted for students.', 'success');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to post required document.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      setError('');
      setSuccessMessage('');
      await api.patch(`/documents/requirements/${id}/toggle`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update requirement status.'
      );
    }
  };

  const handleReviewDoc = async (docId, status) => {
    let remarks = '';

    if (status === 'Rejected') {
      const input = window.prompt(
        'Enter the reason for rejecting this document:'
      );
      if (input === null) return;
      if (!input.trim()) {
        setError('Remarks are required when rejecting a document.');
        return;
      }
      remarks = input.trim();
    } else {
      remarks = 'Document approved by company.';
    }

    try {
      setReviewingId(docId);
      setError('');
      setSuccessMessage('');

      await api.patch(`/documents/${docId}/review`, {
        status,
        remarks
      });

      const msg = `Document ${status.toLowerCase()} successfully.`;
      setSuccessMessage(msg);
      addNotification(msg, status === 'Approved' ? 'success' : 'warning');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to review document.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  const formatStudentName = (student) => {
    if (!student) return 'Student';
    const full = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return full || student.studentNumber || 'Student';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Required Documents & Approvals
          </h1>
          <p className="text-sm text-muted mt-1">
            Post requirements and approve or reject student submissions for{' '}
            <span className="font-bold text-primary">
              {user?.company || 'your company'}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white shadow-card text-primary font-semibold text-sm hover:bg-primary-light disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-green-50 text-success p-4 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}

      {/* Pending Student Submissions for Company Review */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-extrabold text-lg text-text">
              Pending Student Submissions ({pendingDocs.length})
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Review documents passed by students assigned to your company.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted py-6">Loading submissions...</p>
        ) : pendingDocs.length === 0 ? (
          <p className="text-sm text-muted py-6">
            No pending student documents to review right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">File</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {pendingDocs.map((doc) => {
                  const isBusy = reviewingId === doc._id;

                  return (
                    <tr key={doc._id} className="hover:bg-background/50">
                      <td className="p-3">
                        <p className="font-semibold text-text">
                          {formatStudentName(doc.student)}
                        </p>
                        <p className="text-xs text-muted">
                          {doc.student?.studentNumber || 'N/A'}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-text">
                        {doc.documentType}
                      </td>
                      <td className="p-3">
                        {doc.filePath ? (
                          <a
                            href={getFileUrl(doc.filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            {doc.fileName || 'View File'}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted whitespace-nowrap">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReviewDoc(doc._id, 'Rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReviewDoc(doc._id, 'Approved')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Requirement + Posted Requirements & Approved History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-3xl shadow-card p-6 space-y-4 h-fit"
        >
          <h2 className="font-extrabold text-lg text-text flex items-center gap-2">
            <FilePlus2 size={20} className="text-primary" />
            New Requirement
          </h2>

          <div>
            <label className="block text-xs font-bold text-text mb-1">
              Document / Activity Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Accomplishment Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-text outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">
              Instructions / Description
            </label>
            <textarea
              rows={3}
              placeholder="What should students attach or complete?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-background border border-border text-sm text-text outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-text outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post to Students'}
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-3xl shadow-card p-6">
          <h2 className="font-extrabold text-lg text-text mb-4">
            Posted Required Documents ({requirements.length})
          </h2>

          {loading ? (
            <p className="text-sm text-muted py-6">Loading requirements...</p>
          ) : requirements.length === 0 ? (
            <p className="text-sm text-muted py-6">
              No required documents posted yet. Use the form on the left to post one.
            </p>
          ) : (
            <div className="space-y-3">
              {requirements.map((reqItem) => {
                const isDefaultItem = String(reqItem._id || '').startsWith(
                  'default-'
                );

                return (
                  <div
                    key={reqItem._id}
                    className="p-4 rounded-2xl bg-background border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text">
                            {reqItem.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              reqItem.isActive
                                ? 'bg-green-100 text-success'
                                : 'bg-gray-200 text-muted'
                            }`}
                          >
                            {reqItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {reqItem.description && (
                          <p className="text-xs text-muted">
                            {reqItem.description}
                          </p>
                        )}

                        {reqItem.dueDate && (
                          <p className="text-[11px] text-muted flex items-center gap-1">
                            <Calendar size={12} />
                            Due: {new Date(reqItem.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {!isDefaultItem && (
                        <button
                          type="button"
                          onClick={() => handleToggle(reqItem._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-border text-text hover:bg-primary-light transition shrink-0"
                        >
                          {reqItem.isActive ? (
                            <>
                              <PauseCircle size={14} className="text-warning" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} className="text-success" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {reqItem.passedBy && reqItem.passedBy.length > 0 && (
                      <div className="pt-2 border-t border-border/60 space-y-1">
                        <p className="text-[11px] font-bold text-success">
                          Approved / Passed ({reqItem.passedBy.length}):
                        </p>
                        {reqItem.passedBy.map((entry) => (
                          <div
                            key={entry._id}
                            className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-xl border border-border/60"
                          >
                            <span className="font-medium text-text">
                              {entry.studentName} —{' '}
                              <span className="text-muted">{entry.fileName}</span>
                            </span>
                            <a
                              href={getFileUrl(entry.filePath)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-primary hover:underline"
                            >
                              View →
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}