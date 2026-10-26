import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiPlus, FiTrash2, FiFileText, FiExternalLink, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const STAGES = [
  { id: 'wishlist', title: 'Wishlist', color: 'border-blue-500/30' },
  { id: 'applied', title: 'Applied', color: 'border-amber-500/30' },
  { id: 'interviewing', title: 'Interviewing', color: 'border-indigo-500/30' },
  { id: 'offered', title: 'Offered 🎉', color: 'border-emerald-500/30' },
  { id: 'rejected', title: 'Archived', color: 'border-gray-500/30' }
];

const JobApplicationCopilot = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);

  // Form State
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salaryRange, setSalaryRange] = useState('$80k - $110k');
  const [status, setStatus] = useState('wishlist');
  const [matchScore, setMatchScore] = useState(80);
  const [notes, setNotes] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/platform/job-applications');
      if (res.data.success) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/platform/job-applications', {
        company,
        position,
        jobUrl,
        location,
        salaryRange,
        status,
        matchScore,
        notes
      });
      if (res.data.success) {
        setApplications([res.data.application, ...applications]);
        setShowAddModal(false);
        // Reset form
        setCompany('');
        setPosition('');
        setJobUrl('');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await api.put(`/api/platform/job-applications/${appId}`, { status: newStatus });
      if (res.data.success) {
        setApplications(applications.map(a => a._id === appId ? res.data.application : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId) => {
    try {
      await api.delete(`/api/platform/job-applications/${appId}`);
      setApplications(applications.filter(a => a._id !== appId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateCoverLetter = async (app) => {
    setSelectedApp(app);
    setShowCoverLetterModal(true);
    setCoverLoading(true);
    setCoverLetterText('');

    try {
      const res = await api.post('/api/ai/cover-letter', {
        company: app.company,
        position: app.position,
        requirements: app.notes
      });
      if (res.data.success) {
        setCoverLetterText(res.data.coverLetter);
      }
    } catch (err) {
      console.error(err);
      setCoverLetterText('Failed to generate cover letter. Please try again.');
    } finally {
      setCoverLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiBriefcase size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Job Application Copilot</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Track your pipeline, match scores, interview rounds, and generate AI tailored cover letters.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="glass-button-primary flex items-center gap-2 text-xs"
        >
          <FiPlus size={16} /> Track New Job
        </button>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageApps = applications.filter(a => a.status === stage.id);
          return (
            <div
              key={stage.id}
              className="glass-panel p-4 rounded-2xl flex flex-col gap-3 min-w-[240px] flex-1"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-gray-800/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {stage.title}
                </h3>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {stageApps.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[350px]">
                {stageApps.map((app) => (
                  <div
                    key={app._id}
                    className="glass-panel p-4 rounded-xl flex flex-col gap-2.5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                        {app.matchScore}% Match
                      </span>
                      <button
                        onClick={() => handleDelete(app._id)}
                        className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                        title="Delete application"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {app.position}
                      </h4>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">{app.company}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{app.location}</span>
                      <span>{app.salaryRange}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleGenerateCoverLetter(app)}
                        className="text-[11px] text-indigo-500 font-semibold hover:underline flex items-center gap-1"
                      >
                        <FiFileText size={12} /> AI Letter
                      </button>

                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        className="text-[10px] bg-transparent border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 text-gray-500 outline-none"
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id} className="dark:bg-gray-900">{s.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {stageApps.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800/60 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-gray-400">No jobs in {stage.title}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD JOB MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold">Add Job to Pipeline</h3>
            <form onSubmit={handleCreateApplication} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google, Vercel"
                  className="w-full glass-input mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Position Role</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Full Stack Software Engineer"
                  className="w-full glass-input mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full glass-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Initial Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full glass-input bg-transparent mt-1"
                  >
                    {STAGES.map(s => <option key={s.id} value={s.id} className="dark:bg-gray-900">{s.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Notes & Requirements</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tech stack: React, Node, Docker, AWS..."
                  className="w-full glass-input mt-1 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="glass-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button-primary text-xs"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI COVER LETTER MODAL */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">AI Tailored Cover Letter</h3>
                <p className="text-xs text-gray-400">For {selectedApp?.position} at {selectedApp?.company}</p>
              </div>
              <button onClick={() => setShowCoverLetterModal(false)} className="text-gray-400 hover:text-gray-200">✕</button>
            </div>

            {coverLoading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400">CareerNest Copilot is synthesizing your cover letter...</p>
              </div>
            ) : (
              <textarea
                rows={12}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                className="w-full glass-input text-xs leading-relaxed resize-none font-sans"
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => navigator.clipboard.writeText(coverLetterText)}
                className="glass-button-secondary text-xs"
              >
                Copy Text
              </button>
              <button
                onClick={() => setShowCoverLetterModal(false)}
                className="glass-button-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicationCopilot;
