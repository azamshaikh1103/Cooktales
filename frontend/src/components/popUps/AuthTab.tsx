'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FaArrowLeft,
  FaEnvelope,
  FaEnvelopeOpen,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaTimes,
} from 'react-icons/fa';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { ApiClientError, authClient, persistAuthResponse } from '@/lib/api/authClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { setTab } from '@/lib/Slices/tabSlice';
import type { RootState } from '@/lib/store';
import { toast } from 'sonner';

const panelMotion: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.32, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(8px)',
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const contentMotion: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    filter: 'blur(8px)',
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

type AuthMode = 'menu' | 'email' | 'forgot' | 'verify' | 'success';

export default function AuthTab() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentTab = useSelector((state: RootState) => state.tab.currentTab);
  const { setAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('menu');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentTab === 'signup') setIsLogin(false);
    if (currentTab === 'login') setIsLogin(true);
  }, [currentTab]);

  useEffect(() => {
    setTurnstileToken('');
    setError('');
    setNeedsVerification(false);
  }, [mode, isLogin]);

  const resetForm = () => {
    setMode('menu');
    setError('');
    setNeedsVerification(false);
    setTurnstileToken('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setVerificationCode('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleClose = () => {
    dispatch(setTab('none'));
    setTimeout(resetForm, 240);
  };

  const switchMode = (target: 'login' | 'signup') => {
    setIsLogin(target === 'login');
    setMode('menu');
    setError('');
    setNeedsVerification(false);
    dispatch(setTab(target));
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { url } = await authClient.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in is not configured yet.');
      setIsLoading(false);
    }
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('');
  }, []);

  const requireTurnstile = () => {
    if (!turnstileToken) {
      throw new Error('Please complete the security check.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) throw new Error('Please fill in all fields.');
      requireTurnstile();

      if (isLogin) {
        const result = await authClient.login({
          email: formData.email,
          password: formData.password,
          turnstileToken,
        });
        persistAuthResponse(result);
        setAuthenticated({ user: result.user, accessToken: result.accessToken });
        toast.success('Welcome back!');
        handleClose();
        if (!result.user?.surveyCompleted) {
          router.push('/onboarding');
        }
        return;
      }

      if (!formData.name.trim()) throw new Error('Please enter your name.');
      if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match.');

      const result = await authClient.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        turnstileToken,
      });

      setMode('verify');
      toast.success(result.message || 'Account created. Please verify your email.');
    } catch (err) {
      if (err instanceof ApiClientError && err.message === 'Email verification required') {
        setNeedsVerification(true);
        setError('Please verify your email before signing in.');
        return;
      }

      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!formData.email) throw new Error('Please enter your email.');
      requireTurnstile();

      const result = await authClient.resendVerification({
        email: formData.email,
        turnstileToken,
      });

      toast.success(result.message || 'Verification link sent.');
      setMode('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authClient.verifyEmail({
        email: formData.email,
        code: verificationCode,
      });
      toast.success('Email verified. You can sign in now.');
      setIsLogin(true);
      setMode('email');
      setNeedsVerification(false);
      dispatch(setTab('login'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.email) throw new Error('Please enter your email.');
      requireTurnstile();

      await authClient.forgotPassword({
        email: formData.email,
        turnstileToken,
      });
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentTab === 'none') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,108,94,0.10),rgba(250,250,250,0.78)_42%,rgba(250,250,250,0.92)_100%)] backdrop-blur-xl transition-colors duration-300 dark:bg-[radial-gradient(circle_at_50%_35%,rgba(74,222,128,0.16),rgba(13,31,28,0.82)_44%,rgba(3,10,9,0.92)_100%)]"
        />

        <motion.div
          variants={panelMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-[410px] overflow-hidden rounded-[2rem] border border-white bg-white dark:border-white/10 dark:bg-[#10201d]"
        >
          <button
            aria-label="Close"
            onClick={handleClose}
            className="absolute top-5 right-5 z-20 cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 focus:ring-2 focus:ring-[#006C5E]/25 focus:outline-none dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FaTimes />
          </button>

          <div className="p-8 md:p-10">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-black text-gray-950 dark:text-white">
                {isLogin ? 'Welcome back.' : 'Join CookTale.'}
              </h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isLogin
                  ? 'The kitchen has been waiting for you.'
                  : 'Start your culinary journey today.'}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-red-200/70 bg-red-50/80 p-3 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                >
                  <FaExclamationCircle /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === 'menu' && (
                <motion.div
                  key={`menu-${isLogin ? 'login' : 'signup'}`}
                  variants={contentMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white/58 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-white/85 focus:ring-2 focus:ring-[#006C5E]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
                  >
                    <FaGoogle className="text-lg text-gray-500 dark:text-gray-300" /> Continue with
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('email')}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white/58 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-white/85 focus:ring-2 focus:ring-[#006C5E]/20 focus:outline-none dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
                  >
                    <FaEnvelope className="text-lg text-gray-500 dark:text-gray-300" /> Continue
                    with Email
                  </button>
                  <div className="pt-6 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {isLogin ? 'No account yet? ' : 'Already have an account? '}
                      <button
                        type="button"
                        onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                        className="cursor-pointer font-bold text-gray-950 underline-offset-4 hover:underline dark:text-white"
                      >
                        {isLogin ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {mode === 'email' && (
                <motion.div
                  key={`email-${isLogin ? 'login' : 'signup'}`}
                  variants={contentMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <InputGroup
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(value) => setFormData({ ...formData, name: value })}
                      />
                    )}
                    <InputGroup
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(value) => setFormData({ ...formData, email: value })}
                    />
                    <InputGroup
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(value) => setFormData({ ...formData, password: value })}
                      canToggle
                      isVisible={showPassword}
                      onToggle={() => setShowPassword((current) => !current)}
                    />
                    {!isLogin && (
                      <InputGroup
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                        canToggle
                        isVisible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((current) => !current)}
                      />
                    )}

                    <TurnstileWidget
                      onVerify={handleTurnstileVerify}
                      onExpire={handleTurnstileExpire}
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-2 w-full cursor-pointer rounded-2xl bg-[#006C5E] py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-[#005a4e] focus:ring-4 focus:ring-[#006C5E]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
                    >
                      {isLoading ? 'Cooking...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                  </form>

                  {isLogin && needsVerification && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isLoading}
                      className="mt-3 w-full cursor-pointer rounded-2xl border border-[#006C5E]/20 bg-[#006C5E]/8 py-3 text-xs font-bold text-[#006C5E] transition-colors hover:bg-[#006C5E]/12 focus:ring-4 focus:ring-[#006C5E]/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#4ADE80]/20 dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]"
                    >
                      Resend verification email
                    </button>
                  )}

                  {isLogin && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="cursor-pointer text-xs font-bold text-gray-500 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <BackButton onClick={() => setMode('menu')} label="All Options" />
                </motion.div>
              )}

              {mode === 'forgot' && (
                <motion.div
                  key="forgot"
                  variants={contentMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h3 className="mb-2 text-center text-lg font-bold text-gray-950 dark:text-white">
                    Reset Password
                  </h3>
                  <p className="mb-6 text-center text-xs text-gray-600 dark:text-gray-400">
                    Enter your email to receive a reset link.
                  </p>
                  <form onSubmit={handleForgotPass} className="space-y-4">
                    <InputGroup
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(value) => setFormData({ ...formData, email: value })}
                    />
                    <TurnstileWidget
                      onVerify={handleTurnstileVerify}
                      onExpire={handleTurnstileExpire}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full cursor-pointer rounded-2xl bg-[#006C5E] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] focus:ring-4 focus:ring-[#006C5E]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
                    >
                      {isLoading ? 'Sending...' : 'Send Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('email')}
                      className="w-full cursor-pointer text-xs font-bold text-gray-500 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
                    >
                      Back
                    </button>
                  </form>
                </motion.div>
              )}

              {mode === 'verify' && (
                <motion.div
                  key="verify"
                  variants={contentMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h3 className="mb-2 text-center text-lg font-bold text-gray-950 dark:text-white">
                    Enter verification code
                  </h3>
                  <p className="mb-6 text-center text-xs text-gray-600 dark:text-gray-400">
                    We sent a code to <strong>{formData.email}</strong>.
                  </p>
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <InputGroup
                      type="text"
                      placeholder="6-digit code"
                      value={verificationCode}
                      onChange={(value) =>
                        setVerificationCode(value.replace(/\D/g, '').slice(0, 6))
                      }
                    />
                    <button
                      type="submit"
                      disabled={isLoading || verificationCode.length !== 6}
                      className="w-full cursor-pointer rounded-2xl bg-[#006C5E] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] focus:ring-4 focus:ring-[#006C5E]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isLoading}
                      className="w-full cursor-pointer text-xs font-bold text-gray-500 transition-colors hover:text-[#006C5E] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-[#4ADE80]"
                    >
                      Resend code
                    </button>
                  </form>
                </motion.div>
              )}

              {mode === 'success' && (
                <motion.div
                  key="success"
                  variants={contentMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100/80 text-3xl text-green-700 dark:bg-green-500/15 dark:text-green-300">
                    <FaEnvelopeOpen />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">
                    Check your inbox
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We sent a link to <strong>{formData.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-8 cursor-pointer text-sm font-bold text-[#006C5E] underline-offset-4 hover:underline dark:text-[#4ADE80]"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center">
              <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-500">
                By continuing, you agree to our{' '}
                <span className="cursor-pointer underline hover:text-gray-900 dark:hover:text-white">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="cursor-pointer underline hover:text-gray-900 dark:hover:text-white">
                  Privacy Policy
                </span>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex cursor-pointer items-center justify-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <FaArrowLeft /> {label}
      </button>
    </div>
  );
}

type InputGroupProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  canToggle?: boolean;
  isVisible?: boolean;
  onToggle?: () => void;
};

function InputGroup({
  type,
  placeholder,
  value,
  onChange,
  canToggle,
  isVisible,
  onToggle,
}: InputGroupProps) {
  return (
    <div className="relative">
      <input
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200/80 bg-white/52 px-5 py-3.5 pr-12 text-sm font-medium text-gray-950 transition-colors outline-none placeholder:text-gray-500 focus:border-[#006C5E]/80 focus:bg-white/76 focus:ring-4 focus:ring-[#006C5E]/10 dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80]/80 dark:focus:bg-white/8 dark:focus:ring-[#4ADE80]/10"
      />
      {canToggle && (
        <button
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          onClick={onToggle}
          className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-gray-900 focus:outline-none dark:hover:text-white"
        >
          {isVisible ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
}
