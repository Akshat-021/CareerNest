import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
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
      const errMsg = error.response?.data?.message || 'Login failed. Please try again.';
      
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent inline-block mb-2">
            🎓 CareerNest
          </Link>
          <p className="text-xs text-gray-400">Sign in to resume your learning and mentorship sessions</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-11 glass-input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
              />
            </div>
            {errors.email && <span className="text-[10px] text-rose-500 font-semibold">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 glass-input"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' }
                })}
              />
            </div>
            {errors.password && <span className="text-[10px] text-rose-500 font-semibold">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-500 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
