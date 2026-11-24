import { useState, useEffect } from 'react';
import { 
  User, GraduationCap, Mail, Phone, BookOpen, 
  Building, Briefcase, Calendar, Clock, ShieldCheck,
  FileText, Lock, CheckCircle2, X, AlertCircle, Loader2, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import EditProfileModal from './EditProfileModal';

export default function ProfilePopover({ onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) {
    return (
      <div className="absolute top-16 right-0 w-[800px] h-64 bg-white rounded-3xl shadow-2xl border border-border flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!data) return null;

  const userInfo = data.user || {};
  const studentInfo = data.student || {};
  const companyInfo = data.company || {};
  const documents = data.documents || [];

  const findDoc = (type) => documents.find(d => d.documentType === type);

  // CHECK IF USER IS ADMIN OR STAFF (Not a student)
  const isAdminOrStaff = userInfo.role === 'admin' || userInfo.role === 'staff';

  return (
    <div className="absolute top-16 right-0 w-[800px] max-h-[85vh] overflow-y-auto bg-background rounded-3xl shadow-2xl border border-border z-50 animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col">
      
      {showEdit && (
        <EditProfileModal 
          initialData={{ ...userInfo, ...studentInfo }} 
          onClose={() => setShowEdit(false)} 
          onSuccess={fetchProfile}
        />
      )}

      <div className="flex items-center justify-between p-6 bg-white border-b border-border sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-extrabold text-text">My Profile</h2>
          <p className="text-xs text-muted">Manage your personal information and account details.</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-muted transition">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {/* TOP BANNER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-sm overflow-hidden shrink-0">
            {userInfo.avatar ? (
              <img 
                src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://localhost:5000${userInfo.avatar}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = userInfo.fullName?.charAt(0) || 'U'; }}
              />
            ) : (
              userInfo.fullName?.charAt(0) || 'U'
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-text">{userInfo.fullName}</h1>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mt-1 capitalize">
              {userInfo.role}
            </span>
            
            {/* Show Program/ID ONLY if Student */}
            {!isAdminOrStaff && (
              <div className="flex gap-6 mt-3 text-sm text-text">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-muted" />
                  <div>
                    <p className="font-semibold">{studentInfo.program || 'N/A'}</p>
                    <p className="text-[10px] text-muted">Program</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted" />
                  <div>
                    <p className="font-semibold">{studentInfo.studentNumber || 'N/A'}</p>
                    <p className="text-[10px] text-muted">Student ID</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
          >
            <User size={16} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PERSONAL INFORMATION (Always shown) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="flex items-center gap-2 font-extrabold text-text mb-4">
              <User size={18} className="text-blue-600" /> Personal Information
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow icon={User} label="Full Name" value={userInfo.fullName} />
              <InfoRow icon={Mail} label="Email Address" value={userInfo.email} />
              <InfoRow icon={Phone} label="Contact Number" value={studentInfo.contactNumber || 'Not set'} />
              {!isAdminOrStaff && (
                <>
                  <InfoRow icon={FileText} label="Student ID" value={studentInfo.studentNumber || 'N/A'} />
                  <InfoRow icon={GraduationCap} label="Program" value={studentInfo.program || 'N/A'} />
                  <InfoRow icon={BookOpen} label="Year Level" value={studentInfo.yearLevel || 'N/A'} />
                </>
              )}
            </div>
          </div>

          {/* DYNAMIC SECTION: OJT PLACEMENT (Students) vs ADMIN ACCESS (Admins/Staff) */}
          {isAdminOrStaff ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="flex items-center gap-2 font-extrabold text-text mb-4">
                <Shield size={18} className="text-blue-600" /> System Access
              </h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={ShieldCheck} label="Role" value={userInfo.role === 'admin' ? 'System Administrator' : 'Company Supervisor'} />
                <InfoRow icon={Building} label="Department" value={userInfo.department || 'Administration'} />
                <InfoRow icon={Mail} label="Account Status" value="Active" />
                <InfoRow icon={Clock} label="Last Login" value={new Date().toLocaleDateString()} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="flex items-center gap-2 font-extrabold text-text mb-4">
                <Building size={18} className="text-blue-600" /> OJT Placement
              </h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={Building} label="Company Name" value={companyInfo.name || 'Not Assigned'} />
                <InfoRow icon={Briefcase} label="Company Supervisor" value={companyInfo.contactPerson || 'Not Assigned'} />
                <InfoRow icon={User} label="OJT Coordinator" value="TBA" />
                <InfoRow icon={Calendar} label="Start Date" value={companyInfo.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString() : 'TBA'} />
                <InfoRow icon={Clock} label="Required Hours" value="486 hours" />
                <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-semibold">Status</span>
                  </div>
                  <span className="bg-green-100 text-success text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> {studentInfo.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS (Only show if NOT Admin/Staff) */}
          {!isAdminOrStaff && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="flex items-center gap-2 font-extrabold text-text mb-4">
                <FileText size={18} className="text-blue-600" /> Documents
              </h3>
              <div className="space-y-3">
                <DocRow title="MOA (Memorandum of Agreement)" subtitle="Signed copy of the agreement with the company." doc={findDoc('MOA')} />
                <DocRow title="Insurance" subtitle="Proof of student insurance coverage." doc={findDoc('Insurance')} />
                <DocRow title="Endorsement Letter" subtitle="University endorsement for OJT." doc={findDoc('Endorsement Letter')} />
              </div>
            </div>
          )}

          {/* ACCOUNT SECURITY (Always shown) */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-border ${isAdminOrStaff ? 'md:col-span-2' : ''}`}>
            <h3 className="flex items-center gap-2 font-extrabold text-text mb-1">
              <ShieldCheck size={18} className="text-blue-600" /> Account Security
            </h3>
            <p className="text-xs text-muted mb-4">Keep your account safe and secure.</p>
            
            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mb-4">
              <Lock size={18} className="text-blue-500 mt-0.5" />
              <p className="text-xs text-blue-800">Change your password regularly to protect your account.</p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
              <Lock size={16} /> Change Password
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={16} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <span className="font-medium text-right text-xs">{value}</span>
    </div>
  );
}

function DocRow({ title, subtitle, doc }) {
  let badgeColor = "bg-gray-100 text-muted";
  let badgeText = "Missing";
  let badgeIcon = <AlertCircle size={10} />;

  if (doc) {
    if (doc.status === 'Approved') {
      badgeColor = "bg-green-100 text-success";
      badgeText = "Approved";
      badgeIcon = <CheckCircle2 size={10} />;
    } else if (doc.status === 'Pending') {
      badgeColor = "bg-amber-100 text-warning";
      badgeText = "Pending";
      badgeIcon = <Clock size={10} />;
    } else if (doc.status === 'Rejected') {
      badgeColor = "bg-red-100 text-danger";
      badgeText = "Rejected";
      badgeIcon = <X size={10} />;
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={16} /></div>
        <div>
          <p className="font-semibold text-xs text-text">{title}</p>
          <p className="text-[10px] text-muted">{subtitle}</p>
        </div>
      </div>
      <span className={`${badgeColor} text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
        {badgeIcon} {badgeText}
      </span>
    </div>
  );
}