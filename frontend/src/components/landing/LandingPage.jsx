import React from 'react';
import {
  School,
  Users,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  CheckSquare
} from 'lucide-react';

// Public landing showcase page for India Book House LMS
export default function LandingPage({ onOpenLogin, onGoToDashboard, isLoggedIn }) {
  // Key metrics displayed on hero section
  const stats = [
    { label: 'Classes Supported', value: 'Class 1 - 12' },
    { label: 'Master Tables Managed', value: '7 Master Tables' },
    { label: 'Inventory Items', value: 'Books, Copies & Pens' },
    { label: 'Checklist Accuracy', value: '100% Dynamic' }
  ];

  // Core software feature highlights
  const features = [
    {
      icon: <Layers className="w-6 h-6 text-blue-600" />,
      title: '7 Master Lookup Tables',
      desc: 'Centralized control of Item Types, Classes, Subjects, Authors/Publishers, Board Types, Curriculums, and Roles with strict deletion protection.'
    },
    {
      icon: <School className="w-6 h-6 text-indigo-600" />,
      title: 'School Profile & Reports',
      desc: 'Manage schools (CBSE/ICSE, NCERT), track book dispatch history, and see which school received how many books in real-time.'
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: 'Class & Section Rosters',
      desc: 'Filter students strictly by School, Class & Section. Automatically attaches NCERT syllabus package to each registered student.'
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-amber-600" />,
      title: 'Item-Wise Checklist',
      desc: 'Tick or untick books, copies and pens per student. If an item is out of stock, mark reason. Recalculates total, concession, and due balance instantly.'
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-purple-600" />,
      title: 'Excel Bulk Management',
      desc: 'Download standardized Excel templates for books and stationery, make offline edits, and bulk upload with zero data corruption.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-rose-600" />,
      title: 'Executive Financial Summary',
      desc: 'Real-time section-level collection rates, grand total amounts, concessions granted, paid fees, and pending balances in one dashboard.'
    }
  ];

  // Step by step operational workflow
  const workflowSteps = [
    {
      step: '01',
      title: 'Configure Masters',
      desc: 'Define your class levels, item types (Book, Copy, Pen), subjects, and publishers in the Master Data manager.'
    },
    {
      step: '02',
      title: 'Populate Inventory',
      desc: 'Add individual items or upload the bulk Excel file with prices, class mapping, and current warehouse stock.'
    },
    {
      step: '03',
      title: 'Select School & Class',
      desc: 'Filter by school, class and section. The system automatically fetches all mapped NCERT items for that standard.'
    },
    {
      step: '04',
      title: 'Manage Checklists & Collect',
      desc: 'Mark items purchased or out of stock per student, apply concessions, record paid amounts, and track due balances.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Gen School Book Allocation & Inventory Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
            Effortless Book Distribution & Student Rosters for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              India Book House
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive management platform to handle multiple schools, Class 1-12 NCERT curriculum packages, item checklists (books, copies, pens), and real-time financial balances.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <span>Open Admin Portal</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <span>Login to Portal</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <a
              href="#modules"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 transition shadow-sm active:scale-95"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Stats strip */}
          <div id="stats" className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((st, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/70 backdrop-blur border border-slate-200/80 shadow-sm text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{st.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section id="modules" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Enterprise Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Everything Needed to Manage Library & School Distribution
            </p>
            <p className="mt-4 text-base text-slate-600">
              Built specifically for modern educational publishers, book dealers, and school book distribution centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-5 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section id="workflow" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Simple Process</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              From Stock Arrival to Student Dispatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <span className="text-3xl font-black text-blue-100 absolute top-4 right-5">{step.step}</span>
                <div className="text-base font-bold text-slate-900 mb-2 mt-4">{step.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Streamline School Book Allocations?
          </h2>
          <p className="text-blue-100 text-base max-w-xl mx-auto mb-8">
            Access the admin dashboard to manage schools, view book dispatch reports, and update student fee checklists.
          </p>
          <button
            onClick={isLoggedIn ? onGoToDashboard : onOpenLogin}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-base hover:bg-blue-50 transition shadow-lg active:scale-95"
          >
            <span>{isLoggedIn ? 'Go to Dashboard' : 'Open Admin Portal'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-300 font-semibold text-sm mb-1">India Book House &copy; 2026</p>
          <p>School Book Allocation, Inventory Management & Financial Reconciliation System</p>
        </div>
      </footer>
    </div>
  );
}
