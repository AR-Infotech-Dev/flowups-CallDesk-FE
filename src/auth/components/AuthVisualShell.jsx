function AuthVisualShell({ title, subtitle, children }) {
  return (
    <main className="auth-visual-shell min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.67fr_1fr]">
        <section className="auth-visual-panel relative hidden overflow-hidden bg-[#071b3d] text-white lg:block">
          <img
            src="/images/screen.png"
            alt="FlowupS CallDesk"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="auth-visual-overlay absolute inset-0 bg-gradient-to-r from-[#07152f]/95 via-[#0b254c]/78 to-[#0b254c]/30" />
          <div className="absolute z-50 top-7 left-12 flex items-center gap-2">
            <span className="flex h-7 w-24 items-center justify-center rounded-md text-xs font-bold shadow-lg shadow-blue-950/30">
              <img src="/logo.png" alt="calldesk" />
            </span>
            {/* <span className="text-xs font-semibold">FlowupS CallDesk</span> */}
          </div>
          <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-6 xl:px-16">
            <div className="max-w-md ">
              <h1 className="auth-visual-title font-manrope text-[32px] font-bold leading-[40px] tracking-[-0.64px]">
                Simplify support. Strengthen customer relationships.
              </h1>
              <p className="auth-visual-copy mt-2 max-w-sm text-[11px] leading-4 text-blue-100/80">
                Track customer requests, schedule visits, manage AMC follow-ups, and keep every support activity organized.
              </p>
            </div>
          </div>
        </section>

        <section className="auth-login-panel flex min-h-screen items-center justify-center bg-white px-4 py-6">
          <div className="w-full max-w-[320px]">
            <div className="mb-4 lg:hidden">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-23 items-center justify-center rounded-md bg-white text-xs font-bold text-white">
                  <img src="/logo.png" alt="calldesk" />
                </span>
                {/* <span className="text-xs font-semibold text-slate-900">FlowupS CallDesk</span> */}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="auth-login-title text-xl font-bold text-slate-950">{title}</h2>
              <p className="auth-login-subtitle mt-1 text-[11px] text-slate-500">{subtitle}</p>
            </div>

            {children}

            <p className="auth-login-copyright mt-7 text-center text-[9px] text-slate-400">
              © 2026 FlowupS CallDesk. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthVisualShell;
