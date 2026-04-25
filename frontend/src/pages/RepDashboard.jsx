import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, Download, FileBarChart, Upload, Plus, FileText, Trash2 } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import api from '../services/api';
import toast from 'react-hot-toast';

import UploadModal from '../components/UploadModal';

export default function RepDashboard() {
  const { activeUnit } = useUnit();
  const [assignments, setAssignments] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedAssn, setExpandedAssn] = useState(null);
  const [activeTab, setActiveTab] = useState('assignments');

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Form states
  const [assnTitle, setAssnTitle] = useState('');
  const [assnDesc, setAssnDesc] = useState('');
  const [assnDeadline, setAssnDeadline] = useState('');
  const [assnFile, setAssnFile] = useState(null);

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

  const toggleAccordion = async (assnId) => {
    if (expandedAssn === assnId) {
      setExpandedAssn(null);
      return;
    }
    setExpandedAssn(assnId);
    if (!submissions[assnId]) {
      try {
        const { data } = await api.get(`/units/${activeUnit.id}/assignments/${assnId}/submissions/`);
        setSubmissions(prev => ({ ...prev, [assnId]: data }));
      } catch {
        toast.error('Failed to load submissions');
        setExpandedAssn(null);
      }
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
      setAssnTitle(''); setAssnDesc(''); setAssnDeadline(''); setAssnFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create assignment');
    }
  };

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

  if (!activeUnit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center page-enter">
        <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={40} className="text-green-800" />
        </div>
        <h1 className="font-serif text-[32px] text-gray-800 mb-2">Class Representative</h1>
        <p className="text-[16px] text-gray-500 max-w-sm">
          Please select a unit to oversee class performance and upload materials.
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
        <h1 className="font-serif text-[28px] text-gray-800 leading-none">Class Rep Dashboard</h1>
        <p className="text-[14px] text-gray-500 mt-2">Manage assignments, materials, and track submissions.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 font-semibold text-[14px] transition-colors relative ${activeTab === 'assignments' ? 'text-green-800' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Assignments & Submissions
          {activeTab === 'assignments' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-green-700 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('revisions')}
          className={`pb-3 font-semibold text-[14px] transition-colors relative ${activeTab === 'revisions' ? 'text-green-800' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Revision Materials
          {activeTab === 'revisions' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-green-700 rounded-t-full" />}
        </button>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        {activeTab === 'assignments' ? (
          <button onClick={() => setShowAssignModal(true)} className="btn-primary">
            <Plus size={16} className="mr-2" /> Create Assignment
          </button>
        ) : (
          <button onClick={() => setShowRevisionModal(true)} className="btn-primary">
            <Upload size={16} className="mr-2" /> Upload Material
          </button>
        )}
      </div>

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="card text-center py-20 px-4">
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileBarChart size={32} className="text-gray-300" />
              </div>
              <h3 className="font-serif text-[20px] text-gray-800 mb-2">No assignments yet</h3>
              <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-6">Create assignments for students to submit their work.</p>
              <button onClick={() => setShowAssignModal(true)} className="btn-ghost">Create Assignment</button>
            </div>
          ) : (
            assignments.map(assn => {
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
                          <p className="text-center text-[13px] text-gray-500 italic py-4">No submissions yet.</p>
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
                                      <CheckCircle2 size={12} /> Submitted
                                    </span>
                                  </div>
                                  <div className="text-right flex justify-end">
                                    <a href={sub.file} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                      title="View Document">
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
            })
          )}
        </div>
      )}

      {/* Revisions Tab */}
      {activeTab === 'revisions' && (
        <div>
          {revisions.length === 0 ? (
            <div className="card text-center py-20 px-4">
              <FileText size={48} className="mx-auto text-green-200 mb-4" />
              <h3 className="font-serif text-[20px] text-gray-800 mb-2">No materials uploaded</h3>
              <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-6">Upload PDFs or documents to help your class revise.</p>
              <button onClick={() => setShowRevisionModal(true)} className="btn-ghost">Upload Material</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {revisions.map(rev => (
                <div key={rev.id} className="card p-5 group flex flex-col justify-between hover:border-green-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-green-50 group-hover:bg-green-100 transition-colors rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={28} className="text-green-600" />
                    </div>
                    <button onClick={() => handleDeleteRevision(rev.id)}
                      className="text-gray-400 hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-gray-800 line-clamp-2 mb-1" title={rev.title}>{rev.title}</h4>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      Added {new Date(rev.uploaded_at || rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <a href={rev.file} target="_blank" rel="noopener noreferrer"
                    className="mt-5 btn-ghost w-full !h-[36px]">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-[480px] rounded-[16px] p-[32px] shadow-2xl relative">
            <h2 className="font-serif text-[24px] text-gray-800 mb-6">Create Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Title</label>
                <input required value={assnTitle} onChange={e => setAssnTitle(e.target.value)} className="input-field" placeholder="e.g. Midterm Report" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Description</label>
                <textarea required value={assnDesc} onChange={e => setAssnDesc(e.target.value)} className="input-field !h-24 py-3 resize-none" placeholder="Instructions for students..." />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Deadline</label>
                <input required type="datetime-local" value={assnDeadline} onChange={e => setAssnDeadline(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Assignment Document (PDF/DOCX)</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="input-field flex items-center gap-2 text-gray-400 group hover:border-green-300 transition-colors">
                      <Upload size={16} />
                      <span className="truncate">{assnFile ? assnFile.name : 'Choose file...'}</span>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => setAssnFile(e.target.files[0])} />
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
