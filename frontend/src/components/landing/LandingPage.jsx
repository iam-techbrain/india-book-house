import React, { useState } from 'react';
import {
  School,
  Users,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  CheckSquare,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Package,
  BarChart3,
  HelpCircle,
  CreditCard,
  Building2,
  BadgeCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function LandingPage({ onOpenLogin, onGoToDashboard, isLoggedIn }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // High-level system statistics
  const stats = [
    { label: 'School Affiliations', value: 'CBSE & ICSE', desc: 'Multi-campus delivery' },
    { label: 'Curriculum Kits', value: 'Class 1 – 12', desc: 'NCERT & Publishers' },
    { label: 'Item Checklists', value: 'Books, Copies & Pens', desc: 'Dynamic stock tracking' },
    { label: 'Financial Settlement', value: '100% Real-Time', desc: 'Net, Paid & Due Balances' }
  ];

  // Core software capabilities
  const coreModules = [
    {
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      badge: 'Multi-Campus',
      title: 'School Affiliation & Dispatch Tracking',
      desc: 'Register multiple affiliated schools (e.g. Trinity Global School, DPS), map board types (CBSE, ICSE, State Boards), and monitor real-time kit dispatch progress bars per school.'
    },
    {
      icon: <Package className="w-6 h-6 text-indigo-600" />,
      badge: 'Automated',
      title: 'Class-Wise Kit Packaging Engine',
      desc: 'Automatic pre-bundling of textbook packages, custom school notebooks (single-line, four-line, square), and stationery kits strictly mapped to Class standards (Nursery to 12th).'
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-emerald-600" />,
      badge: 'Paperless',
      title: 'Student-Wise Item Checklist',
      desc: 'Digital tick-and-verify delivery checklist per student. Items in stock are marked purchased; out-of-stock items dynamically reduce billings and record reasons for fast back-orders.'
    },
    {
      icon: <CreditCard className="w-6 h-6 text-amber-600" />,
      badge: 'Zero-Discrepancy',
      title: 'Fee Collection, Concessions & Dues',
      desc: 'Instant calculation of Gross Kit Price, custom Concessions with mandatory reason logs (Sibling, Staff, Merit), Paid amounts collected, and pending Due balances with one-click saving.'
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-purple-600" />,
      badge: 'Zero-Typing',
      title: 'Bulk Excel Roster Ingestion',
      desc: 'One-click download of sample Excel roster templates. Upload hundreds of students or thousands of inventory titles in seconds with flexible column auto-normalization.'
    },
    {
      icon: <Layers className="w-6 h-6 text-rose-600" />,
      badge: 'Audit Protected',
      title: '7 Master Lookup Configuration',
      desc: 'Centralized master data control for Item Types, Classes, Subjects, Authors/Publishers, Board Types, Curriculums, and Roles with strict foreign-key delete protection.'
    }
  ];

  // Traditional Challenges vs IBH Solution
  const comparisons = [
    {
      problem: 'Manual Paper Registers & Lost Checklists',
      problemDesc: 'During chaotic start-of-session distribution camps, paper lists get torn, misplaced, or handwritten ticks are misread.',
      solution: '100% Digital Real-Time Checklist',
      solutionDesc: 'Class teachers and coordinators check off books on a clean tablet/laptop interface with instant auto-save and audit records.'
    },
    {
      problem: 'Parent Confusion on Missing / Out-of-Stock Books',
      problemDesc: 'Parents question why a kit price was charged when certain notebooks or regional language books were out of stock in warehouse.',
      solution: 'Transparent Out-of-Stock Auto-Deduction',
      solutionDesc: 'Unavailable items are flagged OUT_OF_STOCK, deducting their cost from the student balance until fresh stock arrives.'
    },
    {
      problem: 'Unverified Concessions & Cash Collection Mismatches',
      problemDesc: 'Discounts given verbally without recorded reasons create discrepancies between school counters and accounts departments.',
      solution: 'Mandatory Reason Tracking & Due Settlement',
      solutionDesc: 'Concessions require a written reason, updating live Net Payable, Paid amount, and live Due balances seamlessly.'
    },
    {
      problem: 'Distributor Blind Spots in School Dispatches',
      problemDesc: 'Publishers and distributors struggle to track how many book sets have been delivered vs pending across multiple branches.',
      solution: 'Live School Dispatch Progress Bars',
      solutionDesc: 'Automated aggregation shows Total Enrolled, Books Dispatched, and Pending Kits per affiliated school at a glance.'
    }
  ];

  // Step-by-step operational workflow
  const workflowSteps = [
    {
      step: '01',
      title: 'Affiliate School & Setup Board',
      desc: 'Register the partner school profile, select curriculum (NCERT/Private), and configure Class Grade standards.'
    },
    {
      step: '02',
      title: 'Upload Inventory & Price Masters',
      desc: 'Populate textbooks, copies, and pens with item codes, prices, and warehouse stock via bulk Excel or direct entry.'
    },
    {
      step: '03',
      title: 'Enroll Students & Auto-Map Kits',
      desc: 'Import the school student roster. The system automatically bundles the prescribed syllabus package for each child.'
    },
    {
      step: '04',
      title: 'Checklist Delivery & Settle Fees',
      desc: 'Check off delivered items, log concessions with remarks, collect paid fees, and track remaining due balances.'
    }
  ];

  // Stakeholders benefiting from the platform
  const stakeholders = [
    {
      role: 'Educational Publishers & Distributors',
      benefit: 'Complete visibility into multi-school order pipelines, warehouse inventory stock, and collection reconciliations without paper registers.'
    },
    {
      role: 'School Principals & Administrators',
      benefit: 'Real-time visibility into whether 100% of admitted students have received their textbook kits before classes commence.'
    },
    {
      role: 'Distribution Coordinators & Staff',
      benefit: 'High-speed student search, quick Select All / Clear book checklists, and instant keyboard shortcuts for rush distribution camps.'
    },
    {
      role: 'School Cashiers & Accountants',
      benefit: 'Auditable record of all approved student concessions, logged reasons, cash collected, and pending fee balances.'
    }
  ];

  // FAQ entries
  const faqs = [
    {
      q: 'What is India Book House LMS specifically designed for?',
      a: 'India Book House LMS is an end-to-end School Book Allocation, Kit Packaging, and Student Fee Management System. It replaces paper distribution registers by digitally bundling class-wise textbooks (NCERT & Private), exercise copies, and stationery, tracking item checklists per student, and settling concessions and fee payments.'
    },
    {
      q: 'How does the student book checklist work during distribution camps?',
      a: 'When you select a School, Class, and Section, the system auto-fetches all prescribed books, copies, and pens for that standard. Staff can click individual items or use "Select All" to mark items purchased. If an item is out of stock in the library, it can be marked as such, which instantly deducts its price from the student\'s payable balance.'
    },
    {
      q: 'Can we apply student concessions and record the reason?',
      a: 'Yes! The system allows inline entry of Concession amounts. When a concession is entered, the Concession Reason box unlocks, requiring a documented justification (e.g. Sibling discount, Staff child, Merit scholarship). All changes update the student\'s Net Fee and Due Balance in real-time.'
    },
    {
      q: 'Can we bulk-upload student rosters and book inventory from Excel?',
      a: 'Absolutely. The platform includes downloadable standardized Excel templates for both Student Rosters and Master Items. The importer features ultra-flexible column matching that accepts any case or naming variant (e.g. "Student ID", "Roll No", "Student Name", "Father Name") with zero data corruption.'
    },
    {
      q: 'How does the system track dispatch progress across multiple schools?',
      a: 'The Manage Schools module displays interactive cards for each registered school (e.g. Trinity Global School). It computes live aggregated counts of Enrolled Students, Books Delivered, and Pending Kits, complete with a visual dispatch progress percentage bar.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-white via-blue-50/20 to-slate-100 border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.7))] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-2xs animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Dedicated Multi-School Book Allocation, Kit Packaging & Billing Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-tight sm:leading-none">
            End-to-End School Book Distribution & Student Fee Management for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              India Book House
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Designed specifically for school book distributors, publishers, and affiliated campuses. Digitally manage Class 1–12 NCERT curriculum packages, track item-wise student checklists (books, copies, pens), record concessions with audit reasons, and settle live fees in one unified console.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <span>Launch Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <span>Access Management Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="#interactive-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base border border-slate-200 transition shadow-sm active:scale-95"
            >
              <span>View System Architecture</span>
            </a>
          </div>

          {/* Key Metrics Banner */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto">
            {stats.map((st, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/90 backdrop-blur border border-slate-200/90 shadow-2xs text-center transition hover:border-blue-300">
                <div className="text-xl sm:text-2xl font-black text-slate-900">{st.value}</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">{st.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Visual Software Cockpit Showcase */}
      <section id="interactive-demo" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Live Interface Showcase</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              The 4-Card Unified Student Allocation Console
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              How school coordinators and book dispatchers interact with student data, inventory checklists, and financials in real-time.
            </p>
          </div>

          {/* High-fidelity Cockpit Mockup */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-100/80 border border-slate-200 shadow-xl max-w-6xl mx-auto space-y-4">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] text-slate-700">Class 1 • All Sections Roster • NCERT Prescribed</span>
              </div>
              <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-700">
                Active School: Trinity Global School (TGS)
              </span>
            </div>

            {/* Row Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
              {/* Card 1: Student Details */}
              <div className="md:col-span-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-extrabold text-slate-900 text-xs">Aarav Sharma</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Sec A
                  </span>
                </div>
                <div className="space-y-1.5 pt-1.5 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">ID:</span>
                    <span className="font-mono font-bold text-blue-600">DPS-C1-001</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">Class:</span>
                    <span className="font-semibold text-slate-700">Class 1</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">Roll:</span>
                    <span className="font-semibold text-slate-700">Roll #001</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">Father:</span>
                    <span className="font-semibold text-slate-800">Rajesh Sharma</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Books Checklist */}
              <div className="md:col-span-4 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[10px]">
                  <span className="font-bold text-slate-600">Selected: <strong className="text-blue-600">3</strong> / 3 Items</span>
                  <span className="text-emerald-600 font-bold">✔ Auto-Saved</span>
                </div>
                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex items-center justify-between p-1 bg-blue-50/50 rounded border border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">☑</span>
                      <span className="font-semibold text-slate-900 text-[11px]">Rimjhim (Hindi)</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">₹65</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-blue-50/50 rounded border border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">☑</span>
                      <span className="font-semibold text-slate-900 text-[11px]">4-Line English Notebook</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">₹40</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-blue-50/50 rounded border border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">☑</span>
                      <span className="font-semibold text-slate-900 text-[11px]">Apsara Pen Set</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">₹25</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Fees & Payment */}
              <div className="md:col-span-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">PAID</span>
                  <span className="text-[11px] font-bold text-slate-700 font-mono">Net: ₹120</span>
                </div>
                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800">Conc:</span>
                    <span className="px-2 py-0.5 bg-amber-50 rounded border border-amber-200 font-bold text-amber-900 font-mono text-[11px]">₹10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800">Paid:</span>
                    <span className="px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 font-bold text-emerald-900 font-mono text-[11px]">₹120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-700">Due:</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-bold text-red-600 font-mono text-[11px]">₹0</span>
                  </div>
                </div>
                <button className="mt-1.5 w-full py-1 rounded bg-slate-200 text-slate-400 font-bold text-[10px] cursor-not-allowed">
                  Save (Up-to-Date)
                </button>
              </div>

              {/* Card 4: Details & Remarks */}
              <div className="md:col-span-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                <button className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                  👁 Details Modal
                </button>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 block">Concession Reason:</span>
                    <span className="text-[11px] text-slate-700 italic block truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Sibling discount (Ref #42)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block">Remarks:</span>
                    <span className="text-[11px] text-slate-500 block truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Kit handed to guardian
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Comparison */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Transforming Distribution</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Why Schools & Publishers Choose India Book House LMS
            </h2>
            <p className="mt-3 text-base text-slate-600">
              A side-by-side comparison between old manual distribution methods and modern digital allocation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {comparisons.map((c, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                {/* Problem */}
                <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/70 text-xs space-y-1">
                  <div className="font-bold text-red-900 flex items-center gap-1.5">
                    <span className="text-red-600 font-extrabold">✕</span>
                    <span>{c.problem}</span>
                  </div>
                  <p className="text-red-700/90 leading-relaxed">{c.problemDesc}</p>
                </div>

                {/* Solution */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{c.solution}</span>
                  </div>
                  <p className="text-emerald-800/90 leading-relaxed">{c.solutionDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Enterprise Capabilities Grid */}
      <section id="modules" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Platform Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              6 Built-In Modules Powering Complete Book Allocation
            </h2>
            <p className="mt-3 text-base text-slate-600">
              From master inventory setup to final cashier reconciliation, everything runs in sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreModules.map((mod, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-xs border border-slate-200">
                      {mod.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step by Step Operational Flow */}
      <section id="workflow" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Operational Workflow</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              How Book Distribution Operates in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-3xl font-black text-blue-100 absolute top-4 right-5">{step.step}</span>
                <div className="mt-4">
                  <div className="text-sm font-bold text-slate-900 mb-2">{step.title}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholders & Users Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Who It Is Built For</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Tailored for Every Stakeholder in the Distribution Chain
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {stakeholders.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  0{idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{s.role}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">Got Questions?</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Clear answers regarding curriculum handling, concession rules, and bulk Excel roster uploads.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-600 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-center shadow-inner">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Ready to Streamline Your School Book Allocation?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Eliminate inventory discrepancies, track every student checklist digitally, and reconcile school dispatch reports with 100% confidence.
          </p>
          <button
            onClick={isLoggedIn ? onGoToDashboard : onOpenLogin}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold text-base hover:bg-blue-50 transition shadow-xl active:scale-95"
          >
            <span>{isLoggedIn ? 'Go to Admin Dashboard' : 'Open Admin Portal'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-slate-200 font-bold text-sm">India Book House &copy; 2026</p>
          <p className="text-slate-400">Enterprise Multi-School Book Allocation, Inventory Tracking & Financial Reconciliation Platform</p>
          <p className="text-[11px] text-slate-500">Supporting CBSE, ICSE, NCERT, and Private Publishing Curriculums</p>
        </div>
      </footer>
    </div>
  );
}
