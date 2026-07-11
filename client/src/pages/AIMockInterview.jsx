import React, { useState } from 'react';
import { FiTerminal, FiAward, FiAlertCircle, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const AIMockInterview = () => {
  const [tech, setTech] = useState('React');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const startInterview = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setCompleted(false);
    setEvaluation(null);

    try {
      const res = await api.post('/api/ai/interview', {
        technology: tech,
        difficulty
      });
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('Failed to generate interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Evaluate results
      setCompleted(true);
      evaluateInterview();
    }
  };

  const evaluateInterview = () => {
    // Generate simulated score based on text lengths and matches
    let score = 50;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount > 0) {
      score += Math.min(answeredCount * 10, 40);
      
      // If answers are long and descriptive, add bonus
      const totalCharLength = Object.values(answers).reduce((acc, text) => acc + text.length, 0);
      if (totalCharLength > 400) score += 8;
    }

    setEvaluation({
      overallScore: Math.min(score, 98),
      feedback: "Great structure in detailing projects. Focus more on horizontal scaling and database optimization variables.",
      improvements: [
        "Explain structural database indexes explicitly when describing REST API builds.",
        "Ensure you implement the STAR method during behavioral situations."
      ]
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Mock Interview Simulator</h1>
        <p className="text-xs text-gray-400 font-sans">Practice Technical, Behavioral, and HR interviews. CareerNest will score your answers and suggest key improvements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PARAMS SELECTOR PANEL */}
        {!questions.length && (
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-bold text-sm flex items-center gap-2"><FiTerminal className="text-indigo-500" /> Session Settings</h3>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Technology</label>
              <select value={tech} onChange={(e) => setTech(e.target.value)} className="w-full glass-input bg-transparent">
                <option value="React" className="dark:bg-gray-900">React & Frontend</option>
                <option value="NodeJS" className="dark:bg-gray-900">NodeJS & Backend</option>
                <option value="Python" className="dark:bg-gray-900">Python & ML</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full glass-input bg-transparent">
                <option value="Easy" className="dark:bg-gray-900">Easy</option>
                <option value="Medium" className="dark:bg-gray-900">Medium</option>
                <option value="Hard" className="dark:bg-gray-900">Hard</option>
              </select>
            </div>
            <button onClick={startInterview} disabled={loading} className="glass-button-primary w-full">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Start Interview'}
            </button>
          </div>
        )}

        {/* ACTIVE QUESTION PANEL */}
        {questions.length > 0 && !completed && (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800/50 pb-3">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold uppercase px-2.5 py-1 rounded-md">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-gray-400 font-semibold">{questions[currentIndex].type} Round</span>
              </div>

              <h3 className="font-semibold text-sm leading-relaxed">{questions[currentIndex].question}</h3>

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-xs font-semibold text-gray-400">Your Response</label>
                <textarea
                  value={answers[questions[currentIndex].id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [questions[currentIndex].id]: e.target.value })}
                  placeholder="Type your response here..."
                  className="w-full h-32 glass-input resize-none"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setQuestions([])}
                  className="text-xs text-rose-500 font-semibold hover:underline"
                >
                  Quit Interview
                </button>
                <button
                  onClick={handleNext}
                  className="glass-button-primary flex items-center gap-1.5"
                >
                  {currentIndex === questions.length - 1 ? 'Finish & Analyze' : 'Next Question'} <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED RESULTS PANEL */}
        {completed && evaluation && (
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200/50 dark:border-gray-800/50 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex flex-col items-center justify-center text-indigo-500 bg-indigo-500/5">
                    <span className="text-2xl font-extrabold">{evaluation.overallScore}%</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider">Score</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Interview Evaluation</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm mt-0.5">{evaluation.feedback}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1.5"><FiAward /> Suggestions for Improvement</h4>
                <div className="flex flex-col gap-2">
                  {evaluation.improvements.map((pt, idx) => (
                    <div key={idx} className="text-xs flex items-start gap-2">
                      <FiCheckCircle className="text-emerald-500 mt-0.5" size={14} /> <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setQuestions([])} className="glass-button-secondary w-full text-center">
                Close & Return
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT STATE BANNER */}
        {!questions.length && (
          <div className="lg:col-span-2 glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
            <span className="text-4xl">🎙️</span>
            <h3 className="font-bold text-base mt-2">Mock Interview Session</h3>
            <p className="text-xs text-gray-400 max-w-sm">No active interview session running. Choose your settings on the left panel and click start to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMockInterview;
