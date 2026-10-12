import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Train,
  Sparkles,
  Radio,
  BarChart3,
  User,
  Ticket,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('You have logged out.');
    navigate('/');
  };

  const navLinks = [
    { name: 'Search Trains', path: '/search', icon: Train },
    { name: 'AI Recommendations', path: '/ai-recommendations', icon: Sparkles, badge: 'AI' },
    { name: 'Live Status', path: '/live-status', icon: Radio },
    { name: 'Demand Analytics', path: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ name: 'Admin Hub', path: '/admin-dashboard', icon: ShieldCheck }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#0f2444] text-white border-b border-slate-700/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-105 transition">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
                <span>RailBook</span>
                <span className="text-orange-400">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Smart Rail Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-blue-900/60 text-white font-semibold shadow-inner'
                      : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User / Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/my-bookings"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Ticket className="w-3.5 h-3.5 text-orange-400" />
                  <span>My Bookings</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px]">
                    {user?.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                  <span>{user?.first_name || user?.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800/50 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c1d37] border-b border-slate-800 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <item.icon className="w-5 h-5 text-orange-400" />
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-800 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Ticket className="w-5 h-5 text-orange-400" />
                  <span>My Bookings</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
                >
                  <User className="w-5 h-5 text-blue-400" />
                  <span>Profile ({user?.username})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-slate-800"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-slate-800 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-orange-500 text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
