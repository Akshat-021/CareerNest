import React, { useState, useEffect } from 'react';
import { FiUser, FiSearch, FiCalendar, FiClock, FiAlertCircle, FiCheckCircle, FiShield, FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';

const MentorsSearch = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expertise, setExpertise] = useState('');

  // Booking states
  const [bookingMentor, setBookingMentor] = useState(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingError, setBookingError] = useState('');

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/mentors?search=${search}&expertise=${expertise}`);
      if (res.data.success) {
        setMentors(res.data.mentors);
      }
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [search, expertise]);

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!bookDate || !bookTime) {
      setBookingError('Please configure a date and time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingMsg('');

    try {
      const res = await api.post('/api/mentors/book', {
        mentorId: bookingMentor._id,
        date: bookDate,
        time: bookTime,
        notes: bookNotes
      });
      if (res.data.success) {
        setBookingMsg('Session request successfully sent! Check email for updates.');
        setTimeout(() => {
          setBookingMentor(null);
          setBookDate('');
          setBookTime('');
          setBookNotes('');
          setBookingMsg('');
        }, 2500);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to submit booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiUser size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Mentor Compatibility Matching</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Discover verified industry leaders ranked by <b>AI Compatibility %</b> matching your target role and critical skill gaps.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, expertise, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 glass-input"
          />
        </div>
        <div>
          <select
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            className="w-full glass-input bg-transparent"
          >
            <option value="" className="dark:bg-gray-900">All Domains</option>
            <option value="React" className="dark:bg-gray-900">React & Frontend</option>
            <option value="NodeJS" className="dark:bg-gray-900">NodeJS & APIs</option>
            <option value="Machine Learning" className="dark:bg-gray-900">Machine Learning & Data</option>
            <option value="System Design" className="dark:bg-gray-900">System Design & Cloud</option>
          </select>
        </div>
      </div>

      {/* MENTORS GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : mentors.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-12">No approved mentors found matching the search criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <div
              key={m._id}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between gap-4 hover:shadow-xl hover:border-indigo-500/30 transition-all duration-200 border border-indigo-500/10"
            >
              <div className="flex flex-col gap-3">
                {/* AI MATCH BADGE */}
                {m.aiMatchScore && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <FiTrendingUp size={11} /> {m.aiMatchScore}% AI Match
                    </span>
                    <span className="text-[10px] text-gray-400">Verified Mentor</span>
                  </div>
                )}

                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800/50 pb-3">
                  <img
                    src={m.profileImage || 'https://via.placeholder.com/150'}
                    alt={m.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-indigo-500/20 shadow-xs"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500">
                      <span>★</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{m.mentorProfile?.rating ? m.mentorProfile.rating.toFixed(1) : '5.0'}</span>
                      <span className="text-[10px] text-gray-400">({m.mentorProfile?.reviewsCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {m.mentorProfile?.bio}
                </p>

                {m.aiMatchReason && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10 leading-snug">
                    💡 <b>Why Match:</b> {m.aiMatchReason}
                  </p>
                )}

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {m.mentorProfile?.expertise?.map((exp, idx) => (
                    <span key={idx} className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2.5 py-0.5 rounded-full">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setBookingMentor(m)}
                className="glass-button-primary w-full text-center text-xs py-2.5"
              >
                Schedule 1-on-1 Session
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL POPUP */}
      {bookingMentor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative">
            <h3 className="font-bold text-base border-b border-gray-200/50 dark:border-gray-800/50 pb-3 mb-4">
              Book Call with {bookingMentor.name}
            </h3>

            {bookingMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
                <FiCheckCircle size={16} /> <span>{bookingMsg}</span>
              </div>
            )}

            {bookingError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                <FiAlertCircle size={16} /> <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookSession} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Select Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full pl-11 glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Available Slots</label>
                <div className="relative">
                  <FiClock className="absolute left-3.5 top-3.5 text-gray-400" />
                  <select
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full pl-11 glass-input bg-transparent"
                  >
                    <option value="" className="dark:bg-gray-900">Select slot time</option>
                    {(bookingMentor.mentorProfile?.availableSlots?.length > 0
                      ? bookingMentor.mentorProfile.availableSlots
                      : [{ day: 'Monday', time: '14:00 - 15:00' }, { day: 'Wednesday', time: '16:00 - 17:00' }, { day: 'Friday', time: '18:00 - 19:00' }]
                    ).map((s, idx) => (
                      <option key={idx} value={`${s.day} ${s.time}`} className="dark:bg-gray-900">
                        {s.day}: {s.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Mentorship Notes & Questions</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Share details about what you want to learn..."
                  className="w-full h-24 glass-input resize-none text-xs"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setBookingMentor(null)}
                  className="flex-1 glass-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 glass-button-primary text-xs"
                >
                  {bookingLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorsSearch;
