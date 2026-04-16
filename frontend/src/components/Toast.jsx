import React, { useEffect } from 'react';
import toast, { useToaster } from 'react-hot-toast';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause, calculateOffset, updateHeight } = handlers;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      {toasts.map((t) => {
        const offset = calculateOffset(t, { reverseOrder: false });
        const ref = (el) => {
          if (el && typeof t.height !== 'number') {
            updateHeight(t.id, el.getBoundingClientRect().height);
          }
        };

        // Standardize variants
        let accentColor = 'bg-white';
        let Icon = null;
        let title = 'Notification';

        if (t.type === 'success') {
          accentColor = 'bg-green-500';
          Icon = <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />;
          title = 'Success';
        } else if (t.type === 'error') {
          accentColor = 'bg-danger';
          Icon = <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />;
          title = 'Error';
        } else {
          accentColor = 'bg-gray-300';
        }

        // Support passing custom complex string patterns like "Title: Message" if the user wants
        const messageStr = typeof t.message === 'string' ? t.message : 'Action completed.';
        const customTitleMatch = messageStr.match(/^([^:]+):\s*(.*)$/);
        
        let finalTitle = title;
        let finalMessage = messageStr;

        if (customTitleMatch) {
          finalTitle = customTitleMatch[1];
          finalMessage = customTitleMatch[2];
        }

        return (
          <div
            key={t.id}
            ref={ref}
            className={`
              w-[320px] bg-white border border-gray-100 rounded-lg shadow-lg relative overflow-hidden pointer-events-auto flex items-start
              transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
              ${t.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
            `}
            style={{
              // Stack them perfectly
              transform: t.visible ? undefined : 'translateX(100%)',
            }}
          >
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
            
            <div className="p-4 pl-5 flex gap-3 w-full">
              {Icon}
              <div className="flex-1 pr-6">
                <h4 className="text-[14px] font-bold text-gray-800 leading-tight mb-0.5">{finalTitle}</h4>
                <p className="text-[13px] text-gray-500 leading-snug">{finalMessage}</p>
              </div>
            </div>

            <button 
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
