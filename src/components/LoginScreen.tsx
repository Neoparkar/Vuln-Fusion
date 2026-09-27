import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { VulnFusionBrandIcon } from './icons/VulnFusionIcons';
import { VulnFusionRobot } from './VulnFusionRobot';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithMagicLink, signInWithGoogle, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    if (!isConfigured) {
      setErrorMsg('Authentication service is currently unavailable.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await signInWithMagicLink(email.trim());
      setEmailSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send secure sign-in link. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setErrorMsg('Google sign-in is not configured for this environment. Please use email sign-in.');
      return;
    }

    try {
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in is not configured for this environment. Please use email sign-in.');
    }
  };

  const robotState = loading
    ? 'processing'
    : emailSent
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
              Asset Identity & Vulnerability Intelligence
            </p>
          </div>
        </div>

        {/* Previous Working Robot Guide with Mouse & Email Tracking */}
        <VulnFusionRobot state={robotState} emailInputRef={emailInputRef} />

        {/* Login Card */}
        <div className="bg-[#0A101A] border border-[#1A2638] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!emailSent ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">Sign in to your workspace</h2>
                <p className="text-xs text-[#8A99AF]">Enter your work email to receive a secure sign-in link.</p>
              </div>

              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#718197]">
                    Work Email
                  </label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#185382] hover:bg-[#20649B] text-white font-medium rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending secure link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send secure sign-in link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#182436]"></div>
                <span className="flex-shrink mx-4 text-[#5F6D82] text-[11px] font-mono uppercase">OR</span>
                <div className="flex-grow border-t border-[#182436]"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-[#0D1624] hover:bg-[#132033] border border-[#1E2D42] text-slate-200 font-medium rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-3 transition-all min-h-[44px] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">Check your email</h2>
                <p className="text-xs text-[#8A99AF] leading-relaxed">
                  We sent a secure sign-in link to <span className="text-white font-medium">{email}</span>. Open the link to continue to VulnFusion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-xs text-[#5FA8D3] hover:underline font-mono"
              >
                [ Back to sign in ]
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
