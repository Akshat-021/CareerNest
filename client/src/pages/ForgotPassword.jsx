import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
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
      const res = await forgotPassword(data.email);
      if (res.success) {
        navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-indigo-500 mb-6">
          <FiArrowLeft /> Back to Sign In
        </Link>

        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent inline-block mb-2">
            Reset Password
          </span>
          <p className="text-xs text-gray-400">Enter your email and we will send you an OTP code to verify and reset password</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
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

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send OTP Code'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
