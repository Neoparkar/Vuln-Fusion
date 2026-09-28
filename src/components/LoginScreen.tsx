import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { VulnFusionBrandIcon } from './icons/VulnFusionIcons';
import { VulnFusionRobot } from './VulnFusionRobot';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    signInWithPassword,
    signUpWithPassword,
    resetPasswordForEmail,
    signInWithMagicLink,
    isConfigured
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!isConfigured) {
      setErrorMsg('Authentication service is currently unconfigured.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signin') {
        if (!password) {
          setErrorMsg('Please enter your password.');
          setLoading(false);
          return;
        }
        await signInWithPassword(email.trim(), password);
      } else if (authMode === 'signup') {
        if (!isPasswordValid) {
          setErrorMsg('Password does not meet the security requirements.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }
        await signUpWithPassword(email.trim(), password);
        setSuccessMsg('Account created successfully! You can now sign in or check your email for confirmation.');
      } else if (authMode === 'magic') {
        await signInWithMagicLink(email.trim());
        setSuccessMsg(`Secure sign-in magic link sent to ${email}. Check your inbox.`);
      } else if (authMode === 'forgot') {
        await resetPasswordForEmail(email.trim());
        setSuccessMsg(`Password reset instructions sent to ${email}.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication operation failed. Please check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAdmin = () => {
    setEmail('adminvulnfusion@gmail.com');
    setAuthMode('signin');
  };

  const robotState = loading
    ? 'processing'
    : successMsg
    ? 'success'
    : emailFocused
    ? 'focus'
    : 'idle';

  return (
    <div className="min-h-screen bg-[#070B10] text-[#E8EEF5] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0D1624] border border-[#1E2D42] shadow-xl">
            <VulnFusionBrandIcon size={40} glow={true} showContainer={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              VulnFusion
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#5FA8D3] font-mono mt-1">
              Sign in to your VulnFusion organization
            </p>
          </div>
        </div>

        {/* Robot Guide */}
        <VulnFusionRobot state={robotState} emailInputRef={emailInputRef} />

        {/* Login Card */}
        <div className="bg-[#0A101A] border border-[#1A2638] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-4 bg-[#04070B] p-1 rounded-xl border border-[#1E2D42] text-xs font-mono">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signin' ? 'bg-[#185382] text-white font-medium shadow' : 'text-[#718197] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signup' ? 'bg-[#185382] text-white font-medium shadow' : 'text-[#718197] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('magic'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'magic' ? 'bg-[#185382] text-white font-medium shadow' : 'text-[#718197] hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Magic Link</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'forgot' ? 'bg-[#185382] text-white font-medium shadow' : 'text-[#718197] hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#718197]">
                  Work Email
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={fillTestAdmin}
                    className="text-[11px] text-[#5FA8D3] hover:underline font-mono"
                  >
                    [ Fill Admin Account ]
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F6D82]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="analyst@enterprise.com"
                  required
                  className="w-full bg-[#04070B] border border-[#1E2D42] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4E5D73] focus:outline-none focus:border-[#3B82C4] focus:ring-1 focus:ring-[#3B82C4] transition-all min-h-[44px]"
                />
              </div>
            </div>

            {(authMode === 'signin' || authMode === 'signup') && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#718197]">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-[11px] text-[#5FA8D3] hover:underline font-mono"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F6D82]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#04070B] border border-[#1E2D42] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4E5D73] focus:outline-none focus:border-[#3B82C4] focus:ring-1 focus:ring-[#3B82C4] transition-all min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#718197]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F6D82]">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[#04070B] border border-[#1E2D42] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4E5D73] focus:outline-none focus:border-[#3B82C4] focus:ring-1 focus:ring-[#3B82C4] transition-all min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="bg-[#04070B] border border-[#182436] rounded-xl p-3 space-y-1.5 text-xs font-mono">
                  <div className="text-[#8A99AF] font-semibold mb-1">Password Security Requirements:</div>
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-[#5F6D82]'}`}>
                    <span>{hasMinLength ? '✓' : '•'}</span> At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-[#5F6D82]'}`}>
                    <span>{hasUpper ? '✓' : '•'}</span> One uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-[#5F6D82]'}`}>
                    <span>{hasLower ? '✓' : '•'}</span> One lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400' : 'text-[#5F6D82]'}`}>
                    <span>{hasNumber ? '✓' : '•'}</span> One number (0-9)
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#185382] hover:bg-[#20649B] text-white font-medium rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 min-h-[44px] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === 'signin' && 'Sign In'}
                    {authMode === 'signup' && 'Create Account'}
                    {authMode === 'magic' && 'Send Magic Link'}
                    {authMode === 'forgot' && 'Send Password Reset'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {authMode === 'signin' && (
            <div className="space-y-4 pt-1">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-[#182436]"></div>
                <span className="flex-shrink mx-4 text-[#5F6D82] text-[11px] font-mono uppercase">OR</span>
                <div className="flex-grow border-t border-[#182436]"></div>
              </div>

              <button
                type="button"
                onClick={() => { setAuthMode('magic'); setErrorMsg(null); setSuccessMsg(null); }}
                className="w-full bg-[#0D1624] hover:bg-[#132033] border border-[#1E2D42] text-slate-200 font-medium rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#5FA8D3]" />
                <span>Send Magic Link</span>
              </button>

              <div className="text-center text-xs text-[#718197]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[#5FA8D3] hover:underline font-medium ml-1"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <div className="text-center pt-2 text-xs text-[#718197]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-[#5FA8D3] hover:underline font-medium ml-1"
              >
                Sign in
              </button>
            </div>
          )}

          {authMode === 'magic' && (
            <div className="text-center pt-2 text-xs text-[#718197]">
              Prefer password sign in?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-[#5FA8D3] hover:underline font-medium ml-1"
              >
                Sign in with password
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className="text-center pt-2 text-xs text-[#718197]">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-[#5FA8D3] hover:underline font-medium ml-1"
              >
                Back to sign in
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <span className="text-[11px] text-[#5F6D82] font-mono flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Enterprise RBAC & PostgreSQL RLS Enforced
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
