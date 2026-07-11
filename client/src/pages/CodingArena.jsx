import React, { useState, useEffect } from 'react';
import { FiTerminal, FiPlay, FiCheckCircle, FiXCircle, FiAward, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const CodingArena = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const fetchChallenges = async () => {
    try {
      const res = await api.get('/api/platform/challenges');
      if (res.data.success) {
        setChallenges(res.data.challenges);
        if (res.data.challenges.length > 0) {
          selectChallenge(res.data.challenges[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load coding arena:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const selectChallenge = (c) => {
    setActiveChallenge(c);
    setCode(c.starterCode);
    setResults(null);
    setError('');
  };

  const handleSubmitCode = async () => {
    setSubmitLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await api.post('/api/platform/challenges/submit', {
        challengeId: activeChallenge._id,
        code
      });
      if (res.data.success) {
        setResults(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Code submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* SIDEBAR LIST */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><FiTerminal className="text-indigo-500" /> Coding Arena</h3>
          {loading ? (
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto my-4" />
          ) : (
            <div className="flex flex-col gap-2">
              {challenges.map((c) => (
                <button
                  key={c._id}
                  onClick={() => selectChallenge(c)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                    activeChallenge?._id === c._id
                      ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500 font-semibold'
                      : 'border-gray-250/20 dark:border-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <p className="truncate font-semibold">{c.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{c.points} PTS</span>
                    <span className={`px-1.5 py-0.5 rounded uppercase ${
                      c.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>{c.difficulty}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CODE EDITOR CONSOLE */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {activeChallenge ? (
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-800/40 shadow-xl h-[78vh]">
            <div className="p-4 bg-gray-55 dark:bg-gray-900/60 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-gray-400 ml-2">{activeChallenge.title} - Editor</span>
              </div>
              <button
                onClick={handleSubmitCode}
                disabled={submitLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                <FiPlay size={12} /> Run Code
              </button>
            </div>

            {/* Description split */}
            <div className="p-4 border-b border-gray-200/40 dark:border-gray-800/45 bg-gray-50/50 dark:bg-gray-950/20 text-xs">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Challenge Instructions:</p>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{activeChallenge.description}</p>
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 relative bg-[#090d16] font-mono text-sm">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                className="w-full h-full p-4 bg-transparent text-[#a6accd] border-none outline-none resize-none font-mono focus:ring-0 leading-relaxed"
              />
            </div>

            {/* Compile/Test Outputs */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-55 dark:bg-gray-950 flex flex-col gap-2 min-h-[120px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Console Output / Test Outcomes</span>
              {submitLoading ? (
                <div className="text-xs text-gray-400 flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Compiling runtime codes and running checks...</span>
                </div>
              ) : results ? (
                <div className="text-xs">
                  {results.passed ? (
                    <div className="flex items-start gap-2.5 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                      <FiCheckCircle size={16} className="mt-0.5" />
                      <div>
                        <p className="font-bold">Execution Passed</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{results.feedback}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">🎉 +{results.pointsEarned} Points Added to Streak Score</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-rose-500 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                      <FiXCircle size={16} className="mt-0.5" />
                      <div>
                        <p className="font-bold">Test Case Failed</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{results.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="text-xs text-rose-500 flex items-center gap-1.5"><FiAlertCircle /> {error}</div>
              ) : (
                <p className="text-xs text-gray-400 italic">No output logged. Run compile to check results.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
            <span className="text-4xl">💻</span>
            <h3 className="font-bold text-base mt-2">Arena Sandbox</h3>
            <p className="text-xs text-gray-400 max-w-sm">No challenge currently selected. Pick one from the challenges list on the left to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingArena;
