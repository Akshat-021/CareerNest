import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTerminal, FiAward, FiAlertCircle, FiCheckCircle,
  FiMic, FiMicOff, FiVolume2, FiArrowRight, FiRotateCcw,
  FiBookOpen, FiHome
} from 'react-icons/fi';
import api from '../services/api';
import { FallbackDisclosure, Alert } from '../components/feedback';

const AIMockInterview = () => {
  const navigate = useNavigate();
  const [tech, setTech] = useState('React');
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiMetadata, setAiMetadata] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [questionEvaluations, setQuestionEvaluations] = useState({});
  const [completed, setCompleted] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  const startInterview = async () => {
    setLoading(true);
    setError('');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setCurrentAnswer('');
    setQuestionEvaluations({});
    setCompleted(false);

    try {
      const res = await api.post('/api/ai/interview', {
        technology: tech,
        role,
        difficulty
      });
      if (res.data.success) {
        setQuestions(res.data.questions || []);
        setAiMetadata({
          isSimulatedFallback: res.data.isSimulatedFallback ?? true,
          aiEngine: res.data.aiEngine || 'Heuristic Career Simulation Engine'
        });
      }
    } catch (err) {
      console.error('Failed to generate interview:', err);
      setError(err.response?.data?.message || 'Failed to generate interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Voice speech synthesis (reads question out loud)
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice speech recognition (records user speech)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript);
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const handleEvaluateCurrentAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setEvaluating(true);
    const q = questions[currentIndex];

    try {
      const res = await api.post('/api/ai/interview/evaluate', {
        question: q.question,
        answer: currentAnswer,
        technology: tech,
        role,
        difficulty
      });

      if (res.data.success) {
        const evalData = res.data.evaluation;
        setQuestionEvaluations(prev => ({ ...prev, [currentIndex]: evalData }));
        setAnswers(prev => ({ ...prev, [currentIndex]: currentAnswer }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(answers[currentIndex + 1] || '');
    } else {
      setCompleted(true);
    }
  };

  const currentQ = questions[currentIndex];
  const currentEval = questionEvaluations[currentIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiTerminal size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Voice AI Mock Interview Simulator</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Simulate technical and behavioral rounds with voice/text input. Evaluates <b>technical accuracy</b>, <b>STAR structure</b>, <b>clarity</b>, and <b>confidence</b>.
          </p>
        </div>

        {aiMetadata && (
          <FallbackDisclosure
            isSimulated={aiMetadata.isSimulatedFallback}
            engineName={aiMetadata.aiEngine}
            compact={true}
          />
        )}
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PARAMS SELECTOR PANEL (BEFORE START) */}
        {questions.length === 0 && (
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl flex flex-col gap-4 shadow-md">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FiTerminal className="text-indigo-500" /> Session Configuration
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Target Technology</label>
              <select value={tech} onChange={(e) => setTech(e.target.value)} className="w-full glass-input bg-transparent">
                <option value="React" className="dark:bg-gray-900">React & Frontend</option>
                <option value="NodeJS" className="dark:bg-gray-900">NodeJS & Backend</option>
                <option value="FullStack" className="dark:bg-gray-900">Full Stack MERN</option>
                <option value="Python" className="dark:bg-gray-900">Python & Data Engineering</option>
                <option value="DevOps" className="dark:bg-gray-900">DevOps & Cloud Docker/AWS</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Target Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Difficulty Level</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full glass-input bg-transparent">
                <option value="Entry-Level" className="dark:bg-gray-900">Entry-Level (Fresher)</option>
                <option value="Medium" className="dark:bg-gray-900">Intermediate (1-3 yrs)</option>
                <option value="Senior" className="dark:bg-gray-900">Advanced / Senior</option>
              </select>
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="glass-button-primary w-full mt-2"
            >
              {loading ? 'Synthesizing Questions...' : 'Start AI Mock Interview'}
            </button>
          </div>
        )}

        {/* ACTIVE QUESTION CONSOLE */}
        {questions.length > 0 && !completed && currentQ && (
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* QUESTION CARD */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                  Question {currentIndex + 1} of {questions.length} • {currentQ.type} Round
                </span>

                <button
                  onClick={() => speakQuestion(currentQ.question)}
                  className="p-2 rounded-xl glass-panel text-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Read question out loud"
                >
                  <FiVolume2 size={15} /> Listen
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {currentQ.question}
              </h2>

              {/* ANSWER INPUT & VOICE CONTROLS */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Your Candidate Response</label>
                  <button
                    onClick={toggleListening}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'glass-panel text-gray-600 dark:text-gray-300 hover:text-indigo-500'
                    }`}
                  >
                    {isListening ? <FiMicOff /> : <FiMic />} {isListening ? 'Recording Voice...' : 'Voice Answer'}
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Speak with the voice mic or type your structured technical explanation here..."
                  className="w-full glass-input text-xs leading-relaxed resize-none font-sans"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={startInterview}
                    className="glass-button-secondary text-xs flex items-center gap-1.5"
                  >
                    <FiRotateCcw size={13} /> Reset
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleEvaluateCurrentAnswer}
                      disabled={evaluating || !currentAnswer.trim()}
                      className="glass-button-primary text-xs"
                    >
                      {evaluating ? 'Analyzing Rubric...' : 'Evaluate Answer'}
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      className="glass-button-secondary text-xs flex items-center gap-1.5"
                    >
                      Next Question <FiArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME AI RUBRIC EVALUATION */}
            {currentEval && (
              <div className="glass-panel-accent p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-500/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      AI Rubric Feedback
                    </span>
                    <h3 className="text-base font-bold mt-0.5">Answer Performance Calibration</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-500">{currentEval.overallScore}/100</span>
                    <p className="text-[10px] text-gray-400">Composite Score</p>
                  </div>
                </div>

                {/* 4-AXIS BREAKDOWN */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl glass-panel text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Technical</span>
                    <p className="text-sm font-bold text-indigo-500 mt-1">{currentEval.technicalScore}%</p>
                  </div>
                  <div className="p-3 rounded-xl glass-panel text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">STAR Structure</span>
                    <p className="text-sm font-bold text-violet-500 mt-1">{currentEval.structureScore}%</p>
                  </div>
                  <div className="p-3 rounded-xl glass-panel text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Clarity</span>
                    <p className="text-sm font-bold text-emerald-500 mt-1">{currentEval.clarityScore}%</p>
                  </div>
                  <div className="p-3 rounded-xl glass-panel text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Confidence</span>
                    <p className="text-sm font-bold text-amber-500 mt-1">{currentEval.confidenceScore}%</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                  {currentEval.feedback}
                </p>

                {/* MODEL SAMPLE ANSWER */}
                {currentEval.idealSampleAnswer && (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase">Model Senior Engineer Response</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                      "{currentEval.idealSampleAnswer}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUMMARY AFTER COMPLETION */}
        {completed && (
          <div className="lg:col-span-3 glass-panel-accent p-8 rounded-3xl flex flex-col items-center text-center gap-4 max-w-2xl mx-auto shadow-2xl">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full text-3xl">
              🏆
            </div>
            <h2 className="text-2xl font-extrabold">Mock Interview Completed!</h2>
            <p className="text-xs text-gray-400 max-w-md">
              Your evaluations have been recorded into your central <b>CareerProfile</b> to update your Interview Readiness and Communication scores.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
              <button
                onClick={startInterview}
                className="glass-button-primary text-xs flex items-center gap-1.5"
              >
                <FiRotateCcw size={13} /> Take Another Session
              </button>
              <button
                onClick={() => navigate('/challenges')}
                className="glass-button-secondary text-xs flex items-center gap-1.5"
              >
                <FiTerminal size={13} /> Coding Arena
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="glass-button-secondary text-xs flex items-center gap-1.5"
              >
                <FiBookOpen size={13} /> Prep Courses
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="glass-button-secondary text-xs flex items-center gap-1.5"
              >
                <FiHome size={13} /> Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMockInterview;
