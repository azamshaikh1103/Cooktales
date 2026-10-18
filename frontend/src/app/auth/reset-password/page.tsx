'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaLock, FaCheckCircle, FaTimesCircle, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setTab } from '@/lib/Slices/tabSlice';
import { setProfilePopup } from '@/lib/Slices/ProfileMenuPopup';
import { authClient } from '@/lib/api/authClient';

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');
  const dispatch = useDispatch();
  const router = useRouter();

  const openLogin = () => {
    dispatch(setTab('login'));
    dispatch(setProfilePopup(false));
    router.push('/');
  };

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side basic validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!token || !email) {
      setStatus('error');
      return;
    }

    setStatus('submitting');

    try {
      await authClient.resetPassword({ token, email, password: formData.password });
      setStatus('success');
      toast.success('Password reset successfully! You can now login.');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl backdrop-blur-md dark:border-white/5 dark:bg-[#152a26]">
      {status === 'submitting' && (
        <div className="animate-fade-in-up flex flex-col items-center py-10">
          <FaSpinner className="mb-6 animate-spin text-4xl text-[#006C5E] dark:text-[#4ADE80]" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Securing Account...</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Updating your credentials safely.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="animate-fade-in-up flex flex-col items-center py-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-100 text-3xl text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <FaCheckCircle />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Reset!</h1>
          <p className="mt-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
            Your account is secure. You can now login with your new password.
          </p>
          <button
            type="button"
            onClick={openLogin}
            className="cursor-pointer rounded-xl bg-[#006C5E] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#006C5E]/20 transition-all hover:scale-105 hover:bg-[#005a4e]"
          >
            Login Now
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="animate-fade-in-up flex flex-col items-center py-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-100 text-3xl text-red-500 dark:border-red-800 dark:bg-red-900/20">
            <FaTimesCircle />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid Link</h1>
          <p className="mt-2 mb-6 max-w-[250px] text-center text-sm text-gray-500 dark:text-gray-400">
            This link is invalid or has expired. Please request a new one.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="cursor-pointer rounded-xl bg-gray-100 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Back to Home
          </button>
        </div>
      )}

      {status === 'idle' && (
        <div className="animate-fade-in relative z-10">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#006C5E]/10 text-xl text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
              <FaLock />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Password</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Choose a strong password to secure your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-medium text-gray-900 transition-all outline-none placeholder:text-gray-500 focus:border-[#006C5E] focus:ring-4 focus:ring-[#006C5E]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-white"
                  aria-label="Toggle Password Visibility"
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-medium text-gray-900 transition-all outline-none placeholder:text-gray-500 focus:border-[#006C5E] focus:ring-4 focus:ring-[#006C5E]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/10"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full cursor-pointer rounded-xl bg-[#006C5E] py-4 text-sm font-bold tracking-wide text-white uppercase shadow-xl shadow-[#006C5E]/20 transition-all hover:scale-[1.02] hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:shadow-[#4ADE80]/20 dark:hover:bg-[#3ccb74]"
            >
              Reset Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <Navbar />
      <div className="flex grow items-center justify-center p-6">
        <Suspense fallback={<div className="text-[#006C5E]">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
