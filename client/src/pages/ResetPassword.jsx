import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { FiLock, FiAlertCircle } from 'react-icons/fi';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('newPassword', '');

  const onSubmit = async (data) => {
    setServerError('');
    setServerSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      if (res.data.success) {
        setServerSuccess('Password updated successfully. Redirecting to Login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent inline-block mb-2">
            Choose New Password
          </span>
          <p className="text-xs text-gray-400">
            Verify the code sent to your email to configure new password credentials.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {serverSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle className="text-emerald-500" size={16} />
            <span>{serverSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">6-Digit OTP Code</label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="w-full text-center tracking-[0.5em] text-lg font-bold glass-input"
              {...register('otp', { required: 'OTP is required' })}
            />
            {errors.otp && <span className="text-[10px] text-rose-500 font-semibold">{errors.otp.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="w-full pl-11 glass-input"
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' }
                })}
              />
            </div>
            {errors.newPassword && <span className="text-[10px] text-rose-500 font-semibold">{errors.newPassword.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full pl-11 glass-input"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (val) => val === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && <span className="text-[10px] text-rose-500 font-semibold">{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
