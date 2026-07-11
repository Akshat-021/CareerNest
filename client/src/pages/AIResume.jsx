import React, { useState } from 'react';
import { FiUploadCloud, FiAlertCircle, FiCheckSquare, FiAlertTriangle, FiBookOpen, FiFileText, FiAward } from 'react-icons/fi';
import api from '../services/api';

const AIResume = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleScanResume = async () => {
    if (!file) {
      setError('Please select a file to upload first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/api/ai/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan resume. Check file extensions.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-500/5';
    if (score >= 65) return 'text-amber-500 border-amber-500 bg-amber-500/5';
    return 'text-rose-500 border-rose-500 bg-rose-500/5';
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Resume ATS Scanner</h1>
        <p className="text-xs text-gray-400">Upload your resume to check its ATS compatibility score, missing keywords, and structural improvements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FILE UPLOAD COMPONENT */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-full mb-1"><FiUploadCloud size={32} /></div>
            <div>
              <h3 className="font-bold text-sm">Select Resume File</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, DOC, or DOCX up to 10MB</p>
            </div>

            <label className="w-full cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-500 rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
              <FiFileText /> {file ? file.name : 'Choose File'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && (
              <div className="w-full p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] flex items-center gap-2">
                <FiAlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleScanResume}
              disabled={loading || !file}
              className="glass-button-primary w-full mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                'Upload & Scan Resume'
              )}
            </button>
          </div>
        </div>

        {/* ANALYSIS RESULTS COMPONENT */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-4 py-24">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-400">Extracting content and running keyword optimizations...</p>
            </div>
          ) : analysis ? (
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
              {/* ATS SCORE HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200/50 dark:border-gray-800/50 pb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(analysis.atsScore)}`}>
                    <span className="text-2xl font-extrabold">{analysis.atsScore}%</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider">ATS Score</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Resume Analysis Results</h3>
                    <p className="text-xs text-gray-400">Status Rating: <span className="font-bold text-gray-700 dark:text-gray-200">{analysis.rating}</span></p>
                  </div>
                </div>
              </div>

              {/* DETAILED ISSUES ACCORDION LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Missing Skills */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1.5"><FiBookOpen /> Missing Keywords/Skills</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.missingSkills.map((sk, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2.5 py-1 rounded-full">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grammar & Verbs */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 rounded-xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1.5"><FiAlertTriangle /> Grammar & Formatting Issues</h4>
                  <ul className="flex flex-col gap-1.5 list-disc list-inside text-xs text-gray-500 dark:text-gray-400">
                    {analysis.formattingIssues.concat(analysis.grammarSuggestions).slice(0, 3).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* GOOGLE X-Y-Z IMPROVEMENTS */}
              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5"><FiCheckSquare /> Suggested Action Bullet Points (Google X-Y-Z Format)</h4>
                <div className="flex flex-col gap-2">
                  {analysis.improvedPoints.map((pt, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-gray-950 rounded-lg text-xs leading-relaxed border border-gray-150 dark:border-gray-850">
                      💡 "{pt}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
              <span className="text-4xl">📄</span>
              <h3 className="font-bold text-base mt-2">Resume Scan Results</h3>
              <p className="text-xs text-gray-400 max-w-sm">No analysis performed yet. Select your latest resume file and click the scan button to view results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResume;
