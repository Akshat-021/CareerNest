import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiBookOpen, FiClock, FiStar } from 'react-icons/fi';
import api from '../services/api';

const CoursesSearch = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/courses/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to get categories list:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/courses?search=${search}&difficulty=${difficulty}&category=${category}`);
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error('Failed to get courses catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [search, difficulty, category]);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Courses Catalog</h1>
        <p className="text-xs text-gray-400">Discover hand-crafted developer programs prepared by verified expert mentors.</p>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2 relative">
          <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by course title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 glass-input"
          />
        </div>
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full glass-input bg-transparent"
          >
            <option value="" className="dark:bg-gray-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="dark:bg-gray-900">{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full glass-input bg-transparent"
          >
            <option value="" className="dark:bg-gray-900">All Difficulties</option>
            <option value="Easy" className="dark:bg-gray-900">Easy</option>
            <option value="Medium" className="dark:bg-gray-900">Medium</option>
            <option value="Hard" className="dark:bg-gray-900">Hard</option>
          </select>
        </div>
      </div>

      {/* CATALOG GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-12">No courses found matching the filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/courses/${c._id}`}
              className="glass-panel rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <img
                  src={c.thumbnail || 'https://via.placeholder.com/400x200'}
                  alt={c.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-5 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{c.category}</span>
                  <h3 className="font-bold text-sm leading-snug">{c.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-250/20 dark:border-gray-800/25 flex items-center justify-between text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1"><FiClock /> {c.duration}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  c.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' : c.difficulty === 'Medium' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'
                }`}>{c.difficulty}</span>
                <span className="flex items-center gap-1 text-amber-500"><FiStar /> {c.rating.toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesSearch;
