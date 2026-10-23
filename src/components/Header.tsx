import React from 'react';
import { useERP, UserRole } from '../context/ERPContext';
import { 
  Building2, 
  ShieldCheck, 
  Moon, 
  Sun, 
  RotateCcw, 
  UserCircle2,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { userRole, setUserRole, isDarkMode, toggleDarkMode, resetToDemoData, journals } = useERP();

  // Calculate GL balance verification
  const totalDebit = journals
    .filter(j => j.status === 'POSTED')
    .reduce((sum, j) => sum + j.totalDebit, 0);
  const totalCredit = journals
    .filter(j => j.status === 'POSTED')
    .reduce((sum, j) => sum + j.totalCredit, 0);
  const isGLBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'modul1', label: 'Modul 1: Dimensi & GL Core' },
    { id: 'modul2', label: 'Modul 2: Sales, Pajak & Turnamen' },
    { id: 'purchasing', label: 'Modul 3: P2P & 3-Way Match' },
    { id: 'modul4', label: 'Modul 4: Cash Advance & Bank' },
    { id: 'gl', label: 'Buku Besar (GL)' },
    { id: 'inventory', label: 'Modul 5: Stok & HPP Periodik' },
    { id: 'operations', label: 'Operasi Front-Office' },
    { id: 'reports', label: 'Laporan Keuangan & UAT Suite' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      {/* Top Bar Contract: Brand Zone (1 line) — Nav Links (single-line) — Primary Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              PT Sport Universal Indonesia
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Padel Beans Multi-Unit ERP · Single GL
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-300">
          {navLinks.map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`transition-colors whitespace-nowrap py-1.5 px-1 border-b-2 ${
                  isActive 
                    ? 'text-emerald-400 border-emerald-400 font-semibold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & User Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* GL Balance Trust Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono">
            {isGLBalanced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-medium">GL 100% Balanced</span>
              </>
            ) : (
              <span className="text-rose-400 font-medium">GL Unbalanced!</span>
            )}
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded px-2 py-1 text-xs">
            <UserCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              title="Ganti Peran Pengguna"
            >
              <option value="FINANCE_CONTROLLER" className="bg-slate-900 text-slate-200">Finance Controller (Approver)</option>
              <option value="OPERATIONS_CASHIER" className="bg-slate-900 text-slate-200">Kasir / Store Ops (Maker)</option>
              <option value="AUDITOR_COMMISSIONER" className="bg-slate-900 text-slate-200">Auditor & Komisaris</option>
            </select>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset semua data transaksi ke dataset demo awal?')) {
                resetToDemoData();
              }
            }}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset ke Dataset Demo Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Sub-Navigation Scrollable Strip */}
      <div className="xl:hidden border-t border-slate-800/80 px-4 py-2 flex items-center gap-3 overflow-x-auto text-xs">
        {navLinks.map(link => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`whitespace-nowrap px-3 py-1 rounded transition-colors ${
                isActive 
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
