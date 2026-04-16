import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, BookOpen, Users, GraduationCap, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', confirm: '', role: 'student', unit_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const ROLE_ROUTES = { student: '/student', lecturer: '/lecturer', rep: '/rep' };

  useEffect(() => {
    // Only fetch units if the role can enroll
    if (form.role !== 'lecturer') {
      api.get('/units/all/')
        .then(({ data }) => setAvailableUnits(data))
        .catch(() => {});
    } else {
      setForm(f => ({ ...f, unit_ids: [] }));
    }
  }, [form.role]);

  if (user) {
    return <Navigate to={ROLE_ROUTES[user.role] || '/student'} replace />;
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleUnit = (id) => {
    setForm(f => ({
      ...f,
      unit_ids: f.unit_ids.includes(id) 
        ? f.unit_ids.filter(u => u !== id) 
        : [...f.unit_ids, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      const payload = { ...form };
      delete payload.confirm;

      const { data } = await api.post('/auth/register/', payload);
      login(data.user, data.access, data.refresh);
      toast.success('Registration successful!');
      navigate(ROLE_ROUTES[data.user.role] ?? '/student');
    } catch {
      toast.error('Registration failed. Username may exist.');
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { value: 'student', label: 'Student', icon: BookOpen },
    { value: 'rep', label: 'Class Rep', icon: Users },
    { value: 'lecturer', label: 'Lecturer', icon: GraduationCap },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[40%] bg-green-900 flex-col p-[10%] justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-800/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-[56px] text-white leading-none mb-4 tracking-wide">AMS</h1>
          <p className="text-[18px] text-green-200 mb-12 tracking-wide font-medium">Join your academic workspace</p>
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
        <div className="w-full max-w-[500px] mx-auto page-enter py-12">
          {/* Tabs */}
          <div className="flex gap-8 mb-10 border-b border-gray-100">
            <Link to="/login" className="pb-4 font-semibold text-[15px] text-gray-400 hover:text-gray-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="pb-4 font-bold text-[15px] relative text-green-900">
              Create Account
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-700 rounded-t-full" />
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="lg:hidden font-serif text-[42px] text-green-900 leading-none mb-2 tracking-wide">AMS</h1>
            <h2 className="font-serif text-[32px] text-gray-800 tracking-wide">Create an account</h2>
            <p className="text-[14px] text-gray-500 mt-2 font-medium">Fill in your details below to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">First Name</label>
                <input required value={form.first_name} onChange={set('first_name')} className="input-field" placeholder="Jane" />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Last Name</label>
                <input required value={form.last_name} onChange={set('last_name')} className="input-field" placeholder="Doe" />
              </div>
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Username</label>
                <input required value={form.username} onChange={set('username')} className="input-field" placeholder="janedoe123" />
               </div>
               <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Email</label>
                <input required type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="jane@university.edu" />
               </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Password</label>
                <input required type="password" value={form.password} onChange={set('password')} className="input-field" placeholder="••••••••" />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Confirm Password</label>
                <input required type="password" value={form.confirm} onChange={set('confirm')} className="input-field" placeholder="••••••••" />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-3">Select your role</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(r => {
                  const isSelected = form.role === r.value;
                  return (
                    <label 
                      key={r.value} 
                      className={`
                        relative flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all
                        ${isSelected ? 'border-green-500 bg-green-50 shadow-[0_0_0_1px_rgba(34,160,107,1)]' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'}
                      `}
                    >
                      <input type="radio" name="role" value={r.value} checked={isSelected} onChange={set('role')} className="hidden" />
                      <r.icon size={24} className={`mb-2 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`text-[13px] font-semibold ${isSelected ? 'text-green-800' : 'text-gray-600'}`}>{r.label}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {form.role !== 'lecturer' && availableUnits.length > 0 && (
              <div className="pt-2">
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-3">Enroll in Units (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {availableUnits.map(unit => {
                    const isSelected = form.unit_ids.includes(unit.id);
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => toggleUnit(unit.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border
                          ${isSelected ? 'bg-green-200 border-green-200 text-green-900' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        {unit.code} — {unit.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px] text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-green-700 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
