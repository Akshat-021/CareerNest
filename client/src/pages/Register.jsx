import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiUser, FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff,
  FiArrowRight, FiCheckCircle, FiSun, FiMoon, FiAward, FiBookOpen
} from 'react-icons/fi';

const Register = () => {
  const { register: registerAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      role: 'student'
    }
  });

  const passwordValue = watch('password', '');

  // Calculate password strength indicator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await registerAuth(data.name, data.email, data.password, data.role || selectedRole);
      if (res.success) {
        const devOtpParam = res.devOtp ? `&devOtp=${res.devOtp}` : '';
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}${devOtpParam}`);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] overflow-hidden bg-tech-grid transition-colors duration-300">
      {/* Ambient background glow orbs */}
      <div className="mesh-glow-indigo -top-24 -right-24 opacity-70"></div>
      <div className="mesh-glow-violet -bottom-24 -left-24 opacity-60"></div>

      {/* Top Controls: Logo & Theme Toggle */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            🎓
          </span>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
            CAREERNEST
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2.5 rounded-xl glass-panel text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shadow-sm"
        >
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg mx-auto mt-16 sm:mt-12 z-10">
        <div className="glass-card-elevated rounded-3xl p-7 sm:p-9 shadow-2xl relative">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
              Get Started Free
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Join 24,000+ students and mentors on the AI Career Operating System
            </p>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="leading-snug">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Role Selection Cards */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                I am joining as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setSelectedRole('student')}
                  className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === 'student'
                      ? 'bg-indigo-500/10 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FiBookOpen size={18} className={selectedRole === 'student' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                    <input
                      type="radio"
                      value="student"
                      className="accent-indigo-600"
                      {...register('role')}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Student</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Learn, get mentored & get hired</span>
                </label>

                <label
                  onClick={() => setSelectedRole('mentor')}
                  className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === 'mentor'
                      ? 'bg-purple-500/10 border-purple-500 shadow-sm ring-1 ring-purple-500/50'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FiAward size={18} className={selectedRole === 'mentor' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                    <input
                      type="radio"
                      value="mentor"
                      className="accent-purple-600"
                      {...register('role')}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Mentor</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Host 1-on-1 calls & lead courses</span>
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-4 glass-input focus-ring text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-2.5"
                  {...register('name', { required: 'Full name is required' })}
                />
              </div>
              {errors.name && <span className="text-[11px] text-rose-500 font-medium">{errors.name.message}</span>}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 glass-input focus-ring text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-2.5"
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address' }
                  })}
                />
              </div>
              {errors.email && <span className="text-[11px] text-rose-500 font-medium">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 glass-input focus-ring text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-2.5"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwordValue && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Password strength: <b className="font-semibold">{strength.label}</b></span>
                    <span>Min 6 chars</span>
                  </div>
                </div>
              )}
              {errors.password && <span className="text-[11px] text-rose-500 font-medium">{errors.password.message}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary w-full mt-2 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Sign In Footer */}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
