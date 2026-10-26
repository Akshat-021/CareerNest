import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiAward, FiGithub, FiCheckCircle, FiShare2, FiShield, FiExternalLink, FiCpu, FiTerminal, FiBookOpen } from 'react-icons/fi';
import api from '../services/api';

const CareerPassport = () => {
  const { id } = useParams();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPassport = async () => {
      setLoading(true);
      try {
        // If no param, try fetching authenticated user's own passport
        let targetParam = id;
        if (!targetParam) {
          const profileRes = await api.get('/api/ai/career-profile');
          if (profileRes.data.success) {
            targetParam = profileRes.data.profile?.passportSettings?.slug || profileRes.data.profile?.student?._id;
          }
        }

        const res = await api.get(`/api/platform/passport/${targetParam}`);
        if (res.data.success) {
          setPassport(res.data.passport);
        }
      } catch (err) {
        console.error('Failed to load career passport:', err);
        setError(err.response?.data?.message || 'Career Passport not found or set to private.');
      } finally {
        setLoading(false);
      }
    };

    fetchPassport();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400">Loading Verified Career Passport...</p>
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 text-3xl">🛡️</div>
          <h2 className="text-lg font-bold">Passport Unavailable</h2>
          <p className="text-xs text-gray-400">{error || 'This student career passport does not exist or has been made private by the owner.'}</p>
          <Link to="/" className="glass-button-primary text-xs">
            Return to CareerNest Home
          </Link>
        </div>
      </div>
    );
  }

  const { readinessScore, skills, githubData, certificates } = passport;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-4">
      {/* VERIFICATION BADGE BAR */}
      <div className="glass-panel-accent px-6 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <FiShield size={18} />
          </div>
          <div>
            <p className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              CAREERNEST VERIFIED CAREER PASSPORT
            </p>
            <p className="text-[10px] text-gray-400">Authentic proof-of-work, verified skills, and automated evaluation metrics.</p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="glass-button-primary text-xs flex items-center gap-2 py-2"
        >
          <FiShare2 size={14} /> {copied ? 'Link Copied to Clipboard!' : 'Share Public Passport'}
        </button>
      </div>

      {/* HERO HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={passport.avatar || 'https://via.placeholder.com/150'}
            alt={passport.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{passport.name}</h1>
              <span className="text-xs text-indigo-500 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                {readinessScore.ratingCategory}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
              {passport.targetRole} • {passport.experienceLevel}
            </p>
            <p className="text-xs text-gray-400 mt-2 max-w-xl leading-relaxed">
              {passport.customBio}
            </p>
          </div>
        </div>

        {/* OVERALL READINESS PILL */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center min-w-[140px] flex flex-col items-center">
          <span className="text-[10px] font-bold text-indigo-500 uppercase">Career Readiness</span>
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {readinessScore.overallReadiness}/100
          </span>
          <span className="text-[10px] text-gray-400 mt-1">7-Factor Validated</span>
        </div>
      </div>

      {/* 7-FACTOR READINESS METRICS */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          📊 Transparent 7-Factor Readiness Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Technical', val: readinessScore.technicalSkills, icon: FiCpu },
            { label: 'Coding', val: readinessScore.codingAbility, icon: FiTerminal },
            { label: 'Projects', val: readinessScore.projectStrength, icon: FiGithub },
            { label: 'Resume ATS', val: readinessScore.resumeQuality, icon: FiBookOpen },
            { label: 'Interview', val: readinessScore.interviewReadiness, icon: FiTerminal },
            { label: 'Certificates', val: readinessScore.certifications, icon: FiAward },
            { label: 'Overall', val: readinessScore.overallReadiness, icon: FiShield }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel p-3.5 rounded-xl flex flex-col items-center text-center gap-1.5">
                <Icon size={16} className="text-indigo-500" />
                <span className="text-[10px] text-gray-400 font-semibold">{item.label}</span>
                <span className="text-sm font-bold">{item.val}%</span>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SKILLS GRAPH & GITHUB REPOSITORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SKILLS GRAPH */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            ⚡ Verified Skills Graph
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills?.map((s, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-xl glass-panel flex items-center gap-2 border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{s.name}</span>
                    {s.verifiedBy?.length > 1 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">{s.category}</span>
                    <span className="text-[10px] font-bold text-indigo-500">{s.proficiency}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GITHUB INTEGRATION */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FiGithub className="text-indigo-500" /> GitHub Repository Evidence
            </h3>
            {githubData?.username && (
              <a
                href={`https://github.com/${githubData.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
              >
                @{githubData.username} <FiExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {githubData?.topRepositories?.slice(0, 3).map((repo, idx) => (
              <a
                key={idx}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl glass-panel hover:border-indigo-500/30 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold group-hover:text-indigo-500 transition-colors truncate">
                    {repo.name}
                  </h5>
                  <p className="text-[11px] text-gray-400 truncate">{repo.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 ml-3">
                  <span className="text-indigo-500 font-semibold">{repo.language}</span>
                  <span>⭐ {repo.stars}</span>
                </div>
              </a>
            )) || (
              <p className="text-xs text-gray-400 py-4 text-center">No public GitHub repositories linked yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* VERIFIED CERTIFICATES */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FiAward className="text-indigo-500" /> Verified CareerNest Certificates & Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates?.map((cert, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-2xl flex flex-col justify-between gap-3 border border-indigo-500/10">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                  {cert.grade}
                </span>
                <h4 className="text-xs font-bold mt-1">{cert.courseTitle}</h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-400">{cert.verificationCode}</span>
                <Link
                  to={`/verify-certificate/${cert.verificationCode}`}
                  className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  Verify <FiExternalLink size={12} />
                </Link>
              </div>
            </div>
          )) || (
            <p className="text-xs text-gray-400">No certificates completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerPassport;
