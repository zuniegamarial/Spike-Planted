import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  Building
} from 'lucide-react';

import { api } from '../../api/axios';

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalUsers: 0,
    totalOjtHours: 0,
    pendingAccounts: 0,
    pendingJournals: 0,
    pendingAttendance: 0,
    pendingDocuments: 0,
    pendingApprovals: 0
  });

  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/dashboard-summary');

      if (response.data.success) {
        setSummary(response.data.summary);
        setPendingAccounts(response.data.pendingAccounts || []);
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to load Admin Dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApprove = async (userId) => {
    try {
      setApprovingId(userId);
      setError('');
      setSuccess('');

      const response = await api.patch(
        `/admin/users/${userId}/approve`
      );

      if (response.data.success) {
        setSuccess('Account approved successfully.');
        await loadDashboard();
      }
    } catch (err) {
      console.error('Account approval error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to approve account.'
      );
    } finally {
      setApprovingId(null);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: summary.totalStudents,
      icon: Users
    },
    {
      title: 'Active Students',
      value: summary.activeStudents,
      icon: UserCheck
    },
    {
      title: 'Total Approved OJT Hours',
      value: Number(summary.totalOjtHours || 0).toLocaleString(
        undefined,
        { maximumFractionDigits: 2 }
      ),
      icon: TrendingUp
    },
    {
      title: 'Pending Approvals',
      value: summary.pendingApprovals,
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Admin Overview
          </h1>

          <p className="text-sm text-muted mt-1">
            System-wide OJT management
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                <Icon size={24} />
              </div>

              <div>
                <p className="text-xs text-muted font-semibold">
                  {card.title}
                </p>

                <p className="text-2xl font-extrabold text-text">
                  {loading ? '...' : card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACCOUNT STATISTICS */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <h3 className="font-extrabold text-text mb-4">
          Account Statistics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Total Users
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.totalUsers}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Inactive Students
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.inactiveStudents}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Pending Accounts
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.pendingAccounts}
            </p>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL BREAKDOWN */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <h3 className="font-extrabold text-text mb-4">
          OJT Approval Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Pending Journals
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.pendingJournals}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Pending Attendance
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.pendingAttendance}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border">
            <p className="text-xs text-muted font-semibold">
              Pending Documents
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.pendingDocuments}
            </p>
          </div>
        </div>
      </div>

      {/* PENDING ACCOUNT APPROVALS */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={20} className="text-primary" />

          <h3 className="font-extrabold text-text">
            Pending Account Approvals
          </h3>
        </div>

        {loading ? (
          <p className="text-sm text-muted">
            Loading pending accounts...
          </p>
        ) : pendingAccounts.length === 0 ? (
          <p className="text-sm text-muted">
            No pending accounts to review.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingAccounts.map((acc) => (
              <div
                key={acc._id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text">
                      {acc.fullName}
                    </p>
                    
                    {/* BADGE TO DISTINGUISH USER VS COMPANY */}
                    {acc.type === 'Company' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <Building size={10} /> Company
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        <Users size={10} /> User
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted mt-1">
                    {acc.email} • Requesting to be{' '}
                    <span className="font-semibold text-primary capitalize">
                      {acc.role}
                    </span>
                    
                    {/* Show company or department if they exist */}
                    {acc.company && ` at ${acc.company}`}
                    {acc.department && ` in ${acc.department}`}
                  </p>
                </div>

                <button
                  onClick={() => handleApprove(acc._id)}
                  disabled={approvingId === acc._id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                >
                  <CheckCircle size={14} />

                  {approvingId === acc._id
                    ? 'Approving...'
                    : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}