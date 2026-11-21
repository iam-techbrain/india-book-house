import React, { useState } from 'react';
import { BookOpen, ArrowRight, LogIn, Menu, X } from 'lucide-react';

export default function Navbar({ onOpenLogin, isLoggedIn, onGoToDashboard }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    </header>
  );
}
