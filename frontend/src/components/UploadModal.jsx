import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  title, 
  onSubmit, 
  isAssignment = false,
  assignments = [], // passed if uploading a submission
  selectedAssignmentId = '',
  setSelectedAssignmentId = () => {}
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorProps, setErrorProps] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateFile = (f) => {
    if (!f) return false;
    
    // Check type
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
    ];
    if (!validTypes.includes(f.type) && !f.name.endsWith('.pdf') && !f.name.endsWith('.docx')) {
      setErrorProps('Only PDF or DOCX files accepted');
      return false;
    }

    // Check size (10MB)
    if (f.size > 10 * 1024 * 1024) {
      setErrorProps('Maximum file size is 10MB');
      return false;
    }

    setErrorProps(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAssignment && !selectedAssignmentId) {
      toast.error('Error: Please select an assignment');
      return;
    }
    if (!file) {
      toast.error('Error: Please select a file');
      return;
    }
    onSubmit(file);
    // Cleanup
    setFile(null);
    setErrorProps(null);
  };

  const closeModal = () => {
    setFile(null);
    setErrorProps(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[999] flex justify-center items-center p-4">
      <div 
        className="bg-white w-full max-w-[480px] rounded-[16px] p-[32px] shadow-2xl relative page-enter"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
          <X size={20} />
        </button>

        <h2 className="font-serif text-[24px] text-gray-800 mb-6">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isAssignment && (
            <div>
              <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">Select Assignment</label>
              <select 
                value={selectedAssignmentId} 
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="input-field appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Choose an assignment...</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold uppercase text-gray-500 tracking-wider mb-2">File Upload</label>
            {!file ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  h-[80px] flex items-center justify-center border-2 rounded-lg cursor-pointer transition-all gap-3
                  ${errorProps ? 'border-red-500 bg-red-50' : isDragging ? 'border-green-500 bg-green-200 border-solid' : 'border-green-500 border-dashed hover:bg-green-50'}
                `}
              >
                <UploadIcon size={24} className={errorProps ? 'text-red-500' : 'text-green-500'} />
                <div className="text-center">
                  <p className="text-[14px] text-gray-800 font-medium">Drag your PDF or DOCX here</p>
                  <p className="text-[12px] text-green-700 font-semibold underline">or Browse files</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                <FileText size={24} className="text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-[12px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFile(null)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            {errorProps && (
              <p className="mt-2 text-[12px] font-medium text-red-600">{errorProps}</p>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleChange}
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={!file} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              Upload
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
