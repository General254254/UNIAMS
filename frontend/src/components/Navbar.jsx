import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Upload, FileText, Users, BarChart2, Settings, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';
import UnitSelector from './UnitSelector';

function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  
  const navItems = [
    { label: 'Dashboard', icon: BarChart2, to: `/${user?.role}` },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside 
        className={`fixed md:static inset-y-0 left-0 w-[240px] bg-green-900 border-r border-green-800/50 flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-[24px] text-white tracking-wide">AMS</h1>
              <p className="text-[11px] text-white/50 tracking-wide mt-1 uppercase font-semibold">Assignment Management</p>
            </div>
            <button className="md:hidden text-white/70" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="px-6 mb-6">
          <div className="h-px bg-white/10 w-full" />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 h-[44px] px-4 rounded-lg text-[14px] font-medium transition-colors
                ${isActive 
                  ? 'bg-green-700 text-white border-l-[3px] border-green-200' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'}
              `}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-white text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</span>
            <span className="text-white/50 text-[11px] uppercase tracking-wider">{user?.role}</span>
          </div>
          <div className="mt-4 text-center">
            <span className="text-[11px] text-white/30 hidden md:block">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Navbar({ children }) {
  const { user, logout } = useAuth();
  const { activeUnit } = useUnit();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="app-shell bg-green-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="content">
        <header className="sticky top-0 bg-white border-b border-gray-100 h-[60px] px-4 md:px-8 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-500 hover:text-gray-800" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            
            <UnitSelector />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <div className="text-right">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <div className="badge-unit mt-1 inline-block capitalize">
                  {user?.role}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-sm">
                {getInitials()}
              </div>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block" />
            
            <button 
              onClick={logout}
              className="btn-ghost !h-9 !px-3 text-gray-500 hover:text-danger hover:bg-red-50 hover:border-red-100 transition-colors"
              title="Logout"
            >
              <LogOut size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
