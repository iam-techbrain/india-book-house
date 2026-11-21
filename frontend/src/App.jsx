import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import LandingPage from './components/landing/LandingPage';
import LoginModal from './components/auth/LoginModal';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardOverview from './components/dashboard/DashboardOverview';
import MastersManager from './components/masters/MastersManager';
import BooksManager from './components/books/BooksManager';
import SchoolsManager from './components/schools/SchoolsManager';
import StudentsManager from './components/students/StudentsManager';

// Canonical route mapping between view IDs and clean URLs
export const ROUTE_MAP = {
  landing: '/',
  dashboard: '/dashboard',
  books: '/manage-books',
  schools: '/manage-schools',
  students: '/manage-students',
  'masters': '/masters',
  'masters-all': '/masters',
  'masters-item-types': '/masters/items',
  'masters-classes': '/masters/classes',
  'masters-subjects': '/masters/subjects',
  'masters-publishers': '/masters/publishers',
  'masters-boards': '/masters/boards',
  'masters-curriculums': '/masters/curriculums',
  'masters-roles': '/masters/roles'
};

// Titles mapped to views
const VIEW_TITLES = {
  landing: 'India Book House - LMS & School Book Allocation',
  dashboard: 'Dashboard & Reports | India Book House',
  books: 'Manage Books & Inventory | India Book House',
  schools: 'Manage Schools & Reports | India Book House',
  students: 'Manage Students & Checklist | India Book House',
  'masters': 'Master Data Management | India Book House',
  'masters-all': 'Master Data Management | India Book House',
  'masters-item-types': 'Master / Item Types | India Book House',
  'masters-classes': 'Master / Classes | India Book House',
  'masters-subjects': 'Master / Subjects | India Book House',
  'masters-publishers': 'Master / Publishers | India Book House',
  'masters-boards': 'Master / Board Types | India Book House',
  'masters-curriculums': 'Master / Curriculums | India Book House',
  'masters-roles': 'Master / User Roles | India Book House'
};

// Helper to parse URL path (or hash fallback) into active view ID
export function getViewFromUrl(pathname = window.location.pathname, hash = window.location.hash) {
  let path = pathname || '';
  if (hash && hash.startsWith('#/')) {
    path = hash.substring(1);
  }
  path = path.replace(/\/+$/, '') || '/';

  switch (path) {
    case '':
    case '/':
      return 'landing';
    case '/dashboard':
      return 'dashboard';
    case '/books':
    case '/manage-books':
      return 'books';
    case '/schools':
    case '/manage-schools':
      return 'schools';
    case '/students':
    case '/manage-students':
      return 'students';
    case '/masters':
    case '/masters/all':
    case '/masters/items':
    case '/items':
      return 'masters-items';
    case '/masters/classes':
    case '/classes':
      return 'masters-classes';
    case '/masters/subjects':
    case '/subjects':
      return 'masters-subjects';
    case '/masters/publishers':
    case '/masters/authors':
    case '/publishers':
    case '/authors':
      return 'masters-publishers';
    case '/masters/boards':
    case '/boards':
      return 'masters-boards';
    case '/masters/curriculums':
    case '/curriculums':
      return 'masters-curriculums';
    case '/masters/roles':
    case '/roles':
      return 'masters-roles';
    default:
      return 'landing';
  }
}

export default function App() {
  // Initialize view directly from URL
  const [currentView, setCurrentView] = useState(() => {
    return getViewFromUrl(window.location.pathname, window.location.hash);
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check saved authentication on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ibh_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Failed to parse saved user', e);
    }
  }, []);

  // Update browser document.title whenever currentView changes
  useEffect(() => {
    document.title = VIEW_TITLES[currentView] || 'India Book House - LMS';
  }, [currentView]);

  // Navigate to a view and update browser URL
  const navigateTo = useCallback((viewId, replace = false) => {
    const targetPath = ROUTE_MAP[viewId] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ view: viewId }, '', targetPath);
      } else {
        window.history.pushState({ view: viewId }, '', targetPath);
      }
    }
    setCurrentView(viewId);
  }, []);

  // Listen to browser Back / Forward history events (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const detectedView = getViewFromUrl(window.location.pathname, window.location.hash);
      setCurrentView(detectedView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync initial URL if loaded on sub-path
  useEffect(() => {
    const detectedView = getViewFromUrl(window.location.pathname, window.location.hash);
    if (detectedView && detectedView !== 'landing') {
      const canonical = ROUTE_MAP[detectedView];
      if (canonical && window.location.pathname !== canonical) {
        window.history.replaceState({ view: detectedView }, '', canonical);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoginOpen(false);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ibh_token');
    localStorage.removeItem('ibh_user');
    setUser(null);
    navigateTo('landing');
    setMobileMenuOpen(false);
  };

  const handleMasterTabChange = (tabId) => {
    const tabMap = {
      item_types: 'masters-item-types',
      classes: 'masters-classes',
      subjects: 'masters-subjects',
      authors_publishers: 'masters-publishers',
      board_types: 'masters-boards',
      curriculums: 'masters-curriculums',
      roles: 'masters-roles'
    };
    const targetView = tabMap[tabId] || 'masters-item-types';
    navigateTo(targetView);
  };

  const isLoggedIn = Boolean(user);

  // If on landing page (URL: /)
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar
          onOpenLogin={() => setIsLoginOpen(true)}
          isLoggedIn={isLoggedIn}
          onGoToDashboard={() => navigateTo('dashboard')}
        />

        <LandingPage
          onOpenLogin={() => setIsLoginOpen(true)}
          onGoToDashboard={() => navigateTo('dashboard')}
          isLoggedIn={isLoggedIn}
        />

        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // Render Portal Active View
  const renderPortalContent = () => {
    if (currentView === 'dashboard') {
      return <DashboardOverview onNavigate={(view) => navigateTo(view)} />;
    }
    if (currentView.startsWith('masters')) {
      return <MastersManager subView={currentView} onTabChange={handleMasterTabChange} />;
    }
    if (currentView === 'books') {
      return <BooksManager />;
    }
    if (currentView === 'schools') {
      return <SchoolsManager />;
    }
    if (currentView === 'students') {
      return <StudentsManager />;
    }
    return <DashboardOverview onNavigate={(view) => navigateTo(view)} />;
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-100">
      {/* Portal Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={navigateTo}
        onLogout={handleLogout}
        onGoHome={() => navigateTo('landing')}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={currentView}
          user={user}
          onGoHome={() => navigateTo('landing')}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-6">
          {renderPortalContent()}
        </main>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
