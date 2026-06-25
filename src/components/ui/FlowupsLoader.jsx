import React, { useState, useEffect } from 'react';

/**
 * Loader5: Glowing Shimmer
 * A premium enterprise-grade loader featuring a glowing gradient background,
 * high-fidelity shimmer effects, and the FlowupS CallDesk branding.
 */
const FlowupSLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden ">
      <div className='absolute h-full w-full z-0' >
        <div className='h-full w-full z-0 bg-white bg-linear-to-br from-[#356eff] via-[#ffffff] relative'>
          <div className='absolute top-16 left-44 h-56 w-50 rounded-br-full rounded-bl-full rounded-tr-full rounded-tl-full bg-white/70 blur-2xl animate-spin delay-1000' ></div>
        </div>
      </div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo Container with Shimmer */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 z-50  group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <img
            src="./logo 1.png"
            alt="FlowupS CallDesk Logo"
            className="relative h-27 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Brand Typography */}


        {/* Progress Container */}

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-2 px-6 py-2 bg-white">
        <span className="text-[11px] font-light text-slate-400 tracking-tight">Copyright @ 2026 flowupS CallDesk</span>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes tilt {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .animate-blob { animation: blob 7s infinite alternate; }
        .animate-tilt { animation: tilt 10s infinite linear; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}} />
    </div>
  );
};

export default FlowupSLoader;