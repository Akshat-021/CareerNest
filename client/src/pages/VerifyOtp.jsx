import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiAlertCircle } from 'react-icons/fi';

const VerifyOtp = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

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
      setServerError(error.response?.data?.message || 'Invalid verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setServerError('');
    setServerSuccess('');
    try {
      const res = await resendOtp(email);
      if (res.success) {
        setServerSuccess('A new verification code was sent to your email.');
      }
    } catch (error) {
      setServerError('Failed to resend code. Try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6]">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent inline-block mb-2">
            Verify Email
          </span>
          <p className="text-xs text-gray-400">
            We sent a verification code to: <br />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>
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
            <FiCheckSquare size={16} />
            <span>{serverSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">6-Digit Verification Code</label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="w-full text-center tracking-[0.5em] text-lg font-bold glass-input"
              {...register('otp', {
                required: 'OTP is required',
                minLength: { value: 6, message: 'Must be exactly 6 digits' }
              })}
            />
            {errors.otp && <span className="text-[10px] text-rose-500 font-semibold">{errors.otp.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Verify & Sign In'
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-xs">
          <span className="text-gray-400">Didn't receive code?</span>
          <button onClick={handleResend} className="text-indigo-500 font-bold hover:underline">
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
