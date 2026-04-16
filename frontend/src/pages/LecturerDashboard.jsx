import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Upload, Trash2, Users, FileBarChart } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import api from '../services/api';
import toast from 'react-hot-toast';

import UploadModal from '../components/UploadModal';

export default function LecturerDashboard() {
  const { activeUnit } = useUnit();
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'revisions'
  
  const [assignments, setAssignments] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New assignment form state
  const [assnTitle, setAssnTitle] = useState('');
  const [assnDesc, setAssnDesc] = useState('');
  const [assnDeadline, setAssnDeadline] = useState('');
  const [assnFile, setAssnFile] = useState(null);

  // Submission detail states
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState({}); // { assnId: [] }
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);

  const fetchData = async () => {
    if (!activeUnit?.id) {
      setAssignments([]);
      setRevisions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [assnRes, revRes] = await Promise.all([
        api.get(`/units/${activeUnit.id}/assignments/`),
        api.get(`/units/${activeUnit.id}/revisions/`)
      ]);
      setAssignments(assnRes.data);
      setRevisions(revRes.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUnit?.id]);

  const handleRevisionUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.').slice(0, -1).join('.'));

    try {
      await api.post(`/units/${activeUnit.id}/revisions/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Revision material uploaded');
      setShowRevisionModal(false);
      fetchData();
    } catch {
      toast.error('Failed to upload material');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assnFile) {
      toast.error('Please upload an assignment document');
      return;
    }

    const formData = new FormData();
    formData.append('title', assnTitle);
    formData.append('description', assnDesc);
    formData.append('deadline', assnDeadline);
    formData.append('file', assnFile);

    try {
      await api.post(`/units/${activeUnit.id}/assignments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment created');
      setShowAssignModal(false);
      setAssnTitle('');
      setAssnDesc('');
      setAssnDeadline('');
      setAssnFile(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.file?.[0] || 'Failed to create assignment';
      toast.error(msg);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/units/${activeUnit.id}/assignments/${id}/`);
      toast.success('Assignment deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteRevision = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/units/${activeUnit.id}/revisions/${id}/`);
      toast.success('Material deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const fetchSubmissions = async (assnId) => {
    try {
      const res = await api.get(`/units/${activeUnit.id}/assignments/${assnId}/submissions/`);
      setSubmissions(prev => ({ ...prev, [assnId]: res.data }));
    } catch {
      toast.error('Failed to load submissions');
    }
  };

  const handleRunPlagiarism = async (assnId) => {
    setCheckingPlagiarism(true);
    try {
      await api.post(`/units/${activeUnit.id}/assignments/${assnId}/check-plagiarism/`);
      toast.success('Plagiarism check completed');
      fetchSubmissions(assnId);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to run check');
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const toggleExpand = (assnId) => {
    if (expandedAssignment === assnId) {
      setExpandedAssignment(null);
    } else {
      setExpandedAssignment(assnId);
      if (!submissions[assnId]) {
        fetchSubmissions(assnId);
      }
    }
  };

  if (!activeUnit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center page-enter">
        <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={40} className="text-green-800" />
        </div>
        <h1 className="font-serif text-[32px] text-gray-800 mb-2">Lecturer Workspace</h1>
        <p className="text-[16px] text-gray-500 max-w-sm">
          Please select or create a unit from the top navigation bar to manage course content.
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
    <div className="page-enter space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge-unit mb-2 inline-block">{activeUnit.code}</span>
          <h1 className="font-serif text-[28px] text-gray-800 leading-none">{activeUnit.name}</h1>
        </div>
        <div className="flex gap-3">
          {activeTab === 'assignments' ? (
            <button onClick={() => setShowAssignModal(true)} className="btn-primary">
              <Upload size={16} className="mr-2" /> Create Assignment
            </button>
          ) : (
            <button onClick={() => setShowRevisionModal(true)} className="btn-primary">
              <Upload size={16} className="mr-2" /> Upload Material
            </button>
          )}
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-6 border-b border-gray-300">
        <button 
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 font-semibold text-[14px] transition-colors relative ${activeTab === 'assignments' ? 'text-green-800' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Assignments
          {activeTab === 'assignments' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-green-700 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('revisions')}
          className={`pb-3 font-semibold text-[14px] transition-colors relative ${activeTab === 'revisions' ? 'text-green-800' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Revision Materials
          {activeTab === 'revisions' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-green-700 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content Areas */}
      {activeTab === 'assignments' && (
        <div className="card p-0 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileBarChart size={32} className="text-gray-300" />
              </div>
              <h3 className="font-serif text-[20px] text-gray-800 mb-2">No assignments yet</h3>
              <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-6">Create your first assignment to start evaluating your students.</p>
              <button onClick={() => setShowAssignModal(true)} className="btn-ghost">
                Create Assignment
              </button>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr] gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-widest hidden sm:grid">
                <div>Title</div>
                <div>Deadline</div>
                <div>Submissions</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {assignments.map(assn => {
                  const submitCount = assn.submission_count || 0;
                  const totalEnrolled = assn.total_enrolled || 1; // avoid divide by 0
                  const pct = Math.min(100, Math.round((submitCount / totalEnrolled) * 100));

                  return (
                    <div key={assn.id} className="border-b border-gray-100 last:border-0">
                      <div 
                        onClick={() => toggleExpand(assn.id)}
                        className={`grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.5fr_1fr] gap-4 p-4 items-center cursor-pointer transition-colors ${expandedAssignment === assn.id ? 'bg-green-50/30' : 'hover:bg-gray-50/30'}`}
                      >
                        <div>
                          <p className="font-semibold text-[14px] text-gray-800 line-clamp-1">{assn.title}</p>
                        </div>
                        <div className="text-[13px] text-gray-500">
                          {new Date(assn.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        
                        <div className="pe-4">
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="font-medium text-gray-800">{submitCount} / {totalEnrolled}</span>
                            <span className="text-gray-500">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center sm:justify-end gap-2 mt-3 sm:mt-0">
                          <a 
                            href={`/api/units/${activeUnit.id}/assignments/${assn.id}/download-zip/`} 
                            onClick={(e) => e.stopPropagation()}
                            className="btn-ghost !h-8 !px-3 !text-[12px] text-green-700 hover:text-green-800 border-green-200"
                          >
                            <Download size={14} className="mr-1.5" /> ZIP
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(assn.id);
                            }}
                            className="btn-ghost !h-8 !w-8 !p-0 text-gray-400 hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Submission Details */}
                      {expandedAssignment === assn.id && (
                        <div className="bg-gray-50/50 p-6 border-t border-gray-100 page-enter">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[14px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                              <Users size={16} className="text-gray-400" /> Individual Submissions
                            </h4>
                            <button 
                              disabled={checkingPlagiarism || submitCount < 2}
                              onClick={() => handleRunPlagiarism(assn.id)}
                              className="btn-ghost !h-9 !px-4 !text-[12px] text-green-700 border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {checkingPlagiarism ? 'Processing...' : 'Run Plagiarism Check'}
                            </button>
                          </div>

                          {!submissions[assn.id] ? (
                            <div className="py-4 text-center text-gray-400 text-sm">Loading submissions...</div>
                          ) : submissions[assn.id].length === 0 ? (
                            <div className="py-4 text-center text-gray-400 text-sm italic">No submissions yet for this assignment.</div>
                          ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <table className="w-full text-left text-[13px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-500">Student Name</th>
                                    <th className="px-4 py-3 font-semibold text-gray-500">Submitted At</th>
                                    <th className="px-4 py-3 font-semibold text-gray-500 text-center">Similarity</th>
                                    <th className="px-4 py-3 font-semibold text-gray-500 text-right">Document</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {submissions[assn.id].map(sub => {
                                    const score = sub.similarity_score || 0;
                                    const isRisk = score >= 0.75;
                                    return (
                                      <tr key={sub.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{sub.student_name}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                          {new Date(sub.submitted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {score > 0 ? (
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                              {Math.round(score * 100)}%
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <a 
                                            href={sub.file} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-green-700 hover:underline font-medium"
                                          >
                                            View PDF
                                          </a>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'revisions' && (
        <div>
          {revisions.length === 0 ? (
            <div className="card text-center py-20 px-4">
              <FileText size={48} className="mx-auto text-green-200 mb-4" />
              <h3 className="font-serif text-[20px] text-gray-800 mb-2">No materials uploaded</h3>
              <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-6">Upload PDFs or documents to help your students revise.</p>
              <button onClick={() => setShowRevisionModal(true)} className="btn-ghost">
                Upload Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {revisions.map(rev => (
                <div key={rev.id} className="card p-5 group flex flex-col justify-between hover:border-green-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-green-50 group-hover:bg-green-100 transition-colors rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={28} className="text-green-600" />
                    </div>
                    <button 
                      onClick={() => handleDeleteRevision(rev.id)}
                      className="text-gray-400 hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-gray-800 line-clamp-2 mb-1" title={rev.title}>{rev.title}</h4>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      Added {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <a 
                    href={rev.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-5 btn-ghost w-full !h-[36px]"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Modal For Creating Assignment */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-[480px] rounded-[16px] p-[32px] shadow-2xl relative page-enter">
            <h2 className="font-serif text-[24px] text-gray-800 mb-6">Create Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Title</label>
                <input required value={assnTitle} onChange={e=>setAssnTitle(e.target.value)} className="input-field" placeholder="e.g. Midterm Report" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Description</label>
                <textarea 
                  required 
                  value={assnDesc} 
                  onChange={e=>setAssnDesc(e.target.value)} 
                  className="input-field !h-24 py-3 resize-none" 
                  placeholder="Instructions for students..."
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Deadline</label>
                <input required type="datetime-local" value={assnDeadline} onChange={e=>setAssnDeadline(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Assignment Document (PDF/DOCX)</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="input-field flex items-center gap-2 text-gray-400 group hover:border-green-300 transition-colors">
                      <Upload size={16} />
                      <span className="truncate">{assnFile ? assnFile.name : 'Choose file...'}</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx"
                      onChange={(e) => setAssnFile(e.target.files[0])}
                    />
                  </label>
                  {assnFile && (
                    <button type="button" onClick={() => setAssnFile(null)} className="text-gray-400 hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UploadModal 
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Upload Revision Material"
        onSubmit={handleRevisionUpload}
      />
    </div>
  );
}
