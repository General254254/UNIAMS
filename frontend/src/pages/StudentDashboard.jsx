import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Calendar, Download, Inbox, Search, CheckCircle2 } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

import CountdownTimer from '../components/CountdownTimer';
import UploadModal from '../components/UploadModal';

export default function StudentDashboard() {
  const { activeUnit } = useUnit();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

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

  const handleUploadSubmit = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignment', selectedAssignmentId);

    try {
      await api.post('/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submission uploaded successfully');
      setModalOpen(false);
      setSelectedAssignmentId('');
      fetchData(); // refresh status
    } catch {
      toast.error('Failed to upload submission');
    }
  };

  if (!activeUnit) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center page-enter">
        <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={40} className="text-green-800" />
        </div>
        <h1 className="font-serif text-[32px] text-gray-800 mb-2">Welcome to AMS</h1>
        <p className="text-[16px] text-gray-500 max-w-sm">
          Please select a unit from the top navigation bar to view your assignments and materials.
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

  // Dashboard calculations
  const total = assignments.length;
  const submitted = assignments.filter(a => a.user_submission !== null).length;
  const pending = total - submitted;

  const upcomingDeadlines = [...assignments]
    .filter(a => !a.user_submission && new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  return (
    <div className="page-enter">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Column (Main Content) - 2/3 */}
        <div className="flex-1 space-y-10">

          {/* Assignments Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-gray-800 flex items-center gap-2">
                My Assignments
                <span className="bg-gray-100 text-gray-600 text-[12px] px-2 py-0.5 rounded-full font-semibold">{total}</span>
              </h2>
            </div>

            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="card text-center py-12 border-dashed border-2">
                  <Inbox size={48} className="mx-auto text-green-200 mb-4" />
                  <h3 className="font-serif text-[20px] text-gray-800">No assignments yet</h3>
                  <p className="text-[14px] text-gray-500 mt-2">Your lecturer hasn't posted any assignments for this unit.</p>
                </div>
              ) : (
                assignments.map(assn => {
                  const isSubmitted = !!assn.user_submission;
                  const isPastDeadline = new Date(assn.deadline) < new Date();

                  let statusBadge = null;
                  if (isSubmitted) {
                    statusBadge = <span className="badge-submitted px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Submitted</span>;
                  } else if (isPastDeadline) {
                    statusBadge = <span className="badge-late px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Late</span>;
                  } else {
                    statusBadge = <span className="badge-pending px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Pending</span>;
                  }

                  return (
                    <div key={assn.id} className="card relative overflow-hidden group border-l-4 border-l-transparent hover:border-l-green-500">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="badge-unit mb-2 inline-block">{activeUnit.code}</span>
                          <h3 className="font-serif text-[22px] text-gray-800 leading-tight mb-2 group-hover:text-green-800 transition-colors">
                            {assn.title}
                          </h3>
                          <p className="text-[14px] text-gray-500 line-clamp-2 max-w-2xl mb-4 leading-relaxed">
                            {assn.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-[13px] font-medium text-gray-600">
                                {new Date(assn.deadline).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {!isSubmitted && <CountdownTimer deadline={assn.deadline} />}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4 min-w-[140px]">
                          {statusBadge}
                          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                            {assn.file && (
                              <a
                                href={assn.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-ghost whitespace-nowrap !h-10 !px-4 !text-[13px] text-green-700 hover:bg-green-50 border-green-100 flex items-center gap-2"
                              >
                                <Download size={14} /> Download File
                              </a>
                            )}
                            {!isSubmitted && (
                              <button
                                onClick={() => {
                                  setSelectedAssignmentId(assn.id);
                                  setModalOpen(true);
                                }}
                                className="btn-primary whitespace-nowrap !h-10 !px-4 !text-[13px]"
                              >
                                Upload Submission
                              </button>
                            )}
                          </div>
                          {isSubmitted && (
                            <div className="mt-auto flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                              <CheckCircle2 size={16} />
                              <span className="text-[12px] font-bold">Uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Revision Materials Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-gray-800">Revision Materials</h2>
            </div>

            {revisions.length === 0 ? (
              <div className="card text-center py-10 border-dashed border-2 bg-transparent shadow-none">
                <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-[14px] text-gray-500">No revision materials available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {revisions.map(rev => (
                  <div key={rev.id} className="card p-4 flex items-center gap-4 hover:border-green-300">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-medium text-gray-800 truncate" title={rev.title}>{rev.title}</h4>
                      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">PDF Document</span>
                    </div>
                    <a
                      href={rev.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column (Sidebar/Stats) - 1/3 */}
        <div className="lg:w-[320px] shrink-0 space-y-6">

          <div className="card border-0 bg-transparent p-0 hover:box-shadow-none hover:transform-none">
            <h2 className="text-[16px] font-bold text-gray-800 mb-4 px-1">Overview</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="card p-5 border-gray-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Total</span>
                <span className="font-serif text-[40px] text-gray-800 leading-none">{total}</span>
              </div>
              <div className="card p-5 border-green-100 bg-green-50 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-green-700 uppercase tracking-widest mb-2">Submitted</span>
                <span className="font-serif text-[40px] text-green-900 leading-none">{submitted}</span>
              </div>
            </div>

            <div className="card p-5 border-amber-100 bg-amber-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest">Pending</span>
                {pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </div>
              <span className="font-serif text-[42px] text-amber-900 leading-none">{pending}</span>
            </div>
          </div>

          <div className="card bg-gray-50/50 border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Upcoming Deadlines
            </h3>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-[13px] text-gray-500 italic">No approaching deadlines.</p>
              ) : (
                upcomingDeadlines.map(assn => (
                  <div key={assn.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-[13px] font-semibold text-gray-800 line-clamp-1" title={assn.title}>{assn.title}</p>
                    <div className="mt-1">
                      <CountdownTimer deadline={assn.deadline} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <UploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Submission"
        isAssignment={true}
        assignments={assignments.filter(a => !a.user_submission)}
        selectedAssignmentId={selectedAssignmentId}
        setSelectedAssignmentId={setSelectedAssignmentId}
        onSubmit={handleUploadSubmit}
      />
    </div>
  );
}
