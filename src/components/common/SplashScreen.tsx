import React, { useEffect, useState } from 'react';
import { AuthUserProfile } from '../../types/fitness';

interface SplashScreenProps {
  isLoading: boolean;
  authUser: AuthUserProfile | null;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  authUser,
  onFinish,
}) => {
  const [fade, setFade] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing BritsFit...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      if (authUser) {
        setStatusMessage(`Welcome back, ${authUser.displayName || 'Athlete'}!`);
      } else {
        setStatusMessage('Loading fitness records & profiles...');
      }
    }, 600);

    const safetyTimer = setTimeout(() => {
      // Graceful timeout so app is never stuck
      setFade(true);
      setTimeout(onFinish, 400);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(safetyTimer);
    };
  }, [authUser, onFinish]);

  useEffect(() => {
    if (!isLoading) {
      const finishTimer = setTimeout(() => {
        setFade(true);
        setTimeout(onFinish, 400);
      }, 700);
      return () => clearTimeout(finishTimer);
    }
  }, [isLoading, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#091A36] text-white transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #143466 0%, #0F284F 45%, #08162B 100%)',
      }}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* BritsFit Official Logo Asset */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-[#12B8C7] opacity-20 blur-xl animate-pulse" />
          <img
            src="assets/britsfit-logo.svg"
            alt="BritsFit Logo"
            className="relative w-28 h-28 drop-shadow-2xl rounded-3xl"
          />
        </div>

        {/* Wordmark */}
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          Brits<span className="text-[#1677E8]">Fit</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs font-bold tracking-widest text-[#12B8C7] uppercase mb-8">
          Your fitness. Your progress. Your journey.
        </p>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-4 relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#12B8C7] via-[#00A3E0] to-[#1677E8] rounded-full animate-[shimmer_1.5s_infinite] w-full" />
        </div>

        {/* Dynamic status */}
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          {statusMessage}
        </p>

        {/* Fallback skip in case of network stall */}
        <button
          onClick={() => {
            setFade(true);
            setTimeout(onFinish, 300);
          }}
          className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 underline tracking-wider transition-colors"
        >
          Skip to app
        </button>
      </div>
    </div>
  );
};
