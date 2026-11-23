import React, { useState, useEffect } from 'react';
import { ExternalLink, Shield, Menu, Download } from 'lucide-react';
import PwaInstallModal from '../common/PwaInstallModal';

// Main portal top navigation header
export default function Header({ currentView, user, onToggleMobileMenu }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(window.deferredPWAInstallPrompt);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const onAvailable = () => setInstallPrompt(window.deferredPWAInstallPrompt);
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
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
        setInstallPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowModal(true);
    }
  };
  // Compute breadcrumb title based on active view
  const getBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'books':
        return 'Manage Books & Inventory';
      case 'schools':
        return 'Manage Schools & Reports';
      case 'students':
        return 'Manage Students & Checklist';
      case 'masters-all':
        return 'Master Data (All 7 Tables)';
      case 'masters-item-types':
        return 'Master / Item Types';
      case 'masters-classes':
        return 'Master / Classes';
      case 'masters-subjects':
        return 'Master / Subjects';
      case 'masters-publishers':
        return 'Master / Publishers';
      case 'masters-boards':
        return 'Master / Board Types';
      case 'masters-curriculums':
        return 'Master / Curriculums';
      case 'masters-roles':
        return 'Master / User Roles';
      default:
        return 'Portal';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
      {/* Left: Mobile hamburger and Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle Button (Mobile Only) */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-none">
            {getBreadcrumb()}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">India Book House &bull; Multi-School Portal</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* PWA Install App Button */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            title="Install India Book House on your Desktop or Phone"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {/* User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs sm:text-sm border border-blue-200 shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-600 inline" />
              <span>{user?.role || 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Install Guide Modal */}
      <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </header>
  );
}
