import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Clock, BookOpen, FileText,
  Users, BarChart3, Settings, LogOut, HelpCircle, Bell, Search, Menu,
  Building, CheckCircle, X, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFileUrl } from '../api/axios';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ProfilePopover from '../components/ProfilePopover';
import LiveTimer from '../components/LiveTimer';
import SettingsModal from '../components/SettingsModal'; // <-- Added Import
import { useTimer } from '../context/TimerContext'; // <-- Use global timer

const navItems = {
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: Clock, label: 'Attendance' },
    { to: '/journals', icon: BookOpen, label: 'Weekly Journals' },
    { to: '/documents', icon: FileText, label: 'Documents' },
  ],

  staff: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/interns', icon: Users, label: 'My Interns' },
    { to: '/supervisor-reviews', icon: ClipboardCheck, label: 'Supervisor Reviews' },
    { to: '/post-requirements', icon: FileText, label: 'Post Requirements' },
  ],

  coordinator: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Student List' },
    { to: '/review', icon: CheckCircle, label: 'Approvals' },
  ],

  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'All Students' },
    { to: '/companies', icon: Building, label: 'Companies' },
    { to: '/reports', icon: BarChart3, label: 'System Reports' },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { activeSession } = useTimer(); // <-- Use global timer
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAllAsRead,
    clearNotifications
  } = useNotifications();

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // <-- Added Settings State

  const items = navItems[user?.role] || navItems.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMainClick = () => {
    setIsOpen(false);
    setShowProfile(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[88px] bg-white flex flex-col items-center py-6
        transition-transform duration-300 shadow-soft
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* LOGO */}
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center mb-10">
          <span className="text-xl font-extrabold text-white">S</span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-2 flex-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer
                transition-all duration-200
                ${isActive
                  ? 'bg-text text-white shadow-card'
                  : 'text-muted hover:bg-primary-light hover:text-primary'}
              `}
            >
              <item.icon size={20} strokeWidth={2} />
            </NavLink>
          ))}
        </nav>

        {/* SIDEBAR ACTIONS */}
        <div className="flex flex-col gap-2">

          <button
            onClick={() => alert('Help Center coming soon!')}
            title="Help"
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted hover:bg-background cursor-pointer"
          >
            <HelpCircle size={20} />
          </button>

          <button
            onClick={() => setShowSettings(true)} // <-- Changed to open Settings
            title="Settings"
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted hover:bg-background cursor-pointer"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted hover:bg-red-50 hover:text-danger transition cursor-pointer"
          >
            <LogOut size={20} />
          </button>

          {/* SIDEBAR AVATAR */}
          <div className="mt-3 w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
            {user?.avatar ? (
              <img
                src={getFileUrl(user.avatar)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerText = user?.fullName?.charAt(0) || 'U';
                }}
              />
            ) : (
              user?.fullName?.charAt(0) || 'U'
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 ml-[88px] lg:ml-0">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 px-6 lg:px-10 py-6">

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-soft cursor-pointer"
          >
            <Menu size={20} />
          </button>

          {/* SEARCH */}
          <div className="flex-1 max-w-md relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white shadow-soft text-sm outline-none focus:ring-2 focus:ring-primary-light border-none"
            />
          </div>

          <div className="flex items-center gap-3 relative">

            {/* LIVE TIMER */}
            {user?.role === 'student' && activeSession && (
              <LiveTimer startTime={activeSession} />
            )}

            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                  setShowProfile(false);
                }}
                className="relative w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
              >
                <Bell size={18} className="text-text" />

                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {isOpen && (
                <div className="absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-card border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-extrabold text-sm text-text">
                      Notifications
                    </h3>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-muted hover:text-text"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b border-border/50 text-sm ${
                            n.read ? 'bg-white' : 'bg-primary-light/30'
                          }`}
                        >
                          <p className="text-text">{n.text}</p>

                          <p className="text-[10px] text-muted mt-1">
                            {formatDistanceToNow(new Date(n.time))} ago
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 bg-background flex justify-between border-t border-border">

                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>

                      <button
                        onClick={clearNotifications}
                        className="text-xs font-bold text-danger hover:underline"
                      >
                        Clear all
                      </button>

                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CLICKABLE PROFILE */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setIsOpen(false);
                }}
                className="hidden sm:flex items-center gap-3 px-4 h-11 rounded-2xl bg-white shadow-soft hover:bg-gray-50 transition cursor-pointer"
              >

                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getFileUrl(user.avatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = user?.fullName?.charAt(0) || 'U';
                      }}
                    />
                  ) : (
                    user?.fullName?.charAt(0) || 'U'
                  )}
                </div>

                <div className="text-xs text-left">
                  <p className="font-semibold leading-tight">
                    {user?.fullName}
                  </p>

                  <p className="text-muted capitalize leading-tight">
                    {user?.role}
                  </p>
                </div>
              </button>

              {/* PROFILE DROPDOWN */}
              {showProfile && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfile(false)}
                  />

                  <div className="absolute top-14 right-0 z-50">
                    <ProfilePopover onClose={() => setShowProfile(false)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div
          className="flex-1 px-6 lg:px-10 pb-10"
          onClick={handleMainClick}
        >
          <Outlet />
        </div>

      </main>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

    </div>
  );
}