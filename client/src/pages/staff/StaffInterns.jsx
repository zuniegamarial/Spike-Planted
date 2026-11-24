import { useState } from 'react';
import { CheckCircle, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StaffInterns() {
  const { user } = useAuth();

  const [interns, setInterns] = useState([
    { id: 1, name: 'Juan Dela Cruz', program: 'BSIS', hours: 120, status: 'Pending' },
    { id: 2, name: 'Maria Santos', program: 'BSIS', hours: 85, status: 'Approved' }
  ]);

  const handleStatusChange = (id, nextStatus) => {
    setInterns((prev) =>
      prev.map((intern) =>
        intern.id === id ? { ...intern, status: nextStatus } : intern
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">My Interns</h1>
          <p className="text-sm text-muted mt-1">
            Manage intern attendance sign-offs at{' '}
            <span className="font-bold text-primary">
              {user?.company || 'your company'}
            </span>
          </p>
        </div>

        <div className="bg-white px-4 py-2.5 rounded-2xl shadow-soft flex items-center gap-2 text-xs font-bold text-text">
          <Users size={16} className="text-primary" />
          <span>{interns.length} Assigned Interns</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted text-xs uppercase">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Intern Name</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Rendered Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 font-semibold text-text">{intern.name}</td>
                  <td className="px-6 py-4 text-muted">{intern.program}</td>
                  <td className="px-6 py-4 text-muted">{intern.hours} hrs</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        intern.status === 'Approved'
                          ? 'bg-green-100 text-success'
                          : intern.status === 'Rejected'
                          ? 'bg-red-100 text-danger'
                          : 'bg-amber-100 text-warning'
                      }`}
                    >
                      {intern.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(intern.id, 'Approved')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-success hover:bg-green-100 transition"
                    >
                      <CheckCircle size={14} /> Sign Off
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(intern.id, 'Rejected')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-danger hover:bg-red-100 transition"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}