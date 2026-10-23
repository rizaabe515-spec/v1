import React from 'react';
import { useERP } from '../context/ERPContext';
import { BUSINESS_UNITS, SHARED_COST_ALLOCATION_WEIGHTS, PHYSICAL_LOCATIONS } from '../constants/dimensions';
import { ACCOUNT_KEYS } from '../constants/coaData';
import { 
  TrendingUp, 
  Wallet, 
  Package, 
  ShieldCheck, 
  Layers, 
  ArrowUpRight, 
  AlertCircle,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { journals, stockItems, purchaseOrders, goodsReceipts, vendorBills, tournaments } = useERP();

  // 1. Calculate Liquid Bank & Cash Balances
  const liquidAccounts = [
    ACCOUNT_KEYS.CASH_PADEL,
    ACCOUNT_KEYS.CASH_BAR,
    ACCOUNT_KEYS.CASH_OPS,
    ACCOUNT_KEYS.BANK_MANDIRI,
    ACCOUNT_KEYS.BANK_BNI,
    ACCOUNT_KEYS.CASH_BENTENG
  ];

  let totalLiquidCash = 0;
  for (const jnl of journals) {
    if (jnl.status !== 'POSTED') continue;
    for (const line of jnl.lines) {
      if (liquidAccounts.includes(line.accountCode as any)) {
        totalLiquidCash += (line.debit - line.credit);
      }
    }
  }

  // 2. Net Revenue YTD (Sum of 4-xxxx accounts)
  let totalNetRevenue = 0;
  const revenueByUnit: Record<'U001' | 'U002' | 'U003', number> = { U001: 0, U002: 0, U003: 0 };

  for (const jnl of journals) {
    if (jnl.status !== 'POSTED') continue;
    for (const line of jnl.lines) {
      if (line.accountCode.startsWith('4-')) {
        const rev = (line.credit - line.debit);
        totalNetRevenue += rev;
        if (line.unitId === 'U001' || line.unitId === 'U002' || line.unitId === 'U003') {
          revenueByUnit[line.unitId] += rev;
        }
      }
    }
  }

  // 3. Shared Costs U009 (Operating Overheads in U009)
  let totalSharedCostsU009 = 0;
  for (const jnl of journals) {
    if (jnl.status !== 'POSTED') continue;
    for (const line of jnl.lines) {
      if (line.unitId === 'U009' && line.accountCode.startsWith('6-')) {
        totalSharedCostsU009 += (line.debit - line.credit);
      }
    }
  }

  // 4. Periodic Purchases in 5-1100
  let totalPurchases51100 = 0;
  for (const jnl of journals) {
    if (jnl.status !== 'POSTED') continue;
    for (const line of jnl.lines) {
      if (line.accountCode === ACCOUNT_KEYS.PURCHASE_PERIODIC) {
        totalPurchases51100 += (line.debit - line.credit);
      }
    }
  }

  // 5. Total Stock Subledger Value
  let totalInventorySubledgerValue = 0;
  for (const item of stockItems) {
    const totalQty = Object.values(item.stockByLocation).reduce((a, b) => a + b, 0);
    totalInventorySubledgerValue += totalQty * item.averageUnitCost;
  }

  // 6. 3-Way Matching Metrics
  const pendingGrs = goodsReceipts.filter(g => !g.isBilled).length;
  const heldBills = vendorBills.filter(b => b.matchingStatus === 'EXCEPTION_HOLD').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Hard Constraints Architecture Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Satu PT & Satu General Ledger (Single GL Engine)
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              PT Sport Universal Indonesia — Executive Financial Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Sistem ERP terintegrasi multi-unit (Padel Court, Resto Salatiga, Coffee Benteng) dengan penegakan mutlak metode HPP Periodik, 3-Way Matching tanpa toleransi over-billing, dan proteksi anti-omzet palsu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('gl')}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Single GL
            </button>
            <button
              onClick={() => setActiveTab('purchasing')}
              className="px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              3-Way Matcher
            </button>
          </div>
        </div>

        {/* 4 Hard Rules Compliance Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">Single GL & Dimensi</div>
            <div className="font-semibold text-emerald-400 mt-0.5">U001—U009 / L001—L005</div>
            <div className="text-[10px] text-slate-500 mt-1">100% Baris Jurnal Terdimensi</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">HPP Periodik (STK-06)</div>
            <div className="font-semibold text-emerald-400 mt-0.5">DISABLED (Kunci Periodik)</div>
            <div className="text-[10px] text-slate-500 mt-1">GL Resmi via STK-07 Bulanan</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">3-Way Match Toleransi</div>
            <div className="font-semibold text-emerald-400 mt-0.5">0% Qty Over-Billing</div>
            <div className="text-[10px] text-slate-500 mt-1">Harga ≤1% &amp; ≤Rp 50.000</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">Anti-Omzet Palsu</div>
            <div className="font-semibold text-emerald-400 mt-0.5">SAL-06 / CA-03 Terproteksi</div>
            <div className="text-[10px] text-slate-500 mt-1">Rp 0 Non-Revenue Bocor ke 4-xxxx</div>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Kas & Bank Liquid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Kas &amp; Bank Liquid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-2">
            Rp {totalLiquidCash.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Mandiri: Rp {(journals.filter(j=>j.status==='POSTED').flatMap(j=>j.lines).filter(l=>l.accountCode===ACCOUNT_KEYS.BANK_MANDIRI).reduce((s,l)=>s+(l.debit-l.credit),0)).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Metric 2: Net Revenue YTD */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Omzet Bersih Diakui</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-2">
            Rp {totalNetRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Padel + F&amp;B + Event Closing</span>
          </div>
        </div>

        {/* Metric 3: Pembelian Persediaan Periodik (5-1100) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pembelian Periodik (5-1100)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-2">
            Rp {totalPurchases51100.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span>GR-01 Akumulasi (Ditutup saat STK-07)</span>
          </div>
        </div>

        {/* Metric 4: Valuasi Stok Subledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Subledger Persediaan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-2">
            Rp {totalInventorySubledgerValue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span>Weighted Average di 5 Lokasi L001—L005</span>
          </div>
        </div>
      </div>

      {/* Multi-Unit P&L Matrix with Report-Only U009 Overhead Allocation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              Matriks Kontribusi Unit Bisnis &amp; Alokasi Biaya Bersama (U009)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Alokasi Overhead Bersama (U009: Rp {totalSharedCostsU009.toLocaleString('id-ID')}) bersifat <strong className="text-slate-200">Report-Only</strong> tanpa menduplikasi jurnal GL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Skema: 40% U001 · 35% U002 · 25% U003</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Komponen Finansial</th>
                <th className="py-2.5 px-3">U001 Padel Court &amp; Event</th>
                <th className="py-2.5 px-3">U002 Coffee &amp; Resto Salatiga</th>
                <th className="py-2.5 px-3">U003 Coffee Benteng</th>
                <th className="py-2.5 px-3 font-semibold text-slate-200">Total Konsolidasi PT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {/* Row 1: Pendapatan Bruto */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-sans font-medium text-slate-300">Pendapatan Usaha (4-xxxx)</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Rp {revenueByUnit.U001.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Rp {revenueByUnit.U002.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Rp {revenueByUnit.U003.toLocaleString('id-ID')}</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">Rp {totalNetRevenue.toLocaleString('id-ID')}</td>
              </tr>

              {/* Row 2: Estimasi HPP Periodik (31.5% F&B, 15% Padel balls/maintenance) */}
              <tr className="hover:bg-slate-800/30 text-slate-400">
                <td className="py-3 px-3 font-sans">
                  Estimasi HPP Operasional
                  <span className="block text-[10px] text-slate-500 font-sans">Non-GL estimation metric</span>
                </td>
                <td className="py-3 px-3 text-rose-400">
                  (Rp {Math.round(revenueByUnit.U001 * 0.15).toLocaleString('id-ID')})
                </td>
                <td className="py-3 px-3 text-rose-400">
                  (Rp {Math.round(revenueByUnit.U002 * 0.32).toLocaleString('id-ID')})
                </td>
                <td className="py-3 px-3 text-rose-400">
                  (Rp {Math.round(revenueByUnit.U003 * 0.30).toLocaleString('id-ID')})
                </td>
                <td className="py-3 px-3 text-rose-400 font-semibold">
                  (Rp {Math.round(revenueByUnit.U001 * 0.15 + revenueByUnit.U002 * 0.32 + revenueByUnit.U003 * 0.30).toLocaleString('id-ID')})
                </td>
              </tr>

              {/* Row 3: Alokasi Shared Cost U009 (Report-Only) */}
              <tr className="hover:bg-slate-800/30 text-amber-400 bg-amber-500/5">
                <td className="py-3 px-3 font-sans font-medium">
                  Alokasi Overhead Bersama U009
                  <span className="block text-[10px] text-amber-500/80 font-sans">Report-Only Distribution</span>
                </td>
                <td className="py-3 px-3">
                  (Rp {Math.round(totalSharedCostsU009 * SHARED_COST_ALLOCATION_WEIGHTS.U001).toLocaleString('id-ID')})
                  <span className="text-[10px] text-slate-500 block font-sans">Bobot 40%</span>
                </td>
                <td className="py-3 px-3">
                  (Rp {Math.round(totalSharedCostsU009 * SHARED_COST_ALLOCATION_WEIGHTS.U002).toLocaleString('id-ID')})
                  <span className="text-[10px] text-slate-500 block font-sans">Bobot 35%</span>
                </td>
                <td className="py-3 px-3">
                  (Rp {Math.round(totalSharedCostsU009 * SHARED_COST_ALLOCATION_WEIGHTS.U003).toLocaleString('id-ID')})
                  <span className="text-[10px] text-slate-500 block font-sans">Bobot 25%</span>
                </td>
                <td className="py-3 px-3 font-semibold">
                  (Rp {totalSharedCostsU009.toLocaleString('id-ID')})
                  <span className="text-[10px] text-slate-500 block font-sans">100% Dialokasikan</span>
                </td>
              </tr>

              {/* Row 4: Net Margin Unit */}
              {(() => {
                const marginU001 = revenueByUnit.U001 - (revenueByUnit.U001 * 0.15) - (totalSharedCostsU009 * 0.40);
                const marginU002 = revenueByUnit.U002 - (revenueByUnit.U002 * 0.32) - (totalSharedCostsU009 * 0.35);
                const marginU003 = revenueByUnit.U003 - (revenueByUnit.U003 * 0.30) - (totalSharedCostsU009 * 0.25);
                const totalMargin = marginU001 + marginU002 + marginU003;

                return (
                  <tr className="bg-slate-950 font-bold border-t-2 border-slate-700">
                    <td className="py-3.5 px-3 font-sans text-white">Laba Kontribusi Bersih Unit</td>
                    <td className="py-3.5 px-3 text-emerald-400">Rp {Math.round(marginU001).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-3 text-emerald-400">Rp {Math.round(marginU002).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-3 text-emerald-400">Rp {Math.round(marginU003).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-3 text-emerald-300 text-sm">Rp {Math.round(totalMargin).toLocaleString('id-ID')}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: 3-Way Match & Deferred Tournament Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: 3-Way Matching Queue & Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Status 3-Way Matching (PO - GR - Bill)</h3>
            </div>
            <button
              onClick={() => setActiveTab('purchasing')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Kelola Purchasing &rarr;
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <div className="font-medium text-slate-200">Goods Receipt Belum Tertagih (Unbilled GR)</div>
                <div className="text-slate-400 text-[11px]">Akun 2-1104 (GRNI) aktif menunggu faktur vendor</div>
              </div>
              <span className="font-mono font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                {pendingGrs} GR Terbuka
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <div className="font-medium text-slate-200">Invoice Vendor Berstatus HOLD</div>
                <div className="text-slate-400 text-[11px]">Selisih harga &gt;1% atau over-billing qty &gt; GR</div>
              </div>
              <span className={`font-mono font-semibold px-2 py-0.5 rounded ${
                heldBills > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'
              }`}>
                {heldBills} Exception Hold
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Toleransi Sistem:</strong> Auto-pass diizinkan jika selisih harga neto &le; 1% DAN &le; Rp 50.000 per baris secara kumulatif. Over-billing kuantitas 0% tolerance.
            </div>
          </div>
        </div>

        {/* Box 2: Turnamen Lintas Bulan & Proteksi Uang Muka */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Turnamen Lintas Bulan &amp; Liabilitas 2-1301</h3>
            </div>
            <button
              onClick={() => setActiveTab('operations')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Lihat Turnamen &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">{t.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {t.startDate} s/d {t.endDate} · {t.totalRegisteredParticipants} Peserta
                  </div>
                </div>

                <div className="text-right">
                  {t.status === 'SETTLED' ? (
                    <div>
                      <span className="text-[10px] text-emerald-400 font-medium">SAL-07 Settled</span>
                      <div className="font-mono font-bold text-slate-200">Rp {t.netRevenue.toLocaleString('id-ID')}</div>
                      <div className="text-[10px] text-slate-500">Refund: Rp {t.totalRefunds.toLocaleString('id-ID')}</div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-amber-400 font-medium">Di Akun 2-1301 (Bukan Omzet)</span>
                      <div className="font-mono font-bold text-amber-300">Rp {t.totalCollectedPrepayment.toLocaleString('id-ID')}</div>
                      <div className="text-[10px] text-slate-500">Menunggu Event Selesai</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
