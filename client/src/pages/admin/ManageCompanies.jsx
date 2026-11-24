import { useState, useEffect } from 'react';
import { Building, CheckCircle, XCircle, Mail, User } from 'lucide-react';
import { api } from '../../api/axios';

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data.companies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/companies/${id}/approve`);
      fetchCompanies(); // Refresh the list
    } catch (err) {
      alert('Failed to approve company');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/companies/${id}/reject`);
      fetchCompanies();
    } catch (err) {
      alert('Failed to reject company');
    }
  };

  if (loading) return <div className="p-10 text-center text-primary">Loading companies...</div>;

  const pendingCompanies = companies.filter(c => c.status === 'Pending');
  const approvedCompanies = companies.filter(c => c.status === 'Approved');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Partner Companies</h1>
          <p className="text-sm text-muted mt-1">Manage OJT placement partners and requests</p>
        </div>
      </div>

      {/* PENDING REQUESTS SECTION */}
      {pendingCompanies.length > 0 && (
        <div className="bg-white rounded-3xl shadow-card p-6 border-l-4 border-amber-400">
          <h3 className="font-extrabold text-text mb-4 flex items-center gap-2">
            <Building size={18} className="text-amber-500" /> 
            Pending Company Requests ({pendingCompanies.length})
          </h3>
          <div className="space-y-3">
            {pendingCompanies.map(company => (
              <div key={company._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-background border border-border gap-4">
                <div>
                  <h4 className="font-bold text-text">{company.name}</h4>
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <User size={12}/> {company.contactPerson || 'No Name'}
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Mail size={12}/> {company.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReject(company._id)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-danger hover:bg-red-100 transition">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => handleApprove(company._id)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-green-50 text-success hover:bg-green-100 transition">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVED COMPANIES SECTION */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <h3 className="font-extrabold text-text mb-4">Approved Partners ({approvedCompanies.length})</h3>
        {approvedCompanies.length === 0 ? (
          <p className="text-sm text-muted">No approved companies yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedCompanies.map(c => (
              <div key={c._id} className="bg-background p-5 rounded-2xl border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-3">
                  <Building size={20} />
                </div>
                <h3 className="font-bold text-text mb-1">{c.name}</h3>
                {/* Show the updated contact person name */}
                <p className="text-xs font-semibold text-text/80 mb-1">
                  {c.contactPerson || 'No Name'}
                </p>
                {/* Show the email to verify the linked account */}
                <p className="text-[10px] text-muted flex items-center gap-1">
                  <Mail size={10} /> {c.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}