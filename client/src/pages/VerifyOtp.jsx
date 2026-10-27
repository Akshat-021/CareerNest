import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiCheckSquare, FiAlertCircle, FiSun, FiMoon, FiArrowRight,
  FiShield, FiMail, FiRefreshCw, FiKey
} from 'react-icons/fi';

const VerifyOtp = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [devOtp, setDevOtp] = useState(searchParams.get('devOtp') || '');

  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  // Handle countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Autofill if devOtp is present in URL
  useEffect(() => {
    if (devOtp) {
      setValue('otp', devOtp);
    }
  }, [devOtp, setValue]);

  const onSubmit = async (data) => {
    setServerError('');
    setServerSuccess('');
    setLoading(true);
    try {
      const res = await verifyOtp(email, data.otp);
      if (res.success) {
        if (res.user.role === 'mentor') {
          navigate('/mentor/dashboard');
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setServerError('');
    setServerSuccess('');
    setResending(true);
    try {
      const res = await resendOtp(email);
      if (res.success) {
        setServerSuccess('A fresh 6-digit code has been generated.');
        setResendCooldown(30); // 30s cooldown
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          setValue('otp', res.devOtp);
        }
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] overflow-hidden bg-tech-grid transition-colors duration-300">
      {/* Ambient background glow orbs */}
      <div className="mesh-glow-indigo -top-24 -left-24 opacity-70"></div>
      <div className="mesh-glow-emerald -bottom-24 -right-24 opacity-60"></div>

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
      <div className="w-full max-w-md mx-auto mt-16 sm:mt-12 z-10">
        <div className="glass-card-elevated rounded-3xl p-7 sm:p-9 shadow-2xl relative text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FiShield size={26} />
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            We generated a 6-digit verification code for:
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <FiMail size={13} className="text-indigo-500" />
            <span className="truncate max-w-[240px]">{email || 'your email'}</span>
          </div>

          {serverError && (
            <div className="mt-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2.5 text-left animate-fadeIn">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="leading-snug">{serverError}</span>
            </div>
          )}

          {serverSuccess && (
            <div className="mt-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2.5 text-left animate-fadeIn">
              <FiCheckSquare size={16} className="mt-0.5 shrink-0" />
              <span className="leading-snug">{serverSuccess}</span>
            </div>
          )}

          {devOtp && (
            <div className="mt-5 p-3.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs flex flex-col gap-1 text-left">
              <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FiKey size={12} /> Auto-Detected Verification Code
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Code ready to submit: <b className="text-base text-indigo-600 dark:text-indigo-300 font-mono tracking-widest">{devOtp}</b>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                6-Digit Security Code
              </label>
              <input
                type="text"
                placeholder="••••••"
                maxLength={6}
                autoFocus
                className="w-full text-center tracking-[0.6em] text-2xl font-black font-mono glass-input focus-ring text-slate-900 dark:text-white py-3 rounded-2xl"
                {...register('otp', {
                  required: '6-digit OTP code is required',
                  minLength: { value: 6, message: 'Must be exactly 6 digits' }
                })}
              />
              {errors.otp && <span className="text-[11px] text-rose-500 font-medium text-center">{errors.otp.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary w-full py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-sm mt-1"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Enter Dashboard</span>
                  <FiArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Resend actions */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
            >
              <FiRefreshCw size={13} className={resending ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
