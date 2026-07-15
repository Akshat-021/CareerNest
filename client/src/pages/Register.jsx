import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

const Register = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      role: 'student'
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await registerAuth(data.name, data.email, data.password, data.role);
      if (res.success) {
        const devOtpParam = res.devOtp ? `&devOtp=${res.devOtp}` : '';
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}${devOtpParam}`);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Registration failed. Try again.');
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
          <p className="text-xs text-gray-400">Create your account to unlock AI career mentorship paths</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Alex Rivera"
                className="w-full pl-11 glass-input"
                {...register('name', { required: 'Name is required' })}
              />
            </div>
            {errors.name && <span className="text-[10px] text-rose-500 font-semibold">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="alex@example.com"
                className="w-full pl-11 glass-input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
              />
            </div>
            {errors.email && <span className="text-[10px] text-rose-500 font-semibold">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                placeholder="Min 6 characters"
                className="w-full pl-11 glass-input"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' }
                })}
              />
            </div>
            {errors.password && <span className="text-[10px] text-rose-500 font-semibold">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Select Role</label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/20">
                <span className="text-sm font-medium">Student</span>
                <input
                  type="radio"
                  value="student"
                  className="accent-indigo-500"
                  {...register('role')}
                />
              </label>
              <label className="flex-1 flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/20">
                <span className="text-sm font-medium">Mentor</span>
                <input
                  type="radio"
                  value="mentor"
                  className="accent-indigo-500"
                  {...register('role')}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
