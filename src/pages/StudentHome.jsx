// javascript
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  CreditCard,
  FileText,
  PlusCircle,
  MessageSquare,
  User
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/*
  StudentHome.jsx
  - Simplified: removed hostel/room fetching and displays only student profile info from AuthContext.
*/

const StudentHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use user object from AuthContext for profile display
  const studentObj = user ?? {};

  const QuickActionButton = ({ icon, label, onClick, color = 'bg-primary' }) => (
      <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${color} text-white hover:opacity-95`}>
        {icon}
        <span>{label}</span>
      </button>
  );

  return (
      <div className="min-h-screen bg-gray-50 text-slate-900">
        {/* Topbar */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-lg font-semibold">Welcome back{studentObj?.name ? `, ${studentObj.name.split(' ')[0]}` : ''}!</h2>
                <p className="text-sm text-gray-500">Student dashboard</p>
                {/* simplified profile line */}
                <div className="text-xs text-gray-400 mt-1">
                <span>
                  {studentObj?.email ? (
                      <>Email: <span className="font-medium text-sm">{studentObj.email}</span></>
                  ) : (
                      <>ID: <span className="font-medium text-sm">{studentObj?.id ?? '—'}</span></>
                  )}
                </span>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-xl hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input className="bg-transparent outline-none text-sm w-full" placeholder="Search announcements, complaints, payments..." />
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-md hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 text-xs bg-red-500 text-white rounded-full px-1.5">3</span>
              </button>

              <div className="relative" ref={profileRef}>
                <button
                    aria-label="Profile menu"
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">{studentObj?.name?.charAt(0) ?? 'S'}</div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                      <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('profile');
                          }}
                      >
                        Profile
                      </button>
                      <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('settings');
                          }}
                      >
                        Settings
                      </button>
                      <div className="border-t" />
                      <button
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-gray-50"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            navigate('/login');
                          }}
                      >
                        Logout
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'col-span-12' : 'col-span-3 md:col-span-2 lg:col-span-2'} bg-white border rounded-md p-4 md:sticky md:top-6`}>
            <nav className="flex flex-col gap-2">
              <NavLink to="." end className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Dashboard</span>
              </NavLink>
              <NavLink to="room" className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Room</span>
              </NavLink>
              <NavLink to="fees" className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Fees</span>
              </NavLink>
              <NavLink to="complaints" className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Complaints</span>
              </NavLink>
              <NavLink to="announcements" className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Announcements</span>
              </NavLink>
              <NavLink to="support" className={({isActive}) => `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Support</span>
              </NavLink>
            </nav>
          </aside>

          {/* Main content area - nested routes will render here */}
          <section className="col-span-12 md:col-span-7 lg:col-span-8">
            <div>
              <div className="min-h-[60vh]">
                <Outlet />
              </div>
            </div>
          </section>

          {/* Right column: quick actions */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="bg-white border rounded-md p-4 sticky top-6">
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="flex flex-col gap-3">
                <QuickActionButton icon={<PlusCircle className="w-4 h-4" />} label="New Complaint" color="bg-rose-500" onClick={() => alert('Open complaint modal (hook API to POST /complaints)')} />
                <QuickActionButton icon={<CreditCard className="w-4 h-4" />} label="Pay Now" color="bg-amber-500" onClick={() => alert('Open payment flow (hook API POST /payments)')} />
                <QuickActionButton icon={<FileText className="w-4 h-4" />} label="Request Room Change" color="bg-sky-500" onClick={() => alert('Open request form (POST /requests)')} />
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Tip: Click an action to open the corresponding flow. Replace alerts with real modals and API calls.
              </div>
            </div>
          </aside>
        </div>
      </div>
  );
};

export default StudentHome;