import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  School,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  LogOut,
  Tag,
  Bookmark,
  Layers,
  Building2,
  FileText,
  UserCog,
  Compass,
  Home,
  X,
  Download
} from 'lucide-react';
import PwaInstallModal from '../common/PwaInstallModal';
import { APP_NAME } from '../../config/appConfig';

export default function Sidebar({
  currentView,
  setCurrentView,
  onLogout,
  onGoHome,
  isOpen = false,
  onClose
}) {
  const [mastersOpen, setMastersOpen] = useState(
    currentView.startsWith('masters-') || currentView === 'masters'
  );
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (currentView.startsWith('masters')) {
      setMastersOpen(true);
    }
  }, [currentView]);

  const masterSublinks = [
    { id: 'masters-item-types', label: 'Item Types', icon: <Tag className="w-4 h-4" /> },
    { id: 'masters-classes', label: 'Classes (1-12)', icon: <Layers className="w-4 h-4" /> },
    { id: 'masters-subjects', label: 'Subjects', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'masters-publishers', label: 'Authors / Publishers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'masters-boards', label: 'Board Types (CBSE/ICSE)', icon: <Compass className="w-4 h-4" /> },
    { id: 'masters-curriculums', label: 'Curriculums (NCERT)', icon: <FileText className="w-4 h-4" /> },
    { id: 'masters-roles', label: 'User Roles', icon: <UserCog className="w-4 h-4" /> }
  ];

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard & Reports', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'books', label: 'Manage Books & Items', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'schools', label: 'Manage Schools & Reports', icon: <School className="w-5 h-5" /> },
    { id: 'students', label: 'Manage Students & Checklist', icon: <GraduationCap className="w-5 h-5" /> }
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (onClose) onClose(); // Auto-close drawer on mobile
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Drawer on Mobile, Fixed Column on Desktop */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-white text-slate-700 flex flex-col shrink-0 border-r border-slate-200 select-none shadow-xl md:shadow-xs transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { onGoHome(); if (onClose) onClose(); }}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">{APP_NAME}</h1>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Landing Page</span>
            </div>
          </div>

          {/* Close Button on Mobile Drawer */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
            Core Modules
          </div>

          {/* Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentView === 'dashboard'
                ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Dashboard & Reports</span>
          </button>

          {/* Master Data Menu with Collapsible Sublinks */}
          <div className="pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Master Data Setup
            </div>
            <button
              onClick={() => {
                setMastersOpen(!mastersOpen);
                if (!currentView.startsWith('masters')) {
                  setCurrentView('masters-all');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentView.startsWith('masters')
                  ? 'bg-slate-100 text-slate-900'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-indigo-500" />
                <span>Manage Master Data</span>
              </div>
              {mastersOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Sublinks */}
            {mastersOpen && (
              <div className="ml-4 pl-3 border-l-2 border-slate-100 my-1 space-y-0.5">
                <button
                  onClick={() => handleNavClick('masters-all')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentView === 'masters-all' || currentView === 'masters'
                      ? 'text-blue-700 bg-blue-50 font-bold border border-blue-100'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>Overview (All 7 Masters)</span>
                </button>
                {masterSublinks.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleNavClick(sub.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      currentView === sub.id
                        ? 'text-white bg-blue-600 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {sub.icon}
                    <span className="truncate">{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              Operations
            </div>
            {mainNav.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                    : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                }`}
              >
                <span className={currentView === item.id ? 'text-blue-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          {/* PWA Install Button in Sidebar */}
          {(!window.matchMedia || !window.matchMedia('(display-mode: standalone)').matches) && (
            <button
              onClick={() => {
                if (window.deferredPWAInstallPrompt) {
                  window.deferredPWAInstallPrompt.prompt();
                } else {
                  setShowInstallModal(true);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition mb-1 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Install Desktop App</span>
            </button>
          )}

          <button
            onClick={() => { onGoHome(); if (onClose) onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Back to Landing Page</span>
          </button>
          <button
            onClick={() => { onLogout(); if (onClose) onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* PWA Install Guide Modal */}
      <PwaInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
}
