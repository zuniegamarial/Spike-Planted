import { X, Building, Mail, User, Briefcase } from 'lucide-react';

export default function CompanyDetailsModal({ companyName, onClose }) {
  // In a real app, you would fetch the company by name from the backend.
  // For now, we use the name passed from the table.
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-extrabold text-text">Company Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-muted transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary">
              <Building size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text">{companyName}</h1>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mt-1">
                OJT Partner
              </span>
            </div>
          </div>

          <div className="bg-background rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase size={16} className="text-muted" />
              <div>
                <p className="text-xs text-muted font-semibold">Company Name</p>
                <p className="text-sm font-medium">{companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-muted" />
              <div>
                <p className="text-xs text-muted font-semibold">Contact Person</p>
                <p className="text-sm font-medium">Company</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted" />
              <div>
                <p className="text-xs text-muted font-semibold">Email</p>
                <p className="text-sm font-medium">company@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}