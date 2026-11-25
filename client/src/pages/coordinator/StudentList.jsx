import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Building2,
  UserPlus,
  X,
  Save,
  Mail,
  Briefcase
} from 'lucide-react';

import { api } from '../../api/axios';

export default function StudentList() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [updatingId, setUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  // Modals State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null); // <-- New state for Company Details Modal

  // LOAD STUDENTS
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/coordinator/students');

      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(err.response?.data?.message || 'Unable to load student records.');
    } finally {
      setLoading(false);
    }
  };

  // LOAD APPROVED COMPANIES
  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/assignments/approved-companies');
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to load approved companies:', err);
      setError(err.response?.data?.message || 'Unable to load approved companies.');
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCompanies();
  }, []);

  // SEARCH STUDENTS
  const filtered = students.filter((s) => {
    const studentName = `${s.firstName || ''} ${s.lastName || ''}`;
    const companyName = s.companyId?.name || 'Unassigned';

    const searchText = [
      studentName,
      s.studentNumber,
      s.program,
      s.email,
      s.status,
      companyName
    ]
      .join(' ')
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  // STATUS STYLING
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Inactive': return 'bg-red-100 text-red-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // VIEW STUDENT DETAILS
  const viewStudent = (studentId) => {
    navigate(`/students/${studentId}`);
  };

  // OPEN ASSIGNMENT MODAL
  const openAssignmentModal = (student) => {
    setSelectedStudent(student);
    setSelectedCompany(student.companyId?._id || '');
    setError('');
    setSuccess('');
  };

  // CLOSE ASSIGNMENT MODAL
  const closeAssignmentModal = () => {
    if (savingAssignment) return;
    setSelectedStudent(null);
    setSelectedCompany('');
  };

  // ASSIGN OR CHANGE COMPANY
  const handleAssignment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCompany) {
      setError('Please select a company.');
      return;
    }

    try {
      setSavingAssignment(true);
      setError('');
      setSuccess('');

      const { data } = await api.post('/assignments', {
        studentId: selectedStudent._id,
        companyId: selectedCompany
      });

      setSuccess(data.message || 'Student assigned successfully.');
      setSelectedStudent(null);
      setSelectedCompany('');
      await fetchStudents();
    } catch (err) {
      console.error('Student assignment error:', err);
      setError(err.response?.data?.message || 'Failed to assign student to company.');
    } finally {
      setSavingAssignment(false);
    }
  };

  // ACTIVATE OR DEACTIVATE STUDENT
  const handleStatusChange = async (student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus.toLowerCase()} ${student.firstName} ${student.lastName}'s account?`
    );
    if (!confirmed) return;

    try {
      setUpdatingId(student._id);
      setError('');
      setSuccess('');

      const { data } = await api.patch(
        `/coordinator/students/${student._id}/status`,
        { status: newStatus }
      );

      setSuccess(data.message || `Student account ${newStatus.toLowerCase()} successfully.`);
      await fetchStudents();
    } catch (err) {
      console.error('Student status update error:', err);
      setError(err.response?.data?.message || 'Failed to update student account status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Students</h1>
          <p className="text-sm text-muted mt-1">
            Monitor students, manage accounts, and assign OJT companies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary-light text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Users size={18} /> {students.length} Total Students
          </div>

          <button
            onClick={() => { fetchStudents(); fetchCompanies(); }}
            disabled={loading}
            className="p-3 rounded-xl bg-white shadow-card text-primary hover:bg-primary-light disabled:opacity-50"
            title="Refresh students"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')} className="shrink-0"><X size={18} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-between gap-3">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="shrink-0"><X size={18} /></button>
        </div>
      )}

      {/* STUDENT TABLE */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search by name, ID, email, program, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light border-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-primary">Loading students...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 rounded-l-xl">Student Name</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Program</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4 rounded-r-xl">Account</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-background/50 transition">
                    <td className="px-6 py-4 font-semibold">
                      <button onClick={() => viewStudent(s._id)} className="text-primary hover:underline text-left font-semibold">
                        {s.firstName} {s.lastName}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-muted">{s.studentNumber}</td>
                    <td className="px-6 py-4 text-muted">{s.email}</td>
                    <td className="px-6 py-4 text-muted">{s.program || '—'}</td>

                    {/* CLICKABLE COMPANY BADGE */}
                    <td className="px-6 py-4">
                      {s.companyId?.name ? (
                        <button
                          onClick={() => setViewingCompany(s.companyId)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer border border-blue-100"
                        >
                          <Building2 size={14} />
                          {s.companyId.name}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">Not assigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(s.status)}`}>
                        {s.status || 'Unknown'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewStudent(s._id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition font-semibold"
                        >
                          <Eye size={16} /> View
                        </button>

                        <button
                          onClick={() => openAssignmentModal(s)}
                          disabled={assigningId === s._id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-semibold disabled:opacity-50"
                        >
                          {s.companyId ? <Building2 size={16} /> : <UserPlus size={16} />}
                          {s.companyId ? 'Change' : 'Assign'}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {s.status === 'Completed' ? (
                        <span className="text-xs text-muted">Completed</span>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(s)}
                          disabled={updatingId === s._id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                            s.status === 'Active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {s.status === 'Active' ? <UserX size={15} /> : <UserCheck size={15} />}
                          {updatingId === s._id ? 'Updating...' : s.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-muted">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGNMENT MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Building2 size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">Company Assignment</span>
                </div>
                <h2 className="text-2xl font-extrabold text-text">
                  {selectedStudent.companyId ? 'Change Company' : 'Assign Company'}
                </h2>
                <p className="text-sm text-muted mt-1">
                  Assigning {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>
              <button onClick={closeAssignmentModal} disabled={savingAssignment} className="p-2 rounded-xl hover:bg-background text-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignment} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-text mb-2">Select Approved Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary-light"
                >
                  <option value="">Choose a company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {companies.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">No approved companies are currently available.</p>
                )}
              </div>

              <div className="bg-primary-light/50 rounded-xl p-4">
                <p className="text-xs text-muted mb-1">Student</p>
                <p className="font-bold text-text">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-xs text-muted mt-1">Student ID: {selectedStudent.studentNumber}</p>
                <p className="text-xs text-muted mt-2">Current company: {selectedStudent.companyId?.name || 'Not assigned'}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeAssignmentModal} disabled={savingAssignment} className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingAssignment || !selectedCompany || companies.length === 0} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-50">
                  <Save size={16} /> {savingAssignment ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPANY DETAILS MODAL */}
      {viewingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-text">Company Details</h2>
              <button onClick={() => setViewingCompany(null)} className="p-2 rounded-full hover:bg-gray-100 text-muted transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary">
                  <Building2 size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-text">{viewingCompany.name}</h1>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mt-1">OJT Partner</span>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted font-semibold">Company Name</p>
                    <p className="text-sm font-medium">{viewingCompany.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted font-semibold">Contact Person</p>
                    <p className="text-sm font-medium">{viewingCompany.contactPerson || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted font-semibold">Email Address</p>
                    <p className="text-sm font-medium">{viewingCompany.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}