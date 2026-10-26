import React, { useState, useEffect } from 'react';
import { FiAward, FiCheckCircle, FiGithub, FiExternalLink, FiClock, FiSend, FiLayers, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const MicroInternships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/platform/micro-internships');
      if (res.data.success) {
        setInternships(res.data.internships);
        if (res.data.internships.length > 0 && !selectedInternship) {
          setSelectedInternship(res.data.internships[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load micro-internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!githubRepoUrl.trim()) return;

    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await api.post(`/api/platform/micro-internships/${selectedInternship._id}/submit`, {
        githubRepoUrl,
        liveDemoUrl,
        notes
      });
      if (res.data.success) {
        setSubmissionResult(res.data.submission);
        setGithubRepoUrl('');
        setLiveDemoUrl('');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiLayers size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CareerNest AI Micro-Internships</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Complete simulated industry engineering assignments. Get automated rubric evaluation, boost your Career Readiness, and earn project credentials.
          </p>
        </div>
      </div>

      {/* 2-COLUMN VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INTERNSHIPS LIST */}
        <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Industry Simulations</h3>
          
          <div className="flex flex-col gap-3">
            {internships.map((item) => {
              const active = selectedInternship?._id === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => { setSelectedInternship(item); setSubmissionResult(null); }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    active
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'glass-panel border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.companyLogo || '⚡'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                      {item.durationWeeks} Weeks • {item.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mt-2 truncate">{item.title}</h4>
                  <p className="text-[11px] text-gray-400">{item.companyPartner}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE SIMULATION BRIEF */}
        {selectedInternship && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                  {selectedInternship.domain} Simulation
                </span>
                <h2 className="text-xl font-bold mt-1.5">{selectedInternship.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Sponsored by {selectedInternship.companyPartner}</p>
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="glass-button-primary text-xs flex items-center gap-2"
              >
                <FiSend size={14} /> Submit Solution
              </button>
            </div>

            {/* SUMMARY & TARGET SKILLS */}
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                {selectedInternship.summary}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedInternship.skillsTargeted?.map((s, idx) => (
                  <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-medium">
                    ⚡ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* MILESTONE TASKS */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Engineering Deliverables & Tasks</h3>
              
              <div className="flex flex-col gap-3">
                {selectedInternship.tasks?.map((task, idx) => (
                  <div key={idx} className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Milestone {task.milestoneNumber}: {task.title}
                      </h4>
                      <span className="text-[10px] text-gray-400">Deliverable</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{task.objective}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.deliverables?.map((d, dIdx) => (
                        <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          ✓ {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMISSION RESULT NOTICE */}
            {submissionResult && (
              <div className="glass-panel-accent p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  <FiCheckCircle size={18} /> Project Evaluated & Verified!
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-lg text-indigo-500">{submissionResult.score}/100</span>
                  <p className="text-gray-600 dark:text-gray-300">{submissionResult.aiFeedback}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold">Submit Micro-Internship Solution</h3>
            <p className="text-xs text-gray-400">Provide your GitHub repository URL containing your project code.</p>

            <form onSubmit={handleSubmitProject} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">GitHub Repository URL</label>
                <input
                  type="url"
                  required
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full glass-input mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Live Demo URL (Optional)</label>
                <input
                  type="url"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                  placeholder="https://myproject.vercel.app"
                  className="w-full glass-input mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Architecture & Implementation Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly explain architecture design decisions and trade-offs..."
                  className="w-full glass-input mt-1 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="glass-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="glass-button-primary text-xs"
                >
                  {submitting ? 'Running Automated Evaluation...' : 'Submit for AI Rubric Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroInternships;
