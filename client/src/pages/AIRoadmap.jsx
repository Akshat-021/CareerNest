import React, { useState, useEffect } from 'react';
import { FiCompass, FiCpu, FiCheckSquare, FiTerminal, FiBookOpen } from 'react-icons/fi';
import api from '../services/api';

const AIRoadmap = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('Web Development');
  const [loading, setLoading] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState(null);

  const tracks = [
    'Web Development', 'AI', 'Machine Learning', 'Data Science',
    'Cloud Computing', 'Cyber Security', 'DevOps', 'Blockchain', 'UI/UX'
  ];

  const fetchUserRoadmaps = async () => {
    try {
      const res = await api.get('/api/ai/roadmaps');
      if (res.data.success) {
        setRoadmaps(res.data.roadmaps);
        if (res.data.roadmaps.length > 0) {
          setActiveRoadmap(res.data.roadmaps[0]);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve roadmaps:', err);
    }
  };

  useEffect(() => {
    fetchUserRoadmaps();
  }, []);

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/ai/roadmap', { track: selectedTrack });
      if (res.data.success) {
        setActiveRoadmap(res.data.roadmap);
        fetchUserRoadmaps(); // Refresh historical list
      }
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* SIDE CONTROL PANEL */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* Track Generator Form */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FiCompass className="text-indigo-500" /> Career Track Selector
          </h3>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Select Target</label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full glass-input bg-transparent"
            >
              {tracks.map((t) => (
                <option key={t} value={t} className="dark:bg-gray-900">{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateRoadmap}
            disabled={loading}
            className="glass-button-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiCpu /> Build AI Roadmap
              </>
            )}
          </button>
        </div>

        {/* History Catalog */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm">Your Roadmaps</h3>
          {roadmaps.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No roadmaps generated yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {roadmaps.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setActiveRoadmap(r)}
                  className={`text-left text-xs p-3 rounded-xl border transition-all ${
                    activeRoadmap?._id === r._id
                      ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500 font-semibold'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <p className="truncate">{r.track}</p>
                  <span className="text-[9px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROADMAP TIMELINE VISUALIZATION */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-400">Analyzing skills & compiling curriculum modules...</p>
          </div>
        ) : activeRoadmap ? (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200/50 dark:border-gray-800/50 pb-4">
              <div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                  ACTIVE AI CURRICULUM
                </span>
                <h2 className="text-xl font-bold mt-1">{activeRoadmap.track} Roadmap</h2>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Est: <span className="font-semibold text-gray-700 dark:text-gray-200">{activeRoadmap.duration}</span></p>
                <p>Level: <span className="font-semibold text-gray-700 dark:text-gray-200">{activeRoadmap.difficulty}</span></p>
              </div>
            </div>

            {/* TIMELINE TREE */}
            <div className="relative border-l-2 border-indigo-500/20 pl-6 ml-4 flex flex-col gap-8 py-4">
              {activeRoadmap.modules.map((mod, modIdx) => (
                <div key={modIdx} className="relative">
                  {/* Timeline bullet node */}
                  <span className="absolute -left-10 top-1.5 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-gray-900 shadow">
                    {modIdx + 1}
                  </span>

                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{mod.timeline}</span>
                      <h3 className="font-bold text-base mt-0.5">{mod.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Topics & Resources */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-xl flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5"><FiBookOpen /> Topics & Resources</h4>
                        <ul className="flex flex-col gap-1.5">
                          {mod.topics.map((t, idx) => (
                            <li key={idx} className="text-xs flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tasks & Milestones */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-xl flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5"><FiCheckSquare /> Weekly Tasks</h4>
                        <ul className="flex flex-col gap-1.5">
                          {mod.weeklyTasks.map((t, idx) => (
                            <li key={idx} className="text-xs flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Interview Prep Questions & Problems */}
                    <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl flex flex-col gap-2.5">
                      <h4 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1.5"><FiTerminal /> Mock Prep & Coding Challenges</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Mock Interview Prompts:</p>
                          <ul className="list-disc list-inside mt-1 flex flex-col gap-1">
                            {mod.mockInterviews.map((mi, idx) => <li key={idx}>{mi}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Practice Exercises:</p>
                          <ul className="list-disc list-inside mt-1 flex flex-col gap-1">
                            {mod.practiceProblems.map((pr, idx) => <li key={idx}>{pr}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
            <span className="text-4xl">🧭</span>
            <h3 className="font-bold text-base mt-2">Generate Career Roadmap</h3>
            <p className="text-xs text-gray-400 max-w-sm">Select a track and build your timeline roadmap. We will generate weekly modules, milestones, and interview tasks tailored for you.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRoadmap;
