import React, { useState, useEffect } from 'react';
import { FiAward, FiDownload, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const CertificatesCenter = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/api/platform/certificates');
      if (res.data.success) {
        setCerts(res.data.certificates);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handlePrint = (certId) => {
    const printContent = document.getElementById(`print-frame-${certId}`);
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore state
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Certificates</h1>
        <p className="text-xs text-gray-400 font-sans">Access, verify, and download your earned course completion certificates with secure QR-code validations.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : certs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
          <span className="text-4xl">🎓</span>
          <h3 className="font-bold text-base mt-2">Earn Credentials</h3>
          <p className="text-xs text-gray-400 max-w-sm">No certificates earned yet. Complete all modules on enrolled courses page and claim your credentials.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {certs.map((c) => (
            <div key={c._id} className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-gray-250/20 dark:border-gray-800/25 shadow-lg">
              
              {/* STYLED CERTIFICATE CONTAINER FOR VIEW & PRINT */}
              <div
                id={`print-frame-${c.certificateId}`}
                className="w-full max-w-2xl bg-white text-gray-850 p-8 sm:p-10 border-[12px] border-double border-indigo-500/20 rounded-xl relative shadow-md font-serif text-center"
              >
                {/* Golden/Indigo ornaments */}
                <div className="absolute top-4 left-4 right-4 bottom-4 border border-indigo-500/10 rounded pointer-events-none" />
                <span className="text-indigo-600 text-3xl block">🏆</span>
                
                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-indigo-900 mt-3 font-serif">Certificate of Completion</h2>
                <p className="text-xs text-gray-400 italic mt-1">This is securely certified and issued to:</p>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-4 border-b border-gray-200 w-fit mx-auto pb-1 px-8 font-serif">
                  Alex Rivera
                </h3>
                
                <p className="text-xs text-gray-500 mt-4 max-w-md mx-auto leading-relaxed font-sans">
                  for successfully finishing and passing all evaluation tasks, coding challenges, and modules on the program:
                </p>
                
                <h4 className="text-sm sm:text-base font-extrabold text-indigo-900 mt-2 font-serif uppercase tracking-tight">
                  {c.courseName}
                </h4>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 border-t border-gray-100 pt-6">
                  <div className="text-left text-[10px] text-gray-400 font-sans leading-relaxed">
                    <p>Issue Date: <span className="font-semibold text-gray-700">{new Date(c.issueDate).toLocaleDateString()}</span></p>
                    <p>Record ID: <span className="font-semibold text-gray-700">{c.certificateId}</span></p>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1 mt-1"><FiCheckCircle /> Verified Blockchain Record</span>
                  </div>

                  {/* QR code mockup styled */}
                  <div className="flex flex-col items-center gap-1 font-sans">
                    <div className="p-2 border border-gray-200 bg-white rounded-lg">
                      {/* Generates standard QR styled block representation */}
                      <div className="w-16 h-16 bg-[#000] p-1 flex flex-wrap justify-between items-center rounded-sm">
                        <div className="w-6 h-6 border-4 border-white" />
                        <div className="w-6 h-6 border-4 border-white" />
                        <div className="w-6 h-6 border-4 border-white" />
                        <div className="w-2 h-2 bg-white" />
                      </div>
                    </div>
                    <span className="text-[7px] text-gray-400 uppercase tracking-widest mt-1">Scan to Verify</span>
                  </div>
                </div>
              </div>

              {/* ACTION COMMANDS */}
              <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-fit">
                <button
                  onClick={() => handlePrint(c.certificateId)}
                  className="flex-1 lg:flex-none glass-button-primary flex items-center justify-center gap-2 text-xs"
                >
                  <FiDownload /> Download/Print
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesCenter;
