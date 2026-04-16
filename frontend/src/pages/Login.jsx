import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const ROLE_ROUTES = { student: '/student', lecturer: '/lecturer', rep: '/rep' };

  if (user) {
    return <Navigate to={ROLE_ROUTES[user.role] || '/student'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', { username, password });
      login(data.user, data.access, data.refresh);
      toast.success('Welcome back!');
      navigate(ROLE_ROUTES[data.user.role] ?? '/student');
    } catch {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[40%] bg-green-900 flex-col p-[10%] justify-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-800/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="font-serif text-[56px] text-white leading-none mb-4 tracking-wide">AMS</h1>
          <p className="text-[18px] text-green-200 mb-12 tracking-wide font-medium">Your academic workspace</p>
          
          <div className="space-y-6">
            {[
              "Streamline assignment submissions",
              "Access curated revision materials",
              "Track your academic progress in real-time"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 text-white/80">
                <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                <span className="text-[15px] font-medium leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-[420px] mx-auto page-enter">
          {/* Tabs */}
          <div className="flex gap-8 mb-10 border-b border-gray-100">
            <Link to="/login" className="pb-4 font-bold text-[15px] relative text-green-900">
              Sign In
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-700 rounded-t-full" />
            </Link>
            <Link to="/register" className="pb-4 font-semibold text-[15px] text-gray-400 hover:text-gray-600 transition-colors">
              Create Account
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="lg:hidden font-serif text-[42px] text-green-900 leading-none mb-2 tracking-wide">AMS</h1>
            <h2 className="font-serif text-[32px] text-gray-800 tracking-wide">Welcome back</h2>
            <p className="text-[14px] text-gray-500 mt-2 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Username</label>
              <input
                required
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Password</label>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px] text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-700 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
