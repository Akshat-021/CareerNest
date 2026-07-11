import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiStar, FiChevronRight, FiPlay, FiBook, FiAward, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');
  
  // Progress states
  const [completedModules, setCompletedModules] = useState({});
  const [claimLoading, setClaimLoading] = useState(false);
  const [certIssued, setCertIssued] = useState(null);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/api/courses/${id}`);
      if (res.data.success) {
        setCourse(res.data.course);
      }
    } catch (err) {
      console.error('Failed to get course info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const toggleModuleCompletion = (modId) => {
    setCompletedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const isAllModulesCompleted = () => {
    if (!course || !course.modules.length) return false;
    return course.modules.every((mod) => completedModules[mod._id]);
  };

  const handleClaimCertificate = async () => {
    setClaimLoading(true);
    try {
      const res = await api.post('/api/platform/certificates', {
        courseName: course.title
      });
      if (res.data.success) {
        setCertIssued(res.data.certificate);
      }
    } catch (err) {
      console.error('Failed to claim certificate:', err);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/courses/${id}/reviews`, { rating, comment });
      if (res.data.success) {
        setReviewMsg('Review posted successfully!');
        fetchCourse(); // Refresh reviews
        setComment('');
      }
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Review failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return <p className="text-center py-12">Course not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER HERO */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
        <img
          src={course.thumbnail || 'https://via.placeholder.com/400x200'}
          alt={course.title}
          className="w-full md:w-64 h-40 object-cover rounded-xl border border-gray-200/50 dark:border-gray-800/40"
        />
        <div className="flex-1 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full w-fit uppercase">
            {course.category}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">{course.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">{course.description}</p>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mt-2">
            <span className="flex items-center gap-1"><FiClock /> {course.duration}</span>
            <span>Level: {course.difficulty}</span>
            <span className="flex items-center gap-1 text-amber-500"><FiStar /> {course.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABS CONTENT AREA */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex border-b border-gray-200 dark:border-gray-850">
            {['modules', 'projects', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-5 text-xs font-bold uppercase border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-gray-400 hover:text-indigo-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Curriculum Modules */}
          {activeTab === 'modules' && (
            <div className="flex flex-col gap-3 mt-2">
              {course.modules.map((mod, index) => (
                <div key={mod._id} className="p-4 bg-white dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/50 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><FiPlay size={14} /></button>
                      <div>
                        <h4 className="text-xs font-bold">{mod.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{mod.duration}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!completedModules[mod._id]}
                        onChange={() => toggleModuleCompletion(mod._id)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <span className="text-[10px] font-semibold text-gray-400">Completed</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-10 border-l border-gray-200/50 dark:border-gray-800/50 py-1">{mod.description}</p>
                  
                  {/* Mock Video player preview if video link exists */}
                  {mod.videoUrl && (
                    <div className="pl-10 mt-1">
                      <video src={mod.videoUrl} controls className="w-full max-h-56 bg-black rounded-lg" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Projects Outline */}
          {activeTab === 'projects' && (
            <div className="flex flex-col gap-3 mt-2">
              {course.projects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/50 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold">{proj.title}</h4>
                    <span className="text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">{proj.difficulty}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{proj.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Reviews Panel */}
          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-5 mt-2">
              {/* Review submit form */}
              <form onSubmit={handleAddReview} className="glass-panel p-4 rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-bold">Write a Course Review</h4>
                {reviewMsg && <p className="text-[10px] font-semibold text-indigo-500">{reviewMsg}</p>}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Rating:</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="glass-input py-1 text-xs bg-transparent">
                    <option value="5" className="dark:bg-gray-900">5 Stars</option>
                    <option value="4" className="dark:bg-gray-900">4 Stars</option>
                    <option value="3" className="dark:bg-gray-900">3 Stars</option>
                    <option value="2" className="dark:bg-gray-900">2 Stars</option>
                    <option value="1" className="dark:bg-gray-900">1 Star</option>
                  </select>
                </div>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback on curriculum, videos and assignments..."
                  className="w-full h-16 glass-input text-xs resize-none"
                />
                <button type="submit" className="glass-button-primary w-fit text-xs px-4 py-2 self-end">Submit Review</button>
              </form>

              {/* Review posts */}
              <div className="flex flex-col gap-3">
                {course.reviews.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex flex-col gap-1 border border-gray-150 dark:border-gray-850">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{rev.student?.name}</span>
                      <span className="text-xs text-amber-500">★ {rev.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR CLAIM PANEL */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 text-center">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-full mx-auto w-fit"><FiAward size={24} /></div>
            <div>
              <h3 className="font-bold text-sm">Course Completion</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Complete all curriculum video tasks to claim your validation certificate.</p>
            </div>

            {/* Progress indicators */}
            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{
                  width: `${(Object.keys(completedModules).filter(k => completedModules[k]).length / course.modules.length) * 100}%`
                }}
              />
            </div>

            {certIssued ? (
              <div className="flex flex-col gap-3 items-center mt-2 border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                <FiCheckCircle className="text-emerald-500" size={24} />
                <div className="text-xs font-bold text-emerald-500">Certificate Claimed!</div>
                <button
                  onClick={() => navigate('/certificates')}
                  className="text-xs text-indigo-500 font-semibold hover:underline"
                >
                  View Certificates
                </button>
              </div>
            ) : (
              <button
                onClick={handleClaimCertificate}
                disabled={claimLoading || !isAllModulesCompleted()}
                className="glass-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {claimLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  'Claim Course Certificate'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
