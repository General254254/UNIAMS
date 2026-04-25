import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Download, FileBarChart } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RepDashboard() {
  const { activeUnit } = useUnit();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({}); // mapped by assignment id
  const [loading, setLoading] = useState(true);
  const [expandedAssn, setExpandedAssn] = useState(null);

  useEffect(() => {
    if (!activeUnit?.id) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/units/${activeUnit.id}/assignments/`)
      .then(({ data }) => setAssignments(data))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [activeUnit?.id]);

  const toggleAccordion = async (assnId) => {
    if (expandedAssn === assnId) {
      setExpandedAssn(null);
      return;
    }
    
    setExpandedAssn(assnId);
    
    // Fetch submissions only if not cached
    if (!submissions[assnId]) {
      try {
        const { data } = await api.get(`/units/${activeUnit.id}/assignments/${assnId}/submissions/`);
        setSubmissions(prev => ({ ...prev, [assnId]: data }));
      } catch {
        toast.error('Failed to load submissions for this assignment');
        setExpandedAssn(null);
      }
    }
  };

  if (!activeUnit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center page-enter">
        <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={40} className="text-green-800" />
        </div>
        <h1 className="font-serif text-[32px] text-gray-800 mb-2">Class Representative</h1>
        <p className="text-[16px] text-gray-500 max-w-sm">
          Please select a unit to oversee class performance and tracking.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="mb-8">
        <span className="badge-unit mb-2 inline-block">{activeUnit.code}</span>
        <h1 className="font-serif text-[28px] text-gray-800 leading-none">Submissions Overview</h1>
        <p className="text-[14px] text-gray-500 mt-2">Track assignment completion rates across your class.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-20 px-4">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileBarChart size={32} className="text-gray-300" />
          </div>
          <h3 className="font-serif text-[20px] text-gray-800 mb-2">No assignments yet</h3>
          <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-6">Once the lecturer creates assignments, they will appear here for tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assn => {
            const isExpanded = expandedAssn === assn.id;
            const submitCount = assn.submission_count || 0;
            const totalEnrolled = assn.total_enrolled || 1;
            const pct = Math.min(100, Math.round((submitCount / totalEnrolled) * 100));

            return (
              <div key={assn.id} className={`card p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'border-green-300 shadow-md' : ''}`}>
                <button 
                  onClick={() => toggleAccordion(assn.id)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <h3 className="font-serif text-[20px] text-gray-800 mb-2 truncate">{assn.title}</h3>
                    <div className="flex items-center gap-6 text-[13px]">
                      <div className="flex items-center gap-2">
                         <span className="font-semibold text-gray-800">{submitCount} / {totalEnrolled}</span>
                         <span className="text-gray-500">submitted</span>
                      </div>
                      <div className="w-[120px] h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition-transform">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    <div className="p-4 sm:p-6">
                      
                      {!submissions[assn.id] ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-green-200 border-t-green-700 rounded-full animate-spin" />
                        </div>
                      ) : submissions[assn.id].length === 0 ? (
                        <p className="text-center text-[13px] text-gray-500 italic py-4">No submissions uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[2fr_1fr_1fr] px-4 pb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            <div>Student</div>
                            <div>Status</div>
                            <div className="text-right">File</div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                            {submissions[assn.id].map(sub => (
                              <div key={sub.id} className="grid grid-cols-[2fr_1fr_1fr] p-3 sm:px-4 items-center">
                                <div>
                                  <p className="text-[13px] font-semibold text-gray-800">{sub.student_name}</p>
                                  <p className="text-[11px] text-gray-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="badge-submitted px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Submitted
                                  </span>
                                </div>
                                <div className="text-right flex justify-end">
                                  <a 
                                    href={sub.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                    title="View Document"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
