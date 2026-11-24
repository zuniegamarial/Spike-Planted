import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  FileText,
  FilePlus2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  HelpCircle,
  Bell,
  Search,
  Menu,
  Building,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ProfilePopover from '../components/ProfilePopover';

const NAV_ITEMS = {
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: Clock, label: 'Attendance' },
    { to: '/journals', icon: BookOpen, label: 'Weekly Journals' },
    { to: '/documents', icon: FileText, label: 'Documents' }
  ],
  staff: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/interns', icon: Users, label: 'My Interns' },
    { to: '/post-requirements', icon: FilePlus2, label: 'Required Docs' }
  ],
  coordinator: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Student List' },
    { to: '/review', icon: CheckCircle, label: 'Approvals' },
    { to: '/documents', icon: FileText, label: 'Documents' }
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'All Students' },
    { to: '/review', icon: CheckCircle, label: 'Approvals' },
    { to: '/companies', icon: Building, label: 'Companies' },
    { to: '/reports', icon: BarChart3, label: 'System Reports' }
  ]
};

function AvatarBadge({ user, sizeClass = 'w-7 h-7 text-xs', bgClass = 'bg-primary text-white' }) {
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div
      className={`${sizeClass} ${bgClass} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0`}
    >
      {user?.avatar ? (
        <img
          src={`http://localhost:5000${user.avatar}`}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement.innerText = initial;
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
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

  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.student;

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
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-30 w-[84px] h-screen bg-white flex flex-col items-center justify-between py-5 overflow-y-auto lg:overflow-hidden shrink-0 transition-transform duration-300 shadow-soft ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand + Main Navigation */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-lg font-extrabold text-white">S</span>
          </div>

          <nav className="flex flex-col items-center gap-1 w-full">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-text text-white shadow-card'
                        : 'text-muted hover:bg-primary-light hover:text-primary'
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={2} />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utilities + Profile Avatar */}
        <div className="flex flex-col items-center gap-1 w-full pt-3 border-t border-border/70">
          <button
            type="button"
            onClick={() => alert('Help Center coming soon!')}
            title="Help"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:bg-background cursor-pointer"
          >
            <HelpCircle size={19} />
          </button>

          <button
            type="button"
            onClick={() => alert('Settings coming soon!')}
            title="Settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:bg-background cursor-pointer"
          >
            <Settings size={19} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:bg-red-50 hover:text-danger transition cursor-pointer"
          >
            <LogOut size={19} />
          </button>

          <div className="mt-1">
            <AvatarBadge
              user={user}
              sizeClass="w-9 h-9 text-xs"
              bgClass="bg-primary-light text-primary"
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-6 lg:px-10 py-6">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-soft cursor-pointer"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-md relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white shadow-soft text-sm outline-none focus:ring-2 focus:ring-primary-light border-none"
            />
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
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

              {isOpen && (
                <div className="absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-card border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-extrabold text-sm text-text">
                      Notifications
                    </h3>
                    <button
                      type="button"
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
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                      <button
                        type="button"
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

            {/* Profile Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(!showProfile);
                  setIsOpen(false);
                }}
                className="hidden sm:flex items-center gap-3 px-4 h-11 rounded-2xl bg-white shadow-soft hover:bg-gray-50 transition cursor-pointer"
              >
                <AvatarBadge user={user} />
                <div className="text-xs text-left">
                  <p className="font-semibold leading-tight">{user?.fullName}</p>
                  <p className="text-muted capitalize leading-tight">
                    {user?.role}
                  </p>
                </div>
              </button>

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

        <div className="flex-1 px-6 lg:px-10 pb-10" onClick={handleMainClick}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}