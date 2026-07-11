import React, { useState, useEffect } from 'react';
import { FiUser, FiSearch, FiCalendar, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
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
          <h1 className="text-2xl font-bold tracking-tight">Search Expert Mentors</h1>
          <p className="text-xs text-gray-400">Book real-time 1-on-1 calls with industry leaders to clear doubts and get career guidance.</p>
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
            <option value="" className="dark:bg-gray-900">All Expertise</option>
            <option value="React" className="dark:bg-gray-900">React & Frontend</option>
            <option value="NodeJS" className="dark:bg-gray-900">NodeJS & APIs</option>
            <option value="Machine Learning" className="dark:bg-gray-900">Machine Learning</option>
            <option value="System Design" className="dark:bg-gray-900">System Design</option>
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
            <div key={m._id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-lg transition-all duration-200">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 border-b border-gray-250/20 dark:border-gray-800/25 pb-3">
                  <img
                    src={m.profileImage || 'https://via.placeholder.com/150'}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover border border-indigo-500/10"
                  />
                  <div>
                    <h3 className="font-bold text-sm">{m.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500">
                      <span>★</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{m.mentorProfile.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-gray-400">({m.mentorProfile.reviewsCount})</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed min-h-[40px] line-clamp-3">{m.mentorProfile.bio}</p>

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.mentorProfile.expertise.map((exp, idx) => (
                    <span key={idx} className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setBookingMentor(m)}
                className="glass-button-primary w-full text-center"
              >
                Schedule Session
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL POPUP */}
      {bookingMentor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-bold text-base border-b border-gray-200/50 dark:border-gray-850/50 pb-3 mb-4">
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
                    {bookingMentor.mentorProfile.availableSlots.map((s, idx) => (
                      <option key={idx} value={`${s.day} ${s.time}`} className="dark:bg-gray-900">
                        {s.day}: {s.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Mentorship Notes</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Share details about what you want to learn..."
                  className="w-full h-24 glass-input resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setBookingMentor(null)}
                  className="flex-1 glass-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 glass-button-primary"
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
