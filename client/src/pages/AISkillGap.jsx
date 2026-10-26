import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiCpu, FiCheckSquare, FiAlertCircle, FiRefreshCw, FiBookOpen, FiCompass, FiTerminal } from 'react-icons/fi';
import api from '../services/api';
import { Alert, EmptyState, FallbackDisclosure } from '../components/feedback';
import { Button, Spinner } from '../components/common';

const AISkillGap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gapData, setGapData] = useState(null);
  const [error, setError] = useState('');

  const fetchGapAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/ai/gap-analysis');
      if (res.data.success) {
        setGapData(res.data.analysis);
      } else {
        setError(res.data.message || 'Unable to retrieve skill gap data.');
      }
    } catch (err) {
      console.error('Failed to get skill gap:', err);
      setError(err.response?.data?.message || 'Network error or service unavailable while calculating skill gaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" message="Comparing your skills against target role benchmarks..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER & REFRESH ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">AI Skill-Gap Analyzer</h1>
          <p className="text-xs text-gray-400">Comparing your profile skills against target career role targets.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchGapAnalysis}
          disabled={loading}
          aria-label="Re-analyze skill gaps"
        >
          <FiRefreshCw className="mr-1.5" /> Re-Analyze
        </Button>
      </div>

      {/* ERROR ALERT IF ACTIVE */}
      {error && (
        <Alert
          type="error"
          title="Analysis Notice"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={fetchGapAnalysis}>
              Retry
            </Button>
          }
          onClose={() => setError('')}
        />
      )}

      {/* ERROR EMPTY STATE WHEN NO DATA AVAILABLE */}
      {!gapData && error ? (
        <EmptyState
          icon={FiAlertCircle}
          title="Skill-Gap Analysis Unavailable"
          description={error}
          action={
            <Button size="sm" variant="primary" onClick={fetchGapAnalysis}>
              Retry Analysis
            </Button>
          }
        />
      ) : (
        <>
          {/* AI FALLBACK DISCLOSURE */}
          <FallbackDisclosure
            isSimulated={gapData?.isSimulatedFallback ?? true}
            engineName={gapData?.aiEngine || (gapData?.isSimulatedFallback ? 'Heuristic Career Simulation Engine' : 'Google Gemini AI')}
            compact={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GAP STATUS PANEL */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FiCpu className="text-indigo-500" /> Missing Competencies
                </h3>
                {gapData?.missingSkills && gapData.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gapData.missingSkills.map((sk, idx) => (
                      <span key={idx} className="text-xs font-semibold bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-full border border-rose-500/20">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No missing skills detected! Your profile matches your goal track.</p>
                )}

                <div className="border-t border-gray-200/50 dark:border-gray-800/40 pt-4 flex flex-col gap-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Timeline</p>
                  <p className="text-xs font-semibold">{gapData?.timeline || '3-5 weeks of focused studies'}</p>
                </div>
              </div>

              {/* RECOMMENDED WORKFLOWS PANEL */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                <h3 className="font-bold text-xs uppercase text-gray-400">Next Career Steps</h3>
                <p className="text-xs text-gray-500">Bridge your identified skill gaps with targeted platform workflows:</p>
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/ai-roadmap')}
                  >
                    <FiCompass className="mr-2 text-indigo-500" /> Generate Career Roadmap
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/courses')}
                  >
                    <FiBookOpen className="mr-2 text-emerald-500" /> Browse Prep Courses
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/ai-interview')}
                  >
                    <FiTerminal className="mr-2 text-amber-500" /> Practice Mock Interview
                  </Button>
                </div>
              </div>
            </div>

            {/* DETAILED PATH & PROJECTS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FiTrendingUp className="text-indigo-500" /> Recommended Study Steps
                </h3>
                <div className="flex flex-col gap-3">
                  {(gapData?.recommendedLearningPath || []).map((step, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-xl text-xs flex items-start gap-3">
                      <div className="p-1 bg-indigo-500/10 text-indigo-500 rounded-md mt-0.5"><FiCheckSquare size={12} /></div>
                      <div className="leading-relaxed">{step}</div>
                    </div>
                  ))}
                  {(!gapData?.recommendedLearningPath || gapData.recommendedLearningPath.length === 0) && (
                    <p className="text-xs text-gray-400">Personalized study steps will appear here as your profile develops.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Courses */}
                <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-gray-400 uppercase">Recommended Prep Courses</h4>
                  <ul className="flex flex-col gap-2">
                    {(gapData?.recommendedCourses || []).map((c, idx) => (
                      <li key={idx} className="text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {c}
                      </li>
                    ))}
                    {(!gapData?.recommendedCourses || gapData.recommendedCourses.length === 0) && (
                      <li className="text-xs text-gray-400">All core recommendations completed.</li>
                    )}
                  </ul>
                </div>

                {/* Practice Projects */}
                <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-gray-400 uppercase">Practice Projects to Build</h4>
                  <ul className="flex flex-col gap-2">
                    {(gapData?.practiceProjects || []).map((p, idx) => (
                      <li key={idx} className="text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {p}
                      </li>
                    ))}
                    {(!gapData?.practiceProjects || gapData.practiceProjects.length === 0) && (
                      <li className="text-xs text-gray-400">No additional projects required.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AISkillGap;
