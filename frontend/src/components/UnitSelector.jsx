import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UnitSelector() {
  const { units, activeUnit, setActiveUnit, refreshUnits } = useUnit();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States for Modals/Enrollment UI managed within the dropdown interaction
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [allUnits, setAllUnits] = useState([]);
  
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllUnits = async () => {
    try {
      const { data } = await api.get('/units/all/');
      setAllUnits(data);
    } catch {
      toast.error('Failed to load available units');
    }
  };

  const handleEnrollClick = () => {
    fetchAllUnits();
    setShowEnroll(true);
  };

  const handleEnrollSubmit = async (unitId) => {
    try {
      await api.post(`/units/${unitId}/enroll/`);
      toast.success('Successfully enrolled!');
      refreshUnits();
      setShowEnroll(false);
    } catch {
      toast.error('Failed to enroll in unit');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/units/', { code: newCode, name: newName });
      toast.success('Unit created successfully');
      refreshUnits();
      setShowCreate(false);
      setNewCode('');
      setNewName('');
    } catch (err) {
      const msg = err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to create unit';
      toast.error(msg);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setShowCreate(false);
          setShowEnroll(false);
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
      >
        {activeUnit ? (
          <div className="text-left flex items-center gap-3">
            <span className="badge-unit">{activeUnit.code}</span>
            <span className="font-serif text-[16px] text-gray-800 tracking-wide hidden sm:block">
              {activeUnit.name}
            </span>
          </div>
        ) : (
          <span className="font-serif text-[16px] text-gray-500 italic">Select Unit</span>
        )}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden page-enter">
          
          {/* Main Dropdown View */}
          {!showCreate && !showEnroll && (
            <div className="py-2">
              <div className="px-4 py-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Your Units</p>
              </div>
              
              <div className="max-h-[240px] overflow-y-auto">
                {units.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-gray-500">No units enrolled.</p>
                  </div>
                ) : (
                  units.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveUnit(u);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="badge-unit">{u.code}</span>
                        <span className="text-[14px] text-gray-800 font-medium">{u.name}</span>
                      </div>
                      {activeUnit?.id === u.id && <Check size={16} className="text-green-500" />}
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 mt-2 pt-2 px-2">
                {user?.role === 'lecturer' ? (
                  <button 
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors"
                  >
                    <Plus size={16} /> Create Unit
                  </button>
                ) : (
                  <button 
                    onClick={handleEnrollClick}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors"
                  >
                    <Plus size={16} /> Enroll in Unit
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Create Unit View */}
          {showCreate && (
             <div className="p-4 bg-gray-50">
               <h3 className="font-serif text-lg mb-4 text-gray-800">Create New Unit</h3>
               <form onSubmit={handleCreateSubmit} className="space-y-3">
                 <div>
                   <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Unit Code</label>
                   <input required value={newCode} onChange={e=>setNewCode(e.target.value)} placeholder="e.g. CS301" className="input-field" />
                 </div>
                 <div>
                   <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Unit Name</label>
                   <input required value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Data Structures" className="input-field" />
                 </div>
                 <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
                   <button type="submit" className="btn-primary flex-1">Create</button>
                 </div>
               </form>
             </div>
          )}

          {/* Enroll Unit View */}
          {showEnroll && (
            <div className="p-4 bg-gray-50">
               <h3 className="font-serif text-lg mb-2 text-gray-800">Available Units</h3>
               <div className="max-h-[200px] overflow-y-auto bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                 {allUnits.filter(u => !units.find(enrolled => enrolled.id === u.id)).length === 0 ? (
                   <p className="text-center text-gray-500 text-sm py-4">No new units available.</p>
                 ) : (
                   allUnits.filter(u => !units.find(enrolled => enrolled.id === u.id)).map(unit => (
                     <div key={unit.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div>
                          <span className="badge-unit mb-1 block w-max">{unit.code}</span>
                          <span className="text-[13px] text-gray-800 font-medium block leading-tight">{unit.name}</span>
                        </div>
                        <button 
                          onClick={() => handleEnrollSubmit(unit.id)}
                          className="btn-ghost !h-7 !px-2 !text-[12px] text-green-700 border-green-200 hover:bg-green-50"
                        >
                          Enroll
                        </button>
                     </div>
                   ))
                 )}
               </div>
               <button onClick={() => setShowEnroll(false)} className="mt-3 btn-ghost w-full">Back</button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
