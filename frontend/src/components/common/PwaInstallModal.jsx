import React from 'react';
import { BookOpen, X, Monitor, Smartphone, ShieldAlert } from 'lucide-react';
import { APP_NAME } from '../../config/appConfig';

export default function PwaInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Install App</h3>
              <p className="text-[11px] text-slate-500">{APP_NAME} Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-2.5">
          {/* Desktop Instruction */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Monitor className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Desktop (Chrome / Edge)</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Click the <strong>Install</strong> icon in the address bar or browser menu (⋮).
              </span>
            </div>
          </div>

          {/* Mobile Instruction */}
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Mobile (Android / iPhone)</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Open browser menu and tap <strong>Add to Home Screen</strong>.
              </span>
            </div>
          </div>

          {/* HTTPS / Security Note */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block">Why no direct 1-click install?</span>
              <span className="text-amber-800 text-[10.5px] block mt-0.5">
                Browsers require a secure <strong>HTTPS (SSL)</strong> connection for 1-click install. On HTTP / Not Secure IP, please use the manual browser menu above.
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
