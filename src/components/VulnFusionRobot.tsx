import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface VulnFusionRobotProps {
  state: 'idle' | 'focus' | 'processing' | 'success';
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const VulnFusionRobot: React.FC<VulnFusionRobotProps> = ({ state, emailInputRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [eyeGaze, setEyeGaze] = useState({ x: 0, y: 0 });
  const [headGaze, setHeadGaze] = useState({ x: 0, y: 0 });
  const [pupilGaze, setPupilGaze] = useState({ x: 0, y: 0 });

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Mouse & Email Gaze Tracking (Eyes primary 70%, Head secondary 20%)
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number | null = null;
    let curEyeX = 0, curEyeY = 0;
    let curHeadX = 0, curHeadY = 0;
    let curPupilX = 0, curPupilY = 0;
    let targetEyeX = 0, targetEyeY = 0;
    let targetHeadX = 0, targetHeadY = 0;
    let targetPupilX = 0, targetPupilY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (state === 'focus' || state === 'processing' || state === 'success') return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = (e.clientX - centerX) / (window.innerWidth / 2);
      let dy = (e.clientY - centerY) / (window.innerHeight / 2);

      const deadzone = 0.06;
      if (Math.abs(dx) < deadzone) dx = 0;
      else dx = Math.sign(dx) * (Math.abs(dx) - deadzone) / (1 - deadzone);

      if (Math.abs(dy) < deadzone) dy = 0;
      else dy = Math.sign(dy) * (Math.abs(dy) - deadzone) / (1 - deadzone);

      const easedDx = Math.sign(dx) * Math.pow(Math.abs(dx), 1.2);
      const easedDy = Math.sign(dy) * Math.pow(Math.abs(dy), 1.2);

      targetEyeX = easedDx * 8;
      targetEyeY = easedDy * 6;
      targetHeadX = easedDx * 2.5;
      targetHeadY = easedDy * 1.8;
      targetPupilX = easedDx * 3.5;
      targetPupilY = easedDy * 2.5;
    };

    const updateGaze = () => {
      if (state === 'focus' && emailInputRef?.current && containerRef.current) {
        const robotRect = containerRef.current.getBoundingClientRect();
        const emailRect = emailInputRef.current.getBoundingClientRect();
        const robotCenterX = robotRect.left + robotRect.width / 2;
        const robotCenterY = robotRect.top + robotRect.height / 2;
        const emailCenterX = emailRect.left + emailRect.width / 2;
        const emailCenterY = emailRect.top + emailRect.height / 2;

        const edx = (emailCenterX - robotCenterX) / 200;
        const edy = (emailCenterY - robotCenterY) / 200;

        targetEyeX = Math.max(-9, Math.min(9, edx * 9));
        targetEyeY = Math.max(-6, Math.min(6, edy * 6));
        targetHeadX = Math.max(-3, Math.min(3, edx * 3));
        targetHeadY = Math.max(-2, Math.min(2, edy * 2));
        targetPupilX = Math.max(-4, Math.min(4, edx * 4));
        targetPupilY = Math.max(-3, Math.min(3, edy * 3));
      }

      curEyeX += (targetEyeX - curEyeX) * 0.12;
      curEyeY += (targetEyeY - curEyeY) * 0.12;
      curHeadX += (targetHeadX - curHeadX) * 0.1;
      curHeadY += (targetHeadY - curHeadY) * 0.1;
      curPupilX += (targetPupilX - curPupilX) * 0.15;
      curPupilY += (targetPupilY - curPupilY) * 0.15;

      setEyeGaze({ x: curEyeX, y: curEyeY });
      setHeadGaze({ x: curHeadX, y: curHeadY });
      setPupilGaze({ x: curPupilX, y: curPupilY });

      rafId = requestAnimationFrame(updateGaze);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateGaze);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [state, emailInputRef, reducedMotion]);

  const getMessage = () => {
    switch (state) {
      case 'focus':
        return "Perfect. You're ready to sign in.";
      case 'processing':
        return "Establishing secure session...";
      case 'success':
        return "Secure link sent successfully.";
      case 'idle':
      default:
        return "Hi there! Enter your work email to get a secure sign-in link.";
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center pt-2 pb-4 select-none">
      
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-3 px-3.5 py-2 rounded-xl bg-[#0D1826]/90 border border-[#1E3A5F]/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,184,255,0.15)] max-w-[280px] text-center relative z-20"
      >
        <p className="text-[11px] font-medium text-slate-200 tracking-wide">
          {getMessage()}
        </p>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0D1826] border-r border-b border-[#1E3A5F]/60 transform rotate-45" />
      </motion.div>

      {/* Robot Container with Idle Float */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                y: [0, -8, 0],
                rotateZ: state === 'focus' ? [0, 1.5, 0] : [0, 0, 0],
              }
        }
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center filter drop-shadow-[0_12px_30px_rgba(0,184,255,0.3)]"
      >
        {/* Ambient Glow */}
        <div className="absolute w-36 h-36 bg-[#00B8FF]/15 rounded-full blur-3xl pointer-events-none" />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="pearlShell" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#D9E6F2" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="darkGraphite" x1="60" y1="80" x2="140" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="visorGlow" x1="70" y1="70" x2="130" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#090D16" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* HEAD LAYER (Subtle secondary movement) */}
          <g id="head-layer" style={{ transform: `translate(${headGaze.x}px, ${headGaze.y}px)`, transition: 'transform 0.1s ease-out' }}>

            {/* Antenna */}
            <path d="M100 50 L100 30" stroke="url(#darkGraphite)" strokeWidth="3.5" strokeLinecap="round" />
            <motion.circle
              cx="100"
              cy="27"
              r="4"
              fill="#00E5FF"
              filter="url(#glow)"
              opacity="0.75"
              animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />

            {/* Head */}
            <rect x="62" y="48" width="76" height="58" rx="22" fill="url(#pearlShell)" stroke="#64748B" strokeWidth="1.5" />
            
            {/* Ear pods */}
            <rect x="53" y="68" width="11" height="20" rx="4" fill="url(#darkGraphite)" />
            <rect x="136" y="68" width="11" height="20" rx="4" fill="url(#darkGraphite)" />

            {/* Face Visor */}
            <rect x="70" y="62" width="60" height="30" rx="12" fill="url(#visorGlow)" stroke="#1E293B" strokeWidth="1.5" />

            {/* EYES LAYER */}
            <g id="eyes-layer" style={{ transform: `translate(${eyeGaze.x}px, ${eyeGaze.y}px)`, transition: 'transform 0.08s ease-out' }}>
              {/* Left Eye */}
              <motion.ellipse
                cx="88"
                cy="77"
                rx="6"
                ry="7"
                fill="#00E5FF"
                filter="url(#glow)"
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: state === 'focus' ? [0.9, 1, 0.9] : [0.6, 0.9, 0.6],
                        scale: state === 'focus' ? [1, 1.15, 1] : [1, 1, 1],
                      }
                }
                transition={{ duration: state === 'focus' ? 1.5 : 3, repeat: Infinity }}
              />
              <circle cx={88 + pupilGaze.x} cy={77 + pupilGaze.y} r="2" fill="#FFFFFF" opacity="0.9" />

              {/* Right Eye */}
              <motion.ellipse
                cx="112"
                cy="77"
                rx="6"
                ry="7"
                fill="#00E5FF"
                filter="url(#glow)"
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: state === 'focus' ? [0.9, 1, 0.9] : [0.6, 0.9, 0.6],
                        scale: state === 'focus' ? [1, 1.15, 1] : [1, 1, 1],
                      }
                }
                transition={{ duration: state === 'focus' ? 1.5 : 3, repeat: Infinity }}
              />
              <circle cx={112 + pupilGaze.x} cy={77 + pupilGaze.y} r="2" fill="#FFFFFF" opacity="0.9" />
            </g>

            <path d="M92 90 Q100 94 108 90" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

            {/* Neck */}
            <rect x="90" y="104" width="20" height="14" rx="4" fill="url(#darkGraphite)" />

          </g>

          {/* NECK REFINEMENT */}
          <g id="neck-connector" transform="translate(93, 106)">
            <rect x="0" y="0" width="14" height="8" rx="3" fill="url(#darkGraphite)" stroke="#64748B" strokeWidth="0.8" />
            <line x1="3" y1="4" x2="11" y2="4" stroke="#475569" strokeWidth="1" opacity="0.8" />
          </g>

          {/* Torso */}
          <path
            d="M66 118 C66 114 70 110 76 110 L124 110 C130 110 134 114 134 118 L142 168 C142 174 137 178 131 178 L69 178 C63 178 58 174 58 168 Z"
            fill="url(#pearlShell)"
            stroke="#64748B"
            strokeWidth="1.5"
          />

          {/* Chest Shield & V Emblem */}
          <g transform="translate(86, 126)">
            <path
              d="M14 2 L26 7 C26 15 22 21 14 26 C6 21 2 15 2 7 Z"
              fill="#0F172A"
              stroke="#00E5FF"
              strokeWidth="1.5"
            />
            <path
              d="M8 9 L11 17 L14 11 L17 17 L20 9"
              stroke="#00E5FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ========================================================== */}
          {/* ARTICULATED ROBOTIC ARMS WITH SUBTLE OUTWARD ELBOW STANCE */}
          {/* ========================================================== */}
          
          {/* LEFT ARTICULATED ARM (Outward elbow bend ~12 degrees) */}
          <g id="left-arm">
            {/* Shoulder Joint */}
            <circle cx="62" cy="122" r="5.5" fill="url(#darkGraphite)" stroke="#64748B" strokeWidth="1" />
            <circle cx="62" cy="122" r="2.5" fill="#334155" />
            {/* Upper Arm angling outward to elbow at (52, 145) */}
            <path d="M62 122 Q54 135 52 145" stroke="url(#pearlShell)" strokeWidth="8" strokeLinecap="round" />
            <path d="M62 122 Q54 135 52 145" stroke="#475569" strokeWidth="8" strokeLinecap="round" opacity="0.2" />
            {/* Elbow Joint */}
            <circle cx="52" cy="145" r="3.5" fill="url(#darkGraphite)" stroke="#64748B" strokeWidth="0.8" />
            {/* Forearm angling back inward to wrist at (51, 169) */}
            <path d="M52 145 Q50 158 51 169" stroke="url(#pearlShell)" strokeWidth="6.5" strokeLinecap="round" />
            
            {/* WRIST & HAND GROUP (Synchronized Mirrored Rotation - Unified Assembly) */}
            <motion.g
              id="left-hand-group"
              animate={
                reducedMotion
                  ? {}
                  : {
                      rotate: [-3, 3, -3],
                    }
              }
              transition={{
                duration: 5.0,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '51px 169px' }}
            >
              {/* Wrist Joint */}
              <circle cx="51" cy="169" r="2.5" fill="url(#darkGraphite)" />
              {/* Robotic Palm & Fingers (Unified Unit) */}
              <rect x="44" y="171" width="12" height="9" rx="3.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="1" />
              <rect x="43" y="180" width="3.2" height="10" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="43.5" y1="185" x2="45.7" y2="185" stroke="#334155" strokeWidth="0.8" />
              <rect x="47.5" y="180" width="3.2" height="11" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="48" y1="185.5" x2="50.2" y2="185.5" stroke="#334155" strokeWidth="0.8" />
              <rect x="52" y="180" width="3.2" height="10" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="52.5" y1="185" x2="54.7" y2="185" stroke="#334155" strokeWidth="0.8" />
            </motion.g>
          </g>

          {/* RIGHT ARTICULATED ARM (Outward elbow bend ~12 degrees) */}
          <g id="right-arm">
            {/* Shoulder Joint */}
            <circle cx="138" cy="122" r="5.5" fill="url(#darkGraphite)" stroke="#64748B" strokeWidth="1" />
            <circle cx="138" cy="122" r="2.5" fill="#334155" />
            {/* Upper Arm angling outward to elbow at (148, 145) */}
            <path d="M138 122 Q146 135 148 145" stroke="url(#pearlShell)" strokeWidth="8" strokeLinecap="round" />
            <path d="M138 122 Q146 135 148 145" stroke="#475569" strokeWidth="8" strokeLinecap="round" opacity="0.2" />
            {/* Elbow Joint */}
            <circle cx="148" cy="145" r="3.5" fill="url(#darkGraphite)" stroke="#64748B" strokeWidth="0.8" />
            {/* Forearm angling back inward to wrist at (149, 169) */}
            <path d="M148 145 Q150 158 149 169" stroke="url(#pearlShell)" strokeWidth="6.5" strokeLinecap="round" />
            
            {/* WRIST & HAND GROUP (Synchronized Mirrored Rotation - Unified Assembly) */}
            <motion.g
              id="right-hand-group"
              animate={
                reducedMotion
                  ? {}
                  : {
                      rotate: [3, -3, 3],
                    }
              }
              transition={{
                duration: 5.0,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '149px 169px' }}
            >
              {/* Wrist Joint */}
              <circle cx="149" cy="169" r="2.5" fill="url(#darkGraphite)" />
              {/* Robotic Palm & Fingers (Unified Unit) */}
              <rect x="144" y="171" width="12" height="9" rx="3.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="1" />
              <rect x="144.5" y="180" width="3.2" height="10" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="145" y1="185" x2="147.2" y2="185" stroke="#334155" strokeWidth="0.8" />
              <rect x="149" y="180" width="3.2" height="11" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="149.5" y1="185.5" x2="151.7" y2="185.5" stroke="#334155" strokeWidth="0.8" />
              <rect x="153.5" y="180" width="3.2" height="10" rx="1.5" fill="url(#pearlShell)" stroke="#475569" strokeWidth="0.8" />
              <line x1="154" y1="185" x2="156.2" y2="185" stroke="#334155" strokeWidth="0.8" />
            </motion.g>
          </g>

        </svg>
      </motion.div>

    </div>
  );
};
