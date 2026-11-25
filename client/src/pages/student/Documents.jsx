import { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import { api, getFileUrl } from '../../api/axios';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileRef = useRef(null);

  const fetchData = async () => {
    try {
      setError('');

      const [documentsRes, requirementsRes] = await Promise.all([
        api.get('/documents/my-documents'),
        api.get('/documents/requirements')
      ]);

      setDocuments(documentsRes.data.documents || []);

      const activeRequirements = (
        requirementsRes.data.requirements || []
      ).filter((item) => item.isActive !== false);

      setRequirements(activeRequirements);

      setSelectedType((current) => {
        if (
          current &&
          activeRequirements.some((item) => item.title === current)
        ) {
          return current;
        }

        return activeRequirements[0]?.title || '';
      });
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(
        err.response?.data?.message ||
          'Unable to load your documents and requirements.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusForRequirement = (title) => {
    const matching = documents.filter(
      (doc) => (doc.documentType || '').toLowerCase() === title.toLowerCase()
    );

    if (matching.some((doc) => doc.status === 'Approved')) return 'Approved';
    if (matching.some((doc) => doc.status === 'Pending')) return 'Pending';
    if (matching.some((doc) => doc.status === 'Rejected')) return 'Rejected';
    return 'Missing';
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    const file = fileRef.current?.files?.[0];

    if (!selectedType) {
      setError('There are currently no active document requirements.');
      return;
    }

    if (!file) {
      setError('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedType);

    try {
      setUploading(true);
      setError('');
      setSuccessMessage('');

      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (fileRef.current) {
        fileRef.current.value = '';
      }

      await fetchData();
      setSuccessMessage('Document uploaded successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Document upload failed.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">
          Documents
        </h1>
        <p className="text-sm text-muted mt-1">
          View and upload your OJT requirements.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-green-50 text-success p-4 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 p-4 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Active Requirements */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <h2 className="font-extrabold text-lg text-text mb-4">
          Active Requirements ({requirements.length})
        </h2>

        {requirements.length === 0 ? (
          <p className="text-sm text-muted py-3">
            No active document requirements have been posted by your
            supervisor yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requirements.map((requirement) => {
              const status = getStatusForRequirement(requirement.title);
              const isApproved = status === 'Approved';
              const isPending = status === 'Pending';
              const isRejected = status === 'Rejected';

              return (
                <div
                  key={requirement._id}
                  className="rounded-xl border border-border bg-background p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                      ) : (
                        <Circle size={16} className="text-muted shrink-0" />
                      )}
                      <h3 className="font-bold text-sm text-text">
                        {requirement.title}
                      </h3>
                    </div>

                    {requirement.description && (
                      <p className="text-xs text-muted mt-1 pl-6">
                        {requirement.description}
                      </p>
                    )}

                    {requirement.dueDate && (
                      <p className="text-xs text-muted mt-2 pl-6 flex items-center gap-1">
                        <Calendar size={13} />
                        Due: {format(
                          new Date(requirement.dueDate),
                          'MMM d, yyyy'
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
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
        )}
      </div>

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="bg-white rounded-3xl shadow-card p-6 flex flex-col md:flex-row items-end gap-4"
      >
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold mb-1">
            Document Type
          </label>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={requirements.length === 0 || uploading}
            required
            className="w-full h-11 px-3 rounded-xl bg-background text-sm outline-none border border-border disabled:opacity-50"
          >
            {requirements.length === 0 ? (
              <option value="">No active requirements</option>
            ) : (
              requirements.map((requirement) => (
                <option
                  key={requirement._id}
                  value={requirement.title}
                >
                  {requirement.title}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold mb-1">
            File (PDF/JPG/PNG)
          </label>

          <input
            type="file"
            ref={fileRef}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={requirements.length === 0 || uploading}
            className="w-full h-11 px-3 py-2 rounded-xl bg-background text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || requirements.length === 0}
          className="h-11 px-6 rounded-xl bg-primary text-white font-semibold text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {/* Uploaded Documents */}
      <div>
        <h2 className="font-extrabold text-lg text-text mb-4">
          My Uploaded Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <FileText
              size={36}
              className="mx-auto text-muted mb-3"
            />
            <p className="text-sm text-muted">
              You haven't uploaded any documents yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-3xl shadow-card p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary">
                    <FileText size={18} />
                  </div>

                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      doc.status === 'Approved'
                        ? 'bg-green-100 text-success'
                        : doc.status === 'Rejected'
                          ? 'bg-red-100 text-danger'
                          : 'bg-amber-100 text-warning'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm mb-1">
                  {doc.documentType}
                </h3>

                <p className="text-xs text-muted truncate">
                  {doc.fileName}
                </p>

                <p className="text-[10px] text-muted mt-2">
                  Uploaded{' '}
                  {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                </p>

                {doc.remarks && (
                  <p className="text-xs text-muted mt-2">
                    Remarks: {doc.remarks}
                  </p>
                )}

                <a
                  href={getFileUrl(doc.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
                >
                  View File →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}