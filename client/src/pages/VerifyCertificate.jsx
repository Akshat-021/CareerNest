import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiAward, FiArrowLeft, FiCalendar, FiUser, FiBookOpen } from 'react-icons/fi';

const VerifyCertificate = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkValidity = async () => {
      try {
        const res = await axios.get(`/api/platform/certificates/verify/${id}`);
        if (res.data.success) {
          setCert(res.data.certificate);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Certificate verification failed.');
      } finally {
        setLoading(false);
      }
    };
    checkValidity();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Floating gradient blur */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center text-center gap-6 relative">
          <Link to="/" className="absolute top-0 left-0 text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1.5">
            <FiArrowLeft /> Home
          </Link>

          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mt-6">
            <FiAward size={42} />
          </div>

          {error ? (
            <>
              <div className="flex items-center gap-2 text-rose-500">
                <FiXCircle size={28} />
                <h2 className="text-xl font-bold">Verification Failed</h2>
              </div>
              <p className="text-sm text-gray-400 max-w-md">{error}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <FiCheckCircle size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">CareerNest Authenticated Record</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight mt-2">
                Verification Details
              </h2>

              <div className="w-full grid sm:grid-cols-2 gap-4 text-left mt-6 border-t border-b border-gray-200/50 dark:border-gray-800/40 py-6">
                <div className="flex items-start gap-3">
                  <FiUser className="text-indigo-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Issued Student</p>
                    <p className="text-sm font-semibold">{cert.student?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiBookOpen className="text-indigo-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Course Completed</p>
                    <p className="text-sm font-semibold">{cert.courseName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiCalendar className="text-indigo-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Completion Date</p>
                    <p className="text-sm font-semibold">{new Date(cert.issueDate).toDateString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiAward className="text-indigo-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Certificate ID</p>
                    <p className="text-sm font-mono font-semibold">{cert.certificateId}</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed mt-4">
                This verification check was performed securely using CareerNest's cryptographic certificate ledger database.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
