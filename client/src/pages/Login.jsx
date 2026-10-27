import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff,
  FiArrowRight, FiCheckCircle, FiSun, FiMoon, FiCpu, FiShield, FiUsers
} from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        const user = res.user;
        if (user.role === 'mentor') {
          navigate('/mentor/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials or network.';
      
      // If user is not verified, redirect to OTP verify page
      if (error.response?.status === 403 && error.response?.data?.isVerified === false) {
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        setServerError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] overflow-hidden bg-tech-grid transition-colors duration-300">
      {/* Ambient background glow orbs */}
      <div className="mesh-glow-indigo -top-24 -left-24 opacity-70"></div>
      <div className="mesh-glow-violet -bottom-24 -right-24 opacity-60"></div>

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
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-12 lg:mt-0 z-10">
        
        {/* Left Column: Visual Showcase (Visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col gap-6 pr-4">
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            Level up from <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">student</span> to hired engineer.
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
            Sign in to calibrate your 7-Factor Career Readiness score, practice real-time Voice AI mock interviews, and access verified mentor networks.
          </p>

          {/* Interactive Micro Value Cards */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border-l-4 border-l-indigo-500 hover:translate-x-1 transition-transform">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <FiShield size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">7-Factor Career Readiness</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Holistic scoring of code, projects, ATS resume & interview ability</p>
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border-l-4 border-l-violet-500 hover:translate-x-1 transition-transform">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                <FiCpu size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Context-Aware AI Copilot</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant job match % and targeted 6-week roadmap generators</p>
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border-l-4 border-l-emerald-500 hover:translate-x-1 transition-transform">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <FiUsers size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Live WebRTC Mentorship</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">1-on-1 video rooms and collaborative study pods</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Modern Glass Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-card-elevated rounded-3xl p-7 sm:p-9 shadow-2xl relative">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your CareerNest dashboard
              </p>
            </div>

            {serverError && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
                <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="leading-snug">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 glass-input focus-ring text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-2.5"
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address' }
                    })}
                  />
                </div>
                {errors.email && <span className="text-[11px] text-rose-500 font-medium">{errors.email.message}</span>}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
                    <span>Sign In</span>
                    <FiArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Footer */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
