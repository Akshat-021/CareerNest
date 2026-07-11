import React, { useState } from 'react';
import { FiCheckSquare, FiAlertCircle, FiAward, FiBook } from 'react-icons/fi';
import api from '../services/api';

const AIQuiz = () => {
  const [topic, setTopic] = useState('React Hooks');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const startQuiz = async () => {
    setLoading(true);
    setQuiz(null);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setAnswered(false);
    setCorrectAnswersCount(0);
    setCompleted(false);

    try {
      const res = await api.post('/api/ai/quiz', {
        courseName: 'System Prep',
        topic,
        difficulty
      });
      if (res.data.success) {
        setQuiz(res.data.quiz);
      }
    } catch (err) {
      console.error('Quiz creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optIndex) => {
    if (answered) return;
    setSelectedOpt(optIndex);
    setAnswered(true);

    const question = quiz.questions[currentIdx];
    if (optIndex === question.correctAnswerIndex) {
      setCorrectAnswersCount(correctAnswersCount + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setAnswered(false);
    } else {
      setCompleted(true);
      // Submit results to backend
      try {
        const res = await api.post(`/api/ai/quiz/${quiz._id}/submit`, {
          score: correctAnswersCount
        });
        if (res.data.success) {
          setPointsEarned(res.data.pointsEarned);
        }
      } catch (err) {
        console.error('Quiz submit failed:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Quiz Center</h1>
        <p className="text-xs text-gray-400">Generate evaluation quizzes instantly based on course topics and test your knowledge to earn leaderboard points.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PARAMS CONTROL PANEL */}
        {!quiz && (
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-bold text-sm flex items-center gap-2"><FiBook className="text-indigo-500" /> Quiz Settings</h3>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Topic/Theme</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full glass-input bg-transparent">
                <option value="React Hooks" className="dark:bg-gray-900">React Hooks</option>
                <option value="Mongoose Indexing" className="dark:bg-gray-900">Mongoose Indexing</option>
                <option value="API Security" className="dark:bg-gray-900">API Security</option>
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
            <button onClick={startQuiz} disabled={loading} className="glass-button-primary w-full">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Start Quiz'}
            </button>
          </div>
        )}

        {/* ACTIVE QUESTIONS PANEL */}
        {quiz && !completed && (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800/50 pb-3">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold uppercase px-2.5 py-1 rounded-md">
                  Question {currentIdx + 1} of {quiz.questions.length}
                </span>
                <span className="text-xs text-gray-400 font-semibold">{quiz.topic} ({quiz.difficulty})</span>
              </div>

              <h3 className="font-semibold text-sm leading-relaxed">{quiz.questions[currentIdx].question}</h3>

              {/* Options */}
              <div className="flex flex-col gap-2.5 mt-4">
                {quiz.questions[currentIdx].options.map((opt, idx) => {
                  const isCorrect = idx === quiz.questions[currentIdx].correctAnswerIndex;
                  const isSelected = idx === selectedOpt;
                  let optStyle = 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850/50';

                  if (answered) {
                    if (isCorrect) optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                    else if (isSelected) optStyle = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={answered}
                      className={`w-full text-left p-3.5 border rounded-xl text-xs transition-all ${optStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel */}
              {answered && (
                <div className="mt-4 p-4 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  💡 <span className="font-semibold text-indigo-500">Explanation:</span> {quiz.questions[currentIdx].explanation}
                </div>
              )}

              {answered && (
                <div className="flex justify-end mt-4">
                  <button onClick={handleNext} className="glass-button-primary">
                    {currentIdx === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS PANEL */}
        {completed && quiz && (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center">
                <FiAward size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Quiz Completed!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  You scored <span className="font-bold text-indigo-500">{correctAnswersCount}</span> out of{' '}
                  <span className="font-bold">{quiz.questions.length}</span> questions.
                </p>
              </div>

              {pointsEarned > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold">
                  🎉 +{pointsEarned} Leaderboard Points Awarded!
                </div>
              )}

              <button onClick={() => setQuiz(null)} className="glass-button-secondary w-full">
                Try Another Quiz
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT BANNER */}
        {!quiz && (
          <div className="lg:col-span-2 glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center py-28">
            <span className="text-4xl">📝</span>
            <h3 className="font-bold text-base mt-2">Active Quiz Session</h3>
            <p className="text-xs text-gray-400 max-w-sm">No quiz session running. Select topic settings on the left panel and click start to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIQuiz;
