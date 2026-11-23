import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, LogIn, Menu, X, Download, MonitorCheck } from 'lucide-react';

export default function Navbar({ onOpenLogin, isLoggedIn, onGoToDashboard }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(!!window.deferredPWAInstallPrompt);
  const [showHelperModal, setShowHelperModal] = useState(false);

  useEffect(() => {
    // Check if running inside installed standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const onAvailable = () => setHasPrompt(true);
    const onInstalled = () => {
      setIsInstalled(true);
      setHasPrompt(false);
    };

    window.addEventListener('pwa-prompt-available', onAvailable);
    window.addEventListener('pwa-installed', onInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', onAvailable);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.deferredPWAInstallPrompt) {
      window.deferredPWAInstallPrompt.prompt();
      const { outcome } = await window.deferredPWAInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPWAInstallPrompt = null;
        setIsInstalled(true);
      }
    } else {
      setShowHelperModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              India Book House
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                LMS
              </span>
            </span>
            <p className="text-xs text-slate-500 hidden sm:block">School Book Allocation & Inventory System</p>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#modules" className="hover:text-blue-600 transition-colors">Core Modules</a>
          <a href="#workflow" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#stats" className="hover:text-blue-600 transition-colors">Overview</a>
        </nav>

        {/* Action Button & Mobile Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PWA Install App Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
              title="Install India Book House on your PC or Phone"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Install App</span>
            </button>
          )}

          {isLoggedIn ? (
            <button
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs sm:text-sm hover:bg-blue-700 transition shadow-sm active:scale-95"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs sm:text-sm hover:bg-slate-800 transition shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top duration-150">
          {!isInstalled && (
            <button
              onClick={() => { setMobileNavOpen(false); handleInstallClick(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Install App (Desktop & Mobile)</span>
            </button>
          )}

          <a
            href="#modules"
            onClick={() => setMobileNavOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1"
          >
            Core Modules
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileNavOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1"
          >
            How It Works
          </a>
          <a
            href="#stats"
            onClick={() => setMobileNavOpen(false)}
            className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1"
          >
            Overview & Stats
          </a>
        </div>
      )}

      {/* Helper Modal if native prompt is handled via address bar */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                <MonitorCheck className="w-5 h-5" />
                <span>Install India Book House App</span>
              </div>
              <button
                onClick={() => setShowHelperModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                Aapke browser ke top address bar (URL ke bilkul right side me) <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Install</strong> button pehle se show ho raha hai!
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-blue-900">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span>📌 Direct Install karne ke aasan tareeqe:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
                  <li><strong>Address Bar:</strong> Top URL bar me Bookmark (Star) ke paas <strong>Install App (🖥️)</strong> icon par click karein.</li>
                  <li><strong>Browser Menu:</strong> Chrome/Edge ke right side <strong>3 dots (⋮)</strong> par click karke <strong>"Install India Book House"</strong> chunein.</li>
                </ul>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelperModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Theek Hai, Samjh Gaya
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
