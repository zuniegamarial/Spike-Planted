import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  RefreshCw,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';

import { api } from '../../api/axios';

export default function StudentList() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // LOAD STUDENTS
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/coordinator/students');

      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load student records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // SEARCH STUDENTS
  const filtered = students.filter((s) => {
    const studentName = `${s.firstName || ''} ${s.lastName || ''}`;

    const searchText = [
      studentName,
      s.studentNumber,
      s.program,
      s.email,
      s.status
    ]
      .join(' ')
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  // STATUS STYLING
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';

      case 'Pending':
        return 'bg-amber-100 text-amber-700';

      case 'Inactive':
        return 'bg-red-100 text-red-700';

      case 'Completed':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // VIEW STUDENT DETAILS
  const viewStudent = (studentId) => {
    navigate(`/students/${studentId}`);
  };

  // ACTIVATE OR DEACTIVATE STUDENT
  const handleStatusChange = async (student) => {
    const newStatus =
      student.status === 'Active' ? 'Inactive' : 'Active';

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

      setSuccess(
        data.message || `Student account ${newStatus.toLowerCase()} successfully.`
      );

      await fetchStudents();

    } catch (err) {
      console.error('Student status update error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to update student account status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Students
          </h1>

          <p className="text-sm text-muted mt-1">
            Monitor and manage all registered OJT students
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary-light text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Users size={18} />
            {students.length} Total Students
          </div>

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="p-3 rounded-xl bg-white shadow-card text-primary hover:bg-primary-light disabled:opacity-50"
            title="Refresh students"
          >
            <RefreshCw
              size={18}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl">
          {success}
        </div>
      )}

      {/* STUDENT TABLE */}
      <div className="bg-white rounded-3xl shadow-card p-6">

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              placeholder="Search by name, ID, email, or program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light border-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-primary">
            Loading students...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 rounded-l-xl">
                    Student Name
                  </th>

                  <th className="px-6 py-4">
                    Student ID
                  </th>

                  <th className="px-6 py-4">
                    Email
                  </th>

                  <th className="px-6 py-4">
                    Program
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Action
                  </th>

                  <th className="px-6 py-4 rounded-r-xl">
                    Account
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-background/50 transition"
                  >
                    {/* UPDATED STUDENT NAME WITH PROFILE PICTURE */}
                    <td className="px-6 py-4 font-semibold">
                      <button
                        onClick={() => viewStudent(s._id)}
                        className="flex items-center gap-3 text-left hover:underline text-primary"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold overflow-hidden shrink-0">
                          {s.avatar ? (
                            <img 
                              src={`http://localhost:5000${s.avatar}`} 
                              alt="avatar" 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = s.firstName.charAt(0); }}
                            />
                          ) : (
                            s.firstName.charAt(0)
                          )}
                        </div>
                        <span className="font-semibold">
                          {s.firstName} {s.lastName}
                        </span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-muted">
                      {s.studentNumber}
                    </td>

                    <td className="px-6 py-4 text-muted">
                      {s.email}
                    </td>

                    <td className="px-6 py-4 text-muted">
                      {s.program}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(s.status)}`}
                      >
                        {s.status || 'Unknown'}
                      </span>
                    </td>

                    {/* VIEW DETAILS */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewStudent(s._id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition font-semibold"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>

                    {/* ACCOUNT MANAGEMENT */}
                    <td className="px-6 py-4">
                      {s.status === 'Completed' ? (
                        <span className="text-xs text-muted">
                          Completed
                        </span>
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
                          {s.status === 'Active' ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck size={15} />
                          )}

                          {updatingId === s._id
                            ? 'Updating...'
                            : s.status === 'Active'
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-muted"
                    >
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}