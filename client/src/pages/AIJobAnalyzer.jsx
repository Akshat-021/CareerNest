import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiCheckCircle, FiAlertCircle, FiTrendingUp,
  FiArrowRight, FiCompass, FiPlusCircle, FiTerminal, FiLayers
} from 'react-icons/fi';
import api from '../services/api';
import { FallbackDisclosure, Alert } from '../components/feedback';
import { Button } from '../components/common';

const AIJobAnalyzer = () => {
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [createdRoadmap, setCreatedRoadmap] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jobText.trim() || jobText.trim().length < 20) {
      setError('Please paste a comprehensive job description (at least 20 characters).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setAnalysis(null);
    setCreatedRoadmap(null);

    try {
      const res = await api.post('/api/ai/analyze-job', {
        jobText,
        createRoadmap: true
      });

      if (res.data.success) {
        setAnalysis(res.data.analysis);
        if (res.data.roadmap) {
          setCreatedRoadmap(res.data.roadmap);
        }
      }
    } catch (err) {
      console.error('Job analysis failed:', err);
      setError(err.response?.data?.message || 'Failed to analyze job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTracker = async () => {
    if (!analysis) return;
    try {
      await api.post('/api/platform/job-applications', {
        company: analysis.company || 'Target Employer',
        position: analysis.jobTitle || 'Software Engineer',
        matchScore: analysis.matchScore || 70,
        status: 'wishlist',
        notes: `Extracted missing skills: ${analysis.criticalMissingSkills?.join(', ')}`
      });
      setSuccessMsg('Added to your Job Application Copilot tracker!');
    } catch (err) {
      console.error(err);
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
            <h1 className="text-2xl font-bold tracking-tight">AI Job Description Intelligence</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Paste any job posting to extract required skills, compute your exact <b>Job Match %</b>, identify critical gaps, and auto-generate a 6-week targeted roadmap.
          </p>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {successMsg && (
        <Alert
          type="success"
          message={successMsg}
          onClose={() => setSuccessMsg('')}
        />
      )}

      {/* INPUT SECTION */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            📋 Paste Job Posting
          </h2>
          <span className="text-[11px] text-gray-400">Supports full job postings or LinkedIn/Indeed descriptions</span>
        </div>

        <textarea
          rows={7}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="e.g. We are seeking a Full Stack Software Engineer with 1-3 years of experience in React, Node.js, Express, MongoDB, Docker, and AWS. Responsibilities include building scalable REST microservices..."
          className="w-full glass-input resize-none text-xs leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CareerNest Career Engine matches this against your live CareerProfile & verified skills.
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="glass-button-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Job Profile...
              </>
            ) : (
              <>
                <FiTrendingUp size={16} /> Run Job Match Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* ANALYSIS RESULTS */}
      {analysis && (
        <div className="flex flex-col gap-6">
          {/* TOP SCORE BANNER */}
          <div className="glass-panel-accent p-6 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-indigo-500">{analysis.matchScore}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                    {analysis.experienceRequired || 'Entry-Mid Level'}
                  </span>
                  <FallbackDisclosure
                    isSimulated={analysis.isSimulatedFallback ?? true}
                    engineName={analysis.aiEngine}
                    compact={true}
                  />
                </div>
                <h3 className="text-xl font-bold mt-0.5">{analysis.jobTitle}</h3>
                <p className="text-xs text-gray-400">{analysis.company} • Real-Time Career Intelligence Match</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleAddToTracker}
                className="glass-button-secondary flex items-center gap-1.5 text-xs"
              >
                <FiPlusCircle size={14} /> Add to Tracker
              </button>
              <button
                onClick={() => navigate('/ai-gap')}
                className="glass-button-secondary flex items-center gap-1.5 text-xs"
              >
                <FiTrendingUp size={14} /> Skill Gap
              </button>
              <button
                onClick={() => navigate('/ai-interview')}
                className="glass-button-primary flex items-center gap-1.5 text-xs"
              >
                <FiTerminal size={14} /> Mock Interview
              </button>
            </div>
          </div>

          {/* 3-COLUMN SKILL BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MATCHED SKILLS */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wide">
                  <FiCheckCircle /> Matched Strengths ({analysis.matchedSkills?.length || 0})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matchedSkills?.length > 0 ? (
                  analysis.matchedSkills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                      ✓ {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No direct skills matched yet.</p>
                )}
              </div>
            </div>

            {/* CRITICAL MISSING */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5 uppercase tracking-wide">
                  <FiAlertCircle /> Critical Skill Gaps ({analysis.criticalMissingSkills?.length || 0})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.criticalMissingSkills?.length > 0 ? (
                  analysis.criticalMissingSkills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                      ! {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No critical missing skills!</p>
                )}
              </div>
            </div>

            {/* NICE TO HAVE */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wide">
                  <FiTrendingUp /> Nice-to-Have Gaps ({analysis.niceToHaveGaps?.length || 0})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.niceToHaveGaps?.length > 0 ? (
                  analysis.niceToHaveGaps.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                      • {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">None identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* ACTION PLAN SUMMARY */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              💡 Actionable Strategy & Remedial Next Steps
            </h4>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              {analysis.actionPlanSummary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[11px] font-bold text-indigo-500 uppercase">Recommended Courses to Close Gap</p>
                <ul className="text-xs mt-1.5 flex flex-col gap-1 text-gray-600 dark:text-gray-300">
                  {analysis.recommendedCourses?.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-indigo-500">→</span> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/10">
                <p className="text-[11px] font-bold text-violet-500 uppercase">Recommended Portfolio Projects</p>
                <ul className="text-xs mt-1.5 flex flex-col gap-1 text-gray-600 dark:text-gray-300">
                  {analysis.recommendedProjects?.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-violet-500">→</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AUTO-GENERATED 6-WEEK ROADMAP PROMPT */}
          {createdRoadmap && (
            <div className="glass-panel-accent p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    Auto-Generated for You
                  </span>
                  <h3 className="text-lg font-bold mt-1">🎯 6-Week Job-Specific Learning Roadmap</h3>
                  <p className="text-xs text-gray-400">Targeted directly to close the critical skill gaps for {analysis.jobTitle}.</p>
                </div>
                <button
                  onClick={() => navigate('/ai-roadmap')}
                  className="glass-button-primary flex items-center gap-2 text-xs"
                >
                  <FiCompass /> View Full Roadmap Timeline <FiArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {createdRoadmap.modules?.slice(0, 3).map((m, idx) => (
                  <div key={idx} className="glass-panel p-4 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-500">{m.timeline}</span>
                    <h5 className="text-xs font-bold">{m.title}</h5>
                    <p className="text-[11px] text-gray-400 truncate">{m.topics?.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIJobAnalyzer;
