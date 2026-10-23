import React, { useState } from 'react';
import { ERPProvider } from './context/ERPContext';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { GeneralLedgerView } from './views/GeneralLedgerView';
import { PurchasingMatchingView } from './views/PurchasingMatchingView';
import { InventoryPeriodicView } from './views/InventoryPeriodicView';
import { OperationsView } from './views/OperationsView';
import { AntiFakeRevenueView } from './views/AntiFakeRevenueView';
import { Modul1EngineView } from './views/Modul1EngineView';
import { Modul2SalesTaxView } from './views/Modul2SalesTaxView';
import { Modul4CashAdvanceBankingView } from './views/Modul4CashAdvanceBankingView';
import { ReportsView } from './views/ReportsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <ERPProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {/* Top Header conforming to Top Bar Contract */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'modul1' && <Modul1EngineView />}
          {activeTab === 'modul2' && <Modul2SalesTaxView />}
          {activeTab === 'purchasing' && <PurchasingMatchingView />}
          {activeTab === 'modul4' && <Modul4CashAdvanceBankingView />}
          {activeTab === 'gl' && <GeneralLedgerView />}
          {activeTab === 'inventory' && <InventoryPeriodicView />}
          {activeTab === 'operations' && <OperationsView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-500 text-xs py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              &copy; 2026 PT Sport Universal Indonesia (Padel Beans). All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span>Single GL: Active</span>
              <span aria-hidden="true">·</span>
              <span>Periodic HPP: Enforced</span>
              <span aria-hidden="true">·</span>
              <span>3-Way Match: 0% Qty Over-Bill</span>
            </div>
          </div>
        </footer>
      </div>
    </ERPProvider>
  );
}
