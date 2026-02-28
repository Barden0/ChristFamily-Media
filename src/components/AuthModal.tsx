import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Loader2, Key } from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'change';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [resetCode, setResetCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setOldPassword('');
    setResetCode('');
    setError(null);
    setMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const res = await authService.signIn(username, password);
        if (res.success) {
          const profile = await authService.getProfile();
          if (profile) {
            onSuccess(profile);
            handleClose();
          } else {
            setError('Failed to fetch profile after login');
          }
        } else {
          setError(res.message || 'Invalid credentials');
        }
      } else if (mode === 'register') {
        const res = await authService.signUp(username, email, password);
        if (res.success) {
          setMessage('Registration successful! You can now log in.');
          setMode('login');
        } else {
          setError(res.message || 'Registration failed');
        }
      } else if (mode === 'forgot') {
        const res = await authService.forgotPassword(email);
        if (res.success) {
          setMessage('Password reset code sent to your email.');
          setMode('reset');
        } else {
          setError(res.message || 'Failed to send reset code');
        }
      } else if (mode === 'reset') {
        const res = await authService.resetPassword(email, resetCode, password);
        if (res.success) {
          setMessage('Password reset successful! You can now log in.');
          setMode('login');
        } else {
          setError(res.message || 'Reset failed');
        }
      } else if (mode === 'change') {
        const res = await authService.changePassword(oldPassword, password);
        if (res.success) {
          setMessage('Password changed successfully!');
          setTimeout(handleClose, 2000);
        } else {
          setError(res.message || 'Change failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl dark:bg-stone-900"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-400 hover:text-stone-600 dark:bg-stone-800 dark:text-stone-500"
          >
            <X size={20} />
          </button>

          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'New Password'}
              {mode === 'change' && 'Change Password'}
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              {mode === 'login' && 'Sign in to sync your journey'}
              {mode === 'register' && 'Join the CFI family'}
              {mode === 'forgot' && 'Enter your email to receive a code'}
              {mode === 'reset' && 'Enter the code and your new password'}
              {mode === 'change' && 'Update your account security'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode === 'login' || mode === 'register') && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-stone-800 dark:text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-stone-800 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {mode === 'reset' && (
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  placeholder="Reset Code"
                  required
                  className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-stone-800 dark:text-white"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                />
              </div>
            )}

            {mode === 'change' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  placeholder="Current Password"
                  required
                  className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-stone-800 dark:text-white"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset' || mode === 'change') && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  placeholder={mode === 'reset' || mode === 'change' ? 'New Password' : 'Password'}
                  required
                  className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-stone-800 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white shadow-lg shadow-brand/20 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Code'}
                  {mode === 'reset' && 'Reset Password'}
                  {mode === 'change' && 'Update Password'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-stone-500">
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="font-bold text-brand hover:underline">
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-stone-500">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-bold text-brand hover:underline">
                  Sign In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
