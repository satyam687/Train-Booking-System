import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Train, Lock, User, LogIn, CheckCircle2, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Signed in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
          <Train className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to RailBook AI
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to access your bookings, e-tickets, and personalized AI recommendations.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0f2444] hover:bg-[#1a3863] text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Credentials Quick Fill */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase text-center tracking-wider">
            Quick Fill Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('passenger', 'pass123')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 font-bold transition text-left"
            >
              <div>Passenger User</div>
              <div className="text-[10px] text-blue-600 font-mono font-normal">passenger / pass123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/70 text-orange-900 font-bold transition text-left"
            >
              <div>Admin User</div>
              <div className="text-[10px] text-orange-600 font-mono font-normal">admin / admin123</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
};
