import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  School,
  BookOpen,
  Users,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { schoolsAPI, itemsAPI, studentsAPI } from '../../services/api';

// Executive dashboard displaying real-time metrics and financial overview
export default function DashboardOverview({ onNavigate }) {
  // Query schools data for registered school count
  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await schoolsAPI.getAll();
      return res.data || [];
    }
  });

  // Query items data for stock valuation and total items count
  const { data: itemsData } = useQuery({
    queryKey: ['items', 'dashboard'],
    queryFn: async () => {
      const res = await itemsAPI.getAll({});
      return res.data || [];
    }
  });

  // Query student roster for financial collection calculations
  const { data: rosterData } = useQuery({
    queryKey: ['students-roster', 1, 1, 1, ''],
    queryFn: async () => {
      const res = await studentsAPI.getRoster({ school_id: 1, class_id: 1, section_id: 1 });
      return res.data || null;
    }
  });

  const schools = schoolsData || [];
  const items = itemsData || [];

  // Calculate warehouse stock and valuation totals
  const totalStock = items.reduce((acc, it) => acc + (parseInt(it.stock_qty) || 0), 0);
  const totalValuation = items.reduce((acc, it) => acc + ((parseInt(it.stock_qty) || 0) * (parseFloat(it.price) || 0)), 0);

  // Section level financial summary fallback
  const finSummary = rosterData?.section_financial_summary || {
    total_students_in_roster: 0,
    grand_total_payment: 0,
    grand_concession_given: 0,
    grand_net_payable: 0,
    grand_paid_collected: 0,
    grand_due_balance: 0,
    collection_rate: '0%'
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 skew-x-12" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to India Book House Portal
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Manage school profiles, dispatch tracking, Class 1-12 NCERT curriculum kits, and student fee checklists from one unified console.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Schools</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-3">{schools.length}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Affiliations:</span> CBSE & ICSE
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Items</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-3">{items.length} Items</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{totalStock}</span> units in warehouse
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-3">
            ₹{totalValuation.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Based on current unit prices</div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master Data</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-3">7 Masters</div>
          <div className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deletion Guard Enabled
          </div>
        </div>
      </div>

      {/* Two Column Layout: Financial Summary & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Section Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Class 1 (Section A) Collection Report</h3>
              <p className="text-xs text-slate-500">Live reconciliation of kit fees, concessions and dues</p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Checklist</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Gross Kit Amount</div>
              <div className="text-lg font-bold text-slate-900 mt-1">₹{finSummary.grand_total_payment}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Concession</div>
              <div className="text-lg font-bold text-amber-600 mt-1">₹{finSummary.grand_concession_given}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">Total Collected</div>
              <div className="text-lg font-bold text-emerald-700 mt-1">₹{finSummary.grand_paid_collected}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-100">
              <div className="text-[11px] font-semibold text-red-700 uppercase">Outstanding Due</div>
              <div className="text-lg font-bold text-red-700 mt-1">₹{finSummary.grand_due_balance}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Section Fee Collection Rate</span>
              <span className="font-bold text-blue-600">{finSummary.collection_rate}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: finSummary.collection_rate || '78%' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Cards */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Jump directly to your task</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('schools')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left transition text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Manage School Profiles & Reports</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('students')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left transition text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Student Rosters & Checklist</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('books')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left transition text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Manage Books & Excel Upload</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('masters-all')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left transition text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Configure 7 Master Tables</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
