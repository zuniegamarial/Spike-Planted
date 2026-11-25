import { useState } from 'react';
import { X, User, Bell, Shield, Sliders, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({ onClose }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  const isAdmin = user?.role === 'admin' || user?.role === 'coordinator';

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    ...(isAdmin ? [{ id: 'system', label: 'System', icon: Sliders }] : [])
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-text">Settings</h2>
            <p className="text-xs text-muted">Manage your preferences and system configuration.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-muted transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-1/3 bg-background border-r border-border p-4 space-y-2 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === tab.id 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-muted hover:bg-white/50'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {activeTab === 'account' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="font-extrabold text-text">Account Preferences</h3>
                <div className="space-y-3 text-sm text-muted">
                  <p>You are currently logged in as <strong className="text-primary capitalize">{user?.role}</strong>.</p>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <p className="text-xs font-semibold text-text">Display Name</p>
                    <p>{user?.fullName}</p>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <p className="text-xs font-semibold text-text">Email Address</p>
                    <p>{user?.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-red-50 text-danger px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="font-extrabold text-text">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-semibold text-text">Email Notifications</p>
                      <p className="text-xs text-muted">Receive updates via email.</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-semibold text-text">Push Alerts</p>
                      <p className="text-xs text-muted">Show in-app popups.</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="font-extrabold text-text">Security</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-background rounded-xl border border-border hover:bg-gray-50 transition">
                    <p className="text-sm font-semibold text-text">Change Password</p>
                    <p className="text-xs text-muted">Update your login credentials.</p>
                  </button>
                  <button className="w-full text-left p-3 bg-background rounded-xl border border-border hover:bg-gray-50 transition">
                    <p className="text-sm font-semibold text-text">Two-Factor Authentication</p>
                    <p className="text-xs text-muted">Add an extra layer of security.</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="font-extrabold text-text">System Configuration</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <p className="text-sm font-semibold text-text">Required OJT Hours</p>
                    <input type="number" defaultValue={486} className="mt-2 w-full p-2 rounded-lg border border-border text-sm" />
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <p className="text-sm font-semibold text-text">Maintenance Mode</p>
                    <p className="text-xs text-muted mb-2">Temporarily disable student access.</p>
                    <input type="checkbox" className="w-5 h-5 accent-primary" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}